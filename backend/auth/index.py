"""Регистрация, вход, выход и проверка сессии для MishkaChat."""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p18226102_bear_messenger_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

COLORS = ["#4FACFE", "#A855F7", "#EC4899", "#22C55E", "#F59E0B", "#FF6B35", "#06B6D4", "#EF4444"]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # --- REGISTER ---
    if path.endswith("/register") and method == "POST":
        username = (body.get("username") or "").strip()
        display_name = (body.get("display_name") or "").strip()
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not all([username, display_name, email, password]):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

        import random
        color = random.choice(COLORS)
        pw_hash = hash_password(password)
        token = secrets.token_hex(32)

        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, display_name, email, password_hash, avatar_color, status) "
                f"VALUES (%s, %s, %s, %s, %s, 'online') RETURNING id, display_name, username, avatar_color",
                (username, display_name, email, pw_hash, color)
            )
            user = cur.fetchone()
            user_id = user[0]
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)",
                (user_id, token)
            )
            conn.commit()
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Пользователь уже существует"})}
        finally:
            cur.close()
            conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "token": token,
                "user": {"id": user_id, "display_name": user[1], "username": user[2], "avatar_color": user[3]}
            })
        }

    # --- LOGIN ---
    if path.endswith("/login") and method == "POST":
        login = (body.get("login") or "").strip().lower()
        password = body.get("password") or ""

        if not login or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите логин и пароль"})}

        pw_hash = hash_password(password)
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, display_name, username, avatar_color FROM {SCHEMA}.users "
            f"WHERE (email=%s OR username=%s) AND password_hash=%s",
            (login, login, pw_hash)
        )
        user = cur.fetchone()
        if not user:
            cur.close()
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный логин или пароль"})}

        token = secrets.token_hex(32)
        user_id = user[0]
        cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
        cur.execute(f"UPDATE {SCHEMA}.users SET status='online', last_seen=NOW() WHERE id=%s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "token": token,
                "user": {"id": user_id, "display_name": user[1], "username": user[2], "avatar_color": user[3]}
            })
        }

    # --- ME (check session) ---
    if path.endswith("/me") and method == "GET":
        auth = event.get("headers", {}).get("X-Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет токена"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.display_name, u.username, u.avatar_color, u.status, u.bio "
            f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id=u.id "
            f"WHERE s.token=%s AND s.expires_at > NOW()",
            (token,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Сессия истекла"})}

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"user": {"id": user[0], "display_name": user[1], "username": user[2], "avatar_color": user[3], "status": user[4], "bio": user[5]}})
        }

    # --- LOGOUT ---
    if path.endswith("/logout") and method == "POST":
        auth = event.get("headers", {}).get("X-Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at=NOW() WHERE token=%s", (token,))
            cur.execute(
                f"UPDATE {SCHEMA}.users SET status='offline', last_seen=NOW() "
                f"WHERE id=(SELECT user_id FROM {SCHEMA}.sessions WHERE token=%s)", (token,)
            )
            conn.commit()
            cur.close()
            conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
