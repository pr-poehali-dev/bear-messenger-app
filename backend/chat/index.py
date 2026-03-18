"""Сообщения, контакты и реакции для MishkaChat."""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p18226102_bear_messenger_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_from_token(token: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.display_name, u.username, u.avatar_color FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON s.user_id=u.id WHERE s.token=%s AND s.expires_at > NOW()",
        (token,)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    auth = event.get("headers", {}).get("X-Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    user = get_user_from_token(token) if token else None
    if not user:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

    user_id = user[0]

    # --- GET CONTACTS ---
    if path.endswith("/contacts") and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, display_name, username, avatar_color, status, last_seen FROM {SCHEMA}.users WHERE id != %s ORDER BY display_name",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        contacts = [{"id": r[0], "display_name": r[1], "username": r[2], "avatar_color": r[3], "status": r[4], "last_seen": r[5].isoformat() if r[5] else None} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"contacts": contacts})}

    # --- GET MESSAGES with contact ---
    if path.endswith("/messages") and method == "GET":
        qs = event.get("queryStringParameters") or {}
        contact_id = qs.get("contact_id")
        if not contact_id:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "contact_id required"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT m.id, m.sender_id, m.text, m.created_at, m.is_read, "
            f"COALESCE(json_agg(json_build_object('emoji', r.emoji, 'user_id', r.user_id)) FILTER (WHERE r.id IS NOT NULL), '[]') as reactions "
            f"FROM {SCHEMA}.messages m "
            f"LEFT JOIN {SCHEMA}.message_reactions r ON r.message_id = m.id "
            f"WHERE (m.sender_id=%s AND m.receiver_id=%s) OR (m.sender_id=%s AND m.receiver_id=%s) "
            f"GROUP BY m.id, m.sender_id, m.text, m.created_at, m.is_read "
            f"ORDER BY m.created_at ASC",
            (user_id, int(contact_id), int(contact_id), user_id)
        )
        rows = cur.fetchall()
        # Mark as read
        cur.execute(
            f"UPDATE {SCHEMA}.messages SET is_read=TRUE WHERE sender_id=%s AND receiver_id=%s AND is_read=FALSE",
            (int(contact_id), user_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        messages = [{"id": r[0], "sender_id": r[1], "own": r[1] == user_id, "text": r[2], "time": r[3].strftime("%H:%M"), "is_read": r[4], "reactions": r[5] if isinstance(r[5], list) else json.loads(r[5])} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}

    # --- SEND MESSAGE ---
    if path.endswith("/send") and method == "POST":
        receiver_id = body.get("receiver_id")
        text = (body.get("text") or "").strip()
        if not receiver_id or not text:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "receiver_id и text обязательны"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (sender_id, receiver_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (user_id, int(receiver_id), text)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": row[0], "time": row[1].strftime("%H:%M"), "own": True, "text": text, "reactions": []})}

    # --- ADD / REMOVE REACTION ---
    if path.endswith("/react") and method == "POST":
        message_id = body.get("message_id")
        emoji = body.get("emoji")
        if not message_id or not emoji:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "message_id и emoji обязательны"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.message_reactions WHERE message_id=%s AND user_id=%s AND emoji=%s", (int(message_id), user_id, emoji))
        existing = cur.fetchone()
        if existing:
            cur.execute(f"DELETE FROM {SCHEMA}.message_reactions WHERE id=%s", (existing[0],))
            action = "removed"
        else:
            cur.execute(f"INSERT INTO {SCHEMA}.message_reactions (message_id, user_id, emoji) VALUES (%s, %s, %s)", (int(message_id), user_id, emoji))
            action = "added"
        conn.commit()

        cur.execute(
            f"SELECT emoji, user_id FROM {SCHEMA}.message_reactions WHERE message_id=%s",
            (int(message_id),)
        )
        reactions = [{"emoji": r[0], "user_id": r[1]} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"action": action, "reactions": reactions})}

    # --- UNREAD COUNTS ---
    if path.endswith("/unread") and method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT sender_id, COUNT(*) FROM {SCHEMA}.messages WHERE receiver_id=%s AND is_read=FALSE GROUP BY sender_id",
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"unread": {str(r[0]): r[1] for r in rows}})}

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
