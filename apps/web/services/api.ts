import axios from "axios";
import { ApiResponse } from "@/types/domain";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("anselmo.accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function unwrap<T>(response: { data: ApiResponse<T> | T }) {
  const body = response.data as ApiResponse<T>;
  return "success" in body && "data" in body ? body.data : (response.data as T);
}
