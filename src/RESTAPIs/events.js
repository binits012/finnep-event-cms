import apiHandler from "./helper";

export const addEvent = async (data) => {
  await apiHandler("POST", "event", true, false, data);
};

export const updateEvent = async (data, id) => {
  await apiHandler("PUT", `event/${id}`, true, false, data);
};
