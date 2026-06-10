import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { listUsers, setUserRole, removeUserRoles } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

function AdminUsers() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const changeRole = useServerFn(setUserRole);
  const removeAccess = useServerFn(removeUserRoles);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "super_admin" | "admin" | "editor" }) =>
      changeRole({ data: { userId, role } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Role updated.");
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      } else {
        toast.error(res.error ?? "Could not update role.");
      }
    },
    onError: () => toast.error("Could not update role. You need admin access."),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeAccess({ data: { userId } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Access removed.");
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      } else {
        toast.error(res.error ?? "Could not remove access.");
      }
    },
    onError: () => toast.error("Could not remove access."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">Grant or revoke admin panel access for registered accounts.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading users…
        </div>
      )}
      {(isError || data?.error) && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Couldn't load users. Only admins can manage user access.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {data && !data.error && data.users.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No registered users</p>
          <p className="mt-1 text-sm text-muted-foreground">Accounts created on the login page will appear here.</p>
        </div>
      )}
      {data && !data.error && data.users.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(u.created_at).toLocaleDateString("en-KE")}</TableCell>
                  <TableCell>
                    {u.roles.length > 0 ? (
                      u.roles.map((r) => <Badge key={r} className="mr-1">{roleLabels[r] ?? r}</Badge>)
                    ) : (
                      <Badge variant="outline">No access</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        value={u.roles[0] ?? ""}
                        onValueChange={(v) => roleMutation.mutate({ userId: u.id, role: v as "super_admin" | "admin" | "editor" })}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      {u.roles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          aria-label="Remove access"
                          onClick={() => {
                            if (window.confirm(`Remove all admin access for ${u.email}?`)) removeMutation.mutate(u.id);
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
