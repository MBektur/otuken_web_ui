import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new NextResponse("Missing url", { status: 400 });
  }

  // Security check: Only allow images from orhunpolicycenter.com or youtube
  let targetUrl: string;
  try {
    const parsed = new URL(urlParam);
    if (
      !parsed.hostname.endsWith("orhunpolicycenter.com") &&
      !parsed.hostname.endsWith("youtube.com") &&
      !parsed.hostname.endsWith("ytimg.com")
    ) {
      return new NextResponse("Host not allowed", { status: 403 });
    }
    targetUrl = parsed.toString();
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OtukenImageProxy/1.0)",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: 31536000 },
      signal: AbortSignal.timeout(12000),
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream failed: ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new NextResponse(`Fetch error: ${error?.message}`, { status: 502 });
  }
}
