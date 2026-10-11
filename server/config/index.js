require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_codfis_change_in_prod',
  jwtExpiresIn: '7d',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPass: process.env.ADMIN_PASS || 'Admin@Codfis2026!',
  uploadDir: process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve(__dirname, '../../uploads'),
  dbPath: process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve(__dirname, '../../data.db'),
  databaseUrl: process.env.DATABASE_URL || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'codfis/resumes'
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    publicUrl: process.env.R2_PUBLIC_URL || ''
  }
};
