import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/lib/types";

const API_SECRET = process.env.API_SECRET || "changeme";

/**
 * POST /api/revalidate
 * Manually revalidate ISR pages.
 * Body: { "paths": ["/", "/mi-articulo", "/categoria/ia"] }
 */
export async function POST(req: NextRequest) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${API_SECRET}`) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { paths } = await req.json();

        if (!paths || !Array.isArray(paths)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Body must include "paths" array' },
                { status: 400 }
            );
        }

        for (const path of paths) {
            revalidatePath(path);
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            data: { revalidated: paths },
        });
    } catch (err) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: (err as Error).message },
            { status: 500 }
        );
    }
}
