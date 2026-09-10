import { SecurityBaseUrl } from "../../config/config";
import { securityApi } from "../../config/axios";
import { refreshToken } from "./tokenUtils";
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

// Interceptor for API requests
securityApi.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("TimeCaptureAccessToken");
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

securityApi.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Handle refreshing token
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshToken(SecurityBaseUrl);
          
          isRefreshing = false;
          
          // Update default headers with new token
          securityApi.defaults.headers.common["Authorization"] = "Bearer " + newToken;
          
          // Process queued requests with new token
          processQueue(null, newToken);
          
          // Retry original request with new token
          originalRequest._retry = true;
          originalRequest.headers["Authorization"] = "Bearer " + newToken;
          
          return securityApi(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          
          // Clear tokens and process queue with error
          localStorage.removeItem("TimeCaptureAccessToken");
          localStorage.removeItem("TimeCaptureRefreshToken");
          localStorage.removeItem('TimeCaptureUserData');
          localStorage.removeItem("TimeCaptureSessionId");
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Navigate to login
          navigateTo("/");
          
          return Promise.reject(refreshError);
        }
      } else {
        // If refresh is already in progress, queue the request
        return addRequestToQueue(originalRequest);
      }
    }
    
    // For other errors, reject normally
    return Promise.reject(error);
  }
);

// Custom hook for API requests
const baseSecurityApis = () => {
  const { showAlert, setLoader } = useAlert();

  const accessToken = localStorage.getItem("TimeCaptureAccessToken");

  const handleError = (error) => {
    if (!navigator.onLine) {
      const errorMessage = "No internet connection";
      showAlert("warning", errorMessage);
      return;
    }
    
    const url = error?.response?.request?.responseURL;
    
    if (error.response && error.response.status) {
      switch (error.response.status) {
        case 400: // Bad request
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
            const dbErrorMessage = "Database Error";
            showAlert("error", dbErrorMessage);
          } else {
            showAlert("error", error?.response?.data?.message);
          }
          break;
          
        case 401: // Unauthorized
          // Handled by interceptor
          break;
          
        case 403: // Forbidden
          const authorizationErrors = "Access denied, you do not have permission";
          showAlert("warning", authorizationErrors);
          break;
          
        case 404: // Not Found
          if (error.response.statusText == "Not Found") {
            const dbNoData = error?.response?.data?.message;
            return;
          }
          break;
          
        case 409: // Conflict
          showAlert("error", error?.response?.data?.message);
          break;
          
        case 500: // Server Error
          const errorMessage = "Server error, please try again later";
          if (error?.response?.data?.statusCode == 5000 && accessToken) {
            return;
          }
          break;
          
        default:
          break;
      }
    } else {
      console.error('An error occurred:', error.message);
    }
  };

  const makeAuthorizedRequestBaseSecurity = async (method, url, params, isLoading = true) => {
    if (isLoading) {
      setLoader(true);
    }
    
    const token = localStorage.getItem("TimeCaptureAccessToken");
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Handle Content-Type for FormData
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
              .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
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