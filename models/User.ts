import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  streak: number;
  lastActive: Date;
  topicProgress: Record<string, string[]>;
  quizStats: Record<string, { attempts: number; avgScore: number; lastScore: number; lastTaken: Date }>;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:      { type: String, required: true },
    streak:        { type: Number, default: 0 },
    lastActive:    { type: Date, default: Date.now },
    topicProgress: { type: Schema.Types.Mixed, default: {} },
    quizStats:     { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
