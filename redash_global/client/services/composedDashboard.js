import { axios } from "@/services/axios";

export function ComposedDashboard(dashboard) {
  Object.assign(this, dashboard);
}

const ComposedDashboardService = {
  query: (params) => axios.get("/global-api/global-dashboards", { params }),
  create: (data) => axios.post("/global-api/global-dashboards", data),
};

Object.assign(ComposedDashboard, ComposedDashboardService);
