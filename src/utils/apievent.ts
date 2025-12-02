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
export const updateEvent = async (id: string, data: any) => {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const res = await fetch(`/backend/api/events/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: isFormData ? data : JSON.stringify(data),
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

// ====================== CHECK EVENT NAME ======================
export const checkEventName = async (eventName: string) => {
  const res = await axios.get(`/backend/api/events/check-name/check`, {
    params: { eventName },
    withCredentials: true,
  });
  return res.data; // { message, available }
};

export const getMyEvents = async () => {
  const res = await axios.get("/backend/api/events/me", {
    withCredentials: true,
  });
  return res.data; // { message, events }
};
