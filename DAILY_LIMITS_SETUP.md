# Daily Game Limit & Badge System Setup

## What's New ✨

1. **Daily Game Limit**: Users can play **3 quizzes/games per day** (resets at midnight)
2. **Badge System**: 1 badge earned for every **250 points** (cumulative)
3. **Data Reset**: All user points, weekly/monthly tracking, and badges have been reset to 0

## Implementation

### Database Changes

Run this SQL in Supabase SQL Editor to apply the changes:

```sql
-- File: RESET_AND_DAILY_LIMITS.sql
-- This adds new columns and creates the RPC functions needed
```

### Key Changes

#### 1. New Database Columns
- `badges` (INTEGER) - Total badges earned (1 per 250 points)
- `daily_games_played` (INTEGER) - Games played today (0-3)
- `last_game_date` (DATE) - Last day a game was played

#### 2. New RPC Function: `add_points_with_limits(uid, points_to_add)`
This function:
- Checks daily game limit (3 games/day)
- Checks weekly point limit (250 points/week)
- Automatically awards badges (every 250 points)
- Increments daily games counter
- Resets daily counter if date changed

**Returns**:
```json
{
  "success": true/false,
  "reason": "Error message if failed",
  "points_awarded": 10,
  "total_points": 100,
  "weekly_points": 100,
  "monthly_points": 100,
  "badges_earned": 0,
  "games_played_today": 1,
  "games_remaining": 2
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
