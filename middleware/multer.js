import multer from "multer";

const storage = multer.memoryStorage();

const singleUpload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024,
  },
}).single("file");
const multipleUpload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024,
    files: 6,
  },
}).array("files", 6);

export { singleUpload, multipleUpload };
