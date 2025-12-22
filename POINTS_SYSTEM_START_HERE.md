# Points System - START HERE 🚀

## What You Need to Know (2 minutes)

You now have a **complete points reward system** for your app. Here's what to do:

---

## ⚡ The 3-Step Quick Start

### STEP 1️⃣ - Copy & Paste SQL (2 minutes)

```
File: SUPABASE_POINTS_SYSTEM.sql
└─ Open it
└─ Select all (Ctrl+A)
└─ Copy (Ctrl+C)
└─ Go to Supabase Dashboard
└─ SQL Editor → New Query
└─ Paste (Ctrl+V)
└─ Click RUN
└─ See ✓ success
✅ DONE
```

### STEP 2️⃣ - Use in Code (2 minutes)

```typescript
import { awardPoints } from '@/lib/points-service'

// When quiz/game is complete:
const result = await awardPoints(10) // 10 points

if (result.success) {
  // Show "+10 points!" to user
  showNotification(`+${result.points_awarded} points!`)
} else {
  // Show "Daily limit reached"
  showNotification('Daily limit reached (100/100)')
}
```

### STEP 3️⃣ - Test It (2 minutes)

```
1. Complete a quiz
2. See "+X points!" notification
3. Try to earn 101 points in one day
4. See "Daily limit reached" message
5. ✅ DONE - System works!
```

---

## 📊 How It Works (30 seconds)

User earns points → Check if <= 100 today → Award points → Show result

| Scenario | Result |
|----------|--------|
| Award 10 points (today=0) | ✅ Success. Today=10/100 |
| Award 50 more points | ✅ Success. Today=60/100 |
| Award 50 more points | ✅ Success. Today=100/100 |
| Award 10 more points | ❌ Blocked. Daily limit! |
| Next day, award 10 points | ✅ Success. Today=10/100 (reset!) |

---

## 📁 What Was Created

| File | What It Is | What To Do |
|------|-----------|-----------|
| `SUPABASE_POINTS_SYSTEM.sql` | SQL to run in Supabase | **Copy-paste to SQL Editor** |
| `src/lib/points-service.ts` | TypeScript service | **Import in your components** |
| `src/components/QuizComponentWithPoints.tsx` | Example component | **Reference for how to integrate** |
| `POINTS_SYSTEM_SETUP.md` | Detailed setup guide | **Read if you get stuck** |
| `POINTS_SYSTEM_QUICK_REF.md` | Quick lookup guide | **Keep open while coding** |
| `POINTS_SYSTEM_CHECKLIST.md` | Step-by-step checklist | **Follow for complete setup** |
| `POINTS_SYSTEM_ARCHITECTURE.md` | How the system works | **Read to understand flow** |

---

## ✨ Key Features

### ✅ 100 Points Per Day Limit
- Users can earn max 100 points per day
- When they hit 100, they're blocked
- Tomorrow, they get a fresh 100 allowance

### ✅ Points Always Increase
- `total_points` - keeps going up forever
- `weekly_points` - keeps going up (for weekly leaderboard)
- `monthly_points` - keeps going up (for monthly leaderboard)
- `today_points` - resets daily, counts 0-100

### ✅ Secure
- Server validates everything
- Users can't bypass daily limit
- Users can't see other users' points
- Cannot be hacked from client

---

## 🎯 Functions You'll Use

### 1. Award Points
```typescript
const result = await awardPoints(10)

// Returns:
{
  success: true,
  points_awarded: 10,
  total_points: 150,
  today_points: 45,
  weekly_points: 150,
  monthly_points: 150
}

// Or if daily limit hit:
{
  success: false,
  message: "Daily limit of 100 points reached",
  points_awarded: 0
}
```

### 2. Get User's Points
```typescript
const points = await getUserPoints()

// Returns:
{
  user_id: "uuid...",
  total_points: 150,
  weekly_points: 150,
  monthly_points: 150,
  today_points: 45
}
```

### 3. Check Daily Allowance
```typescript
const allowance = await checkDailyAllowance()

// Returns:
{
  today_points: 45,     // Already earned
  remaining: 55,        // Can still earn
  daily_limit: 100
}
```

---

## 🛠️ Common Use Cases

### Quiz Complete → Award Points
```typescript
async function handleQuizSubmit(answers) {
  const score = calculateScore(answers)
  const pointsToAward = score >= 80 ? 20 : 10
  
  const result = await awardPoints(pointsToAward)
  
  if (result.success) {
    showModal(`Congrats! +${result.points_awarded} points!`)
  } else {
    showModal('Daily limit reached. Come back tomorrow!')
  }
}
```

