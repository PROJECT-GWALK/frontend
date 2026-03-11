import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Coins, Trophy, Gift, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventData } from "@/utils/types";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { getEventExportData } from "@/utils/apievent";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

type Props = {
  event: EventData | null;
};

export default function OrganizerDashboard({ event }: Props) {
  const { t, timeFormat } = useLanguage();
  const unitReward = event?.unitReward ?? "coins";
  const vrTotal = event?.vrTotal ?? 0;
  const vrUsed = event?.vrUsed ?? 0;
  const vrRemaining = Math.max(0, vrTotal - vrUsed);

  const committeeVrTotal =
    event?.committeeVirtualTotal ??
    (event?.committeeCount ?? 0) * (event?.virtualRewardCommittee ?? 0);
  const committeeVrUsed = event?.committeeVirtualUsed ?? 0;
  const committeeVrRemaining = Math.max(0, committeeVrTotal - committeeVrUsed);

  const guestVrTotal =
    event?.participantsVirtualTotal ?? (event?.guestsCount ?? 0) * (event?.virtualRewardGuest ?? 0);
  const guestVrUsed = event?.participantsVirtualUsed ?? 0;
  const guestVrRemaining = Math.max(0, guestVrTotal - guestVrUsed);

  const handleExport = async () => {
    if (!event?.id) return;
    const toastId = toast.loading(t("export.loading") || "Exporting data...");
    try {
      const data = await getEventExportData(event.id);
      
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
      const sheet0 = workbook.addWorksheet("Information Summary");
      
      // Title
      sheet0.mergeCells("A1:C1");
      sheet0.getCell("A1").value = "Event Information Summary";
      sheet0.getCell("A1").font = { bold: true, size: 16 };
      sheet0.getCell("A1").alignment = { horizontal: "center" };

      // Section 1: Event Details
      sheet0.getCell("A3").value = "Event Name";
      sheet0.getCell("B3").value = event.eventName;
      // Removed Created At and Status as requested

      // Section 2: Participants
      sheet0.getCell("A5").value = "Participants Overview";
      sheet0.getCell("A5").font = { bold: true };
      
      const stats = [
        { label: "Total Participants", value: (event.presentersCount ?? 0) + (event.guestsCount ?? 0) + (event.committeeCount ?? 0) },
        { label: "Presenters", value: event.presentersCount ?? 0 },
        { label: "Guests", value: event.guestsCount ?? 0 },
        { label: "Committee", value: event.committeeCount ?? 0 },
        { label: "Total Teams", value: data.teams.length },
      ];

      stats.forEach((stat, i) => {
        const row = sheet0.getCell(`A${6 + i}`);
        const valCell = sheet0.getCell(`B${6 + i}`);
        row.value = stat.label;
        valCell.value = stat.value;

        // Apply Role Colors to rows
        if (stat.label === "Presenters") {
           const style = { type: "pattern", pattern: "solid", fgColor: { argb: "FF82A357" } } as ExcelJS.Fill;
           row.fill = style; valCell.fill = style;
           row.font = { color: { argb: "FFFFFFFF" } }; valCell.font = { color: { argb: "FFFFFFFF" } };
        } else if (stat.label === "Guests") {
           const style = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD47A55" } } as ExcelJS.Fill;
           row.fill = style; valCell.fill = style;
           row.font = { color: { argb: "FFFFFFFF" } }; valCell.font = { color: { argb: "FFFFFFFF" } };
        } else if (stat.label === "Committee") {
           const style = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA564DD" } } as ExcelJS.Fill;
           row.fill = style; valCell.fill = style;
           row.font = { color: { argb: "FFFFFFFF" } }; valCell.font = { color: { argb: "FFFFFFFF" } };
        }
      });

      // Section 3: Engagement & Rewards
      const startRow = 6 + stats.length + 2;
      sheet0.getCell(`A${startRow}`).value = "Engagement & Rewards";
      sheet0.getCell(`A${startRow}`).font = { bold: true };

      const engagementStats = [
        { label: "Total Virtual Rewards Budget", value: vrTotal },
        { label: "Total Virtual Rewards Distributed", value: vrUsed },
        { label: "Remaining Budget", value: vrRemaining },
        { label: "Total Comments", value: data.comments.length },
        { label: "Special Awards Voted", value: event.specialPrizeUsed ?? 0 },
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
      const sheetParticipants = workbook.addWorksheet("Participants List");
      
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
      const tableHeader = sheetParticipants.addRow(["No.", "Name", "Role", "Project"]);
      tableHeader.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
      });

      // Gather and Group Participants
      const usersByRole: Record<string, any[]> = { "ORGANIZER": [], "COMMITTEE": [], "PRESENTER": [], "GUEST": [] };
      Object.entries(data.userMap).forEach(([userId, user]: [string, any]) => {
        const role = user.role || "GUEST";
        if (usersByRole[role]) {
          // Find team if presenter
          let teamName = "-";
          if (role === "PRESENTER") {
            // Find which team this user belongs to
            const team = data.teams.find((t: any) => 
              t.participants?.some((p: any) => p.userId === userId)
            );
            if (team) teamName = team.teamName;
          }
          usersByRole[role].push({ name: user.name, role, team: teamName });
        }
      });

      const rolesToDisplay = [
        { key: "ORGANIZER", label: "ORGANIZER", style: organizerHeaderStyle },
        { key: "COMMITTEE", label: "COMMITTEE", style: committeeHeaderStyle },
        { key: "PRESENTER", label: "PRESENTER", style: presenterHeaderStyle },
        { key: "GUEST", label: "GUEST", style: guestHeaderStyle },
      ];

      rolesToDisplay.forEach((roleInfo) => {
        const users = usersByRole[roleInfo.key];
        if (users.length === 0) return;

        // Add Role Header Row
        const roleRow = sheetParticipants.addRow([roleInfo.label]);
        sheetParticipants.mergeCells(roleRow.number, 1, roleRow.number, 4);
        roleRow.getCell(1).style = roleInfo.style;

        // Sort users by name
        users.sort((a, b) => a.name.localeCompare(b.name));

        // Add Users
        users.forEach((user, idx) => {
          const row = sheetParticipants.addRow([idx + 1, user.name, user.role, user.team]);
          row.getCell(1).alignment = { horizontal: "center" };
          row.getCell(3).alignment = { horizontal: "left" };
        });
      });
      
      applyBorderToSheet(sheetParticipants);

      // ================= SHEET 3: Rewards Summary =================
      const sheet1 = workbook.addWorksheet("Rewards Summary");
      sheet1.columns = [
        { header: "No.", key: "no", width: 8 },
        { header: "Project Name", key: "projectName", width: 30 },
        { header: "Total VR", key: "totalVr", width: 15 },
        { header: "Committee VR", key: "committeeVr", width: 15 },
        { header: "Guest VR", key: "guestVr", width: 15 },
        { header: "Special Rewards", key: "specialRewards", width: 40 },
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
      data.teams.forEach((team: any) => {
        teamVrStats[team.id] = { name: team.teamName, total: 0, committee: 0, guest: 0, specialRewards: new Set() };
      });

      const processReward = (giverId: string, teamId: string, amount: number) => {
        if (!teamVrStats[teamId]) return;
        teamVrStats[teamId].total += amount;
        const role = data.userMap[giverId]?.role;
        if (role === "COMMITTEE") teamVrStats[teamId].committee += amount;
        if (role === "GUEST") teamVrStats[teamId].guest += amount;
      };

      data.teamRewards.forEach((r: any) => processReward(r.giverId, r.teamId, r.reward));
      data.teamRewardCategories.forEach((r: any) => processReward(r.giverId, r.teamId, r.amount));

      const rewardVotes: Record<string, Record<string, number>> = {};
      data.specialRewardVotes.forEach((v: any) => {
        if (!rewardVotes[v.rewardId]) rewardVotes[v.rewardId] = {};
        rewardVotes[v.rewardId][v.teamId] = (rewardVotes[v.rewardId][v.teamId] || 0) + 1;
      });

      data.specialRewards.forEach((r: any) => {
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
      const sheet2 = workbook.addWorksheet("Comments");
      sheet2.columns = [
        { header: "No.", key: "no", width: 8 },
        { header: "Project Name", key: "projectName", width: 30 },
        { header: "Commenter", key: "commenter", width: 20 },
        { header: "Role", key: "role", width: 15 },
        { header: "Comment", key: "comment", width: 50 },
        { header: "Date", key: "date", width: 20 },
      ];

      sheet2.getRow(1).eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
      });

      // Group comments by Project
      const commentsByProject: Record<string, { projectName: string; comments: any[] }> = {};
      
      data.comments.forEach((c: any) => {
        const team = data.teams.find((t: any) => t.id === c.teamId);
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
        .filter((t: any) => commentsByProject[t.id])
        .map((t: any) => ({
          ...commentsByProject[t.id],
          teamId: t.id
        }));

      // Also include any comments for unknown teams (if any)
      if (commentsByProject["Unknown"]) {
        sortedTeamsWithComments.push(commentsByProject["Unknown"]);
      }

      let commentRowIndex = 2;
      sortedTeamsWithComments.forEach((project: any, index: number) => {
        const commentCount = project.comments.length;
        if (commentCount === 0) return;

        const startRow = commentRowIndex;
        const endRow = commentRowIndex + commentCount - 1;

        project.comments.forEach((c: any) => {
          const role = data.userMap[c.userId]?.role || "Unknown";
          const row = sheet2.addRow({
            no: index + 1,
            projectName: project.projectName,
            commenter: c.user?.name || "Anonymous",
            role: role,
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
      const sheet3 = workbook.addWorksheet("Grading Summary");
      const allCommittees = new Set<string>();
      const gradingSummary: Record<string, { name: string; totalScore: number; committees: Record<string, number> }> = {};

      data.teams.forEach((t: any) => {
        gradingSummary[t.id] = { name: t.teamName, totalScore: 0, committees: {} };
      });

      data.evaluationResults.forEach((res: any) => {
        if (!gradingSummary[res.teamId]) return;
        gradingSummary[res.teamId].totalScore += res.score;
        const committeeName = data.userMap[res.committeeId]?.name || "Unknown";
        allCommittees.add(committeeName);
        gradingSummary[res.teamId].committees[committeeName] = (gradingSummary[res.teamId].committees[committeeName] || 0) + res.score;
      });

      const sortedCommitteeNames = Array.from(allCommittees).sort();
      
      const sheet3Columns = [
        { header: "No.", key: "no", width: 8 },
        { header: "Project Name", key: "projectName", width: 30 },
        { header: "Total Score", key: "totalScore", width: 15 },
        ...sortedCommitteeNames.map((name) => ({ header: name, key: name, width: 15 })),
      ];
      sheet3.columns = sheet3Columns;

      sheet3.getRow(1).eachCell((cell) => {
        cell.font = headerStyle.font;
        cell.fill = headerStyle.fill;
        cell.alignment = headerStyle.alignment;
      });

      Object.values(gradingSummary).forEach((s, index) => {
        const row: any = {
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
      const sheet4 = workbook.addWorksheet("Detailed Grading");
      
      const criteriaMaxScores = data.evaluationCriteria.reduce((sum: number, c: any) => sum + (c.maxScore || 0), 0);
      const totalAllMax = criteriaMaxScores * (event?.committeeCount || 0);
      
      // Define Columns (Just for width setting, headers will be custom)
      const criteriaKeys = data.evaluationCriteria.map((c: any) => c.name);
      
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
        "No.", 
        "Project Title", 
        "Committee Name", 
        ...data.evaluationCriteria.map((c: any) => `${c.name}(${c.maxScore})`),
        `Total(${criteriaMaxScores})`,
        `Total All(${totalAllMax})`,
        `Total Avg(${criteriaMaxScores})`
      ];
      const headerRow1 = sheet4.addRow(row1Values);
      
      // --- ROW 2: Sub Headers (Weights) ---
      const row2Values = [
        "", // No (Merged)
        "", // Title (Merged)
        "", // Committee (Merged)
        ...data.evaluationCriteria.map((c: any) => `${c.weightPercentage}%`),
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
      data.teams.forEach((team: any) => {
        projectGradingData[team.id] = { 
          projectName: team.teamName, 
          createdAt: team.createdAt,
          rows: [] 
        };
      });

      data.evaluationResults.forEach((res: any) => {
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
      const sortedProjectData = data.teams.map((team: any) => projectGradingData[team.id]);

      let currentRow = 3; // Start after 2 header rows
      const criteriaStartIndex = 4; // A=1, B=2, C=3, Criteria Starts at D=4

      sortedProjectData.forEach((project: { projectName: string; createdAt: string; rows: { committeeName: string; scores: Record<string, number>; total: number }[] }, index: number) => {
        const committeeCount = project.rows.length;
        if (committeeCount === 0) return;

        const startRow = currentRow;
        const endRow = currentRow + committeeCount - 1;

        // Calculate Average Formula
        // Total Avg = Total All / Committee Count
        // But we want it dynamic. If we use formula for Total All, we can use formula for Avg.
        // Total All Cell: Column (totalAllColIndex), Row (startRow merged to endRow)
        // Avg Cell: Column (totalAvgColIndex), Row (startRow merged to endRow)

        project.rows.forEach((row: { committeeName: string; scores: Record<string, number>; total: number }) => {
          const excelRow: any = {
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
          const totalColLetter = sheet4.getColumn(totalColIndex).letter;
          
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
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t("dashboard.exportData") || "Export Data"}
        </Button>
      </div>

      {/* SECTION 1: PEOPLE & PARTICIPATION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Participants - Highlighted Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              {t("dashboard.totalParticipants")}
              <Users className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">
              {(event?.presentersCount ?? 0) +
                (event?.guestsCount ?? 0) +
                (event?.committeeCount ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("organizerDashboard.totalPeopleInEvent")}
            </p>
          </CardContent>
        </Card>

        {/* Presenters Card */}
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.presenters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{event?.presentersCount ?? 0}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {t("organizerDashboard.people")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {event?.presenterTeams ?? 0} {t("organizerDashboard.outOfTotalTeams")}{" "}
              {event?.maxTeams ?? 0} {t("organizerDashboard.team")}
            </div>
          </CardContent>
        </Card>

        {/* Committee Card */}
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.committee")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{event?.committeeCount ?? 0}</div>
            {/* <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("organizerDashboard.feedback")}: {event?.opinionsCommittee ?? 0}
            </div> */}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {t("organizerDashboard.people")}
            </div>
          </CardContent>
        </Card>

        {/* Guest Card */}
        <Card className="shadow-sm border-l-4 border-l-orange-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("organizerDashboard.guests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{event?.guestsCount ?? 0}</div>
            {/* <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t("organizerDashboard.comments")}: {event?.participantsCommentCount ?? 0}
            </div> */}
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {t("organizerDashboard.people")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: REWARDS & GAMIFICATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Virtual Rewards - Progress Bar Visualization */}
        <Card className="lg:col-span-1 border-t-4 border-t-amber-500 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />{" "}
              {t("organizerDashboard.virtualRewards")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Total Virtual Rewards */}
            <div className="flex justify-between items-end pb-4 border-b border-border/50">
              <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {vrUsed.toLocaleString(timeFormat)}
              </span>
              <span className="text-sm text-muted-foreground mb-1">
                /
                {vrTotal.toLocaleString(timeFormat)} {unitReward}
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="h-2 w-full bg-amber-100 dark:bg-amber-900/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    vrTotal > 0 ? Math.min(100, (vrUsed / vrTotal) * 100) : 0
                  }%`,
                }}
              />
            </div>

            <div className="text-xs text-muted-foreground flex justify-between">
              <span>
                {t("organizerDashboard.used")}{" "}
                {vrTotal > 0 ? Math.round((vrUsed / vrTotal) * 100) : 0}
                %
              </span>
              <span>
                {t("organizerDashboard.remaining")} {vrRemaining.toLocaleString(timeFormat)}{" "}
                {unitReward}
              </span>
            </div>

            {/* Rewards by Role */}
            {(event?.virtualRewardGuest ?? 0) > 0 || (event?.virtualRewardCommittee ?? 0) > 0 ? (
              <div className="space-y-4 pt-2 border-t border-border/50">
                {/* Committee Rewards */}
                {(event?.virtualRewardCommittee ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                        {t("organizerDashboard.committeeVR")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {committeeVrUsed.toLocaleString(timeFormat)}/
                        {committeeVrTotal.toLocaleString(timeFormat)} {unitReward}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            committeeVrTotal > 0
                              ? Math.min(100, (committeeVrUsed / committeeVrTotal) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {t("organizerDashboard.total")}:{" "}
                        {committeeVrTotal.toLocaleString(timeFormat)} {unitReward} (
                        {event?.virtualRewardCommittee ?? 0} {unitReward}/
                        {t("organizerDashboard.committee")})
                      </span>
                      <span>
                        {t("organizerDashboard.usedPercent")}{" "}
                        {committeeVrTotal > 0 ? Math.round((committeeVrUsed / committeeVrTotal) * 100) : 0}
                        %
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("organizerDashboard.remaining")} {committeeVrRemaining.toLocaleString(timeFormat)}{" "}
                      {unitReward}
                    </div>
                  </div>
                )}
                {/* Guest Rewards */}
                {(event?.virtualRewardGuest ?? 0) > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                        {t("organizerDashboard.guestVR")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {guestVrUsed.toLocaleString(timeFormat)}/
                        {guestVrTotal.toLocaleString(timeFormat)} {unitReward}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-orange-100 dark:bg-orange-900/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            guestVrTotal > 0 ? Math.min(100, (guestVrUsed / guestVrTotal) * 100) : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {t("organizerDashboard.total")}:{" "}
                        {guestVrTotal.toLocaleString(timeFormat)} {unitReward} (
                        {event?.virtualRewardGuest ?? 0} {unitReward}/
                        {t("organizerDashboard.guests")})
                      </span>
                      <span>
                        {t("organizerDashboard.usedPercent")}{" "}
                        {guestVrTotal > 0 ? Math.round((guestVrUsed / guestVrTotal) * 100) : 0}
                        %
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("organizerDashboard.remaining")} {guestVrRemaining.toLocaleString(timeFormat)}{" "}
                      {unitReward}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Special Prizes - Voting Status */}
        <Card className="lg:col-span-1 border-t-4 border-t-purple-500 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />{" "}
              {t("organizerDashboard.votingProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats Row */}
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                  {event?.specialPrizeUsed ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {(event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0)}{" "}
                  {t("organizerDashboard.totalVotes")}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    (event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0) > 0
                      ? ((event?.specialPrizeUsed ?? 0) /
                          ((event?.committeeCount ?? 0) * (event?.specialPrizeCount ?? 0))) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Available Awards List */}
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Gift className="h-3 w-3" /> {t("organizerDashboard.availableAwards")}
              </p>
              <div className="space-y-3">
                {event?.specialRewards && event.specialRewards.length > 0 ? (
                  event.specialRewards.map((reward, i) => (
                    <div
                      key={reward.id || i}
                      className="flex items-start gap-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800"
                    >
                      {/* Badge Image */}
                      <div className="relative w-10 h-10 shrink-0 rounded-md overflow-hidden bg-card border border-border shadow-sm">
                        {reward.image ? (
                          <Image
                            src={reward.image}
                            alt={reward.name}
                            width={40}
                            height={40}
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                            <Trophy className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100 truncate block pr-2">
                            {reward.name}
                          </span>
                          <span className="text-xs font-medium text-purple-600 dark:text-purple-300 shrink-0 bg-white dark:bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800 shadow-sm">
                            {reward.voteCount ?? 0} {t("organizerDashboard.vote")}
                          </span>
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="h-1.5 w-full bg-purple-200 dark:bg-purple-900/30 rounded-full overflow-hidden mb-1.5">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${event?.committeeCount && event.committeeCount > 0 ? Math.min(100, ((reward.voteCount ?? 0) / event.committeeCount) * 100) : 0}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>
                            {t("organizerDashboard.committee")}: {reward.voteCount ?? 0}/
                            {event?.committeeCount ?? 0}
                          </span>
                          <span>
                            {t("organizerDashboard.candidates")}: {reward.teamCount ?? 0}{" "}
                            {t("organizerDashboard.team")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    No special awards configured
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: ENGAGEMENT & OPINIONS */}
      {/* <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted/50 rounded-full shadow-sm border border-border">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {t("organizerDashboard.totalFeedbackReceived")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("organizerDashboard.feedbackSummary")}
              </p>
            </div>
          </div>

          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground">{event?.opinionsGot ?? 0}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t("organizerDashboard.total")}
              </div>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div className="grid grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-xl font-bold text-foreground">{event?.opinionsGuest ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">
                  {t("organizerDashboard.guests")}
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">
                  {event?.opinionsCommittee ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {t("organizerDashboard.committee")}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
