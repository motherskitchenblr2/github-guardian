import { NextRequest, NextResponse } from "next/server";
import { CATALOG_MODELS } from "@/lib/ai/providers";
import { DEFAULT_MODEL_ASSIGNMENTS } from "@/lib/ai/router";

export async function GET() {
  return NextResponse.json({
    models: CATALOG_MODELS,
    assignments: DEFAULT_MODEL_ASSIGNMENTS,
  });
}
