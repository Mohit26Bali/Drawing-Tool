import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BoardMember, BoardMembers } from "@/types";

type InviteRole = "EDITOR" | "VIEWER";

function membersKey(boardId: string) {
  return ["members", boardId] as const;
}

export function useBoardMembers(boardId: string, enabled = true) {
  return useQuery({
    queryKey: membersKey(boardId),
    queryFn: async () => {
      const res = await api.get<BoardMembers>(`/boards/${boardId}/members`);
      return res.data;
    },
    enabled,
  });
}

export function useInviteMember(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: InviteRole }) => {
      const res = await api.post<{ member: BoardMember }>(`/boards/${boardId}/members`, input);
      return res.data.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(boardId) });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useUpdateMemberRole(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: InviteRole }) => {
      const res = await api.patch<{ member: BoardMember }>(`/boards/${boardId}/members/${userId}`, { role });
      return res.data.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(boardId) });
    },
  });
}

/** The owner removes someone, or a member removes themselves (leaves the board). */
export function useRemoveMember(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/boards/${boardId}/members/${userId}`);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey(boardId) });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
