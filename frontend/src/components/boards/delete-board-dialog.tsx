"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteBoard } from "@/hooks/use-boards";
import { getErrorMessage } from "@/lib/api";
import type { Board } from "@/types";

interface DeleteBoardDialogProps {
  board: Board | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBoardDialog({ board, onOpenChange }: DeleteBoardDialogProps) {
  const deleteBoard = useDeleteBoard();

  function handleDelete() {
    if (!board) return;
    deleteBoard.mutate(board.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success("Board deleted");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={Boolean(board)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete board</DialogTitle>
          <DialogDescription>
            This will permanently delete &quot;{board?.title}&quot; and all of its shapes. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteBoard.isPending}>
            {deleteBoard.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
