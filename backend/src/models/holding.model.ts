import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IHolding {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHoldingDocument extends IHolding, Document {
  _id: mongoose.Types.ObjectId;
}

const holdingSchema = new Schema<IHoldingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 24,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    averageEntryPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

holdingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Holding: Model<IHoldingDocument> =
  mongoose.models.Holding ??
  mongoose.model<IHoldingDocument>("Holding", holdingSchema);
