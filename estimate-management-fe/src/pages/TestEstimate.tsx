import React, { useState } from "react";
import { TestEstimateTable } from "../components/estimate/TestEstimateTable";

interface Personnel {
  estimate_hours: number;
  role_id: number;
  issue_id: number;
  id: number;
}

interface Issue {
  title: string;
  type_id: number;
  parent_id: number | null;
  project_id: number;
  id: number;
  created_at: string | null;
  children: Issue[];
  personnel: Personnel[];
}

const sampleData: Issue[] = [
  {
    title: "Epic 1",
    type_id: 1,
    parent_id: null,
    project_id: 1,
    id: 1,
    created_at: null,
    children: [
      {
        title: "Story 1",
        type_id: 2,
        parent_id: null,
        project_id: 1,
        id: 2,
        created_at: null,
        children: [
          {
            title: "Task 1",
            type_id: 3,
            parent_id: null,
            project_id: 1,
            id: 3,
            created_at: null,
            children: [
              {
                title: "Subtask 1",
                type_id: 4,
                parent_id: null,
                project_id: 1,
                id: 4,
                created_at: null,
                children: [],
                personnel: [
                  { estimate_hours: 8, role_id: 1, issue_id: 4, id: 13 },
                  { estimate_hours: 4, role_id: 2, issue_id: 4, id: 14 },
                  { estimate_hours: 2, role_id: 3, issue_id: 4, id: 15 },
                  { estimate_hours: 1, role_id: 4, issue_id: 4, id: 16 },
                ],
              },
              {
                title: "Subtask 2",
                type_id: 4,
                parent_id: null,
                project_id: 1,
                id: 5,
                created_at: null,
                children: [],
                personnel: [
                  { estimate_hours: 6, role_id: 1, issue_id: 5, id: 17 },
                  { estimate_hours: 3, role_id: 2, issue_id: 5, id: 18 },
                  { estimate_hours: 2, role_id: 3, issue_id: 5, id: 19 },
                  { estimate_hours: 1, role_id: 4, issue_id: 5, id: 20 },
                ],
              },
            ],
            personnel: [
              { estimate_hours: 5, role_id: 1, issue_id: 3, id: 9 },
              { estimate_hours: 3, role_id: 2, issue_id: 3, id: 10 },
              { estimate_hours: 2, role_id: 3, issue_id: 3, id: 11 },
              { estimate_hours: 1, role_id: 4, issue_id: 3, id: 12 },
            ],
          },
          {
            title: "Task 2",
            type_id: 3,
            parent_id: null,
            project_id: 1,
            id: 6,
            created_at: null,
            children: [],
            personnel: [
              { estimate_hours: 4, role_id: 1, issue_id: 6, id: 21 },
              { estimate_hours: 2, role_id: 2, issue_id: 6, id: 22 },
              { estimate_hours: 1, role_id: 3, issue_id: 6, id: 23 },
              { estimate_hours: 1, role_id: 4, issue_id: 6, id: 24 },
            ],
          },
        ],
        personnel: [
          { estimate_hours: 10, role_id: 1, issue_id: 2, id: 5 },
          { estimate_hours: 8, role_id: 2, issue_id: 2, id: 6 },
          { estimate_hours: 5, role_id: 3, issue_id: 2, id: 7 },
          { estimate_hours: 3, role_id: 4, issue_id: 2, id: 8 },
        ],
      },
      {
        title: "Story 2",
        type_id: 2,
        parent_id: null,
        project_id: 1,
        id: 2,
        created_at: null,
        children: [],
        personnel: [
          { estimate_hours: 10, role_id: 1, issue_id: 2, id: 5 },
          { estimate_hours: 8, role_id: 2, issue_id: 2, id: 6 },
          { estimate_hours: 5, role_id: 3, issue_id: 2, id: 7 },
          { estimate_hours: 3, role_id: 4, issue_id: 2, id: 8 },
        ],
      },
      {
        title: "Story 3",
        type_id: 2,
        parent_id: null,
        project_id: 1,
        id: 2,
        created_at: null,
        children: [
          {
            title: "Task story 3",
            type_id: 3,
            parent_id: null,
            project_id: 1,
            id: 6,
            created_at: null,
            children: [
              {
                title: "Subtask 1",
                type_id: 4,
                parent_id: null,
                project_id: 1,
                id: 4,
                created_at: null,
                children: [],
                personnel: [
                  { estimate_hours: 8, role_id: 1, issue_id: 4, id: 13 },
                  { estimate_hours: 4, role_id: 2, issue_id: 4, id: 14 },
                  { estimate_hours: 2, role_id: 3, issue_id: 4, id: 15 },
                  { estimate_hours: 1, role_id: 4, issue_id: 4, id: 16 },
                ],
              },
              {
                title: "Subtask 2",
                type_id: 4,
                parent_id: null,
                project_id: 1,
                id: 5,
                created_at: null,
                children: [],
                personnel: [
                  { estimate_hours: 6, role_id: 1, issue_id: 5, id: 17 },
                  { estimate_hours: 3, role_id: 2, issue_id: 5, id: 18 },
                  { estimate_hours: 2, role_id: 3, issue_id: 5, id: 19 },
                  { estimate_hours: 1, role_id: 4, issue_id: 5, id: 20 },
                ],
              },
            ],
            personnel: [
              { estimate_hours: 4, role_id: 1, issue_id: 6, id: 21 },
              { estimate_hours: 2, role_id: 2, issue_id: 6, id: 22 },
              { estimate_hours: 1, role_id: 3, issue_id: 6, id: 23 },
              { estimate_hours: 1, role_id: 4, issue_id: 6, id: 24 },
            ],
          },
        ],
        personnel: [
          { estimate_hours: 10, role_id: 1, issue_id: 2, id: 5 },
          { estimate_hours: 8, role_id: 2, issue_id: 2, id: 6 },
          { estimate_hours: 5, role_id: 3, issue_id: 2, id: 7 },
          { estimate_hours: 3, role_id: 4, issue_id: 2, id: 8 },
        ],
      },
    ],
    personnel: [
      { estimate_hours: 20, role_id: 1, issue_id: 1, id: 1 },
      { estimate_hours: 15, role_id: 2, issue_id: 1, id: 2 },
      { estimate_hours: 10, role_id: 3, issue_id: 1, id: 3 },
      { estimate_hours: 5, role_id: 4, issue_id: 1, id: 4 },
    ],
  },
  {
    title: "Epic 2",
    type_id: 1,
    parent_id: null,
    project_id: 1,
    id: 7,
    created_at: null,
    children: [],
    personnel: [
      { estimate_hours: 12, role_id: 1, issue_id: 7, id: 25 },
      { estimate_hours: 8, role_id: 2, issue_id: 7, id: 26 },
      { estimate_hours: 4, role_id: 3, issue_id: 7, id: 27 },
      { estimate_hours: 2, role_id: 4, issue_id: 7, id: 28 },
    ],
  },
];

export const TestEstimate = () => {
  const [issues, setIssues] = useState<Issue[]>(sampleData);

  return <TestEstimateTable issues={issues} onUpdate={setIssues} />;
};
