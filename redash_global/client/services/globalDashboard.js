import { axios } from "@/services/axios";

export function GlobalDashboard(dashboard) {
  Object.assign(this, dashboard);
}

const GlobalDashboardService = {
  query: (params) => axios.get("/global-api/template-dashboards", { params }),
  get: (id) => axios.get(`/global-api/template-dashboards/${id}`),
  getAssignments: (id) => axios.get(`/global-api/sub-dashboards/${id}/assignments`),
  addAssignment: (id, organizationId) =>
    axios.post(`/global-api/sub-dashboards/${id}/assignments`, { organization_id: organizationId }),
  removeAssignment: (id, assignmentId) =>
    axios.delete(`/global-api/sub-dashboards/${id}/assignments/${assignmentId}`),
};

Object.assign(GlobalDashboard, GlobalDashboardService);
