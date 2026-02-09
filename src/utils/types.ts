import z from "zod";

export type User = {
  id: string;
  email: string;
  username: string;
  name: string;
  image: string | null;
  description: string | null;
  role: string;
  banned?: boolean;
};

export const settingsSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores (no spaces)",
    ),
  name: z.string().min(1, "Name is required").max(30, "Name too long"),
  description: z.string().max(200, "Description too long").optional().or(z.literal("")),
  image: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) =>
        val === "" ||
        val?.startsWith("http://") ||
        val?.startsWith("https://") ||
        val?.startsWith("blob:") ||
        val?.startsWith("/"),
      "Invalid image URL",
    ),
});

export type UserActiveChartData = {
  date: string;
  active: number;
  fullLabel: string;
};

export type EventDetail = {
  id: string;
  eventName: string;
  eventDescription?: string;
  imageCover?: string | null;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  locationPlace?: string;
  locationLink?: string;
  isOnline?: boolean;
  meetingLink?: string;
  visibility?: "public" | "private";
  status?: "DRAFT" | "PUBLISHED";

  maxPresenters?: number;
  isIndividual?: boolean;
  maxGroups?: number;
  maxPeoplePerGroup?: number;
  submissionStartDate?: string;
  submissionStartTime?: string;
  submissionEndDate?: string;
  submissionEndTime?: string;
  fileRequirement?: string;
  linkRequirement?: string;
  fileTypes?: EventFileType[];

  hasCommittee?: boolean;
  unitReward?: string;
  committeeCount?: number;
  committeeReward?: number;
  hasGuestRewards?: boolean;
  guestRewardAmount?: number;

  specialRewards?: SpecialReward[];
};

export type SpecialReward = {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  voteCount?: number;
  teamCount?: number;
};

export type VrCategory = {
  id: string;
  eventId: string;
  nameEn: string;
  nameTh: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type TeamFile = {
  fileUrl: string;
  fileTypeId?: string;
};

export type TeamParticipant = {
  userId: string;
  isLeader?: boolean;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
};

export type Team = {
  id: string;
  teamName: string;
  description?: string;
  imageCover?: string;
  videoLink?: string;
  files?: TeamFile[];
  participants: TeamParticipant[];
  createdAt?: string;
  totalVr?: number;
  myReward?: number;
  myCategoryRewards?: { categoryId: string; amount: number }[];
  vrCategories?: VrCategory[];
  categoryTotals?: { categoryId: string; total: number }[];
  mySpecialRewards?: string[];
  myComment?: string;
};

export type ProjectMember = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  isLeader?: boolean;
};

export type Candidate = {
  id: string;
  userId: string;
  name: string;
  username: string;
  image: string | null;
};

export type DraftEvent = {
  id: string;
  eventName: string;
  createdAt: string;
  imageCover?: string | null;
  status: "PUBLISHED" | "DRAFT";
  publicView: boolean;
  startView?: string;
  endView?: string;
  startJoinDate?: string;
  endJoinDate?: string;
  maxTeams?: number;
  maxTeamMembers?: number;
  virtualRewardGuest?: number;
  virtualRewardCommittee?: number;
  vrTeamCapEnabled?: boolean;
  vrTeamCapGuest?: number;
  vrTeamCapCommittee?: number;
  hasCommittee?: boolean;
  unitReward?: string;
  locationName?: string;
  location?: string;
};

export type MyEvent = {
  id: string;
  eventName: string;
  createdAt: string;
  status: "PUBLISHED";
  role: string | null;
  isLeader: boolean;
  imageCover?: string | null;
  publicView?: boolean;
  startView?: string;
  endView?: string;
  startJoinDate?: string;
  endJoinDate?: string;
  userRating?: number | null;
  organizerName?: string | null;
  organizerImage?: string | null;
};

export type EventData = {
  id: string;
  eventName: string;
  eventDescription?: string;
  imageCover?: string | null;
  status?: "DRAFT" | "PUBLISHED";
  publicView?: boolean;
  startView?: string;
  endView?: string;
  startJoinDate?: string;
  endJoinDate?: string;
  maxTeams?: number;
  maxTeamMembers?: number;
  virtualRewardGuest?: number;
  virtualRewardCommittee?: number;
  vrTeamCapEnabled?: boolean;
  vrTeamCapGuest?: number;
  vrTeamCapCommittee?: number;
  hasCommittee?: boolean;
  unitReward?: string;
  locationName?: string;
  location?: string;
  totalParticipants?: number;
  presentersCount?: number;
  presenterTeams?: number;
  guestsCount?: number;
  committeeCount?: number;
  participantsVirtualTotal?: number;
  participantsVirtualUsed?: number;
  participantsCommentCount?: number;
  committeeVirtualTotal?: number;
  committeeVirtualUsed?: number;
  committeeFeedbackCount?: number;
  opinionsGot?: number;
  myRole?: string | null;
  opinionsPresenter?: number;
  opinionsGuest?: number;
  opinionsCommittee?: number;
  vrTotal?: number;
  vrUsed?: number;
  vrCategories?: VrCategory[];
  awardsUnused?: SpecialReward[];
  specialRewards?: SpecialReward[];
  specialPrizeUsed?: number;
  specialPrizeCount?: number;
  fileTypes?: EventFileType[];
  participants?: EventParticipant[];
  myVirtualTotal?: number;
  myVirtualUsed?: number;
  myFeedbackCount?: number;
};

export type EventParticipant = {
  id: string;
  userId: string;
  eventId: string;
  eventGroup: string;
  isLeader: boolean;
  user?: User;
};

export enum FileType {
  jpg = "jpg",
  png = "png",
  pdf = "pdf",
  url = "url",
}

export type EventFileType = {
  id?: string;
  name: string;
  description?: string | null;
  allowedFileTypes: FileType[];
  isRequired: boolean;
};

export type EventEditSection =
  | "description"
  | "time"
  | "location"
  | "presenter"
  | "guest"
  | "rewards"
  | "committee";

export type SpecialRewardEdit = SpecialReward & {
  pendingFile?: File;
  preview?: string | null;
  removeImage?: boolean;
  _dirty?: boolean;
};

export type EventFormState = {
  eventDescription?: string;
  locationName?: string;
  location?: string;
  guestReward?: number;
  hasCommittee?: boolean;
  committeeReward?: number;
  vrTeamCapEnabled?: boolean;
  vrTeamCapGuest?: number;
  vrTeamCapCommittee?: number;
  unitReward?: string;
  startView?: string;
  endView?: string;
  startJoinDate?: string;
  endJoinDate?: string;
  maxTeams?: number;
  maxTeamMembers?: number;
};

export type EventGroup = "ORGANIZER" | "PRESENTER" | "COMMITTEE" | "GUEST";

export type ParticipantUpdatePayload = {
  eventGroup?: EventGroup;
  isLeader?: boolean;
  virtualReward?: number;
  teamId?: string | null;
};
