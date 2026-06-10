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

export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: AdminProjects,
});

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  status: "planned" | "ongoing" | "completed";
  budget: number | null;
  progress: number;
  impact_summary: string | null;
  category: string;
  date_started: string | null;
  featured: boolean;
};

const emptyForm = {
  title: "",
  description: "",
  category: "",
  status: "planned" as ProjectRow["status"],
  progress: 0,
  budget: "",
  impact_summary: "",
  image_url: "",
  date_started: "",
  featured: false,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

function AdminProjects() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectRow[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: ProjectRow) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description,
      category: p.category,
      status: p.status,
      progress: p.progress,
      budget: p.budget != null ? String(p.budget) : "",
      impact_summary: p.impact_summary ?? "",
      image_url: p.image_url ?? "",
      date_started: p.date_started ?? "",
      featured: p.featured,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: editing?.slug ?? slugify(form.title),
        description: form.description.trim(),
        category: form.category.trim() || "General",
        status: form.status,
        progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
        budget: form.budget ? Number(form.budget) : null,
        impact_summary: form.impact_summary.trim() || null,
        image_url: form.image_url.trim() || null,
        date_started: form.date_started || null,
        featured: form.featured,
      };
      const res = editing
        ? await supabase.from("projects").update(payload).eq("id", editing.id)
        : await supabase.from("projects").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Project updated." : "Project created.");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["public-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the project."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      queryClient.invalidateQueries({ queryKey: ["public-projects"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not delete the project."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">Create and manage community projects.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New Project
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading projects…
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Couldn't load projects.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-semibold">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add your first community project to show it on the website.</p>
          <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add New Project</Button>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Progress</TableHead>
                <TableHead className="hidden lg:table-cell">Budget (KSh)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title} {p.featured && <Badge variant="secondary" className="ml-1">Featured</Badge>}</TableCell>
                  <TableCell className="hidden md:table-cell">{p.category}</TableCell>
                  <TableCell><Badge variant={p.status === "completed" ? "default" : "outline"} className="capitalize">{p.status}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell">{p.progress}%</TableCell>
                  <TableCell className="hidden lg:table-cell">{p.budget != null ? Number(p.budget).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      aria-label="Delete"
                      onClick={() => {
                        if (window.confirm(`Delete project "${p.title}"? This cannot be undone.`)) deleteMutation.mutate(p.id);
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
            <DialogTitle>{editing ? "Edit Project" : "Add New Project"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="p-title">Title</Label>
              <Input id="p-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea id="p-desc" required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-cat">Category</Label>
                <Input id="p-cat" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Technology Access" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectRow["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-progress">Progress (%)</Label>
                <Input id="p-progress" type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-budget">Budget (KSh)</Label>
                <Input id="p-budget" type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-date">Date started</Label>
                <Input id="p-date" type="date" value={form.date_started} onChange={(e) => setForm({ ...form, date_started: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-img">Image URL (optional)</Label>
                <Input id="p-img" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-impact">Impact summary (optional)</Label>
              <Textarea id="p-impact" rows={2} value={form.impact_summary} onChange={(e) => setForm({ ...form, impact_summary: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="p-featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label htmlFor="p-featured">Featured on homepage</Label>
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
