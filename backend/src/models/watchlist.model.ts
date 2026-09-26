import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IWatchlist {
  userId: mongoose.Types.ObjectId;
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWatchlistDocument extends IWatchlist, Document {
  _id: mongoose.Types.ObjectId;
}

const watchlistSchema = new Schema<IWatchlistDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    symbols: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export const Watchlist: Model<IWatchlistDocument> =
  mongoose.models.Watchlist ??
  mongoose.model<IWatchlistDocument>("Watchlist", watchlistSchema);
