import apiHandler from "./helper";

export const getOutboundMailLogs = async (params = {}) => {
  return apiHandler("GET", "admin/outbound-mail-logs", true, false, undefined, params);
};

export default {
  getOutboundMailLogs,
};
