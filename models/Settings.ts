import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Platform-wide settings — a single document (key: "platform").
 * `disabledPages` holds the feature keys an admin has paused for maintenance,
 * e.g. ["quiz", "interview"]. Stored in Mongo so it survives refresh/restart.
 */
export interface ISettings extends Document {
  key: string;
  disabledPages: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: "platform" },
    disabledPages: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ?? mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;

// Page constants live in lib/pages.ts (mongoose-free, client-safe).
export { TOGGLEABLE_PAGES, VALID_PAGE_KEYS } from "@/lib/pages";
