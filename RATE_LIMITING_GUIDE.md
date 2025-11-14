# 🛡️ Rate Limiting (Throttling)

## Rate Limiting là gì?

**Rate Limiting** = Giới hạn số lượng requests trong khoảng thời gian

### Tại sao cần Rate Limiting?

**Bảo vệ khỏi:**
- 🔴 DDoS attacks
- 🔴 Brute force attacks (thử password nhiều lần)
- 🔴 API abuse
- 🔴 Server overload

---

## Setup Rate Limiting

### 1. Cài đặt
```bash
npm install @nestjs/throttler
```

### 2. Cấu hình Global
```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60 seconds
      limit: 10,   // 10 requests
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**Ý nghĩa:** Mỗi IP chỉ được gửi tối đa 10 requests trong 60 giây

---

## Custom Rate Limit

### Per Route
```typescript
import { Throttle } from '@nestjs/throttler';

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })
// Login: Chỉ 5 requests/60s
async login() { }
```

### Skip Rate Limit
```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('public')
@SkipThrottle()
// Route này không bị rate limit
async publicRoute() { }
```

---

## Response khi bị Rate Limit

**Status:** 429 Too Many Requests

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699876543
Retry-After: 30
```

**Body:**
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## Best Practices

### 1. Khác nhau cho từng endpoint
```typescript
// Login: Strict (chống brute force)
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')

// Public API: Loose
@Throttle({ default: { limit: 100, ttl: 60000 } })
@Get('public')

// Admin API: Very strict
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Post('admin/delete')
```

### 2. Combine với Authentication
```typescript
// Unauthenticated: 10 requests/min
// Authenticated: 100 requests/min

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Nếu có user → track theo user ID
    if (req.user) {
      return req.user.id;
    }
    // Nếu không → track theo IP
    return req.ip;
  }
}
```

### 3. Redis Storage (Production)
```typescript
// Dùng Redis thay vì memory
ThrottlerModule.forRoot({
  storage: new ThrottlerStorageRedisService(redisClient),
  throttlers: [{
    ttl: 60000,
    limit: 10,
  }],
})
```

---

## Common Limits

| Endpoint | Limit | TTL | Lý do |
|----------|-------|-----|-------|
| POST /auth/login | 5 | 60s | Chống brute force |
| POST /auth/register | 3 | 3600s | Chống spam account |
| GET /users | 100 | 60s | Normal API |
| POST /upload | 10 | 60s | Tốn resource |
| DELETE /users/:id | 5 | 60s | Sensitive operation |

---

## Tóm tắt

✅ **Rate Limiting:**
- Giới hạn requests/time
- Bảo vệ khỏi abuse
- 429 Too Many Requests

🎯 **Setup:**
```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 10,
}])
```

📚 **Custom:**
- @Throttle() - Custom limit
- @SkipThrottle() - Skip limit
- Custom guard - Advanced logic
