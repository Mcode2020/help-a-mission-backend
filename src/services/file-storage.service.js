import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function assertInDirectory(filePath, rootDirectory) {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(rootDirectory);

  if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
    throw new Error('SECURITY_VIOLATION: Path traversal attempt detected.');
  }
  return resolvedPath;
}

export class PublicFileStorageService {
  static getRootDirectory() {
    const dir = env.PUBLIC_UPLOAD_ROOT || path.resolve(process.cwd(), '../public_files');
    return path.resolve(dir);
  }

  static async saveFile({ buffer, originalName, mimeType, subfolder = 'general' }) {
    const root = this.getRootDirectory();
    const ext = path.extname(originalName) || '.bin';
    const uuidName = `${crypto.randomUUID()}${ext}`;
    const targetFolder = path.join(root, subfolder);

    assertInDirectory(targetFolder, root);
    await fs.mkdir(targetFolder, { recursive: true });

    const targetPath = path.join(targetFolder, uuidName);
    assertInDirectory(targetPath, root);

    await fs.writeFile(targetPath, buffer);

    const relativePath = path.relative(root, targetPath).replace(/\\/g, '/');
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const baseUrl = env.PUBLIC_UPLOAD_BASE_URL || 'https://files.example.org';
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/${relativePath}`;

    return {
      visibility: 'public',
      storageType: 'local_public',
      relativePath,
      publicUrl,
      mimeType,
      sizeBytes: buffer.length,
      sha256,
    };
  }
}

export class PrivateFileStorageService {
  static getRootDirectory() {
    const dir = env.PRIVATE_UPLOAD_ROOT || path.resolve(process.cwd(), '../storage/private');
    return path.resolve(dir);
  }

  static async saveFile({ buffer, originalName, mimeType, subfolder = 'exports' }) {
    const root = this.getRootDirectory();
    const ext = path.extname(originalName) || '.bin';
    const uuidName = `${crypto.randomUUID()}${ext}`;
    const targetFolder = path.join(root, subfolder);

    assertInDirectory(targetFolder, root);
    await fs.mkdir(targetFolder, { recursive: true });

    const targetPath = path.join(targetFolder, uuidName);
    assertInDirectory(targetPath, root);

    await fs.writeFile(targetPath, buffer);

    const relativePath = path.relative(root, targetPath).replace(/\\/g, '/');
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      visibility: 'private',
      storageType: 'local_private',
      relativePath,
      publicUrl: null,
      mimeType,
      sizeBytes: buffer.length,
      sha256,
    };
  }

  static async getAbsolutePath(relativePath) {
    const root = this.getRootDirectory();
    const fullPath = path.join(root, relativePath);
    return assertInDirectory(fullPath, root);
  }
}
