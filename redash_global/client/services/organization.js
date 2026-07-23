import { axios } from "./axios";

const OrganizationService = {
  query: () => axios.get("organizations"),
};

export default OrganizationService;
