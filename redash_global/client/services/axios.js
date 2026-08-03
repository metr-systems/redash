import axiosLib from "axios";
import qs from "query-string";

export const axios = axiosLib.create({
  baseURL: "/global-api",
  paramsSerializer: (params) => qs.stringify(params),
  xsrfCookieName: "csrf_token",
  xsrfHeaderName: "X-CSRF-TOKEN",
});

// Unwrap to the response body, mirroring the main app's instance so services
// resolve to data directly rather than the full axios response.
axios.interceptors.response.use((response) => response.data);
