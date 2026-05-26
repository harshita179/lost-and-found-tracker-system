# Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB running (local or MongoDB Atlas URI)

### Step 1: Backend Setup (2 minutes)
```bash
cd backend
npm install
# Backend is now ready on port 5000
```

### Step 2: Configure Database
Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lostfound
JWT_SECRET=your-secret-key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

For **MongoDB Atlas** (cloud):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lostfound
```

For **real SMS delivery**, configure either:
```env
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

or

```env
FAST2SMS_API_KEY=your_fast2sms_api_key
```

If these values are missing, item matching will work but no real SMS will be sent.

### Step 3: Start Backend
```bash
npm start      # or: npm run dev (with auto-reload)
```
✅ Backend running on `http://localhost:5000`

### Step 4: Frontend Setup (In new terminal)
```bash
cd frontend
npm install
npm start
```
✅ Frontend running on `http://localhost:3000`

### Step 5: Use the App
1. Go to `http://localhost:3000`
2. Click **Sign Up** or use existing account
3. Fill the form and create account
4. Start reporting and viewing lost items!

## 📱 Default Test Credentials
After signup, use same credentials to login:
- Username: `testuser`
- Password: `password123`

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Use different port
set PORT=5001 && npm start
```

**MongoDB not connecting?**
- Ensure MongoDB is running: `mongod`
- Or update MONGODB_URI to MongoDB Atlas URL

**Module not found?**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📚 Features
- ✅ Register & Login
- ✅ Report Lost/Found Items
- ✅ Browse All Items
- ✅ Filter by Type
- ✅ Mark Items as Found
- ✅ Delete Reports

## 🚀 Deploy
See [SETUP_GUIDE.md](SETUP_GUIDE.md) for production deployment.

---
**Ready?** Start the backend, then start the frontend! 🎉
