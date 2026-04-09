import { axios } from "@/services/axios";

export function GlobalDashboard(dashboard) {
  Object.assign(this, dashboard);
}

const GlobalDashboardService = {
  query: (params) => axios.get("/global-api/global-dashboards", { params }),
  create: (data) => axios.post("/global-api/global-dashboards", data),
};

Object.assign(GlobalDashboard, GlobalDashboardService);
