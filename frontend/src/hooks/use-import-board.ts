import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Board } from "@/types";
import type { CanvasShape } from "@/types/canvas";

interface ImportBoardInput {
  title: string;
  shapes: CanvasShape[];
}

export function useImportBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ImportBoardInput) => {
      const res = await api.post<{ board: Board }>("/boards/import", input);
      return res.data.board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
