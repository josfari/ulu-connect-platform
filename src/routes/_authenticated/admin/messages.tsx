import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not update the message."),
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-recent-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: () => toast.error("Could not delete the message."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <p className="text-sm text-muted-foreground">Enquiries submitted through the website contact form.</p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading messages…
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive">Couldn't load messages. You need admin access.</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
        </div>
      )}
      {data && data.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <MailOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Messages from the website contact form will appear here.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((m) => (
            <div key={m.id} className={`rounded-xl border bg-card p-4 ${m.read ? "border-border" : "border-primary/40 bg-primary/5"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {m.name} {!m.read && <Badge className="ml-1">New</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {new Date(m.created_at).toLocaleString("en-KE")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => markRead.mutate({ id: m.id, read: !m.read })}>
                    {m.read ? "Mark unread" : "Mark read"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    aria-label="Delete"
                    onClick={() => {
                      if (window.confirm("Delete this message?")) deleteMessage.mutate(m.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {m.subject && <p className="mt-2 text-sm font-medium">{m.subject}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
