# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-02-19

### Fixed

#### Backend
- **WebSocket / IO Controller (`src/features/io/io.controller.js`)**:
    - Fixed event name mismatch: changed `'chat message'` to `'chat_message'` when emitting history to match client listener.
    - Updated `user_connected` broadcast and `chat_message` handler to use persistent `socket.user_id` (database UUID) instead of transient `socket.id`.
    - Fixed chat history sorting logic by removing incorrect `.sort()` call on array of objects.
- **Chat Service (`src/features/chat/chat.service.js`)**:
    - Fixed database query result handling by correctly destructuring `{ rows }` from `pool.query`.
    - Fixed `fetchHistory` SQL query: removed restrictive `JOIN` with `messages_read_status` that prevented messages from loading, and added `ORDER BY created_at DESC`.
    - Fixed `fetchChat` to return the actual chat object instead of a boolean.
    - Fixed `newMessage` to return the correct `chat_id` property instead of undefined `room`.
- **User Controller (`src/features/users/user.controller.js`)**:
    - Fixed session property access in `users` method: changed `userData.id` to `userData.user_id`.

#### Frontend (`views/chat.ejs`)
- **Logic & State**:
    - Updated `activeRoom` generation logic to match server-side deterministic ID generation: `[sender, receiver].sort().join('')`.
    - Fixed `socket.emit('chat_message')` payload to send `chat_id` instead of `room`.
- **User Interface**:
    - Updated property access: changed `userData.id` to `userData.user_id` and `u.id` to `u._id`.
    - Added duplicate check in `user_connected` event listener to prevent duplicate entries in the user list.
