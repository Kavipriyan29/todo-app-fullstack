# 🚀 Full-Stack Todo App - Setup Instructions

## 📋 **Prerequisites**

Before running the application, make sure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - Choose one option:
  - **Local MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
  - **MongoDB Atlas** (Cloud) - [Sign up here](https://www.mongodb.com/atlas)

## 🛠️ **Installation Steps**

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Database Setup**

#### Option A: Local MongoDB
1. Install and start MongoDB locally
2. MongoDB will run on `mongodb://localhost:27017/todoapp` by default

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `.env` file with your Atlas connection string

### 3. **Environment Configuration**
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
2. Update the `.env` file with your settings:
   ```env
   MONGODB_URI=mongodb://localhost:27017/todoapp
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000
   ```

### 4. **Start the Application**

#### Development Mode (with auto-restart):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

## 🌐 **Accessing the Application**

Once the server is running:

- **Main App**: http://localhost:3000
- **Login Page**: http://localhost:3000/login.html
- **Signup Page**: http://localhost:3000/signup.html
- **API Health Check**: http://localhost:3000/api/health

## 🔐 **First Time Setup**

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Click "Sign up here" to create your first account
4. Fill in your details and create an account
5. You'll be automatically logged in and redirected to the main app

## 📱 **Features Available**

### ✅ **Authentication**
- User registration and login
- JWT-based authentication
- Secure password hashing
- User profile management

### ✅ **Todo Management**
- Create, read, update, delete todos
- Priority levels (high, medium, low)
- Daily recurring tasks
- Reminder notifications
- Todo categories and notes

### ✅ **User Interface**
- Beautiful responsive design
- Dark/Light mode toggle
- Mobile-optimized interface
- Real-time statistics
- Monthly planner view

### ✅ **Data Persistence**
- All data stored in MongoDB
- User-specific todos
- Preference synchronization
- Secure data isolation

## 🔧 **API Endpoints**

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Todos
- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `PATCH /api/todos/:id/toggle` - Toggle completion

### User Preferences
- `GET /api/users/preferences` - Get preferences
- `PUT /api/users/preferences` - Update preferences

## 🐛 **Troubleshooting**

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# If using Atlas, verify your connection string
# Make sure to replace <password> with your actual password
```

### Port Already in Use
```bash
# Change the PORT in .env file
PORT=3001
```

### Permission Errors
```bash
# Run with administrator privileges or use:
npm install --unsafe-perm
```

## 🚀 **Deployment Options**

### **Heroku Deployment**
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect to MongoDB Atlas
4. Deploy using Git

### **Vercel/Netlify Deployment**
1. Build the frontend
2. Deploy backend separately (Railway, Render, etc.)
3. Update API endpoints in frontend

### **Docker Deployment**
```dockerfile
# Dockerfile example
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 **Project Structure**

```
TODO/
├── public/                 # Frontend files
│   ├── index.html         # Main app
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   └── assets/
│       └── app-api.js     # Frontend JavaScript
├── models/                # Database models
│   ├── User.js           # User model
│   └── Todo.js           # Todo model
├── routes/               # API routes
│   ├── auth.js          # Authentication routes
│   ├── todos.js         # Todo routes
│   └── users.js         # User routes
├── middleware/          # Custom middleware
│   └── auth.js         # Authentication middleware
├── server.js           # Main server file
├── package.json        # Dependencies
└── .env               # Environment variables
```

## 🎯 **Next Steps**

After setup, you can:

1. **Customize the UI** - Modify CSS in `public/index.html`
2. **Add Features** - Extend API routes and frontend
3. **Deploy** - Choose your preferred hosting platform
4. **Scale** - Add caching, load balancing, etc.

## 🆘 **Support**

If you encounter any issues:

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running and accessible
4. Check network connectivity for Atlas users

---

**🎉 Congratulations! Your full-stack Todo app is ready to use!**

The application now includes:
- ✅ Complete user authentication
- ✅ Secure API backend
- ✅ Beautiful responsive frontend
- ✅ Database persistence
- ✅ Real-time features
- ✅ Mobile optimization

Happy organizing! 📝✨
