/** Request/response types aligned with backend auth DTOs and responses */

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email?: string;
  password: string;
  agreed: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  tier: string;
}

export interface LoginRegisterResponse {
  access_token: string;
  user: AuthUser;
}

export interface ProfileResponse {
  id: string;
  username: string;
  email: string | null;
  tier: string;
  hasEmail: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ForgotPasswordDto {
  username: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface BindEmailDto {
  email: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ApiError {
  success?: false;
  error?: string;
  message?: string;
  timestamp?: string;
  remainingAttempts?: number;
}
