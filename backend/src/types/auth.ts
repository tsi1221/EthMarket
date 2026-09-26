export type AuthTokenPayload = {
  userId: string;
};

export type PublicUser = {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResponse = {
  user: PublicUser;
  token: string;
};
