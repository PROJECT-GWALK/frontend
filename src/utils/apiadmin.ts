import axios from "axios";

// ====================== USER MANAGEMENT ======================

export const getAllUsers = async (params?: { role?: "ADMIN" | "USER"; page?: number; limit?: number; search?: string }) => {
  const res = await axios.get("/backend/api/usermanagement", {
    params,
    withCredentials: true,
  });
  return res.data;
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

export type AdminEventStatus = "DRAFT" | "PUBLISHED";

export const getAdminEvents = async (params?: {
  q?: string;
  status?: AdminEventStatus;
  page?: number;
  limit?: number;
}) => {
  const res = await axios.get("/backend/api/admindashboard/events/list", {
    params,
    withCredentials: true,
  });
  return res.data;
};

export const getAdminEvent = async (eventId: string) => {
  const res = await axios.get(`/backend/api/admindashboard/events/${eventId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateAdminEvent = async (
  eventId: string,
  data: {
    eventName?: string;
    status?: AdminEventStatus;
    publicView?: boolean;
    publicJoin?: boolean;
    isHidden?: boolean;
  },
) => {
  const res = await axios.put(`/backend/api/admindashboard/events/${eventId}`, data, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteAdminEvent = async (eventId: string) => {
  const res = await axios.delete(`/backend/api/admindashboard/events/${eventId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const updateAdminParticipant = async (
  eventId: string,
  pid: string,
  data: {
    eventGroup?: "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST";
    isLeader?: boolean;
    virtualReward?: number;
    teamId?: string | null;
  },
) => {
  const res = await axios.put(
    `/backend/api/admindashboard/events/${eventId}/participants/${pid}`,
    data,
    { withCredentials: true },
  );
  return res.data;
};

export const deleteAdminParticipant = async (eventId: string, pid: string) => {
  const res = await axios.delete(
    `/backend/api/admindashboard/events/${eventId}/participants/${pid}`,
    { withCredentials: true },
  );
  return res.data;
};

export const updateAdminTeam = async (
  eventId: string,
  teamId: string,
  data: {
    teamName?: string;
    description?: string;
    videoLink?: string;
    imageCover?: string | null;
  },
) => {
  const res = await axios.put(
    `/backend/api/admindashboard/events/${eventId}/teams/${teamId}`,
    data,
    { withCredentials: true },
  );
  return res.data;
};

export const deleteAdminTeam = async (eventId: string, teamId: string) => {
  const res = await axios.delete(
    `/backend/api/admindashboard/events/${eventId}/teams/${teamId}`,
    { withCredentials: true },
  );
  return res.data;
};

// ====================== SYSTEM LOGS ======================
export interface SystemLog {
  id: string;
  action: string;
  details: string | null;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    email: string | null;
    image: string | null;
  } | null;
}

export interface GetSystemLogsResponse {
  data: SystemLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getSystemLogs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const res = await axios.get("/backend/api/systemlogs", {
    params,
    withCredentials: true,
  });
  return res.data as GetSystemLogsResponse;
};
