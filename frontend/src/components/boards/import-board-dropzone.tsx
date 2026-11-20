"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { useImportBoard } from "@/hooks/use-import-board";
import { getErrorMessage } from "@/lib/api";

interface ImportBoardDropzoneProps {
  children: React.ReactNode;
}

export function ImportBoardDropzone({ children }: ImportBoardDropzoneProps) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const router = useRouter();
  const importBoard = useImportBoard();

  function hasFiles(e: React.DragEvent) {
    return Array.from(e.dataTransfer.types).includes("Files");
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Only .json board exports can be imported");
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.shapes)) {
        throw new Error("This file doesn't look like a CanvasFlow export");
      }

      const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title : "Imported board";

      importBoard.mutate(
        { title, shapes: parsed.shapes },
        {
          onSuccess: (board) => {
            toast.success("Board imported");
            router.push(`/board/${board.id}`);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        }
      );
    } catch {
      toast.error("Couldn't read that file. Make sure it's a valid CanvasFlow export.");
    }
  }

  return (
    <div
      className="relative"
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingFile(false);
      }}
      onDrop={handleDrop}
    >
      {children}

      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary px-16 py-14 text-center"
            >
              <UploadCloud className="h-10 w-10 text-primary" />
              <p className="text-lg font-medium">Drop to import board</p>
              <p className="text-sm text-muted-foreground">Accepts .json files exported from CanvasFlow</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
