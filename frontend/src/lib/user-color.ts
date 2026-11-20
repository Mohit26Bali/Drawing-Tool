// Chalk colours: light enough to read on the board, and different enough to tell people apart.
const PALETTE = ["#f28fad", "#f4a261", "#f4d35e", "#9bd7a0", "#7fd8d0", "#8ecae6", "#b8a9f0", "#e9a8d8"];

export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
