import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UploadedFileDocument = HydratedDocument<UploadedFile>;

@Schema({ timestamps: true, collection: 'files' })
// collection: 'files' = Đặt tên collection rõ ràng
export class UploadedFile {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ default: 'active' })
  status: string;

  @Prop()
  url?: string;
}

export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);
