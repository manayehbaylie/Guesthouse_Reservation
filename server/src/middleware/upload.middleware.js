import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const middlewareDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(middlewareDirectory, "../../uploads/guesthouses");
fs.mkdirSync(uploadDirectory, { recursive: true });

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|pdf/;

  const isValid = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and PDF files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

export default upload;