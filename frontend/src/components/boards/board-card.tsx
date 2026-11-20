"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, MoreHorizontal, PencilLine, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLeaveBoard } from "@/hooks/use-boards";
import { useAuthStore } from "@/store/auth-store";
import { getErrorMessage } from "@/lib/api";
import type { Board } from "@/types";

interface BoardCardProps {
  board: Board;
  index?: number;
  onRename: (board: Board) => void;
  onDelete: (board: Board) => void;
}

const ROLE_BADGE: Record<string, string> = { EDITOR: "Can edit", VIEWER: "View only" };

export function BoardCard({ board, index = 0, onRename, onDelete }: BoardCardProps) {
  const userId = useAuthStore((s) => s.user?.id);
  const leave = useLeaveBoard();
  const isOwner = !board.role || board.role === "OWNER";

  function handleLeave() {
    if (!userId) return;
    leave.mutate(
      { boardId: board.id, userId },
      {
        onSuccess: () => toast.success(`You left "${board.title}"`),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
    >
      <Card className="group relative transition-shadow hover:shadow-md">
        <Link href={`/board/${board.id}`} className="absolute inset-0 z-10" aria-label={board.title} />

        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle className="line-clamp-1 text-base">{board.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Options for ${board.title}`}
                  className="relative z-20 h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              {isOwner ? (
                <>
                  <DropdownMenuItem onClick={() => onRename(board)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(board)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem variant="destructive" onClick={handleLeave}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave board
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="h-24 rounded-md border border-dashed" />
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {isOwner ? "" : `${board.owner?.name ?? "Someone"}'s board · `}
            Updated {new Date(board.updatedAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {!isOwner && board.role && (
              <span className="rounded-full border px-2 py-0.5">{ROLE_BADGE[board.role]}</span>
            )}
            {isOwner && (board.memberCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1" title="People you share this board with">
                <Users className="h-3.5 w-3.5" />
                {board.memberCount}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
