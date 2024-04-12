import apiHandler from "./helper";
const dashboard = async() =>{
    await apiHandler("GET", "dashboard", true, false, data);
}
export {
    dashboard
 }