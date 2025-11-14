# ⚡ Redis Caching - Complete Guide

## 📋 Redis Là Gì?

**Redis** (Remote Dictionary Server) là một **in-memory data store** - cơ sở dữ liệu lưu trữ dữ liệu trong RAM.

### Tại Sao Dùng Redis?
- ⚡ **Cực nhanh** - Đọc/ghi trong RAM (microseconds)
- 💾 **Key-Value Store** - Đơn giản, dễ sử dụng
- 🔄 **TTL (Time To Live)** - Tự động xóa data hết hạn
- 📊 **Data Structures** - String, Hash, List, Set, Sorted Set
- 🔒 **Atomic Operations** - Thread-safe
- 📈 **Scalable** - Dễ scale horizontal

### Use Cases
1. **Caching** - Cache database queries, API responses
2. **Session Storage** - Lưu user sessions
3. **Rate Limiting** - Giới hạn requests
4. **Real-time Analytics** - Đếm views, likes
5. **Message Queue** - Pub/Sub messaging
6. **Leaderboards** - Sorted sets

---

## 🎯 Caching Strategy

### 1. Cache-Aside (Lazy Loading)
```
┌─────────┐      ┌─────────┐      ┌──────────┐
│  App    │─────▶│  Cache  │─────▶│ Database │
└─────────┘      └─────────┘      └──────────┘
     │                │                  │
     │  1. Check      │                  │
     │────────────────▶                  │
     │                │                  │
     │  2. Miss       │                  │
     │◀────────────────                  │
     │                                   │
     │  3. Query                         │
     │───────────────────────────────────▶
     │                                   │
     │  4. Return Data                   │
     │◀───────────────────────────────────
     │                                   │
     │  5. Store in Cache                │
     │────────────────▶                  │
```

**Flow:**
1. App check cache trước
2. Nếu **cache hit** → return data
3. Nếu **cache miss** → query database
4. Lưu data vào cache
5. Return data

**Ưu điểm:**
- ✅ Chỉ cache data được request
- ✅ Cache failure không ảnh hưởng app

**Nhược điểm:**
- ❌ First request luôn chậm (cache miss)
- ❌ Phải handle cache invalidation

### 2. Write-Through
```
┌─────────┐      ┌─────────┐      ┌──────────┐
│  App    │─────▶│  Cache  │─────▶│ Database │
└─────────┘      └─────────┘      └──────────┘
     │                │                  │
     │  1. Write      │                  │
     │────────────────▶                  │
     │                │  2. Write        │
     │                │──────────────────▶
     │                │                  │
     │                │  3. Confirm      │
     │                │◀──────────────────
     │  4. Confirm    │                  │
     │◀────────────────                  │
```

**Flow:**
1. Write vào cache trước
2. Cache write vào database
3. Confirm khi cả 2 thành công

**Ưu điểm:**
- ✅ Cache luôn consistent với DB
- ✅ Read luôn nhanh

**Nhược điểm:**
- ❌ Write chậm hơn
- ❌ Cache nhiều data không dùng

### 3. Write-Behind (Write-Back)
```
┌─────────┐      ┌─────────┐      ┌──────────┐
│  App    │─────▶│  Cache  │      │ Database │
└─────────┘      └─────────┘      └──────────┘
     │                │                  │
     │  1. Write      │                  │
     │────────────────▶                  │
     │                │                  │
     │  2. Confirm    │                  │
     │◀────────────────                  │
     │                │                  │
     │                │  3. Async Write  │
     │                │──────────────────▶
```

**Flow:**
1. Write vào cache
2. Return ngay (async)
3. Cache write vào DB sau (background)

**Ưu điểm:**
- ✅ Write cực nhanh
- ✅ Giảm DB load

**Nhược điểm:**
- ❌ Risk mất data nếu cache crash
- ❌ Complex implementation

---

## 🚀 Setup Redis với NestJS

### 1. Install Dependencies

```bash
npm install cache-manager cache-manager-redis-store
npm install --save-dev @types/cache-manager
```

### 2. Install Redis Server

**Windows:**
```bash
# Download Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# Or use Docker
docker run -d -p 6379:6379 --name redis redis:alpine
```

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

