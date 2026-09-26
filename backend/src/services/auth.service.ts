import { User } from "../models/user.model";
import type { AuthResponse, PublicUser } from "../types/auth";
import { AppError } from "../utils/errors";
import { signAccessToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/auth.validator";

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await User.findOne({ email: input.email }).lean();

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    avatar: input.avatar ?? null,
  });

  return {
    user: user.toPublic(),
    token: signAccessToken(user._id.toString()),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValidPassword = await comparePassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    user: user.toPublic(),
    token: signAccessToken(user._id.toString()),
  };
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const user = await User.findByIdAndUpdate(
    userId,
    { name: input.name },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user.toPublic();
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user.toPublic();
}
