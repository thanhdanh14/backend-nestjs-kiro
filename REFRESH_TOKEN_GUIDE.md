# 🔄 Refresh Token

## Refresh Token là gì?

**Access Token** = Token ngắn hạn (15 phút) để truy cập API
**Refresh Token** = Token dài hạn (7 ngày) để lấy access token mới

### Tại sao cần Refresh Token?

**Vấn đề với chỉ dùng Access Token:**
```
Access Token hết hạn sau 15 phút
→ User phải login lại mỗi 15 phút
→ Trải nghiệm người dùng tệ
```

**Giải pháp với Refresh Token:**
```
Access Token hết hạn sau 15 phút
→ Dùng Refresh Token để lấy Access Token mới
→ User không cần login lại
→ Refresh Token hết hạn sau 7 ngày → Mới phải login lại
```

---

## Flow Refresh Token

```
1. Login:
   Client → Server: { email, password }
   Server → Client: { access_token, refresh_token }

2. Truy cập API:
   Client → Server: Authorization: Bearer <access_token>
   Server → Client: { data }

3. Access Token hết hạn:
   Client → Server: Authorization: Bearer <expired_access_token>
   Server → Client: 401 Unauthorized

4. Refresh Token:
   Client → Server: POST /auth/refresh
                    Body: { refresh_token }
   Server → Client: { access_token, refresh_token }

5. Tiếp tục truy cập API với token mới
```

---

## Implementation

### Schema
```typescript
@Schema({ timestamps: true })
export class User {
  // ... các fields khác
  
  @Prop()
  refreshToken?: string; // Lưu refresh token (đã hash)
}
```

### AuthService
```typescript
async login(user: User) {
  const tokens = await this.generateTokens(user);
  
  // Hash và lưu refresh token
  const hashedRefreshToken = await bcrypt.hash(tokens.refresh_token, 10);
  await this.usersRepository.updateById(user._id, {
    refreshToken: hashedRefreshToken,
  });
  
  return tokens;
}

async generateTokens(user: User) {
  const payload = { sub: user._id, email: user.email };
  
  return {
    access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
    refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
  };
}

async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.usersRepository.findById(userId);
  if (!user || !user.refreshToken) {
    throw new UnauthorizedException();
  }
  
  // Verify refresh token
  const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!isValid) {
    throw new UnauthorizedException();
  }
  
  // Generate new tokens
  return await this.generateTokens(user);
}
```

---

## Best Practices

1. **Lưu refresh token đã hash** (không lưu plain text)
2. **Rotate refresh token** (tạo mới mỗi lần refresh)
3. **Revoke refresh token** khi logout
4. **Limit refresh token usage** (chỉ dùng 1 lần)

---

## Security

✅ **TỐT:**
- Access token ngắn hạn (15m)
- Refresh token dài hạn (7d)
- Hash refresh token trước khi lưu
- Rotate refresh token

❌ **KHÔNG TỐT:**
- Access token dài hạn (1 năm)
- Không có refresh token
- Lưu refresh token plain text
- Không rotate refresh token
