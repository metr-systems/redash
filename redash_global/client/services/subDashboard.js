import { axios } from "@/services/axios";

export function SubDashboard(dashboard) {
  Object.assign(this, dashboard);
}

const SubDashboardService = {
  query: (params) => axios.get("/global-api/dashboards", { params }),
  create: (data) => axios.post("/global-api/dashboards", data),
  get: (id) => axios.get(`/global-api/dashboards/${id}`),
  save: (id, data) => axios.post(`/global-api/dashboards/${id}`, data),
};

Object.assign(SubDashboard, SubDashboardService);
