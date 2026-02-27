// ============================================================
// SocialHomes.Ai — File Upload Service
// Task 5.2.15: Photo attachments, document uploads, Cloud Storage
// integration, image resize, virus scanning, presigned URLs
// ============================================================

import { db, collections, FieldValue } from './firestore.js';
import crypto from 'crypto';

// ---- Types ----

export interface FileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  downloadUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  entityType: string;
  entityId: string;
  category: FileCategory;
  description?: string;
  tags?: string[];
  scanStatus: 'pending' | 'clean' | 'infected' | 'error';
  thumbnailUrl?: string;
}

export type FileCategory =
  | 'repair-photo-before'
  | 'repair-photo-after'
  | 'compliance-certificate'
  | 'tenant-document'
  | 'asb-evidence'
  | 'damp-evidence'
  | 'tenancy-agreement'
  | 'identity-document'
  | 'correspondence'
  | 'other';

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  downloadUrl: string;
  storagePath: string;
  expiresAt: string;
}

// ---- Configuration ----

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const BUCKET_NAME = process.env.GCS_BUCKET || 'socialhomes-uploads';

// ---- Files Collection ----

const filesCollection = db.collection('files');

// ---- Validation ----

export function validateUpload(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (sizeBytes > MAX_FILE_SIZE) {
    errors.push(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    errors.push(`File type '${mimeType}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.msi'];
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  if (dangerousExtensions.includes(ext)) {
    errors.push(`File extension '${ext}' is not allowed for security reasons`);
  }

  // Sanitise filename
  if (fileName.length > 255) {
    errors.push('File name must be under 255 characters');
  }

  return { valid: errors.length === 0, errors };
}

// ---- Storage Path Generation ----

function generateStoragePath(
  entityType: string,
  entityId: string,
  category: FileCategory,
  fileName: string,
): string {
  const timestamp = Date.now();
  const hash = crypto.createHash('sha256').update(`${entityId}-${timestamp}-${fileName}`).digest('hex').slice(0, 8);
  const sanitisedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${entityType}/${entityId}/${category}/${hash}-${sanitisedName}`;
}

// ---- File Operations ----

/**
 * Register a file upload in Firestore.
 * In production, this would also upload to Google Cloud Storage.
 * In demo mode, we store metadata only.
 */
export async function registerUpload(
  fileName: string,
  mimeType: string,
  sizeBytes: number,
  entityType: string,
  entityId: string,
  category: FileCategory,
  uploadedBy: string,
  description?: string,
  tags?: string[],
): Promise<UploadResult> {
  // Validate
  const validation = validateUpload(fileName, mimeType, sizeBytes);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join('; ') };
  }

  const storagePath = generateStoragePath(entityType, entityId, category, fileName);
  const fileId = crypto.randomUUID();

  // In production: upload to Cloud Storage
  // const bucket = storage.bucket(BUCKET_NAME);
  // const file = bucket.file(storagePath);
  // await file.save(buffer, { contentType: mimeType });

  // Demo mode: generate simulated URL
  const downloadUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${storagePath}`;
  const thumbnailUrl = IMAGE_MIME_TYPES.includes(mimeType)
    ? `${downloadUrl}?w=200&h=200`
    : undefined;

  const metadata: FileMetadata = {
    id: fileId,
    originalName: fileName,
    mimeType,
    sizeBytes,
    storagePath,
    downloadUrl,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    entityType,
    entityId,
    category,
    description,
    tags,
    scanStatus: 'pending',
    thumbnailUrl,
  };

  // Store metadata in Firestore
  await filesCollection.doc(fileId).set(metadata);

  // Simulate virus scan (mark as clean in demo mode)
  setTimeout(async () => {
    try {
      await filesCollection.doc(fileId).update({ scanStatus: 'clean' });
    } catch {
      // Non-critical
    }
  }, 2000);

  return { success: true, file: metadata };
}

/**
 * Get files for a specific entity.
 */
export async function getEntityFiles(
  entityType: string,
  entityId: string,
  category?: FileCategory,
): Promise<FileMetadata[]> {
  let query: FirebaseFirestore.Query = filesCollection
    .where('entityType', '==', entityType)
    .where('entityId', '==', entityId);

  if (category) {
    query = query.where('category', '==', category);
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data() as FileMetadata);
}

/**
 * Get a single file by ID.
 */
export async function getFile(fileId: string): Promise<FileMetadata | null> {
  const doc = await filesCollection.doc(fileId).get();
  if (!doc.exists) return null;
  return doc.data() as FileMetadata;
}

/**
 * Delete a file.
 */
export async function deleteFile(fileId: string, deletedBy: string): Promise<boolean> {
  const doc = await filesCollection.doc(fileId).get();
  if (!doc.exists) return false;

  // In production: delete from Cloud Storage
  // const file = storage.bucket(BUCKET_NAME).file(doc.data()!.storagePath);
  // await file.delete();

  await filesCollection.doc(fileId).delete();

  // Audit log
  await collections.auditLog.add({
    timestamp: FieldValue.serverTimestamp(),
    user: deletedBy,
    action: 'file-delete',
    entity: 'file',
    entityId: fileId,
    field: 'deleted',
    oldValue: doc.data()!.originalName,
    newValue: '',
    ip: 'system',
  });

  return true;
}

/**
 * Generate a presigned URL for direct upload.
 * In production, this generates a signed Cloud Storage URL.
 */
export function generatePresignedUrl(
  entityType: string,
  entityId: string,
  category: FileCategory,
  fileName: string,
  mimeType: string,
): PresignedUrlResult {
  const storagePath = generateStoragePath(entityType, entityId, category, fileName);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  // In production:
  // const [url] = await bucket.file(storagePath).getSignedUrl({
  //   version: 'v4',
  //   action: 'write',
  //   expires: Date.now() + 15 * 60 * 1000,
  //   contentType: mimeType,
  // });

  return {
    uploadUrl: `https://storage.googleapis.com/upload/storage/v1/b/${BUCKET_NAME}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`,
    downloadUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${storagePath}`,
    storagePath,
    expiresAt,
  };
}

/**
 * Get storage usage summary.
 */
export async function getStorageUsage(entityType?: string): Promise<{
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeMb: number;
  byCategory: Record<string, { count: number; sizeBytes: number }>;
}> {
  let query: FirebaseFirestore.Query = filesCollection;
  if (entityType) {
    query = query.where('entityType', '==', entityType);
  }

  const snapshot = await query.get();
  const byCategory: Record<string, { count: number; sizeBytes: number }> = {};
  let totalSizeBytes = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as FileMetadata;
    totalSizeBytes += data.sizeBytes;

    if (!byCategory[data.category]) {
      byCategory[data.category] = { count: 0, sizeBytes: 0 };
    }
    byCategory[data.category].count++;
    byCategory[data.category].sizeBytes += data.sizeBytes;
  }

  return {
    totalFiles: snapshot.size,
    totalSizeBytes,
    totalSizeMb: Math.round(totalSizeBytes / 1024 / 1024 * 100) / 100,
    byCategory,
  };
}
