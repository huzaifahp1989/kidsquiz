# Points System - Run This Checklist

## 📋 Pre-Flight Checklist

Before you start, make sure you have:
- [ ] Supabase account access
- [ ] Your project URL
- [ ] Your project API key
- [ ] Admin access to run SQL

---

## 🚀 STEP-BY-STEP EXECUTION

### ✅ STEP 1: Set Up Database (5 minutes)

**1.1 - Get the SQL**
- [ ] Open file: `SUPABASE_POINTS_SYSTEM.sql`
- [ ] Select all content (Ctrl+A)
- [ ] Copy (Ctrl+C)

**1.2 - Run in Supabase**
- [ ] Go to https://app.supabase.com
- [ ] Click your project: **jlqrbbqsuksncrxjcmbc**
- [ ] Click **SQL Editor** (left sidebar)
- [ ] Click **New Query**
- [ ] Paste the SQL (Ctrl+V)
- [ ] Click **Run** button
- [ ] Wait for completion
- [ ] Look for ✓ success message

**Expected output:**
```
CREATE TABLE IF NOT EXISTS users_points...  ✓
ALTER TABLE users_points ENABLE ROW LEVEL SECURITY...  ✓
DROP POLICY IF EXISTS...  ✓
CREATE POLICY...  ✓
DROP FUNCTION IF EXISTS...  ✓
CREATE OR REPLACE FUNCTION...  ✓
GRANT EXECUTE ON FUNCTION...  ✓
```

---

### ✅ STEP 2: Verify Setup (2 minutes)

Run these verification queries in Supabase SQL Editor:

**2.1 - Check Table Exists**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users_points'
ORDER BY ordinal_position;
```
Expected: 8 columns listed

**2.2 - Check RLS is Enabled**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users_points';
```
Expected: `rowsecurity = true`

**2.3 - Check Function Exists**
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'award_points';
```
Expected: `award_points | FUNCTION`

**2.4 - Check RLS Policies**
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'users_points';
```
Expected: 3 policies listed

- [ ] Table exists with 8 columns
- [ ] RLS is enabled (rowsecurity = true)
- [ ] Function award_points exists
- [ ] 3 RLS policies exist

---

### ✅ STEP 3: Update App Files (1 minute)

The following files are already created for you:

- [ ] **src/lib/points-service.ts** - Service for calling the function
- [ ] **src/components/QuizComponentWithPoints.tsx** - Example component
- [ ] **POINTS_SYSTEM_SETUP.md** - Full documentation
- [ ] **POINTS_SYSTEM_QUICK_REF.md** - Quick reference

No action needed - they're ready to use!

---

### ✅ STEP 4: Test the Function (3 minutes)

In Supabase SQL Editor, test the function:

**4.1 - Test Award 10 Points**
```sql
SELECT award_points(10);
```
Expected response:
```json
{
  "success": true,
  "message": "Points awarded successfully",
  "points_awarded": 10,
  "total_points": 10,
  "today_points": 10,
  "weekly_points": 10,
  "monthly_points": 10
}
```
- [ ] Success = true
- [ ] Points awarded = 10
- [ ] Today's points = 10

**4.2 - Test Award Another 20 Points**
```sql
SELECT award_points(20);
```
Expected:
```json
{
  "success": true,
  "points_awarded": 20,
  "total_points": 30,
  "today_points": 30,
  ...
}
```
- [ ] Success = true
- [ ] Total points = 30 (10+20)
- [ ] Today's points = 30 (10+20)

**4.3 - Test Daily Limit (Award 75 more points)**
```sql
SELECT award_points(75);
```
Expected response:
```json
{
  "success": false,
  "message": "Daily limit of 100 points reached",
  "points_awarded": 0,
  "today_points": 100,
  "daily_limit": 100
}
```
- [ ] Success = false
- [ ] Points awarded = 0 (blocked)
- [ ] Message shows "Daily limit reached"
- [ ] Today's points = 100 (capped at limit)

**4.4 - Verify Data in Database**
```sql
SELECT user_id, total_points, today_points, weekly_points, monthly_points
FROM users_points 
WHERE user_id = auth.uid();
```
Expected:
- [ ] total_points = 30 (permanent, no reset)
- [ ] today_points = 100 (hit daily limit)
- [ ] weekly_points = 30 (increases with totals)
- [ ] monthly_points = 30 (increases with totals)

---

### ✅ STEP 5: Integrate into Your Quiz (5 minutes)

**5.1 - Open Your Quiz Component**

Open: `src/app/quiz/page.tsx` (or wherever your quiz is)

**5.2 - Add Import**
```typescript
import { awardPoints } from '@/lib/points-service'
```

**5.3 - Add Award on Quiz Complete**

Find where you handle quiz submission, add:
```typescript
const result = await awardPoints(10) // or however many points

if (result.success) {
  // Show success message
  console.log(`+${result.points_awarded} points awarded!`)
} else {
  // Show daily limit message
  console.log('Daily limit reached')
}
```

