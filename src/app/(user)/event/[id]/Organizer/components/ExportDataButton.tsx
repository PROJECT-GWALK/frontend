"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { EventData } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";
import { getEventExportData } from "@/utils/apievent";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

type Props = {
  event: EventData | null;
};

type ExportUserRole = "ORGANIZER" | "COMMITTEE" | "PRESENTER" | "GUEST";

type ExportUser = {
  name?: string;
  role?: ExportUserRole | string;
};

type ExportTeamParticipant = {
  userId: string;
};

type ExportTeam = {
  id: string;
  teamName: string;
  createdAt: string;
  participants?: ExportTeamParticipant[];
};

type ExportComment = {
  teamId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: { name?: string };
};

type ExportTeamReward = {
  giverId: string;
  teamId: string;
  reward: number;
};

type ExportTeamRewardCategory = {
  giverId: string;
  teamId: string;
  amount: number;
};

type ExportSpecialRewardVote = {
  rewardId: string;
  teamId: string;
};

type ExportSpecialReward = {
  id: string;
  name: string;
};

type ExportEvaluationCriteria = {
  name: string;
  maxScore?: number;
  weightPercentage?: number;
};

type ExportEvaluationResult = {
  teamId: string;
  committeeId: string;
  score: number;
  criteria?: { name?: string };
};

type ExportData = {
  teams: ExportTeam[];
  userMap: Record<string, ExportUser>;
  comments: ExportComment[];
  teamRewards: ExportTeamReward[];
  teamRewardCategories: ExportTeamRewardCategory[];
  specialRewardVotes: ExportSpecialRewardVote[];
  specialRewards: ExportSpecialReward[];
  evaluationResults: ExportEvaluationResult[];
  evaluationCriteria: ExportEvaluationCriteria[];
};

