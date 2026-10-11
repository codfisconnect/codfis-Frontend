const multer = require('multer');
const path = require('path');
const config = require('../config');

// Use memoryStorage so uploads stream in-memory without touching Render's ephemeral filesystem
const memoryStorage = multer.memoryStorage();

const RESUME_MAX_SIZE = 2 * 1024 * 1024; // Exactly 2 MB (2,097,152 bytes)

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
    err.status = 400;
    cb(err);
  }
};

const uploadResume = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    // Provide slight headroom for busboy chunking boundary while validateUploadedResumeContent strictly enforces exactly 2,097,152 bytes
    fileSize: RESUME_MAX_SIZE + 1024
  }
});

const videoFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid video type. Only MP4, MOV, and WebM videos are allowed.');
    err.status = 400;
    cb(err);
  }
};

const uploadVideo = multer({
  storage: memoryStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max limit for intro video
  }
});

// Multi-file upload for applications
const applicationFilesUpload = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'video') {
      const allowedExts = ['.mp4', '.mov', '.webm'];
      const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (allowedExts.includes(ext) && allowedMimes.includes(file.mimetype)) {
        return cb(null, true);
      }
      const err = new Error('Invalid video type. Only MP4, MOV, and WebM files are allowed.');
      err.status = 400;
      return cb(err);
    }

    // Resumes, documents
    const allowedDocExts = ['.pdf', '.doc', '.docx'];
    const allowedDocMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedDocExts.includes(ext) && allowedDocMimes.includes(file.mimetype)) {
      return cb(null, true);
    }
    const err = new Error('Invalid document type. Allowed types: PDF, DOC, DOCX.');
    err.status = 400;
    return cb(err);
  },
  limits: {
    fileSize: RESUME_MAX_SIZE + 1024
  }
});

// Magic bytes inspection for supported formats:
// PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
// DOC: OLE Compound File (0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1)
// DOCX: ZIP archive (PK\x03\x04 or 0x50, 0x4B, 0x03, 0x04)
function validateResumeMagicBytes(buffer, ext) {
  if (!buffer || buffer.length < 4) return false;
  
  if (ext === '.pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  
  if (ext === '.doc') {
    if (buffer.length < 8) return false;
    return buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0 &&
           buffer[4] === 0xA1 && buffer[5] === 0xB1 && buffer[6] === 0x1A && buffer[7] === 0xE1;
  }
  
  if (ext === '.docx') {
    // ZIP standard local file header signature PK\x03\x04
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }
  
  return false;
}

// Middleware to run after multer to verify buffer content & magic bytes
function validateUploadedResumeContent(req, res, next) {
  const file = req.file || (req.files && (Array.isArray(req.files) ? req.files.find(f => f.fieldname === 'resume') : (req.files.resume && req.files.resume[0])));
  if (!file) {
    return next();
  }

  // Check 0-byte or empty file
  if (!file.buffer || file.buffer.length === 0) {
    const err = new Error('The uploaded resume file is empty.');
    err.status = 400;
    return next(err);
  }

  // Exact 2 MB boundary check on buffer length
  if (file.buffer.length > RESUME_MAX_SIZE) {
    const err = new Error('File size exceeds the 2 MB limit. Please upload a file smaller than or equal to 2 MB.');
    err.status = 413;
    err.code = 'LIMIT_FILE_SIZE';
    return next(err);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!validateResumeMagicBytes(file.buffer, ext)) {
    const err = new Error('Invalid or corrupted resume file structure. Please upload a valid PDF, DOC, or DOCX resume smaller than or equal to 2 MB.');
    err.status = 415;
    return next(err);
  }

  next();
}

module.exports = {
  uploadResume,
  uploadVideo,
  applicationFilesUpload,
  validateUploadedResumeContent,
  validateResumeMagicBytes,
  RESUME_MAX_SIZE
};