### Game Complete → Award Points
```typescript
async function handleGameEnd(finalScore) {
  const result = await awardPoints(finalScore)
  
  if (result.success) {
    displayReward(`+${result.points_awarded} points!`)
    navigateTo('/rewards')
  }
}
```

### Show User Stats
```typescript
useEffect(() => {
  getUserPoints().then(points => {
    setUserStats({
      totalPoints: points?.total_points,
      todayPoints: `${points?.today_points}/100`,
      weeklyPoints: points?.weekly_points,
      remainingToday: 100 - (points?.today_points || 0)
    })
  })
}, [])
```

---

## ✅ Next Steps

### RIGHT NOW
1. [ ] Open `SUPABASE_POINTS_SYSTEM.sql`
2. [ ] Copy all content
3. [ ] Go to Supabase Dashboard
4. [ ] SQL Editor → New Query → Paste → Run
5. [ ] See ✓ success message

### AFTER THAT
6. [ ] Open `src/app/quiz/page.tsx` (your quiz page)
7. [ ] Add: `import { awardPoints } from '@/lib/points-service'`
8. [ ] Find where quiz completes
9. [ ] Add: `const result = await awardPoints(10)`
10. [ ] Show result to user

### THEN
11. [ ] Test it!
12. [ ] Complete a quiz
13. [ ] See "+10 points!" notification
14. [ ] Celebrate 🎉

---

## ❓ Common Questions

### Q: Where do I run the SQL?
**A:** Supabase Dashboard → SQL Editor → New Query → Paste → Run

### Q: Will it delete my data?
**A:** No! The SQL only creates new table/function. No existing data is touched.

### Q: How do I know if it worked?
**A:** Look for ✓ success message after running SQL

### Q: Can users cheat the daily limit?
**A:** No! Validation happens on the server at database level.

### Q: What if user's total resets?
**A:** It shouldn't. The function never resets totals. If it does, check function logic.

### Q: How do I show points in UI?
**A:** Use `getUserPoints()` to get current values, display them in JSX

### Q: Where's my documentation?
**A:** Multiple files created:
- Quick: `POINTS_SYSTEM_QUICK_REF.md`
- Full: `POINTS_SYSTEM_SETUP.md`
- Architecture: `POINTS_SYSTEM_ARCHITECTURE.md`
- Checklist: `POINTS_SYSTEM_CHECKLIST.md`

---

## 🚨 If Something Goes Wrong

### "Permission denied" error
**→** Verify RLS policies were created. Run verification queries in POINTS_SYSTEM_SETUP.md

### "Function not found" error
**→** Verify SQL was executed. Check function exists with verification queries.

### "User not authenticated" error
**→** Ensure user is logged in before calling awardPoints()

### Points not increasing
**→** Check result.success - if false, read error message

### Daily limit doesn't work
**→** Verify today_points column exists and is being tracked

---

## 📞 Need Help?

Check these files in order:

1. **Quick answers:** `POINTS_SYSTEM_QUICK_REF.md`
2. **Detailed guide:** `POINTS_SYSTEM_SETUP.md`
3. **Step-by-step:** `POINTS_SYSTEM_CHECKLIST.md`
4. **How it works:** `POINTS_SYSTEM_ARCHITECTURE.md`
5. **See example:** `src/components/QuizComponentWithPoints.tsx`

---

## 🎉 Summary

You have a **production-ready points system** that:

✅ Awards points on quiz/game completion
✅ Limits users to 100 points per day
✅ Keeps permanent records (total/weekly/monthly)
✅ Resets daily counter each day
✅ Is secure and can't be hacked
✅ Is fully typed with TypeScript
✅ Has complete documentation

**What you need to do:**
1. Run SQL file (copy-paste)
2. Import function in components
3. Call on quiz/game completion
4. Show result to user

**That's it!** 🚀

---

## 🗺️ File Navigation

```
START HERE (You are here!)
    ↓
SUPABASE_POINTS_SYSTEM.sql ← Run this in Supabase
    ↓
POINTS_SYSTEM_CHECKLIST.md ← Follow this for setup
    ↓
POINTS_SYSTEM_SETUP.md ← Read for detailed instructions
    ↓
src/lib/points-service.ts ← Import this in components
    ↓
POINTS_SYSTEM_QUICK_REF.md ← Keep open while coding
    ↓
POINTS_SYSTEM_ARCHITECTURE.md ← Understand how it works
    ↓
src/components/QuizComponentWithPoints.tsx ← See example
```

---

**Ready? Let's go!** 🚀

Next: Open `SUPABASE_POINTS_SYSTEM.sql` and follow the 3-step quick start above.
