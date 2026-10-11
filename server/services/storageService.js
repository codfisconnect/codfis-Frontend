const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

class StorageService {
  constructor() {
    this.isCloudinaryConfigured = Boolean(
      config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
    );

    this.isProduction = config.nodeEnv === 'production';

    if (this.isCloudinaryConfigured) {
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true
      });
      this.folder = config.cloudinary.folder || 'codfis/resumes';
      console.log(`[Storage] Cloudinary configured (cloud: ${config.cloudinary.cloudName}, folder: ${this.folder})`);
    } else if (this.isProduction) {
      // In production without Cloudinary: fail or disable gracefully without ephemeral disk write
      console.log('[Storage] Production mode: Cloudinary credentials not detected.');
    } else {
      console.log('[Storage] Local filesystem storage active for development.');
      this.ensureLocalDirs();
    }
  }

  /**
   * Whether resume/file storage is currently active
   */
  isEnabled() {
    if (this.isCloudinaryConfigured) return true;
    if (this.isProduction) return false;
    return true; // Local development with local filesystem
  }

  ensureLocalDirs() {
    if (this.isProduction && !this.isCloudinaryConfigured) return;
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
   * Save a file buffer or local file
   * @param {Object} file - Multer file object
   * @param {string} folder - 'resumes' or 'videos'
   * @returns {Promise<Object>} file metadata { filename, publicId, resourceType, bytes, format, storageProvider, secureUrl }
   */
  async saveFile(file, folder = 'resumes') {
    if (!file) return null;

    if (!this.isEnabled()) {
      const err = new Error('Resume file uploads are temporarily unavailable on this deployment.');
      err.code = 'STORAGE_DISABLED';
      err.status = 503;
      throw err;
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${safeBase}-${uniqueSuffix}${ext}`;

    if (this.isCloudinaryConfigured) {
      const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
      if (!buffer) {
        throw new Error('No file buffer or path provided for upload');
      }

      // Upload to Cloudinary using raw resource_type for exact document byte preservation
      // folder: 'codfis/resumes' or custom
      const targetFolder = folder === 'videos' ? 'codfis/videos' : (this.folder || 'codfis/resumes');
      const resourceType = folder === 'videos' ? 'video' : 'raw';

      const uploadResult = await new Promise((resolve, reject) => {
        let isDone = false;
        const uploadOptions = {
          folder: targetFolder,
          resource_type: resourceType,
          type: 'upload', // Standard secure upload
          public_id: `${safeBase}-${uniqueSuffix}${ext}`,
          use_filename: false,
          unique_filename: false,
          overwrite: true
        };

        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (isDone) return;
            isDone = true;
            if (error) {
              console.error('[Storage] Cloudinary upload error:', error.message || error);
              const errMsg = String(error.message || error);
              if (errMsg.toLowerCase().includes('invalid signature') || errMsg.toLowerCase().includes('unknown api key') || errMsg.toLowerCase().includes('must supply api_secret')) {
                const err = new Error('Resume storage authentication is currently invalid or undergoing maintenance. Please apply using your LinkedIn profile or portfolio URL.');
                err.status = 503;
                return reject(err);
              }
              return reject(new Error('Cloudinary upload failed: ' + (error.message || 'Remote storage error')));
            }
            resolve(result);
          }
        );

        stream.on('error', (err) => {
          if (isDone) return;
          isDone = true;
          console.error('[Storage] Cloudinary stream error event:', err.message || err);
          reject(new Error('Cloudinary upload stream error: ' + (err.message || 'Stream failed')));
        });

        // Fail fast if Cloudinary does not respond within 8 seconds
        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            try { stream.destroy(); } catch (e) {}
            console.error('[Storage] Cloudinary upload timed out after 8s');
            const err = new Error('Resume storage provider timed out. Please try again or apply with your LinkedIn profile.');
            err.status = 504;
            reject(err);
          }
        }, 8000);

        stream.end(buffer);
      });

      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }

      return {
        filename: filename,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type || resourceType,
        format: uploadResult.format || ext.replace('.', ''),
        bytes: uploadResult.bytes || buffer.length,
        storageProvider: 'cloudinary',
        secureUrl: uploadResult.secure_url
      };
    } else {
      // Local development storage
      this.ensureLocalDirs();
      const targetDir = path.join(config.uploadDir, folder);
      const targetPath = path.join(targetDir, filename);

      if (file.path && file.path !== targetPath) {
        fs.copyFileSync(file.path, targetPath);
        try { fs.unlinkSync(file.path); } catch (e) {}
      } else if (file.buffer) {
        fs.writeFileSync(targetPath, file.buffer);
      }

      return {
        filename: filename,
        publicId: filename,
        resourceType: 'raw',
        format: ext.replace('.', ''),
        bytes: file.size || (file.buffer ? file.buffer.length : 0),
        storageProvider: 'local',
        secureUrl: null
      };
    }
  }

  /**
   * Get file stream or buffer for authorized admin download
   * @param {string} publicIdOrFilename - Cloudinary publicId or local filename
   * @param {string} resourceType - 'raw', 'image', 'video'
   * @param {string} folder - 'resumes' or 'videos'
   */
  async getFileStream(publicIdOrFilename, resourceType = 'raw', folder = 'resumes') {
    if (!this.isEnabled()) {
      const err = new Error('Resume file downloads are temporarily unavailable.');
      err.code = 'STORAGE_DISABLED';
      err.status = 503;
      throw err;
    }

    if (this.isCloudinaryConfigured) {
      // Generate private signed download URL via Cloudinary SDK
      const signedUrl = cloudinary.utils.private_download_url(
        publicIdOrFilename,
        '',
        {
          resource_type: resourceType || 'raw',
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 300 // 5 minutes validity
        }
      );

      // Stream the file data from Cloudinary through backend
      const downloadStream = await new Promise((resolve, reject) => {
        const client = signedUrl.startsWith('https') ? https : http;
        client.get(signedUrl, (res) => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Cloudinary download returned HTTP ${res.statusCode}`));
          }
          resolve({
            stream: res,
            contentType: res.headers['content-type'] || 'application/octet-stream',
            contentLength: res.headers['content-length']
          });
        }).on('error', reject);
      });

      return downloadStream;
    } else {
      // Local storage fallback for development
      const localPath = path.join(config.uploadDir, folder, path.basename(publicIdOrFilename));
      if (!fs.existsSync(localPath)) {
        throw new Error('File not found locally: ' + publicIdOrFilename);
      }
      return {
        stream: fs.createReadStream(localPath),
        contentType: 'application/octet-stream',
        contentLength: fs.statSync(localPath).size
      };
    }
  }

  /**
   * Delete asset from Cloudinary or local storage (used for orphan cleanup)
   * @param {string} publicIdOrFilename
   * @param {string} resourceType
   * @param {string} folder
   */
  async deleteFile(publicIdOrFilename, resourceType = 'raw', folder = 'resumes') {
    if (!this.isEnabled() || !publicIdOrFilename) return;

    if (this.isCloudinaryConfigured) {
      try {
        await cloudinary.uploader.destroy(publicIdOrFilename, {
          resource_type: resourceType || 'raw',
          type: 'upload',
          invalidate: true
        });
      } catch (err) {
        console.warn('[Storage] Failed to delete asset in Cloudinary:', err.message);
      }
    } else {
      const localPath = path.join(config.uploadDir, folder, path.basename(publicIdOrFilename));
      if (fs.existsSync(localPath)) {
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
    }
  }
}

module.exports = new StorageService();



