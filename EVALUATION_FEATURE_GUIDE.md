# Evaluation/Grading Feature - Implementation Guide

## Overview

A complete evaluation and grading system has been implemented for the gwalk project, allowing Organizers to define grading criteria and Committee members to grade projects based on those criteria.

## Database Schema

### New Tables Created:

#### `EvaluationCriteria`

- Linked to `Event`
- Fields:
  - `id` (UUID, Primary Key)
  - `eventId` (UUID, Foreign Key to Event)
  - `name` (String): Criteria name (e.g., "Creativity", "Design")
  - `description` (String, Optional): Detailed description
  - `maxScore` (Float): Maximum score for this criteria
  - `weightPercentage` (Float): Weight percentage (0-100)
  - `sortOrder` (Int): Display order
  - `createdAt`, `updatedAt` (DateTime)

#### `EvaluationResult`

- Linked to `Event`, `Team`, `EvaluationCriteria`, and `User` (Committee Member)
- Unique constraint: `(teamId, criteriaId, committeeId)` - ensures one committee member can only submit one score per criteria per team
- Fields:
  - `id` (UUID, Primary Key)
  - `eventId` (UUID, Foreign Key)
  - `teamId` (UUID, Foreign Key)
  - `criteriaId` (UUID, Foreign Key)
  - `committeeId` (UUID, Foreign Key to User)
  - `score` (Float): Score given by the committee member
  - `createdAt`, `updatedAt` (DateTime)

## Backend API Endpoints

### Base URL: `/api/evaluation`

#### Criteria Management (Organizer Only)

**GET** `/event/:eventId/criteria`

- Get all evaluation criteria for an event
- Access: ORGANIZER or COMMITTEE
- Response: `{ criteria: EvaluationCriteria[] }`

**POST** `/event/:eventId/criteria`

- Create new evaluation criteria
- Access: ORGANIZER only
- Body: `{ name, description?, maxScore, weightPercentage, sortOrder? }`
- Response: `{ criteria: EvaluationCriteria }`

**PUT** `/event/:eventId/criteria/:criteriaId`

- Update evaluation criteria
- Access: ORGANIZER only
- Body: Partial criteria fields
- Response: `{ criteria: EvaluationCriteria }`

**DELETE** `/event/:eventId/criteria/:criteriaId`

- Delete evaluation criteria
- Access: ORGANIZER only
- Response: `{ message: string }`

#### Grading Operations (Committee & Organizer)

**POST** `/event/:eventId/team/:teamId/grade`

- Submit score for a project
- Access: COMMITTEE only
- Body: `{ criteriaId, score }`
- Validation:
  - Score must be between 0 and maxScore
  - Committee member must be participant in event
- Response: `{ result: EvaluationResult }`

**GET** `/event/:eventId/team/:teamId/grades`

- Get current user's grades for a project
- Access: COMMITTEE only
- Response: `{ grades: EvaluationResult[] }`

**GET** `/event/:eventId/team/:teamId/status`

- Get grading status (how many criteria graded)
- Access: COMMITTEE only
- Response: `{ isGraded: boolean, gradesSubmitted: number, totalCriteria: number }`

#### Results & Reporting (Organizer Only)

**GET** `/event/:eventId/results`

- Get all grading results with calculated weighted averages
- Access: ORGANIZER only
- Response:

```json
{
  "results": [
    {
      "teamId": "string",
      "teamName": "string",
      "presenterName": "string",
      "overallAverage": number,
      "committeeScores": [
        {
          "committeeId": "string",
          "committeeName": "string",
          "avgScore": number,
          "scores": { "criteriaId": score }
        }
      ]
    }
  ],
  "criteria": "EvaluationCriteria[]"
}
```

## Frontend Components

### 1. Organizer Components

#### `EvaluationCriteriaForm.tsx`

- **Location**: `frontend/src/app/(user)/event/[id]/Organizer/components/`
- **Purpose**: Management form for defining evaluation criteria
- **Features**:
  - Add new criteria with name, description, max score, weight percentage
  - Edit existing criteria inline
  - Delete criteria with confirmation
  - Real-time weight validation (should sum to 100%)
  - Visual warning if weight total ≠ 100%
- **Props**: `eventId`, `initialCriteria`, `onUpdate` callback
- **Usage**:

```tsx
<EvaluationCriteriaForm eventId={eventId} initialCriteria={criteria} onUpdate={handleUpdate} />
```

#### `GradingDashboard.tsx`

- **Location**: `frontend/src/app/(user)/event/[id]/Organizer/components/`
- **Purpose**: View and export all grading results
- **Features**:
  - Table showing all teams with their grades
  - Individual committee member scores per criteria
  - Weighted average calculation
  - Committee summary cards showing average scores
  - Excel export functionality (.xlsx format)
- **Props**: `eventId`
- **Usage**:

```tsx
<GradingDashboard eventId={eventId} />
```

### 2. Committee Components

#### `CommitteeGradingForm.tsx`

- **Location**: `frontend/src/app/(user)/event/[id]/Presenter/components/`
- **Purpose**: Grading interface for committee members
- **Features**:
  - Display all criteria with descriptions
  - Input fields for scores with max/min validation
  - Real-time weighted average calculation
  - Progress indicator (e.g., "3/5 criteria graded")
  - Submit button (disabled if all criteria not scored)
  - Shows "Submitted" status after completion
- **Props**: `eventId`, `teamId`, `teamName`, `disabled?`
- **Usage**:

```tsx
<CommitteeGradingForm eventId={eventId} teamId={projectId} teamName={projectName} />
```

#### `GradingStatusBadge.tsx`

