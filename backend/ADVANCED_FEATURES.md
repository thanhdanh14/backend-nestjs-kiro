# 🚀 Advanced Features - Có Thể Implement Ngay

## 1. 📊 Pagination & Filtering cho Users

### Backend Implementation

```typescript
// users.controller.ts
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('search') search?: string,
  @Query('role') role?: string,
  @Query('sortBy') sortBy: string = 'createdAt',
  @Query('order') order: 'asc' | 'desc' = 'desc',
) {
  return this.usersService.findAllPaginated({
    page: Number(page),
    limit: Number(limit),
    search,
    role,
    sortBy,
    order,
  });
}

// users.service.ts
async findAllPaginated(options: PaginationOptions) {
  const { page, limit, search, role, sortBy, order } = options;
  const skip = (page - 1) * limit;

  // Build query
  const query: any = {};
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }
  if (role) {
    query.roles = role;
  }

  // Build sort
  const sort: any = {};
  sort[sortBy] = order === 'asc' ? 1 : -1;

  // Execute query
  const [data, total] = await Promise.all([
    this.userModel
      .find(query)
      .select('-password -refreshToken')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.userModel.countDocuments(query),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}
```

### Frontend Implementation

```typescript
// Ant Design Table với server-side pagination
const [pagination, setPagination] = useState({
  current: 1,
  pageSize: 10,
  total: 0,
});

const fetchUsers = async (page = 1, pageSize = 10, filters = {}) => {
  const response = await axiosInstance.get('/users', {
    params: { page, limit: pageSize, ...filters },
  });
  
  setUsers(response.data.data);
  setPagination({
    current: response.data.meta.page,
    pageSize: response.data.meta.limit,
    total: response.data.meta.total,
  });
};

<Table
  dataSource={users}
  pagination={pagination}
  onChange={(newPagination) => {
    fetchUsers(newPagination.current, newPagination.pageSize);
  }}
/>
```

---

## 2. 🔍 Advanced Search với Elasticsearch

### Setup

```bash
npm install @nestjs/elasticsearch @elastic/elasticsearch
```

### Implementation

```typescript
// search.module.ts
@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

// search.service.ts
@Injectable()
export class SearchService {
  constructor(private elasticsearchService: ElasticsearchService) {}

  async indexUser(user: User) {
    return this.elasticsearchService.index({
      index: 'users',
      id: user._id.toString(),
      body: {
        name: user.name,
        email: user.email,
        roles: user.roles,
      },
    });
  }

  async searchUsers(query: string) {
    const { body } = await this.elasticsearchService.search({
      index: 'users',
      body: {
        query: {
          multi_match: {
            query,
            fields: ['name^2', 'email'], // name có weight cao hơn
            fuzziness: 'AUTO', // Cho phép typo
          },
        },
      },
    });

    return body.hits.hits.map((hit) => hit._source);
  }
}
```

---

## 3. 📧 Email Queue với Bull

### Setup

```bash
npm install @nestjs/bull bull
npm install --save-dev @types/bull
```

### Implementation

```typescript
// app.module.ts
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
})

// email.processor.ts
@Processor('email')
export class EmailProcessor {
  constructor(private mailService: MailService) {}

  @Process('send-otp')
  async handleSendOtp(job: Job) {
    const { email, name, otpCode } = job.data;
    await this.mailService.sendOtpEmail(email, name, otpCode);
  }

  @Process('send-welcome')
  async handleSendWelcome(job: Job) {
    const { email, name } = job.data;
    await this.mailService.sendWelcomeEmail(email, name);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    console.log(`✅ Job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    console.error(`❌ Job ${job.id} failed:`, error.message);
  }
}

// auth.service.ts
constructor(
  @InjectQueue('email') private emailQueue: Queue,
) {}

async sendOtp(email: string, name: string, otpCode: string) {
  // Thêm vào queue thay vì gửi trực tiếp
  await this.emailQueue.add('send-otp', {
    email,
    name,
    otpCode,
  }, {
    attempts: 3, // Retry 3 lần nếu fail
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}
```

---

## 4. ⚡ Redis Caching

### Setup

```bash
npm install cache-manager cache-manager-redis-store
npm install --save-dev @types/cache-manager
```

### Implementation

```typescript
// app.module.ts
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 60, // seconds
    }),
  ],
})

// users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findOne(id: string) {
    // Check cache first
    const cacheKey = `user_${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      console.log('✅ Cache hit!');
      return cached;
    }

    // Cache miss - query database
    console.log('❌ Cache miss - querying database');
    const user = await this.userRepository.findById(id);
    
    // Store in cache
    await this.cacheManager.set(cacheKey, user, { ttl: 300 }); // 5 minutes
    
    return user;
  }

  async update(id: string, updateDto: UpdateUserDto) {
    const user = await this.userRepository.update(id, updateDto);
    
    // Invalidate cache
    await this.cacheManager.del(`user_${id}`);
    
    return user;
  }
}

// Cache decorator
export function CacheResult(ttl: number = 60) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}_${JSON.stringify(args)}`;
      const cached = await this.cacheManager.get(cacheKey);

      if (cached) return cached;

      const result = await originalMethod.apply(this, args);
      await this.cacheManager.set(cacheKey, result, { ttl });

      return result;
    };

    return descriptor;
  };
}

