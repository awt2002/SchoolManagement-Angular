export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface UserInfoDto {
  id: string;
  username: string;
  role: string;
}

export interface LoginResponseDto {
  accessToken: string;
  expiresAt: string;
  user: UserInfoDto;
}

export interface RefreshResponseDto {
  accessToken: string;
  expiresAt: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}
