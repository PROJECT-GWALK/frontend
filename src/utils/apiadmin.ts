import axios from "axios";

// ====================== USER MANAGEMENT ======================

export const getAllUsers = async () => {
  const res = await axios.get("/backend/api/usermanagement", {
    withCredentials: true,
  });
  return res.data; // { message, users }
};

export const updateUserRole = async (id: string, role: "USER" | "ADMIN") => {
  const res = await axios.put(
    `/backend/api/usermanagement/${id}/role`,
    { role },
    { withCredentials: true }
  );
  return res.data; // { message, user }
};

export const deleteUser = async (id: string) => {
  const res = await axios.delete(`/backend/api/usermanagement/${id}`, {
    withCredentials: true,
  });
  return res.data; // { message }
};

export const banUser = async (
  id: string,
  reason?: string,
  expiresAt?: string
) => {
  const res = await axios.post(
    `/backend/api/usermanagement/${id}/ban`,
    { reason, expiresAt },
    { withCredentials: true }
  );
  return res.data; // { message, email }
};

export const unbanUser = async (id: string) => {
  const res = await axios.post(
    `/backend/api/usermanagement/${id}/unban`,
    {},
    { withCredentials: true }
  );
  return res.data;
};

// ====================== STATS ======================
export const getCountUser = async () => {
  const res = await axios.get("/backend/api/admindashboard/users", {
    withCredentials: true,
  });
  return res.data; // { message, totalUsers }
};

export const getCountEvent = async () => {
  const res = await axios.get("/backend/api/admindashboard/events", {
    withCredentials: true,
  });
  return res.data; // { message, totalEvents }
};

export const userDailyActive = async (year?: number, month?: number) => {
  let url = "/backend/api/admindashboard/userdailyactive";
  if (year) {
    url += `/${year}`;
    if (month) url += `/${month}`;
  }

  const res = await axios.get(url, { withCredentials: true });
  return res.data; // { message, data: { year, month, chart, ... } }
};
