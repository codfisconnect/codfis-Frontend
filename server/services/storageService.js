const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const config = require('../config');

class StorageService {
  constructor() {
    this.isR2Configured = Boolean(
      config.r2.accountId &&
      config.r2.accessKeyId &&
      config.r2.secretAccessKey &&
      config.r2.bucketName
    );

    if (this.isR2Configured) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.r2.accessKeyId,
          secretAccessKey: config.r2.secretAccessKey
        }
      });
      this.bucket = config.r2.bucketName;
      console.log(`[Storage] Cloudflare R2 configured (bucket: ${this.bucket})`);
    } else {
      if (config.nodeEnv === 'production') {
        throw new Error('[Storage] FATAL: Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) are required in production. Ephemeral filesystem fallback is disallowed.');
      } else {
        console.log('[Storage] Local filesystem storage active.');
      }
      this.ensureLocalDirs();
    }
  }

  ensureLocalDirs() {
    try {
      const resumes = path.join(config.uploadDir, 'resumes');
      const videos = path.join(config.uploadDir, 'videos');
      if (!fs.existsSync(resumes)) fs.mkdirSync(resumes, { recursive: true });
      if (!fs.existsSync(videos)) fs.mkdirSync(videos, { recursive: true });
    } catch (err) {
      console.warn('[Storage] Could not create local upload directories:', err.message);
    }
  }

  /**
   * Save a file buffer or local file path
   * @param {Object} file - Multer file object
   * @param {string} folder - 'resumes' or 'videos'
   * @returns {Promise<string>} filename
   */
  async saveFile(file, folder = 'resumes') {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${safeBase}-${uniqueSuffix}${ext}`;
    const key = `${folder}/${filename}`;

    if (this.isR2Configured) {
      const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!buffer) {
        throw new Error('No file buffer or path provided for upload');
      }

      await this.client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype
      }));

      // If multer wrote a temp file, clean it up
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }

      return filename;
    } else {
      // Local storage fallback
      this.ensureLocalDirs();
      const targetDir = path.join(config.uploadDir, folder);
      const targetPath = path.join(targetDir, filename);

      if (file.path && file.path !== targetPath) {
        fs.copyFileSync(file.path, targetPath);
        try { fs.unlinkSync(file.path); } catch (e) {}
      } else if (file.buffer) {
        fs.writeFileSync(targetPath, file.buffer);
      }
      return filename;
    }
  }

  /**
   * Get file stream or buffer for download
   * @param {string} filename
   * @param {string} folder - 'resumes' or 'videos'
   */
  async getFileStream(filename, folder = 'resumes') {
    const key = `${folder}/${path.basename(filename)}`;

    if (this.isR2Configured) {
      try {
        const response = await this.client.send(new GetObjectCommand({
          Bucket: this.bucket,
          Key: key
        }));
        return {
          stream: response.Body,
          contentType: response.ContentType,
          contentLength: response.ContentLength
        };
      } catch (err) {
        // Fallback check if it was stored locally before migration
        const localPath = path.join(config.uploadDir, folder, path.basename(filename));
        if (fs.existsSync(localPath)) {
          return {
            stream: fs.createReadStream(localPath),
            contentType: 'application/octet-stream',
            contentLength: fs.statSync(localPath).size
          };
        }
        throw new Error('File not found in storage: ' + key);
      }
    } else {
      const localPath = path.join(config.uploadDir, folder, path.basename(filename));
      if (!fs.existsSync(localPath)) {
        throw new Error('File not found locally: ' + filename);
      }
      return {
        stream: fs.createReadStream(localPath),
        contentType: 'application/octet-stream',
        contentLength: fs.statSync(localPath).size
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filename, folder = 'resumes') {
    const key = `${folder}/${path.basename(filename)}`;
    if (this.isR2Configured) {
      try {
        await this.client.send(new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key
        }));
      } catch (err) {
        console.warn('[Storage] Failed to delete file in R2:', err.message);
      }
    }
    const localPath = path.join(config.uploadDir, folder, path.basename(filename));
    if (fs.existsSync(localPath)) {
      try { fs.unlinkSync(localPath); } catch (e) {}
    }
  }
}

module.exports = new StorageService();
