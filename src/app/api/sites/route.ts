import { NextResponse } from "next/server";
import { CANDIDATE_SITES } from "@/lib/lola-terrain";

export async function GET() {
  return NextResponse.json({
    status: "success",
    count: CANDIDATE_SITES.length,
    sites: CANDIDATE_SITES,
  });
}
