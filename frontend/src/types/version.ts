export interface BoardVersion {
  id: string;
  label: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}
