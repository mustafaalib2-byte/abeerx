import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedAdminRequest, CORS_HEADERS } from "@/lib/adminAuth";
import { rebuildAndPublishCatalog } from "@/lib/catalogBuilder";

// Reading ~5 MB from Firebase + listing R2 + publishing takes a few seconds.
export const maxDuration = 60;

/**
 * POST /api/catalog/rebuild
 * Called automatically by admin.html after any product change. Rebuilds catalog.json
 * from the POS database, publishes it to R2, then refreshes the website's pages.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorizedAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }
  try {
    const result = await rebuildAndPublishCatalog();
    // Every page lives under app/[locale]; refresh them all on their next visit.
    revalidatePath("/[locale]", "layout");
    return NextResponse.json({ success: true, ...result }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("Catalog rebuild failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
