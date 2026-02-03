# Forgot Password Feature - User Guide

## Overview

The Forgot Password feature allows users to reset their password if they forget it. Since email infrastructure is not yet set up, the reset token is displayed in the server console logs for administrators to share with users.

## How It Works

### User Flow

1. **User taps "Forgot Password?"** on the login screen
2. **User enters their email** and requests a reset
3. **System generates a 6-digit token** (valid for 1 hour)
4. **Token is logged** to the server console
5. **Admin shares the token** with the user (via phone, chat, etc.)
6. **User enters the token** and sets a new password
7. **User can now login** with the new password

## For Users

### Step 1: Request Password Reset

1. Open the mobile app
2. On the login screen, tap **"Forgot Password?"**
3. Enter your email address
4. Tap **"Request Reset"**
5. You'll see a message: "A password reset token has been generated"
6. Contact your administrator to get the token

### Step 2: Reset Password

1. After getting the token from admin, tap **"I have the token"**
2. Enter the 6-digit token
3. Enter your new password (minimum 6 characters)
4. Confirm your new password
5. Tap **"Reset Password"**
6. Success! You can now login with your new password

## For Administrators

### How to Get the Reset Token

When a user requests a password reset, check the **backend server console** logs. You'll see:

```
============================================================
PASSWORD RESET REQUEST
============================================================
Email: user@example.com
Reset Token: 123456
Expires: 1/30/2026, 7:30:00 PM
============================================================
Share this token with the user to reset their password.
============================================================
```

### Share the Token

1. Copy the 6-digit token
2. Send it to the user via:
   - Phone call
   - Text message
   - WhatsApp
   - Email (if available)
   - In-person

### Token Expiry

- Tokens expire after **1 hour**
- If expired, user must request a new token
- Each new request generates a new token (old one becomes invalid)

## Testing

### Test Scenario 1: Successful Password Reset

1. **Request Reset:**
   - Open mobile app
   - Tap "Forgot Password?"
   - Enter: `admin@demo.com`
   - Tap "Request Reset"

2. **Get Token from Server:**
   - Check backend terminal
   - Copy the 6-digit token

3. **Reset Password:**
   - Tap "I have the token"
   - Enter the token
   - New Password: `newpassword123`
   - Confirm Password: `newpassword123`
   - Tap "Reset Password"

4. **Login:**
   - Go back to login screen
   - Email: `admin@demo.com`
   - Password: `newpassword123`
   - Success! ✅

### Test Scenario 2: Invalid Token

1. Request reset for an email
2. Enter wrong token: `000000`
3. Try to reset
4. Expected: "Invalid or expired reset token" error

### Test Scenario 3: Expired Token

1. Request reset
2. Wait more than 1 hour
3. Try to use the token
4. Expected: "Invalid or expired reset token" error

## API Endpoints

### Request Password Reset
```
POST /api/auth/forgot-password
Body: {
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Password reset token generated. Check server logs for the token..."
}
```

### Reset Password
```
POST /api/auth/reset-password
Body: {
  "email": "user@example.com",
  "token": "123456",
  "newPassword": "newpass123"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

## Security Features

1. **Token Expiry:** Tokens are valid for only 1 hour
2. **One-Time Use:** Token is deleted after successful reset
3. **Hashed Passwords:** New passwords are securely hashed with bcrypt
4. **Email Validation:** Only valid email formats are accepted
5. **No User Enumeration:** Same response whether user exists or not (security best practice)

## Future Enhancements

### Email Integration (Recommended)

To automatically send reset tokens via email:

1. **Choose Email Service:**
   - SendGrid
   - AWS SES
   - Mailgun
   - Nodemailer (with SMTP)

2. **Update Backend:**
   ```typescript
   // In forgot-password endpoint
   await sendEmail({
     to: email,
     subject: 'Password Reset Token',
     html: `Your password reset token is: <strong>${resetToken}</strong>`
   });
   ```

3. **Update Mobile App:**
   - Remove "Contact administrator" message
   - Show "Check your email" message
   - Add "Resend token" button

### SMS Integration (Optional)

Send tokens via SMS for faster delivery:
- Use Twilio, AWS SNS, or similar
- Requires phone number collection during signup
- More secure than email for sensitive operations

## Troubleshooting

### "Failed to request password reset"
- Check backend server is running
- Check network connection
- Verify API_BASE_URL is correct in `constants/api.ts`

### "Invalid or expired reset token"
- Token expired (>1 hour old) - request new one
- Wrong token entered - check with admin
- Token already used - request new one

### Backend not logging token
- Check server console is visible
- Restart backend server
- Check server logs for errors

## Database Structure

The feature uses these columns in `user_account` table:
- `email_verification_token` - Stores the reset token
- `email_verification_expires_at` - Token expiry timestamp

These columns are shared with email verification (same infrastructure).

## Summary

✅ Users can reset forgotten passwords
✅ Secure 6-digit token system
✅ 1-hour token expiry
✅ Admin can see tokens in server logs
✅ Beautiful mobile UI
✅ Ready for email integration

The feature is **fully functional** and ready to use! 🎉