### 3. Configure Cache Module

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // Available in all modules
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 60, // Default TTL: 60 seconds
      max: 100, // Maximum number of items in cache
    }),
  ],
})
export class AppModule {}
```

### 4. Environment Variables

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

---

## 💻 Implementation Examples

### Example 1: Cache User Data

```typescript
// users.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersRepository: UsersRepository,
  ) {}

  async findOne(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    
    // 1. Check cache
    const cached = await this.cacheManager.get<User>(cacheKey);
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
    
    // 3. Store in cache (5 minutes)
    await this.cacheManager.set(cacheKey, user, 300);
    
    return user;
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.update(id, updateDto);
    
    // Invalidate cache
    const cacheKey = `user:${id}`;
    await this.cacheManager.del(cacheKey);
    
    console.log('🗑️ Cache DELETED:', cacheKey);
    
    return user;
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.remove(id);
    
    // Invalidate cache
    await this.cacheManager.del(`user:${id}`);
  }
}
```

### Example 2: Cache List with Pagination

```typescript
async findAll(page: number = 1, limit: number = 10): Promise<any> {
  const cacheKey = `users:list:${page}:${limit}`;
  
  // Check cache
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) {
    console.log('✅ Cache HIT:', cacheKey);
    return cached;
  }
  
  console.log('❌ Cache MISS:', cacheKey);
  
  // Query database
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    this.userModel.find().skip(skip).limit(limit).exec(),
    this.userModel.countDocuments(),
  ]);
  
  const result = {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
  
  // Cache for 2 minutes
  await this.cacheManager.set(cacheKey, result, 120);
  
  return result;
}

// Invalidate all list caches when data changes
async create(createDto: CreateUserDto): Promise<User> {
  const user = await this.usersRepository.create(createDto);
  
  // Clear all list caches
  await this.clearListCache();
  
  return user;
}

private async clearListCache(): Promise<void> {
  // Get all keys matching pattern
  const keys = await this.cacheManager.store.keys('users:list:*');
  
  // Delete all matching keys
  await Promise.all(keys.map(key => this.cacheManager.del(key)));
  
  console.log('🗑️ Cleared list cache:', keys.length, 'keys');
}
```

### Example 3: Cache Decorator

```typescript
// decorators/cache-result.decorator.ts
export function CacheResult(ttl: number = 60) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      // Check cache
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        console.log('✅ Cache HIT:', cacheKey);
        return cached;
      }
      
      console.log('❌ Cache MISS:', cacheKey);
      
      // Execute method
      const result = await originalMethod.apply(this, args);
      
      // Store in cache
      await this.cacheManager.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// Usage
@Injectable()
export class UsersService {
  @CacheResult(300) // Cache 5 minutes
  async getExpensiveData(userId: string) {
    // Heavy computation or slow query
    const data = await this.performExpensiveOperation(userId);
    return data;
  }
}
```

### Example 4: Cache Statistics

```typescript
async getStatistics(): Promise<any> {
  const cacheKey = 'statistics:dashboard';
  
  const cached = await this.cacheManager.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Heavy aggregation queries
  const [totalUsers, totalFiles, usersByRole, filesByType] = await Promise.all([
    this.userModel.countDocuments(),
    this.fileModel.countDocuments(),
    this.getUsersByRole(),
    this.getFilesByType(),
  ]);
  
  const stats = {
    totalUsers,
    totalFiles,
    usersByRole,
    filesByType,
    generatedAt: new Date(),
  };
  
  // Cache for 10 minutes
  await this.cacheManager.set(cacheKey, stats, 600);
  
  return stats;
}
```

---

## 🎨 Advanced Patterns

### 1. Cache Warming

```typescript
// Preload cache with frequently accessed data
@Injectable()
export class CacheWarmingService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private usersService: UsersService,
  ) {}

  @Cron('0 */6 * * *') // Every 6 hours
  async warmCache() {
    console.log('🔥 Warming cache...');
    
    // Get top 100 most accessed users
    const topUsers = await this.getTopUsers(100);
    
    for (const user of topUsers) {
      const cacheKey = `user:${user._id}`;
      await this.cacheManager.set(cacheKey, user, 3600);
    }
    
    console.log('✅ Cache warmed:', topUsers.length, 'users');
  }
}
```

### 2. Cache Stampede Prevention

```typescript
// Prevent multiple requests from hitting DB simultaneously
private locks = new Map<string, Promise<any>>();

async findOne(id: string): Promise<User> {
  const cacheKey = `user:${id}`;
  
  // Check cache
  const cached = await this.cacheManager.get<User>(cacheKey);
  if (cached) return cached;
  
  // Check if another request is already loading this data
  if (this.locks.has(cacheKey)) {
    console.log('⏳ Waiting for lock:', cacheKey);
    return this.locks.get(cacheKey);
  }
  
  // Create lock
  const promise = this.loadAndCache(id, cacheKey);
  this.locks.set(cacheKey, promise);
  
  try {
    return await promise;
  } finally {
    this.locks.delete(cacheKey);
  }
}

private async loadAndCache(id: string, cacheKey: string): Promise<User> {
  const user = await this.usersRepository.findById(id);
  await this.cacheManager.set(cacheKey, user, 300);
  return user;
}
```

### 3. Multi-Level Caching

```typescript
// L1: In-memory cache (fast, small)
// L2: Redis cache (slower, larger)
@Injectable()
export class MultiLevelCacheService {
  private l1Cache = new Map<string, any>();
  
