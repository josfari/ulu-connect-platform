import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/portal/loans")({
  component: MyLoans,
});

function MyLoans() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["portal-loans", user.id],
    queryFn: async () => {
      const m = await supabase.from("members").select("id").eq("user_id", user.id).maybeSingle();
      if (!m.data) return [];
      const l = await supabase.from("loans").select("*").eq("member_id", m.data.id).order("issued_date", { ascending: false });
      const loans = l.data ?? [];
      if (!loans.length) return [];
      const rep = await supabase.from("repayments").select("*").in("loan_id", loans.map((x) => x.id));
      const byLoan = new Map<string, { total: number; items: typeof rep.data }>();
      (rep.data ?? []).forEach((r) => {
        const cur = byLoan.get(r.loan_id) ?? { total: 0, items: [] };
        cur.total += Number(r.amount);
        cur.items!.push(r);
        byLoan.set(r.loan_id, cur);
      });
      return loans.map((ln) => {
        const rp = byLoan.get(ln.id) ?? { total: 0, items: [] };
        return { ...ln, repaid: rp.total, balance: Math.max(0, Number(ln.principal) - rp.total), repayments: rp.items ?? [] };
      });
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Loans</h1>
      {!data?.length ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">No loans issued yet.</div>
      ) : (
        <div className="space-y-4">
          {data.map((ln) => (
            <Card key={ln.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">KSh {Number(ln.principal).toLocaleString("en-KE")}</CardTitle>
                <Badge variant={ln.status === "active" ? "default" : ln.status === "overdue" ? "destructive" : "secondary"} className="capitalize">{ln.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Issued</p><p className="font-medium">{new Date(ln.issued_date).toLocaleDateString("en-KE")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Due</p><p className="font-medium">{ln.due_date ? new Date(ln.due_date).toLocaleDateString("en-KE") : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Repaid</p><p className="font-medium">KSh {ln.repaid.toLocaleString("en-KE")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Balance</p><p className="font-bold text-primary">KSh {ln.balance.toLocaleString("en-KE")}</p></div>
                </div>
                {ln.repayments.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary">Repayment history ({ln.repayments.length})</summary>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      {ln.repayments.map((r: any) => (
                        <li key={r.id} className="flex justify-between border-t py-1">
                          <span>{new Date(r.repayment_date).toLocaleDateString("en-KE")}</span>
                          <span>KSh {Number(r.amount).toLocaleString("en-KE")}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
