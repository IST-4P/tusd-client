import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Luôn gửi cookies với mọi request
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
