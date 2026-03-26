import multer from "multer";

import { UploadError } from "../errors";

const allowedMimeTypes = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new UploadError("Unsupported file type"));
    return;
  }

  cb(null, true);
};

const limits = { fileSize: 10 * 1024 * 1024 };

export const upload = multer({ storage, fileFilter, limits });
