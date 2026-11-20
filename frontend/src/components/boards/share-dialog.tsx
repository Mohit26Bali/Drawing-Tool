"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBoardMembers, useInviteMember, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-members";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/lib/api";
import type { BoardRole } from "@/types";

interface ShareDialogProps {
  boardId: string;
  role: BoardRole;
}

const ROLE_LABEL: Record<string, string> = { OWNER: "Owner", EDITOR: "Can edit", VIEWER: "Can view" };

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ShareDialog({ boardId, role }: ShareDialogProps) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EDITOR" | "VIEWER">("EDITOR");

  const isOwner = role === "OWNER";
  const { data, isLoading } = useBoardMembers(boardId, open);
  const invite = useInviteMember(boardId);
  const updateRole = useUpdateMemberRole(boardId);
  const remove = useRemoveMember(boardId);

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    invite.mutate(
      { email: email.trim(), role: inviteRole },
      {
        onSuccess: (member) => {
          toast.success(`${member.user.name} now has access`);
          setEmail("");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  }

  function handleRemove(userId: string, name: string) {
    remove.mutate(userId, {
      onSuccess: () => toast.success(`${name} was removed`),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleLeave() {
    if (!currentUserId) return;
    remove.mutate(currentUserId, {
      onSuccess: () => {
        toast.success("You left the board");
        router.replace("/dashboard");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4" />
            Share
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isOwner ? "Share this board" : "People with access"}</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "Invite someone who already has an account. Editors can draw and comment, viewers can only look."
              : "These people can open this board."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form onSubmit={handleInvite} className="flex flex-col gap-3">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                autoComplete="off"
                required
              />
              <select
                aria-label="Permission"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "EDITOR" | "VIEWER")}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="EDITOR">Can edit</option>
                <option value="VIEWER">Can view</option>
              </select>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </form>
        )}

        <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto" aria-label="People with access">
          {isLoading && <li className="text-sm text-muted-foreground">Loading...</li>}

          {data?.owner && (
            <li className="flex items-center gap-3 rounded-lg px-1 py-2">
              <Avatar>
                <AvatarFallback>{initials(data.owner.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {data.owner.name}
                  {data.owner.id === currentUserId && " (you)"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{data.owner.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{ROLE_LABEL.OWNER}</span>
            </li>
          )}

          {data?.members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 rounded-lg px-1 py-2">
              <Avatar>
                <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.user.name}
                  {m.userId === currentUserId && " (you)"}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              {isOwner ? (
                <>
                  <select
                    aria-label={`Permission for ${m.user.name}`}
                    value={m.role}
                    disabled={updateRole.isPending}
                    onChange={(e) =>
                      updateRole.mutate(
                        { userId: m.userId, role: e.target.value as "EDITOR" | "VIEWER" },
                        { onError: (error) => toast.error(getErrorMessage(error)) }
                      )
                    }
                    className="h-7 rounded-md border border-input bg-background px-1.5 text-xs"
                  >
                    <option value="EDITOR">Can edit</option>
                    <option value="VIEWER">Can view</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${m.user.name}`}
                    disabled={remove.isPending}
                    onClick={() => handleRemove(m.userId, m.user.name)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{ROLE_LABEL[m.role]}</span>
              )}
            </li>
          ))}

          {data && data.members.length === 0 && isOwner && (
            <li className="px-1 py-3 text-sm text-muted-foreground">
              Only you can open this board so far. Invite someone above.
            </li>
          )}
        </ul>

        {!isOwner && (
          <Button variant="outline" onClick={handleLeave} disabled={remove.isPending} className="mt-2 self-start">
            <LogOut className="h-4 w-4" />
            Leave this board
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
