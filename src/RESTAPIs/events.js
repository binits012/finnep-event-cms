import apiHandler from "./helper";

export const addEvent = (data) => {
  apiHandler("POST", "event", true, false, data);
};
