import mongoose, { type Document, type Model, Schema } from "mongoose";

export type LocalOrderStatus =
  | "submitted"
  | "pending"
  | "filled"
  | "failed"
  | "cancelled"
  | "unknown";

export interface IOrder {
  userId: mongoose.Types.ObjectId;
  trueMarketsOrderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  type: "market";
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {
  _id: mongoose.Types.ObjectId;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    trueMarketsOrderId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 24,
    },
    side: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },
    quantity: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["market"],
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "submitted",
    },
  },
  {
    timestamps: true,
  },
);

export const Order: Model<IOrderDocument> =
  mongoose.models.Order ?? mongoose.model<IOrderDocument>("Order", orderSchema);
