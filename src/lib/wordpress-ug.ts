import { getPosts, getCategories, getPostBySlug, getPages } from "./wordpress";
import { transliterateHtml, t } from "./i18n";

function transCategory(cat: any) {
  return { ...cat, name: t(cat.name, "ug") };
}

function transPost(post: any) {
  if (!post) return post;
  return {
    ...post,
    title: { ...post.title, rendered: t(post.title?.rendered || "", "ug") },
    content: { ...post.content, rendered: transliterateHtml(post.content?.rendered || "", "ug") },
    excerpt: { ...post.excerpt, rendered: transliterateHtml(post.excerpt?.rendered || "", "ug") },
    _embedded: {
      ...post._embedded,
      "wp:term": post._embedded?.["wp:term"]?.map((terms: any) => terms.map(transCategory)),
      author: post._embedded?.author?.map((a: any) => ({ ...a, name: t(a.name, "ug") }))
    }
  };
}

export async function getPostsUg(options: any) {
  const result = await getPosts(options);
  return {
    ...result,
    data: result.data.map(transPost)
  };
}

export async function getCategoriesUg() {
  const cats = await getCategories();
  return cats.map(transCategory);
}

export async function getPostBySlugUg(slug: string) {
  const post = await getPostBySlug(slug);
  return transPost(post);
}

export async function getPagesUg() {
  const pages = await getPages();
  return pages.map(transPost);
}

export { postCategory, postImage, readingMinutes, displayDate, WordPressError } from "./wordpress";
export type { WPPost, WPPage, Category } from "./wordpress";



export { toCachedImageUrl } from "./wordpress";

import { getPodcastPosts } from "./wordpress";
import { localPath as origLocalPath } from "./content";

export function localPath(link: string): string {
  return origLocalPath(link, "/ug");
}

export async function getPodcastPostsUg() {
  const posts = await getPodcastPosts();
  return posts.map(transPost);
}
