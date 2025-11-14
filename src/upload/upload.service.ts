import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UploadedFile, UploadedFileDocument } from './schemas/file.schema';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(UploadedFile.name) private fileModel: Model<UploadedFileDocument>,
  ) {}

  // ==================== LƯU FILE INFO VÀO DATABASE ====================
  async saveFileInfo(
    file: Express.Multer.File,
    userId: string,
  ): Promise<any> {
    const fileInfo = await this.fileModel.create({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: userId,
      status: 'active',
    });

    return fileInfo;
  }

  // ==================== LƯU NHIỀU FILES ====================
  async saveMultipleFiles(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<any[]> {
    const fileInfos = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedBy: userId,
      status: 'active',
    }));

    return await this.fileModel.insertMany(fileInfos);
  }

  // ==================== LẤY TẤT CẢ FILES CỦA USER ====================
  async getUserFiles(userId: string): Promise<any[]> {
    return await this.fileModel
      .find({ uploadedBy: userId, status: 'active' })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ==================== LẤY FILE THEO ID ====================
  async getFileById(fileId: string): Promise<any> {
    const file = await this.fileModel.findById(fileId).exec();
    if (!file) {
      throw new NotFoundException('File không tồn tại');
    }
    return file; 
  } 

  // ==================== XÓA FILE (SOFT DELETE) ====================
  async deleteFile(fileId: string, userId: string): Promise<{ message: string }> {
    const file = await this.fileModel.findOne({
      _id: fileId,
      uploadedBy: userId,
    });

    if (!file) {
      throw new NotFoundException('File không tồn tại hoặc bạn không có quyền xóa');
    }

    // Soft delete
    await this.fileModel.updateOne(
      { _id: fileId },
      { status: 'deleted' },
    );

    return { message: 'Đã xóa file thành công' };
  }

  // ==================== XÓA FILE THẬT (HARD DELETE) ====================
  async hardDeleteFile(fileId: string, userId: string): Promise<{ message: string }> {
    const file = await this.fileModel.findOne({
      _id: fileId,
      uploadedBy: userId,
    });

    if (!file) {
      throw new NotFoundException('File không tồn tại hoặc bạn không có quyền xóa');
    }

    // Xóa file vật lý
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Xóa record trong database
    await this.fileModel.deleteOne({ _id: fileId });

    return { message: 'Đã xóa file vĩnh viễn' };
  }

  // ==================== LẤY THỐNG KÊ ====================
  async getStatistics(userId: string) {
    const files = await this.fileModel.find({
      uploadedBy: userId,
      status: 'active',
    });

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalFiles = files.length;

    // Group by mimetype
    const byType = files.reduce((acc, file) => {
      const type = file.mimetype.split('/')[0]; // image, video, etc.
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      byType,
    };
  }

  // ==================== LOOKUP: FILE WITH USER INFO ====================
  async findFileWithUser(fileId: string): Promise<any> {
    const result = await this.fileModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(fileId) }
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploader"
        }
      },
      {
        $unwind: {
          path: "$uploader",
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          "uploader.password": 0,
          "uploader.refreshToken": 0
        }
      }
    ]).exec();

    return result[0] || null;
  }

  // ==================== LOOKUP: FILES GALLERY WITH UPLOADER ====================
  async getFilesGallery(page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    
    const files = await this.fileModel.aggregate([
      {
        $match: { status: "active" }
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploader"
        }
      },
      {
        $unwind: {
          path: "$uploader",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          filename: 1,
          originalName: 1,
          size: 1,
          mimetype: 1,
          createdAt: 1,
          "uploader.name": 1,
          "uploader.email": 1
        }
      },
      {
        $sort: { createdAt: -1 as -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]).exec();
    
    const total = await this.fileModel.countDocuments({ status: "active" });
    
    return {
      files,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}
