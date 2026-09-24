import { NextResponse } from "next/server";
import { scanDeviceHardware } from "@/lib/ai/device-scanner";

export async function GET() {
  try {
    const specs = scanDeviceHardware();
    return NextResponse.json(specs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
