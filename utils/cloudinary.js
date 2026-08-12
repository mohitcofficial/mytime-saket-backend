import cloudinary from "cloudinary";
import getDataUri from "./dataURI.js";

export const uploadToCloudinary = async (stateBanner) => {
  const fileUri = getDataUri(stateBanner);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  const newImage = [
    {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  ];

  return newImage;
};

export const deleteFromCloudinary = async (id) => {
  cloudinary.v2.uploader.destroy(id);
};
export const deleteManyFromCloudinary = async (publicIdsToDelete) => {
  cloudinary.v2.api.delete_resources(publicIdsToDelete);
};
