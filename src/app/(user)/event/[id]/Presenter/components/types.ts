export type PresenterProject = {
  id: string;
  title: string;
  desc?: string;
  img?: string;
  videoLink?: string;
  files?: { name: string; url: string; fileTypeId?: string }[];
  members?: string[];
  memberUserIds?: string[];
  isLeader?: boolean;
  createdAt?: string;
  totalVr?: number;
  myComment?: string;
  myGraded?: boolean;
};
