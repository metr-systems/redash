import { axios } from "./axios";

const SubDashboardService = {
  query: (params) => axios.get("sub-dashboards", { params }),
  getAssignments: ({ id }) => axios.get(`sub-dashboards/${id}/assignments`),
  assign: ({ id, organizationId }) =>
    axios.post(`sub-dashboards/${id}/assignments`, { organization_id: organizationId }),
  removeAssignment: ({ id, assignmentId }) => axios.delete(`sub-dashboards/${id}/assignments/${assignmentId}`),
};

export default SubDashboardService;
