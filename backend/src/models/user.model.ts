import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { PublicUser } from "../types/auth";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  toPublic(): PublicUser;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.toPublic = function toPublic(this: IUserDocument): PublicUser {
  return {
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatar: this.avatar ?? null,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.set("toJSON", {
  transform(_doc, ret) {
    const value = ret as unknown as {
      passwordHash?: string;
      __v?: number;
    };
    delete value.passwordHash;
    delete value.__v;
    return value;
  },
});

export const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", userSchema);