- **Location**: `frontend/src/app/(user)/event/[id]/Presenter/components/`
- **Purpose**: Status indicator on project cards/lists
- **Features**:
  - Green "Graded" badge if all criteria scored
  - Orange "Pending" badge if criteria remaining
  - Shows progress (e.g., "Pending (2/5)")
- **Props**: `eventId`, `teamId`
- **Usage**:

```tsx
<GradingStatusBadge eventId={eventId} teamId={teamId} />
```

### 3. API Utility Functions

#### `utils/apievaluation.ts`

Helper functions for API calls:

```typescript
// Criteria Management
getEvaluationCriteria(eventId: string)
createEvaluationCriteria(eventId, data)
updateEvaluationCriteria(eventId, criteriaId, data)
deleteEvaluationCriteria(eventId, criteriaId)

// Grading
submitGrade(eventId, teamId, data)
getTeamGrades(eventId, teamId)
getGradingStatus(eventId, teamId)

// Results
getGradingResults(eventId: string)
```

## Integration Instructions

### Step 1: Add Components to Event Edit Page (Organizer)

In your event edit/creation page:

```tsx
import EvaluationCriteriaForm from "./components/EvaluationCriteriaForm";

export default function EventEditPage() {
  const [eventData, setEventData] = useState(/* ... */);
  const [criteria, setCriteria] = useState([]);

  return (
    <div>
      {/* Other event fields */}

      <EvaluationCriteriaForm eventId={eventId} initialCriteria={criteria} onUpdate={setCriteria} />
    </div>
  );
}
```

### Step 2: Add Dashboard to Organizer Dashboard Page

```tsx
import GradingDashboard from "./components/GradingDashboard";

export default function OrganizerDashboard() {
  return (
    <div>
      {/* Other dashboard elements */}
      <GradingDashboard eventId={selectedEventId} />
    </div>
  );
}
```

### Step 3: Add Grading Form to Project Detail Page (Committee)

```tsx
import CommitteeGradingForm from "./components/CommitteeGradingForm";

export default function ProjectDetailPage() {
  const { eventId, projectId, projectName } = useParams();

  return (
    <div>
      {/* Project information */}

      {userRole === "COMMITTEE" && (
        <CommitteeGradingForm eventId={eventId} teamId={projectId} teamName={projectName} />
      )}
    </div>
  );
}
```

### Step 4: Add Status Badge to Project List/Cards (Committee)

```tsx
import GradingStatusBadge from "./components/GradingStatusBadge";

export default function ProjectCard({ project, eventId }) {
  return (
    <div>
      <h3>{project.name}</h3>

      {userRole === "COMMITTEE" && <GradingStatusBadge eventId={eventId} teamId={project.id} />}
    </div>
  );
}
```

## Role-Based Access Control

### Organizer

- ✅ Create evaluation criteria
- ✅ Update evaluation criteria
- ✅ Delete evaluation criteria
- ✅ View grading results dashboard
- ✅ Export results to Excel
- ❌ Cannot grade projects
- ❌ Cannot see grading form

### Committee

- ✅ View evaluation criteria
- ✅ Submit grades for projects
- ✅ View their own grading status
- ❌ Cannot create/edit/delete criteria
- ❌ Cannot view overall results
- ❌ Cannot export data

### Presenter

- ❌ Cannot see grading form
- ❌ Cannot see grading results
- ❌ Cannot see evaluation criteria

### Guest

- ❌ Cannot see grading form
- ❌ Cannot see grading results
- ❌ Cannot see evaluation criteria

**Backend Enforcement**: All endpoints verify `session.user.role` and EventParticipant status before returning data. API returns 403 Forbidden for unauthorized access.

## Scoring Calculation

### Weighted Average Formula

For each committee member's scores:

```
Weighted Score = Σ((Score / MaxScore) × 100 × Weight%) / Σ(Weight%)
```

### Overall Average

```
Overall Average = Σ(Committee Member Weighted Scores) / Number of Committee Members
```

## Excel Export Format

The export includes:

- **Columns**: Team Name, Presenter Name, Overall Average, [Per Committee Member Scores]
- **Rows**: One row per team
- **Criteria Details**: Nested scoring information for each criteria per committee member

Example structure:

```
Team Name | Presenter | Overall Avg | Committee1 Avg | Committee1 Creativity | ...
```

## Validation Rules

### Criteria Creation/Update

- Name is required and non-empty
- Max score must be positive (> 0)
- Weight percentage must be 0-100
- Total weight should equal 100% (warning if not)

### Grade Submission

- Score cannot be negative
- Score cannot exceed maxScore
- Committee member must be participant in event
- Team must exist in event

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **403**: Forbidden (unauthorized access)
- **404**: Not Found (resource doesn't exist)
- **500**: Server Error

## Future Enhancements

- [ ] Grading rubric/benchmark guidelines
- [ ] Comments from committee members
- [ ] Grading appeals/revisions workflow
- [ ] Statistical analysis (min/max/std dev per criteria)
- [ ] Comparison with previous years
- [ ] Mobile-friendly grading interface
- [ ] Bulk import criteria from templates
- [ ] Notifications to organizers when grading incomplete

## Testing Checklist

- [ ] Organizer can create/edit/delete criteria
- [ ] Weight validation works correctly
- [ ] Committee can view criteria
- [ ] Committee can submit grades
- [ ] Grades are validated (not exceeding max)
- [ ] Weighted averages calculate correctly
- [ ] Presenter cannot see grading form
- [ ] Guest cannot see grading form
- [ ] Excel export includes all data
- [ ] Status badge shows graded/pending correctly
- [ ] API returns 403 for unauthorized roles
- [ ] Database constraints work (unique per team/criteria/committee)
