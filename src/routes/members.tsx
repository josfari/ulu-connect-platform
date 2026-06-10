import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UserRound } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { getPublicMembers } from "@/lib/public.functions";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [
      { title: "Members & Leadership — The Ulu We Want SHG" },
      { name: "description", content: "Meet the leadership team and members of The Ulu We Want Self-Help Group in Ulu, Kenya." },
      { property: "og:title", content: "Members & Leadership — The Ulu We Want SHG" },
      { property: "og:description", content: "Meet the people driving community change in Ulu, Kenya." },
    ],
  }),
  component: MembersPage,
});

function MembersPage() {
  const fetchMembers = useServerFn(getPublicMembers);

  const leadership = useQuery({
    queryKey: ["public-staff"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name, role, photo_url, bio, role_description, sort_order")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const members = useQuery({
    queryKey: ["public-members"],
    queryFn: () => fetchMembers(),
  });

  return (
    <SiteLayout>
      <main>
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-80">Our People</p>
            <h1 className="max-w-2xl text-4xl font-bold md:text-5xl">The hands and hearts behind the work.</h1>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-secondary">Leadership Team</h2>
          {leadership.isLoading && (
            <div className="flex items-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading leadership…
            </div>
          )}
          {leadership.isError && <p className="py-8 text-destructive">Couldn't load the leadership team. Please refresh the page.</p>}
          {leadership.data && leadership.data.length === 0 && (
            <p className="py-8 text-muted-foreground">Leadership profiles coming soon.</p>
          )}
          {leadership.data && leadership.data.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {leadership.data.map((s) => (
                <div key={s.id} className="rounded-2xl bg-card p-6 shadow-card">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} className="h-20 w-20 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <UserRound className="h-9 w-9 text-primary" />
                    </div>
                  )}
                  <h3 className="mt-4 text-lg font-bold">{s.name}</h3>
                  <p className="text-sm font-semibold text-primary">{s.role}</p>
                  {s.bio && <p className="mt-2 text-sm text-muted-foreground">{s.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-muted py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold text-secondary">Our Members</h2>
            <p className="mt-2 text-muted-foreground">The strength of the group is the member; the strength of the member is the group.</p>
            {members.isLoading && (
              <div className="flex items-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading members…
              </div>
            )}
            {(members.isError || members.data?.error) && (
              <p className="py-8 text-destructive">Couldn't load members right now. Please try again later.</p>
            )}
            {members.data && !members.data.error && members.data.members.length === 0 && (
              <p className="py-8 text-muted-foreground">Member profiles coming soon.</p>
            )}
            {members.data && members.data.members.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.data.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt={m.full_name} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <UserRound className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.full_name}</p>
                      <div className="mt-0.5 flex flex-wrap gap-1.5">
                        {m.role && <Badge variant="secondary" className="text-xs">{m.role}</Badge>}
                        <Badge variant="outline" className="text-xs capitalize">{m.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
