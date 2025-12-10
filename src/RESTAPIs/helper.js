import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeader = (auth, form) => {
  // Note: Accept-Encoding header is automatically set by the browser
  // Browsers send "Accept-Encoding: gzip, deflate, br" by default
  // We don't need to (and can't) set it manually due to browser security
  let header = {};

  if (auth) {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        header = {
          ...header,
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (e) {
      // Restoring token failed
    }
  }
  if (!form) {
    header = {
      ...header,
      "Content-Type": "application/json",
    };
  } else {
    header = {
      ...header,
      "Content-Type": "multipart/form-data",
      Accept: "multipart/form-data",
    };
  }

  return header;
};

/**
 * Create Axios Request handler
 * @param requestType
 * @param url
 * @param auth
 * @param form
 * @param {object} data
 * @param params
 */
const apiHandler = (
  requestType,
  url,
  auth,
  form,
  data = undefined,
  params = undefined
) => {
  const headers = getHeader(auth, form);
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const originalRequest = error?.config;
      if (status === 401) {
        localStorage.setItem("auth", "");
        localStorage.setItem("accessToken", "");
        window.location.assign("/");
      } else {
        throw error;
      }
    }
  );

  // Ensure data is not null or undefined for PUT/POST requests
  const requestConfig = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    url,
    method: requestType,
    headers,
    params,
    decompress: true, // Automatically decompress gzip/deflate/brotli responses
  }

  // Only include data if it's defined and not null
  if (data !== undefined && data !== null) {
    requestConfig.data = data
  }

  return axios(requestConfig)
};

export default apiHandler;
