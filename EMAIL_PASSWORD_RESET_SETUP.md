# Email-Based Password Reset - Setup Guide

## Overview

Your app now has a professional email-based password reset system! When users click "Forgot Password?", they receive an email with a secure reset link.

## 🎯 Features

✅ **Email with Reset Link** - Professional HTML email with secure link
✅ **Secure Tokens** - Cryptographically secure, hashed tokens  
✅ **1-Hour Expiry** - Links automatically expire
✅ **Web-Based Reset** - Users reset password via web interface
✅ **Mobile Integration** - Seamless flow from mobile app
✅ **Fallback Mode** - Works without email (logs to console)

## 📧 Email Setup (Gmail Example)

### Step 1: Enable 2-Factor Authentication

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **Security**
3. Enable **2-Step Verification**

### Step 2: Create App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter: **GeoAttend**
5. Click **Generate**
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

Edit `server/.env`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=GeoAttend <your-email@gmail.com>

# Frontend URL for reset links
FRONTEND_URL=http://localhost:5173
```

**Important:**
- Use the **App Password**, not your regular Gmail password
- For production, use your actual domain (e.g., `https://yourdomain.com`)

### Step 4: Restart Backend

```bash
cd server
npm run dev
```

You should see:
```
✅ Email service configured successfully
Server running at http://localhost:3000
```

## 🧪 Testing

### Test Without Email (Console Mode)

If you don't configure email, the system will log reset links to the console:

1. **Mobile App:** Tap "Forgot Password?"
2. **Enter Email:** `admin@demo.com`
3. **Check Server Console:** Look for reset URL
4. **Copy URL:** Open in browser
5. **Reset Password:** Enter new password

### Test With Email (Production Mode)

1. **Configure Email** (follow steps above)
2. **Mobile App:** Tap "Forgot Password?"
3. **Enter Email:** Your email address
4. **Check Email:** You'll receive a professional email
5. **Click Link:** Opens password reset page
6. **Reset Password:** Enter new password
7. **Done!** Login with new password

## 📱 User Flow

### Mobile App Flow

1. User taps "Forgot Password?" on login screen
2. User enters their email address
3. User sees: "Email sent! Check your inbox"
4. User checks their email
5. User clicks reset link (opens in browser)
6. User enters new password on web page
7. User returns to mobile app and logs in

### Email Template

Users receive a beautiful HTML email with:
- 🎨 **Professional Design** - Branded colors and logo
- 🔗 **Big Reset Button** - Clear call-to-action
- 🔐 **Security Warning** - "If you didn't request this..."
- ⏰ **Expiry Notice** - "Link expires in 1 hour"
- 📋 **Copy-Paste Link** - For email clients that block buttons

## 🔒 Security Features

### Secure Token Generation
```typescript
// 32 bytes = 64 hex characters
const resetToken = crypto.randomBytes(32).toString('hex');
```

### Token Hashing
- Tokens are hashed (SHA-256) before storage
- Even if database is compromised, tokens are useless
- One-time use (deleted after reset)

### Time-Based Expiry
- Links expire after 1 hour
- Expired tokens are rejected automatically
- Users must request new link if expired

### No User Enumeration
- Same response for existing/non-existing emails
- Prevents attackers from discovering user emails

## 🌐 Other Email Providers

### Using Other SMTP Services

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=YOUR_SENDGRID_API_KEY
```

#### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASSWORD=YOUR_MAILGUN_PASSWORD
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=YOUR_AWS_ACCESS_KEY_ID
EMAIL_PASSWORD=YOUR_AWS_SECRET_ACCESS_KEY
```

#### Outlook/Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

## 🎨 Customizing the Email Template

Edit `server/src/services/email.service.ts`:

### Change Colors
```typescript
// Change from purple to your brand colors
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// Change to:
background: linear-gradient(135deg, #your-color 0%, #your-color 100%);
```

### Change Logo
Replace the logo div with an image:
```html
<img src="https://yourdomain.com/logo.png" alt="Logo" style="width: 60px;" />
```

### Change Company Name
Find all instances of "GeoAttend" and replace with your company name.

## 🚨 Troubleshooting

### "Email service not configured"
**Solution:** Check that all EMAIL_* variables are set in `.env`

### "Failed to send email"
**Possible causes:**
- Wrong SMTP credentials
- Need App Password for Gmail (not regular password)
- Firewall blocking port 587
- 2FA not enabled for Gmail

**Check server logs** for specific error messages

### Email not received
**Check:**
- ✅ Spam/junk folder
- ✅ Email address is correct
- ✅ Server logs show "Email sent successfully"
- ✅ SMTP credentials are correct

### Reset link not working
**Check:**
- ✅ Link hasn't expired (1 hour)
- ✅ `FRONTEND_URL` in .env is correct
- ✅ Web app is running on that URL
- ✅ Link wasn't already used (one-time use)

## 📊 API Endpoints

### Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "64-character-hex-token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Password reset successful. You can now login with your new password."
}
```

## 🔄 Production Deployment

### Environment Variables

Update for production:

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=no-reply@yourdomain.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=YourCompany <no-reply@yourdomain.com>
```

### SSL/TLS

For port 465 (SSL):
```env
EMAIL_PORT=465
```

The email service automatically uses SSL for port 465, TLS for others.

### Rate Limiting

Consider adding rate limiting to prevent abuse:
- Max 3 reset requests per email per hour
- Max 10 reset requests per IP per hour

## 📝 Database Schema

Uses existing `user_account` columns:
```sql
email_verification_token VARCHAR(255)       -- Stores hashed reset token
email_verification_expires_at INT UNSIGNED  -- Token expiry timestamp
```

## 🎉 Summary

Your password reset system is **production-ready**!

**Without Email Config:**
- ✅ Works immediately
- ✅ Logs reset links to console
- ✅ Perfect for development

**With Email Config:**
- ✅ Professional branded emails
- ✅ Secure reset links
- ✅ Production-ready
- ✅ User-friendly flow

## 📞 Support

For issues:
1. Check server console logs
2. Verify email configuration
3. Test with console mode first
4. Check spam folder for emails

---

**Next Steps:**
1. Configure email credentials in `.env`
2. Restart backend server
3. Test password reset flow
4. Customize email template (optional)
5. Deploy to production!

🚀 **Ready to use!**
