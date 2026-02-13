-- 1. Users Table
CREATE TABLE users (
    _id VARCHAR(255) PRIMARY KEY, -- Keeping _id to match your code
    user_name VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Chats Table
CREATE TABLE chats (
    _id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chat Participants (Handles the 'users' array in Chat schema)
-- This allows multiple users to be associated with one chat
CREATE TABLE chat_participants (
    chat_id VARCHAR(255) REFERENCES chats(_id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(_id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, user_id)
);

-- 4. Messages Table
CREATE TABLE messages (
    _id VARCHAR(255) PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL REFERENCES chats(_id) ON DELETE CASCADE,
    sender_id VARCHAR(255) NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
    sender_username VARCHAR(255) NOT NULL, -- Denormalized column as requested
    receiver_id VARCHAR(255) NOT NULL REFERENCES users(_id) ON DELETE CASCADE, -- Fixed spelling from 'reciever'
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Message Read Receipts (Handles the 'readBy' array in Message schema)
-- This tracks which users have read which message
CREATE TABLE message_read_status (
    message_id VARCHAR(255) REFERENCES messages(_id) ON DELETE CASCADE,
    user_id VARCHAR(255) REFERENCES users(_id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);