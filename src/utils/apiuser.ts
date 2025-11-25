import axios from "axios";

//////////////////////////////////////////////////////////
// USER API
//////////////////////////////////////////////////////////
export const getCurrentUser = async () => {
  const res = await axios.get("/backend/api/user/@me", {
    withCredentials: true,
  });
  return res.data;
};

export const updateCurrentUser = async (formData: FormData) => {
  const res = await axios.put("/backend/api/user/@me", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};