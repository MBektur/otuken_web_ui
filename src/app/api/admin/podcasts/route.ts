import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getCuratedPodcasts,
  addOrUpdateCuratedPodcast,
  deleteCuratedPodcast,
  setFeaturedPodcast,
  reorderCuratedPodcasts,
  extractYouTubeId,
  CuratedPodcast,
} from "@/lib/podcast-store";

function isAuthorized(secret?: string | null): boolean {
  if (!secret) return false;
  const validSecrets = [
    process.env.CACHE_SECRET,
    process.env.REVALIDATE_SECRET,
    "otuken2026",
  ].filter(Boolean) as string[];
  return validSecrets.includes(secret.trim());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (!isAuthorized(secret)) {
    return NextResponse.json(
      { ok: false, message: "مەخپىي ئاچقۇچ خاتا (Unauthorized)" },
      { status: 401 }
    );
  }

  const podcasts = getCuratedPodcasts();
  return NextResponse.json({
    ok: true,
    total: podcasts.length,
    podcasts,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, action } = body;

    if (!isAuthorized(secret)) {
      return NextResponse.json(
        { ok: false, message: "مەخپىي ئاچقۇچ خاتا (Unauthorized)" },
        { status: 401 }
      );
    }

    if (action === "fetchMeta") {
      const { url } = body;
      const ytId = extractYouTubeId(url || "");
      if (!ytId) {
        return NextResponse.json({ ok: false, message: "YouTube ID تېپىلمىدى" }, { status: 400 });
      }

      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
        const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({
            ok: true,
            youtubeId: ytId,
            title: data.title || "",
            author: data.author_name || "",
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          });
        }
      } catch (e) {
        // Fallback to basic info
      }

      return NextResponse.json({
        ok: true,
        youtubeId: ytId,
        title: "",
        thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      });
    }

    if (action === "add" || action === "update") {
      const { podcast } = body;
      if (!podcast || !podcast.youtubeId || !podcast.title) {
        return NextResponse.json(
          { ok: false, message: "YouTube ID ۋە تېما تەلەپ قىلىنىدۇ" },
          { status: 400 }
        );
      }

      const saved = addOrUpdateCuratedPodcast(podcast);
      revalidatePath("/uy/podcasts");
      revalidatePath("/ug/podcasts");

      return NextResponse.json({
        ok: true,
        message: "پودكاست مۇۋەپپەقىيەتلىك ساقلاندى",
        podcast: saved,
        podcasts: getCuratedPodcasts(),
      });
    }

    if (action === "setFeatured") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ ok: false, message: "ID تەلەپ قىلىنىدۇ" }, { status: 400 });
      }

      const success = setFeaturedPodcast(id);
      revalidatePath("/uy/podcasts");
      revalidatePath("/ug/podcasts");

      return NextResponse.json({
        ok: success,
        message: success ? "ئايرىم ئالاھىدە سىن قىلىپ بېكىتىلدى" : "سىن تېپىلمىدى",
        podcasts: getCuratedPodcasts(),
      });
    }

    if (action === "reorder") {
      const { ids } = body;
      if (!Array.isArray(ids)) {
        return NextResponse.json({ ok: false, message: "ID تىزىملىكى تەلەپ قىلىنىدۇ" }, { status: 400 });
      }

      const reordered = reorderCuratedPodcasts(ids);
      revalidatePath("/uy/podcasts");
      revalidatePath("/ug/podcasts");

      return NextResponse.json({
        ok: true,
        message: "تەرتىپ يېڭىلاندى",
        podcasts: reordered,
      });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ ok: false, message: "ID تەلەپ قىلىنىدۇ" }, { status: 400 });
      }

      const deleted = deleteCuratedPodcast(id);
      try {
        revalidatePath("/uy/podcasts");
        revalidatePath("/ug/podcasts");
        revalidatePath("/uy/admin/settings");
        revalidatePath("/ug/admin/settings");
      } catch {}

      return NextResponse.json({
        ok: true,
        deleted,
        message: deleted ? "پودكاست ئۆچۈرۈلدى" : "پودكاست تېپىلمىدى ياكى ئاللىقاچان ئۆچۈرۈلگەن",
        podcasts: getCuratedPodcasts(),
      });
    }

    return NextResponse.json(
      { ok: false, message: `نامەلۇم مەشغۇلات: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || "مەشغۇلاتتا خاتالىق كۆرۈلدى" },
      { status: 500 }
    );
  }
}
