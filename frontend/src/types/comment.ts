export interface Comment {
  id: string;
  shapeId: string;
  userId: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}
