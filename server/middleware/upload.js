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
    fileSize: RESUME_MAX_SIZE
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
    fileSize: RESUME_MAX_SIZE
  }
});

module.exports = {
  uploadResume,
  uploadVideo,
  applicationFilesUpload,
  RESUME_MAX_SIZE
};


