import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Loader2,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  IdCard,
  Search,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminMembers, approveMember, rejectMember, getMemberPayments } from "@/lib/admin.functions";
import { MembershipCard } from "@/components/admin/MembershipCard";

export const Route = createFileRoute("/_authenticated/admin/members")({
  component: AdminMembers,
});

type Member = Awaited<ReturnType<typeof listAdminMembers>>["members"][number];

function statusBadgeClass(s: string): string {
  if (["active", "executive", "volunteer"].includes(s))
    return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
  if (["pending", "pending_payment", "payment_submitted"].includes(s))
    return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200";
  if (s === "inactive")
    return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
  return "";
}


function downloadCsv(members: Member[]) {
  const header = "Full Name,Email,Phone,National ID,Membership ID,Category,Status,Amount Paid,Date Joined\n";
  const rows = members
    .map((m) =>
      [
        m.full_name,
        m.email ?? "",
        m.phone ?? "",
        (m as { national_id?: string }).national_id ?? "",
        m.membership_number ?? "",
        m.membership_category,
        m.status,
        m.amount_paid,
        m.date_joined,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminMembers() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("pending");
  const [detail, setDetail] = useState<Member | null>(null);
  const [cardFor, setCardFor] = useState<Member | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const list = useServerFn(listAdminMembers);
  const approve = useServerFn(approveMember);
  const reject = useServerFn(rejectMember);
  const payments = useServerFn(getMemberPayments);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-members-full"],
    queryFn: () => list({}),
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin-member-payments", detail?.id],
    queryFn: () => payments({ data: { memberId: detail!.id } }),
    enabled: !!detail?.id,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => approve({ data: { memberId: id } }),
    onSuccess: (res, id) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Approved. Membership ID: ${res.membership_number}`);
      queryClient.invalidateQueries({ queryKey: ["admin-members-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
      // Open card
      const updated = data?.members.find((m) => m.id === id);
      if (updated) setCardFor({ ...updated, membership_number: res.membership_number, status: "active" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => reject({ data: { memberId: id } }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.error);
      toast.success("Member marked inactive.");
      queryClient.invalidateQueries({ queryKey: ["admin-members-full"] });
    },
  });

  const members = data?.members ?? [];
  const filtered = members.filter((m) => {
    const matchesTab =
      tab === "all"
        ? true
        : tab === "pending"
        ? ["pending", "pending_payment", "payment_submitted"].includes(m.status)
        : tab === "active"
        ? ["active", "executive", "volunteer"].includes(m.status)
        : m.status === "inactive";
    const term = q.trim().toLowerCase();
    const matchesQ =
      !term ||
      m.full_name.toLowerCase().includes(term) ||
      (m.phone ?? "").toLowerCase().includes(term) ||
      (m.membership_number ?? "").toLowerCase().includes(term);
    return matchesTab && matchesQ;
  });

  const counts = {
    pending: members.filter((m) => ["pending", "pending_payment", "payment_submitted"].includes(m.status)).length,
    active: members.filter((m) => ["active", "executive", "volunteer"].includes(m.status)).length,
    all: members.length,
    inactive: members.filter((m) => m.status === "inactive").length,
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `membership-card-${cardFor?.membership_number ?? cardFor?.id}.png`;
      a.click();
    } catch {
      toast.error("Could not export card image.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">Approve applications, verify payments, and manage the register.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => downloadCsv(members)} disabled={!members.length}>
            <Download className="mr-2 h-4 w-4" /> Download CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, phone, membership ID…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({counts.inactive})</TabsTrigger>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading members…
            </div>
          )}
          {isError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <p className="text-destructive">Could not load members.</p>
              <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
            </div>
          )}
          {data && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <UsersIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No members found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tab === "pending" ? "No pending applications right now." : "Try a different filter or search."}
              </p>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Paid</TableHead>
                    <TableHead className="hidden md:table-cell">Membership ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const isPending = ["pending", "pending_payment", "payment_submitted"].includes(m.status);
                    const paid = m.amount_paid >= 300;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {m.photo_display_url ? (
                              <img src={m.photo_display_url} alt={m.full_name} className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                                {m.full_name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{m.full_name}</div>
                              <div className="text-xs text-muted-foreground capitalize">{m.membership_category}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          <div>{m.phone ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{m.email ?? ""}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className={`capitalize ${statusBadgeClass(m.status)}`}>
                              {m.status.replace(/_/g, " ")}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                paid
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200 w-fit"
                                  : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200 w-fit"
                              }
                            >
                              {paid ? "Paid" : "Not Paid"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={paid ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            Ksh {m.amount_paid.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {m.membership_number ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setDetail(m)} aria-label="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {m.membership_number && (
                              <Button variant="ghost" size="sm" onClick={() => setCardFor(m)} aria-label="Card">
                                <IdCard className="h-4 w-4" />
                              </Button>
                            )}
                            {isPending && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={() => approveMut.mutate(m.id)}
                                disabled={approveMut.isPending}
                                aria-label="Approve"
                                title={paid ? "Approve" : "Approve (payment not completed)"}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            {m.status !== "inactive" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => {
                                  if (window.confirm(`Mark ${m.full_name} as inactive?`)) rejectMut.mutate(m.id);
                                }}
                                aria-label="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>

                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.full_name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-4">
                {detail.photo_display_url && (
                  <img src={detail.photo_display_url} alt="" className="h-32 w-32 rounded-lg object-cover" />
                )}
                <div className="space-y-1">
                  <div><span className="text-muted-foreground">Phone:</span> {detail.phone ?? "—"}</div>
                  <div><span className="text-muted-foreground">Email:</span> {detail.email ?? "—"}</div>
                  <div><span className="text-muted-foreground">Category:</span> {detail.membership_category}</div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusColor(detail.status)} className="capitalize">{detail.status.replace(/_/g, " ")}</Badge></div>
                  <div><span className="text-muted-foreground">Membership ID:</span> <span className="font-mono">{detail.membership_number ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Total paid:</span> Ksh {detail.amount_paid.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Payment history</h3>
                {paymentsQuery.isLoading && <p className="text-muted-foreground">Loading…</p>}
                {paymentsQuery.data?.payments.length === 0 && <p className="text-muted-foreground">No payments recorded.</p>}
                {(paymentsQuery.data?.payments ?? []).map((p) => (
                  <div key={p.id} className="flex justify-between border-b py-2">
                    <div>
                      <div className="font-mono text-xs">{p.mpesa_code}</div>
                      <div className="text-xs text-muted-foreground">{p.paid_on} · {p.payer_phone}</div>
                    </div>
                    <div className="text-right">
                      <div>Ksh {Number(p.amount).toLocaleString()}</div>
                      {p.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Membership card dialog */}
      <Dialog open={!!cardFor} onOpenChange={(v) => !v && setCardFor(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Membership Card</DialogTitle>
          </DialogHeader>
          {cardFor && (
            <div className="flex justify-center py-4 overflow-auto">
              <MembershipCard
                ref={cardRef}
                fullName={cardFor.full_name}
                membershipNumber={cardFor.membership_number ?? "PENDING"}
                category={cardFor.membership_category}
                dateJoined={cardFor.date_joined}
                photoUrl={cardFor.photo_display_url}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={downloadCard}>
              <Download className="mr-2 h-4 w-4" /> Download Card (PNG)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
