export class UploadResponseDto {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export class FileStatisticsDto {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: string;
  byType: Record<string, number>;
}
