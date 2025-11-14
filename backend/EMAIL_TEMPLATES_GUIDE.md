# 📧 Email Templates Guide

## 📋 Available Templates

### 1. **password-changed.hbs** - Premium Version
Email đẹp, đầy đủ tính năng với:
- ✅ Gradient header với icon
- ✅ Thông tin chi tiết (email, time, IP)
- ✅ Security warning box
- ✅ Security tips
- ✅ Social media links
- ✅ Professional footer

**Use case**: Production, professional apps

### 2. **password-changed-simple.hbs** - Simple Version
Email đơn giản, gọn nhẹ với:
- ✅ Clean design
- ✅ Essential information only
- ✅ Warning box
- ✅ CTA button
- ✅ Minimal footer

**Use case**: Internal apps, quick implementation

---

## 🚀 How to Use

### Step 1: Mail Service Method

```typescript
// backend/src/mail/mail.service.ts
async sendPasswordChangedEmail(email: string, name: string, ipAddress?: string) {
  const changeTime = new Date().toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  await this.mailerService.sendMail({
    to: email,
    subject: '✅ Mật khẩu của bạn đã được thay đổi',
    template: './password-changed', // or './password-changed-simple'
    context: {
      name: name,
      email: email,
      changeTime: changeTime,
      ipAddress: ipAddress || 'Không xác định',
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      year: new Date().getFullYear(),
    },
  });
}
```

### Step 2: Call in Auth Service

```typescript
// backend/src/auth/auth.service.ts
async changePassword(dto: PasswordDto, user: any) {
  // ... change password logic ...
  
  // Send notification email
  try {
    await this.mailService.sendPasswordChangedEmail(
      currentUser.email,
      currentUser.name,
      user.ipAddress, // Optional
    );
  } catch (error) {
    console.error('Email error:', error);
    // Don't throw - password already changed
  }
  
  return { message: 'Đổi mật khẩu thành công' };
}
```

---

## 🎨 Template Variables

### Required Variables
```handlebars
{{name}}        - User's name
{{email}}       - User's email
{{changeTime}}  - Time of password change
{{loginUrl}}    - Login page URL
{{year}}        - Current year
```

### Optional Variables
```handlebars
{{ipAddress}}   - IP address (optional)
```

---

## 📱 Email Preview

### Premium Version
```
┌─────────────────────────────────────┐
│   🎨 Gradient Header with Icon     │
│   Đổi Mật Khẩu Thành Công! 🎉     │
├─────────────────────────────────────┤
│                                     │
│   Xin chào [Name],                 │
│                                     │
│   Mật khẩu đã được thay đổi...    │
│                                     │
│   ┌─────────────────────────────┐ │
│   │ 📧 Email: user@example.com  │ │
│   │ 🕐 Time: 14/11/2025 11:30  │ │
│   │ 🌐 IP: 192.168.1.1         │ │
│   └─────────────────────────────┘ │
│                                     │
│   ⚠️ Warning Box                   │
│   🔒 Security Tips                 │
│                                     │
│   [Đăng Nhập Ngay] Button         │
│                                     │
├─────────────────────────────────────┤
│   Footer with Social Links         │
│   © 2025 Company Name              │
└─────────────────────────────────────┘
```

### Simple Version
```
┌─────────────────────────────────────┐
│   ✅ Đổi Mật Khẩu Thành Công       │
├─────────────────────────────────────┤
│                                     │
│   Xin chào [Name],                 │
│                                     │
│   Mật khẩu đã được thay đổi...    │
│                                     │
│   📧 Email: user@example.com       │
│   🕐 Time: 14/11/2025 11:30       │
│                                     │
│   ⚠️ Warning Box                   │
│                                     │
│   [Đăng Nhập Ngay] Button         │
│                                     │
├─────────────────────────────────────┤
│   © 2025 Company Name              │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

### Test Email Sending

```typescript
// Test in controller or service
async testPasswordChangedEmail() {
  await this.mailService.sendPasswordChangedEmail(
    'test@example.com',
    'Test User',
    '192.168.1.1'
  );
  return { message: 'Test email sent!' };
}
```

### Using Mailtrap (Development)

```env
# .env
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASSWORD=your_mailtrap_password
MAIL_FROM=noreply@example.com
```

---

## 🎨 Customization

### Change Colors

**Premium Version:**
```html
<!-- Header gradient -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Change to your brand colors -->
background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
```

**Simple Version:**
```html
<!-- Header -->
background: linear-gradient(to right, #4CAF50, #45a049);

<!-- Button -->
background-color: #4CAF50;
```

### Add Logo

```html
<!-- Add before header title -->
<img src="https://your-domain.com/logo.png" 
     alt="Logo" 
     style="width: 120px; margin-bottom: 20px;">
```

### Change Language

Replace Vietnamese text with your language:
```handlebars
<!-- Vietnamese -->
<h1>Đổi Mật Khẩu Thành Công! 🎉</h1>

<!-- English -->
<h1>Password Changed Successfully! 🎉</h1>
```

---

## 📊 Email Analytics

### Track Email Opens

Add tracking pixel:
```html
<img src="https://your-analytics.com/track?email={{email}}&event=open" 
     width="1" height="1" style="display:none;">
```

### Track Link Clicks

Wrap links with tracking:
```html
<a href="https://your-analytics.com/track?url={{loginUrl}}&email={{email}}">
    Đăng Nhập Ngay
</a>
```

---

## 🔒 Security Best Practices

### 1. Don't Include Sensitive Data
```typescript
// ❌ BAD
context: {
  newPassword: dto.newPassword, // Never send password!
}

// ✅ GOOD
context: {
  changeTime: new Date().toISOString(),
  ipAddress: req.ip,
}
```

### 2. Use HTTPS for Links
```typescript
loginUrl: `https://your-domain.com/login`, // ✅
loginUrl: `http://your-domain.com/login`,  // ❌
```

### 3. Add Unsubscribe Link
```html
<a href="{{unsubscribeUrl}}">Hủy đăng ký nhận email</a>
```

---

## 📱 Mobile Responsive

Both templates are mobile-responsive:
- ✅ Fluid width (max 600px)
- ✅ Readable font sizes
- ✅ Touch-friendly buttons
- ✅ Proper spacing

Test on:
- iPhone (Safari)
- Android (Gmail app)
- Desktop (Outlook, Gmail)

---

## 🐛 Troubleshooting

### Email Not Sending

1. Check SMTP configuration
```bash
# Test SMTP connection
telnet smtp.mailtrap.io 2525
```

2. Check logs
```typescript
console.log('📧 Sending email to:', email);
```

3. Verify template path
```typescript
template: './password-changed', // ✅ Correct
template: 'password-changed',   // ❌ Missing ./
```

### Email Goes to Spam

1. Add SPF record
```
v=spf1 include:_spf.google.com ~all
```

2. Add DKIM signature
3. Use reputable SMTP service
4. Avoid spam trigger words

### Template Not Found

```bash
# Check file exists
ls backend/src/mail/templates/password-changed.hbs

# Check mail module configuration
# mail.module.ts should have correct template path
```

---

## 📚 More Templates

You can create more templates:
- `welcome.hbs` - Welcome new users
- `otp.hbs` - OTP verification
- `reset-password.hbs` - Password reset
- `account-locked.hbs` - Security alert
- `login-alert.hbs` - New login notification

---

**Happy Emailing! 📧**
