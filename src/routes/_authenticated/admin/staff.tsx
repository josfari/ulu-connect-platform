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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/staff")({
  component: AdminStaff,
});

type StaffRow = {
  id: string;
  name: string;
  role: string;
  photo_url: string | null;
  bio: string | null;
  role_description: string | null;
  email: string | null;
  phone: string | null;
  show_contact: boolean;
  sort_order: number;
};

const emptyForm = {
  name: "",
  role: "",
  bio: "",
  role_description: "",
  email: "",
  phone: "",
  photo_url: "",
  show_contact: false,
  sort_order: 0,
};

function AdminStaff() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").order("sort_order");
      if (error) throw error;
      return data as StaffRow[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sort_order: (data?.length ?? 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (s: StaffRow) => {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role,
      bio: s.bio ?? "",
      role_description: s.role_description ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      photo_url: s.photo_url ?? "",
      show_contact: s.show_contact,
      sort_order: s.sort_order,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        role: form.role.trim(),
        bio: form.bio.trim() || null,
        role_description: form.role_description.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        photo_url: form.photo_url.trim() || null,
        show_contact: form.show_contact,
        sort_order: Number(form.sort_order) || 0,
      };
      const res = editing
        ? await supabase.from("staff").update(payload).eq("id", editing.id)
        : await supabase.from("staff").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Profile updated." : "Profile added.");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["public-staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the profile."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      queryClient.invalidateQueries({ queryKey: ["public-staff"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not delete the profile."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Staff & Leadership</h1>
          <p className="text-sm text-muted-foreground">Manage leadership profiles shown on the public website.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New Profile
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profiles…
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Couldn't load profiles.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-semibold">No leadership profiles yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add chairperson, secretary, treasurer, and other officials.</p>
          <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add New Profile</Button>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.sort_order}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.role}</TableCell>
                  <TableCell className="hidden md:table-cell">{s.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label="Delete"
                      onClick={() => {
                        if (window.confirm(`Delete profile "${s.name}"?`)) deleteMutation.mutate(s.id);
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
            <DialogTitle>{editing ? "Edit Profile" : "Add New Profile"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-name">Name</Label>
                <Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-role">Role / Title</Label>
                <Input id="s-role" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Chairperson" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">Email (optional)</Label>
                <Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-phone">Phone (optional)</Label>
                <Input id="s-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-photo">Photo URL (optional)</Label>
                <Input id="s-photo" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-order">Display order</Label>
                <Input id="s-order" type="number" min={0} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-bio">Bio (optional)</Label>
              <Textarea id="s-bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="s-contact" checked={form.show_contact} onCheckedChange={(v) => setForm({ ...form, show_contact: v })} />
              <Label htmlFor="s-contact">Show contact details publicly</Label>
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
