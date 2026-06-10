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

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: AdminMedia,
});

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  featured: boolean;
  published_at: string | null;
};

const emptyForm = {
  title: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  status: "draft" as PostRow["status"],
  featured: false,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

function AdminMedia() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PostRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, content, cover_image_url, status, featured, published_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PostRow[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: PostRow) => {
    setEditing(p);
    setForm({
      title: p.title,
      excerpt: p.excerpt ?? "",
      content: p.content,
      cover_image_url: p.cover_image_url ?? "",
      status: p.status,
      featured: p.featured,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        title: form.title.trim(),
        slug: editing?.slug ?? slugify(form.title),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        cover_image_url: form.cover_image_url.trim() || null,
        status: form.status,
        featured: form.featured,
        author_id: userData.user?.id ?? null,
        published_at:
          form.status === "published"
            ? (editing?.published_at ?? new Date().toISOString())
            : null,
      };
      const res = editing
        ? await supabase.from("posts").update(payload).eq("id", editing.id)
        : await supabase.from("posts").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success(editing ? "Post updated." : "Post created.");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save the post."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["public-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not delete the post."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Media Desk</h1>
          <p className="text-sm text-muted-foreground">Write, publish, and manage news posts.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add New Post
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading posts…
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Couldn't load posts.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-semibold">No posts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Share your first community story or announcement.</p>
          <Button className="mt-4" onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add New Post</Button>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.title} {p.featured && <Badge variant="secondary" className="ml-1">Featured</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "published" ? "default" : "outline"} className="capitalize">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-KE") : "—"}
                  </TableCell>
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
                        if (window.confirm(`Delete post "${p.title}"?`)) deleteMutation.mutate(p.id);
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
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "Add New Post"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input id="post-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Excerpt (short summary)</Label>
              <Textarea id="post-excerpt" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-content">Content</Label>
              <Textarea id="post-content" required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="post-cover">Cover image URL (optional)</Label>
                <Input id="post-cover" value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PostRow["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="post-featured" checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label htmlFor="post-featured">Featured post</Label>
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
