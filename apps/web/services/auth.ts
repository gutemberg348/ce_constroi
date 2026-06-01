import { api, unwrap } from "./api";
import { AuthTokens, UserRole } from "@/types/domain";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
  role?: UserRole;
  phone?: string;
};

export async function login(input: LoginInput) {
  const response = await api.post<AuthTokens>("/auth/login", input);
  return unwrap<AuthTokens>(response);
}

export async function register(input: RegisterInput) {
  const response = await api.post<AuthTokens>("/auth/register", input);
  return unwrap<AuthTokens>(response);
}
