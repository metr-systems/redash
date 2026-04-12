import { axios } from "@/services/axios";

export function GlobalDashboard(dashboard) {
  Object.assign(this, dashboard);
}

const GlobalDashboardService = {
  query: (params) => axios.get("/global-api/template-dashboards", { params }),
};

Object.assign(GlobalDashboard, GlobalDashboardService);
