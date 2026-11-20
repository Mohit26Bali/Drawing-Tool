"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import { useBoards } from "@/hooks/use-boards";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { RenameBoardDialog } from "@/components/boards/rename-board-dialog";
import { DeleteBoardDialog } from "@/components/boards/delete-board-dialog";
import { BoardCard } from "@/components/boards/board-card";
import { ImportBoardDropzone } from "@/components/boards/import-board-dropzone";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Board } from "@/types";

export default function DashboardPage() {
  const { data: boards, isLoading, isError } = useBoards();
  const [boardToRename, setBoardToRename] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  return (
    <ImportBoardDropzone>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your boards</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage your collaborative whiteboards.
            </p>
          </div>
          <CreateBoardDialog />
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Failed to load boards. Please refresh the page.
          </p>
        )}

        {!isLoading && !isError && boards?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <LayoutTemplate className="h-6 w-6 text-primary" />
            </span>
            <p className="mt-5 text-base font-medium">Create your first board</p>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              A board is an infinite canvas for sketching, planning, and collaborating with your
              team in real time.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <CreateBoardDialog trigger={<Button size="lg">Create your first board</Button>} />
              <p className="text-xs text-muted-foreground">
                or drag an exported <code className="rounded bg-muted px-1 py-0.5">.json</code> board file here
              </p>
            </div>
          </motion.div>
        )}

        {!isLoading && !isError && boards && boards.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board, i) => (
              <BoardCard
                key={board.id}
                board={board}
                index={i}
                onRename={setBoardToRename}
                onDelete={setBoardToDelete}
              />
            ))}
          </div>
        )}

        <RenameBoardDialog
          board={boardToRename}
          onOpenChange={(open) => !open && setBoardToRename(null)}
        />
        <DeleteBoardDialog
          board={boardToDelete}
          onOpenChange={(open) => !open && setBoardToDelete(null)}
        />
      </div>
    </ImportBoardDropzone>
  );
}
