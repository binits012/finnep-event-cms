import apiHandler from "./helper";

export const addEvent = async (data) => {
  await apiHandler("POST", "event", true, false, data);
};

export const updateEvent = async (id, data) => {
  await apiHandler("PUT", `event/${id}`, true, false, data);
};

export const enableDisableEvent = async (id, data) => {
  return await apiHandler("PATCH", `event/${id}`, true, false, data);
}
