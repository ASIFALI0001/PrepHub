import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion {
  id: string;
  text: string;
  expectedKeyPoints: string[];
}

export interface IAnswer {
  questionId: string;
  questionText: string;
  answerText: string;
}

export interface IQuestionReport {
  questionId: string;
  questionText: string;
  answerText: string;
  score: number; // 0–10
  feedback: string;
  keyPointsCovered: string[];
  keyPointsMissed: string[];
}

export interface IReport {
  overallScore: number; // 0–100
  grade: string; // A/B/C/D/F
  correctness: number;
  structure: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  questionReports: IQuestionReport[];
  generatedAt: Date;
}

export interface IInterview extends Document {
  userId: string;
  title: string;
  role: string;
  type: "technical" | "behavioral" | "mixed";
  level: "beginner" | "intermediate" | "senior";
  questionCount: number;
  questions: IQuestion[];
  answers: IAnswer[];
  report: IReport | null;
  status: "pending" | "in_progress" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: String,
  text: String,
  expectedKeyPoints: [String],
}, { _id: false });

const AnswerSchema = new Schema<IAnswer>({
  questionId: String,
  questionText: String,
  answerText: String,
}, { _id: false });

const QuestionReportSchema = new Schema<IQuestionReport>({
  questionId: String,
  questionText: String,
  answerText: String,
  score: Number,
  feedback: String,
  keyPointsCovered: [String],
  keyPointsMissed: [String],
}, { _id: false });

const ReportSchema = new Schema<IReport>({
  overallScore: Number,
  grade: String,
  correctness: Number,
  structure: Number,
  confidence: Number,
  strengths: [String],
  improvements: [String],
  summary: String,
  questionReports: [QuestionReportSchema],
  generatedAt: { type: Date, default: Date.now },
}, { _id: false });

const InterviewSchema = new Schema<IInterview>(
  {
    userId:        { type: String, required: true, index: true },
    title:         { type: String, required: true },
    role:          { type: String, required: true },
    type:          { type: String, enum: ["technical", "behavioral", "mixed"], required: true },
    level:         { type: String, enum: ["beginner", "intermediate", "senior"], required: true },
    questionCount: { type: Number, required: true },
    questions:     { type: [QuestionSchema], default: [] },
    answers:       { type: [AnswerSchema], default: [] },
    report:        { type: ReportSchema, default: null },
    status:        { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  },
  { timestamps: true }
);

const Interview: Model<IInterview> =
  mongoose.models.Interview ?? mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
