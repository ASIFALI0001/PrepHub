import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFeatureRatings {
  learn:        number;  // 0-5 stars
  quiz:         number;
  interview:    number;
  companyBrain: number;
  ats:          number;
  careerGuide:  number;
}

export interface IFeedback extends Document {
  userId:    string;
  userName:  string;
  userEmail: string;
  ratings:   IFeatureRatings;
  text:      string;   // optional open-ended response
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId:    { type: String, required: true, index: true },
    userName:  { type: String, required: true },
    userEmail: { type: String, required: true },
    ratings: {
      learn:        { type: Number, default: 0, min: 0, max: 5 },
      quiz:         { type: Number, default: 0, min: 0, max: 5 },
      interview:    { type: Number, default: 0, min: 0, max: 5 },
      companyBrain: { type: Number, default: 0, min: 0, max: 5 },
      ats:          { type: Number, default: 0, min: 0, max: 5 },
      careerGuide:  { type: Number, default: 0, min: 0, max: 5 },
    },
    text: { type: String, default: "" },
  },
  { timestamps: true }
);

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback ?? mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default Feedback;
