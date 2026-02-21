import axios from "axios";

const normalizeEventName = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ");

// ====================== CREATE EVENT ======================
export const createEvent = async (eventName: string) => {
  const normalizedName = normalizeEventName(eventName);
  const res = await axios.post(
    "/backend/api/events",
    { eventName: normalizedName },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// ====================== UPDATE EVENT ======================
export const updateEvent = async (
  id: string,
  data: FormData | Record<string, unknown>,
  opts?: { removeImage?: boolean }
) => {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  let body: FormData | string;
  let headers: Record<string, string> | undefined = undefined;
  if (isFormData) {
    const fd = data as FormData;
    if (opts?.removeImage) fd.append("imageCover", "null");
    body = fd;
  } else {
    const payload = opts?.removeImage ? { ...data, imageCover: null } : data;
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify(payload);
  }

  const res = await fetch(`/backend/api/events/${id}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body,
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let message = `Failed to update event (${res.status})`;
    try {
      if (contentType.includes("application/json")) {
        const errorData = await res.json();
        message = errorData?.message || message;
      } else {
        const text = await res.text();
        message = text || message;
      }
    } catch {}
    throw new Error(message);
  }

  if (contentType.includes("application/json")) {
    return res.json();
  } else {
    return { message: await res.text() };
  }
};

// ====================== GET EVENT ======================
export const getEvent = async (id: string) => {
  const res = await axios.get(`/backend/api/events/${id}`, {
    withCredentials: true,
  });
  return res.data; // { message, event }
};

// ====================== GET MY DRAFT EVENTS ======================
export const getMyDraftEvents = async () => {
  const res = await axios.get("/backend/api/events/me/drafts", {
    withCredentials: true,
  });
  return res.data; // { message, events }
};

// ====================== PUBLISH EVENT ======================
export const publishEvent = async (id: string) => {
  const res = await axios.post(`/backend/api/events/${id}/publish`, {}, {
    withCredentials: true,
  });
  return res.data; // { message, event }
};

export const setEventPublicView = async (id: string, publicView: boolean) => {
  const res = await axios.put(
    `/backend/api/events/${id}/public-view`,
    { publicView },
    { withCredentials: true }
  );
  return res.data; // { message, event }
};

export const getUserHistory = async () => {
  const res = await axios.get("/backend/api/events/me/history", {
    withCredentials: true,
  });
  return res.data; // { message, participated, organized }
};

export const getUserHistoryByUsername = async (username: string) => {
  const res = await axios.get(`/backend/api/events/user/${username}/history`, {
    withCredentials: true,
  });
  return res.data; // { message, participated, organized }
};


// ====================== CHECK EVENT NAME ======================
export const checkEventName = async (eventName: string) => {
  const normalizedName = normalizeEventName(eventName);
  const res = await axios.get("/backend/api/events/check-name", {
    params: { eventName: normalizedName },
    withCredentials: true,
  });
  return res.data; // { message, available }
};

export const deleteEvent = async (id: string) => {
  const res = await axios.delete(`/backend/api/events/${id}`, {
    withCredentials: true,
  });
  return res.data; // { message, deletedId }
};

export const getMyEvents = async () => {
  const res = await axios.get("/backend/api/events/me", {
    withCredentials: true,
  });
  return res.data; // { message, events }
};

// ====================== SPECIAL REWARD ======================
export const createSpecialReward = async (
  eventId: string,
  data: FormData | { name: string; description?: string; image?: string | null }
) => {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  let body: FormData | string;
  let headers: Record<string, string> | undefined = undefined;
  if (isFormData) {
    body = data as FormData;
  } else {
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify(data);
  }
  const res = await fetch(`/backend/api/events/${eventId}/special-rewards`, {
    method: "POST",
    credentials: "include",
    headers,
    body,
  });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const msg = ct.includes("application/json")
      ? (await res.json())?.message || "Failed to create reward"
      : await res.text();
    throw new Error(msg);
  }
  return ct.includes("application/json") ? res.json() : { message: await res.text() };
};

export const updateSpecialReward = async (
  eventId: string,
  rewardId: string,
  data: FormData | { name?: string; description?: string; image?: string | null }
) => {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  let body: FormData | string;
  let headers: Record<string, string> | undefined = undefined;
  if (isFormData) {
    body = data as FormData;
  } else {
    headers = { "Content-Type": "application/json" };
    body = JSON.stringify(data);
  }
  const res = await fetch(`/backend/api/events/${eventId}/special-rewards/${rewardId}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body,
  });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const msg = ct.includes("application/json")
      ? (await res.json())?.message || "Failed to update reward"
      : await res.text();
    throw new Error(msg);
  }
  return ct.includes("application/json") ? res.json() : { message: await res.text() };
};

