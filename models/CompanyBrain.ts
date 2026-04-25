import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompanyQuestion {
  id: string;
  text: string;
  category: "DSA" | "System Design" | "OOPS" | "Core CS" | "Behavioral" | "Domain";
  difficulty: "easy" | "medium" | "hard";
  sourceHint?: string;
}

export interface ICompanyBrain extends Document {
  userId: string;
  companyName: string;
  role: string;
  description: string;
  questions: ICompanyQuestion[];
  sources: string[];
  status: "generating" | "ready" | "error";
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<ICompanyQuestion>({
  id: String,
  text: String,
  category: { type: String, enum: ["DSA", "System Design", "OOPS", "Core CS", "Behavioral", "Domain"] },
  difficulty: { type: String, enum: ["easy", "medium", "hard"] },
  sourceHint: { type: String, default: "" },
}, { _id: false });

const CompanyBrainSchema = new Schema<ICompanyBrain>(
  {
    userId:      { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    role:        { type: String, required: true },
    description: { type: String, default: "" },
    questions:   { type: [QuestionSchema], default: [] },
    sources:     { type: [String], default: [] },
    status:      { type: String, enum: ["generating", "ready", "error"], default: "ready" },
  },
  { timestamps: true }
);

const CompanyBrain: Model<ICompanyBrain> =
  mongoose.models.CompanyBrain ?? mongoose.model<ICompanyBrain>("CompanyBrain", CompanyBrainSchema);

export default CompanyBrain;
