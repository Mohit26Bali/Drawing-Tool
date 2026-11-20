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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateBoard } from "@/hooks/use-boards";
import { getErrorMessage } from "@/lib/api";

interface CreateBoardDialogProps {
  trigger?: React.ReactElement;
}

export function CreateBoardDialog({ trigger }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createBoard = useCreateBoard();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createBoard.mutate(title, {
      onSuccess: () => {
        setOpen(false);
        setTitle("");
        toast.success("Board created");
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button>New board</Button>} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new board</DialogTitle>
            <DialogDescription>Give your board a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="board-title">Title</Label>
            <Input
              id="board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled board"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createBoard.isPending}>
              {createBoard.isPending ? "Creating..." : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
