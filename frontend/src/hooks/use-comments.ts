import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { Comment } from "@/types/comment";

function commentsQueryKey(boardId: string) {
  return ["comments", boardId] as const;
}

export function useBoardComments(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = commentsQueryKey(boardId);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get<{ comments: Comment[] }>(`/boards/${boardId}/comments`);
      return res.data.comments;
    },
  });

  useEffect(() => {
    const socket = getSocket();

    function handleCreate(comment: Comment) {
      queryClient.setQueryData<Comment[]>(queryKey, (current) => {
        if (!current) return current;
        if (current.some((c) => c.id === comment.id)) return current;
        return [...current, comment];
      });
    }

    function handleDelete({ id }: { id: string }) {
      queryClient.setQueryData<Comment[]>(queryKey, (current) => current?.filter((c) => c.id !== id));
    }

    socket.on("comment:create", handleCreate);
    socket.on("comment:delete", handleDelete);
    return () => {
      socket.off("comment:create", handleCreate);
      socket.off("comment:delete", handleDelete);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  return query;
}

export function useCreateComment(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = commentsQueryKey(boardId);

  return useMutation({
    mutationFn: async ({ shapeId, text }: { shapeId: string; text: string }) => {
      const res = await api.post<{ comment: Comment }>(`/boards/${boardId}/comments`, { shapeId, text });
      return res.data.comment;
    },
    onSuccess: (comment) => {
      queryClient.setQueryData<Comment[]>(queryKey, (current) => {
        if (!current) return [comment];
        if (current.some((c) => c.id === comment.id)) return current;
        return [...current, comment];
      });
    },
  });
}

export function useDeleteComment(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = commentsQueryKey(boardId);

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comments/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Comment[]>(queryKey, (current) => current?.filter((c) => c.id !== id));
    },
  });
}