  constructor(
    @Inject(CACHE_MANAGER) private l2Cache: Cache,
  ) {}

  async get(key: string): Promise<any> {
    // Check L1 cache
    if (this.l1Cache.has(key)) {
      console.log('✅ L1 Cache HIT:', key);
      return this.l1Cache.get(key);
    }
    
    // Check L2 cache
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      console.log('✅ L2 Cache HIT:', key);
      // Promote to L1
      this.l1Cache.set(key, l2Value);
      return l2Value;
    }
    
    console.log('❌ Cache MISS:', key);
    return null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    // Store in both levels
    this.l1Cache.set(key, value);
    await this.l2Cache.set(key, value, ttl);
  }
}
```

---

## 📊 Monitoring & Debugging

### 1. Cache Hit Rate

```typescript
@Injectable()
export class CacheMetricsService {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  }

  getMetrics() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate().toFixed(2) + '%',
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

// Usage in service
const cached = await this.cacheManager.get(key);
if (cached) {
  this.metricsService.recordHit();
  return cached;
}
this.metricsService.recordMiss();
```

### 2. Cache Size Monitoring

```typescript
@Cron('*/5 * * * *') // Every 5 minutes
async monitorCacheSize() {
  const keys = await this.cacheManager.store.keys('*');
  const size = keys.length;
  
  console.log('📊 Cache size:', size, 'keys');
  
  if (size > 10000) {
    console.warn('⚠️ Cache size exceeds threshold!');
    // Trigger cleanup or alert
  }
}
```

### 3. Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Get all keys
KEYS *

# Get specific key
GET user:123

# Check TTL
TTL user:123

# Delete key
DEL user:123

# Clear all cache
FLUSHALL

# Get info
INFO

# Monitor commands
MONITOR
```

---

## ⚡ Performance Comparison

### Without Cache
```
Request 1: 250ms (DB query)
Request 2: 245ms (DB query)
Request 3: 248ms (DB query)
Average: 247ms
```

### With Cache
```
Request 1: 250ms (DB query + cache store)
Request 2: 2ms   (Cache hit)
Request 3: 2ms   (Cache hit)
Average: 85ms (65% faster!)
```

### Real-World Impact
```
1000 requests/second
Without cache: 247,000ms = 247 seconds
With cache:     85,000ms = 85 seconds
Saved: 162 seconds (65% improvement)
```

---

## 🎯 Best Practices

### 1. Cache Key Naming
```typescript
// ✅ GOOD: Descriptive, hierarchical
'user:123'
'user:123:profile'
'users:list:page:1:limit:10'
'statistics:dashboard:2024-01-15'

// ❌ BAD: Unclear, hard to manage
'u123'
'data'
'temp'
```

### 2. TTL Strategy
```typescript
// Short TTL for frequently changing data
await cache.set('user:online', data, 30); // 30 seconds

// Medium TTL for semi-static data
await cache.set('user:profile', data, 300); // 5 minutes

// Long TTL for static data
await cache.set('config:app', data, 3600); // 1 hour

// Very long TTL for rarely changing data
await cache.set('categories', data, 86400); // 24 hours
```

### 3. Cache Invalidation
```typescript
// Invalidate on update
async update(id: string, dto: UpdateDto) {
  const result = await this.repository.update(id, dto);
  await this.cache.del(`user:${id}`);
  return result;
}

// Invalidate related caches
async updateUser(id: string, dto: UpdateDto) {
  const result = await this.repository.update(id, dto);
  
  // Invalidate user cache
  await this.cache.del(`user:${id}`);
  
  // Invalidate user's posts cache
  await this.cache.del(`user:${id}:posts`);
  
  // Invalidate list caches
  await this.clearListCache();
  
  return result;
}
```

### 4. Error Handling
```typescript
async findOne(id: string): Promise<User> {
  try {
    const cached = await this.cacheManager.get(`user:${id}`);
    if (cached) return cached;
  } catch (error) {
    // Log error but don't fail
    console.error('Cache error:', error);
    // Continue to database query
  }
  
  const user = await this.repository.findById(id);
  
  try {
    await this.cacheManager.set(`user:${id}`, user, 300);
  } catch (error) {
    // Log error but don't fail
    console.error('Cache set error:', error);
  }
  
  return user;
}
```

---

## 🚀 Implementation Checklist

- [ ] Install Redis server
- [ ] Install npm packages
- [ ] Configure CacheModule
- [ ] Implement cache in services
- [ ] Add cache invalidation
- [ ] Monitor cache hit rate
- [ ] Set appropriate TTLs
- [ ] Handle cache errors
- [ ] Test cache behavior
- [ ] Document cache strategy

---

## 📚 Resources

- [Redis Documentation](https://redis.io/documentation)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [Cache-Manager](https://github.com/node-cache-manager/node-cache-manager)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Happy Caching! ⚡**
