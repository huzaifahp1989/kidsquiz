# 🚀 Getting Started - Islamic Kids Learning Platform

## Welcome! Let's Get Your App Running! 🎉

Your complete Islamic Kids Learning Platform has been created. Follow these simple steps to get it running on your computer.

---

## Step 1: Open Terminal/Command Prompt

Navigate to your project folder:
```bash
cd C:\Users\huzai\Islamic-Kids-Learning-Platform
```

---

## Step 2: Install Dependencies

Run this command to install all required packages:
```bash
npm install
```

Wait for it to complete. This installs React, Next.js, Tailwind CSS, and other tools needed.

---

## Step 3: Set Up Firebase (Your Backend)

### A. Create a Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click "Get Started"
3. Create a new project (name it something like "Islamic-Kids-Learning")
4. Enable Firestore and Authentication

### B. Get Your Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", click to create a new web app
3. Copy the Firebase configuration

### C. Update Your .env File

1. Open `.env.local` in your project (you'll need to copy from `.env.example`)
2. Paste your Firebase credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## Step 4: Copy Firestore Rules

1. In your Firebase Console, go to **Firestore Database** > **Rules**
2. Copy the security rules from `firestore.rules` file in your project
3. Paste them into Firebase Console Rules tab
4. Click "Publish"

---

## Step 5: Start Development Server

Run this command:
```bash
npm run dev
```

You should see:
```
> Ready on http://localhost:3000
```

---

## Step 6: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

🎉 **Your app should now be running!**

---

## 📺 What You'll See

- **Home Page**: Beautiful Islamic dashboard
- **Top Navigation**: Shows user info and points
- **6 Main Sections**: 
  - 🎮 Islamic Games
  - 📝 Daily Quiz
  - 📖 Learn Quran
  - 📜 Learn Hadith
  - ⭐ Rewards & Badges
  - 🏆 Leaderboard

Click around and explore! Everything is fully functional.

---

## 🛠️ Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after building)
npm run start

# Check for errors
npm run lint
```

---

## 📝 Making Changes

### Edit Content
- **Quran**: `src/data/quran.ts`
- **Hadith**: `src/data/hadith.ts`
- **Quiz Questions**: `src/data/quizzes.ts`

### Edit Pages
- **Home**: `src/app/page.tsx`
- **Quran Page**: `src/app/quran/page.tsx`
- **Quiz Page**: `src/app/quiz/page.tsx`
- *And other pages in `src/app/`*

### Edit Colors/Theme
- **Tailwind Config**: `tailwind.config.js`
- **Global Styles**: `src/app/globals.css`

After making changes, the browser will automatically refresh!

---

## 🐛 Troubleshooting

### "Firebase is not initialized"
- Check your `.env.local` file
- Make sure all Firebase credentials are correct
- Restart the dev server

### "Firestore connection error"
- Go to Firebase Console > Firestore
- Make sure the database is created
- Check that security rules are deployed

### "Ports already in use"
- Another app is using port 3000
- Run: `npm run dev -- -p 3001` to use port 3001 instead

### "npm install fails"
- Delete `node_modules` folder: `rmdir /s node_modules`
- Delete `package-lock.json`
- Run `npm install` again

---

## 📚 Next Steps

1. **Play with the app** - Click around and test features
2. **Read the docs** - See `README.md` for full features
3. **Customize** - Add your own Surahs or Hadiths
4. **Deploy** - Follow `DEPLOYMENT.md` when ready to launch

---

## 🎓 Learn More

- **Full Setup Guide**: See `SETUP.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Feature Details**: See `PROJECT.md`
- **Quick Reference**: See `INDEX.md`

---

## ✨ You're All Set!

Your Islamic Kids Learning Platform is ready to use. Enjoy exploring and building something amazing for Muslim kids!

**Questions?** Check the documentation files or the code comments.

**Ready to launch?** Follow the deployment guide when you're ready to put it online.

---

**Assalamu Alaikum! Happy Learning! 🌙✨**

*Islamic Kids Learning Platform*
*Built with ❤️ for Islamic Education*
