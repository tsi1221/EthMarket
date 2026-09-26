export type PublicUser = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: PublicUser;
  token: string;
};

export type MeResponse = {
  user: PublicUser;
};

export type ApiErrorBody = {
  error?: string;
  details?: unknown;
  message?: string;
};
