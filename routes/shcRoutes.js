const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { authenticate } = require("../middleware/authMiddleware");
const { uploadShc, getLatestShc } = require("../controllers/shcController");

const router = express.Router();

const uploadsRoot = path.join(process.cwd(), "uploads", "shc");

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
  }
};

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
]);

const maxFileSizeBytes =
  Number(process.env.SHC_MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsRoot);
  },
  filename: (req, file, cb) => {
    const safeBase = String(file.originalname || "shc")
      .replace(/[^a-zA-Z0-9_.-]/g, "_")
      .slice(0, 80);

    const ext = path.extname(safeBase) || (file.mimetype === "application/pdf" ? ".pdf" : "");
    const name = path.basename(safeBase, path.extname(safeBase));
    cb(null, `${Date.now()}_${name}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const err = new Error("Invalid file type. Only images and PDF files are allowed.");
    err.statusCode = 400;
    return cb(err);
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeBytes,
  },
});

const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File too large",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.statusCode || 400).json({
    success: false,
    message: err.message || "Invalid upload",
  });
};

const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) return multerErrorHandler(err, req, res, next);
    return next();
  });
};

router.post("/upload", authenticate, uploadSingleFile, uploadShc);
router.get("/latest", authenticate, getLatestShc);

module.exports = router;
