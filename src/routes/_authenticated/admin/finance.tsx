import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/finance")({
  component: AdminFinance,
});

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AdminFinance() {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["admin-members-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("id, full_name").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const contributionsQuery = useQuery({
    queryKey: ["admin-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("id, amount, contribution_date, note, members(full_name)")
        .order("contribution_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const loansQuery = useQuery({
    queryKey: ["admin-loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("id, principal, interest_rate, issued_date, due_date, status, note, members(full_name), repayments(amount)")
        .order("issued_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Contribution dialog
  const [contribOpen, setContribOpen] = useState(false);
  const [contribForm, setContribForm] = useState({ member_id: "", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });

  const addContribution = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("contributions").insert({
        member_id: contribForm.member_id,
        amount: Number(contribForm.amount),
        contribution_date: contribForm.date,
        note: contribForm.note.trim() || null,
        recorded_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contribution recorded.");
      setContribOpen(false);
      setContribForm({ member_id: "", amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not record the contribution."),
  });

  const deleteContribution = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contributions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contribution deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not delete the contribution."),
  });

  // Loan dialog
  const [loanOpen, setLoanOpen] = useState(false);
  const [loanForm, setLoanForm] = useState({
    member_id: "",
    principal: "",
    interest_rate: "10",
    issued_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    note: "",
  });

  const addLoan = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("loans").insert({
        member_id: loanForm.member_id,
        principal: Number(loanForm.principal),
        interest_rate: Number(loanForm.interest_rate),
        issued_date: loanForm.issued_date,
        due_date: loanForm.due_date || null,
        status: "active",
        note: loanForm.note.trim() || null,
        recorded_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loan issued.");
      setLoanOpen(false);
      setLoanForm({ member_id: "", principal: "", interest_rate: "10", issued_date: new Date().toISOString().slice(0, 10), due_date: "", note: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-loans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not issue the loan."),
  });

  // Repayment dialog
  const [repayLoanId, setRepayLoanId] = useState<string | null>(null);
  const [repayForm, setRepayForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), note: "" });

  const addRepayment = useMutation({
    mutationFn: async () => {
      if (!repayLoanId) return;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("repayments").insert({
        loan_id: repayLoanId,
        amount: Number(repayForm.amount),
        repayment_date: repayForm.date,
        note: repayForm.note.trim() || null,
        recorded_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Repayment recorded.");
      setRepayLoanId(null);
      setRepayForm({ amount: "", date: new Date().toISOString().slice(0, 10), note: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-loans"] });
    },
    onError: () => toast.error("Could not record the repayment."),
  });

  const updateLoanStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "repaid" | "defaulted" }) => {
      const { error } = await supabase.from("loans").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Loan status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-loans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not update the loan."),
  });

  const totalContrib = (contributionsQuery.data ?? []).reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Table Banking</h1>
          <p className="text-sm text-muted-foreground">Record contributions, issue loans, and track repayments.</p>
        </div>
      </div>

      <Tabs defaultValue="contributions">
        <TabsList>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="contributions" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Total: <span className="font-bold">KSh {totalContrib.toLocaleString()}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!contributionsQuery.data?.length}
                onClick={() =>
                  downloadCsv(
                    "contributions.csv",
                    ["Member", "Amount (KSh)", "Date", "Note"],
                    (contributionsQuery.data ?? []).map((c) => [
                      (c.members as { full_name: string } | null)?.full_name ?? "Unknown",
                      Number(c.amount),
                      c.contribution_date,
                      c.note ?? "",
                    ]),
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button onClick={() => setContribOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Record Contribution
              </Button>
            </div>
          </div>

          {contributionsQuery.isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading contributions…
            </div>
          )}
          {contributionsQuery.isError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
              Couldn't load contributions. You need admin access for financial records.
            </p>
          )}
          {contributionsQuery.data && contributionsQuery.data.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-semibold">No contributions recorded yet</p>
              <Button className="mt-4" onClick={() => setContribOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Contribution</Button>
            </div>
          )}
          {contributionsQuery.data && contributionsQuery.data.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Amount (KSh)</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributionsQuery.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{(c.members as { full_name: string } | null)?.full_name ?? "Unknown"}</TableCell>
                      <TableCell>{Number(c.amount).toLocaleString()}</TableCell>
                      <TableCell className="hidden sm:table-cell">{new Date(c.contribution_date).toLocaleDateString("en-KE")}</TableCell>
                      <TableCell className="hidden max-w-[200px] truncate md:table-cell">{c.note ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          aria-label="Delete"
                          onClick={() => {
                            if (window.confirm("Delete this contribution record?")) deleteContribution.mutate(c.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              disabled={!loansQuery.data?.length}
              onClick={() =>
                downloadCsv(
                  "loans.csv",
                  ["Member", "Principal (KSh)", "Interest %", "Issued", "Due", "Status", "Repaid (KSh)"],
                  (loansQuery.data ?? []).map((l) => [
                    (l.members as { full_name: string } | null)?.full_name ?? "Unknown",
                    Number(l.principal),
                    Number(l.interest_rate),
                    l.issued_date,
                    l.due_date ?? "",
                    l.status,
                    ((l.repayments as { amount: number }[] | null) ?? []).reduce((s, r) => s + Number(r.amount), 0),
                  ]),
                )
              }
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => setLoanOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Issue Loan
            </Button>
          </div>

          {loansQuery.isLoading && (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading loans…
            </div>
          )}
          {loansQuery.isError && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive">
              Couldn't load loans. You need admin access for financial records.
            </p>
          )}
          {loansQuery.data && loansQuery.data.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-semibold">No loans issued yet</p>
              <Button className="mt-4" onClick={() => setLoanOpen(true)}><Plus className="mr-2 h-4 w-4" /> Issue Loan</Button>
            </div>
          )}
          {loansQuery.data && loansQuery.data.length > 0 && (
            <div className="rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead className="hidden sm:table-cell">Repaid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loansQuery.data.map((l) => {
                    const repaid = ((l.repayments as { amount: number }[] | null) ?? []).reduce((s, r) => s + Number(r.amount), 0);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{(l.members as { full_name: string } | null)?.full_name ?? "Unknown"}</TableCell>
                        <TableCell>KSh {Number(l.principal).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell">KSh {repaid.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={l.status === "active" ? "default" : l.status === "repaid" ? "secondary" : "destructive"} className="capitalize">
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{l.due_date ? new Date(l.due_date).toLocaleDateString("en-KE") : "—"}</TableCell>
                        <TableCell className="space-x-1 text-right">
                          {l.status === "active" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => setRepayLoanId(l.id)}>
                                Repay
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Mark repaid"
                                onClick={() => {
                                  if (window.confirm("Mark this loan as fully repaid?")) updateLoanStatus.mutate({ id: l.id, status: "repaid" });
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              </Button>
                            </>
                          )}
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

      {/* Record contribution dialog */}
      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Contribution</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!contribForm.member_id) return toast.error("Select a member.");
              addContribution.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={contribForm.member_id} onValueChange={(v) => setContribForm({ ...contribForm, member_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {(membersQuery.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-amount">Amount (KSh)</Label>
                <Input id="c-amount" type="number" min={1} required value={contribForm.amount} onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-date">Date</Label>
                <Input id="c-date" type="date" required value={contribForm.date} onChange={(e) => setContribForm({ ...contribForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-note">Note (optional)</Label>
              <Input id="c-note" value={contribForm.note} onChange={(e) => setContribForm({ ...contribForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setContribOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addContribution.isPending}>
                {addContribution.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Issue loan dialog */}
      <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue Loan</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!loanForm.member_id) return toast.error("Select a member.");
              addLoan.mutate();
            }}
          >
            <div className="space-y-2">
              <Label>Member</Label>
              <Select value={loanForm.member_id} onValueChange={(v) => setLoanForm({ ...loanForm, member_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {(membersQuery.data ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="l-principal">Principal (KSh)</Label>
                <Input id="l-principal" type="number" min={1} required value={loanForm.principal} onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-interest">Interest rate (%)</Label>
                <Input id="l-interest" type="number" min={0} step="0.5" required value={loanForm.interest_rate} onChange={(e) => setLoanForm({ ...loanForm, interest_rate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-issued">Issued date</Label>
                <Input id="l-issued" type="date" required value={loanForm.issued_date} onChange={(e) => setLoanForm({ ...loanForm, issued_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-due">Due date (optional)</Label>
                <Input id="l-due" type="date" value={loanForm.due_date} onChange={(e) => setLoanForm({ ...loanForm, due_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-note">Note (optional)</Label>
              <Input id="l-note" value={loanForm.note} onChange={(e) => setLoanForm({ ...loanForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLoanOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addLoan.isPending}>
                {addLoan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record repayment dialog */}
      <Dialog open={!!repayLoanId} onOpenChange={(o) => !o && setRepayLoanId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Repayment</DialogTitle></DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              addRepayment.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="r-amount">Amount (KSh)</Label>
                <Input id="r-amount" type="number" min={1} required value={repayForm.amount} onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-date">Date</Label>
                <Input id="r-date" type="date" required value={repayForm.date} onChange={(e) => setRepayForm({ ...repayForm, date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-note">Note (optional)</Label>
              <Input id="r-note" value={repayForm.note} onChange={(e) => setRepayForm({ ...repayForm, note: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRepayLoanId(null)}>Cancel</Button>
              <Button type="submit" disabled={addRepayment.isPending}>
                {addRepayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
