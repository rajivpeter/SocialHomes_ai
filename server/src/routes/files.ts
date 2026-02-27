// ============================================================
// SocialHomes.Ai — File Upload Routes
// Endpoints for file upload, listing, deletion, presigned URLs
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  registerUpload,
  getEntityFiles,
  getFile,
  deleteFile,
  generatePresignedUrl,
  getStorageUsage,
} from '../services/file-upload.js';
import type { FileCategory } from '../services/file-upload.js';

export const filesRouter = Router();
filesRouter.use(authMiddleware);

// POST /api/v1/files/upload — register a file upload
filesRouter.post('/upload', async (req, res, next) => {
  try {
    const { fileName, mimeType, sizeBytes, entityType, entityId, category, description, tags } = req.body;

    if (!fileName || !mimeType || !sizeBytes || !entityType || !entityId || !category) {
      return res.status(400).json({
        error: 'Required fields: fileName, mimeType, sizeBytes, entityType, entityId, category',
      });
    }

    const uploadedBy = req.user?.displayName || req.user?.email || 'system';
    const result = await registerUpload(
      fileName, mimeType, sizeBytes, entityType, entityId,
      category as FileCategory, uploadedBy, description, tags,
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.file);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/files/entity/:entityType/:entityId — list files for an entity
filesRouter.get('/entity/:entityType/:entityId', async (req, res, next) => {
  try {
    const category = req.query.category as FileCategory | undefined;
    const files = await getEntityFiles(req.params.entityType, req.params.entityId, category);
    res.json({ items: files, total: files.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/files/:fileId — get a single file metadata
filesRouter.get('/:fileId', async (req, res, next) => {
  try {
    const file = await getFile(req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/files/:fileId — delete a file
filesRouter.delete('/:fileId', async (req, res, next) => {
  try {
    const deletedBy = req.user?.displayName || req.user?.email || 'system';
    const success = await deleteFile(req.params.fileId, deletedBy);
    if (!success) return res.status(404).json({ error: 'File not found' });
    res.json({ success: true, fileId: req.params.fileId });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/files/presigned-url — generate a presigned upload URL
filesRouter.post('/presigned-url', async (req, res) => {
  const { entityType, entityId, category, fileName, mimeType } = req.body;
  if (!entityType || !entityId || !category || !fileName || !mimeType) {
    return res.status(400).json({
      error: 'Required fields: entityType, entityId, category, fileName, mimeType',
    });
  }
  const result = generatePresignedUrl(entityType, entityId, category, fileName, mimeType);
  res.json(result);
});

// GET /api/v1/files/storage/usage — storage usage summary
filesRouter.get('/storage/usage', async (req, res, next) => {
  try {
    const entityType = req.query.entityType as string | undefined;
    const usage = await getStorageUsage(entityType);
    res.json(usage);
  } catch (err) {
    next(err);
  }
});
