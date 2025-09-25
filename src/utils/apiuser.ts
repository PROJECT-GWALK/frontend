import axios from "axios";
import { User } from "./types";

export const getCurrentUser = async () => {
  const res = await axios.get(
    "/backend/api/user/@me",
    {
      withCredentials: true,
    }
  );
  return res.data;
};

export const updateCurrentUser = async (userData: Partial<User>) => {
  const res = await axios.put(
    "/backend/api/user/@me",
    userData,
    {
      withCredentials: true,
    }
  );
  return res.data;
};