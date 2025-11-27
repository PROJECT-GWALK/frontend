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
export const updateEvent = async (id: string, updateData: any) => {
  const res = await axios.put(
    `/backend/api/events/${id}`,
    { updateData },
    { withCredentials: true }
  );
  return res.data;
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
