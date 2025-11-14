import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
  Get,
  Param,
  Res,
  Delete,
  Query,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from './upload.service';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
  // ==================== UPLOAD 1 FILE ====================
  @Post('single')
  @ApiOperation({ summary: 'Upload 1 file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      // FileInterceptor('file') = Tên field trong form-data
      
      storage: diskStorage({
        // diskStorage = Lưu file vào disk
        
        destination: './uploads',
        // Thư mục lưu file
        
        filename: (req, file, callback) => {
          // Custom tên file
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, filename);
          // Kết quả: file-1699876543-123456789.jpg
        },
      }),
      
      fileFilter: (req, file, callback) => {
        // Validate file type
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true); // Accept file
        } else {
          callback(
            new BadRequestException('Chỉ chấp nhận file ảnh (jpg, png, gif)'),
            false,
          );
        }
      },
      
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('Không có file nào được upload');
    }

    // Lưu file info vào database
    const fileInfo = await this.uploadService.saveFileInfo(file, user._id);

    return {
      message: 'Upload thành công',
      file: {
        id: fileInfo._id,
        originalName: fileInfo.originalName,
        filename: fileInfo.filename,
        path: fileInfo.path,
        size: fileInfo.size,
        mimetype: fileInfo.mimetype,
        url: `http://localhost:3000/upload/${fileInfo.filename}`,
      },
      uploadedBy: user.email,
    };
  }

  // ==================== UPLOAD NHIỀU FILES ====================
  @Post('multiple')
  @ApiOperation({ summary: 'Upload nhiều files (tối đa 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // FilesInterceptor('files', 10) = Upload tối đa 10 files
      
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      
      fileFilter: (req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Chỉ chấp nhận file ảnh'),
            false,
          );
        }
      },
      
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được upload');
    }

    // Lưu tất cả files vào database
    const fileInfos = await this.uploadService.saveMultipleFiles(files, user._id);

    return {
      message: `Upload thành công ${files.length} files`,
      files: fileInfos.map((fileInfo) => ({
        id: fileInfo._id,
        originalName: fileInfo.originalName,
        filename: fileInfo.filename,
        size: fileInfo.size,
        url: `http://localhost:3000/upload/${fileInfo.filename}`,
      })),
      uploadedBy: user.email,
    };
  }

  // ==================== UPLOAD NHIỀU FIELDS ====================
  @Post('fields')
  @ApiOperation({ summary: 'Upload files từ nhiều fields khác nhau' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'photos', maxCount: 5 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          },
        }),
        limits: {
          fileSize: 5 * 1024 * 1024,
        },
      },
    ),
  )
  uploadFields(
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      photos?: Express.Multer.File[];
    },
    @CurrentUser() user: any,
  ) {
    return {
      message: 'Upload thành công',
      avatar: files.avatar?.[0]
        ? {
            originalName: files.avatar[0].originalname,
            filename: files.avatar[0].filename,
            path: files.avatar[0].path,
          }
        : null,
      photos: files.photos?.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
      })),
      uploadedBy: user.email,
    };
  }

  // ==================== XEM FILE ====================
  @Get('view/:filename')
  @ApiOperation({ summary: 'Xem file đã upload' })
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(filename, { root: './uploads' });
  }

  // ==================== LẤY DANH SÁCH FILES CỦA USER ====================
  @Get('my-files')
  @ApiOperation({ summary: 'Lấy tất cả files của user hiện tại' })
  async getMyFiles(@CurrentUser() user: any) {
    const files = await this.uploadService.getUserFiles(user._id);
    return {
      total: files.length,
      files: files.map((file) => ({
        id: file._id,
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: `http://localhost:3000/upload/view/${file.filename}`,
        uploadedAt: (file as any).createdAt,
      })),
    };
  }

  // ==================== LẤY THỐNG KÊ ====================
  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê files của user' })
  async getStatistics(@CurrentUser() user: any) {
    return await this.uploadService.getStatistics(user._id);
  }

  // ==================== XÓA FILE (SOFT DELETE) ====================
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa file (soft delete)' })
  async deleteFile(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.uploadService.deleteFile(id, user._id);
  }

  // ==================== XÓA FILE VĨNH VIỄN ====================
  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Xóa file vĩnh viễn (hard delete)' })
  async hardDeleteFile(@Param('id') id: string, @CurrentUser() user: any) {
    return await this.uploadService.hardDeleteFile(id, user._id);
  }

  // ==================== LOOKUP: FILE WITH USER INFO ====================
  @Get(':id/with-user')
  @ApiOperation({ summary: 'Lấy file kèm thông tin người upload' })
  async getFileWithUser(@Param('id') id: string) {
    return await this.uploadService.findFileWithUser(id);
  }

  // ==================== LOOKUP: FILES GALLERY ====================
  @Get('gallery/all')
  @ApiOperation({ summary: 'Lấy gallery files kèm thông tin uploader' })
  async getGallery(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    return await this.uploadService.getFilesGallery(page, limit);
  }
}
