import mongoose, { type Document, type Model, Schema } from "mongoose";
import type { PortfolioSource } from "../types/portfolio";

export interface IPortfolio {
  userId: mongoose.Types.ObjectId;
  cash: number;
  source: PortfolioSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPortfolioDocument extends IPortfolio, Document {
  _id: mongoose.Types.ObjectId;
}

const portfolioSchema = new Schema<IPortfolioDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    cash: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    source: {
      type: String,
      enum: ["demo", "true_markets"],
      required: true,
      default: "demo",
    },
  },
  {
    timestamps: true,
  },
);

export const Portfolio: Model<IPortfolioDocument> =
  mongoose.models.Portfolio ??
  mongoose.model<IPortfolioDocument>("Portfolio", portfolioSchema);
