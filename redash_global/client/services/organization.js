import { axios } from "./axios";

const Organization = {
  query: () => axios.get("organizations"),
};

export default Organization;
