import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Our Projects — The Ulu We Want SHG" },
      { name: "description", content: "Explore community projects by The Ulu We Want SHG: Starlink internet, PA system rental, table banking, and youth empowerment in Ulu, Kenya." },
      { property: "og:title", content: "Our Projects — The Ulu We Want SHG" },
      { property: "og:description", content: "Community projects delivering technology, income, and financial inclusion in Ulu, Kenya." },
    ],
  }),
  component: ProjectsPage,
});

const statusLabel: Record<string, string> = { planned: "Planned", ongoing: "Ongoing", completed: "Completed" };

function ProjectsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["public-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, slug, description, image_url, status, progress, impact_summary, category, featured")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteLayout>
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-80">Our Work</p>
            <h1 className="max-w-2xl text-4xl font-bold md:text-5xl">Projects building the Ulu we want.</h1>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading projects…
            </div>
          )}
          {isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
              <p className="font-medium text-destructive">We couldn't load the projects.</p>
              <button onClick={() => refetch()} className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
                Try again
              </button>
            </div>
          )}
          {data && data.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-lg font-semibold">No projects published yet.</p>
              <p className="mt-2 text-muted-foreground">Check back soon — exciting things are coming.</p>
            </div>
          )}
          {data && data.length > 0 && (
            <div className="grid gap-8 md:grid-cols-2">
              {data.map((p) => (
                <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-transform hover:-translate-y-1">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.title} loading="lazy" className="h-56 w-full object-cover" width={1024} height={768} />
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{p.category}</Badge>
                      <Badge variant={p.status === "completed" ? "default" : "outline"}>{statusLabel[p.status] ?? p.status}</Badge>
                    </div>
                    <h2 className="mt-3 text-xl font-bold">{p.title}</h2>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.description}</p>
                    {p.impact_summary && (
                      <p className="mt-3 rounded-lg bg-primary/5 p-3 text-sm font-medium text-primary">{p.impact_summary}</p>
                    )}
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{p.progress}%</span>
                      </div>
                      <Progress value={p.progress} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-16 rounded-2xl bg-secondary p-10 text-center text-secondary-foreground">
            <h2 className="text-2xl font-bold">Want to support a project?</h2>
            <p className="mx-auto mt-2 max-w-xl opacity-80">Partner with us, volunteer your skills, or contribute to a project fund.</p>
            <Link to="/contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-cta px-7 py-3 font-semibold text-accent-foreground">
              Get Involved <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
