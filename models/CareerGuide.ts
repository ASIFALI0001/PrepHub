import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICareerPath {
  path: string;
  score: number;
  reasoning: string;
  specialization: string;
  pros: string[];
  cons: string[];
}

export interface IRoadmapPhase {
  label: string;       // e.g. "0–3 Months"
  title: string;
  goals: string[];
  actions: string[];
  exams?: string[];    // e.g. "GATE CSE — target 650+"
}

export interface ICollegeTargets {
  reach: string[];
  match: string[];
  safe: string[];
}

export interface IRoadmap {
  chosenPath: string;
  specialization: string;
  phases: IRoadmapPhase[];
  collegeTargets?: ICollegeTargets;
  keySkills: string[];
  generatedAt: Date;
}

export interface ICareerGuide extends Document {
  userId: string;
  // raw inputs stored for re-analysis
  resumeText: string;
  githubUsername: string;
  githubData: Record<string, unknown>;
  mcqAnswers: { question: string; answer: string }[];
  usedPlatformData: boolean;
  // analysis output
  careerOptions: ICareerPath[];
  roadmap?: IRoadmap;
  status: "analyzing" | "options_ready" | "roadmap_ready" | "error";
  createdAt: Date;
  updatedAt: Date;
}

const CareerPathSchema = new Schema<ICareerPath>({
  path:           { type: String, required: true },
  score:          { type: Number, required: true },
  reasoning:      { type: String, required: true },
  specialization: { type: String, default: "" },
  pros:           { type: [String], default: [] },
  cons:           { type: [String], default: [] },
}, { _id: false });

const RoadmapPhaseSchema = new Schema<IRoadmapPhase>({
  label:   String,
  title:   String,
  goals:   [String],
  actions: [String],
  exams:   [String],
}, { _id: false });

const RoadmapSchema = new Schema<IRoadmap>({
  chosenPath:     String,
  specialization: String,
  phases:         [RoadmapPhaseSchema],
  collegeTargets: { type: Schema.Types.Mixed, default: null },
  keySkills:      [String],
  generatedAt:    { type: Date, default: Date.now },
}, { _id: false });

const CareerGuideSchema = new Schema<ICareerGuide>(
  {
    userId:          { type: String, required: true, index: true },
    resumeText:      { type: String, default: "" },
    githubUsername:  { type: String, default: "" },
    githubData:      { type: Schema.Types.Mixed, default: {} },
    mcqAnswers:      { type: Schema.Types.Mixed, default: [] },
    usedPlatformData:{ type: Boolean, default: false },
    careerOptions:   { type: [CareerPathSchema], default: [] },
    roadmap:         { type: RoadmapSchema, default: null },
    status:          { type: String, enum: ["analyzing", "options_ready", "roadmap_ready", "error"], default: "analyzing" },
  },
  { timestamps: true }
);

const CareerGuide: Model<ICareerGuide> =
  mongoose.models.CareerGuide ?? mongoose.model<ICareerGuide>("CareerGuide", CareerGuideSchema);

export default CareerGuide;
