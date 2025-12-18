import type { PresenterProject } from "./types";

export const SAMPLE_PROJECTS: PresenterProject[] = [
  {
    id: "01",
    title: "Doctor Web App",
    desc: "Create Appointment, View Medical Records etc.",
    img: "/project1.png",
    videoLink: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    files: [
      { name: "Proposal.pdf", url: "/files/proposal-doctor.pdf" },
      { name: "Presentation.pdf", url: "/files/presentation-doctor.pdf" },
    ],
    members: ["Alice", "Bob", "Charlie"],
  },
  {
    id: "02",
    title: "Restaurant Application",
    desc: "Create Reservation, View Menu etc.",
    img: "/project2.png",
    videoLink: "",
    files: [{ name: "Design.zip", url: "/files/design-restaurant.zip" }],
    members: ["David", "Eva"],
  },
  {
    id: "03",
    title: "CMU Hub",
    desc: "Hub for every CMU students.",
    img: "/project3.png",
    videoLink: "https://www.youtube.com/embed/3JZ_D3ELwOQ",
    files: [],
    members: ["Fiona"],
  },
];
