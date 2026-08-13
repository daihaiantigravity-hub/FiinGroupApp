export type AuthUser = {
  id?: number | string;
  login: string;
  fullName?: string;
  roles?: string[];
  positionsName?: string;
  avatarUrl?: string;
};

export type Permission = { canAccess?: boolean; canView?: boolean; canAdd?: boolean; canEdit?: boolean; canDelete?: boolean; canImport?: boolean; canExport?: boolean; canApprove?: boolean; canPay?: boolean; canComplete?: boolean };
export type PermissionMap = Record<string, Permission>;

export type AuthStatus = 'anonymous' | 'authenticating' | 'otp_required' | 'authenticated' | 'error';
export type OtpMethod = 'email_otp' | 'google_auth' | 'totp';

export type LoginOutcome =
  | { kind: 'authenticated'; token: string; user: AuthUser }
  | { kind: 'otp_required'; otpToken: string; method: OtpMethod; maskedEmail?: string; user?: Partial<AuthUser> }
  | { kind: 'setup_required'; setupToken: string; user?: Partial<AuthUser> };

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  challenge: Extract<LoginOutcome, { kind: 'otp_required' }> | null;
  error: string | null;
  permissions: PermissionMap;
};
