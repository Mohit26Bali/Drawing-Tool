"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCanvasStore } from "@/store/canvas-store";
import { useAuthStore } from "@/store/auth-store";
import { useBoardComments, useCreateComment, useDeleteComment } from "@/hooks/use-comments";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentsPanelProps {
  boardId: string;
}

export function CommentsPanel({ boardId }: CommentsPanelProps) {
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const shapeId = selectedIds.length === 1 ? selectedIds[0] : null;

  const currentUserId = useAuthStore((s) => s.user?.id);
  const role = useCanvasStore((s) => s.role);
  const viewOnly = role === "VIEWER";
  const { data: comments } = useBoardComments(boardId);
  const createComment = useCreateComment(boardId);
  const deleteComment = useDeleteComment(boardId);
  const [text, setText] = useState("");

  const shapeComments = (comments ?? []).filter((c) => c.shapeId === shapeId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !shapeId) return;
    createComment.mutate(
      { shapeId, text: text.trim() },
      {
        onSuccess: () => setText(""),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  }

  return (
    <AnimatePresence>
      {shapeId && (
        <motion.div
          key="comments-panel"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute right-4 top-1/2 z-10 flex max-h-[70vh] w-64 -translate-y-1/2 flex-col rounded-xl border bg-card shadow-lg"
        >
          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Comments</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {shapeComments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet on this shape.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {shapeComments.map((comment) => (
                  <li key={comment.id} className="group text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{comment.user.name}</p>
                      {(comment.userId === currentUserId || role === "OWNER") && (
                        <button
                          aria-label="Delete comment"
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => deleteComment.mutate(comment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}
                    </div>
                    <p className="text-muted-foreground">{comment.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {viewOnly ? (
            <p className="border-t p-3 text-xs text-muted-foreground">View-only access: you can read comments but not add them.</p>
          ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t p-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-16 resize-none text-sm"
            />
            <Button type="submit" size="sm" disabled={!text.trim() || createComment.isPending}>
              {createComment.isPending ? "Posting..." : "Post comment"}
            </Button>
          </form>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