// Usage
@CacheResult(300) // Cache 5 minutes
async getExpensiveData() {
  // Heavy computation
  return result;
}
```

---

## 5. 📊 Analytics & Statistics

### Implementation

```typescript
// analytics.service.ts
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UploadedFile.name) private fileModel: Model<UploadedFile>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalFiles,
      totalFileSize,
      newUsersThisMonth,
      usersByRole,
      filesByType,
      uploadTrend,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.fileModel.countDocuments({ status: 'active' }),
      this.getTotalFileSize(),
      this.getNewUsersThisMonth(),
      this.getUsersByRole(),
      this.getFilesByType(),
      this.getUploadTrend(),
    ]);

    return {
      totalUsers,
      totalFiles,
      totalFileSize,
      newUsersThisMonth,
      usersByRole,
      filesByType,
      uploadTrend,
    };
  }

  private async getTotalFileSize() {
    const result = await this.fileModel.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$size' } } },
    ]);
    return result[0]?.total || 0;
  }

  private async getNewUsersThisMonth() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return this.userModel.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
  }

  private async getUsersByRole() {
    return this.userModel.aggregate([
      { $unwind: '$roles' },
      { $group: { _id: '$roles', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
    ]);
  }

  private async getFilesByType() {
    return this.fileModel.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: {
            $arrayElemAt: [{ $split: ['$mimetype', '/'] }, 0],
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
        },
      },
      { $project: { type: '$_id', count: 1, totalSize: 1, _id: 0 } },
    ]);
  }

  private async getUploadTrend() {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    return this.fileModel.aggregate([
      { $match: { createdAt: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);
  }
}
```

---

## 6. 🔔 Real-time Notifications với WebSocket

### Setup

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install --save-dev @types/socket.io
```

### Implementation

```typescript
// notifications.gateway.ts
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  // User connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // User disconnects
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Send notification to specific user
  sendToUser(userId: string, notification: any) {
    this.server.to(userId).emit('notification', notification);
  }

  // Broadcast to all users
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // User joins their room
  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(userId);
    console.log(`User ${userId} joined their room`);
  }
}

// Usage in service
@Injectable()
export class UsersService {
  constructor(
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.create(createUserDto);
    
    // Send real-time notification
    this.notificationsGateway.broadcast('user-created', {
      message: `New user ${user.name} joined!`,
      user: user,
    });
    
    return user;
  }
}
```

### Frontend (React)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

useEffect(() => {
  // Join user's room
  socket.emit('join', user._id);

  // Listen for notifications
  socket.on('notification', (data) => {
    message.info(data.message);
  });

  // Listen for new users
  socket.on('user-created', (data) => {
    notification.success({
      message: 'New User',
      description: data.message,
    });
  });

  return () => {
    socket.disconnect();
  };
}, []);
```

---

## 7. 📝 Audit Log

### Implementation

```typescript
// audit-log.schema.ts
@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  action: string; // 'CREATE', 'UPDATE', 'DELETE'

  @Prop({ required: true })
  entity: string; // 'User', 'File'

  @Prop({ required: true })
  entityId: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  performedBy: Types.ObjectId;

  @Prop({ type: Object })
  oldValue?: any;

  @Prop({ type: Object })
  newValue?: any;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;
}

// audit-log.service.ts
@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  async log(data: CreateAuditLogDto) {
    return this.auditLogModel.create(data);
  }

  async getEntityHistory(entity: string, entityId: string) {
    return this.auditLogModel
      .find({ entity, entityId })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });
  }
}

// Decorator
export function AuditLog(action: string, entity: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Log the action
      await this.auditLogService.log({
        action,
        entity,
        entityId: result._id,
        performedBy: this.currentUser?._id,
        newValue: result,
      });

      return result;
    };

    return descriptor;
  };
}

// Usage
@AuditLog('UPDATE', 'User')
async update(id: string, updateDto: UpdateUserDto) {
  return this.userRepository.update(id, updateDto);
}
```

---

## 8. 🔐 Two-Factor Authentication (TOTP)

### Setup

```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### Implementation

```typescript
// auth.service.ts
async enable2FA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: 'My App',
    length: 32,
  });

  await this.userRepository.updateById(userId, {
    twoFactorSecret: secret.base32,
    twoFactorEnabled: false, // Will be enabled after verification
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauthUrl);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
  };
}

async verify2FA(userId: string, token: string) {
  const user = await this.userRepository.findById(userId);
  
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
  });

  if (verified) {
    await this.userRepository.updateById(userId, {
      twoFactorEnabled: true,
    });
  }

  return verified;
}

async validate2FAToken(userId: string, token: string) {
  const user = await this.userRepository.findById(userId);
  
  return speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
}
```

---

## 🎯 Kết Luận

Đây là những tính năng **nâng cao** bạn có thể implement:

1. ✅ **Pagination & Filtering** - Dễ implement ngay
2. ⚡ **Redis Caching** - Tăng performance đáng kể
3. 📬 **Email Queue** - Xử lý email async
4. 🔍 **Elasticsearch** - Search mạnh mẽ
5. 📊 **Analytics** - Dashboard statistics
6. 🔔 **WebSocket** - Real-time notifications
7. 📝 **Audit Log** - Track all changes
8. 🔐 **2FA TOTP** - Security cao hơn

**Bắt đầu từ đâu?**
1. Pagination & Filtering (dễ nhất)
2. Redis Caching (performance boost)
3. Email Queue (better UX)
4. WebSocket (real-time features)

**Happy Coding! 🚀**