export const deleteSpecialReward = async (eventId: string, rewardId: string) => {
  const res = await fetch(`/backend/api/events/${eventId}/special-rewards/${rewardId}`, {
    method: "DELETE",
    credentials: "include",
  });
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) {
    const msg = ct.includes("application/json")
      ? (await res.json())?.message || "Failed to delete reward"
      : await res.text();
    throw new Error(msg);
  }
  return ct.includes("application/json") ? res.json() : { message: await res.text() };
};

// ====================== PUBLIC EVENTS & INVITE ======================
export const getPublishedEvents = async () => {
  const res = await axios.get("/backend/api/events", {
    withCredentials: true,
  });
  return res.data; // { message, sig }
};

export const joinEventWithToken = async (
  eventId: string,
  token?: string,
  role?: string,
  sig?: string
) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/invite`,
    {},
    {
      params: { token, role, sig },
      withCredentials: true,
    }
  );
  return res.data; // { message, participant }
};

export const getInviteToken = async (eventId: string, role: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/invite/token`, {
    params: { role },
    withCredentials: true,
  });
  return res.data; // { message, token }
};

export const refreshInviteToken = async (eventId: string, role: string) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/invite/token/refresh`,
    {},
    {
      params: { role },
      withCredentials: true,
    }
  );
  return res.data; // { message, token }
};

export const previewInvite = async (eventId: string, params: { token?: string; role?: string }) => {
  const res = await axios.get(`/backend/api/events/${eventId}/invite/preview`, {
    params,
    withCredentials: true,
  });
  return res.data; // { message, role }
};

import type { ParticipantUpdatePayload } from "@/utils/types";

// ====================== PARTICIPANTS ======================
export const getParticipants = async (eventId: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/participants`, {
    withCredentials: true,
  });
  return res.data; // { message, participants }
};

export const updateParticipant = async (eventId: string, pid: string, data: ParticipantUpdatePayload) => {
  const res = await axios.put(
    `/backend/api/events/${eventId}/participants/${pid}`,
    data,
    { withCredentials: true }
  );
  return res.data; // { message, participant }
};

export const deleteParticipant = async (eventId: string, pid: string) => {
  const res = await axios.delete(
    `/backend/api/events/${eventId}/participants/${pid}`,
    { withCredentials: true }
  );
  return res.data; // { message }
};

export const submitRating = async (eventId: string, rating: number, comment?: string) => {
  const res = await axios.put(
    `/backend/api/events/${eventId}/action/rate`,
    { rating, comment },
    { withCredentials: true }
  );
  return res.data;
};

export const getUserRating = async (eventId: string) => {
  const res = await axios.get(
    `/backend/api/events/${eventId}/action/rate`,
    { withCredentials: true }
  );
  return res.data; // { rating, comment }
};

export const getAllRatings = async (eventId: string) => {
  const res = await axios.get(
    `/backend/api/events/${eventId}/action/ratings`,
    { withCredentials: true }
  );
  return res.data; // { ratings: [{ id, rating, comment, user: { name, image } }] }
};

export const getPresenterStats = async (eventId: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/presenter/stats`, {
    withCredentials: true,
  });
  return res.data; // { message, stats }
};

export const getEventRankings = async (eventId: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/rankings`, {
    withCredentials: true,
  });
  return res.data; // { message, rankings, specialRewards }
};

export const giveVr = async (
  eventId: string,
  projectId: string,
  amount: number,
) => {
  const res = await axios.put(
    `/backend/api/events/${eventId}/action/give-vr`,
    { projectId, amount },
    { withCredentials: true }
  );
  return res.data;
};

export const resetVr = async (eventId: string, projectId: string) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/action/reset-vr`,
    { projectId },
    { withCredentials: true }
  );
  return res.data;
};

export const giveSpecial = async (eventId: string, projectId: string, rewardIds: string[]) => {
  const res = await axios.put(
    `/backend/api/events/${eventId}/action/give-special`,
    { projectId, rewardIds },
    { withCredentials: true }
  );
  return res.data;
};

export const giveComment = async (eventId: string, projectId: string, content: string) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/action/give-comment`,
    { projectId, content },
    { withCredentials: true }
  );
  return res.data;
};

export const getComments = async (eventId: string, projectId: string) => {
  const res = await axios.get(
    `/backend/api/events/${eventId}/teams/${projectId}/comments`,
    { withCredentials: true }
  );
  return res.data; // { message, comments: [...] }
};

