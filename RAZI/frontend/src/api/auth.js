import { API_BASE_URL } from './api';
import { CAMERA_API_URL } from './api';

export const verifyFaceImage = async (imageUri, email) => {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("image", {
    uri: imageUri,
    name: "photo.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(`${CAMERA_API_URL}/verify`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Napaka pri preverjanju obraza");
  return result;
};
