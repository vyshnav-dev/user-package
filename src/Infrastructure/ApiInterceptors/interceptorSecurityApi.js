import { SecurityBaseUrl } from "../../config/config";
import { securityApi } from "../../config/axios";
import {
  refreshToken,
  getAccessToken as storeGetAccessToken,
} from "./tokenUtils";
import { useAlert } from "../../commonComponent/Alerts/AlertContext";

let isRefreshing = false;
let failedQueue = [];
let navigateFunction = null;

export const setNavigate = (navigate) => {
  navigateFunction = navigate;
};

export const navigateTo = (path) => {
  if (navigateFunction) {
    navigateFunction(path);
  } else {
    console.warn("Navigate function not set. Cannot navigate to:", path);
  }
};

// Alert Global
export let showAlertGlobal = null;

export const setShowAlert = (showAlert) => {
  if (typeof showAlert === "function") {
    showAlertGlobal = showAlert;
  } else {
    console.warn("showAlert is not a function");
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const addRequestToQueue = (originalRequest) => {
  return new Promise((resolve, reject) => {
    failedQueue.push({
      resolve: (token) => {
        originalRequest.headers["Authorization"] = "Bearer " + token;
        resolve(securityApi(originalRequest));
      },
      reject: (err) => {
        reject(err);
      },
    });
  });
};

// ---------------- REQUEST INTERCEPTOR ----------------
securityApi.interceptors.request.use(
  (config) => {
    // ✅ Read from in-memory store first, fall back to localStorage
    const accessToken =
      storeGetAccessToken() || localStorage.getItem("TimeCaptureAccessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ---------------- RESPONSE INTERCEPTOR ----------------
securityApi.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 → try refreshing token
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const newToken = await refreshToken(SecurityBaseUrl);

          isRefreshing = false;
          securityApi.defaults.headers.common["Authorization"] =
            "Bearer " + newToken;

          processQueue(null, newToken);

          originalRequest._retry = true;
          originalRequest.headers["Authorization"] = "Bearer " + newToken;

          return securityApi(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          localStorage.removeItem("TimeCaptureAccessToken");
          localStorage.removeItem("TimeCaptureRefreshToken");
          localStorage.removeItem("TimeCaptureUserData");
          localStorage.removeItem("TimeCaptureSessionId");

          processQueue(refreshError, null);
          isRefreshing = false;

          navigateTo("/");

          return Promise.reject(refreshError);
        }
      } else {
        // Refresh already in progress — queue this request
        return addRequestToQueue(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ---------------- Custom hook ----------------
const baseSecurityApis = () => {
  const { showAlert, setLoader } = useAlert();

  // ✅ Prefer in-memory store, fall back to localStorage
  const accessToken =
    storeGetAccessToken() || localStorage.getItem("TimeCaptureAccessToken");

  const handleError = (error) => {
    if (!navigator.onLine) {
      const errorMessage = "No internet connection";
      showAlert("warning", errorMessage);
      return;
    }

    if (error.response && error.response.status) {
      switch (error.response.status) {
        case 400: {
          const result = error.response.data.result
            ? JSON.parse(error.response.data.result)
            : null;

          if (result && Array.isArray(result) && result[0]?.ErrorMessage) {
            showAlert("info", result[0]?.ErrorMessage);
          } else if (error?.response?.data?.statusCode == 4000) {
            showAlert("info", error?.response?.data?.message);
          } else if (
            error?.response?.data?.statusCode == 1000 ||
            error?.response?.data?.statusCode == 1001
          ) {
            showAlert("error", "Database Error");
          } else {
            showAlert("error", error?.response?.data?.message);
          }
          break;
        }

        case 401:
          // Handled by interceptor
          break;

        case 403:
          showAlert(
            "warning",
            "Access denied, you do not have permission"
          );
          break;

        case 404:
          if (error.response.statusText == "Not Found") {
            const dbNoData = error?.response?.data?.message;
            return;
          }
          break;

        case 409:
          showAlert("error", error?.response?.data?.message);
          break;

        case 500:
          if (error?.response?.data?.statusCode == 5000 && accessToken) {
            return;
          }
          break;

        default:
          break;
      }
    } else {
      console.error("An error occurred:", error.message);
    }
  };

  const makeAuthorizedRequestBaseSecurity = async (
    method,
    url,
    params,
    isLoading = true
  ) => {
    if (isLoading) {
      setLoader(true);
    }

    // ✅ Read token fresh at call time
    const token =
      storeGetAccessToken() || localStorage.getItem("TimeCaptureAccessToken");

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (params instanceof FormData) {
      delete headers["Content-Type"];
    } else {
      headers["Content-Type"] = "application/json";
    }

    try {
      let response;

      if (method === "get") {
        const queryParams = params
          ? Object.keys(params)
              .map(
                (key) =>
                  `${encodeURIComponent(key)}=${encodeURIComponent(
                    params[key]
                  )}`
              )
              .join("&")
          : "";
        const requestUrl = queryParams ? `${url}?${queryParams}` : url;

        response = await securityApi.get(requestUrl, { headers });
      } else {
        response = await securityApi({
          method: method,
          url: url,
          data: params,
          headers: headers,
        });
      }

      return response;
    } catch (error) {
      console.error(`Error in ${method.toUpperCase()} ${url}:`, error);
      handleError(error);
      throw error?.response?.data || error;
    } finally {
      if (isLoading) {
        setLoader(false);
      }
    }
  };

  return {
    makeAuthorizedRequestBaseSecurity,
  };
};

export { baseSecurityApis };