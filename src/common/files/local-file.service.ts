import { BadRequestException, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { MAX_DOCUMENT_UPLOAD_BYTES, MAX_IMAGE_UPLOAD_BYTES } from './upload-policy';

export type UploadBucket = 'users' | 'services' | 'documents';

@Injectable()
export class LocalFileService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  async saveImageAsWebp(file: Express.Multer.File, bucket: UploadBucket): Promise<string> {
    if (!file?.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Invalid image file type. Allowed: image/*');
    }

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      throw new BadRequestException('Image too large. Max allowed size is 5MB.');
    }

    const fileName = `${Date.now()}-${randomUUID()}.webp`;
    const bucketDir = join(this.uploadsRoot, bucket);
    await fs.mkdir(bucketDir, { recursive: true });

    const outputPath = join(bucketDir, fileName);
    let buffer: Buffer;
    try {
      buffer = await sharp(file.buffer).webp({ quality: 85 }).toBuffer();
    } catch {
      throw new BadRequestException('Invalid image content. Failed to process image as webp.');
    }
    await fs.writeFile(outputPath, buffer);

    return `/uploads/${bucket}/${fileName}`;
  }

  async saveDocument(file: Express.Multer.File): Promise<{ url: string; ext: 'pdf' | 'webp' }> {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new BadRequestException('Document too large. Max allowed size is 10MB.');
    }

    const bucket: UploadBucket = 'documents';
    const bucketDir = join(this.uploadsRoot, bucket);
    await fs.mkdir(bucketDir, { recursive: true });

    if (file.mimetype === 'application/pdf') {
      const fileName = `${Date.now()}-${randomUUID()}.pdf`;
      await fs.writeFile(join(bucketDir, fileName), file.buffer);
      return { url: `/uploads/${bucket}/${fileName}`, ext: 'pdf' };
    }

    if (file.mimetype.startsWith('image/')) {
      const url = await this.saveImageAsWebp(file, bucket);
      return { url, ext: 'webp' };
    }

    const originalExt = extname(file.originalname).toLowerCase();
    throw new BadRequestException(
      `Unsupported document type: ${file.mimetype || originalExt}. Allowed: images and pdf`,
    );
  }
}
