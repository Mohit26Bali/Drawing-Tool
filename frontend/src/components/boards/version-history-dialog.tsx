"use client";

import { useState } from "react";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useBoardVersions, useCreateVersion, useRestoreVersion } from "@/hooks/use-versions";
import { getErrorMessage } from "@/lib/api";

interface VersionHistoryDialogProps {
  boardId: string;
  /** Viewers can see the list but cannot save or restore. */
  canEdit?: boolean;
}

export function VersionHistoryDialog({ boardId, canEdit = true }: VersionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: versions, isLoading } = useBoardVersions(boardId);
  const createVersion = useCreateVersion(boardId);
  const restoreVersion = useRestoreVersion(boardId);

  function handleSave() {
    createVersion.mutate(undefined, {
      onSuccess: () => toast.success("Version saved"),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  function handleRestore(versionId: string) {
    restoreVersion.mutate(versionId, {
      onSuccess: () => {
        toast.success("Version restored");
        setOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <History className="h-4 w-4" />
            History
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>
            Save the current state as a version, or restore a previous one. Restoring auto-saves
            the current state first, so nothing is ever lost.
          </DialogDescription>
        </DialogHeader>

        {canEdit ? (
          <Button onClick={handleSave} disabled={createVersion.isPending} className="w-full">
            {createVersion.isPending ? "Saving..." : "Save current version"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">You have view-only access, so you can look at the history but not change it.</p>
        )}

        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {isLoading && <p className="text-sm text-muted-foreground">Loading versions...</p>}
          {!isLoading && versions?.length === 0 && (
            <p className="text-sm text-muted-foreground">No saved versions yet.</p>
          )}
          {versions?.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between gap-2 rounded-lg border p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{version.label ?? "Untitled version"}</p>
                <p className="text-xs text-muted-foreground">
                  {version.user.name} &middot; {new Date(version.createdAt).toLocaleString()}
                </p>
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={restoreVersion.isPending}
                  onClick={() => handleRestore(version.id)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
