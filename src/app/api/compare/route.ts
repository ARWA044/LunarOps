import { NextRequest, NextResponse } from "next/server";
import { CANDIDATE_SITES, getSiteById } from "@/lib/lola-terrain";
import { analyzeSiteVisibility } from "@/lib/astronomical";
import { generateNarrativeSummary } from "@/lib/narrative";
import { ComparisonResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const siteAId = body.siteAId || "site-a";
    const siteBId = body.siteBId || "site-b";
    const startStr = body.startDate || "2027-01-01T00:00:00Z";
    const endStr = body.endDate || "2027-01-07T23:59:59Z";
    const stepHours = Number(body.stepHours) || 1;

    const siteA = getSiteById(siteAId) || CANDIDATE_SITES[0];
    const siteB = getSiteById(siteBId) || CANDIDATE_SITES[1];

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    const siteAResult = analyzeSiteVisibility(siteA, startDate, endDate, stepHours);
    const siteBResult = analyzeSiteVisibility(siteB, startDate, endDate, stepHours);

    const narrative = generateNarrativeSummary(
      siteAResult,
      siteBResult,
      startDate.toISOString().slice(0, 10),
      endDate.toISOString().slice(0, 10)
    );

    const responseData: ComparisonResponse = {
      siteA: siteAResult,
      siteB: siteBResult,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        stepHours,
      },
      generatedAt: new Date().toISOString(),
      summaryNarrative: narrative,
      engine: "typescript-client",
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API /api/compare error:", error);
    return NextResponse.json(
      { error: "Failed to compute landing-site comparison telemetry" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const siteAId = searchParams.get("siteA") || "site-a";
  const siteBId = searchParams.get("siteB") || "site-b";
  const startStr = searchParams.get("start") || "2027-01-01T00:00:00Z";
  const endStr = searchParams.get("end") || "2027-01-07T23:59:59Z";
  const stepHours = Number(searchParams.get("step")) || 1;

  const siteA = getSiteById(siteAId) || CANDIDATE_SITES[0];
  const siteB = getSiteById(siteBId) || CANDIDATE_SITES[1];

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);

  const siteAResult = analyzeSiteVisibility(siteA, startDate, endDate, stepHours);
  const siteBResult = analyzeSiteVisibility(siteB, startDate, endDate, stepHours);

  const narrative = generateNarrativeSummary(
    siteAResult,
    siteBResult,
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10)
  );

  const responseData: ComparisonResponse = {
    siteA: siteAResult,
    siteB: siteBResult,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      stepHours,
    },
    generatedAt: new Date().toISOString(),
    summaryNarrative: narrative,
    engine: "typescript-client",
  };

  return NextResponse.json(responseData);
}
