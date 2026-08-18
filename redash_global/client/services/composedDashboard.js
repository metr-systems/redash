import { axios } from "./axios";

const ComposedDashboardService = {
  query: (params) => axios.get("composed-dashboards", { params }),
  get: (id) => axios.get(`composed-dashboards/${id}`),
  create: (data) => axios.post("composed-dashboards", data),
  delete: (id) => axios.delete(`composed-dashboards/${id}`),
};

export default ComposedDashboardService;
