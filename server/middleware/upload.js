const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure destination exists
const resumeDir = path.join(config.uploadDir, 'resumes');
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename: timestamp-rand-sanitized.ext
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
  }
});

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
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max limit for resumes
  }
});

// Video upload filter and storage
const videoDir = path.join(config.uploadDir, 'videos');
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `video-${safeBase}-${uniqueSuffix}${ext}`);
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
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max limit for intro video
  }
});

// Multi-file upload for applications (resume, projectDoc, workSample, portfolioFile)
const applicationFilesUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'video') {
        cb(null, videoDir);
      } else {
        cb(null, resumeDir);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${safeBase}-${uniqueSuffix}${ext}`);
    }
  }),
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

