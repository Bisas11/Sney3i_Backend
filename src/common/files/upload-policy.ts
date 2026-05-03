import { BadRequestException } from '@nestjs/common';

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export function imageOnlyFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file?.mimetype?.startsWith('image/')) {
    cb(
      new BadRequestException(
        'Invalid file type for image upload. Allowed: image/* (jpg, jpeg, png, webp, etc.).',
      ),
      false,
    );
    return;
  }

  cb(null, true);
}

export function documentFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const isPdf = file?.mimetype === 'application/pdf';
  const isImage = file?.mimetype?.startsWith('image/');

  if (!isPdf && !isImage) {
    cb(
      new BadRequestException('Invalid document type. Allowed: application/pdf or image/*.'),
      false,
    );
    return;
  }

  cb(null, true);
}
