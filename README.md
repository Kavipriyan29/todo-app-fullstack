# Todo App Fullstack

A full-stack todo application built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🌐 Live Demo

**🚀 [View Live Application](https://todo-app-fullstack-plum.vercel.app/)**

## 📁 Repository

**📂 [GitHub Repository](https://github.com/Kavipriyan29/todo-app-fullstack)**

## Features

- ✅ **Todo Management**: Add, complete, delete tasks with priority levels
- 🔐 **User Authentication**: Secure login and registration system
- 👥 **Multi-user Support**: Each user has their own todo lists
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔒 **Secure API**: JWT-based authentication and protected routes
- 📊 **RESTful API**: Well-structured backend with Express.js
- 🗄️ **MongoDB Integration**: Persistent data storage

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB connection string
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kavipriyan29/todo-app-fullstack.git
   cd todo-app-fullstack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your MongoDB connection string and JWT secret.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` or the port specified in your environment.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Todos
- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo

## File Structure

```
TODO/
├── server-simple.js              # Main server file
├── server.js                     # Full server with advanced features
├── package.json                  # Dependencies and scripts
├── vercel.json                   # Vercel deployment config
├── netlify.toml                  # Netlify deployment config
├── Procfile                      # Heroku deployment config
├── .env.example                  # Environment variables template
├── public/                       # Static files
│   ├── index.html               # Frontend HTML
│   ├── styles.css               # Stylesheet
│   └── script.js                # Frontend JavaScript
├── assets/                      # Client-side assets
│   └── app.js                   # Main application logic
└── README.md                    # This file
```

## Deployment

The application is configured for multiple deployment platforms:

### Vercel (Current Live Deployment)
The app is currently deployed on Vercel at: **https://todo-app-fullstack-plum.vercel.app/**

### Other Deployment Options
- **Heroku**: Use the included `Procfile`
- **Netlify**: Frontend can be deployed separately using `netlify.toml`
- **Railway/Vercel**: Full-stack deployment supported

## Environment Variables

Create a `.env` file with:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
NODE_ENV=development
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: bcryptjs, helmet, cors, express-rate-limit
- **Deployment**: Vercel, Heroku, Netlify compatible

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by [Kavipriyan29](https://github.com/Kavipriyan29)**