export default function ExportDataButton({ event }: Props) {
  const { t } = useLanguage();

  const handleExport = async () => {
    if (!event?.id) return;
    const toastId = toast.loading(t("export.loading") || "Exporting data...");
    try {
      const data = (await getEventExportData(event.id)) as ExportData;
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "GWALK System";
      workbook.created = new Date();

      // Common Styles
      const headerStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } } as ExcelJS.Fill,
        alignment: { horizontal: "center", vertical: "middle" } as Partial<ExcelJS.Alignment>,
        border: { bottom: { style: "thin" } } as Partial<ExcelJS.Borders>,
      };

      const applyBorderToSheet = (sheet: ExcelJS.Worksheet) => {
        sheet.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      };

      // ================= SHEET 1: Information Summary =================
      const sheet0 = workbook.addWorksheet(t("export.sheets.infoSummary") || "Information Summary");
      
      // Title
      sheet0.mergeCells("A1:C1");
      sheet0.getCell("A1").value = t("export.info.title") || "Event Information Summary";
      sheet0.getCell("A1").font = { bold: true, size: 16 };
      sheet0.getCell("A1").alignment = { horizontal: "center" };

      // Section 1: Event Details
      sheet0.getCell("A3").value = t("export.info.eventName") || "Event Name";
      sheet0.getCell("B3").value = event.eventName;
      // Removed Created At and Status as requested

      // Section 2: Participants
      sheet0.getCell("A5").value = t("export.info.participantsOverview") || "Participants Overview";
      sheet0.getCell("A5").font = { bold: true };
      
      const stats = [
        { label: t("export.info.totalParticipants") || "Total Participants", value: (event.presentersCount ?? 0) + (event.guestsCount ?? 0) + (event.committeeCount ?? 0) },
        { label: t("export.info.presenters") || "Presenters", value: event.presentersCount ?? 0 },
        { label: t("export.info.guests") || "Guests", value: event.guestsCount ?? 0 },
        { label: t("export.info.committee") || "Committee", value: event.committeeCount ?? 0 },
        { label: t("export.info.totalTeams") || "Total Teams", value: data.teams.length },
      ];

      stats.forEach((stat, i) => {
        const row = sheet0.getCell(`A${6 + i}`);
        const valCell = sheet0.getCell(`B${6 + i}`);
        row.value = stat.label;
        valCell.value = stat.value;

        // Apply Role Colors to rows
        // Using translated labels might break this check if we check by label string.
        // Better to check by index or use a key.
        // Let's rely on index since the array is static order above.
        // Presenters is index 1, Guests is index 2, Committee is index 3.
        
        if (i === 1) { // Presenters
           const style = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82A357" } } as ExcelJS.Fill;
           row.fill = style; valCell.fill = style;
           row.font = { color: { argb: "FFFFFFFF" } }; valCell.font = { color: { argb: "FFFFFFFF" } };
        } else if (i === 2) { // Guests
           const style = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD47A55" } } as ExcelJS.Fill;
           row.fill = style; valCell.fill = style;
           row.font = { color: { argb: "FFFFFFFF" } }; valCell.font = { color: { argb: "FFFFFFFF" } };
        } else if (i === 3) { // Committee
           const style = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA564DD" } } as ExcelJS.Fill;
           row.fill = style; valCell.fill = style;
           row.font = { color: { argb: "FFFFFFFF" } }; valCell.font = { color: { argb: "FFFFFFFF" } };
        }
      });

      // Section 3: Engagement & Rewards
      const startRow = 6 + stats.length + 2;
      sheet0.getCell(`A${startRow}`).value = t("export.info.engagementRewards") || "Engagement & Rewards";
      sheet0.getCell(`A${startRow}`).font = { bold: true };

      const vrTotal = event?.vrTotal ?? 0;
      const vrUsed = event?.vrUsed ?? 0;
      const vrRemaining = Math.max(0, vrTotal - vrUsed);

      const engagementStats = [
        { label: t("export.info.totalVrBudget") || "Total Virtual Rewards Budget", value: vrTotal },
        { label: t("export.info.totalVrDistributed") || "Total Virtual Rewards Distributed", value: vrUsed },
        { label: t("export.info.remainingBudget") || "Remaining Budget", value: vrRemaining },
        { label: t("export.info.totalComments") || "Total Comments", value: data.comments.length },
        { label: t("export.info.specialAwardsVoted") || "Special Awards Voted", value: event.specialPrizeUsed ?? 0 },
      ];

      engagementStats.forEach((stat, i) => {
        sheet0.getCell(`A${startRow + 1 + i}`).value = stat.label;
        sheet0.getCell(`B${startRow + 1 + i}`).value = stat.value;
      });

      // Styling for Info Sheet
      sheet0.getColumn(1).width = 30;
      sheet0.getColumn(2).width = 40;
      applyBorderToSheet(sheet0);

      // ================= SHEET 2: Participants List =================
      const sheetParticipants = workbook.addWorksheet(t("export.sheets.participantsList") || "Participants List");
      
      const organizerHeaderStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFCB467D" } } as ExcelJS.Fill, // --role-organizer
        alignment: { horizontal: "center", vertical: "middle" } as Partial<ExcelJS.Alignment>,
      };

      const committeeHeaderStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFA564DD" } } as ExcelJS.Fill, // --role-committee
        alignment: { horizontal: "center", vertical: "middle" } as Partial<ExcelJS.Alignment>,
      };

      const presenterHeaderStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF82A357" } } as ExcelJS.Fill, // --role-presenter
        alignment: { horizontal: "center", vertical: "middle" } as Partial<ExcelJS.Alignment>,
      };

      const guestHeaderStyle = {
        font: { bold: true, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD47A55" } } as ExcelJS.Fill, // --role-guest
        alignment: { horizontal: "center", vertical: "middle" } as Partial<ExcelJS.Alignment>,
      };

      // Define columns widths
      sheetParticipants.getColumn(1).width = 8;
      sheetParticipants.getColumn(2).width = 30;
      sheetParticipants.getColumn(3).width = 20;
      sheetParticipants.getColumn(4).width = 35;

      // Add Table Header
      const tableHeader = sheetParticipants.addRow([
        t("export.headers.no") || "No.", 
        t("export.headers.name") || "Name", 
        t("export.headers.role") || "Role", 
        t("export.headers.project") || "Project"
      ]);
      tableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
      });

      // Gather and Group Participants
      const usersByRole: Record<ExportUserRole, { name: string; role: ExportUserRole; team: string }[]> = {
        ORGANIZER: [],
        COMMITTEE: [],
        PRESENTER: [],
        GUEST: [],
      };
      Object.entries(data.userMap).forEach(([userId, user]) => {
        const role = user.role || "GUEST";
        if (role in usersByRole) {
          // Find team if presenter
          let teamName = "-";
          if (role === "PRESENTER") {
            // Find which team this user belongs to
            const team = data.teams.find((t) =>
              t.participants?.some((p) => p.userId === userId),
            );
            if (team) teamName = team.teamName;
          }
          usersByRole[role as ExportUserRole].push({
            name: user.name || "-",
            role: role as ExportUserRole,
            team: teamName,
          });
        }
      });

      const rolesToDisplay: { key: ExportUserRole; label: string; style: Partial<ExcelJS.Style> }[] = [
        { key: "ORGANIZER", label: "ORGANIZER", style: organizerHeaderStyle },
        { key: "COMMITTEE", label: "COMMITTEE", style: committeeHeaderStyle },
        { key: "PRESENTER", label: "PRESENTER", style: presenterHeaderStyle },
        { key: "GUEST", label: "GUEST", style: guestHeaderStyle },
      ];

      rolesToDisplay.forEach((roleInfo) => {
        const users = usersByRole[roleInfo.key];
        if (users.length === 0) return;

        // Add Role Header Row
        const roleLabel = t(`roles.${roleInfo.key.toLowerCase()}`) || roleInfo.label;
        const roleRow = sheetParticipants.addRow([roleLabel]);
        sheetParticipants.mergeCells(roleRow.number, 1, roleRow.number, 4);
        roleRow.getCell(1).style = roleInfo.style;

        // Sort users by name
        users.sort((a, b) => a.name.localeCompare(b.name));

        // Add Users
        users.forEach((user, idx) => {
          // Translate user role for the row data
          const userRoleLabel = t(`roles.${user.role.toLowerCase()}`) || user.role;
          const row = sheetParticipants.addRow([idx + 1, user.name, userRoleLabel, user.team]);
          row.getCell(1).alignment = { horizontal: "center" };
          row.getCell(3).alignment = { horizontal: "left" };
        });
      });
      
      applyBorderToSheet(sheetParticipants);

      // ================= SHEET 3: Rewards Summary =================
      const sheet1 = workbook.addWorksheet(t("export.sheets.rewardsSummary") || "Rewards Summary");
      sheet1.columns = [
        { header: t("export.headers.no") || "No.", key: "no", width: 8 },
        { header: t("export.headers.projectName") || "Project Name", key: "projectName", width: 30 },
        { header: t("export.headers.totalVr") || "Total VR", key: "totalVr", width: 15 },
        { header: t("export.headers.committeeVr") || "Committee VR", key: "committeeVr", width: 15 },
        { header: t("export.headers.guestVr") || "Guest VR", key: "guestVr", width: 15 },
        { header: t("export.headers.specialRewards") || "Special Rewards", key: "specialRewards", width: 40 },
      ];
      
      sheet1.getRow(1).eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
      });

      // Override colors for Committee and Guest VR columns
      sheet1.getCell("D1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA564DD" } }; // Committee
      sheet1.getCell("E1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD47A55" } }; // Guest

      // Prepare Data
      const teamVrStats: Record<string, { name: string; total: number; committee: number; guest: number; specialRewards: Set<string> }> = {};
      data.teams.forEach((team) => {
        teamVrStats[team.id] = { name: team.teamName, total: 0, committee: 0, guest: 0, specialRewards: new Set() };
      });

      const processReward = (giverId: string, teamId: string, amount: number) => {
        if (!teamVrStats[teamId]) return;
        teamVrStats[teamId].total += amount;
        const role = data.userMap[giverId]?.role;
        if (role === "COMMITTEE") teamVrStats[teamId].committee += amount;
        if (role === "GUEST") teamVrStats[teamId].guest += amount;
      };

      data.teamRewards.forEach((r) => processReward(r.giverId, r.teamId, r.reward));
      data.teamRewardCategories.forEach((r) => processReward(r.giverId, r.teamId, r.amount));

      const rewardVotes: Record<string, Record<string, number>> = {};
      data.specialRewardVotes.forEach((v) => {
        if (!rewardVotes[v.rewardId]) rewardVotes[v.rewardId] = {};
        rewardVotes[v.rewardId][v.teamId] = (rewardVotes[v.rewardId][v.teamId] || 0) + 1;
      });

      data.specialRewards.forEach((r) => {
        const votes = rewardVotes[r.id];
        if (!votes) return;
        const maxVotes = Math.max(...Object.values(votes));
        if (maxVotes > 0) {
          Object.entries(votes).forEach(([teamId, count]) => {
            if (count === maxVotes && teamVrStats[teamId]) {
              teamVrStats[teamId].specialRewards.add(r.name);
            }
          });
        }
      });

      Object.values(teamVrStats).forEach((s, index) => {
        sheet1.addRow({
          no: index + 1,
          projectName: s.name,
          totalVr: s.total,
          committeeVr: s.committee,
          guestVr: s.guest,
          specialRewards: Array.from(s.specialRewards).join(", "),
        });
      });
      applyBorderToSheet(sheet1);

      // ================= SHEET 2: Comments =================
      const sheet2 = workbook.addWorksheet(t("export.sheets.comments") || "Comments");
      sheet2.columns = [
        { header: t("export.headers.no") || "No.", key: "no", width: 8 },
        { header: t("export.headers.projectName") || "Project Name", key: "projectName", width: 30 },
        { header: t("export.headers.commenter") || "Commenter", key: "commenter", width: 20 },
        { header: t("export.headers.role") || "Role", key: "role", width: 15 },
        { header: t("export.headers.comment") || "Comment", key: "comment", width: 50 },
        { header: t("export.headers.date") || "Date", key: "date", width: 20 },
      ];

      sheet2.getRow(1).eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
      });

      // Group comments by Project
      const commentsByProject: Record<string, { projectName: string; comments: ExportComment[] }> = {};
      
      data.comments.forEach((c) => {
        const team = data.teams.find((t) => t.id === c.teamId);
        const teamId = team?.id || "Unknown";
        if (!commentsByProject[teamId]) {
          commentsByProject[teamId] = {
            projectName: team?.teamName || "Unknown",
            comments: []
          };
        }
        commentsByProject[teamId].comments.push(c);
      });

      // Sort projects by createdAt (using data.teams order which is already sorted)
      // Filter only teams that have comments
      const sortedTeamsWithComments = data.teams
        .filter((t) => commentsByProject[t.id])
        .map((t) => ({
          ...commentsByProject[t.id],
          teamId: t.id
        }));

      // Also include any comments for unknown teams (if any)
      if (commentsByProject["Unknown"]) {
        sortedTeamsWithComments.push({
          ...commentsByProject["Unknown"],
          teamId: "Unknown",
        });
      }

      let commentRowIndex = 2;
      sortedTeamsWithComments.forEach((project, index) => {
        const commentCount = project.comments.length;
        if (commentCount === 0) return;

        const startRow = commentRowIndex;
        const endRow = commentRowIndex + commentCount - 1;

        project.comments.forEach((c) => {
          const role = data.userMap[c.userId]?.role || "Unknown";
          const roleLabel = t(`roles.${role.toLowerCase()}`) || role;
          
          const row = sheet2.addRow({
            no: index + 1,
            projectName: project.projectName,
            commenter: c.user?.name || "Anonymous",
            role: roleLabel,
            comment: c.content,
            date: new Date(c.createdAt).toLocaleString(),
          });

          // Colorize Role Cell
          const roleCell = row.getCell("role");
          if (role === "COMMITTEE") {
            roleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA564DD" } };
            roleCell.font = { color: { argb: "FFFFFFFF" } };
          } else if (role === "GUEST") {
            roleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD47A55" } };
            roleCell.font = { color: { argb: "FFFFFFFF" } };
          } else if (role === "PRESENTER") {
            roleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82A357" } };
            roleCell.font = { color: { argb: "FFFFFFFF" } };
          } else if (role === "ORGANIZER") {
            roleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCB467D" } };
            roleCell.font = { color: { argb: "FFFFFFFF" } };
          }
        });

        // Merge No. and Project Name if more than 1 comment
        if (commentCount > 1) {
          sheet2.mergeCells(`A${startRow}:A${endRow}`); // No.
          sheet2.mergeCells(`B${startRow}:B${endRow}`); // Project Name
        }

        // Align merged cells
        sheet2.getCell(`A${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        sheet2.getCell(`B${startRow}`).alignment = { vertical: 'middle', horizontal: 'left' };

        commentRowIndex += commentCount;
      });
      applyBorderToSheet(sheet2);

      // ================= SHEET 3: Grading Summary =================
      const sheet3 = workbook.addWorksheet(t("export.sheets.gradingSummary") || "Grading Summary");
      const allCommittees = new Set<string>();
      const gradingSummary: Record<string, { name: string; totalScore: number; committees: Record<string, number> }> = {};

      data.teams.forEach((t) => {
        gradingSummary[t.id] = { name: t.teamName, totalScore: 0, committees: {} };
      });

      data.evaluationResults.forEach((res) => {
        if (!gradingSummary[res.teamId]) return;
        gradingSummary[res.teamId].totalScore += res.score;
        const committeeName = data.userMap[res.committeeId]?.name || "Unknown";
        allCommittees.add(committeeName);
        gradingSummary[res.teamId].committees[committeeName] = (gradingSummary[res.teamId].committees[committeeName] || 0) + res.score;
      });

      const sortedCommitteeNames = Array.from(allCommittees).sort();
      
      const sheet3Columns = [
        { header: t("export.headers.no") || "No.", key: "no", width: 8 },
        { header: t("export.headers.projectName") || "Project Name", key: "projectName", width: 30 },
        { header: t("export.headers.totalScore") || "Total Score", key: "totalScore", width: 15 },
        ...sortedCommitteeNames.map((name) => ({ header: name, key: name, width: 15 })),
      ];
      sheet3.columns = sheet3Columns;

      sheet3.getRow(1).eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
      });

      Object.values(gradingSummary).forEach((s, index) => {
        const row: Record<string, string | number> = {
          no: index + 1,
          projectName: s.name,
          totalScore: s.totalScore,
        };
        sortedCommitteeNames.forEach((cName) => {
          row[cName] = s.committees[cName] || 0;
        });
        sheet3.addRow(row);
      });
      applyBorderToSheet(sheet3);

      // ================= SHEET 4: Detailed Grading (Poster) =================
      const sheet4 = workbook.addWorksheet(t("export.sheets.detailedGrading") || "Detailed Grading");
      
      const criteriaMaxScores = data.evaluationCriteria.reduce(
        (sum, c) => sum + (c.maxScore || 0),
        0,
      );
      const totalAllMax = criteriaMaxScores * (event?.committeeCount || 0);
      
      // Define Columns (Just for width setting, headers will be custom)
      const criteriaKeys = data.evaluationCriteria.map((c) => c.name);
      
      sheet4.columns = [
        { key: "no", width: 8 },
        { key: "projectTitle", width: 30 },
        { key: "committeeName", width: 25 },
        ...criteriaKeys.map((key: string) => ({ key: key, width: 15 })),
        { key: "total", width: 12 },
        { key: "totalAll", width: 15 },
        { key: "totalAvg", width: 15 },
      ];

      // --- ROW 1: Main Headers ---
      const row1Values = [
        t("export.headers.no") || "No.", 
        t("export.headers.projectTitle") || "Project Title", 
        t("export.headers.committeeName") || "Committee Name", 
        ...data.evaluationCriteria.map((c) => `${c.name}(${c.maxScore})`),
        `${t("export.headers.total") || "Total"}(${criteriaMaxScores})`,
        `${t("export.headers.totalAll") || "Total All"}(${totalAllMax})`,
        `${t("export.headers.totalAvg") || "Total Avg"}(${criteriaMaxScores})`
      ];
      const headerRow1 = sheet4.addRow(row1Values);
      
      // --- ROW 2: Sub Headers (Weights) ---
      const row2Values = [
        "", // No (Merged)
        "", // Title (Merged)
        "", // Committee (Merged)
        ...data.evaluationCriteria.map((c) => `${c.weightPercentage}%`),
        "", // Total (Merged)
        "", // Total All (Merged)
        ""  // Total Avg (Merged)
      ];
      const headerRow2 = sheet4.addRow(row2Values);

      // --- Styling & Merging Headers ---
      headerRow1.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
      headerRow2.eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });

      // Merge Vertical Headers (No, Title, Committee, Totals)
      sheet4.mergeCells("A1:A2"); // No
      sheet4.mergeCells("B1:B2"); // Project Title
      sheet4.mergeCells("C1:C2"); // Committee Name
      
      const criteriaCount = criteriaKeys.length;
      const totalColIndex = 4 + criteriaCount; // D is 4
      const totalAllColIndex = totalColIndex + 1;
      const totalAvgColIndex = totalAllColIndex + 1;

      sheet4.mergeCells(1, totalColIndex, 2, totalColIndex); // Total
      sheet4.mergeCells(1, totalAllColIndex, 2, totalAllColIndex); // Total All
      sheet4.mergeCells(1, totalAvgColIndex, 2, totalAvgColIndex); // Total Avg

      // Prepare detailed data per project
      const projectGradingData: Record<string, { 
        projectName: string; 
        createdAt: string;
        rows: { committeeName: string; scores: Record<string, number>; total: number }[];
      }> = {};

      // Initialize with all teams to ensure order and completeness
      data.teams.forEach((team) => {
        projectGradingData[team.id] = { 
          projectName: team.teamName, 
          createdAt: team.createdAt,
          rows: [] 
        };
      });

      data.evaluationResults.forEach((res) => {
        if (!projectGradingData[res.teamId]) return; // Should not happen if initialized from teams
        
        const committeeName = data.userMap[res.committeeId]?.name || "Unknown";
        let row = projectGradingData[res.teamId].rows.find(r => r.committeeName === committeeName);
        if (!row) {
          row = { committeeName, scores: {}, total: 0 };
          projectGradingData[res.teamId].rows.push(row);
        }
        
        const criteriaName = res.criteria?.name || "Unknown";
        row.scores[criteriaName] = res.score;
        row.total += res.score;
      });

      // Convert to array using the original teams order (which is sorted by createdAt from backend)
      const sortedProjectData = data.teams.map((team) => projectGradingData[team.id]);

      let currentRow = 3; // Start after 2 header rows
      const criteriaStartIndex = 4; // A=1, B=2, C=3, Criteria Starts at D=4

      sortedProjectData.forEach((project, index) => {
        const committeeCount = project.rows.length;
        if (committeeCount === 0) return;

        const startRow = currentRow;
        const endRow = currentRow + committeeCount - 1;

        // Calculate Average Formula
        // Total Avg = Total All / Committee Count
        // But we want it dynamic. If we use formula for Total All, we can use formula for Avg.
        // Total All Cell: Column (totalAllColIndex), Row (startRow merged to endRow)
        // Avg Cell: Column (totalAvgColIndex), Row (startRow merged to endRow)

        project.rows.forEach((row) => {
          const excelRow: Record<string, string | number> = {
            no: index + 1,
            projectTitle: project.projectName,
            committeeName: row.committeeName,
            // total: row.total, // Formula below
          };
          
          criteriaKeys.forEach((key: string) => {
            excelRow[key] = row.scores[key] || 0;
          });
          
          const newRow = sheet4.addRow(excelRow);
          
          // Add Formula for Row Total
          const startColLetter = sheet4.getColumn(criteriaStartIndex).letter;
          const endColLetter = sheet4.getColumn(criteriaStartIndex + criteriaCount - 1).letter;
          const rowNum = newRow.number;
          newRow.getCell(totalColIndex).value = { 
            formula: `SUM(${startColLetter}${rowNum}:${endColLetter}${rowNum})`,
            result: row.total
          };
        });

        // Merge Cells if more than 1 row
        if (committeeCount > 1) {
          sheet4.mergeCells(`A${startRow}:A${endRow}`); // No.
          sheet4.mergeCells(`B${startRow}:B${endRow}`); // Project Title
          
          const totalAllColLetter = sheet4.getColumn(totalAllColIndex).letter;
          const totalAvgColLetter = sheet4.getColumn(totalAvgColIndex).letter;
          const totalColLetter = sheet4.getColumn(totalColIndex).letter;

          sheet4.mergeCells(`${totalAllColLetter}${startRow}:${totalAllColLetter}${endRow}`); // Total All
          sheet4.mergeCells(`${totalAvgColLetter}${startRow}:${totalAvgColLetter}${endRow}`); // Total Avg
          
          // Formula: SUM of all individual totals
          sheet4.getCell(`${totalAllColLetter}${startRow}`).value = { 
            formula: `SUM(${totalColLetter}${startRow}:${totalColLetter}${endRow})`,
            result: project.rows.reduce((sum: number, r: { total: number }) => sum + r.total, 0)
          };
           // Formula: Average
          sheet4.getCell(`${totalAvgColLetter}${startRow}`).value = { 
            formula: `AVERAGE(${totalColLetter}${startRow}:${totalColLetter}${endRow})`,
            result: project.rows.length > 0 ? project.rows.reduce((sum: number, r: { total: number }) => sum + r.total, 0) / project.rows.length : 0
          };
        } else {
          // Single row case
          const totalAllColLetter = sheet4.getColumn(totalAllColIndex).letter;
          const totalAvgColLetter = sheet4.getColumn(totalAvgColIndex).letter;
          const totalColLetter = sheet4.getColumn(totalColIndex).letter;

          sheet4.getCell(`${totalAllColLetter}${startRow}`).value = { 
            formula: `SUM(${totalColLetter}${startRow}:${totalColLetter}${endRow})`,
            result: project.rows.reduce((sum: number, r: { total: number }) => sum + r.total, 0)
          };
          sheet4.getCell(`${totalAvgColLetter}${startRow}`).value = { 
            formula: `AVERAGE(${totalColLetter}${startRow}:${totalColLetter}${endRow})`,
            result: project.rows.length > 0 ? project.rows.reduce((sum: number, r: { total: number }) => sum + r.total, 0) / project.rows.length : 0
          };
        }

        // Apply alignment and styling
        sheet4.getCell(`A${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        sheet4.getCell(`B${startRow}`).alignment = { vertical: 'middle', horizontal: 'left' };
        
        const totalAllColLetter = sheet4.getColumn(totalAllColIndex).letter;
        const totalAvgColLetter = sheet4.getColumn(totalAvgColIndex).letter;
        
        sheet4.getCell(`${totalAllColLetter}${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };
        sheet4.getCell(`${totalAvgColLetter}${startRow}`).alignment = { vertical: 'middle', horizontal: 'center' };

        currentRow += committeeCount;
      });
      applyBorderToSheet(sheet4);

      // Generate Buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Event_Export_${event.eventName.replace(/\s+/g, "_")}.xlsx`);
      
      toast.success(t("export.success") || "Export successful", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(t("export.failed") || "Export failed", { id: toastId });
    }
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      {t("export.button") || "Export Data"}
    </Button>
  );
}
