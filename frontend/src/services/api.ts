import axios from "axios";

const API = import.meta.env.VITE_BACKEND_URL;

export const startInterview = async () => {
  const res = await axios.post(`${API}/interview/start`);
  return res.data;
};
