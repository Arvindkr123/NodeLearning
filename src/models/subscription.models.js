import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: mongoose.Types.ObjectId, // one who is subscribing
      ref: "User",
    },
    channel: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const SubscriptionModel = mongoose.model(
  "Subscription",
  subscriptionSchema
);
