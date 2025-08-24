import axios from "axios";

const BACKEND_URL = "http://localhost:5000/api/contact"; // Change this to your deployed URL later

export const sendContactEmail = async (formData) => {
  try {
    const response = await axios.post(BACKEND_URL, formData);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to send contact message."
    );
  }
};
