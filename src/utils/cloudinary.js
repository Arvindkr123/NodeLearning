import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUND_NAME,
  api_key: process.env.CLOUDINARY_api_key,
  api_secret: process.env.CLOUDINARY_api_secret,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file is uploaded successfully then do let me know
    console.log("File Uploaded Successfully on cloudinary!!!", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the file
    return null;
  }
};

export { uploadOnCloudinary };