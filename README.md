# Real-Time Chat Application

A real-time chat application built with Node.js, Express, and Socket.IO. This application allows users to register, log in, and chat with other online users in real time.

## Features

* **User Authentication**: Secure user registration and login system.
* **Real-Time Messaging**: Instant messaging between users powered by WebSockets.
* **Private Rooms**: Dynamically created chat rooms for private conversations between two users.
* **Online User List**: View a list of all currently online users.
* **Message Persistence**: Chat messages are saved and restored, so you never lose a conversation.
* **Modern UI**: A clean and responsive user interface inspired by WhatsApp.

### Future Features

* Broadcast Messaging
* User Roles and Permissions

## Technologies Used

* **Backend**: Node.js, Express.js
* **Real-time Communication**: Socket.IO
* **Database**: `db-local` for local JSON-based database.
* **Authentication**: JSON Web Tokens (JWT)
* **Frontend**: EJS (Embedded JavaScript templates) for server-side rendering.
* **Styling**: Plain CSS with a modern design.
* **Linting**: ESLint with Standard JS style guide.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/franballerio/real_time_chat.git](https://github.com/franballerio/real_time_chat.git)
    cd real_time_chat
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
    or
    ```bash
    pnpm install
    ```
3.  Create a `.env` file in the root of the project and add the following environment variables:
    ```
    PORT=8080
    SALT_ROUNDS=10
    JWT_SECRET=your_jwt_secret
    ```

### Running the Application

* **Development Mode** (with hot-reloading):
    ```bash
    npm run dev
    ```
* **Production Mode**:
    ```bash
    npm run app
    ```

The application will be available at `http://localhost:8080`.

## Project Structure
.
├── controllers/
│   ├── httpController.js   # Handles HTTP requests
│   └── ioController.js       # Handles Socket.IO events
├── db/                     # Local JSON database files
├── middlewares/
│   └── JWT.js              # JWT authentication middleware
├── models/
│   ├── localDB.js          # Local database logic
│   └── sqlDB.js            # (In-progress) SQL database logic
├── routes/
│   └── httpRouter.js       # Defines HTTP routes
├── schemas/                # Zod schemas for validation
├── views/
│   ├── chat.ejs            # Main chat page
│   └── index.ejs           # Login/Register page
├── app.js                  # Express application setup
├── whatsapp.js             # Main application entry point
└── package.json            # Project dependencies and scripts

## API Endpoints

| Method   | Endpoint    | Description                     |
| :------- | :---------- | :------------------------------ |
| `POST`   | `/register` | Register a new user.            |
| `POST`   | `/login`    | Log in an existing user.        |
| `POST`   | `/logout`   | Log out the current user.       |
| `GET`    | `/users`    | Get a list of all users.        |
| `DELETE` | `/clear`    | Clear all users from the database. |

## Real-time Events (Socket.IO)

| Event Name     | Description                                                         |
| :------------- | :------------------------------------------------------------------ |
| `connection`   | A new client connects to the server.                                |
| `users`        | Sent to a newly connected client with the list of online users.     |
| `joinRoom`     | A client requests to join a private chat room.                      |
| `chat message` | A client sends a message to a room.                                 |
| `disconnect`   | A client disconnects from the server.                               |

## Author

* **Francisco Ballerio** - [franballerio](https://github.com/franballerio)

## License

This project is licensed under the ISC License.