import apiHandler from "./helper";

export const addEvent = async (data) => {
  await apiHandler("POST", "event", true, false, data);
};
