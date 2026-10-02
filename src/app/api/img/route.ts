import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return new NextResponse("Missing url", { status: 400 });
  }

  const widthParam = req.nextUrl.searchParams.get("w");
  const qualityParam = req.nextUrl.searchParams.get("q");
  const width = widthParam ? Math.min(1920, Math.max(80, Number.parseInt(widthParam, 10))) : undefined;
  const quality = qualityParam ? Math.min(95, Math.max(50, Number.parseInt(qualityParam, 10))) : 75;

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
    if (targetUrl.startsWith("http://")) {
      targetUrl = targetUrl.replace("http://", "https://");
    }
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
    const rawBuffer = Buffer.from(await upstream.arrayBuffer());

    // For SVG vectors, do not rasterize
    if (contentType.includes("svg") || targetUrl.endsWith(".svg")) {
      return new NextResponse(rawBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Resize and convert to modern high-efficiency WebP
    try {
      let pipeline = sharp(rawBuffer);
      if (width) {
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
      }
      const optimizedBuffer = await pipeline.webp({ quality, effort: 4 }).toBuffer();

      return new NextResponse(optimizedBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          "Vary": "Accept",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      // Fallback to original buffer if sharp transformation fails
      return new NextResponse(rawBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error: any) {
    return new NextResponse(`Fetch error: ${error?.message}`, { status: 502 });
  }
}
