import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// multer memoryStorage ፋይል (file.buffer) ወደ Cloudinary ይልካል
export const uploadToCloudinary = (file, folder = "guesthouse") =>
  new Promise((resolve, reject) => {
    if (!file?.buffer) {
      reject(new Error("Uploaded file is empty."));
      return;
    }

    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: "auto" }, 
        (error, result) => (error ? reject(error) : resolve(result))
      )
      .end(file.buffer);
  });
export { cloudinary };