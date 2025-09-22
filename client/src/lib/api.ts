import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const api = axios.create({ baseURL });

export function setAuth(token?: string) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}
