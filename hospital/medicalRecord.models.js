import mongoose from "mongoose";

const medicalSchema = new mongoose.Schema({}, { timestamps: true });
export const MedicalModel = mongoose.Model("Medical", medicalSchema);
