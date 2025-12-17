# Islamic Kids Learning Platform - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Firebase account (free tier works great!)

### Installation Steps

1. **Clone or Navigate to Project**
   ```bash
   cd Islamic-Kids-Learning-Platform
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project (or use existing)
   - Go to Project Settings > General
   - Copy your Firebase config

4. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   - Edit `.env.local` with your Firebase credentials

5. **Create Firestore Database**
   - In Firebase Console: Firestore Database > Create Database
   - Choose production mode
   - Copy the security rules from `firestore.rules` to your Firestore rules

6. **Run Development Server**
   ```bash
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Home Dashboard
│   ├── quran/             # Quran Learning
│   ├── hadith/            # Hadith Learning
│   ├── quiz/              # Daily Quizzes
│   ├── games/             # Islamic Games
│   ├── leaderboard/       # Leaderboard & Rankings
│   ├── rewards/           # Achievements & Badges
│   ├── admin/             # Admin Panel
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/             # Reusable UI components
│   ├── Navbar.tsx
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── NavCard.tsx
│   └── StatsCard.tsx
├── lib/
│   ├── firebase.ts        # Firebase config
│   └── utils.ts           # Utility functions
├── types/
│   └── index.ts           # TypeScript definitions
└── data/
    ├── quran.ts           # Quran content
    ├── hadith.ts          # Hadith content
    └── quizzes.ts         # Quiz questions
```

## 🎮 Features Implemented

### ✅ Core Pages
- [x] Home Dashboard with welcome message
- [x] Quran Learning section (14 Surahs)
- [x] Hadith Learning (12 authentic Hadiths)
- [x] Daily Quiz system (3 difficulty levels)
- [x] Islamic Games (matching, memory, true/false)
- [x] Leaderboard (weekly & monthly)
- [x] Rewards & Badges system
- [x] Admin Panel for management

### ✅ User Features
- [x] Points & Level system
- [x] Daily streaks
- [x] Progress tracking
- [x] Beautiful UI for kids
- [x] Mobile-responsive design
- [x] Color-coded difficulty levels
- [x] Safe, educational content

### ✅ Safety Features
- [x] No chat between kids
- [x] No external links
- [x] Age-appropriate content
- [x] No music or inappropriate content
- [x] Parent email option available
- [x] Secure Firebase rules

## 📊 Data Structure (Firestore)

### Users Collection
```json
{
  "uid": "user123",
  "username": "Ahmed",
  "email": "parent@email.com",
  "ageGroup": "middle",
  "totalPoints": 250,
  "level": "Learner",
  "streak": 5,
  "createdAt": "2025-01-15"
}
```

### Quiz Progress Collection
```json
{
  "userId": "user123",
  "quizId": "quiz-easy-1",
  "answered": true,
  "score": 10,
  "date": "2025-01-20"
}
```

### Leaderboard Collection
```json
{
  "userId": "user123",
  "username": "Ahmed",
  "points": 850,
  "level": "Young Scholar",
  "weeklyRank": 5,
  "monthlyRank": 8,
  "lastUpdated": "2025-01-20"
}
```

## 🔒 Admin Panel Access

The admin panel is available at `/admin`. To set up admin access:

1. Go to Firebase Console > Authentication
2. Set custom claims for admin users:
   ```javascript
   admin.auth().setCustomUserClaims(uid, { admin: true })
   ```

3. Admin can:
   - Add/edit/delete questions
   - Add/edit/delete Surahs
   - Add/edit/delete Hadiths
   - Reset leaderboards
   - View system statistics
   - Manage content

## 📱 Mobile Optimization

The app is fully responsive and works on:
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Desktop browsers
- ✅ Tablets

## 🌐 Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Build
npm run build

# Deploy
firebase deploy
```

## 📝 Content Management

### Adding New Questions
1. Go to `/admin` panel
2. Click "Add Question"
3. Fill in question details
4. Select difficulty and points
5. Save

### Adding New Surahs
1. Edit `src/data/quran.ts`
2. Add Surah object with:
   - Arabic name
   - English name
   - Introduction
   - Ayahs (with Arabic & English)
   - Main lesson
   - Why to read
   - Fun facts

### Adding New Hadiths
1. Edit `src/data/hadith.ts`
2. Add Hadith object with:
   - English translation
   - Meaning explanation
   - Practical example
   - Source (Sahih Bukhari, etc.)
   - Topic (Kindness, Honesty, etc.)

## 🎨 Customization

### Change Color Scheme
Edit `tailwind.config.js`:
```javascript
colors: {
  'islamic-blue': '#1E40AF',    // Change blue
  'islamic-green': '#16A34A',   // Change green
  'islamic-gold': '#D97706',    // Change gold
}
```

### Add More Games
1. Create new game component in `src/components/games/`
2. Add game data to `src/data/`
3. Update `/games` page
4. Add points system

### Customize Fonts
Edit `globals.css` or `tailwind.config.js` theme section

## 🔐 Security Best Practices

1. **Never commit `.env.local`**
   - Use `.env.example` as template
   - Add to `.gitignore` (already done)

2. **Firestore Rules**
   - Follow principle of least privilege
   - Rules are in `firestore.rules`
   - Test rules in Firebase Console

3. **Admin Access**
   - Use custom claims only
   - No hardcoded credentials
   - Audit admin actions

4. **User Data**
   - Encrypt sensitive data
   - No external links
   - Parental controls in place

## 🐛 Troubleshooting

### Firebase Connection Error
```
Error: Could not load configuration from environment
```
- Check `.env.local` file exists
- Verify all Firebase credentials are correct
- Restart dev server: `npm run dev`

### Leaderboard Not Updating
- Check Firestore rules allow updates
- Verify user has points added
- Check browser console for errors

### Quiz Not Saving Progress
- Check user is authenticated
- Verify Firestore collection exists
- Check security rules allow writes

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [React Hooks](https://react.dev/reference/react)

## 🤝 Contributing

To add more content:
1. Ensure it's from authentic Islamic sources
2. Make it age-appropriate
3. Test on mobile devices
4. Follow the existing code structure
5. Add documentation

## 📄 License

Educational Use Only - Islamic Kids Learning Platform

## 💡 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Offline mode improvements
- [ ] Multiplayer games
- [ ] Achievement badges with animations
- [ ] Voice-guided learning
- [ ] Parent dashboard
- [ ] Progress reports
- [ ] Group challenges

## 📞 Support

For questions or issues:
- Check the admin panel
- Review `.env.example` setup
- Test Firebase connection
- Check browser console for errors

---

**Happy Learning! Assalamu Alaikum! 🌙✨**
