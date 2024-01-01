import express from "express";
import mongoose from "mongoose";
import { DB_NAME } from "./contants";
import dotenv from "dotenv";
dotenv.config();
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (err) => {
      console.log("ERROR : ", err);
    });
    app.listen(process.env.PORT, () => {
      console.log(`app is listening on ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error : ", error);
    throw error;
  }
})();
