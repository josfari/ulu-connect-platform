import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, CalendarDays } from "lucide-react";
import DOMPurify from "dompurify";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getPublicPosts } from "@/lib/public.functions";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Desk — The Ulu We Want SHG" },
      { name: "description", content: "News, updates, and stories from The Ulu We Want Self-Help Group — community projects, events, and impact in Ulu, Kenya." },
      { property: "og:title", content: "Media Desk — The Ulu We Want SHG" },
      { property: "og:description", content: "News, updates, and stories from our community in Ulu, Kenya." },
    ],
  }),
  component: MediaPage,
});

type Post = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
  featured: boolean;
};

function MediaPage() {
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const fetchPosts = useServerFn(getPublicPosts);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-posts"],
    queryFn: async () => {
      const res = await fetchPosts();
      if (res.error) throw new Error(res.error);
      return res.posts as Post[];
    },
  });

  return (
    <SiteLayout>
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-80">Media Desk</p>
            <h1 className="max-w-2xl text-4xl font-bold md:text-5xl">News & stories from our community.</h1>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading stories…
            </div>
          )}
          {isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="font-medium text-destructive">We couldn't load the news right now.</p>
              <button onClick={() => refetch()} className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
                Try again
              </button>
            </div>
          )}
          {data && data.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-lg font-semibold">No stories published yet.</p>
              <p className="mt-2 text-muted-foreground">Our media desk will share updates here soon.</p>
            </div>
          )}
          {data && data.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {data.map((p) => (
                <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card">
                  {p.cover_image_url && (
                    <img src={p.cover_image_url} alt={p.title} loading="lazy" className="h-44 w-full object-cover" width={800} height={450} />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {p.published_at ? new Date(p.published_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                      {p.featured && <Badge className="ml-auto">Featured</Badge>}
                    </div>
                    <h2 className="mt-3 text-lg font-bold">{p.title}</h2>
                    {p.excerpt && <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>}
                    <button
                      onClick={() => setOpenPost(p)}
                      className="mt-4 self-start text-sm font-semibold text-primary hover:underline"
                    >
                      Read more →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <Dialog open={!!openPost} onOpenChange={(o) => !o && setOpenPost(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            {openPost && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{openPost.title}</DialogTitle>
                </DialogHeader>
                {openPost.cover_image_url && (
                  <img src={openPost.cover_image_url} alt={openPost.title} className="w-full rounded-lg object-cover" />
                )}
                <div
                  className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap text-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(openPost.content) }}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </SiteLayout>
  );
}