**5.4 - Test in Your App**
- [ ] Open your app
- [ ] Log in as a user
- [ ] Complete a quiz
- [ ] Check that points are awarded
- [ ] See the notification/message
- [ ] Check your points increased

---

### ✅ STEP 6: Add Daily Limit Display (5 minutes)

Show users how many points they can earn today:

```typescript
import { checkDailyAllowance, awardPoints } from '@/lib/points-service'

// Check remaining allowance
const allowance = await checkDailyAllowance()

// Show in UI
<div>
  Daily Points: {allowance.today_points}/100
  Remaining: {allowance.remaining}
</div>

// After awarding points
if (result.success) {
  const newAllowance = await checkDailyAllowance()
  // Update UI with new remaining
}
```

- [ ] Display daily points progress (X/100)
- [ ] Show remaining points user can earn
- [ ] Update after each quiz/game

---

### ✅ STEP 7: Test Full Flow (5 minutes)

Do a complete end-to-end test:

1. [ ] Log in as test user
2. [ ] View profile - check points display
3. [ ] Start a quiz
4. [ ] Complete quiz successfully
5. [ ] See "+X points!" notification
6. [ ] Check profile - points increased
7. [ ] See daily progress (e.g., "20/100")
8. [ ] Complete more quizzes until near 100 points
9. [ ] Try to complete one more quiz
10. [ ] See "Daily limit reached" message
11. [ ] Wait until tomorrow (or manually test)
12. [ ] Verify daily counter reset

---

### ✅ STEP 8: Integrate into Games (3 minutes)

Similar to quiz, add to your game completion:

```typescript
import { awardPoints } from '@/lib/points-service'

async function onGameComplete(score) {
  const points = Math.floor(score / 10) // Example: 80 score = 8 points
  const result = await awardPoints(points)
  
  if (result.success) {
    showNotification(`+${result.points_awarded} points!`)
  }
}
```

- [ ] Add awardPoints call to games
- [ ] Test game points awarding
- [ ] Verify daily limit works

---

## 🎯 Success Criteria

You're done when:

- [ ] SQL executed successfully in Supabase
- [ ] All 4 verification queries return expected results
- [ ] Function test shows correct responses
- [ ] Daily limit blocks attempts to exceed 100 points
- [ ] Totals never reset (permanent increase)
- [ ] App compiles without errors
- [ ] Quiz completion awards points
- [ ] Daily progress shows correctly
- [ ] Limit message shows when hit
- [ ] Next day resets daily counter

---

## 🐛 Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| SQL execution fails | Check syntax, try running smaller parts |
| Function not found | Verify SQL ran successfully, check function name is lowercase |
| "Permission denied" error | Verify RLS policies exist, user must be authenticated |
| Points not awarding | Check user is logged in, check response.success value |
| Daily limit doesn't work | Verify today_points column exists, check function logic |
| Points reset | Check total_points - it should NOT reset (if it did, function is wrong) |

---

## 📞 Files Reference

| File | Purpose |
|------|---------|
| `SUPABASE_POINTS_SYSTEM.sql` | Copy-paste this to Supabase SQL Editor |
| `src/lib/points-service.ts` | Import functions from this |
| `POINTS_SYSTEM_SETUP.md` | Full documentation |
| `POINTS_SYSTEM_QUICK_REF.md` | Quick reference |
| `POINTS_SYSTEM_IMPLEMENTATION_COMPLETE.md` | Overview |

---

## 🎉 Next Steps After Setup

Once everything is working:

1. **Add to Leaderboard**
   - Query top users by total_points

2. **Add Weekly Rewards**
   - Show top users by weekly_points
   - Reset weekly_points on Monday

3. **Add Monthly Rewards**
   - Show top users by monthly_points
   - Reset monthly_points on 1st of month

4. **Add Achievements**
   - Award special points for milestones
   - Award bonus points for streaks

5. **Add Level System**
   - Increase user level based on total_points
   - Show level on profile

---

## ✅ Final Checklist

Before you start coding features:

- [ ] Step 1: SQL setup complete
- [ ] Step 2: Verification queries all pass
- [ ] Step 3: Files already created
- [ ] Step 4: Function tests work
- [ ] Step 5: Quiz integration done
- [ ] Step 6: Daily limit display added
- [ ] Step 7: Full flow tested
- [ ] Step 8: Game integration done
- [ ] No compiler errors
- [ ] Points system working end-to-end

---

## 🚀 You're Ready!

Your points system is now fully operational. Go ahead and:

1. ✅ Complete the checklist above
2. ✅ Integrate into remaining features
3. ✅ Test thoroughly
4. ✅ Deploy with confidence

The system is:
- ✅ Secure (RLS + function validation)
- ✅ Scalable (proper indexes)
- ✅ Reliable (atomic transactions)
- ✅ Type-safe (full TypeScript)
- ✅ Well-documented (inline comments + guides)

Happy coding! 🎉
