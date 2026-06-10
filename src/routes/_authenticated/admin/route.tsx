import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      return data.map((r) => r.role);
    },
  });

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (rolesQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (rolesQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
          <p className="font-semibold text-destructive">Couldn't verify your access.</p>
          <p className="mt-2 text-sm text-muted-foreground">Please refresh the page or sign in again.</p>
          <Button className="mt-4" onClick={() => rolesQuery.refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (!rolesQuery.data || rolesQuery.data.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="max-w-md rounded-2xl bg-card p-8 text-center shadow-card">
          <ShieldAlert className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 text-xl font-bold">Access pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({user.email}) doesn't have an admin role yet. Ask a group administrator to grant you
            access from User Management.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">Back to website</Link>
            </Button>
            <Button onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const topRole = rolesQuery.data.includes("super_admin")
    ? "Super Admin"
    : rolesQuery.data.includes("admin")
      ? "Admin"
      : "Editor";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4">
            <SidebarTrigger />
            <p className="hidden text-sm font-semibold sm:block">The Ulu We Want SHG — Admin</p>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary md:block">{topRole}</span>
              <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:block">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
