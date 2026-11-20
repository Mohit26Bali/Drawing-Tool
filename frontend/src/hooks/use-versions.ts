import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCanvasStore } from "@/store/canvas-store";
import type { BoardVersion } from "@/types/version";
import type { CanvasShape } from "@/types/canvas";

function versionsQueryKey(boardId: string) {
  return ["versions", boardId] as const;
}

export function useBoardVersions(boardId: string) {
  return useQuery({
    queryKey: versionsQueryKey(boardId),
    queryFn: async () => {
      const res = await api.get<{ versions: BoardVersion[] }>(`/boards/${boardId}/versions`);
      return res.data.versions;
    },
  });
}

export function useCreateVersion(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (label?: string) => {
      const res = await api.post<{ version: BoardVersion }>(`/boards/${boardId}/versions`, { label });
      return res.data.version;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: versionsQueryKey(boardId) });
    },
  });
}

export function useRestoreVersion(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (versionId: string) => {
      const res = await api.post<{ shapes: CanvasShape[] }>(
        `/boards/${boardId}/versions/${versionId}/restore`
      );
      return res.data.shapes;
    },
    onSuccess: (shapes) => {
      useCanvasStore.getState().applyRemoteSet(shapes);
      queryClient.invalidateQueries({ queryKey: versionsQueryKey(boardId) });
    },
  });
}