export const resetSpecial = async (eventId: string, projectId: string) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/action/reset-special`,
    { projectId },
    { withCredentials: true }
  );
  return res.data;
};

export const deleteTeamFile = async (eventId: string, teamId: string, fileTypeId: string) => {
  const res = await axios.delete(
    `/backend/api/events/${eventId}/teams/${teamId}/files/${fileTypeId}`,
    { withCredentials: true }
  );
  return res.data; // { message }
};

// ====================== TEAMS ======================
export const createTeam = async (eventId: string, teamName: string, description?: string, videoLink?: string, imageCover?: string | File) => {
  let body: FormData | Record<string, unknown>;
  const headers: Record<string, string> = {};

  if (imageCover instanceof File) {
    const formData = new FormData();
    formData.append("teamName", teamName);
    if (description) formData.append("description", description);
    if (videoLink) formData.append("videoLink", videoLink);
    formData.append("imageCover", imageCover);
    body = formData;
    // Axios handles multipart headers automatically when FormData is used
  } else {
    body = { teamName, description, videoLink, imageCover };
    headers["Content-Type"] = "application/json";
  }

  const res = await axios.post(
    `/backend/api/events/${eventId}/teams`,
    body,
    { 
      withCredentials: true,
      headers: Object.keys(headers).length > 0 ? headers : undefined
    }
  );
  return res.data; // { message, team }
};

export const updateTeam = async (
  eventId: string, 
  teamId: string, 
  data: { teamName?: string; description?: string; imageCover?: string | File | null }
) => {
  let body: FormData | Record<string, unknown>;
  const headers: Record<string, string> = {};

  if (data.imageCover instanceof File) {
    const formData = new FormData();
    if (data.teamName) formData.append("teamName", data.teamName);
    if (data.description) formData.append("description", data.description);
    formData.append("imageCover", data.imageCover);
    body = formData;
  } else {
    // If imageCover is null (removed), send "null" string or null value
    // If we want to remove it, we might need to send null.
    // Backend logic: if (typeof imageCover === "string") data.imageCover = imageCover === "null" ? null : imageCover;
    // So if we want to remove, we can send "null" string in FormData, or null in JSON.
    // Let's stick to JSON for non-file updates unless mixed.
    // But wait, if we want to remove image, we should be able to send null.
    body = { ...data };
    if (data.imageCover === null) body.imageCover = "null"; // Handle removal in JSON if backend expects string "null" for FormData compatibility, but JSON can handle null.
    // My backend update: `if (typeof imageCover === "string") data.imageCover = imageCover === "null" ? null : imageCover;`
    // So if JSON sends null, `typeof null` is "object", so it won't be picked up.
    // I should fix backend to handle null or change frontend to send "null".
    // Let's send "null" string for now to be safe with my backend logic.
    if (data.imageCover === null) body.imageCover = "null";
    
    headers["Content-Type"] = "application/json";
  }

  const res = await axios.put(
    `/backend/api/events/${eventId}/teams/${teamId}`,
    body,
    { 
      withCredentials: true,
      headers: Object.keys(headers).length > 0 ? headers : undefined
    }
  );
  return res.data; // { message, team }
};

export const deleteTeam = async (eventId: string, teamId: string) => {
  const res = await axios.delete(
    `/backend/api/events/${eventId}/teams/${teamId}`,
    { withCredentials: true }
  );
  return res.data; // { message }
};

export const getTeams = async (eventId: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/teams`, {
    withCredentials: true,
  });
  return res.data; // { message, teams }
};

export const getTeamById = async (eventId: string, teamId: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/teams/${teamId}`, {
    withCredentials: true,
  });
  return res.data; // { message, team }
};

export const removeTeamMember = async (eventId: string, teamId: string, userId: string) => {
  const res = await axios.delete(
    `/backend/api/events/${eventId}/teams/${teamId}/members/${userId}`,
    { withCredentials: true }
  );
  return res.data;
};

export const uploadTeamFile = async (eventId: string, teamId: string, fileTypeId: string, fileOrUrl: File | string) => {
  const formData = new FormData();
  formData.append("fileTypeId", fileTypeId);
  
  if (fileOrUrl instanceof File) {
    formData.append("file", fileOrUrl);
  } else {
    formData.append("url", fileOrUrl);
  }

  const res = await axios.post(
    `/backend/api/events/${eventId}/teams/${teamId}/files`,
    formData,
    {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data; // { message, teamFile }
};

export const searchCandidates = async (eventId: string, query: string) => {
  const res = await axios.get(`/backend/api/events/${eventId}/presenters/candidates`, {
    params: { q: query },
    withCredentials: true,
  });
  return res.data; // { message, candidates }
};

export const addTeamMember = async (eventId: string, teamId: string, userId: string) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/teams/${teamId}/members`,
    { userId },
    { withCredentials: true }
  );
  return res.data; // { message }
};
