# Lost & Found Application - Complete Setup Guide

## Project Overview
A full-stack lost and found management application for Medipacs University built with React frontend and Node.js/Express backend with MongoDB.

## Features Implemented

### Backend Features
✅ User authentication with JWT
✅ User registration and login
✅ Complete CRUD operations for items (Create, Read, Update, Delete)
✅ Item filtering by type (lost/found) and status
✅ Mark items as found functionality
✅ Password hashing with bcrypt
✅ Protected routes with JWT middleware
✅ MongoDB integration

### Frontend Features
✅ React Router-based navigation
✅ Login and Signup pages
✅ Protected dashboard routes
✅ Item listing with filtering
✅ Item creation form
✅ Item deletion
✅ Mark item as found functionality
✅ Token-based authentication
✅ Persistent login state (localStorage)
✅ Responsive design

## Installation & Setup

### Prerequisites
- Node.js (v14+ recommended)
- MongoDB (local or cloud - MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env with your values**
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/lostfound
   JWT_SECRET=your-secret-key-here
   ```

5. **Start the server**
   ```bash
   npm run dev    # with nodemon (recommended for development)
   # or
   npm start      # regular node
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login user (returns JWT token)

### Item Routes (`/items`)
- `GET /items` - Get all items (supports filtering with query params)
- `GET /items?itemType=lost` - Get lost items
- `GET /items?itemType=found` - Get found items
- `GET /items/:id` - Get single item by ID
- `POST /items` - Create new item (requires authentication)
- `PATCH /items/:id` - Update item (requires authentication)
- `DELETE /items/:id` - Delete item (requires authentication)
- `PATCH /items/:id/mark-found` - Mark item as found

## Technologies Used

### Frontend
- React 19.2.4
- React Router DOM 6.20.0
- CSS3 with responsive design
- Fetch API for HTTP requests
- LocalStorage for session management

### Backend
- Express.js 4.18.2
- MongoDB & Mongoose 7.3.4
- JWT (jsonwebtoken) for authentication
- Bcrypt for password hashing
- CORS for cross-origin requests
- Dotenv for environment variables

## Project Structure

```
Lost and Found New/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js
│   │   │   ├── ItemList.js
│   │   │   ├── ItemForm.js
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   └── SignupPage.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── backend/
    ├── models/
    │   ├── User.js
    │   └── Item.js
    ├── routes/
    │   ├── auth.js
    │   └── items.js
    ├── middleware/
    │   └── auth.js
    ├── server.js
    ├── package.json
    └── .env.example
```

## Usage Instructions

### Creating an Account
1. Click "Sign Up" on the login page
2. Enter username, email, and password
3. Account will be created and you'll be logged in automatically

### Logging In
1. Enter your credentials on the login page
2. Click "Login"
3. You'll be redirected to the dashboard

### Reporting a Lost/Found Item
1. Navigate to "Report Item" tab in dashboard
2. Fill in the form with:
   - Item title
   - Type (Lost/Found)
   - Category
   - Location
   - Description
   - Date
3. Click "Report Item"

### Browsing Items
1. Click "Browse Items" in dashboard
2. Filter by item type (All/Lost/Found)
3. View item details
4. Mark as found or delete items you reported

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or MongoDB Atlas is accessible
- Check MONGODB_URI in .env file

### CORS Error
- Ensure both frontend and backend are running
- Check that backend is on port 5000
- Frontend should be on port 3000

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Set PORT environment variable before starting

### Authentication Issues
- Ensure JWT_SECRET is set in .env
- Check that token is being saved in localStorage
- Clear browser cache and try again

## Security Notes
- Never commit .env files to version control
- Use strong JWT_SECRET in production
- Implement rate limiting for production
- Use HTTPS in production
- Validate all input on both frontend and backend

## Future Enhancements
- Email verification for signup
- Image upload for items
- User profile management
- Advanced search and filtering
- Email notifications when items are found
- Admin dashboard
- Item status tracking
- Comments/messages system for item recovery

## Testing
Run tests with:
```bash
npm test
```

## Deployment

### Backend Deployment (Heroku example)
1. Create Heroku account and app
2. Set environment variables in Heroku dashboard
3. Deploy: `git push heroku main`

### Frontend Deployment (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy build folder to your hosting

## License
MIT License

## Support
For issues or questions, please create an issue in the repository or contact the development team.
