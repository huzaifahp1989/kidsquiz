# Daily Points Limit & Badge System

## Current System ✨

1. **Daily Points Limit**: Users can earn up to **100 points per day** (resets at midnight)
2. **Unlimited Plays**: Users can play **unlimited quizzes/games** - no play count restrictions
3. **Badge System**: 1 badge earned for every **250 points** (cumulative)

## Key Features

- ✅ No limit on number of quizzes/games played per day
- ✅ Points earning capped at 100 points/day
- ✅ Daily limit resets at midnight
- ✅ Database-level enforcement via `award_points()` RPC function
- ✅ Points tracked across total, weekly, monthly, and daily buckets

## Implementation

### Database Changes

Run this SQL in Supabase SQL Editor to apply the changes:

```sql
-- File: RESET_AND_DAILY_LIMITS.sql
-- This adds new columns and creates the RPC functions needed
```

### Key Changes

#### 1. Database Columns
- `badges` (INTEGER) - Total badges earned (1 per 250 points)
- `total_points` (INTEGER) - All-time points
- `today_points` (INTEGER) - Points earned today (max 100)
- `last_earned_date` (DATE) - Last day points were earned

#### 2. RPC Function: `award_points(p_points)`
This function:
- Checks daily point limit (100 points/day)
- Automatically resets daily counter if date changed
- Awards points up to daily limit
- Updates all point buckets (total, weekly, monthly, daily)
- Returns detailed response with points awarded

**Returns**:
```json
{
  "success": true/false,
  "points_awarded": 10,
  "total_points": 110,
  "today_points": 10,
  "reason": "Daily limit reached" (if applicable)
}
```

### UI Updates

#### Profile Page
Shows:
- 🏆 Total Badges earned
- ⭐ Total Points (all-time)
- 🎮 Games Remaining (today out of 3)
- 📊 Weekly Points (out of 250)

#### Quiz Page
Shows:
- Stats dashboard with badges, games remaining, and total points
- Warning when daily limit reached
- Badge award notifications

## How It Works

### Playing a Quiz
1. User has 3 games/day limit
2. Plays a quiz, gets 1 point per correct answer (max 10/quiz)
3. System checks limits using `add_points_with_limits()` RPC
4. If successful:
   - Points added
   - Badges awarded if applicable (every 250 points = 1 badge)
   - Daily games counter incremented
   - Weekly/monthly totals updated

### Daily Reset
- Daily games counter automatically resets at midnight
- Weekly points reset occurs weekly (based on `last_weekly_reset`)
- Monthly points reset occurs monthly (based on `last_monthly_reset`)

## Testing

1. **Test Daily Limit**:
   - Play 3 quizzes in one day
   - Try to play a 4th - should get "Daily limit reached" message
   - Wait until next day - should be able to play again

2. **Test Badges**:
   - Accumulate 250 points (25 perfect quizzes)
   - Should see badge count increase
   - Every 250 more points = 1 more badge

3. **Test Weekly Limit**:
   - Play quizzes until you reach 250 weekly points
   - Try to earn more - should show "Weekly limit reached"
   - Points should be capped at 250/week

## Data Structure

```sql
-- New columns in users table
ALTER TABLE public.users ADD COLUMN badges INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN daily_games_played INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN last_game_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.users ADD COLUMN last_weekly_reset DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.users ADD COLUMN last_monthly_reset DATE DEFAULT CURRENT_DATE;
```

## Important Notes

⚠️ **Before deploying to production**:
1. Run the SQL migration in Supabase
2. Verify the `add_points_with_limits()` function exists
3. Test all limits work correctly
4. Check that badges display properly in UI

✅ **All user data has been reset**:
- `points = 0`
- `weeklypoints = 0`
- `monthlypoints = 0`
- `badges = 0`
- Users start fresh with this system

## Future Enhancements

- Add weekly/monthly leaderboards filtering by badges
- Show badge progression (e.g., "250 pts to next badge")
- Add bonus multipliers for streak days
- Reset weekly/monthly points on specific days/dates
- Premium features unlock at certain badge levels
