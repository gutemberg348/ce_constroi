import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { ApiResponse, AuthTokens } from "@/types/domain";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type PersistedAuthStore = {
  state?: Partial<AuthTokens>;
};

export const api = axios.create({
  baseURL:
    typeof window === "undefined"
      ? process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1"
      : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api/v1",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json"
  }
});

function getPersistedSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem("anselmo.auth") ?? "null") as PersistedAuthStore | null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    useAuthStore.getState().accessToken ??
    window.localStorage.getItem("anselmo.accessToken") ??
    getPersistedSession()?.state?.accessToken ??
    null
  );
}

function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return useAuthStore.getState().refreshToken ?? getPersistedSession()?.state?.refreshToken ?? null;
}

function isAuthRequest(url?: string) {
  return Boolean(url && ["/auth/login", "/auth/register", "/auth/refresh"].some((path) => url.includes(path)));
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshSession(refreshToken: string) {
  const response = await axios.post<ApiResponse<AuthTokens> | AuthTokens>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    {
      headers: { "Content-Type": "application/json" },
      timeout: api.defaults.timeout
    }
  );
  const session = unwrap<AuthTokens>(response);
  useAuthStore.getState().setSession(session);
  return session;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      typeof window === "undefined" ||
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest(originalRequest.url)
    ) {
      throw error;
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      useAuthStore.getState().logout();
      throw error;
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= refreshSession(refreshToken).finally(() => {
        refreshPromise = null;
      });

      const session = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      throw refreshError;
    }
  }
);

export function unwrap<T>(response: { data: ApiResponse<T> | T }) {
  const body = response.data as ApiResponse<T>;
  return "success" in body && "data" in body ? body.data : (response.data as T);
}

function messageFromValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (Array.isArray(value)) {
    const messages = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
    return messages.length ? messages.join(" ") : null;
  }

  if (value && typeof value === "object" && "message" in value) {
    return messageFromValue(value.message);
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação."
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      const body = data as { error?: unknown; message?: unknown };
      const apiMessage = messageFromValue(body.error) ?? messageFromValue(body.message);

      if (apiMessage) {
        return apiMessage;
      }
    }

    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = messageFromValue(error.message);

    if (message && !/^Request failed with status code \d+$/i.test(message)) {
      return message;
    }
  }

  return fallback;
}
