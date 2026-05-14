import { NextRequest, NextResponse } from "next/server";
import { checkAdminCredentials, getAdminToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };
    if (checkAdminCredentials(email, password)) {
      return NextResponse.json({ token: getAdminToken() });
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
