import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/members")({
  component: AdminMembers,
});

type MemberRow = {
  id: string;
  full_name: string;
  role: string | null;
  membership_category: string;
  phone: string | null;
  email: string | null;
  show_contact: boolean;
  status: "pending" | "active" | "executive" | "volunteer" | "inactive";
  date_joined: string;
  photo_url: string | null;
  bio: string | null;
};

const emptyForm = {
  full_name: "",
  role: "",
  membership_category: "regular",
  phone: "",
  email: "",
  show_contact: false,
  status: "active" as MemberRow["status"],
  date_joined: new Date().toISOString().slice(0, 10),
  bio: "",
};

function AdminMembers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*").order("full_name");
      if (error) throw error;
      return data as MemberRow[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: MemberRow) => {
    setEditing(m);
    setForm({
      full_name: m.full_name,
      role: m.role ?? "",
      membership_category: m.membership_category,
      phone: m.phone ?? "",
      email: m.email ?? "",
      show_contact: m.show_contact,
      status: m.status,
      date_joined: m.date_joined,
      bio: m.bio ?? "",
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: form.full_name.trim(),
        role: form.role.trim() || null,
        membership_category: form.membership_category,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        show_contact: form.show_contact,
        status: form.status,
        date_joined: form.date_joined,
        bio: form.bio.trim() || null,
      };
      const res = editing
        ? await supabase.from("members").update(payload).eq("id", editing.id)
        : await supabase.from("members").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Member updated." : "Member added.");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      queryClient.invalidateQueries({ queryKey: ["public-members"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the member."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      queryClient.invalidateQueries({ queryKey: ["public-members"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not remove the member. They may have linked contributions or loans."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">Manage the group membership register.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New Member
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading members…
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Couldn't load members. You may not have admin permission.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-semibold">No members registered</p>
          <p className="mt-1 text-sm text-muted-foreground">Start building the membership register.</p>
          <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add New Member</Button>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name}</TableCell>
                  <TableCell className="hidden md:table-cell">{m.role ?? "—"}</TableCell>
                  <TableCell><Badge variant={m.status === "inactive" ? "outline" : "secondary"} className="capitalize">{m.status}</Badge></TableCell>
                  <TableCell className="hidden lg:table-cell">{m.phone ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{new Date(m.date_joined).toLocaleDateString("en-KE")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label="Delete"
                      onClick={() => {
                        if (window.confirm(`Remove member "${m.full_name}"? This cannot be undone.`)) deleteMutation.mutate(m.id);
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "Add New Member"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="m-name">Full name</Label>
              <Input id="m-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="m-role">Group role (optional)</Label>
                <Input id="m-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Treasurer" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MemberRow["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Membership category</Label>
                <Select value={form.membership_category} onValueChange={(v) => setForm({ ...form, membership_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="founding">Founding</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="honorary">Honorary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-joined">Date joined</Label>
                <Input id="m-joined" type="date" required value={form.date_joined} onChange={(e) => setForm({ ...form, date_joined: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-phone">Phone (private)</Label>
                <Input id="m-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-email">Email (private)</Label>
                <Input id="m-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-bio">Bio (optional)</Label>
              <Textarea id="m-bio" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="m-contact" checked={form.show_contact} onCheckedChange={(v) => setForm({ ...form, show_contact: v })} />
              <Label htmlFor="m-contact">Allow contact details to be shared internally</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
