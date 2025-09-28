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

//////////////////////////////////////////////////////////
// EVENT API (Wizard Steps)
//////////////////////////////////////////////////////////
// ✅ Step 1: Create Event (Basic Info) frontend(/createEvent) สำหรับสร้างครั้งแรก
export const createEvent = async (formData: FormData) => {
  const res = await axios.post("/backend/api/events", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ✅ Step 1: Create Event (Basic Info) frontend(/createEvent/[id]) สำหรับย้อนกลับมาแก้ไข
export const updateEvent = async (id: string, formData: FormData) => {
  const res = await axios.put(`/backend/api/events/${id}`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ✅ Step 2: Participation Settings
export const updateParticipation = async (
  id: string,
  payload: {
    publicJoin: boolean;
    passwordJoin?: string;
    maxTeams?: number;
    maxTeamMembers?: number;
    publicView: boolean;
    passwordView?: string;
    showDashboard: boolean;
    fileTypes?: {
      name: string;
      description?: string;
      allowedFileType: "jpg" | "png" | "pdf" | "url" | null;
      isRequired?: boolean;
    }[];
  }
) => {
  const res = await axios.put(
    `/backend/api/events/${id}/participation`,
    payload,
    {
      withCredentials: true,
    }
  );
  return res.data; // { message, event }
};

// ✅ Step 3: Committee Settings + Guest Reward
export const updateCommitteeGuest = async (
  id: string,
  payload: {
    hasCommittee: boolean;
    virtualRewardCommittee?: number;
    virtualRewardGuest?: number;
    unitReward?: string | null;
  }
) => {
  const res = await axios.put(
    `/backend/api/events/${id}/committeeguest`,
    payload,
    { withCredentials: true }
  );
  return res.data; // { message, event }
};

// ✅ Step 4: Bulk update special rewards (multipart/form-data)
export const updateSpecialRewards = async (
  eventId: string,
  formData: FormData
) => {
  const res = await axios.put(
    `/backend/api/events/${eventId}/specialreward`,
    formData,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data; // { message, event }
};

// ✅ Step 4: List rewards of event
export const getSpecialRewards = async (eventId: string) => {
  const res = await axios.get(
    `/backend/api/events/${eventId}/specialreward`,
    {
      withCredentials: true,
    }
  );
  return res.data; // { message, rewards }
};

// ✅ Step 4: Delete reward
export const deleteSpecialReward = async (rewardId: string) => {
  const res = await axios.delete(
    `/backend/api/events/specialreward/${rewardId}`,
    {
      withCredentials: true,
    }
  );
  return res.data; // { message, deletedId }
};

// ✅ Step 5: Timeline & Dates
export const updateTimeline = async (
  id: string,
  payload: {
    startJoinDate?: string;
    endJoinDate?: string;
    startView?: string;
    showDashboard?: boolean;
  }
) => {
  const res = await axios.put(`/backend/api/events/${id}/timeline`, payload, {
    withCredentials: true,
  });
  return res.data; // { message, event }
};

// ✅ Step 6: Preview Event
export const getEventPreview = async (id: string) => {
  const res = await axios.get(`/backend/api/events/${id}/preview`, {
    withCredentials: true,
  });
  return res.data; // { message, event }
};

// ✅ Step 6: Submit (Confirm & Publish)
export const submitEvent = async (id: string) => {
  const res = await axios.post(`/backend/api/events/${id}/submit`, {}, {
    withCredentials: true,
  });
  return res.data; // { message, event }
};

export const getEvent = async (id: string) => {
  const res = await axios.get(`/backend/api/events/${id}`, {
    withCredentials: true,
  });
  return res.data; // { message, event }
};

// ✅ Get My Draft Events
export const getMyDraftEvents = async () => {
  const res = await axios.get("/backend/api/events/me/drafts", {
    withCredentials: true,
  });
  return res.data; // { message, events }
};
