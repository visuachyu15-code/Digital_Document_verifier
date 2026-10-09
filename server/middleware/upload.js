const multer = require('multer');

// Configure multer with memory storage so we can compute SHA-256 hashes cleanly
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow PDF and standard image formats
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Image files (JPEG, PNG, WEBP) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

module.exports = upload;
