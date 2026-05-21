import apiHandler from "./helper";

export const getAuditLogs = async (params = {}) => {
  return apiHandler("GET", "admin/audit", true, false, undefined, params);
};

export default {
  getAuditLogs
};
