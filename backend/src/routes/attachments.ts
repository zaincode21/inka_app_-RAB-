import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuthUser } from '../middleware/auth.js';
import { ApiError } from '../utils/apiError.js';
import {
  createAttachmentRecord,
  ensureUploadDir,
  listAttachments,
  publicUploadUrl,
} from '../services/attachmentService.js';

const uploadDir = ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDir);
  },
  filename: (_request, file, callback) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || guessExtension(file.mimetype);
    callback(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Only image uploads are allowed.'));
      return;
    }
    callback(null, true);
  },
});

export const attachmentRouter = Router();

attachmentRouter.get(
  '/',
  asyncHandler(async (request, response) => {
    requireAuthUser(request);
    const query = request.query as Record<string, unknown>;
    const rows = await listAttachments({
      cattleId: typeof query.cattleId === 'string' ? query.cattleId : undefined,
      healthEventId: typeof query.healthEventId === 'string' ? query.healthEventId : undefined,
      transactionId: typeof query.transactionId === 'string' ? query.transactionId : undefined,
      milkRecordId: typeof query.milkRecordId === 'string' ? query.milkRecordId : undefined,
      ownerType: typeof query.ownerType === 'string' ? query.ownerType : undefined,
    });
    response.json(rows);
  }),
);

attachmentRouter.post(
  '/',
  upload.single('file'),
  asyncHandler(async (request, response) => {
    requireAuthUser(request);
    const file = request.file;
    if (!file) {
      throw new ApiError(400, 'Image file is required (field name: file).');
    }

    const body = request.body as Record<string, string>;
    const ownerType = String(body.ownerType ?? '').trim();
    if (!ownerType) {
      throw new ApiError(400, 'ownerType is required.');
    }

    const uri = publicUploadUrl(file.filename);
    const attachment = await createAttachmentRecord({
      ownerType,
      uri,
      label: body.label,
      cattleId: body.cattleId,
      milkRecordId: body.milkRecordId,
      healthEventId: body.healthEventId,
      transactionId: body.transactionId,
    });

    response.status(201).json(attachment);
  }),
);

function guessExtension(mimeType: string) {
  if (mimeType === 'image/png') {
    return '.png';
  }
  if (mimeType === 'image/webp') {
    return '.webp';
  }
  if (mimeType === 'image/gif') {
    return '.gif';
  }
  return '.jpg';
}
