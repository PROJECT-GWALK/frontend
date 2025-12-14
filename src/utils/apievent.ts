import axios from "axios";

// ====================== CREATE EVENT ======================
export const createEvent = async (eventName: string) => {
  const res = await axios.post(
    "/backend/api/events",
    { eventName },
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

// ====================== CHECK EVENT NAME ======================
export const checkEventName = async (eventName: string) => {
  const res = await axios.get(`/backend/api/events/check-name`, {
    params: { eventName },
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
  return res.data; // { message, events }
};

export const signInvite = async (
  eventId: string,
  role: "presenter" | "committee" | "guest"
) => {
  const res = await axios.get(`/backend/api/events/${eventId}/invite/sign`, {
    params: { role },
    withCredentials: true,
  });
  return res.data; // { message, sig }
};

export const joinEvent = async (
  eventId: string,
  role: "presenter" | "committee" | "guest",
  sig: string
) => {
  const res = await axios.post(
    `/backend/api/events/${eventId}/invite`,
    {},
    {
      params: { role, sig },
      withCredentials: true,
    }
  );
  return res.data; // { message, participant }
};
