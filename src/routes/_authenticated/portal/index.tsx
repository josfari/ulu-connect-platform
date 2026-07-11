import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet, Banknote, User, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: PortalOverview,
});

function PortalOverview() {
  const { user } = Route.useRouteContext();

  const { data, isLoading } = useQuery({
    queryKey: ["portal-overview", user.id],
    queryFn: async () => {
      const memberRes = await supabase.from("members").select("*").eq("user_id", user.id).maybeSingle();
      const member = memberRes.data;
      if (!member) return { member: null, totalContrib: 0, activeLoans: 0, loanBalance: 0 };
      const [contribs, loans] = await Promise.all([
        supabase.from("contributions").select("amount").eq("member_id", member.id),
        supabase.from("loans").select("id, principal, status").eq("member_id", member.id),
      ]);
      const totalContrib = (contribs.data ?? []).reduce((s, c) => s + Number(c.amount), 0);
      const active = (loans.data ?? []).filter((l) => l.status === "active");
      const loanIds = active.map((l) => l.id);
      let repaid = 0;
      if (loanIds.length) {
        const rep = await supabase.from("repayments").select("amount").in("loan_id", loanIds);
        repaid = (rep.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      }
      const principal = active.reduce((s, l) => s + Number(l.principal), 0);
      return { member, totalContrib, activeLoans: active.length, loanBalance: Math.max(0, principal - repaid) };
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!data?.member) {
    return (
      <Card>
        <CardHeader><CardTitle>Welcome</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your account ({user.email}) isn't linked to a member record yet. Register as a member or contact an admin to link your account.
          </p>
          <Button asChild><Link to="/join">Register as member</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const m = data.member;
  const fmt = (n: number) => `KSh ${n.toLocaleString("en-KE")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hello, {m.full_name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Membership {m.membership_number ?? "pending"} · <Badge variant="secondary" className="capitalize">{m.status}</Badge></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Wallet} label="Total contributions" value={fmt(data.totalContrib)} to="/portal/contributions" />
        <StatCard icon={Banknote} label="Active loans" value={String(data.activeLoans)} to="/portal/loans" />
        <StatCard icon={Banknote} label="Loan balance" value={fmt(data.loanBalance)} to="/portal/loans" />
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Row label="Full name" value={m.full_name} />
          <Row label="Membership ID" value={m.membership_number ?? "—"} />
          <Row label="Category" value={m.membership_category} />
          <Row label="Phone" value={m.phone ?? "—"} />
          <Row label="Email" value={m.email ?? "—"} />
          <Row label="Joined" value={new Date(m.date_joined).toLocaleDateString("en-KE")} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; to: string }) {
  return (
    <Link to={to} className="group">
      <Card className="transition hover:border-primary">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
          <div className="flex-1">
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
        </CardContent>
      </Card>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
