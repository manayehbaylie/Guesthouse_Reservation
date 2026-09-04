import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import crypto from "crypto";

const middlewareDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const uploadDirectory = path.resolve(
  middlewareDirectory,
  "../../uploads/guesthouses"
);

// Make sure the upload directory exists
fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

// ==========================================================
// STORAGE CONFIGURATION
// ==========================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================================
// FILE FILTER
// ==========================================================

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
  ];

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
    return;
  }

  cb(
    new Error(
      "Only JPG, JPEG, PNG, WEBP and PDF files are allowed."
    )
  );
};

// ==========================================================
// MULTER CONFIGURATION
// ==========================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;