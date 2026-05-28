import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  return signOut();
}

export async function POST() {
  return signOut();
}

async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  return NextResponse.redirect(new URL("/", process.env.BETTER_AUTH_URL ?? "http://localhost:3000"));
}
