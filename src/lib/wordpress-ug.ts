import { getPosts, getCategories, getPostBySlug, getPages, type WPPost } from "./wordpress";
import { transliterateHtml, t } from "./i18n";

let cachedUgCategories: any[] | null = null;

function transCategory(cat: any) {
  return { ...cat, name: t(cat.name, "ug") };
}

function transPost(post: any, withContent: boolean = false) {
  if (!post) return post;
  return {
    ...post,
    title: { ...post.title, rendered: t(post.title?.rendered || "", "ug") },
    content: {
      ...post.content,
      rendered: withContent && post.content?.rendered ? transliterateHtml(post.content.rendered, "ug") : (post.content?.rendered || "")
    },
    excerpt: { ...post.excerpt, rendered: transliterateHtml(post.excerpt?.rendered || "", "ug") },
    _embedded: {
      ...post._embedded,
      "wp:term": post._embedded?.["wp:term"]?.map((terms: any) => terms.map(transCategory)),
      author: post._embedded?.author?.map((a: any) => ({ ...a, name: t(a.name, "ug") }))
    }
  };
}

export async function getPostsUg(options: any = {}) {
  const result = await getPosts(options);
  const withContent = Boolean(options?.withContent);
  return {
    ...result,
    data: result.data.map((p: any) => transPost(p, withContent))
  };
}

export async function getCategoriesUg() {
  if (cachedUgCategories) return cachedUgCategories;
  const cats = await getCategories();
  cachedUgCategories = cats.map(transCategory);
  return cachedUgCategories;
}

export async function getPostBySlugUg(slug: string) {
  const post = await getPostBySlug(slug);
  return transPost(post, true);
}

export async function getPagesUg() {
  const pages = await getPages();
  return pages.map((p: any) => transPost(p, true));
}

export { postCategory, postImage, readingMinutes, displayDate, WordPressError } from "./wordpress";
export type { WPPost, WPPage, Category } from "./wordpress";



export { toCachedImageUrl } from "./wordpress";

import { getPodcastPosts, getSmartRelatedPosts } from "./wordpress";
import { localPath as origLocalPath } from "./content";

export function localPath(link: string): string {
  return origLocalPath(link, "/ug");
}

export async function getPodcastPostsUg() {
  const posts = await getPodcastPosts();
  return posts.map(p => transPost(p, false));
}

export function getSmartRelatedPostsUg(currentPost: WPPost, limit = 8): WPPost[] {
  const posts = getSmartRelatedPosts(currentPost, limit);
  return posts.map(p => transPost(p, false));
}
