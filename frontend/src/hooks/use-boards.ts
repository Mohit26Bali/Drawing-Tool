import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Board, BoardWithShapes } from "@/types";

export function useBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const res = await api.get<{ boards: Board[] }>("/boards");
      return res.data.boards;
    },
  });
}

export function useBoard(id: string) {
  return useQuery({
    queryKey: ["boards", id],
    queryFn: async () => {
      const res = await api.get<{ board: BoardWithShapes }>(`/boards/${id}`);
      return res.data.board;
    },
    enabled: Boolean(id),
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post<{ board: Board }>("/boards", { title });
      return res.data.board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useRenameBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await api.patch<{ board: Board }>(`/boards/${id}`, { title });
      return res.data.board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

/** A member leaves a board someone else owns. */
export function useLeaveBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, userId }: { boardId: string; userId: string }) => {
      await api.delete(`/boards/${boardId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/boards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
