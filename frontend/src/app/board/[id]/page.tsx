"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBoard } from "@/hooks/use-boards";
import { VersionHistoryDialog } from "@/components/boards/version-history-dialog";
import { ShareDialog } from "@/components/boards/share-dialog";
import { useCanvasStore } from "@/store/canvas-store";

const BoardCanvas = dynamic(
  () => import("@/components/canvas/board-canvas").then((m) => m.BoardCanvas),
  { ssr: false }
);

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const { data: board, isLoading, isError } = useBoard(params.id);
  // The live role (the owner can change it while this page is open); falls back to what the server first said.
  const liveRole = useCanvasStore((s) => s.role);
  const role = liveRole ?? board?.role ?? "VIEWER";

  return (
    <AuthGuard>
      <div className="flex h-screen flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to your boards"
            nativeButton={false}
            render={
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            }
          />
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <h1 className="truncate text-sm font-semibold">{board?.title ?? "Board not found"}</h1>
          )}
          {board && role === "VIEWER" && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              View only
            </span>
          )}
          {board && (
            <div className="ml-auto flex items-center gap-2">
              <ShareDialog boardId={board.id} role={role} />
              <VersionHistoryDialog boardId={board.id} canEdit={role !== "VIEWER"} />
            </div>
          )}
        </header>
        <main className="relative flex-1">
          {isLoading && (
            <div className="flex h-full items-center justify-center">
              <Skeleton className="h-96 w-full max-w-4xl" />
            </div>
          )}
          {isError && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-destructive">Failed to load this board.</p>
            </div>
          )}
          {!isLoading && !isError && board && <BoardCanvas boardId={board.id} title={board.title} />}
        </main>
      </div>
    </AuthGuard>
  );
}
