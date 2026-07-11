import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/portal/contributions")({
  component: MyContributions,
});

function MyContributions() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["portal-contribs", user.id],
    queryFn: async () => {
      const m = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
      if (!m.data) return { rows: [], total: 0 };
      const c = await supabase.from("contributions").select("*").eq("member_id", m.data.id).order("contribution_date", { ascending: false });
      const rows = c.data ?? [];
      return { rows, total: rows.reduce((s, r) => s + Number(r.amount), 0) };
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">My Contributions</h1>
        <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">KSh {(data?.total ?? 0).toLocaleString("en-KE")}</span></p>
      </div>
      {!data?.rows.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No contributions recorded yet.</div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Note</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.contribution_date).toLocaleDateString("en-KE")}</TableCell>
                  <TableCell className="font-medium">KSh {Number(r.amount).toLocaleString("en-KE")}</TableCell>
                  <TableCell className="text-muted-foreground">{r.note ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
