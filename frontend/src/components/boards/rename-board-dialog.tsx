"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRenameBoard } from "@/hooks/use-boards";
import { getErrorMessage } from "@/lib/api";
import type { Board } from "@/types";

interface RenameBoardDialogProps {
  board: Board | null;
  onOpenChange: (open: boolean) => void;
}

export function RenameBoardDialog({ board, onOpenChange }: RenameBoardDialogProps) {
  return (
    <Dialog open={Boolean(board)} onOpenChange={onOpenChange}>
      <DialogContent>
        {board && (
          <RenameBoardForm key={board.id} board={board} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RenameBoardForm({ board, onDone }: { board: Board; onDone: () => void }) {
  const [title, setTitle] = useState(board.title);
  const renameBoard = useRenameBoard();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    renameBoard.mutate(
      { id: board.id, title },
      {
        onSuccess: () => {
          onDone();
          toast.success("Board renamed");
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Rename board</DialogTitle>
        <DialogDescription>Choose a new name for this board.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2 py-4">
        <Label htmlFor="rename-board-title">Title</Label>
        <Input
          id="rename-board-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={renameBoard.isPending}>
          {renameBoard.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
