import axios from "axios";
import { User } from "./types";

export const getCurrentUser = async (): Promise<User | null> => {
  const res = await axios.get<{ message: string; user: User | null }>(
    "/backend/api/user/@me",
    {
      withCredentials: true,
    }
  );
  return res.data.user;
};

export const updateCurrentUser = async (userData: Partial<User>): Promise<User | null> => {
  const res = await axios.put<{ message: string; user: User | null }>(
    "/backend/api/user/@me",
    userData,
    {
      withCredentials: true,
    }
  );
  return res.data.user;
};