import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Users, UserCog, Newspaper, Banknote, Mail, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [projects, members, staff, posts, messages, contributions, loans] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase.from("staff").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false),
        supabase.from("contributions").select("amount"),
        supabase.from("loans").select("principal, status"),
      ]);
      const totalContributions = (contributions.data ?? []).reduce((s, c) => s + Number(c.amount), 0);
      const activeLoans = (loans.data ?? []).filter((l) => l.status === "active");
      return {
        projects: projects.count ?? 0,
        members: members.count ?? 0,
        staff: staff.count ?? 0,
        posts: posts.count ?? 0,
        unreadMessages: messages.count ?? 0,
        totalContributions,
        activeLoans: activeLoans.length,
        loanedOut: activeLoans.reduce((s, l) => s + Number(l.principal), 0),
      };
    },
  });

  const recentMessages = useQuery({
    queryKey: ["admin-recent-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("id, name, subject, read, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading dashboard…
      </div>
    );
  }
  if (isError || !data) {
    return <p className="py-12 text-center text-destructive">Couldn't load dashboard stats. Please refresh.</p>;
  }

  const cards = [
    { label: "Projects", value: data.projects, icon: FolderKanban, to: "/admin/projects" as const },
    { label: "Members", value: data.members, icon: Users, to: "/admin/members" as const },
    { label: "Staff & Leadership", value: data.staff, icon: UserCog, to: "/admin/staff" as const },
    { label: "Posts", value: data.posts, icon: Newspaper, to: "/admin/media" as const },
    { label: "Unread Messages", value: data.unreadMessages, icon: Mail, to: "/admin/messages" as const },
    { label: "Active Loans", value: data.activeLoans, icon: Banknote, to: "/admin/finance" as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of The Ulu We Want SHG.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <c.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Table Banking Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between rounded-lg bg-muted p-3 text-sm">
              <span>Total contributions</span>
              <span className="font-bold">KSh {data.totalContributions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between rounded-lg bg-muted p-3 text-sm">
              <span>Currently loaned out</span>
              <span className="font-bold">KSh {data.loanedOut.toLocaleString()}</span>
            </div>
            <Link to="/admin/finance" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Open Table Banking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMessages.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {recentMessages.data && recentMessages.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
            <ul className="space-y-2">
              {recentMessages.data?.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.subject ?? "No subject"}</p>
                  </div>
                  {!m.read && <Badge>New</Badge>}
                </li>
              ))}
            </ul>
            <Link to="/admin/messages" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View all messages <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
