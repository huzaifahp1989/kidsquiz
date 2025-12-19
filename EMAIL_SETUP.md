# Email Feedback Setup Guide

## Overview
The feedback system now sends emails directly to `imediac786@gmail.com` when users submit feedback.

## Setup Required

### Option 1: Using Resend (Recommended - Free & Easy)

1. **Sign up for Resend**
   - Go to https://resend.com
   - Sign up for a free account
   - Free tier includes 100 emails/day and 3,000 emails/month

2. **Get your API Key**
   - After signing up, go to https://resend.com/api-keys
   - Click "Create API Key"
   - Give it a name (e.g., "Islamic Kids Platform")
   - Copy the API key (starts with `re_`)

3. **Add to your .env.local file**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   ```

4. **Restart your development server**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

5. **Test the feedback**
   - Go to your website
   - Click "Please send us feedback here"
   - Write a test message
   - Click "Send Feedback"
   - Check `imediac786@gmail.com` for the email

### Option 2: Using SendGrid (Alternative)

If you prefer SendGrid:

1. Sign up at https://sendgrid.com
2. Get your API key
3. Modify the API route in `src/app/api/feedback/route.ts` to use SendGrid

### Option 3: Using Gmail SMTP (For Development Only)

Not recommended for production, but you can use Gmail SMTP with nodemailer for testing.

## How It Works

1. User clicks "Please send us feedback here" in the banner
2. A feedback form appears
3. User types their feedback and clicks "Send Feedback"
4. The feedback is sent to `/api/feedback` API route
5. The API route uses Resend to send an email to `imediac786@gmail.com`
6. User sees a success message

## Email Format

The email will include:
- Subject: "New Feedback - Islamic Kids Learning Platform"
- Date and time the feedback was submitted
- The full feedback message
- Formatted as HTML for easy reading

## Troubleshooting

### "Email service not configured" error
- Make sure you added `RESEND_API_KEY` to `.env.local`
- Restart your development server after adding the key

### Emails not arriving
- Check your Resend dashboard logs
- Verify the API key is correct
- Check spam folder in Gmail
- Make sure you're using a valid "from" address (update in the API route if needed)

### API route errors
- Check the terminal/console for error messages
- Verify the Resend API is working: https://resend.com/status

## Current Configuration

- **To Email**: imediac786@gmail.com
- **From Email**: feedback@resend.dev (update this with your verified domain)
- **API Route**: `/api/feedback`
- **Method**: POST

## Next Steps

1. Sign up for Resend
2. Get your API key
3. Add it to `.env.local`
4. Restart the server
5. Test the feedback system

## Cost

- **Resend Free Tier**: 100 emails/day, 3,000 emails/month
- More than enough for feedback emails
- No credit card required for free tier

## Files Modified

- `src/app/api/feedback/route.ts` - New API route for sending emails
- `src/components/FeedbackBanner.tsx` - Updated to use API instead of mailto

## Support

If you need help:
1. Check the browser console for errors (F12)
2. Check the terminal where the dev server is running
3. Verify your Resend API key is correct
4. Check Resend dashboard logs: https://resend.com/emails
