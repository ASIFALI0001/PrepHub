import { connectDB } from "./mongodb";
import User from "@/models/User";

export async function updateStreak(userId: string): Promise<void> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) return;

    const now = new Date();
    // Use midnight of today (UTC) for stable day comparison
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const lastActive = user.lastActive ? new Date(user.lastActive) : null;

    if (lastActive) {
      const lastMidnight = new Date(Date.UTC(lastActive.getUTCFullYear(), lastActive.getUTCMonth(), lastActive.getUTCDate()));
      const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return; // already active today, no update needed
      if (diffDays === 1) {
        user.streak = (user.streak || 0) + 1; // consecutive day
      } else {
        user.streak = 1; // missed a day, reset
      }
    } else {
      user.streak = 1; // first activity ever
    }

    user.lastActive = now;
    await user.save();
  } catch (err) {
    console.error("[streak] update failed", err);
  }
}
