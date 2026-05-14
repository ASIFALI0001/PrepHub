import { NextRequest } from "next/server";

function getAdminEmail()    { return process.env.ADMIN_EMAIL    ?? ""; }
function getAdminPassword() { return process.env.ADMIN_PASSWORD ?? ""; }

function buildToken() {
  return Buffer.from(`${getAdminEmail()}:${getAdminPassword()}`).toString("base64");
}

export function isAdminRequest(req: NextRequest): boolean {
  return req.headers.get("x-admin-token") === buildToken();
}

export function getAdminToken(): string {
  return buildToken();
}

export function checkAdminCredentials(email: string, password: string): boolean {
  return email === getAdminEmail() && password === getAdminPassword();
}
