# Deployment Guide

This guide will help you deploy the Live Polling System to various platforms.

## 🚀 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - **Important**: The `vercel.json` file is already configured, so Vercel should auto-detect the settings
   - If manual configuration is needed:
     - Framework Preset: `Create React App`
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `build`

3. **Environment Variables** (if needed):
   - Add `REACT_APP_BACKEND_URL` pointing to your backend URL

### Option 2: Netlify

1. **Build locally**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `frontend/dist` folder (Vite outputs to `dist`)
   - Or connect your GitHub repository

3. **Configure**:
   - Build command: `npm run build`
   - Publish directory: `dist` (Vite outputs to `dist`)
   - Base directory: `frontend`

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

1. **Prepare backend**:
   ```bash
   cd backend
   # Ensure package.json has correct start script
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select the `backend` folder
   - Railway will auto-detect Node.js

3. **Environment Variables**:
   - `PORT`: Railway will set this automatically
   - `NODE_ENV`: `production`

### Option 2: Render

1. **Deploy to Render**:
   - Go to [render.com](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository
   - Set root directory to `backend`

2. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Deploy**:
   ```bash
   cd backend
   heroku create your-app-name
   git subtree push --prefix backend heroku main
   ```

## 🔗 Connecting Frontend and Backend

### Update Frontend Socket Connection

1. **For Production**, update the socket connection in `frontend/src/socket.js`:
   ```javascript
   import { io } from 'socket.io-client';
   
   const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');
   
   export default socket;
   ```

2. **Set Environment Variable**:
   - In Vercel/Netlify: Add `REACT_APP_BACKEND_URL` with your backend URL
   - Example: `https://your-backend.railway.app`

## 📋 Deployment Checklist

### Before Deployment
- [ ] Test locally with `npm start` in both frontend and backend
- [ ] Ensure all dependencies are in `package.json`
- [ ] Check that `.gitignore` files are properly configured
- [ ] Verify environment variables are set correctly

### After Deployment
- [ ] Test frontend URL loads correctly
- [ ] Test backend URL is accessible
- [ ] Test socket connection between frontend and backend
- [ ] Test creating polls and joining sessions
- [ ] Test real-time functionality

## 🐛 Common Deployment Issues

### Frontend Issues
- **Build fails**: Check Node.js version (use 18+)
- **Socket connection fails**: Verify backend URL in environment variables
- **Static files not loading**: Check build output directory
- **Vercel "No Output Directory" error**: 
  - Ensure `vercel.json` is in the root directory
  - Check that `outputDirectory` is set to `frontend/dist` (for Vite) or `frontend/build` (for CRA)
  - Verify the build command runs successfully locally
  - For Vite projects, the output directory is `dist`, not `build`

### Backend Issues
- **Port binding error**: Ensure `PORT` environment variable is set
- **Socket.io CORS errors**: Check CORS configuration in server.js
- **Dependencies missing**: Verify all packages are in `package.json`

### Connection Issues
- **Frontend can't connect to backend**: 
  - Check backend URL is correct
  - Verify CORS settings
  - Ensure backend is running
- **Socket connection drops**: 
  - Check network connectivity
  - Verify Socket.io version compatibility

## 🔧 Environment Variables

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
```

## 📱 Testing Deployment

1. **Open frontend URL** in browser
2. **Select teacher role** and create a poll
3. **Open another tab** and select student role
4. **Test real-time functionality**:
   - Create poll as teacher
   - Answer poll as student
   - Verify results appear in real-time
   - Test chat functionality

## 🚀 Production Tips

- Use HTTPS for both frontend and backend
- Set up monitoring and logging
- Configure proper CORS settings
- Use environment variables for all configuration
- Test thoroughly before going live
- Set up error tracking (Sentry, etc.)

---

**Happy Deploying!** 🎉
