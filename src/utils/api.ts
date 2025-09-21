import axios from "axios";
import { User } from "./types";

export const getCurrentUser = async (): Promise<User | null> => {
  const res = await axios.get<{ message: string; user: User | null }>(
    "/backend/api/protected",
    {
      withCredentials: true,
    }
  );
  return res.data.user;
};
