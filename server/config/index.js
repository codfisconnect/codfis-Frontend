require('dotenv').config();
const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5050,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_codfis_change_in_prod',
  jwtExpiresIn: '7d',
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPass: process.env.ADMIN_PASS || 'Admin@Codfis2026!',
  uploadDir: path.resolve(__dirname, '../../uploads'),
  dbPath: path.resolve(__dirname, '../../data.db')
};
