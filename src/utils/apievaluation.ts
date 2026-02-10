import axios from "axios";

// ====================== EVALUATION CRITERIA ======================

export const getEvaluationCriteria = async (eventId: string) => {
  const res = await axios.get(`/backend/api/evaluation/event/${eventId}/criteria`, {
    withCredentials: true,
  });
  return res.data; // { criteria }
};

export const createEvaluationCriteria = async (
  eventId: string,
  data: {
    name: string;
    description?: string;
    maxScore: number;
    weightPercentage: number;
    sortOrder?: number;
  },
) => {
  const res = await axios.post(`/backend/api/evaluation/event/${eventId}/criteria`, data, {
    withCredentials: true,
  });
  return res.data; // { criteria }
};

export const updateEvaluationCriteria = async (
  eventId: string,
  criteriaId: string,
  data: Partial<{
    name: string;
    description: string;
    maxScore: number;
    weightPercentage: number;
    sortOrder: number;
  }>,
) => {
  const res = await axios.put(
    `/backend/api/evaluation/event/${eventId}/criteria/${criteriaId}`,
    data,
    {
      withCredentials: true,
    },
  );
  return res.data; // { criteria }
};

export const deleteEvaluationCriteria = async (eventId: string, criteriaId: string) => {
  const res = await axios.delete(
    `/backend/api/evaluation/event/${eventId}/criteria/${criteriaId}`,
    {
      withCredentials: true,
    },
  );
  return res.data; // { message }
};

// ====================== GRADING ======================

export const submitGrade = async (
  eventId: string,
  teamId: string,
  data: {
    criteriaId: string;
    score: number;
  },
) => {
  const res = await axios.post(
    `/backend/api/evaluation/event/${eventId}/team/${teamId}/grade`,
    data,
    {
      withCredentials: true,
    },
  );
  return res.data; // { result }
};

export const getTeamGrades = async (eventId: string, teamId: string) => {
  const res = await axios.get(`/backend/api/evaluation/event/${eventId}/team/${teamId}/grades`, {
    withCredentials: true,
  });
  return res.data; // { grades }
};

export const getGradingResults = async (eventId: string) => {
  const res = await axios.get(`/backend/api/evaluation/event/${eventId}/results`, {
    withCredentials: true,
  });
  return res.data; // { results, criteria }
};

export const getGradingStatus = async (eventId: string, teamId: string) => {
  const res = await axios.get(`/backend/api/evaluation/event/${eventId}/team/${teamId}/status`, {
    withCredentials: true,
  });
  return res.data; // { isGraded, gradesSubmitted, totalCriteria }
};
