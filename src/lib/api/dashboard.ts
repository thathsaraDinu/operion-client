import { apiClient } from "./client";

export interface AttendanceSummary {
  id: number;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
  employeeName: string;
}

export interface LeaveSummary {
  id: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface DashboardStats {
  // Admin/HR stats
  totalEmployees?: number;
  totalDepartments?: number;
  totalProjects?: number;
  totalTasks?: number;
  pendingLeaveRequests?: number;
  activeProjects?: number;
  completedTasks?: number;
  employeesOnLeaveToday?: number;
  
  // Manager stats
  myProjects?: number;
  myTasks?: number;
  myActiveProjects?: number;
  myCompletedTasks?: number;
  teamPendingLeaves?: number;
  teamOnLeaveToday?: number;
  
  // Employee stats
  myPendingLeaves?: number;
  myCompletedTasksEmployee?: number;
  
  // Common
  date: string;
  
  // Recent data
  recentAttendance?: AttendanceSummary[];
  recentLeaves?: LeaveSummary[];
}

export const dashboardApi = {
  getStats: () =>
    apiClient.get<DashboardStats>("/api/dashboard").then((r) => r.data),
};
