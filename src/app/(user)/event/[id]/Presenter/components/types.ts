export type PresenterProject = {
  id: string;
  title: string;
  desc?: string;
  img?: string;
  videoLink?: string;
  files?: { name: string; url: string }[];
  members?: string[];
};
