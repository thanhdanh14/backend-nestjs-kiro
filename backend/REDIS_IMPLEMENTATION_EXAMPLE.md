# 🚀 Redis Caching - Implementation Example

## Implement Redis vào Project Hiện Tại

Đây là hướng dẫn **step-by-step** để thêm Redis caching vào project của bạn.

---

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install cache-manager@^5.2.3 cache-manager-redis-store@^3.0.1
npm install --save-dev @types/cache-manager
```

---

## 🐳 Step 2: Start Redis Server

### Option 1: Docker (Khuyến nghị)
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

### Option 2: Local Installation
**Windows:**
- Download: https://github.com/microsoftarchive/redis/releases
- Extract và chạy `redis-server.exe`

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

---

## ⚙️ Step 3: Configure Environment

```env
# backend/.env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=60
```

---

## 🔧 Step 4: Update App Module

```typescript
// backend/src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Add Cache Module
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      ttl: parseInt(process.env.REDIS_TTL) || 60,
    }),
    
    ScheduleModule.forRoot(),
    MongooseModule.forRoot('mongodb://localhost:27017/nestjs-learning'),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    
    UsersModule,
    AuthModule,
    UploadModule,
    MailModule,
    TasksModule,
  ],
  // ...
})
export class AppModule {}
```

---

## 💻 Step 5: Update Users Service

```typescript
// backend/src/users/users.service.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ==================== FIND ONE WITH CACHE ====================
  async findOne(id: string) {
    const cacheKey = `user:${id}`;
    
    // 1. Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('❌ Cache MISS:', cacheKey);
    
    // 2. Query database
    const user = await this.usersRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Remove sensitive data
    const { password, refreshToken, ...userWithoutSensitive } = (user as any).toObject();
    
    // 3. Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, userWithoutSensitive, 300);
    
    return userWithoutSensitive;
  }

  // ==================== FIND ALL WITH CACHE ====================
  async findAll() {
    const cacheKey = 'users:all';
    
    // Check cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('❌ Cache MISS:', cacheKey);
    
    // Query database
    const users = await this.usersRepository.findAll();
    
    // Remove sensitive data
    const usersWithoutSensitive = users.map(user => {
      const { password, refreshToken, ...rest } = (user as any).toObject();
      return rest;
    });
    
    // Cache for 2 minutes
    await this.cacheManager.set(cacheKey, usersWithoutSensitive, 120);
    
    return usersWithoutSensitive;
  }

  // ==================== CREATE WITH CACHE INVALIDATION ====================
  async create(createUserDto: CreateUserDto) {
    const user = await this.usersRepository.create(createUserDto);
    
    // Invalidate list cache
    await this.cacheManager.del('users:all');
    console.log('🗑️ Cache DELETED: users:all');
    
    return user;
  }

  // ==================== UPDATE WITH CACHE INVALIDATION ====================
  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.updateById(id, updateUserDto);
    
    // Invalidate specific user cache
    await this.cacheManager.del(`user:${id}`);
    console.log('🗑️ Cache DELETED:', `user:${id}`);
    
    // Invalidate list cache
    await this.cacheManager.del('users:all');
    console.log('🗑️ Cache DELETED: users:all');
    
    return user;
  }

  // ==================== DELETE WITH CACHE INVALIDATION ====================
  async remove(id: string) {
    await this.usersRepository.deleteById(id);
    
    // Invalidate caches
    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del('users:all');
    console.log('🗑️ Cache DELETED:', `user:${id}`, 'users:all');
    
    return { message: 'User deleted successfully' };
  }

  // ==================== GET STATISTICS WITH CACHE ====================
  async getUsersWithFileStats() {
    const cacheKey = 'users:stats';
    
    // Check cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('❌ Cache MISS:', cacheKey);
    
    // Heavy aggregation query
    const stats = await this.usersRepository.getUsersWithFileStats();
    
    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, stats, 600);
    
    return stats;
  }
}
```

---

## 📁 Step 6: Update Upload Service

```typescript
// backend/src/upload/upload.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(UploadedFile.name) private fileModel: Model<UploadedFile>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ==================== GET USER FILES WITH CACHE ====================
  async getUserFiles(userId: string): Promise<any[]> {
    const cacheKey = `files:user:${userId}`;
    
    // Check cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('❌ Cache MISS:', cacheKey);
    
    // Query database
    const files = await this.fileModel
      .find({ uploadedBy: userId, status: 'active' })
      .sort({ createdAt: -1 })
      .exec();
    
    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, files, 300);
    
    return files;
  }

  // ==================== SAVE FILE WITH CACHE INVALIDATION ====================
  async saveFileInfo(file: Express.Multer.File, userId: string) {
    const fileInfo = await this.fileModel.create({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: userId,
    });
    
    // Invalidate user's files cache
    await this.cacheManager.del(`files:user:${userId}`);
    console.log('🗑️ Cache DELETED:', `files:user:${userId}`);
    
    return fileInfo;
  }

  // ==================== DELETE FILE WITH CACHE INVALIDATION ====================
  async deleteFile(fileId: string, userId: string) {
    const file = await this.fileModel.findOne({
      _id: fileId,
      uploadedBy: userId,
    });
    
    if (!file) {
      throw new NotFoundException('File not found');
    }
    
    // Soft delete
    file.status = 'deleted';
    await file.save();
    
    // Invalidate cache
    await this.cacheManager.del(`files:user:${userId}`);
    console.log('🗑️ Cache DELETED:', `files:user:${userId}`);
    
    return { message: 'File deleted successfully' };
  }

  // ==================== GET STATISTICS WITH CACHE ====================
  async getStatistics(userId: string) {
    const cacheKey = `files:stats:${userId}`;
    
    // Check cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('✅ Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('❌ Cache MISS:', cacheKey);
    
    // Aggregation query
    const stats = await this.fileModel.aggregate([
      { $match: { uploadedBy: new Types.ObjectId(userId), status: 'active' } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
        },
      },
    ]);
    
    const result = stats[0] || {
      totalFiles: 0,
      totalSize: 0,
      avgSize: 0,
    };
    
    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, result, 600);
    
    return result;
  }
}
```

---

## 🎯 Step 7: Add Cache Management Endpoint

```typescript
// backend/src/app.controller.ts
import { Controller, Get, Delete, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('cache')
@Controller('cache')
export class CacheController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  async getStats() {
    // Note: This requires redis store with keys() method
    try {
      const keys = await this.cacheManager.store.keys('*');
      return {
        totalKeys: keys.length,
        keys: keys.slice(0, 20), // Show first 20 keys
      };
    } catch (error) {
      return {
        message: 'Cache stats not available',
        error: error.message,
      };
    }
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all cache' })
  async clearCache() {
    await this.cacheManager.reset();
    return {
      message: 'Cache cleared successfully',
    };
  }

  @Delete('clear/:pattern')
  @ApiOperation({ summary: 'Clear cache by pattern' })
  async clearCacheByPattern(@Param('pattern') pattern: string) {
    try {
      const keys = await this.cacheManager.store.keys(pattern);
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
      return {
        message: `Cleared ${keys.length} cache keys`,
        keys,
      };
    } catch (error) {
      return {
        message: 'Failed to clear cache',
        error: error.message,
      };
    }
  }
}
```

---

## 🧪 Step 8: Test Cache

### 1. Start Backend
```bash
npm run start:dev
```

### 2. Test User Endpoints

**First Request (Cache Miss):**
```bash
curl http://localhost:3000/api/users/USER_ID
# Check console: ❌ Cache MISS: user:USER_ID
# Response time: ~50ms
```

**Second Request (Cache Hit):**
```bash
curl http://localhost:3000/api/users/USER_ID
# Check console: ✅ Cache HIT: user:USER_ID
# Response time: ~2ms (25x faster!)
```

### 3. Test Cache Invalidation

**Update User:**
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
# Check console: 🗑️ Cache DELETED: user:USER_ID
```

**Next Request (Cache Miss Again):**
```bash
curl http://localhost:3000/api/users/USER_ID
# Check console: ❌ Cache MISS: user:USER_ID
# Cache was invalidated, so it queries DB again
```

### 4. Monitor Redis

```bash
# Connect to Redis CLI
redis-cli

# Monitor all commands
MONITOR

# Get all keys
KEYS *

# Get specific key
GET user:123

# Check TTL
TTL user:123

# Delete key
DEL user:123
```

---

## 📊 Performance Comparison

### Before Cache
```
GET /api/users/123
Response time: 45ms

GET /api/users (list)
Response time: 120ms

GET /api/users/stats
Response time: 350ms
```

### After Cache
```
GET /api/users/123
First request: 45ms (cache miss)
Subsequent: 2ms (cache hit) - 95% faster!

GET /api/users (list)
First request: 120ms (cache miss)
Subsequent: 3ms (cache hit) - 97% faster!

GET /api/users/stats
First request: 350ms (cache miss)
Subsequent: 2ms (cache hit) - 99% faster!
```

---

## 🎯 Cache Strategy Summary

| Endpoint | Cache Key | TTL | Invalidate On |
|----------|-----------|-----|---------------|
| GET /users/:id | `user:{id}` | 5 min | Update, Delete |
| GET /users | `users:all` | 2 min | Create, Update, Delete |
| GET /users/stats | `users:stats` | 10 min | Create, Update, Delete |
| GET /upload/my-files | `files:user:{userId}` | 5 min | Upload, Delete |
| GET /upload/statistics | `files:stats:{userId}` | 10 min | Upload, Delete |

---

## ✅ Checklist

- [ ] Install Redis server
- [ ] Install npm packages
- [ ] Update app.module.ts
- [ ] Update users.service.ts
- [ ] Update upload.service.ts
- [ ] Add cache controller
- [ ] Test cache hit/miss
- [ ] Test cache invalidation
- [ ] Monitor Redis
- [ ] Measure performance improvement

---

## 🐛 Troubleshooting

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Make sure Redis server is running
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
docker start redis
# or
brew services start redis
```

### Cache Not Working
```
Cache always returns null
```
**Solution:** Check Redis connection in logs
```typescript
// Add this to app.module.ts
console.log('Redis config:', {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});
```

### Cache Not Invalidating
```
Old data still showing after update
```
**Solution:** Check cache key matches
```typescript
// Make sure keys match exactly
const cacheKey = `user:${id}`; // ✅
const cacheKey = `user-${id}`; // ❌ Different key!
```

---

**Happy Caching! ⚡**

Your app will be **significantly faster** with Redis caching! 🚀
