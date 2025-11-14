import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, UpdateQuery, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { IUsersRepository } from './interfaces/users-repository.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
  // implements IUsersRepository = Class này phải có đầy đủ methods trong interface
  // TypeScript sẽ báo lỗi nếu thiếu method nào
  // Repository chứa TẤT CẢ logic truy vấn database
  // Service chỉ gọi Repository, không trực tiếp dùng Model
  
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // ==================== CREATE ====================
  async create(userData: Partial<User>): Promise<User> {
    // Partial<User> = Một phần properties của User
    const createdUser = new this.userModel(userData);
    return await createdUser.save();
  }

  // ==================== FIND ALL ====================
  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  // ==================== FIND BY ID ====================
  async findById(id: string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  // ==================== FIND ONE BY CONDITION ====================
  async findOne(filter: FilterQuery<User>): Promise<User | null> {
    // FilterQuery<User> = Điều kiện query MongoDB
    // Ví dụ: { email: 'test@test.com' }
    return await this.userModel.findOne(filter).exec();
  }

  // ==================== FIND BY EMAIL ====================
  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  // ==================== UPDATE BY ID ====================
  async updateById(
    id: string,
    updateData: UpdateQuery<User>,
  ): Promise<User | null> {
    // UpdateQuery<User> = Dữ liệu update
    return await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  // ==================== DELETE BY ID ====================
  async deleteById(id: string): Promise<User | null> {
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  // ==================== COUNT ====================
  async count(filter: FilterQuery<User> = {}): Promise<number> {
    return await this.userModel.countDocuments(filter).exec();
  }

  // ==================== FIND WITH PAGINATION ====================
  async findWithPagination(
    filter: FilterQuery<User>,
    page: number = 1,
    limit: number = 10,
  ): Promise<User[]> {
    const skip = (page - 1) * limit;
    return await this.userModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
      .exec();
  }

  // ==================== AGGREGATE (Như ví dụ của bạn) ====================
  async findByCondition(filterOptions: FilterQuery<User>): Promise<any[]> {
    const aggregationPipeline: any[] = [
      { $match: filterOptions },
      { $sort: { createdAt: 1 as 1, _id: 1 as 1 } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          age: 1,
          createdAt: 1,
        },
      },
    ];

    return await this.userModel.aggregate(aggregationPipeline).exec();
  }

  // ==================== SEARCH BY NAME ====================
  async searchByName(keyword: string): Promise<User[]> {
    return await this.userModel
      .find({
        name: { $regex: keyword, $options: 'i' }, // Case-insensitive search
      })
      .exec();
  }

  // ==================== FIND BY AGE RANGE ====================
  async findByAgeRange(minAge: number, maxAge: number): Promise<User[]> {
    return await this.userModel
      .find({
        age: { $gte: minAge, $lte: maxAge },
      })
      .exec();
  }

  // ==================== EXISTS ====================
  async exists(filter: FilterQuery<User>): Promise<boolean> {
    const count = await this.userModel.countDocuments(filter).exec();
    return count > 0;
  }

  // ==================== LOOKUP: USER WITH FILES ====================
  async findUserWithFiles(userId: string): Promise<any> {
    return await this.userModel.aggregate([
      // Bước 1: Lọc user theo ID
      {
        $match: { _id: new Types.ObjectId(userId) }
      },
      
      // Bước 2: JOIN với collection files
      {
        $lookup: {
          from: "files",              // Collection files
          localField: "_id",          // users._id
          foreignField: "uploadedBy", // files.uploadedBy
          as: "uploadedFiles"         // Kết quả lưu vào uploadedFiles
        }
      },
      
      // Bước 3: Thêm thông tin tổng hợp
      {
        $addFields: {
          totalFiles: { $size: "$uploadedFiles" },
          totalSize: { $sum: "$uploadedFiles.size" },
          totalSizeMB: { 
            $round: [{ $divide: [{ $sum: "$uploadedFiles.size" }, 1048576] }, 2] 
          }
        }
      },
      
      // Bước 4: Loại bỏ password
      {
        $project: {
          password: 0,
          refreshToken: 0
        }
      }
    ]).exec();
  }

  // ==================== LOOKUP: ALL USERS WITH FILE STATS ====================
  async findAllUsersWithFileStats(): Promise<any[]> {
    return await this.userModel.aggregate([
      // JOIN với files
      {
        $lookup: {
          from: "files",
          localField: "_id",
          foreignField: "uploadedBy",
          as: "files"
        }
      },
      
      // Tính toán thống kê
      {
        $addFields: {
          totalFiles: { $size: "$files" },
          totalSize: { $sum: "$files.size" },
          totalSizeMB: { 
            $round: [{ $divide: [{ $sum: "$files.size" }, 1048576] }, 2] 
          }
        }
      },
      
      // Chỉ lấy fields cần thiết
      {
        $project: {
          name: 1,
          email: 1,
          roles: 1,
          totalFiles: 1,
          totalSize: 1,
          totalSizeMB: 1,
          createdAt: 1
        }
      },
      
      // Sắp xếp theo số files giảm dần
      {
        $sort: { totalFiles: -1 as -1 }
      }
    ]).exec();
  }
}
