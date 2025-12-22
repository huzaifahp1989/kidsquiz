# WebView Supabase Authentication Fix

## Problem
- Email login works but RPC calls return `null` for `auth.uid()`
- `users_points` table stays empty
- Session not persisting in WebView

## Solution Applied

### 1️⃣ Supabase Client Configuration
Updated `src/lib/supabase.ts` with WebView-compatible settings:
- ✅ `persistSession: true` - Always save session
- ✅ `autoRefreshToken: true` - Prevent token expiry
- ✅ `flowType: 'implicit'` - Simpler auth flow for WebView
- ✅ `storageKey: 'supabase.auth.token'` - Explicit storage key

### 2️⃣ Login Verification
Updated `src/app/signin/page.tsx`:
- ✅ Explicit session check after login
- ✅ Console logs to verify session persistence
- ✅ Test RPC call to verify `auth.uid()` works

### 3️⃣ RPC Auth Guards
Updated `src/lib/points-service.ts`:
- ✅ Double-check user authentication before calling `award_points`
- ✅ Verify session exists before RPC
- ✅ Clear error messages if not logged in

### 4️⃣ Debug Test RPC
Created `SUPABASE_TEST_UID.sql`:
- ✅ `test_uid()` function to verify `auth.uid()` is working
- ✅ Returns JSON with auth status

Updated `src/app/debug/page.tsx`:
- ✅ Test auth before calling RPC
- ✅ Call `test_uid()` to verify session
- ✅ Step-by-step debugging output

## WebView Requirements

### Android WebView Settings
```java
webView.getSettings().setJavaScriptEnabled(true);
webView.getSettings().setDomStorageEnabled(true);
webView.getSettings().setDatabaseEnabled(true);
webView.getSettings().setAllowFileAccess(true);
webView.getSettings().setAllowContentAccess(true);

// CRITICAL: Enable cookies
CookieManager.getInstance().setAcceptCookie(true);
CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);
```

### iOS WKWebView Settings
```swift
let config = WKWebViewConfiguration()
config.preferences.javaScriptEnabled = true

// CRITICAL: Enable localStorage
let prefs = WKPreferences()
prefs.javaScriptEnabled = true
config.preferences = prefs

let webView = WKWebView(frame: .zero, configuration: config)
```

## Testing Steps

1. **Run SQL in Supabase**:
   ```bash
   # Run SUPABASE_TEST_UID.sql in Supabase SQL Editor
   ```

2. **Test Login**:
   - Go to `/signin`
   - Enter credentials
   - Check browser console for:
     - ✅ "Sign-in successful"
     - ✅ "SESSION AFTER LOGIN: { hasSession: true }"
     - ✅ "AUTH TEST RPC: { is_authenticated: true }"

3. **Test Points Award**:
   - Go to `/debug`
   - Click "🎯 Test award_points"
   - Should see:
     - Step 1: Auth verified
     - Step 2: `test_uid()` returns user ID
     - Step 3: `award_points` succeeds

4. **Play Quiz**:
   - Complete a quiz
   - Points should update
   - Check Supabase `users_points` table for new row

## If Still Failing

### Check Session in Browser
```javascript
// In browser console:
const session = await supabase.auth.getSession();
console.log(session);
```

### Check localStorage
```javascript
// In browser console:
console.log(localStorage.getItem('supabase.auth.token'));
```

### Check RPC Auth
```javascript
// In browser console:
const result = await supabase.rpc('test_uid');
console.log(result);
```

If `test_uid()` returns `null` but you're logged in, the WebView is clearing localStorage between page loads.

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `auth.uid() is null` | Session not stored | Enable DOM storage in WebView |
| Login works but RPC fails | Cookies disabled | Enable third-party cookies |
| Session lost on refresh | localStorage cleared | Set persistent storage mode |
| CORS errors | Wrong domain | Check Supabase project URL settings |

## Files Changed
- ✅ `src/lib/supabase.ts` - Client config
- ✅ `src/app/signin/page.tsx` - Login verification
- ✅ `src/lib/points-service.ts` - Auth guards
- ✅ `src/app/debug/page.tsx` - Debug tools
- ✅ `SUPABASE_TEST_UID.sql` - Test RPC function
- ✅ `WEBVIEW_AUTH_FIX.md` - This documentation

## Next Steps
1. Deploy updated SQL to Supabase
2. Test in WebView with debug console
3. Verify localStorage persists between page loads
4. Confirm RPC calls work with authenticated user
