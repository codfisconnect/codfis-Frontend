const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Use memoryStorage so uploads work seamlessly in serverless / ephemeral containers and stream directly to Cloudflare R2
const memoryStorage = multer.memoryStorage();

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
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

const uploadResume = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max limit for resumes
  }
});

const videoFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp4', '.mov', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid video type. Only MP4, MOV, and WebM videos are allowed.'));
  }
};

const uploadVideo = multer({
  storage: memoryStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max limit for intro video
  }
});

// Multi-file upload for applications (resume, projectDoc, workSample, portfolioFile)
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
      return cb(new Error('Invalid video type. Only MP4, MOV, and WebM files are allowed.'));
    }

    // Resumes, project documents, portfolio PDFs, work samples
    const allowedDocExts = ['.pdf', '.doc', '.docx', '.zip', '.png', '.jpg', '.jpeg'];
    const allowedDocMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg'
    ];
    if (allowedDocExts.includes(ext) && allowedDocMimes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid document type. Allowed types: PDF, DOC, DOCX, ZIP, PNG, JPG.'));
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

module.exports = {
  uploadResume,
  uploadVideo,
  applicationFilesUpload
};

