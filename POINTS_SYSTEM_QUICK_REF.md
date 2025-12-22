# Points System - Quick Reference

## 🎯 TL;DR - What to Do

### 1. Run SQL (One Time)
```
Go to Supabase Dashboard → SQL Editor → Paste SUPABASE_POINTS_SYSTEM.sql → Run
```

### 2. Use in Code
```typescript
import { awardPoints, checkDailyAllowance } from '@/lib/points-service'

// Award points
const result = await awardPoints(10)
if (result.success) {
  console.log(`+${result.points_awarded}! Total: ${result.total_points}`)
}

// Check remaining today
const allowance = await checkDailyAllowance()
console.log(`Can earn ${allowance.remaining} more today`) // 0-100
```

---

## 📊 Database Schema

```
users_points
├─ id (UUID, primary key)
├─ user_id (UUID, unique, foreign key → auth.users)
├─ total_points (int, >= 0) ✅ Always increases
├─ weekly_points (int, >= 0) ✅ Always increases
├─ monthly_points (int, >= 0) ✅ Always increases
├─ today_points (int, >= 0) 🔄 Resets daily at 0/100
├─ last_earned_date (date) 📅 Tracks date
├─ created_at (timestamp)
└─ updated_at (timestamp)
```

---

## 🔧 RPC Function

```typescript
// Signature
award_points(p_points: int) → jsonb

// Call it
const { data, error } = await supabase.rpc('award_points', { p_points: 10 })

// Response (on success)
{
  success: true,
  message: "Points awarded successfully",
  points_awarded: 10,
  total_points: 50,
  today_points: 10,
  weekly_points: 50,
  monthly_points: 50
}

// Response (daily limit hit)
{
  success: false,
  message: "Daily limit of 100 points reached",
  points_awarded: 0,
  today_points: 100,
  daily_limit: 100
}
```

---

## 🛡️ Security

| What | Who Can | Via |
|------|---------|-----|
| Read own points | You | SELECT policy + RLS |
| Award points | You | award_points() function only |
| See other's points | You | Not allowed (RLS blocks) |
| Reset totals | Nobody | Impossible (no reset logic) |
| Bypass daily limit | Nobody | Function validates |

---

## 📝 Usage Examples

### Award Points on Quiz Complete
```typescript
async function onQuizComplete(score: number) {
  const points = score >= 80 ? 20 : 10
  const result = await awardPoints(points)
  
  if (result.success) {
    showToast(`🎉 +${result.points_awarded} points!`)
  } else {
    showToast(`Daily limit reached (${result.today_points}/100)`)
  }
}
```

### Display Points in UI
```typescript
export function PointsDisplay() {
  const [points, setPoints] = useState<any>(null)
  
  useEffect(() => {
    async function load() {
      const data = await getUserPoints()
      setPoints(data)
    }
    load()
  }, [])
  
  if (!points) return <div>Loading...</div>
  
  return (
    <div>
      <p>Total: {points.total_points}</p>
      <p>Today: {points.today_points}/100</p>
      <p>Weekly: {points.weekly_points}</p>
      <p>Monthly: {points.monthly_points}</p>
    </div>
  )
}
```

### Leaderboard Query
```typescript
export async function getLeaderboard() {
  const { data } = await supabase
    .from('users_points')
    .select('user_id, total_points')
    .order('total_points', { ascending: false })
    .limit(10)
  
  return data
}
```

---

## ✅ Verification Queries

Run in Supabase SQL Editor to verify everything works:

```sql
-- 1. Check table exists
SELECT COUNT(*) as row_count FROM users_points;

-- 2. Check function exists
\df award_points

-- 3. Check RLS is enabled
SELECT rowsecurity FROM pg_tables WHERE tablename = 'users_points';

-- 4. Test function (when logged in as a user)
SELECT award_points(10);

-- 5. Check user's points
SELECT * FROM users_points WHERE user_id = auth.uid();
```

---

## 🎮 Common Integration Points

### In Quiz Component
```typescript
import { awardPoints } from '@/lib/points-service'

const handleQuizSubmit = async (answers) => {
  const score = calculateScore(answers)
  const passed = score >= 70
  
  if (passed) {
    await awardPoints(Math.floor(score / 10))
    showSuccessMessage()
  }
}
```

### In Game Component
```typescript
import { awardPoints } from '@/lib/points-service'

const handleGameEnd = async (finalScore) => {
  await awardPoints(finalScore)
  navigateToRewards()
}
```

### In Profile Component
```typescript
import { getUserPoints } from '@/lib/points-service'

useEffect(() => {
  const loadPoints = async () => {
    const data = await getUserPoints()
    setUserStats({
      total: data?.total_points,
      today: data?.today_points,
      remaining: Math.max(0, 100 - (data?.today_points || 0))
    })
  }
  loadPoints()
}, [])
```

---

## ⚠️ Important Rules

1. **Do NOT:**
   - ❌ Manually insert into users_points (use award_points)
   - ❌ Update users_points directly (use award_points)
   - ❌ Reset total_points (never happens)
   - ❌ Delete RLS policies (breaks security)

2. **Do:**
   - ✅ Always use award_points() function
   - ✅ Check response.success before showing UI feedback
   - ✅ Show remaining daily allowance to user
   - ✅ Log errors for debugging

3. **Points Scale:**
   - Quiz: 10-20 points (based on score)
   - Game: 5-30 points (based on difficulty)
   - Daily Challenge: 20 points
   - Total daily max: 100 points

---

## 🐛 Quick Fixes

| Problem | Solution |
|---------|----------|
| "User not authenticated" | Make sure user logged in before calling award_points |
| "Permission denied" | Check RLS policies were created, verify user is authenticated |
| "Function not found" | Verify SQL was executed, check function name is lowercase |
| Daily limit not working | Check last_earned_date, make sure it's tracking correctly |
| Points not increasing | Verify response.success is true, check for errors in response |

---

## 📞 Files Reference

| File | Purpose |
|------|---------|
| `SUPABASE_POINTS_SYSTEM.sql` | Database setup + function + RLS |
| `src/lib/points-service.ts` | TypeScript service for app |
| `POINTS_SYSTEM_SETUP.md` | Full setup guide |
| `POINTS_SYSTEM_QUICK_REF.md` | This file (quick reference) |

---

## 🚀 Get Started

1. Copy `SUPABASE_POINTS_SYSTEM.sql`
2. Paste in Supabase SQL Editor
3. Click Run
4. Import `awardPoints` in your component
5. Call on quiz/game completion
6. Done! 🎉
