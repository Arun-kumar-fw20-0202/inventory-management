import axios from "axios";

// export const baseUrl = "http://localhost:8014/api/";
export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

const api = axios.create({
  withCredentials: true,
  baseURL: baseUrl, // Corrected property name
});

export default api;