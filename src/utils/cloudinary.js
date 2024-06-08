import { v2 as cloudinary} from "cloudinary"
import fs, { writeFileSync } from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // File uploaded successfully
        // console.log("File uploaded successfully", response.url)
        // console.log("\nResponse -> ", response)
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        fs.unlinkSync(localFilePath)  // Remove the locally saved temporary file as the upload operation got failed 
        return null
    }
}

export { uploadOnCloudinary }