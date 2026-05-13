import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITopResume extends Document {
  anonymizedContent: string;
  embedding: number[];
  score: number;
  roleType: string;
  skills: string[];
  createdAt: Date;
}

const TopResumeSchema = new Schema<ITopResume>(
  {
    anonymizedContent: { type: String, required: true },
    embedding:         { type: [Number], required: true },
    score:             { type: Number, required: true },
    roleType:          { type: String, required: true, index: true },
    skills:            { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const TopResume: Model<ITopResume> =
  mongoose.models.TopResume ?? mongoose.model<ITopResume>("TopResume", TopResumeSchema);

export default TopResume;
