import { axios } from "@/services/axios";

export function ComposedDashboard(dashboard) {
  Object.assign(this, dashboard);
}

const ComposedDashboardService = {
  query: (params) => axios.get("/global-api/global-dashboards", { params }),
  create: (data) => axios.post("/global-api/global-dashboards", data),
  get: (id) => axios.get(`/global-api/global-dashboards/${id}`),
  getEntries: (id) => axios.get(`/global-api/global-dashboards/${id}/entries`),
  addEntry: (id, dashboardId) => axios.post(`/global-api/global-dashboards/${id}/entries`, { dashboard_id: dashboardId }),
  removeEntry: (id, entryId) => axios.delete(`/global-api/global-dashboards/${id}/entries/${entryId}`),
  reorderEntries: (id, entryIds) => axios.post(`/global-api/global-dashboards/${id}/entries/reorder`, { entry_ids: entryIds }),
  getDeployments: (id) => axios.get(`/global-api/global-dashboards/${id}/deployments`),
  removeDeployment: (id, deploymentId) => axios.delete(`/global-api/global-dashboards/${id}/deployments/${deploymentId}`),
  // Stream URLs are consumed directly via fetch() in DeploymentProgressModal.
  deployStreamUrl: (id) => `/global-api/global-dashboards/${id}/deployments/stream`,
  redeployStreamUrl: (id, deploymentId) => `/global-api/global-dashboards/${id}/deployments/${deploymentId}/redeploy-stream`,
};

Object.assign(ComposedDashboard, ComposedDashboardService);

export const OrganizationService = {
  list: () => axios.get("/global-api/organizations"),
};
