export type User = {
  user: User | PromiseLike<User | null> | null;
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  image: string | null;
  role: string;
};