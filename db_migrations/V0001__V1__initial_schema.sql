
CREATE TABLE t_p18226102_bear_messenger_app.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#A855F7',
  status VARCHAR(20) DEFAULT 'offline',
  bio TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p18226102_bear_messenger_app.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p18226102_bear_messenger_app.users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE t_p18226102_bear_messenger_app.messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES t_p18226102_bear_messenger_app.users(id),
  receiver_id INTEGER REFERENCES t_p18226102_bear_messenger_app.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE t_p18226102_bear_messenger_app.message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES t_p18226102_bear_messenger_app.messages(id),
  user_id INTEGER REFERENCES t_p18226102_bear_messenger_app.users(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
