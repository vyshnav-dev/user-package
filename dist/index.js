'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');
var reactRouterDom = require('react-router-dom');
var axios = require('axios');
var material = require('@mui/material');
require('@mui/material/Alert');
var jsxRuntime = require('react/jsx-runtime');
var Breadcrumbs = require('@mui/material/Breadcrumbs');
var NavigateNextIcon = require('@mui/icons-material/NavigateNext');
var Box = require('@mui/material/Box');
var Table = require('@mui/material/Table');
var TableBody = require('@mui/material/TableBody');
var TableCell = require('@mui/material/TableCell');
var TableContainer = require('@mui/material/TableContainer');
var TableHead = require('@mui/material/TableHead');
var TableRow = require('@mui/material/TableRow');
var Paper = require('@mui/material/Paper');
var RefreshIcon = require('@mui/icons-material/Refresh');
var FirstPageIcon = require('@mui/icons-material/FirstPage');
var LastPageIcon = require('@mui/icons-material/LastPage');
var Pagination = require('@mui/material/Pagination');
var FitScreenIcon = require('@mui/icons-material/FitScreen');
var FullscreenIcon = require('@mui/icons-material/Fullscreen');
var ChevronRightIcon = require('@mui/icons-material/ChevronRight');
var AttachmentIcon = require('@mui/icons-material/Attachment');
var Dialog = require('@mui/material/Dialog');
var DialogContent = require('@mui/material/DialogContent');
var IconButton = require('@mui/material/IconButton');
var CloseIcon = require('@mui/icons-material/Close');
var ArrowBackIosIcon = require('@mui/icons-material/ArrowBackIos');
var ArrowForwardIosIcon = require('@mui/icons-material/ArrowForwardIos');
require('@mui/material/Typography');
var mdbReactUiKit = require('mdb-react-ui-kit');
var ExcelJS = require('exceljs');
var fileSaver = require('file-saver');
var system = require('@mui/system');
var ClearIcon = require('@mui/icons-material/Clear');
require('@mui/icons-material/AddCircle');
var CloudUploadIcon = require('@mui/icons-material/CloudUpload');
var DeleteIcon = require('@mui/icons-material/Delete');
var PersonIcon = require('@mui/icons-material/Person');
var BorderColorIcon = require('@mui/icons-material/BorderColor');
var CryptoJS = require('crypto-js');
var lodash = require('lodash');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var React__namespace = /*#__PURE__*/_interopNamespace(React);
var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);
var Breadcrumbs__default = /*#__PURE__*/_interopDefaultLegacy(Breadcrumbs);
var NavigateNextIcon__default = /*#__PURE__*/_interopDefaultLegacy(NavigateNextIcon);
var Box__default = /*#__PURE__*/_interopDefaultLegacy(Box);
var Table__default = /*#__PURE__*/_interopDefaultLegacy(Table);
var TableBody__default = /*#__PURE__*/_interopDefaultLegacy(TableBody);
var TableCell__default = /*#__PURE__*/_interopDefaultLegacy(TableCell);
var TableContainer__default = /*#__PURE__*/_interopDefaultLegacy(TableContainer);
var TableHead__default = /*#__PURE__*/_interopDefaultLegacy(TableHead);
var TableRow__default = /*#__PURE__*/_interopDefaultLegacy(TableRow);
var Paper__default = /*#__PURE__*/_interopDefaultLegacy(Paper);
var RefreshIcon__default = /*#__PURE__*/_interopDefaultLegacy(RefreshIcon);
var FirstPageIcon__default = /*#__PURE__*/_interopDefaultLegacy(FirstPageIcon);
var LastPageIcon__default = /*#__PURE__*/_interopDefaultLegacy(LastPageIcon);
var Pagination__default = /*#__PURE__*/_interopDefaultLegacy(Pagination);
var FitScreenIcon__default = /*#__PURE__*/_interopDefaultLegacy(FitScreenIcon);
var FullscreenIcon__default = /*#__PURE__*/_interopDefaultLegacy(FullscreenIcon);
var ChevronRightIcon__default = /*#__PURE__*/_interopDefaultLegacy(ChevronRightIcon);
var AttachmentIcon__default = /*#__PURE__*/_interopDefaultLegacy(AttachmentIcon);
var Dialog__default = /*#__PURE__*/_interopDefaultLegacy(Dialog);
var DialogContent__default = /*#__PURE__*/_interopDefaultLegacy(DialogContent);
var IconButton__default = /*#__PURE__*/_interopDefaultLegacy(IconButton);
var CloseIcon__default = /*#__PURE__*/_interopDefaultLegacy(CloseIcon);
var ArrowBackIosIcon__default = /*#__PURE__*/_interopDefaultLegacy(ArrowBackIosIcon);
var ArrowForwardIosIcon__default = /*#__PURE__*/_interopDefaultLegacy(ArrowForwardIosIcon);
var ExcelJS__default = /*#__PURE__*/_interopDefaultLegacy(ExcelJS);
var ClearIcon__default = /*#__PURE__*/_interopDefaultLegacy(ClearIcon);
var CloudUploadIcon__default = /*#__PURE__*/_interopDefaultLegacy(CloudUploadIcon);
var DeleteIcon__default = /*#__PURE__*/_interopDefaultLegacy(DeleteIcon);
var PersonIcon__default = /*#__PURE__*/_interopDefaultLegacy(PersonIcon);
var BorderColorIcon__default = /*#__PURE__*/_interopDefaultLegacy(BorderColorIcon);
var CryptoJS__default = /*#__PURE__*/_interopDefaultLegacy(CryptoJS);

let config = null;
let config1 = null;
let primaryColor = null;
let secondaryColor = null;
let thirdColor = null;
let selectedColor = null;
let profileDateFields = null;
let rowsPerSheet = null;
let SecurityBaseUrl = null;
let allowedExtensionsUser = null;
let transactionDateTimeFields = null;
let FixedValues = null;
const loadConfig = async () => {
  const response = await fetch('./config.json');
  config = await response.json();
  const response1 = await fetch('./masterDocType.json');
  config1 = await response1.json();
  primaryColor = config.primaryColor;
  secondaryColor = config.secondaryColor;
  thirdColor = config.thirdColor;
  selectedColor = config.selectedColor;
  config.backgroundColor;
  profileDateFields = config.profileDateFields;
  config.rowEvenColor;
  config.ChannelId;
  SecurityBaseUrl = config.SecurityBaseUrl;
  allowedExtensionsUser = config.allowedExtensionsUser;
  transactionDateTimeFields = config.transactionDateTimeFields;
  FixedValues = config1.FixedValues;
};

const securityApi = axios__default["default"].create({
  headers: {
    "Content-Type": "application/json"
  }
});

// A function to update the licence URL of the axios instance
const updateSecurityUrl = newBaseUrl => {
  securityApi.defaults.baseURL = newBaseUrl;
};

// Use these functions after your config has been loaded
loadConfig().then(() => {
  updateSecurityUrl(SecurityBaseUrl);
});

// src/tokenStore.js
// In-memory token store (source of truth for the current tab)

let _accessToken = null;
let _refreshToken = null;
let _onTokensRefreshed = null;
const setTokens = (access, refresh) => {
  _accessToken = access ?? null;
  _refreshToken = refresh ?? null;
};
const setOnTokensRefreshed = cb => {
  _onTokensRefreshed = typeof cb === "function" ? cb : null;
};
const getAccessToken$1 = () => _accessToken;
const getRefreshToken = () => _refreshToken;
const notifyTokensRefreshed = (access, refresh) => {
  setTokens(access, refresh);
  if (_onTokensRefreshed) _onTokensRefreshed(access, refresh);
};
const clearTokenStore = () => {
  _accessToken = null;
  _refreshToken = null;
};

let refreshInProgress = false;
let refreshPromise = null;
let broadcastChannel = null;
let leaderTabId = null;

// Initialize BroadcastChannel for tab communication
const initBroadcastChannel = () => {
  if (typeof BroadcastChannel !== "undefined" && !broadcastChannel) {
    broadcastChannel = new BroadcastChannel("auth_token_channel");
    broadcastChannel.onmessage = event => {
      const {
        type,
        data,
        tabId,
        timestamp
      } = event.data;
      const currentTabId = getTabId();

      // Ignore messages from self
      if (tabId === currentTabId) return;
      switch (type) {
        case "REFRESH_NEEDED":
          if (!leaderTabId) {
            becomeLeader(currentTabId);
          }
          break;
        case "LEADER_ELECTION":
          if (!leaderTabId || timestamp && timestamp < getLeadershipTimestamp()) {
            leaderTabId = tabId;
            localStorage.setItem("auth_leader_tab", tabId);
            localStorage.setItem("auth_leader_timestamp", timestamp || Date.now());
          }
          break;
        case "TOKEN_REFRESH_STARTED":
          leaderTabId = tabId;
          refreshInProgress = true;
          break;
        case "TOKEN_REFRESH_COMPLETED":
          if (data.accessToken && data.refreshToken) {
            // Update in-memory store + localStorage (for cross-tab) + notify host
            notifyTokensRefreshed(data.accessToken, data.refreshToken);
            localStorage.setItem("TimeCaptureAccessToken", data.accessToken);
            localStorage.setItem("TimeCaptureRefreshToken", data.refreshToken);

            // Resolve any pending refresh promise in this tab
            if (refreshPromise && typeof refreshPromise.resolve === "function") {
              refreshPromise.resolve(data.accessToken);
            }
          }
          refreshInProgress = false;
          refreshPromise = null;
          leaderTabId = null;
          localStorage.removeItem("auth_leader_tab");
          break;
        case "TOKEN_REFRESH_FAILED":
          refreshInProgress = false;
          refreshPromise = null;
          leaderTabId = null;
          localStorage.removeItem("auth_leader_tab");
          if (data?.shouldClearStorage) {
            clearAuthTokens();
          }
          break;
        case "LOGOUT":
          clearAuthTokens();
          break;
      }
    };
  }
};

/**
 * Become the leader tab for token refresh
 */
const becomeLeader = tabId => {
  leaderTabId = tabId;
  localStorage.setItem("auth_leader_tab", tabId);
  localStorage.setItem("auth_leader_timestamp", Date.now().toString());
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "LEADER_ELECTION",
      tabId: tabId,
      timestamp: Date.now()
    });
  }
};

/**
 * Get leadership timestamp from localStorage
 */
const getLeadershipTimestamp = () => {
  const timestamp = localStorage.getItem("auth_leader_timestamp");
  return timestamp ? parseInt(timestamp, 10) : Infinity;
};

/**
 * Generate a unique tab ID
 */
const getTabId = () => {
  if (!sessionStorage.tabId) {
    sessionStorage.tabId = Math.random().toString(36).substring(2) + Date.now();
  }
  return sessionStorage.tabId;
};

/**
 * Common function to refresh access token
 * @param {string} baseUrl - The base URL for the refresh token endpoint
 * @param {boolean} isRetry - Whether this is a retry attempt
 * @returns {Promise<string>} - Promise that resolves with the new access token
 */
const refreshToken = async (baseUrl, isRetry = false) => {
  initBroadcastChannel();
  const currentTabId = getTabId();
  const storedLeader = localStorage.getItem("auth_leader_tab");
  const leaderTimestamp = getLeadershipTimestamp();
  const leaderAge = Date.now() - leaderTimestamp;

  // If there's a valid leader (less than 10 seconds old), wait for it
  if (storedLeader && storedLeader !== currentTabId && leaderAge < 10000) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const newAccessToken = getAccessToken$1() || localStorage.getItem("TimeCaptureAccessToken");
        if (newAccessToken) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(newAccessToken);
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        becomeLeader(currentTabId);
        executeRefresh(baseUrl, isRetry, currentTabId).then(resolve).catch(reject);
      }, 5000);
    });
  }

  // If refresh is already in progress in this tab, wait for it
  if (refreshInProgress && refreshPromise) {
    try {
      return await refreshPromise;
    } catch (error) {
      refreshInProgress = false;
      refreshPromise = null;
    }
  }

  // Become leader if no leader exists
  if (!storedLeader || storedLeader === currentTabId || leaderAge >= 10000) {
    becomeLeader(currentTabId);
  }

  // Broadcast that refresh is needed
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "REFRESH_NEEDED",
      tabId: currentTabId,
      timestamp: Date.now()
    });
  }
  return executeRefresh(baseUrl, isRetry, currentTabId);
};

/**
 * Execute the actual token refresh
 */
const executeRefresh = async (baseUrl, isRetry, tabId) => {
  refreshInProgress = true;
  let externalResolve, externalReject;
  refreshPromise = new Promise((resolve, reject) => {
    externalResolve = resolve;
    externalReject = reject;
  });
  refreshPromise.resolve = externalResolve;
  refreshPromise.reject = externalReject;
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "TOKEN_REFRESH_STARTED",
      tabId: tabId,
      timestamp: Date.now()
    });
  }
  (async () => {
    let refreshTokenValue;
    try {
      // ✅ Read from in-memory store first, then fall back to localStorage
      refreshTokenValue = getRefreshToken() || localStorage.getItem("TimeCaptureRefreshToken");
      if (!refreshTokenValue) {
        console.error(`[Tab ${tabId}] No refresh token found`);
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: "TOKEN_REFRESH_FAILED",
            tabId: tabId,
            reason: "NO_REFRESH_TOKEN",
            shouldClearStorage: false
          });
        }
        externalReject(new Error("No refresh token found"));
        return;
      }
      const response = await axios__default["default"].get(`${baseUrl}login/regeneratetokens?refreshToken=${refreshTokenValue}`, {
        timeout: 30000
      });
      const myObject = response?.data?.result;
      if (!myObject?.accessToken || !myObject?.refreshToken) {
        throw new Error("Invalid token response");
      }
      let parsedAccessToken, parsedRefreshToken;
      try {
        parsedAccessToken = JSON.parse(myObject.accessToken);
        parsedRefreshToken = JSON.parse(myObject.refreshToken);
      } catch (parseError) {
        throw new Error("Failed to parse tokens");
      }

      // ✅ Update in-memory store + notify host app + keep localStorage for cross-tab
      notifyTokensRefreshed(parsedAccessToken, parsedRefreshToken);
      localStorage.setItem("TimeCaptureAccessToken", parsedAccessToken);
      localStorage.setItem("TimeCaptureRefreshToken", parsedRefreshToken);
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: "TOKEN_REFRESH_COMPLETED",
          tabId: tabId,
          data: {
            accessToken: parsedAccessToken,
            refreshToken: parsedRefreshToken
          }
        });
      }
      externalResolve(parsedAccessToken);
    } catch (error) {
      console.error(`[Tab ${tabId}] Error during token refresh:`, error);
      const isTokenAlreadyUsed = error?.response?.status === 400;
      const currentRefreshToken = getRefreshToken() || localStorage.getItem("TimeCaptureRefreshToken");
      const refreshTokenChanged = refreshTokenValue && refreshTokenValue !== currentRefreshToken;
      if (isTokenAlreadyUsed && refreshTokenChanged) {
        const newAccessToken = getAccessToken$1() || localStorage.getItem("TimeCaptureAccessToken");
        if (newAccessToken) {
          externalResolve(newAccessToken);
          return;
        }
      }
      const shouldClearStorage = error?.response?.status !== 400;
      if (shouldClearStorage) {
        clearAuthTokens();
      }
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: "TOKEN_REFRESH_FAILED",
          tabId: tabId,
          reason: error.message,
          shouldClearStorage: shouldClearStorage
        });
      }
      externalReject(error);
    } finally {
      refreshInProgress = false;
      refreshPromise = null;
      leaderTabId = null;
      localStorage.removeItem("auth_leader_tab");
      localStorage.removeItem("auth_leader_timestamp");
    }
  })();
  return refreshPromise;
};

/**
 * Reset token refresh state
 */
const resetTokenRefresh = () => {
  refreshInProgress = false;
  refreshPromise = null;
  leaderTabId = null;
  localStorage.removeItem("auth_leader_tab");
  localStorage.removeItem("auth_leader_timestamp");
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "LOGOUT",
      tabId: getTabId()
    });
  }
};

/**
 * Get current access token — prefers in-memory store, falls back to localStorage
 */
const getAccessToken = () => {
  return getAccessToken$1() || localStorage.getItem("TimeCaptureAccessToken");
};

/**
 * Clear all authentication tokens
 */
const clearAuthTokens = () => {
  clearTokenStore();
  localStorage.removeItem("TimeCaptureAccessToken");
  localStorage.removeItem("TimeCaptureRefreshToken");
  localStorage.removeItem("TimeCaptureUserData");
  localStorage.removeItem("TimeCaptureSessionId");
  resetTokenRefresh();
};

// Clean up on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (broadcastChannel) {
      broadcastChannel.close();
    }
  });
  window.addEventListener("load", () => {
    const storedLeader = localStorage.getItem("auth_leader_tab");
    const leaderTimestamp = getLeadershipTimestamp();
    if (storedLeader && Date.now() - leaderTimestamp > 10000) {
      localStorage.removeItem("auth_leader_tab");
      localStorage.removeItem("auth_leader_timestamp");
    }
  });
}

const AlertContext = /*#__PURE__*/React.createContext();
const useAlert = () => {
  return React.useContext(AlertContext);
};

let isRefreshing = false;
let failedQueue = [];
const navigateTo = path => {
  {
    console.warn("Navigate function not set. Cannot navigate to:", path);
  }
};
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
const addRequestToQueue = originalRequest => {
  return new Promise((resolve, reject) => {
    failedQueue.push({
      resolve: token => {
        originalRequest.headers["Authorization"] = "Bearer " + token;
        resolve(securityApi(originalRequest));
      },
      reject: err => {
        reject(err);
      }
    });
  });
};

// ---------------- REQUEST INTERCEPTOR ----------------
securityApi.interceptors.request.use(config => {
  // ✅ Read from in-memory store first, fall back to localStorage
  const accessToken = getAccessToken() || localStorage.getItem("TimeCaptureAccessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// ---------------- RESPONSE INTERCEPTOR ----------------
securityApi.interceptors.response.use(response => {
  return response.data;
}, async error => {
  const originalRequest = error.config;

  // 401 → try refreshing token
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshToken(SecurityBaseUrl);
        isRefreshing = false;
        securityApi.defaults.headers.common["Authorization"] = "Bearer " + newToken;
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
});

// ---------------- Custom hook ----------------
const baseSecurityApis = () => {
  const {
    showAlert,
    setLoader
  } = useAlert();

  // ✅ Prefer in-memory store, fall back to localStorage
  const accessToken = getAccessToken() || localStorage.getItem("TimeCaptureAccessToken");
  const handleError = error => {
    if (!navigator.onLine) {
      const errorMessage = "No internet connection";
      showAlert("warning", errorMessage);
      return;
    }
    if (error.response && error.response.status) {
      switch (error.response.status) {
        case 400:
          {
            const result = error.response.data.result ? JSON.parse(error.response.data.result) : null;
            if (result && Array.isArray(result) && result[0]?.ErrorMessage) {
              showAlert("info", result[0]?.ErrorMessage);
            } else if (error?.response?.data?.statusCode == 4000) {
              showAlert("info", error?.response?.data?.message);
            } else if (error?.response?.data?.statusCode == 1000 || error?.response?.data?.statusCode == 1001) {
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
          showAlert("warning", "Access denied, you do not have permission");
          break;
        case 404:
          if (error.response.statusText == "Not Found") {
            error?.response?.data?.message;
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
      }
    } else {
      console.error("An error occurred:", error.message);
    }
  };
  const makeAuthorizedRequestBaseSecurity = async (method, url, params, isLoading = true) => {
    if (isLoading) {
      setLoader(true);
    }

    // ✅ Read token fresh at call time
    const token = getAccessToken() || localStorage.getItem("TimeCaptureAccessToken");
    const headers = {
      Authorization: `Bearer ${token}`
    };
    if (params instanceof FormData) {
      delete headers["Content-Type"];
    } else {
      headers["Content-Type"] = "application/json";
    }
    try {
      let response;
      if (method === "get") {
        const queryParams = params ? Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join("&") : "";
        const requestUrl = queryParams ? `${url}?${queryParams}` : url;
        response = await securityApi.get(requestUrl, {
          headers
        });
      } else {
        response = await securityApi({
          method: method,
          url: url,
          data: params,
          headers: headers
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
    makeAuthorizedRequestBaseSecurity
  };
};

const securityApis = () => {
  const {
    makeAuthorizedRequestBaseSecurity
  } = baseSecurityApis();
  const GetTagList = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "tag/gettaglist", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getuseractionsforscreen = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "user/getuseraction", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getSecuritysummary = async (payload, url) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", url, payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const deleteuser = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("delete", "user/deleteuser", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getuserdetails = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "user/GetUserDetails", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const gettimezonelist = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "timezone/gettimezonelist", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getroleslist = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "role/getrolelist", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const upsertuser = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "user/upsertuser", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getroledetails = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "/role/getroledetails", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getscreensforuser = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "user/getuserscreens", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const checkuserexistence = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "user/checkuserexistence", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const checkrolenameexistence = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "role/checkrolenameexistence", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const deleterole = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("delete", `role/deleterole`, payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getactions = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "role/getactionlist", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const upsertrole = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "role/UpsertRole", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const uploaduserfile = async (id, payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", `user/uploaduserfile?id=${id}`, payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const deleteuserfile = async (id, payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("delete", `user/deleteuserfile?id=${id}&fileName=${payload}`, payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updatepassword = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", `user/updatepassword`, payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updateuserpassword = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", `user/updateuserpassword`, payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const Auth_Logout = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "/login/logout", {}, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const GetDocTypeList = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "/Settings/GetDocTypeList", payload, false);
      return response;
    } catch (error) {
      return error;
    }
  };

  //#region role
  const getpasswordpolicy = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "/passwordpolicy/getpasswordpolicylist", payload);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getroleScreens = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "role/getscreens", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getRoleSummary = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "/role/getrolesummary", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getDeleteRole = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("delete", "/role/deleterole", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  //#region user department allocation

  const getuserdepartmentdetails = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "/user/getuserdepartmentdetails", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const upsertuserdepartment = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "/user/upsertuserdepartment", payload, true);
      return response;
    } catch (error) {
      // console.error(error);
      throw error;
    }
  };

  // ----- user list ----------

  const getuserlist = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "/user/getuserlist", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const insertusersessionhistory = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", `/login/insertusersessionhistory?be=${payload?.be}`, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updateusersessionhistory = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "/login/updateusersessionhistory", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const upsertpasswordpolicy = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "passwordpolicy/upsertpasswordpolicy", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const deletepasswordpolicy = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("delete", "passwordpolicy/deletepasswordpolicy", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getpasswordpolicydetails = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "passwordpolicy/getpasswordpolicydetails", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const checkpasswordpolicyexistence = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "passwordpolicy/checkpasswordpolicyexistence", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getpasswordpolicylist = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "passwordpolicy/getpasswordpolicylist", {}, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getpasswordpolicyregexbyuser = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "passwordpolicy/getpasswordpolicyregexbyuser", {}, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getpasswordpolicyregex = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "passwordpolicy/getpasswordpolicyregex", payload, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getuserpasswordpolicy = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("get", "passwordpolicy/getuserpasswordpolicy", {}, false);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const forcelogoutusers = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "login/forcelogout", payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  const syncmaster = async payload => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", `login/syncmaster?be=${payload?.be}`, payload, true);
      return response;
    } catch (error) {
      throw error;
    }
  };
  return {
    getuseractionsforscreen,
    getSecuritysummary,
    deleteuser,
    getuserdetails,
    gettimezonelist,
    getroleslist,
    upsertuser,
    getroledetails,
    getscreensforuser,
    checkuserexistence,
    checkrolenameexistence,
    deleterole,
    getactions,
    upsertrole,
    uploaduserfile,
    deleteuserfile,
    updatepassword,
    Auth_Logout,
    GetDocTypeList,
    updateuserpassword,
    getpasswordpolicy,
    getDeleteRole,
    getRoleSummary,
    getroleScreens,
    getuserdepartmentdetails,
    upsertuserdepartment,
    getuserlist,
    updateusersessionhistory,
    insertusersessionhistory,
    getpasswordpolicydetails,
    upsertpasswordpolicy,
    deletepasswordpolicy,
    checkpasswordpolicyexistence,
    getpasswordpolicylist,
    getpasswordpolicyregexbyuser,
    getpasswordpolicyregex,
    getuserpasswordpolicy,
    forcelogoutusers,
    syncmaster,
    GetTagList
  };
};

function TableButton({
  label,
  action,
  disabled = false
}) {
  const buttonStyle = {
    backgroundColor: thirdColor,
    color: "white",
    textTransform: "none",
    fontSize: '11px',
    padding: "10px",
    margin: .5,
    height: "25px",
    minWidth: "30px",
    "&:hover": {
      backgroundColor: thirdColor,
      opacity: 0.9
    },
    "&:disabled": {
      backgroundColor: "#cccccc",
      color: "#666666"
    }
  };
  return /*#__PURE__*/jsxRuntime.jsx(material.Button, {
    onClick: action,
    sx: buttonStyle,
    variant: "contained",
    disabled: disabled,
    children: label
  });
}

function ImagePreview({
  open,
  items,
  initialIndex = 0,
  onClose
}) {
  const [currentIndex, setCurrentIndex] = React__default["default"].useState(initialIndex);
  React__default["default"].useEffect(() => {
    if (open) setCurrentIndex(initialIndex || 0);
  }, [open, initialIndex]);
  if (!items || items.length === 0) return null;
  const handlePrev = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : items.length - 1);
  };
  const handleNext = () => {
    setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : 0);
  };
  return /*#__PURE__*/jsxRuntime.jsxs(Dialog__default["default"], {
    open: open,
    onClose: onClose,
    maxWidth: "md",
    PaperProps: {
      sx: {
        background: "#fff",
        borderRadius: 2,
        minHeight: 400,
        minWidth: 350,
        maxWidth: 700
      }
    },
    children: [/*#__PURE__*/jsxRuntime.jsx(Box__default["default"], {
      sx: {
        display: "flex",
        justifyContent: "flex-end",
        p: 1
      },
      children: /*#__PURE__*/jsxRuntime.jsx(IconButton__default["default"], {
        onClick: onClose,
        children: /*#__PURE__*/jsxRuntime.jsx(CloseIcon__default["default"], {})
      })
    }), /*#__PURE__*/jsxRuntime.jsxs(DialogContent__default["default"], {
      sx: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        minWidth: 320,
        minHeight: 350,
        background: "#f9f9f9"
      },
      children: [/*#__PURE__*/jsxRuntime.jsx(IconButton__default["default"], {
        onClick: handlePrev,
        disabled: items.length <= 1,
        sx: {
          mx: 1
        },
        children: /*#__PURE__*/jsxRuntime.jsx(ArrowBackIosIcon__default["default"], {})
      }), /*#__PURE__*/jsxRuntime.jsx(Box__default["default"], {
        sx: {
          maxWidth: 480,
          maxHeight: 350,
          width: "100%",
          height: "100%",
          textAlign: "center",
          position: "relative"
        },
        children: /*#__PURE__*/jsxRuntime.jsx("img", {
          src: items[currentIndex]?.url,
          alt: items[currentIndex]?.name || `Preview ${currentIndex + 1}`,
          style: {
            maxWidth: "100%",
            maxHeight: "320px",
            objectFit: "contain",
            borderRadius: 6,
            background: "#fff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.1)"
          }
        })
      }), /*#__PURE__*/jsxRuntime.jsx(IconButton__default["default"], {
        onClick: handleNext,
        disabled: items.length <= 1,
        sx: {
          mx: 1
        },
        children: /*#__PURE__*/jsxRuntime.jsx(ArrowForwardIosIcon__default["default"], {})
      })]
    }), /*#__PURE__*/jsxRuntime.jsxs(Box__default["default"], {
      sx: {
        textAlign: "center",
        p: 1,
        fontSize: 13,
        color: "#888"
      },
      children: [currentIndex + 1, " / ", items.length]
    })]
  });
}

function NormalButton({
  label,
  action,
  disabled = false,
  color
}) {
  const buttonStyle = {
    backgroundColor: color ? color : thirdColor,
    color: "white",
    fontSize: '12px',
    textTransform: "none",
    padding: "15px",
    height: "30px",
    minWidth: "30px",
    "&:hover": {
      backgroundColor: color ? color : thirdColor,
      opacity: 0.9
    },
    "&:disabled": {
      backgroundColor: "#cccccc",
      color: "#666666"
    }
  };
  return /*#__PURE__*/jsxRuntime.jsx(material.Button, {
    onClick: action,
    sx: buttonStyle,
    variant: "contained",
    disabled: disabled,
    children: label
  });
}

const AutoSelectNoHeader = ({
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  required,
  disabled,
  languageName,
  width = 250,
  ColumnSpan = 0,
  Menu = [],
  tableField = false,
  needHeader = true,
  onManualChange
}) => {
  const [searchkey, setsearchkey] = React.useState("");
  const [autoCompleteKey, setAutoCompleteKey] = React.useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = React.useState(false);
  const direction = "ltr";
  const focusedRef = React.useRef(false); // Use ref to track focus state
  const highlightRef = React.useRef(false); // Separate ref to track component focus state

  // Effect to set the formDataName based on formDataiId
  React.useEffect(() => {
    if (formData[formDataiId]) {
      // Find the corresponding Name from Menu using formDataiId
      const selectedOption = Menu.find(item => item.Id === formData[formDataiId]);

      // Set the formDataName if the selected option is found
      if (selectedOption) {
        setFormData({
          ...formData,
          [formDataName]: selectedOption.Name // Set the Name corresponding to the Id
        });
      }
    }
  }, [formData[formDataiId]]);
  const handleAutocompleteChange = (event, newValue) => {
    if (disabled) {
      return;
    }
    if (newValue && newValue.Id === formData[formDataiId] && newValue.Name === formData[formDataName]) {
      return;
    }
    const updatedFormData = {
      ...formData,
      [formDataName]: newValue ? newValue?.Name : "",
      [formDataiId]: newValue ? newValue?.Id : 0
    };
    setFormData(updatedFormData); // This will now update the parent's state
    if (onManualChange) {
      onManualChange(true);
    }
  };
  const handleBlur = () => {
    focusedRef.current = false; // Reset focus state when the component loses focus
    // Check for the existence in Menu or the existing formData value
    const existsInMenu = Menu.some(option => option.Name === searchkey);
    const existingFormValue = formData[formDataName] || "";
    if (!existsInMenu && searchkey !== existingFormValue) {
      setFormData({
        ...formData,
        [formDataName]: "",
        [formDataiId]: 0
      });
      setsearchkey("");
      setAutoCompleteKey(prevKey => prevKey + 1);
    }
  };
  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue);
  };
  const isLatinScript = text => {
    const latinRegex = /^[\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]*$/;
    return latinRegex.test(text); // Returns true if the text is Latin-based (including special chars)
  };
  const filterOptions = (options, {
    inputValue
  }) => {
    return options.filter(option => {
      const name = option?.Name || '';
      const code = option?.Code || '';

      // Use toLowerCase() only for Latin script inputs
      const normalizedInput = isLatinScript(inputValue) ? inputValue.toLowerCase() : inputValue;
      const normalizedName = isLatinScript(name) ? name.toLowerCase() : name;
      const normalizedCode = isLatinScript(code) ? code.toLowerCase() : code;
      return normalizedName.includes(normalizedInput) || normalizedCode && normalizedCode.includes(normalizedInput);
    });
  };
  const handleFocus = () => {
    setPopupClosedByEscape(false);
  };
  return /*#__PURE__*/jsxRuntime.jsx(material.Autocomplete, {
    autoHighlight: true,
    disabled: disabled,
    size: "small",
    PaperComponent: ({
      children
    }) => /*#__PURE__*/jsxRuntime.jsx(material.Paper, {
      style: {
        minWidth: "150px",
        maxWidth: "300px"
      },
      children: children
    }),
    sx: {
      width: width + ColumnSpan * 50
    }
    //freeSolo
    ,
    id: autoId,
    options: Menu,
    getOptionLabel: option => option?.Name || formData[formDataName] || "",
    inputValue: searchkey,
    value: formData[formDataName] ?? "",
    onChange: handleAutocompleteChange,
    onFocus: handleFocus
    //openOnFocus={true} // Automatically open dropdown on focus
    ,
    onBlur: handleBlur,
    filterOptions: filterOptions,
    disableClearable: !formData[formDataiId],
    onInputChange: handleInputChange,
    onHighlightChange: (event, option) => {
      if (option !== highlightRef.current) {
        highlightRef.current = option; // Update ref without re-rendering
      }
    },
    renderOption: (props, option) => /*#__PURE__*/React.createElement("li", {
      ...props,
      key: option.Id
    }, /*#__PURE__*/jsxRuntime.jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // Align items vertically for better layout
        width: "100%",
        gap: 1 // Add gap between Name and Code
      },
      children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
        style: {
          fontSize: "12px",
          flex: 1,
          textAlign: "left"
        },
        children: option?.Name
      }), /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
        style: {
          fontSize: "12px",
          flex: 1,
          textAlign: "right"
        },
        children: option?.Code
      })]
    })),
    renderInput: params => /*#__PURE__*/jsxRuntime.jsx(material.TextField, {
      required: required,
      label: label,
      ...params,
      disabled: disabled,
      inputProps: {
        ...params.inputProps,
        autoComplete: "off",
        // disable autocomplete and autofill
        // readOnly: !!formData[formDataiId],//newly added to avoid overflow when a selection and try to type after that
        style: {
          borderColor: "transparent",
          borderStyle: "solid",
          fontSize: "12px",
          height: "18px",
          padding: "0px 10px 0px 10px",
          margin: 0,
          color: "inherit"
        },
        inputProps: {
          style: {
            direction: direction  // Default to LTR if direction is not found
            // Default to inherit if fontFamily is not found
          }
        },
        onKeyDown: event => {
          if (event.key === "F2") {
            const updatedFormData = {
              ...formData,
              [formDataName]: "",
              [formDataiId]: 0
            };
            setFormData(updatedFormData);
            setsearchkey("");
            event.preventDefault();
          }
          if (event.key === "Escape") {
            setPopupClosedByEscape(true);
            highlightRef.current = null;
            return; // Allow the default behavior to close the popup
          }
          if (event.key === "Tab" && !popupClosedByEscape && !highlightRef.current && searchkey && Menu.length > 0) {
            const filteredOptions = filterOptions(Menu, {
              inputValue: searchkey
            });
            if (filteredOptions.length > 0) {
              highlightRef.current = filteredOptions[0];
            }
          }
          if (event.key === "Tab" || event.key === "Enter") {
            // Select the currently highlighted option
            if (highlightRef.current) {
              const newValue = highlightRef.current;
              if (newValue && newValue.Id === formData[formDataiId] && newValue.Name === formData[formDataName]) {
                return;
              }

              // Set the form data directly with the highlighted option
              setFormData({
                ...formData,
                [formDataName]: newValue?.Name,
                [formDataiId]: newValue?.Id
              });

              // Update the value directly
              setsearchkey(newValue?.Name || "");
            }
            highlightRef.current = null;
            if (onManualChange) {
              onManualChange(true);
            }
            setTimeout(() => {
              event.target.blur(); // Move focus to the next field
            }, 0);
            event.preventDefault();
          }
        }
      },
      InputLabelProps: {
        style: {
          fontSize: "14px",
          padding: "0 0px",
          zIndex: 1
        },
        sx: {
          textAlign: "left",
          right: "auto"
        }
      },
      sx: {
        paddingTop: tableField ? "0px" : "16px",
        minWidth: width + ColumnSpan * 50,
        // "@media (max-width: 360px)": {
        //   width: 220, // Reduced width for small screens
        // },
        "& .MuiOutlinedInput-input": {
          padding: "2px 2px ",
          transform: "translate(-1px, 0px) scale(1)",
          textAlign: "left"
        },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem"
        },
        "& .MuiInputLabel-outlined": {
          transform: "translate(14px, 22px) scale(0.85)"
        },
        "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
          // transform: "translate(14px, 7px) scale(0.75)",
          transform: "translate(14px, 7px) scale(0.75)",
          // Adjust label position when focused
          padding: "0px 2px",
          color: "inherit"
        },
        "& .MuiOutlinedInput-root": {
          paddingRight: "0px !important",
          // remove extra space
          "& .MuiAutocomplete-endAdornment": {
            right: 2 // bring icons closer
          },
          height: 30,
          // Adjust the height of the input area
          display: "flex",
          flexDirection: "row",
          // "& .MuiAutocomplete-endAdornment": {
          //   right: direction === "rtl" ? "auto" : 0, // Position icons on the left in RTL
          //   left: direction === "rtl" ? 0 : "auto", // Swap the position of the icons
          // },
          "& fieldset": {
            borderColor: `#ddd`,
            textAlign: "left"
          },
          "&:hover fieldset": {
            borderColor: "currentColor" // Keeps the border color on hover
          },
          "&.Mui-focused fieldset": {
            borderColor: "currentColor" // Keeps the current border color
          },
          "& legend": {
            width: "max-content" // Let legend adjust width in RTL
          },
          "& .MuiSvgIcon-root": {
            marginRight: 0,
            marginLeft: "auto" // Adjust icon spacing
          }
        },
        "& .MuiInputLabel-root": {
          color: "inherit",
          fontSize: "14px",
          transform: null // Adjust label position when not focused
        }
      }
    })
    //ListboxComponent={needHeader?CustomListBox:null}
  }, `${label}_${autoCompleteKey}`);
};

const iconsExtraSx = {
  fontSize: "0.8rem",
  padding: "0.5rem",
  "&:hover": {
    backgroundColor: "transparent"
  },
  marginRight: 1
};
const StatusMenu = [{
  "Id": 2,
  "Name": "Completed"
}];
function SummaryTable(props) {
  const {
    rows,
    totalPages,
    hardRefresh,
    IdName,
    handleLongPressStart,
    handleLongPressEnd,
    handleParentGroup,
    parentList,
    selectConvertRow,
    IsSignature = false,
    IsAttachments = false,
    totalRows,
    onStatusIconClick,
    // New callback function for status icon click
    StatusDropdown,
    statusDetails,
    setstatusDetails,
    UpdateStatus,
    userAction,
    handleConvert,
    screenId
  } = props;
  const [selected, setSelected] = React__namespace.useState([]);
  const [page, setPage] = React__namespace.useState(0);
  const [rowsPerPage, setRowsPerPage] = React__namespace.useState(25);
  const [searchTerm, setSearchTerm] = React__namespace.useState("");
  const [filteredRows, setFilteredRows] = React__namespace.useState([]);
  const [columns, setColumns] = React__namespace.useState([]);
  const [imageDialogOpen, setImageDialogOpen] = React__namespace.useState(false);
  const [previewItems, setPreviewItems] = React__namespace.useState([]);
  const [previewInitialIndex, setPreviewInitialIndex] = React__namespace.useState(0);
  const excludedFields = [IdName, "Group", "GroupId", "TotalRows", "IsConverted", "iOutlet", "Signature", "Attachments", "Salesman_Id"];
  const isConvert = userAction?.some(action => action.Action_Name == "Convert");

  // Helper function to format numbers
  const formatValue = value => {
    if (value === null || value === undefined) return ""; // Handle null or undefined values
    if (typeof value === "boolean") {
      return value ? "True" : "False"; // Convert boolean values to readable format
    }
    if (typeof value === "number") {
      const decimalPlaces = value.toString().split(".")[1]?.length;
      // Check if the value is a number
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(value);
    }
    return value; // Return the value as-is if not a number
  };
  const profileDateFieldsArray = profileDateFields.split(",").map(field => field.trim());
  // Create an array for date-time fields
  const transactionDateTimeFieldsArray = transactionDateTimeFields.split(",").map(field => field.trim());
  //To apply some filters on table rows
  const initialColumns = rows && rows.length > 0 ? Object.keys(rows[0]).filter(key => !excludedFields.includes(key)).map(key => ({
    id: key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2") // Only add space between lowercase and uppercase
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // Handle acronyms followed by lowercase
    .trim(),
    minWidth: 100,
    // Set default minWidth for all columns
    maxWidth: 200
  })) : [];
  React__namespace.useEffect(() => {
    setColumns(initialColumns);
  }, [rows]);

  //To expand column on mouse dragging
  const handleResize = (index, event) => {
    const startWidth = columns[index].minWidth;
    const startX = event.clientX;
    const handleMouseMove = e => {
      const currentX = e.clientX;
      const newWidth = Math.max(50, startWidth + (currentX - startX));
      setColumns(cols => cols.map((col, i) => i === index ? {
        ...col,
        minWidth: newWidth,
        maxWidth: newWidth
      } : col));
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  //To expand double Clicked column
  const handleDoubleClick = index => {
    setColumns(cols => cols.map((col, i) => i === index ? {
      ...col,
      maxWidth: col.maxWidth ? null : 200
    } : col));
  };
  // To reduce all columns width
  const handleFitContent = () => {
    setColumns(cols => cols.map(col => ({
      ...col,
      maxWidth: 100,
      minWidth: 100
    })));
  };

  //To expand all columns
  const handleExpandAll = () => {
    setColumns(cols => cols.map(col => ({
      ...col,
      maxWidth: null,
      minWidth: 150
    })));
  };

  //To Search
  const handleSearch = event => {
    setSearchTerm(event.target.value);
    setPage(0);
    props.onpageNumberChange(1);
    props.onSearchKeyChange(event.target.value);
  };
  const handleClick = (event, row) => {
    if (!row[IdName]) {
      return;
    }
    const selectedIndex = selected.indexOf(row[IdName]);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, row[IdName]); // Add the entire row object
    } else {
      newSelected = [...selected.slice(0, selectedIndex), ...selected.slice(selectedIndex + 1)];
    }
    setSelected(newSelected);
  };

  //To change page //remove event if Nan comes in pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    props.onpageNumberChange(newPage + 1);
  };

  //To change rows per page
  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
    props.onpageNumberChange(1);
    props.onDisplayLengthChange(parseInt(event.target.value));
  };
  const isSelected = id => selected.indexOf(id) !== -1;
  React__namespace.useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);
  React__namespace.useEffect(() => {
    setPage(0); // Reset page to 0
    props.onpageNumberChange(1); // Call the callback function with 0 if needed
    props.setchangesTriggered(false);
    setSelected([]);
    setSearchTerm("");
  }, [props.changesTriggered]);
  React__namespace.useEffect(() => {
    props.onSelectedRowsChange(selected);
  }, [selected]);

  //To convert date and time to dd/mm/yyyy format
  const convertToLocaleDateString = dateString => {
    if (!dateString) return ""; // Return an empty string for null or undefined values
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // If date is invalid, return the original string

    // Convert to local time
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, "0");
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = localDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Helper function to convert date-time strings (dd-mm-yyyy hh:mm:ss)
  const convertToLocaleDateTimeString = dateString => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const day = String(localDateTime.getDate()).padStart(2, "0");
    const month = String(localDateTime.getMonth() + 1).padStart(2, "0");
    const year = localDateTime.getFullYear();
    const hours = String(localDateTime.getHours()).padStart(2, "0");
    const minutes = String(localDateTime.getMinutes()).padStart(2, "0");
    const seconds = String(localDateTime.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  // Handler to open signature preview
  const handleSignaturePreview = signatureUrl => {
    setPreviewItems(signatureUrl ? [{
      url: signatureUrl,
      name: "Signature"
    }] : []);
    setPreviewInitialIndex(0);
    setImageDialogOpen(true);
  };

  // Handler to open attachments preview
  const handleAttachmentsPreview = attachmentsStr => {
    if (!attachmentsStr) return;
    const urls = attachmentsStr.split(",").map(u => u.trim()).filter(Boolean).map((url, i) => ({
      url,
      name: `Attachment ${i + 1}`
    }));
    setPreviewItems(urls);
    setPreviewInitialIndex(0);
    setImageDialogOpen(true);
  };
  return /*#__PURE__*/jsxRuntime.jsxs(Box__default["default"], {
    sx: {
      width: "98%",
      margin: "auto",
      marginTop: "5px",
      boxShadow: 3,
      paddingLeft: "10px",
      paddingRight: "10px",
      paddingBottom: "5px",
      backgroundColor: "#f3f3f3ff"
    },
    children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
      style: {
        display: "flex",
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap"
      },
      children: [/*#__PURE__*/jsxRuntime.jsxs("div", {
        style: {
          display: "flex",
          flexDirection: "row",
          width: "auto",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "8px",
          flexWrap: "wrap",
          gap: "4px"
        },
        children: [/*#__PURE__*/jsxRuntime.jsxs(material.FormControl, {
          children: [/*#__PURE__*/jsxRuntime.jsx(material.InputLabel, {
            htmlFor: "rows-per-page",
            sx: {
              "&.Mui-focused": {
                color: "currentColor" // Keeps the current color
              }
            },
            children: "Show Entries"
          }), /*#__PURE__*/jsxRuntime.jsxs(material.Select, {
            value: rowsPerPage,
            onChange: handleChangeRowsPerPage,
            label: "Rows per page",
            inputProps: {
              name: "rows-per-page",
              id: "rows-per-page"
            },
            sx: {
              width: "120px",
              height: "30px",
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "currentColor" // Keeps the current border color
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "currentColor" // Optional: Keeps the border color on hover
              }
            },
            children: [/*#__PURE__*/jsxRuntime.jsx(material.MenuItem, {
              value: 25,
              children: "25"
            }), /*#__PURE__*/jsxRuntime.jsx(material.MenuItem, {
              value: 50,
              children: "50"
            }), /*#__PURE__*/jsxRuntime.jsx(material.MenuItem, {
              value: 100,
              children: "100"
            })]
          })]
        }), StatusDropdown ? /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
          children: [/*#__PURE__*/jsxRuntime.jsx(Box__default["default"], {
            sx: {
              mt: -2
            },
            children: /*#__PURE__*/jsxRuntime.jsx(AutoSelectNoHeader, {
              formData: statusDetails,
              setFormData: setstatusDetails,
              autoId: "Status",
              formDataName: `Status_Name`,
              formDataiId: "Status",
              required: false,
              label: "Change Status",
              languageName: "english",
              ColumnSpan: 0,
              disabled: false,
              Menu: StatusMenu,
              width: 130
            }, "Status")
          }), /*#__PURE__*/jsxRuntime.jsx(NormalButton, {
            action: UpdateStatus,
            label: "Apply"
          })]
        }) : null]
      }), /*#__PURE__*/jsxRuntime.jsxs("div", {
        style: {
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
          title: "Refresh",
          children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
            onClick: hardRefresh,
            sx: iconsExtraSx,
            children: /*#__PURE__*/jsxRuntime.jsx(RefreshIcon__default["default"], {})
          })
        }), /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
          title: "Fit Content",
          children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
            onClick: handleFitContent,
            sx: iconsExtraSx,
            children: /*#__PURE__*/jsxRuntime.jsx(FitScreenIcon__default["default"], {})
          })
        }), /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
          title: "Expand All",
          children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
            onClick: handleExpandAll,
            sx: iconsExtraSx,
            children: /*#__PURE__*/jsxRuntime.jsx(FullscreenIcon__default["default"], {})
          })
        }), /*#__PURE__*/jsxRuntime.jsx(material.TextField, {
          margin: "normal",
          size: "small",
          id: "search",
          label: "Search",
          autoComplete: "off",
          value: searchTerm,
          onChange: handleSearch,
          sx: {
            width: 200,
            // Default width
            "@media (max-width: 600px)": {
              width: 150 // Reduced width for small screens
            },
            "& .MuiOutlinedInput-root": {
              height: 30,
              // Adjust the height of the input area
              "& fieldset": {
                borderColor: `${primaryColor}`
              },
              "&:hover fieldset": {
                borderColor: primaryColor
              },
              "&.Mui-focused fieldset": {
                borderColor: primaryColor
              }
            },
            "& .MuiInputLabel-root": {
              transform: "translate(10px, 5px) scale(0.9)",
              // Adjust label position when not focused
              color: primaryColor,
              "&.Mui-focused,&.MuiInputLabel-shrink": {
                transform: "translate(14px, -9px) scale(0.75)" // Adjust label position when focused or shrunken
              }
            },
            "& .MuiInputBase-input": {
              fontSize: "0.75rem",
              // Adjust the font size of the input text
              color: primaryColor
            },
            "& .MuiFormLabel-root.Mui-focused": {
              color: primaryColor
            }
          }
        })]
      })]
    }), /*#__PURE__*/jsxRuntime.jsx("div", {
      style: {
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        width: "100%",
        maxWidth: "100%",
        // Ensure it respects the container width
        overflowX: "auto",
        whiteSpace: "nowrap",
        scrollbarWidth: "thin"
      },
      children: parentList?.map((parent, index) => /*#__PURE__*/jsxRuntime.jsxs(React__namespace.Fragment, {
        children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
          variant: "body2",
          onClick: () => handleParentGroup(parent.Id),
          style: {
            cursor: "pointer"
            // You can style the text
          },
          children: parent.Name
        }), index < parentList.length - 1 && /*#__PURE__*/jsxRuntime.jsx(ChevronRightIcon__default["default"], {
          fontSize: "small"
        })]
      }, parent.Id))
    }), filteredRows && filteredRows.length > 0 ? /*#__PURE__*/jsxRuntime.jsx(Paper__default["default"], {
      sx: {
        width: "100%",
        mb: 1
      },
      children: /*#__PURE__*/jsxRuntime.jsx(TableContainer__default["default"], {
        sx: {
          maxHeight: "58vh",
          overflow: "auto",
          scrollbarWidth: "thin"
        },
        children: /*#__PURE__*/jsxRuntime.jsxs(Table__default["default"], {
          stickyHeader: true,
          sx: {
            minWidth: 750
          },
          children: [/*#__PURE__*/jsxRuntime.jsx(TableHead__default["default"], {
            children: /*#__PURE__*/jsxRuntime.jsxs(TableRow__default["default"], {
              sx: {
                position: "sticky",
                top: 0,
                zIndex: 10
              },
              children: [columns.map((column, index) => /*#__PURE__*/jsxRuntime.jsxs(TableCell__default["default"], {
                sx: {
                  padding: "0px",
                  paddingLeft: "4px",
                  border: `1px solid #ddd`,
                  fontWeight: "600",
                  font: "14px",
                  backgroundColor: thirdColor,
                  color: "white",
                  paddingTop: "3px",
                  paddingBottom: "3px",
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  position: "relative"
                },
                onDoubleClick: () => handleDoubleClick(index),
                children: [column.label, /*#__PURE__*/jsxRuntime.jsx("span", {
                  style: {
                    position: "absolute",
                    height: "100%",
                    right: 0,
                    top: 0,
                    width: "5px",
                    cursor: "col-resize",
                    backgroundColor: "rgba(0,0,0,0.1)"
                  },
                  onMouseDown: e => handleResize(index, e)
                })]
              }, column.id)), IsSignature && totalPages > 0 && /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                sx: {
                  padding: "0px",
                  paddingLeft: "4px",
                  border: `1px solid #ddd`,
                  fontWeight: "600",
                  font: "14px",
                  backgroundColor: secondaryColor,
                  color: "white",
                  paddingTop: "3px",
                  paddingBottom: "3px",
                  minWidth: 120
                },
                children: "Signature"
              }, "signature-header"), IsAttachments && totalPages > 0 && /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                sx: {
                  padding: "0px",
                  paddingLeft: "4px",
                  border: `1px solid #ddd`,
                  fontWeight: "600",
                  font: "14px",
                  backgroundColor: secondaryColor,
                  color: "white",
                  paddingTop: "3px",
                  paddingBottom: "3px",
                  minWidth: 120
                },
                children: "Attachments"
              }, "attachments-header"), isConvert && [21, 22].includes(Number(screenId)) && /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                sx: {
                  padding: "3px 4px",
                  border: "1px solid #ddd",
                  fontWeight: 600,
                  fontSize: "14px",
                  backgroundColor: thirdColor,
                  color: "white",
                  minWidth: 120,
                  textAlign: "center"
                },
                children: "Action"
              }, "Action-header")]
            })
          }), /*#__PURE__*/jsxRuntime.jsx(TableBody__default["default"], {
            children: filteredRows.map((row, index) => {
              const isItemSelected = isSelected(row[IdName]);
              return /*#__PURE__*/jsxRuntime.jsxs(TableRow__default["default"], {
                onMouseUp: handleLongPressEnd,
                onMouseLeave: handleLongPressEnd // In case the user drags out of the row
                ,
                onTouchStart: event => handleLongPressStart(event, row) // For mobile
                ,
                onTouchEnd: handleLongPressEnd,
                role: "checkbox",
                "aria-checked": isItemSelected
                //onDoubleClick={() => props.onRowDoubleClick(row[IdName])}
                ,
                tabIndex: -1,
                sx: {
                  cursor: "pointer",
                  backgroundColor: isItemSelected ? selectedColor : index % 2 === 1 ? secondaryColor : null
                },
                children: [columns.map(column => /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
                  title: column.id === "Narration" ? row[column.id] : null,
                  children: /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                    sx: {
                      padding: "0px",
                      paddingLeft: "4px",
                      border: `1px solid #ddd`,
                      minWidth: column.minWidth,
                      maxWidth: column.maxWidth,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: row["Group"] ? 800 : null,
                      textAlign: column.id.toLowerCase() == "status" ? "center" : typeof row[column.id] === "number" ? "right" : "left" // Align numbers to the right
                    },
                    onDoubleClick: () => props.onRowDoubleClick && props.onRowDoubleClick(row[IdName]),
                    onClick: event => handleClick(event, row),
                    children: profileDateFieldsArray.includes(column.label) ? convertToLocaleDateString(row[column.id]) : transactionDateTimeFieldsArray.includes(column.label) ? convertToLocaleDateTimeString(row[column.id]) : formatValue(row[column.id])
                  }, column.id)
                }, column.id)), IsSignature && totalPages > 0 && /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                  sx: {
                    padding: "0px",
                    textAlign: "center",
                    border: `1px solid #ddd`,
                    minWidth: "100px"
                  },
                  children: row.Signature ? /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
                    title: "View Signature",
                    children: /*#__PURE__*/jsxRuntime.jsx("img", {
                      src: row?.Signature ?? "",
                      alt: "",
                      style: {
                        cursor: 'pointer',
                        width: '20px',
                        height: '20px'
                      } // Adjust the style as needed
                      ,
                      onClick: e => {
                        e.stopPropagation();
                        handleSignaturePreview(row.Signature);
                      }
                    })
                  }) : ""
                }, `signature-${row[IdName]}`), IsAttachments && totalPages > 0 && /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                  sx: {
                    padding: "0px",
                    textAlign: "center",
                    border: `1px solid #ddd`,
                    minWidth: "100px"
                  },
                  children: !!row.Attachments ? /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
                    title: "View Attachments",
                    children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
                      onClick: e => {
                        e.stopPropagation();
                        handleAttachmentsPreview(row.Attachments);
                      },
                      sx: {
                        color: primaryColor,
                        width: "5px",
                        height: "5px"
                      },
                      children: /*#__PURE__*/jsxRuntime.jsx(AttachmentIcon__default["default"], {})
                    })
                  }) : ""
                }, `attachments-${row[IdName]}`), isConvert && row?.TransId > 0 && [21, 22].includes(Number(screenId)) && /*#__PURE__*/jsxRuntime.jsx(TableCell__default["default"], {
                  sx: {
                    padding: "0px",
                    paddingLeft: "4px",
                    border: "1px solid #ddd",
                    minWidth: "100px",
                    maxWidth: "auto",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontWeight: row["Group"] ? 800 : null,
                    textAlign: "center"
                  },
                  style: {
                    minWidth: "100px"
                  },
                  children: /*#__PURE__*/jsxRuntime.jsx(TableButton, {
                    disabled: row?.Status == "Draft" || row?.Status == "Converted",
                    action: () => handleConvert(row),
                    label: "Convert"
                  })
                })]
              }, `${row[IdName]}-${index}`);
            })
          })]
        })
      })
    }) : /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: /*#__PURE__*/jsxRuntime.jsx(Box__default["default"], {
        sx: {
          width: "100%",
          textAlign: "center",
          my: 4
        }
      })
    }), filteredRows && filteredRows.length > 0 && /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
      children: [/*#__PURE__*/jsxRuntime.jsxs(Box__default["default"], {
        sx: {
          width: "100%",
          textAlign: "right",
          fontSize: "0.85rem",
          color: "#333",
          mt: 1,
          mb: -1,
          pr: 2
        },
        children: ["Total Rows: ", /*#__PURE__*/jsxRuntime.jsx("b", {
          children: totalRows || rows?.[0]?.TotalRows || 0
        })]
      }), /*#__PURE__*/jsxRuntime.jsx(Pagination__default["default"], {
        count: rows.length > 0 ? totalPages : 0,
        page: page + 1 // Pagination component is 1-based, but state is 0-based
        ,
        onChange: (event, value) => handleChangePage(null, value - 1),
        variant: "outlined",
        shape: "rounded",
        showFirstButton: true,
        showLastButton: true,
        ActionsComponent: TablePaginationActions,
        sx: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "8px 0",
          // Reduced padding to decrease gap
          "& .MuiPagination-ul": {
            margin: 0
          },
          "& .MuiPaginationItem-root": {
            height: "24px",
            // Reduced height of pagination items
            minWidth: "24px" // Adjusted width of pagination items
          }
        }
      })]
    }), /*#__PURE__*/jsxRuntime.jsx(ImagePreview, {
      open: imageDialogOpen,
      items: previewItems,
      initialIndex: previewInitialIndex,
      onClose: () => {
        setImageDialogOpen(false);
        setPreviewInitialIndex(0);
        setPreviewItems([]);
      }
    })]
  });
}
const TablePaginationActions = props => {
  const {
    count,
    page,
    rowsPerPage,
    onPageChange
  } = props;

  // Calculate the last page index
  const lastPage = Math.ceil(count / rowsPerPage) - 1;

  // Generate page numbers: we want to show 2 pages on each side if possible
  const startPage = Math.max(0, page - 2); // Current page - 2, but not less than 0
  const endPage = Math.min(lastPage, page + 2); // Current page + 2, but not more than last page

  // Create an array of page numbers to be shown
  const pages = Array.from({
    length: endPage - startPage + 1
  }, (_, idx) => startPage + idx);
  const handlePageButtonClick = newPage => {
    onPageChange(newPage);
  };
  return /*#__PURE__*/jsxRuntime.jsxs("div", {
    style: {
      flexShrink: 0,
      marginLeft: 20
    },
    children: [page > 0 && /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
      onClick: () => handlePageButtonClick(0),
      children: /*#__PURE__*/jsxRuntime.jsx(FirstPageIcon__default["default"], {})
    }), pages.map(pageNum => /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
      sx: {
        minWidth: "30px",
        minHeight: "30px",
        padding: "2px",
        margin: "1px",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: "50%",
        // Make the background round
        color: "inherit",
        backgroundColor: pageNum === page ? "grey" : "white",
        "&:hover": {
          backgroundColor: pageNum === page ? "grey" : "lightgrey" // Change hover color
        },
        "&.Mui-disabled": {
          backgroundColor: "white"
        },
        fontSize: "14px"
      },
      color: pageNum === page ? "primary" : "default",
      onClick: () => handlePageButtonClick(pageNum),
      disabled: pageNum > lastPage,
      children: pageNum + 1
    }, pageNum)), page < lastPage && /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
      onClick: () => handlePageButtonClick(lastPage),
      children: /*#__PURE__*/jsxRuntime.jsx(LastPageIcon__default["default"], {})
    })]
  });
};

function ConfirmationAlert({
  handleClose,
  open,
  data,
  submite
}) {
  material.useTheme();
  return /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModal, {
      open: open,
      onClose: handleClose,
      tabIndex: "-1",
      centered: true,
      children: /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalDialog, {
        size: "sm",
        style: {
          marginTop: 100
        },
        children: /*#__PURE__*/jsxRuntime.jsxs(mdbReactUiKit.MDBModalContent, {
          children: [/*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalHeader, {
            className: `bg-${data?.type} text-white d-flex justify-content-center`,
            children: /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalTitle, {
              children: data?.message
            })
          }), /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalBody, {
            className: "d-flex justify-content-center align-items-center",
            children: /*#__PURE__*/jsxRuntime.jsxs(material.Typography, {
              sx: {
                textTransform: 'none'
              },
              m: 2,
              color: "grey",
              children: ["Do you want to ", data?.message]
            })
          }), /*#__PURE__*/jsxRuntime.jsxs(mdbReactUiKit.MDBModalFooter, {
            className: "d-flex justify-content-center",
            children: [/*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBBtn, {
              color: "secondary",
              onClick: handleClose,
              style: {
                textTransform: "none"
              },
              children: "Close"
            }), /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBBtn, {
              onClick: submite,
              color: data?.type,
              style: {
                textTransform: "none"
              },
              children: data?.message
            })]
          })]
        })
      })
    })
  });
}

const ExcelExport = async ({
  reportName,
  filteredRows,
  excludedFields,
  parameter
}) => {
  localStorage.getItem("utcOffset") || "+00:00";
  localStorage.getItem("EnableDate") || 0;
  const reportDateFieldsArray = profileDateFields.split(",").map(field => field.trim());
  const convertToLocaleDateString = dateString => {
    if (!dateString) return ""; // Return an empty string for null or undefined values
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // If date is invalid, return the original string

    // Convert to local time
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, "0");
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = localDate.getFullYear();
    return `${day}-${month}-${year}`;
  };

  //for local time in dd-mm-yyyy format
  const formatDate = dateString => {
    if (!dateString) return ""; // Return an empty string for null or undefined values
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // If date is invalid, return the original string

    // Convert to local time
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const day = String(localDate.getDate()).padStart(2, "0");
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = localDate.getFullYear();
    return `${day}-${month}-${year}`;
  };
  function columnIndexToLetter(columnIndex) {
    let columnLetter = '';
    while (columnIndex > 0) {
      let remainder = (columnIndex - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      columnIndex = parseInt((columnIndex - remainder) / 26, 10);
    }
    return columnLetter;
  }
  let sheet = null;
  let currentRowCount = 0;
  let sheetNumber = 0; // To increment sheet names if necessary

  // Create a new ExcelJS workbook
  const workbook = new ExcelJS__default["default"].Workbook();

  // Add a sheet for the data
  const createNewSheet = () => {
    sheetNumber++;
    sheet = workbook.addWorksheet(`${reportName} - ${sheetNumber}`);
    currentRowCount = 0; // Reset row count for the new sheet

    // Create headers with formatted labels
    const rawHeaders = Object.keys(filteredRows[0] || {}).filter(header => !excludedFields.includes(header));

    // Convert keys to readable labels
    const headers = rawHeaders.map(key => {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([a-z])([A-Z])/g, "$1 $2") // insert space between lower & upper
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // handle consecutive caps
      .trim();
      return {
        id: key,
        label
      };
    });

    // Set column widths
    headers.forEach((h, index) => {
      sheet.getColumn(index + 1).width = 20;
    });
    const lastColumnLetter = columnIndexToLetter(headers.length);
    // Add the first two rows as in the image
    sheet.addRow([reportName]);
    sheet.mergeCells(`A1:${lastColumnLetter}1`); // Merge cells for the title row
    sheet.getCell('A1').font = {
      size: 18,
      bold: true
    }; // Style the title row
    sheet.getCell('A1').alignment = {
      horizontal: 'center'
    };
    if (parameter) {
      sheet.addRow([`From: ${formatDate(parameter.FromDate)}   To: ${formatDate(parameter.ToDate)}`]);
      sheet.mergeCells(`A2:${lastColumnLetter}2`);
      sheet.getCell('A2').font = {
        size: 12,
        bold: true
      };
      currentRowCount += 1; // Count both the parameter and header rows
    }
    // Style the headers
    const headerRow = sheet.addRow(headers.map(h => h.label));
    headerRow.eachCell(cell => {
      cell.font = {
        bold: true
      };
    });
    currentRowCount++;
  };
  createNewSheet();

  // Add the data
  filteredRows.forEach(row => {
    if (currentRowCount > rowsPerSheet) {
      createNewSheet();
    }
    const rowData = Object.keys(filteredRows[0]).filter(header => !excludedFields.includes(header)).map(header => {
      if (reportDateFieldsArray.includes(header)) {
        return convertToLocaleDateString(row[header]);
      } else {
        return row[header] != null ? row[header] : "";
      }
    }) || '';
    sheet.addRow(rowData);
    currentRowCount++;
  });

  // Write to a buffer and then save using FileSaver
  const formatDateTimeForFilename = () => {
    const now = new Date();
    let day = '' + now.getDate();
    let month = '' + (now.getMonth() + 1);
    const year = now.getFullYear();
    let hours = '' + now.getHours();
    let minutes = '' + now.getMinutes();
    let seconds = '' + now.getSeconds();
    if (day.length < 2) day = '0' + day;
    if (month.length < 2) month = '0' + month;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 2) seconds = '0' + seconds;
    return [day, month, year].join('-') + '_' + [hours, minutes, seconds].join('-');
  };
  const buffer = await workbook.xlsx.writeBuffer();
  const dateTimeStringForFilename = formatDateTimeForFilename();
  fileSaver.saveAs(new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }), `${reportName}_${dateTimeStringForFilename}.xlsx`);
};

function ActionButton({
  iconsClick,
  icon,
  caption,
  iconName,
  variant = 'default',
  // 'default', 'outlined', 'filled'
  size = 'medium',
  // 'small', 'medium', 'large'
  disabled = false,
  tooltip = '',
  loading = false
}) {
  material.useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: "0.7rem",
      buttonPadding: "0.4rem",
      fontSize: "0.5rem",
      iconMargin: "0.1rem"
    },
    medium: {
      iconSize: "0.8rem",
      buttonPadding: "0.5rem",
      fontSize: "0.6rem",
      iconMargin: "0.2rem"
    },
    large: {
      iconSize: "1rem",
      buttonPadding: "0.6rem",
      fontSize: "0.7rem",
      iconMargin: "0.3rem"
    }
  };

  // Variant styles
  const variantStyles = {
    default: {
      button: {
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
          transform: "translateY(-1px)"
        },
        "&:active": {
          transform: "translateY(0)"
        }
      },
      icon: {
        color: primaryColor
      },
      text: {
        color: primaryColor
      }
    },
    outlined: {
      button: {
        backgroundColor: "transparent",
        border: `1px solid ${primaryColor}20`,
        "&:hover": {
          backgroundColor: "transparent",
          border: `1px solid ${primaryColor}40`,
          transform: "translateY(-1px)"
        }
      },
      icon: {
        color: primaryColor
      },
      text: {
        color: primaryColor
      }
    },
    filled: {
      button: {
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
          transform: "translateY(-1px)"
        }
      },
      icon: {
        color: "#ffffff"
      },
      text: {
        color: "#ffffff"
      }
    }
  };
  const currentSize = sizeConfig[size];
  const currentVariant = variantStyles[variant];
  const buttonSx = {
    borderRadius: "8px",
    padding: currentSize.buttonPadding,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "transparent",
      transform: currentVariant.button["&:hover"].transform
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none"
    },
    ...currentVariant.button,
    ...(variant === 'outlined' && currentVariant.button.border ? {
      border: currentVariant.button.border
    } : {})
  };
  const iconStyle = {
    fontSize: currentSize.iconSize,
    marginBottom: currentSize.iconMargin,
    transition: "all 0.2s ease-in-out",
    ...currentVariant.icon
  };
  const textStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: 500,
    lineHeight: 1.2,
    transition: "all 0.2s ease-in-out",
    ...currentVariant.text,
    "@media (max-width: 600px)": {
      fontSize: `calc(${currentSize.fontSize} - 0.1rem)`
    }
  };
  const buttonContent = /*#__PURE__*/jsxRuntime.jsxs(material.Stack, {
    direction: "column",
    alignItems: "center",
    spacing: 0.1,
    children: [loading ? /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBIcon, {
      fas: true,
      icon: "spinner",
      spin: true,
      style: iconStyle
    }) : /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBIcon, {
      fas: true,
      icon: icon,
      style: iconStyle
    }), /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
      variant: "caption",
      align: "center",
      sx: textStyle,
      children: caption
    })]
  });
  return /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
    title: tooltip,
    arrow: true,
    placement: "top",
    children: /*#__PURE__*/jsxRuntime.jsx(material.Box, {
      component: "span",
      children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
        "aria-label": caption || iconName,
        sx: buttonSx,
        onClick: () => iconsClick(iconName),
        disabled: disabled || loading,
        size: size,
        children: buttonContent
      })
    })
  });
}

function BasicBreadcrumbs$1() {
  const style = {
    display: "flex",
    alignItems: "center",
    fontSize: "1.2rem",
    color: primaryColor,
    "@media (max-width: 600px)": {
      fontSize: "1rem" // Reduce font size on smaller screens
    },
    fontWeight: "bold"
  };
  return /*#__PURE__*/jsxRuntime.jsx("div", {
    role: "presentation",
    style: {
      display: "flex",
      flexDirection: "row",
      maxWidth: "fit-content",
      alignItems: "center"
    },
    children: /*#__PURE__*/jsxRuntime.jsx(material.Stack, {
      spacing: 2,
      sx: {
        flex: 1
      },
      children: /*#__PURE__*/jsxRuntime.jsx(Breadcrumbs__default["default"], {
        separator: /*#__PURE__*/jsxRuntime.jsx(NavigateNextIcon__default["default"], {
          fontSize: "small",
          sx: {
            color: primaryColor
          }
        }),
        "aria-label": "breadcrumb",
        children: /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
          underline: "hover",
          sx: style,
          children: "User Summary"
        }, "1")
      })
    })
  });
}
const DefaultIcons$1 = ({
  iconsClick,
  userAction
}) => {
  const hasEditAction = userAction.some(action => action.Action_Name === "Edit");
  return /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
    sx: {
      display: "flex",
      flexDirection: "row",
      gap: "5px",
      alignItems: "center",
      overflowX: "auto",
      scrollbarWidth: "thin"
    },
    children: [userAction.some(action => action.Action_Name === "New") && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-plus",
      caption: "New",
      iconName: "new"
    }), userAction.some(action => action.Action_Name === "Edit") && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-pen",
      caption: "Edit",
      iconName: "edit"
    }), userAction.some(action => action.Action_Name === "Excel") && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-file-excel",
      caption: "Excel",
      iconName: "excel"
    }), userAction.some(action => action.Action_Name === "Delete") && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "trash",
      caption: "Delete",
      iconName: "delete"
    }), !hasEditAction && userAction.some(action => action.Name === "View") && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-eye",
      caption: "View",
      iconName: "view"
    }), /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-xmark",
      caption: "Close",
      iconName: "close"
    })]
  });
};
function UserSummary({
  setPageRender,
  setId,
  userAction
}) {
  const [rows, setRows] = React__default["default"].useState([]); //To Pass in Table
  const [displayLength, setdisplayLength] = React__default["default"].useState(25); // Show Entries
  const [pageNumber, setpageNumber] = React__default["default"].useState(1); //Table current page number
  const [changesTriggered, setchangesTriggered] = React__default["default"].useState(false); //Any changes made like delete, add new role then makes it true for refreshing the table
  const [selectedDatas, setselectedDatas] = React__default["default"].useState([]); //selected rows details
  const [totalRows, settotalRows] = React.useState(null); // Total rows of Api response
  const [refreshFlag, setrefreshFlag] = React__default["default"].useState(true); //To take data from Data base
  const [searchKey, setsearchKey] = React.useState(""); //Table Searching
  const [totalPages, setTotalPages] = React.useState(null);
  const {
    showAlert
  } = useAlert();
  const [confirmAlert, setConfirmAlert] = React.useState(false); //To handle alert open
  const [confirmData, setConfirmData] = React.useState({}); //To pass alert data
  const latestSearchKeyRef = React.useRef(searchKey);
  const {
    getSecuritysummary,
    deleteuser,
    deleterole
  } = securityApis();
  material.useTheme();
  const navigate = reactRouterDom.useNavigate();
  //Role page Apis

  //Role Summary
  const fetchRoleSummary = async () => {
    setselectedDatas([]);
    const currentSearchKey = latestSearchKeyRef.current;
    try {
      const response = await getSecuritysummary({
        PageNumber: pageNumber,
        PageSize: displayLength,
        Search: currentSearchKey
      }, "User/GetUserSummary");
      setrefreshFlag(false);
      if (response?.status === "Success" && currentSearchKey === latestSearchKeyRef.current) {
        const myObject = JSON.parse(response?.result);
        setRows(myObject?.Data);
        const totalRows = myObject?.PageSummary[0]?.TotalRows;
        const totalPages = myObject?.PageSummary[0]?.TotalPages;
        settotalRows(totalRows);
        setTotalPages(totalPages);
      } else {
        setRows([]);
      }
    } catch (error) {
      if (currentSearchKey === latestSearchKeyRef.current) {
        setRows([]);
        settotalRows(null);
        setTotalPages(null);
      }
    } finally {}
  };
  React__default["default"].useEffect(() => {
    fetchRoleSummary(); // Initial data fetch
  }, [pageNumber, displayLength, searchKey, changesTriggered, refreshFlag]);
  const handleRowDoubleClick = rowiId => {
    if (rowiId > 0) {
      setId(rowiId);
      setPageRender(2);
    }
  };
  const handleSearchKeyChange = newSearchKey => {
    setsearchKey(newSearchKey);
    latestSearchKeyRef.current = newSearchKey;
  };
  const handleSelectedRowsChange = selectedRowsData => {
    setselectedDatas(selectedRowsData);
  };
  const resetChangesTrigger = () => {
    setchangesTriggered(false);
  };
  const handleDisplayLengthChange = newDisplayLength => {
    setdisplayLength(newDisplayLength);
  };
  const handlepageNumberChange = newpageNumber => {
    setpageNumber(newpageNumber);
  };
  const hardRefresh = () => {
    setrefreshFlag(true);
    setselectedDatas([]);
    setsearchKey("");
    latestSearchKeyRef.current = "";
    setchangesTriggered(!changesTriggered);
  };
  const handleIconsClick = value => {
    switch (value) {
      case "new":
        handleAdd("new");
        break;
      case "edit":
        handleAdd("edit");
        break;
      case "delete":
        deleteClick();
        break;
      case "view":
        handleAdd("edit");
        break;
      case "excel":
        handleExcelExport();
        break;
      case "close":
        handleclose();
    }
  };
  const handleclose = () => {
    navigate("/home", {
      state: {
        Screen: 1
      }
    });
  };

  // Handlers for your icons
  const handleAdd = value => {
    if (value === "edit") {
      if (selectedDatas.length !== 1) {
        showAlert("info", selectedDatas.length === 0 ? "Select User to Edit " : "Can't Edit Multiple Role");
        return;
      }
      setId(selectedDatas[0]);
    } else {
      setId(0);
    }
    setPageRender(2);
  };

  //Delete alert open
  const deleteClick = async () => {
    if (selectedDatas.length === 0) {
      showAlert("info", "Select User to Delete");
      return;
    }
    setConfirmData({
      message: "Delete",
      type: "danger"
    });
    handleConfrimOpen();
  };

  //To delete
  const handledeleteRole = async () => {
    const deletePayload = selectedDatas.map(item => ({
      id: item
    }));
    try {
      let response = await deleteuser(deletePayload);
      if (response?.status === "Success") {
        showAlert("success", response?.message);
      }
    } catch (error) {} finally {
      setrefreshFlag(true);
      setselectedDatas([]);
      setchangesTriggered(true);
      handleConfrimClose();
    }
  };

  //confirmation
  const handleConfrimOpen = () => {
    setConfirmAlert(true);
  };
  const handleConfrimClose = () => {
    setConfirmAlert(false);
  };
  const handleExcelExport = async () => {
    try {
      const response = await getSecuritysummary({
        pageNo: 0,
        pageSize: 0,
        search: ""
      }, "user/getusersummary");
      const excludedFields = ["Id", "ModifiedBy", "ModifiedOn"];
      const filteredRows = JSON.parse(response?.result)?.Data;
      await ExcelExport({
        reportName: "User Summary",
        filteredRows,
        excludedFields
      });
    } catch (error) {}
  };
  const handleLongPressStart = () => {};
  return /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
      sx: {
        display: "flex",
        flexDirection: "column",
        width: "100%"
      },
      children: [/*#__PURE__*/jsxRuntime.jsxs(material.Box, {
        sx: {
          display: "flex",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingLeft: 1.5,
          paddingRight: 1.5,
          flexWrap: "wrap"
        },
        children: [/*#__PURE__*/jsxRuntime.jsx(BasicBreadcrumbs$1, {}), /*#__PURE__*/jsxRuntime.jsx(DefaultIcons$1, {
          iconsClick: handleIconsClick,
          userAction: userAction
        })]
      }), /*#__PURE__*/jsxRuntime.jsx(material.Box, {
        sx: {
          width: "100%",
          overflowX: "auto",
          paddingBottom: "10px"
        },
        children: /*#__PURE__*/jsxRuntime.jsx(SummaryTable, {
          rows: rows
          //onExportData={handleExportData}
          ,
          onDisplayLengthChange: handleDisplayLengthChange,
          onpageNumberChange: handlepageNumberChange
          //  onSortChange={handleSortChange}
          ,
          onSearchKeyChange: handleSearchKeyChange,
          changesTriggered: changesTriggered,
          setchangesTriggered: resetChangesTrigger,
          onSelectedRowsChange: handleSelectedRowsChange,
          onRowDoubleClick: handleRowDoubleClick,
          totalRows: totalRows
          //   currentTheme={currentTheme}
          ,
          handleLongPressStart: handleLongPressStart,
          totalPages: totalPages,
          hardRefresh: hardRefresh,
          IdName: "Id"
        })
      }), /*#__PURE__*/jsxRuntime.jsx(ConfirmationAlert, {
        handleClose: handleConfrimClose,
        open: confirmAlert,
        data: confirmData,
        submite: handledeleteRole
      })]
    })
  });
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var propTypes = {exports: {}};

var reactIs = {exports: {}};

var reactIs_production_min = {};

/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_production_min;

function requireReactIs_production_min () {
	if (hasRequiredReactIs_production_min) return reactIs_production_min;
	hasRequiredReactIs_production_min = 1;
var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.async_mode"):60111,m=b?Symbol.for("react.concurrent_mode"):60111,n=b?Symbol.for("react.forward_ref"):60112,p=b?Symbol.for("react.suspense"):60113,q=b?
	Symbol.for("react.suspense_list"):60120,r=b?Symbol.for("react.memo"):60115,t=b?Symbol.for("react.lazy"):60116,v=b?Symbol.for("react.block"):60121,w=b?Symbol.for("react.fundamental"):60117,x=b?Symbol.for("react.responder"):60118,y=b?Symbol.for("react.scope"):60119;
	function z(a){if("object"===typeof a&&null!==a){var u=a.$$typeof;switch(u){case c:switch(a=a.type,a){case l:case m:case e:case g:case f:case p:return a;default:switch(a=a&&a.$$typeof,a){case k:case n:case t:case r:case h:return a;default:return u}}case d:return u}}}function A(a){return z(a)===m}reactIs_production_min.AsyncMode=l;reactIs_production_min.ConcurrentMode=m;reactIs_production_min.ContextConsumer=k;reactIs_production_min.ContextProvider=h;reactIs_production_min.Element=c;reactIs_production_min.ForwardRef=n;reactIs_production_min.Fragment=e;reactIs_production_min.Lazy=t;reactIs_production_min.Memo=r;reactIs_production_min.Portal=d;
	reactIs_production_min.Profiler=g;reactIs_production_min.StrictMode=f;reactIs_production_min.Suspense=p;reactIs_production_min.isAsyncMode=function(a){return A(a)||z(a)===l};reactIs_production_min.isConcurrentMode=A;reactIs_production_min.isContextConsumer=function(a){return z(a)===k};reactIs_production_min.isContextProvider=function(a){return z(a)===h};reactIs_production_min.isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};reactIs_production_min.isForwardRef=function(a){return z(a)===n};reactIs_production_min.isFragment=function(a){return z(a)===e};reactIs_production_min.isLazy=function(a){return z(a)===t};
	reactIs_production_min.isMemo=function(a){return z(a)===r};reactIs_production_min.isPortal=function(a){return z(a)===d};reactIs_production_min.isProfiler=function(a){return z(a)===g};reactIs_production_min.isStrictMode=function(a){return z(a)===f};reactIs_production_min.isSuspense=function(a){return z(a)===p};
	reactIs_production_min.isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===m||a===g||a===f||a===p||a===q||"object"===typeof a&&null!==a&&(a.$$typeof===t||a.$$typeof===r||a.$$typeof===h||a.$$typeof===k||a.$$typeof===n||a.$$typeof===w||a.$$typeof===x||a.$$typeof===y||a.$$typeof===v)};reactIs_production_min.typeOf=z;
	return reactIs_production_min;
}

var reactIs_development = {};

/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_development;

function requireReactIs_development () {
	if (hasRequiredReactIs_development) return reactIs_development;
	hasRequiredReactIs_development = 1;



	if (process.env.NODE_ENV !== "production") {
	  (function() {

	// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
	// nor polyfill, then a plain number is used for performance.
	var hasSymbol = typeof Symbol === 'function' && Symbol.for;
	var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
	var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
	var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
	var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
	var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
	var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
	var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
	// (unstable) APIs that have been removed. Can we remove the symbols?

	var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
	var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
	var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
	var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
	var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
	var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
	var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
	var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
	var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
	var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
	var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

	function isValidElementType(type) {
	  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
	  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
	}

	function typeOf(object) {
	  if (typeof object === 'object' && object !== null) {
	    var $$typeof = object.$$typeof;

	    switch ($$typeof) {
	      case REACT_ELEMENT_TYPE:
	        var type = object.type;

	        switch (type) {
	          case REACT_ASYNC_MODE_TYPE:
	          case REACT_CONCURRENT_MODE_TYPE:
	          case REACT_FRAGMENT_TYPE:
	          case REACT_PROFILER_TYPE:
	          case REACT_STRICT_MODE_TYPE:
	          case REACT_SUSPENSE_TYPE:
	            return type;

	          default:
	            var $$typeofType = type && type.$$typeof;

	            switch ($$typeofType) {
	              case REACT_CONTEXT_TYPE:
	              case REACT_FORWARD_REF_TYPE:
	              case REACT_LAZY_TYPE:
	              case REACT_MEMO_TYPE:
	              case REACT_PROVIDER_TYPE:
	                return $$typeofType;

	              default:
	                return $$typeof;
	            }

	        }

	      case REACT_PORTAL_TYPE:
	        return $$typeof;
	    }
	  }

	  return undefined;
	} // AsyncMode is deprecated along with isAsyncMode

	var AsyncMode = REACT_ASYNC_MODE_TYPE;
	var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
	var ContextConsumer = REACT_CONTEXT_TYPE;
	var ContextProvider = REACT_PROVIDER_TYPE;
	var Element = REACT_ELEMENT_TYPE;
	var ForwardRef = REACT_FORWARD_REF_TYPE;
	var Fragment = REACT_FRAGMENT_TYPE;
	var Lazy = REACT_LAZY_TYPE;
	var Memo = REACT_MEMO_TYPE;
	var Portal = REACT_PORTAL_TYPE;
	var Profiler = REACT_PROFILER_TYPE;
	var StrictMode = REACT_STRICT_MODE_TYPE;
	var Suspense = REACT_SUSPENSE_TYPE;
	var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

	function isAsyncMode(object) {
	  {
	    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
	      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

	      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
	    }
	  }

	  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
	}
	function isConcurrentMode(object) {
	  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
	}
	function isContextConsumer(object) {
	  return typeOf(object) === REACT_CONTEXT_TYPE;
	}
	function isContextProvider(object) {
	  return typeOf(object) === REACT_PROVIDER_TYPE;
	}
	function isElement(object) {
	  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function isForwardRef(object) {
	  return typeOf(object) === REACT_FORWARD_REF_TYPE;
	}
	function isFragment(object) {
	  return typeOf(object) === REACT_FRAGMENT_TYPE;
	}
	function isLazy(object) {
	  return typeOf(object) === REACT_LAZY_TYPE;
	}
	function isMemo(object) {
	  return typeOf(object) === REACT_MEMO_TYPE;
	}
	function isPortal(object) {
	  return typeOf(object) === REACT_PORTAL_TYPE;
	}
	function isProfiler(object) {
	  return typeOf(object) === REACT_PROFILER_TYPE;
	}
	function isStrictMode(object) {
	  return typeOf(object) === REACT_STRICT_MODE_TYPE;
	}
	function isSuspense(object) {
	  return typeOf(object) === REACT_SUSPENSE_TYPE;
	}

	reactIs_development.AsyncMode = AsyncMode;
	reactIs_development.ConcurrentMode = ConcurrentMode;
	reactIs_development.ContextConsumer = ContextConsumer;
	reactIs_development.ContextProvider = ContextProvider;
	reactIs_development.Element = Element;
	reactIs_development.ForwardRef = ForwardRef;
	reactIs_development.Fragment = Fragment;
	reactIs_development.Lazy = Lazy;
	reactIs_development.Memo = Memo;
	reactIs_development.Portal = Portal;
	reactIs_development.Profiler = Profiler;
	reactIs_development.StrictMode = StrictMode;
	reactIs_development.Suspense = Suspense;
	reactIs_development.isAsyncMode = isAsyncMode;
	reactIs_development.isConcurrentMode = isConcurrentMode;
	reactIs_development.isContextConsumer = isContextConsumer;
	reactIs_development.isContextProvider = isContextProvider;
	reactIs_development.isElement = isElement;
	reactIs_development.isForwardRef = isForwardRef;
	reactIs_development.isFragment = isFragment;
	reactIs_development.isLazy = isLazy;
	reactIs_development.isMemo = isMemo;
	reactIs_development.isPortal = isPortal;
	reactIs_development.isProfiler = isProfiler;
	reactIs_development.isStrictMode = isStrictMode;
	reactIs_development.isSuspense = isSuspense;
	reactIs_development.isValidElementType = isValidElementType;
	reactIs_development.typeOf = typeOf;
	  })();
	}
	return reactIs_development;
}

var hasRequiredReactIs;

function requireReactIs () {
	if (hasRequiredReactIs) return reactIs.exports;
	hasRequiredReactIs = 1;

	if (process.env.NODE_ENV === 'production') {
	  reactIs.exports = requireReactIs_production_min();
	} else {
	  reactIs.exports = requireReactIs_development();
	}
	return reactIs.exports;
}

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

var objectAssign;
var hasRequiredObjectAssign;

function requireObjectAssign () {
	if (hasRequiredObjectAssign) return objectAssign;
	hasRequiredObjectAssign = 1;
	/* eslint-disable no-unused-vars */
	var getOwnPropertySymbols = Object.getOwnPropertySymbols;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (err) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (getOwnPropertySymbols) {
				symbols = getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
	return objectAssign;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var ReactPropTypesSecret_1;
var hasRequiredReactPropTypesSecret;

function requireReactPropTypesSecret () {
	if (hasRequiredReactPropTypesSecret) return ReactPropTypesSecret_1;
	hasRequiredReactPropTypesSecret = 1;

	var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

	ReactPropTypesSecret_1 = ReactPropTypesSecret;
	return ReactPropTypesSecret_1;
}

var has;
var hasRequiredHas;

function requireHas () {
	if (hasRequiredHas) return has;
	hasRequiredHas = 1;
	has = Function.call.bind(Object.prototype.hasOwnProperty);
	return has;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var checkPropTypes_1;
var hasRequiredCheckPropTypes;

function requireCheckPropTypes () {
	if (hasRequiredCheckPropTypes) return checkPropTypes_1;
	hasRequiredCheckPropTypes = 1;

	var printWarning = function() {};

	if (process.env.NODE_ENV !== 'production') {
	  var ReactPropTypesSecret = /*@__PURE__*/ requireReactPropTypesSecret();
	  var loggedTypeFailures = {};
	  var has = /*@__PURE__*/ requireHas();

	  printWarning = function(text) {
	    var message = 'Warning: ' + text;
	    if (typeof console !== 'undefined') {
	      console.error(message);
	    }
	    try {
	      // --- Welcome to debugging React ---
	      // This error was thrown as a convenience so that you can use this stack
	      // to find the callsite that caused this warning to fire.
	      throw new Error(message);
	    } catch (x) { /**/ }
	  };
	}

	/**
	 * Assert that the values match with the type specs.
	 * Error messages are memorized and will only be shown once.
	 *
	 * @param {object} typeSpecs Map of name to a ReactPropType
	 * @param {object} values Runtime values that need to be type-checked
	 * @param {string} location e.g. "prop", "context", "child context"
	 * @param {string} componentName Name of the component for error messages.
	 * @param {?Function} getStack Returns the component stack.
	 * @private
	 */
	function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
	  if (process.env.NODE_ENV !== 'production') {
	    for (var typeSpecName in typeSpecs) {
	      if (has(typeSpecs, typeSpecName)) {
	        var error;
	        // Prop type validation may throw. In case they do, we don't want to
	        // fail the render phase where it didn't fail before. So we log it.
	        // After these have been cleaned up, we'll let them throw.
	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          if (typeof typeSpecs[typeSpecName] !== 'function') {
	            var err = Error(
	              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
	              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' +
	              'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
	            );
	            err.name = 'Invariant Violation';
	            throw err;
	          }
	          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
	        } catch (ex) {
	          error = ex;
	        }
	        if (error && !(error instanceof Error)) {
	          printWarning(
	            (componentName || 'React class') + ': type specification of ' +
	            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
	            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
	            'You may have forgotten to pass an argument to the type checker ' +
	            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
	            'shape all require an argument).'
	          );
	        }
	        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
	          // Only monitor this failure once because there tends to be a lot of the
	          // same error.
	          loggedTypeFailures[error.message] = true;

	          var stack = getStack ? getStack() : '';

	          printWarning(
	            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
	          );
	        }
	      }
	    }
	  }
	}

	/**
	 * Resets warning cache when testing.
	 *
	 * @private
	 */
	checkPropTypes.resetWarningCache = function() {
	  if (process.env.NODE_ENV !== 'production') {
	    loggedTypeFailures = {};
	  }
	};

	checkPropTypes_1 = checkPropTypes;
	return checkPropTypes_1;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var factoryWithTypeCheckers;
var hasRequiredFactoryWithTypeCheckers;

function requireFactoryWithTypeCheckers () {
	if (hasRequiredFactoryWithTypeCheckers) return factoryWithTypeCheckers;
	hasRequiredFactoryWithTypeCheckers = 1;

	var ReactIs = requireReactIs();
	var assign = requireObjectAssign();

	var ReactPropTypesSecret = /*@__PURE__*/ requireReactPropTypesSecret();
	var has = /*@__PURE__*/ requireHas();
	var checkPropTypes = /*@__PURE__*/ requireCheckPropTypes();

	var printWarning = function() {};

	if (process.env.NODE_ENV !== 'production') {
	  printWarning = function(text) {
	    var message = 'Warning: ' + text;
	    if (typeof console !== 'undefined') {
	      console.error(message);
	    }
	    try {
	      // --- Welcome to debugging React ---
	      // This error was thrown as a convenience so that you can use this stack
	      // to find the callsite that caused this warning to fire.
	      throw new Error(message);
	    } catch (x) {}
	  };
	}

	function emptyFunctionThatReturnsNull() {
	  return null;
	}

	factoryWithTypeCheckers = function(isValidElement, throwOnDirectAccess) {
	  /* global Symbol */
	  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
	  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

	  /**
	   * Returns the iterator method function contained on the iterable object.
	   *
	   * Be sure to invoke the function with the iterable as context:
	   *
	   *     var iteratorFn = getIteratorFn(myIterable);
	   *     if (iteratorFn) {
	   *       var iterator = iteratorFn.call(myIterable);
	   *       ...
	   *     }
	   *
	   * @param {?object} maybeIterable
	   * @return {?function}
	   */
	  function getIteratorFn(maybeIterable) {
	    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
	    if (typeof iteratorFn === 'function') {
	      return iteratorFn;
	    }
	  }

	  /**
	   * Collection of methods that allow declaration and validation of props that are
	   * supplied to React components. Example usage:
	   *
	   *   var Props = require('ReactPropTypes');
	   *   var MyArticle = React.createClass({
	   *     propTypes: {
	   *       // An optional string prop named "description".
	   *       description: Props.string,
	   *
	   *       // A required enum prop named "category".
	   *       category: Props.oneOf(['News','Photos']).isRequired,
	   *
	   *       // A prop named "dialog" that requires an instance of Dialog.
	   *       dialog: Props.instanceOf(Dialog).isRequired
	   *     },
	   *     render: function() { ... }
	   *   });
	   *
	   * A more formal specification of how these methods are used:
	   *
	   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
	   *   decl := ReactPropTypes.{type}(.isRequired)?
	   *
	   * Each and every declaration produces a function with the same signature. This
	   * allows the creation of custom validation functions. For example:
	   *
	   *  var MyLink = React.createClass({
	   *    propTypes: {
	   *      // An optional string or URI prop named "href".
	   *      href: function(props, propName, componentName) {
	   *        var propValue = props[propName];
	   *        if (propValue != null && typeof propValue !== 'string' &&
	   *            !(propValue instanceof URI)) {
	   *          return new Error(
	   *            'Expected a string or an URI for ' + propName + ' in ' +
	   *            componentName
	   *          );
	   *        }
	   *      }
	   *    },
	   *    render: function() {...}
	   *  });
	   *
	   * @internal
	   */

	  var ANONYMOUS = '<<anonymous>>';

	  // Important!
	  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
	  var ReactPropTypes = {
	    array: createPrimitiveTypeChecker('array'),
	    bigint: createPrimitiveTypeChecker('bigint'),
	    bool: createPrimitiveTypeChecker('boolean'),
	    func: createPrimitiveTypeChecker('function'),
	    number: createPrimitiveTypeChecker('number'),
	    object: createPrimitiveTypeChecker('object'),
	    string: createPrimitiveTypeChecker('string'),
	    symbol: createPrimitiveTypeChecker('symbol'),

	    any: createAnyTypeChecker(),
	    arrayOf: createArrayOfTypeChecker,
	    element: createElementTypeChecker(),
	    elementType: createElementTypeTypeChecker(),
	    instanceOf: createInstanceTypeChecker,
	    node: createNodeChecker(),
	    objectOf: createObjectOfTypeChecker,
	    oneOf: createEnumTypeChecker,
	    oneOfType: createUnionTypeChecker,
	    shape: createShapeTypeChecker,
	    exact: createStrictShapeTypeChecker,
	  };

	  /**
	   * inlined Object.is polyfill to avoid requiring consumers ship their own
	   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
	   */
	  /*eslint-disable no-self-compare*/
	  function is(x, y) {
	    // SameValue algorithm
	    if (x === y) {
	      // Steps 1-5, 7-10
	      // Steps 6.b-6.e: +0 != -0
	      return x !== 0 || 1 / x === 1 / y;
	    } else {
	      // Step 6.a: NaN == NaN
	      return x !== x && y !== y;
	    }
	  }
	  /*eslint-enable no-self-compare*/

	  /**
	   * We use an Error-like object for backward compatibility as people may call
	   * PropTypes directly and inspect their output. However, we don't use real
	   * Errors anymore. We don't inspect their stack anyway, and creating them
	   * is prohibitively expensive if they are created too often, such as what
	   * happens in oneOfType() for any type before the one that matched.
	   */
	  function PropTypeError(message, data) {
	    this.message = message;
	    this.data = data && typeof data === 'object' ? data: {};
	    this.stack = '';
	  }
	  // Make `instanceof Error` still work for returned errors.
	  PropTypeError.prototype = Error.prototype;

	  function createChainableTypeChecker(validate) {
	    if (process.env.NODE_ENV !== 'production') {
	      var manualPropTypeCallCache = {};
	      var manualPropTypeWarningCount = 0;
	    }
	    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
	      componentName = componentName || ANONYMOUS;
	      propFullName = propFullName || propName;

	      if (secret !== ReactPropTypesSecret) {
	        if (throwOnDirectAccess) {
	          // New behavior only for users of `prop-types` package
	          var err = new Error(
	            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
	            'Use `PropTypes.checkPropTypes()` to call them. ' +
	            'Read more at http://fb.me/use-check-prop-types'
	          );
	          err.name = 'Invariant Violation';
	          throw err;
	        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
	          // Old behavior for people using React.PropTypes
	          var cacheKey = componentName + ':' + propName;
	          if (
	            !manualPropTypeCallCache[cacheKey] &&
	            // Avoid spamming the console because they are often not actionable except for lib authors
	            manualPropTypeWarningCount < 3
	          ) {
	            printWarning(
	              'You are manually calling a React.PropTypes validation ' +
	              'function for the `' + propFullName + '` prop on `' + componentName + '`. This is deprecated ' +
	              'and will throw in the standalone `prop-types` package. ' +
	              'You may be seeing this warning due to a third-party PropTypes ' +
	              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
	            );
	            manualPropTypeCallCache[cacheKey] = true;
	            manualPropTypeWarningCount++;
	          }
	        }
	      }
	      if (props[propName] == null) {
	        if (isRequired) {
	          if (props[propName] === null) {
	            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
	          }
	          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
	        }
	        return null;
	      } else {
	        return validate(props, propName, componentName, location, propFullName);
	      }
	    }

	    var chainedCheckType = checkType.bind(null, false);
	    chainedCheckType.isRequired = checkType.bind(null, true);

	    return chainedCheckType;
	  }

	  function createPrimitiveTypeChecker(expectedType) {
	    function validate(props, propName, componentName, location, propFullName, secret) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== expectedType) {
	        // `propValue` being instance of, say, date/regexp, pass the 'object'
	        // check, but we can offer a more precise error message here rather than
	        // 'of type `object`'.
	        var preciseType = getPreciseType(propValue);

	        return new PropTypeError(
	          'Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'),
	          {expectedType: expectedType}
	        );
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createAnyTypeChecker() {
	    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
	  }

	  function createArrayOfTypeChecker(typeChecker) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (typeof typeChecker !== 'function') {
	        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
	      }
	      var propValue = props[propName];
	      if (!Array.isArray(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
	      }
	      for (var i = 0; i < propValue.length; i++) {
	        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
	        if (error instanceof Error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createElementTypeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      if (!isValidElement(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createElementTypeTypeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      if (!ReactIs.isValidElementType(propValue)) {
	        var propType = getPropType(propValue);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createInstanceTypeChecker(expectedClass) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (!(props[propName] instanceof expectedClass)) {
	        var expectedClassName = expectedClass.name || ANONYMOUS;
	        var actualClassName = getClassName(props[propName]);
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createEnumTypeChecker(expectedValues) {
	    if (!Array.isArray(expectedValues)) {
	      if (process.env.NODE_ENV !== 'production') {
	        if (arguments.length > 1) {
	          printWarning(
	            'Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' +
	            'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
	          );
	        } else {
	          printWarning('Invalid argument supplied to oneOf, expected an array.');
	        }
	      }
	      return emptyFunctionThatReturnsNull;
	    }

	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      for (var i = 0; i < expectedValues.length; i++) {
	        if (is(propValue, expectedValues[i])) {
	          return null;
	        }
	      }

	      var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
	        var type = getPreciseType(value);
	        if (type === 'symbol') {
	          return String(value);
	        }
	        return value;
	      });
	      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createObjectOfTypeChecker(typeChecker) {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (typeof typeChecker !== 'function') {
	        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
	      }
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
	      }
	      for (var key in propValue) {
	        if (has(propValue, key)) {
	          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	          if (error instanceof Error) {
	            return error;
	          }
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createUnionTypeChecker(arrayOfTypeCheckers) {
	    if (!Array.isArray(arrayOfTypeCheckers)) {
	      process.env.NODE_ENV !== 'production' ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
	      return emptyFunctionThatReturnsNull;
	    }

	    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	      var checker = arrayOfTypeCheckers[i];
	      if (typeof checker !== 'function') {
	        printWarning(
	          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
	          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
	        );
	        return emptyFunctionThatReturnsNull;
	      }
	    }

	    function validate(props, propName, componentName, location, propFullName) {
	      var expectedTypes = [];
	      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
	        var checker = arrayOfTypeCheckers[i];
	        var checkerResult = checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
	        if (checkerResult == null) {
	          return null;
	        }
	        if (checkerResult.data && has(checkerResult.data, 'expectedType')) {
	          expectedTypes.push(checkerResult.data.expectedType);
	        }
	      }
	      var expectedTypesMessage = (expectedTypes.length > 0) ? ', expected one of type [' + expectedTypes.join(', ') + ']': '';
	      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`' + expectedTypesMessage + '.'));
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createNodeChecker() {
	    function validate(props, propName, componentName, location, propFullName) {
	      if (!isNode(props[propName])) {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function invalidValidatorError(componentName, location, propFullName, key, type) {
	    return new PropTypeError(
	      (componentName || 'React class') + ': ' + location + ' type `' + propFullName + '.' + key + '` is invalid; ' +
	      'it must be a function, usually from the `prop-types` package, but received `' + type + '`.'
	    );
	  }

	  function createShapeTypeChecker(shapeTypes) {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
	      }
	      for (var key in shapeTypes) {
	        var checker = shapeTypes[key];
	        if (typeof checker !== 'function') {
	          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
	        }
	        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	        if (error) {
	          return error;
	        }
	      }
	      return null;
	    }
	    return createChainableTypeChecker(validate);
	  }

	  function createStrictShapeTypeChecker(shapeTypes) {
	    function validate(props, propName, componentName, location, propFullName) {
	      var propValue = props[propName];
	      var propType = getPropType(propValue);
	      if (propType !== 'object') {
	        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
	      }
	      // We need to check all keys in case some are required but missing from props.
	      var allKeys = assign({}, props[propName], shapeTypes);
	      for (var key in allKeys) {
	        var checker = shapeTypes[key];
	        if (has(shapeTypes, key) && typeof checker !== 'function') {
	          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
	        }
	        if (!checker) {
	          return new PropTypeError(
	            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
	            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
	            '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  ')
	          );
	        }
	        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
	        if (error) {
	          return error;
	        }
	      }
	      return null;
	    }

	    return createChainableTypeChecker(validate);
	  }

	  function isNode(propValue) {
	    switch (typeof propValue) {
	      case 'number':
	      case 'string':
	      case 'undefined':
	        return true;
	      case 'boolean':
	        return !propValue;
	      case 'object':
	        if (Array.isArray(propValue)) {
	          return propValue.every(isNode);
	        }
	        if (propValue === null || isValidElement(propValue)) {
	          return true;
	        }

	        var iteratorFn = getIteratorFn(propValue);
	        if (iteratorFn) {
	          var iterator = iteratorFn.call(propValue);
	          var step;
	          if (iteratorFn !== propValue.entries) {
	            while (!(step = iterator.next()).done) {
	              if (!isNode(step.value)) {
	                return false;
	              }
	            }
	          } else {
	            // Iterator will provide entry [k,v] tuples rather than values.
	            while (!(step = iterator.next()).done) {
	              var entry = step.value;
	              if (entry) {
	                if (!isNode(entry[1])) {
	                  return false;
	                }
	              }
	            }
	          }
	        } else {
	          return false;
	        }

	        return true;
	      default:
	        return false;
	    }
	  }

	  function isSymbol(propType, propValue) {
	    // Native Symbol.
	    if (propType === 'symbol') {
	      return true;
	    }

	    // falsy value can't be a Symbol
	    if (!propValue) {
	      return false;
	    }

	    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
	    if (propValue['@@toStringTag'] === 'Symbol') {
	      return true;
	    }

	    // Fallback for non-spec compliant Symbols which are polyfilled.
	    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
	      return true;
	    }

	    return false;
	  }

	  // Equivalent of `typeof` but with special handling for array and regexp.
	  function getPropType(propValue) {
	    var propType = typeof propValue;
	    if (Array.isArray(propValue)) {
	      return 'array';
	    }
	    if (propValue instanceof RegExp) {
	      // Old webkits (at least until Android 4.0) return 'function' rather than
	      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
	      // passes PropTypes.object.
	      return 'object';
	    }
	    if (isSymbol(propType, propValue)) {
	      return 'symbol';
	    }
	    return propType;
	  }

	  // This handles more types than `getPropType`. Only used for error messages.
	  // See `createPrimitiveTypeChecker`.
	  function getPreciseType(propValue) {
	    if (typeof propValue === 'undefined' || propValue === null) {
	      return '' + propValue;
	    }
	    var propType = getPropType(propValue);
	    if (propType === 'object') {
	      if (propValue instanceof Date) {
	        return 'date';
	      } else if (propValue instanceof RegExp) {
	        return 'regexp';
	      }
	    }
	    return propType;
	  }

	  // Returns a string that is postfixed to a warning about an invalid type.
	  // For example, "undefined" or "of type array"
	  function getPostfixForTypeWarning(value) {
	    var type = getPreciseType(value);
	    switch (type) {
	      case 'array':
	      case 'object':
	        return 'an ' + type;
	      case 'boolean':
	      case 'date':
	      case 'regexp':
	        return 'a ' + type;
	      default:
	        return type;
	    }
	  }

	  // Returns class name of the object, if any.
	  function getClassName(propValue) {
	    if (!propValue.constructor || !propValue.constructor.name) {
	      return ANONYMOUS;
	    }
	    return propValue.constructor.name;
	  }

	  ReactPropTypes.checkPropTypes = checkPropTypes;
	  ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
	  ReactPropTypes.PropTypes = ReactPropTypes;

	  return ReactPropTypes;
	};
	return factoryWithTypeCheckers;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var factoryWithThrowingShims;
var hasRequiredFactoryWithThrowingShims;

function requireFactoryWithThrowingShims () {
	if (hasRequiredFactoryWithThrowingShims) return factoryWithThrowingShims;
	hasRequiredFactoryWithThrowingShims = 1;

	var ReactPropTypesSecret = /*@__PURE__*/ requireReactPropTypesSecret();

	function emptyFunction() {}
	function emptyFunctionWithReset() {}
	emptyFunctionWithReset.resetWarningCache = emptyFunction;

	factoryWithThrowingShims = function() {
	  function shim(props, propName, componentName, location, propFullName, secret) {
	    if (secret === ReactPropTypesSecret) {
	      // It is still safe when called from React.
	      return;
	    }
	    var err = new Error(
	      'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
	      'Use PropTypes.checkPropTypes() to call them. ' +
	      'Read more at http://fb.me/use-check-prop-types'
	    );
	    err.name = 'Invariant Violation';
	    throw err;
	  }	  shim.isRequired = shim;
	  function getShim() {
	    return shim;
	  }	  // Important!
	  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
	  var ReactPropTypes = {
	    array: shim,
	    bigint: shim,
	    bool: shim,
	    func: shim,
	    number: shim,
	    object: shim,
	    string: shim,
	    symbol: shim,

	    any: shim,
	    arrayOf: getShim,
	    element: shim,
	    elementType: shim,
	    instanceOf: getShim,
	    node: shim,
	    objectOf: getShim,
	    oneOf: getShim,
	    oneOfType: getShim,
	    shape: getShim,
	    exact: getShim,

	    checkPropTypes: emptyFunctionWithReset,
	    resetWarningCache: emptyFunction
	  };

	  ReactPropTypes.PropTypes = ReactPropTypes;

	  return ReactPropTypes;
	};
	return factoryWithThrowingShims;
}

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredPropTypes;

function requirePropTypes () {
	if (hasRequiredPropTypes) return propTypes.exports;
	hasRequiredPropTypes = 1;
	if (process.env.NODE_ENV !== 'production') {
	  var ReactIs = requireReactIs();

	  // By explicitly using `prop-types` you are opting into new development behavior.
	  // http://fb.me/prop-types-in-prod
	  var throwOnDirectAccess = true;
	  propTypes.exports = /*@__PURE__*/ requireFactoryWithTypeCheckers()(ReactIs.isElement, throwOnDirectAccess);
	} else {
	  // By explicitly using `prop-types` you are opting into new production behavior.
	  // http://fb.me/prop-types-in-prod
	  propTypes.exports = /*@__PURE__*/ requireFactoryWithThrowingShims()();
	}
	return propTypes.exports;
}

var propTypesExports = /*@__PURE__*/ requirePropTypes();
var PropTypes = /*@__PURE__*/getDefaultExportFromCjs(propTypesExports);

const CustomTextField$1 = system.styled(material.TextField)({
  '& .MuiInputBase-root': {
    '& textarea': {
      '&::-webkit-scrollbar': {
        width: '6px'
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '3px',
        cursor: 'pointer'
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
      },
      '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)'
      },
      '&[data-mode="dark"]::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }
    }
  }
});

// Helper function to format time in 24-hour format (HH:MM) for consistent storage
const formatTimeForInput = timeString => {
  if (!timeString) return "";

  // If it's already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }

  // If it's in 12-hour format with AM/PM, convert to 24-hour
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    // Format hours to 2 digits
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes}`;
  }
  return timeString;
};

// Helper to get browser locale time format
const getBrowserTimeFormat = () => {
  const testDate = new Date(2023, 0, 1, 13, 30); // 1:30 PM
  const timeString = testDate.toLocaleTimeString();

  // Check if it's 24-hour format
  return timeString.includes('13:30') ? '24h' : '12h';
};
function UserInputField({
  name,
  label,
  type,
  disabled,
  value,
  setValue,
  width,
  multiline,
  mandatory,
  direction,
  maxLength,
  onBlurAction,
  decimalLength,
  preDate,
  postDate,
  rows = 3
}) {
  const [tabPressed, setTabPressed] = React.useState(false);
  const [timeFormat, setTimeFormat] = React.useState('24h');
  const [isPickerSupported, setIsPickerSupported] = React.useState(false);
  const {
    showAlert
  } = useAlert();
  const inputRef = React.useRef(null);

  // Detect browser's time format and picker support
  React.useEffect(() => {
    setTimeFormat(getBrowserTimeFormat());

    // Check if showPicker is supported
    const input = document.createElement('input');
    input.type = 'datetime-local';
    setIsPickerSupported(typeof input.showPicker === 'function');

    // Listen for locale changes if needed
    const handleLanguageChange = () => {
      setTimeFormat(getBrowserTimeFormat());
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);
  const handleChange = event => {
    const inputValue = event.target.value;
    if (type === "number") {
      const decimalRegex = decimalLength !== undefined ? new RegExp(`^\\d*\\.?\\d{0,${decimalLength}}$`) : /^(\d+\.?\d*|\.\d+)$/;
      if (!decimalRegex.test(inputValue) || inputValue.includes('e') || inputValue.includes('+') || inputValue.includes('-')) {
        return;
      }
    } else if (type === "time") {
      // For time inputs, we'll accept various formats but store in 24-hour format
      if (inputValue && !/^\d{1,2}:\d{2}$/.test(inputValue) && !/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/i.test(inputValue)) {
        // Show gentle warning but don't prevent input
        showAlert("warning", "Please enter time in HH:MM format");
      }
    }
    const update = {
      ...value
    };
    if (type === "time" && inputValue) {
      // Store in 24-hour format consistently
      update[name] = formatTimeForInput(inputValue);
    } else {
      update[name] = type === "number" && inputValue !== "" ? Number(inputValue) : inputValue;
    }
    setValue(update);
  };
  const handleKeyDown = event => {
    let inputValue = event.target.value;
    if (inputValue.length === maxLength) {
      showAlert("info", "Maximum length reached");
    }
    if (event.key === "Tab") {
      setTabPressed(true);
    }

    // For date/time inputs, allow showing picker on specific key presses
    if (type === "date" || type === "datetime-local" || type === "time") {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (inputRef.current && isPickerSupported) {
          inputRef.current.showPicker();
        }
      }
    }
  };
  const handleBlur = event => {
    if (type === "time") {
      // Validate and format time on blur
      const inputValue = event.target.value;
      if (inputValue) {
        const formattedTime = formatTimeForInput(inputValue);
        if (formattedTime && formattedTime !== inputValue) {
          const update = {
            ...value
          };
          update[name] = formattedTime;
          setValue(update);
        }
      }
    }
    if (tabPressed) {
      setTabPressed(false);
      if (typeof onBlurAction === "function") {
        onBlurAction();
      }
    }
  };

  // Handle click specifically for showing picker
  const handleClick = event => {
    // Only show picker for date/time inputs when supported
    if ((type === "date" || type === "datetime-local" || type === "time") && inputRef.current && isPickerSupported && !disabled) {
      // Use a timeout to ensure it's in the same event loop as the user gesture
      setTimeout(() => {
        try {
          inputRef.current.showPicker();
        } catch (error) {
          // Fallback: browser's default behavior will handle it
        }
      }, 0);
    }
  };

  // Get display value for time input
  const getDisplayValue = () => {
    if (!value[name]) return "";
    if (type === "time") {
      // For display, show in user's preferred format
      const timeParts = value[name].split(':');
      if (timeParts.length === 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        if (timeFormat === '12h' && hours > 0 && hours <= 12) {
          // Convert to 12-hour format for display
          const displayHours = hours % 12 || 12;
          return `${displayHours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
    }
    return value[name] || "";
  };
  const inputProps = {
    ref: inputRef,
    maxLength: maxLength,
    autoComplete: `off`,
    placeholder: type === "time" ? "HH:MM" : undefined,
    style: {
      direction: direction ? "rtl" : "ltr"
    },
    // Remove all showPicker calls from inputProps to avoid the error
    ...(type === "date" && {
      min: preDate,
      max: postDate
    }),
    ...(type === "datetime-local" && {
      step: 1
    }),
    ...(type === "time" && {
      step: 300 // 5 minute intervals
    })
  };
  return /*#__PURE__*/jsxRuntime.jsx(CustomTextField$1, {
    margin: "normal",
    size: "small",
    id: "search1",
    value: getDisplayValue(),
    type: type,
    onMouseLeave: value[name] ? onBlurAction : null,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    onClick: handleClick,
    label: label,
    required: mandatory,
    multiline: multiline,
    rows: multiline ? rows : null,
    autoComplete: "off",
    disabled: disabled,
    onChange: handleChange,
    InputProps: {
      inputProps: inputProps,
      sx: {
        '& input[type="date"]::-webkit-calendar-picker-indicator': {
          filter: 'invert(0)',
          cursor: 'pointer',
          opacity: 0.6,
          '&:hover': {
            opacity: 1
          }
        },
        '& input[type="time"]::-webkit-calendar-picker-indicator': {
          filter: 'invert(0)',
          cursor: 'pointer',
          opacity: 0.6,
          '&:hover': {
            opacity: 1
          }
        },
        '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
          filter: 'invert(0)',
          cursor: 'pointer',
          opacity: 0.6,
          '&:hover': {
            opacity: 1
          }
        }
      }
    },
    InputLabelProps: {
      shrink: true,
      style: {
        direction: direction ? "rtl" : "ltr",
        fontSize: "14px"
      }
    },
    sx: {
      width: width ? width : 250,
      "@media (max-width: 360px)": {
        width: 220
      },
      "& .MuiInputBase-root": {
        ...(multiline ? {} : {
          height: 30
        }),
        '& textarea': {
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '3px',
            cursor: 'pointer'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      "& .MuiInputLabel-root": {
        fontSize: "14px",
        transform: "translate(10px, 5px) scale(0.9)",
        color: "inherit"
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -9px) scale(0.75)"
      },
      "& .MuiInputBase-input": {
        fontSize: "0.75rem",
        color: "inherit"
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "currentColor"
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "currentColor"
      },
      "& .MuiFormLabel-root.Mui-focused": {
        color: "inherit"
      },
      "& .MuiOutlinedInput-root": {
        "& fieldset": {
          borderColor: `${"#ddd"}`
        },
        "&:hover fieldset": {
          borderColor: "currentColor"
        },
        "&.Mui-focused fieldset": {
          borderColor: "currentColor"
        }
      }
    }
  });
}

const AutoSelect = ({
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  required,
  disabled,
  languageName,
  width = 250,
  ColumnSpan = 0,
  Menu = [],
  tableField = false
}) => {
  const [searchkey, setsearchkey] = React.useState("");
  const [autoCompleteKey, setAutoCompleteKey] = React.useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = React.useState(false);
  const direction = "ltr";
  const focusedRef = React.useRef(false); // Use ref to track focus state
  const highlightRef = React.useRef(false); // Separate ref to track component focus state

  // Effect to set the formDataName based on formDataiId
  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    if (formData[formDataiId] && !formData[formDataName]) {
      const selectedOption = Menu?.find(item => item.Id === formData[formDataiId]);
      if (selectedOption) {
        didInitRef.current = true;
        setFormData({
          ...formData,
          [formDataName]: selectedOption.Name
        });
      }
    }
  }, [formData[formDataiId]]);
  const handleAutocompleteChange = (event, newValue) => {
    if (disabled) {
      return;
    }
    if (newValue && newValue.Id === formData[formDataiId] && newValue.Name === formData[formDataName]) {
      return;
    }
    const updatedFormData = {
      ...formData,
      [formDataName]: newValue ? newValue?.Name : "",
      [formDataiId]: newValue ? newValue?.Id : 0
    };
    setFormData(updatedFormData); // This will now update the parent's state
  };
  const handleBlur = () => {
    focusedRef.current = false; // Reset focus state when the component loses focus
    // Check for the existence in Menu or the existing formData value
    const existsInMenu = Menu.some(option => option.Name === searchkey);
    const existingFormValue = formData[formDataName] || "";
    if (!existsInMenu && searchkey !== existingFormValue) {
      setFormData({
        ...formData,
        [formDataName]: "",
        [formDataiId]: 0
      });
      setsearchkey("");
      setAutoCompleteKey(prevKey => prevKey + 1);
    }
  };
  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue);
  };
  const CustomListBox = /*#__PURE__*/React__default["default"].forwardRef((props, ref) => {
    const {
      children,
      ...other
    } = props;
    return /*#__PURE__*/jsxRuntime.jsxs("ul", {
      style: {
        paddingTop: 0,
        scrollbarWidth: "thin"
      },
      ref: ref,
      ...other,
      children: [/*#__PURE__*/jsxRuntime.jsx(material.ListSubheader, {
        style: {
          backgroundColor: thirdColor,
          padding: "5px",
          color: "#fff"
        },
        children: /*#__PURE__*/jsxRuntime.jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            width: "100%"
          },
          children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
            style: {
              marginRight: "auto",
              fontSize: "0.8rem"
            },
            children: "Name"
          }), /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
            style: {
              marginLeft: "auto",
              fontSize: "0.8rem"
            },
            children: "Code"
          })]
        })
      }), children]
    });
  });
  const isLatinScript = text => {
    const latinRegex = /^[\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]*$/;
    return latinRegex.test(text); // Returns true if the text is Latin-based (including special chars)
  };
  const filterOptions = (options, {
    inputValue
  }) => {
    return options.filter(option => {
      const name = option?.Name || '';
      const code = option?.Code || '';

      // Use toLowerCase() only for Latin script inputs
      const normalizedInput = isLatinScript(inputValue) ? inputValue.toLowerCase() : inputValue;
      const normalizedName = isLatinScript(name) ? name.toLowerCase() : name;
      const normalizedCode = isLatinScript(code) ? code.toLowerCase() : code;
      return normalizedName.includes(normalizedInput) || normalizedCode && normalizedCode.includes(normalizedInput);
    });
  };
  const handleFocus = () => {
    setPopupClosedByEscape(false);
  };
  return /*#__PURE__*/jsxRuntime.jsx(material.Autocomplete, {
    autoHighlight: true,
    disabled: disabled,
    size: "small",
    PaperComponent: ({
      children
    }) => /*#__PURE__*/jsxRuntime.jsx(material.Paper, {
      style: {
        minWidth: "150px",
        maxWidth: "300px"
      },
      children: children
    }),
    sx: {
      width: width + ColumnSpan * 50
    }
    //freeSolo
    ,
    id: autoId,
    options: Menu,
    getOptionLabel: option => option?.Name || formData[formDataName] || "",
    value: formData[formDataName] ?? "",
    inputValue: searchkey,
    onChange: handleAutocompleteChange,
    onFocus: handleFocus
    //openOnFocus={true} // Automatically open dropdown on focus
    ,
    onBlur: handleBlur,
    filterOptions: filterOptions,
    disableClearable: !formData[formDataiId],
    onInputChange: handleInputChange,
    onHighlightChange: (event, option) => {
      if (option !== highlightRef.current) {
        highlightRef.current = option; // Update ref without re-rendering
      }
    },
    renderOption: (props, option) => /*#__PURE__*/React.createElement("li", {
      ...props,
      key: option.Id
    }, /*#__PURE__*/jsxRuntime.jsxs("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // Align items vertically for better layout
        width: "100%",
        gap: 1 // Add gap between Name and Code
      },
      children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
        style: {
          fontSize: "12px",
          flex: 1,
          textAlign: "left"
        },
        children: option?.Name
      }), /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
        style: {
          fontSize: "12px",
          flex: 1,
          textAlign: "right"
        },
        children: option?.Code
      })]
    })),
    renderInput: params => /*#__PURE__*/jsxRuntime.jsx(material.TextField, {
      required: required,
      label: label,
      ...params,
      disabled: disabled,
      inputProps: {
        ...params.inputProps,
        autoComplete: "off",
        // disable autocomplete and autofill
        // readOnly: !!formData[formDataiId],//newly added to avoid overflow when a selection and try to type after that
        style: {
          borderColor: "transparent",
          borderStyle: "solid",
          fontSize: "12px",
          height: "18px",
          padding: "0px 10px 0px 10px",
          margin: 0,
          color: "inherit"
        },
        inputProps: {
          style: {
            direction: direction  // Default to LTR if direction is not found
            // Default to inherit if fontFamily is not found
          }
        },
        onKeyDown: event => {
          if (event.key === "F2") {
            const updatedFormData = {
              ...formData,
              [formDataName]: "",
              [formDataiId]: 0
            };
            setFormData(updatedFormData);
            setsearchkey("");
            event.preventDefault();
          }
          if (event.key === "Escape") {
            setPopupClosedByEscape(true);
            highlightRef.current = null;
            return; // Allow the default behavior to close the popup
          }
          if (event.key === "Tab" && !popupClosedByEscape && !highlightRef.current && searchkey && Menu.length > 0) {
            const filteredOptions = filterOptions(Menu, {
              inputValue: searchkey
            });
            if (filteredOptions.length > 0) {
              highlightRef.current = filteredOptions[0];
            }
          }
          if (event.key === "Tab" || event.key === "Enter") {
            // Select the currently highlighted option
            if (highlightRef.current) {
              const newValue = highlightRef.current;
              if (newValue && newValue.Id === formData[formDataiId] && newValue.Name === formData[formDataName]) {
                return;
              }

              // Set the form data directly with the highlighted option
              setFormData({
                ...formData,
                [formDataName]: newValue?.Name,
                [formDataiId]: newValue?.Id
              });

              // Update the value directly
              setsearchkey(newValue?.Name || "");
            }
            setTimeout(() => {
              event.target.blur(); // Move focus to the next field
            }, 0);
            event.preventDefault();
          }
        }
      },
      InputLabelProps: {
        style: {
          fontSize: "14px",
          padding: "0 0px",
          zIndex: 1
        },
        sx: {
          textAlign: "left",
          right: "auto"
        }
      },
      sx: {
        paddingTop: tableField ? "0px" : "16px",
        minWidth: width + ColumnSpan * 50,
        // "@media (max-width: 360px)": {
        //   width: 220, // Reduced width for small screens
        // },
        "& .MuiOutlinedInput-input": {
          padding: "2px 2px ",
          transform: "translate(-1px, 0px) scale(1)",
          textAlign: "left"
        },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem"
        },
        "& .MuiInputLabel-outlined": {
          transform: "translate(14px, 22px) scale(0.85)"
        },
        "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
          // transform: "translate(14px, 7px) scale(0.75)",
          transform: "translate(14px, 7px) scale(0.75)",
          // Adjust label position when focused
          padding: "0px 2px",
          color: "inherit"
        },
        "& .MuiOutlinedInput-root": {
          height: 30,
          // Adjust the height of the input area
          display: "flex",
          flexDirection: "row",
          "& .MuiAutocomplete-endAdornment": {
            right: 0,
            // Position icons on the left in RTL
            left: "auto" // Swap the position of the icons
          },
          "& fieldset": {
            borderColor: `#ddd`,
            textAlign: "left"
          },
          "&:hover fieldset": {
            borderColor: "currentColor" // Keeps the border color on hover
          },
          "&.Mui-focused fieldset": {
            borderColor: "currentColor" // Keeps the current border color
          },
          "& legend": {
            width: "max-content" // Let legend adjust width in RTL
          },
          "& .MuiSvgIcon-root": {
            marginRight: 0,
            marginLeft: "auto" // Adjust icon spacing
          }
        },
        "& .MuiInputLabel-root": {
          color: "inherit",
          fontSize: "14px",
          transform: null // Adjust label position when not focused
        }
      }
    }),
    ListboxComponent: CustomListBox
  }, `${label}_${autoCompleteKey}`);
};

const errorMessages$1 = {
  minimumValue: "minimumValue",
  maximumValue: "maximumValue",
  invalidInteger: "invalidInteger",
  invalidNumber: "invalidNumber",
  allowNegative: "allowNegative",
  specialCharacter: "specialCharacter",
  regexFailed: "regexFailed",
  integerRange: "integerRange",
  maxSize: "maxSize"
};
const validateInput = ({
  type,
  value,
  minimumValue,
  maximumValue,
  allowNegative,
  regularExpression,
  donotAllowSpecialChar,
  languageName = "english",
  maxSize
}) => {
  let newValue = value?.replace(/,/g, "") || ""; // Remove commas
  let error = null; // To hold the error message

  type = type?.toLowerCase();
  const regex = typeof regularExpression === 'string' ? new RegExp(regularExpression.replace(/\\\\/g, '\\')) // Replace double backslashes with a single backslash
  : regularExpression;
  const InputType = {
    numeric: "numeric",
    text: "text",
    tinyinteger: "tiny integer",
    smallinteger: "small integer",
    integer: "integer",
    biginteger: "big integer",
    date: "date",
    time: "time",
    datetime: "datetime",
    geography: "geography",
    boolean: "boolean",
    tag: "tag",
    password: "password"

    // Add other types as needed
  };
  const getIntegerRange = type => {
    switch (type) {
      case InputType.tinyinteger:
        return [-128, 127];
      // 8-bit signed range
      case InputType.smallinteger:
        return [-32768, 32767];
      // 16-bit signed range (Int16)
      case InputType.integer:
        return [-2147483648, 2147483647];
      // 32-bit signed range (Int32)
      case InputType.biginteger:
        return [-9223372036854775808n, 9223372036854775807n];
      // 64-bit signed range (Int64)
      default:
        return [null, null];
      // No range for unrecognized types
    }
  };
  const validateSpecialChars = val => {
    if (donotAllowSpecialChar) {
      if (languageName === "english") {
        const englishRegex = /^[a-zA-Z0-9 ]*$/; // Alphanumeric and space for English
        return englishRegex.test(val);
      } else if (languageName === "arabic") {
        const arabicRegex = /^[\u0621-\u064A0-9 ]*$/; // Arabic characters, digits, and space
        return arabicRegex.test(val);
      }
    }
    return true; // Allow special characters if true
  };
  if (type === InputType.numeric) {
    // Handle numeric values
    newValue = parseFloat(newValue);
    if (!allowNegative && newValue < 0) {
      return errorMessages$1.allowNegative;
    }
    if (minimumValue != null && newValue < minimumValue) {
      return errorMessages$1.minimumValue;
    }
    if (maximumValue != null && newValue > maximumValue) {
      return errorMessages$1.maximumValue;
    }
    if (regularExpression && newValue) {
      if (!regex.test(newValue)) {
        return errorMessages$1.regexFailed;
      }
    }
    return "noError";
  }
  if ([InputType.tinyinteger, InputType.smallinteger, InputType.integer].includes(type)) {
    // Handle integer types
    newValue = parseInt(newValue, 10);
    if (!allowNegative && newValue < 0) {
      return errorMessages$1.allowNegative;
    }
    if (minimumValue != null && newValue < minimumValue) {
      return errorMessages$1.minimumValue;
    }
    if (maximumValue != null && newValue > maximumValue) {
      return errorMessages$1.maximumValue;
    }
    const [minValue, maxValue] = getIntegerRange(type);
    if (newValue < minValue || newValue > maxValue) {
      return errorMessages$1.integerRange;
    }
    return "noError";
  }
  if (type === InputType.biginteger) {
    // Handle big integer types
    try {
      newValue = BigInt(newValue);
      if (!allowNegative && newValue < 0) {
        return errorMessages$1.allowNegative;
      }
      if (minimumValue !== null && newValue < BigInt(minimumValue)) return errorMessages$1.minimumValue;
      if (maximumValue !== null && newValue > BigInt(maximumValue)) return errorMessages$1.maximumValue;
      const [minValue, maxValue] = getIntegerRange(type);
      if (newValue < minValue || newValue > maxValue) {
        return errorMessages$1.integerRange;
      }
      return "noError";
    } catch {
      return errorMessages$1.invalidInteger;
    }
  }
  if (type === "text") {
    // Handle text input
    if (donotAllowSpecialChar && !validateSpecialChars(newValue)) return errorMessages$1.specialCharacter;
    if (regularExpression) {
      if (!regex.test(newValue)) {
        return errorMessages$1.regularExpression;
      }
    }
    if (maxSize && newValue.length > maxSize) {
      return errorMessages$1.maxSize;
    }
    return "noError";
  }

  // Return the validated value and error (null if no error)
  return {
    newValue,
    error
  };
};

const CustomTextField = system.styled(material.TextField)({
  "& .MuiInputBase-root": {
    "& textarea": {
      "&::-webkit-scrollbar": {
        width: "6px" // Adjust the width as needed
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        // Adjust the color as needed
        borderRadius: "3px",
        // Adjust the border radius as needed
        cursor: "pointer"
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "rgba(0, 0, 0, 0.1)" // Adjust the track color as needed
      },
      // Dark mode specific styles
      '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
        backgroundColor: "rgba(255, 255, 255, 0.2)" // Adjust the color as needed
      },
      '&[data-mode="dark"]::-webkit-scrollbar-track': {
        backgroundColor: "rgba(255, 255, 255, 0.1)" // Adjust the track color as needed
      }
    }
  }
});
const errorMessages = {
  minimumValue: "minimumValue",
  maximumValue: "maximumValue",
  invalidInteger: "invalidInteger",
  invalidNumber: "invalidNumber",
  allowNegative: "allowNegative",
  specialCharacter: "specialCharacter",
  regexFailed: "regexFailed",
  integerRange: "integerRange",
  maxSize: "maxSize"
};
function InputCommon({
  key1,
  name,
  label,
  type,
  disabled,
  value,
  setValue,
  width = 250,
  multiline,
  mandatory,
  onBlur,
  maxLength,
  onClick,
  AllowNegative,
  DefaultValue,
  ErrorMessage,
  languageName,
  ColumnSpan = 0,
  RowSpan = 1,
  CharacterCasing,
  RegularExpression,
  MinimumValue,
  MaximumValue,
  dateType,
  DonotAllowSpecialChar,
  tableField = false,
  hardRefresh = false,
  trigger,
  DecimalPoints,
  onKeyDown
}) {
  const {
    showAlert
  } = useAlert();
  const [inputValue, setInputValue] = React.useState(value || "");
  const [isBlurred, setIsBlurred] = React.useState(false);
  const [fieldKey, setFieldKey] = React.useState(0);
  type = type?.toLowerCase();
  const InputType = {
    numeric: "numeric",
    text: "text",
    tinyinteger: "tiny integer",
    smallinteger: "small integer",
    integer: "integer",
    biginteger: "big integer",
    date: "date",
    time: "time",
    datetime: "datetime",
    geography: "geography",
    boolean: "boolean",
    tag: "tag",
    password: "password"

    // Add other types as needed
  };
  React.useEffect(() => {
    if (hardRefresh) {
      setFieldKey(fieldKey + 1);
      if (!value) {
        setInputValue("");
      } else {
        setInputValue(value);
      }
    }
  }, [trigger]);
  const validateSpecialChars = val => {
    if (DonotAllowSpecialChar) {
      if (languageName?.toLowerCase() === "english") {
        const englishRegex = /^[a-zA-Z0-9 ]*$/; // Alphanumeric and space for English
        return englishRegex.test(val);
      } else if (languageName?.toLowerCase() === "arabic") {
        const arabicRegex = /^[\u0621-\u064A0-9 ]*$/; // Arabic characters, digits, and space
        return arabicRegex.test(val);
      }
    }
    return true; // Allow special characters if true
  };

  // Convert RegularExpression string to RegExp object if it's a string
  const regex = typeof RegularExpression === "string" ? new RegExp(RegularExpression?.replace(/\\\\/g, "\\")) // Replace double backslashes with a single backslash
  : RegularExpression;
  const getMaxFractionDigitsFromRegex = regexString => {
    const match = regexString?.match(/\.?\[0-9]{0,(\d+)}/);
    if (match && match[1]) {
      return parseInt(match[1], 10); // Return the number of decimal places
    }
    return 0; // Default to 0 if no decimal places are specified
  };
  React.useEffect(() => {
    let parentValue = value ?? null;
    if ([InputType.tinyinteger, InputType.smallinteger, InputType.biginteger, InputType.integer].includes(type) && parentValue !== null) {
      let formattedValue = "";
      formattedValue = parentValue !== null ? new Intl.NumberFormat("en-US", {
        style: "decimal",
        maximumFractionDigits: 0 // Max 0 decimal for integers, up to 8 for numeric
      }).format(parentValue) : "";
      setInputValue(formattedValue); // Set formatted value
    } else if (type == InputType.numeric) {
      let formattedValue = "";
      const regexString = RegularExpression?.toString();
      const maxFractionDigits = RegularExpression ? getMaxFractionDigitsFromRegex(regexString) : null;
      const fractionDigits = DecimalPoints ?? maxFractionDigits; // NEW
      formattedValue = parentValue !== null ? new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: Math.min(FixedValues.MinDisplayDecimals, fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals),
        maximumFractionDigits: fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals // Apply the same logic as minimumFractionDigits
      }).format(parentValue) : "";
      setInputValue(formattedValue);
    } else {
      setInputValue(parentValue); // Set default value if not provided
    }
  }, [value, type, languageName]);
  const handleBlurOrMouseLeave = event => {
    if (disabled) {
      return;
    }
    if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")) {
      let newValue = event?.target?.value || "";

      // Convert to number if type is number
      if (type === InputType.numeric) {
        const errorResponse = validateInput({
          type,
          value: event?.target?.value ?? "",
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative,
          // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar
        });
        let newValue = event?.target?.value.replace(/,/g, "") || "";
        newValue = parseFloat(newValue);
        if (errorResponse == errorMessages.minimumValue) {
          showAlert("info", `Minimum value is ${MinimumValue}`);
          newValue = parseFloat(MinimumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.maximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          newValue = parseFloat(MaximumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.allowNegative) {
          showAlert("info", `Negative value not allowed`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.regexFailed) {
          //showAlert("info", `Regular expresion mismatch`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }

        // if (isNaN(newValue)) newValue =null;
        if (isNaN(newValue) || newValue === "") newValue = null;
        const regexString = RegularExpression?.toString();
        const maxFractionDigits = RegularExpression ? getMaxFractionDigitsFromRegex(regexString) : null;
        const fractionDigits = DecimalPoints ?? maxFractionDigits; // NEW
        setValue({
          name,
          value: newValue ?? 0
        });
        const formattedValue = newValue !== null ? new Intl.NumberFormat("en-US", {
          style: "decimal",
          minimumFractionDigits: Math.min(FixedValues.MinDisplayDecimals, fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals),
          maximumFractionDigits: fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals // Apply the same logic as minimumFractionDigits
        }).format(newValue) : "";
        setInputValue(formattedValue?.toString());
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
        return;
      }
      // Convert to integer if field type is integer
      if ([InputType.tinyinteger, InputType.smallinteger, InputType.integer].includes(type)) {
        const errorResponse = validateInput({
          type,
          value: event?.target?.value ?? "",
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative,
          // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar
        });
        let newValue = event?.target?.value.replace(/,/g, "") || "";
        newValue = parseInt(newValue, 10);
        if (errorResponse == errorMessages.minimumValue) {
          showAlert("info", `Minimum value is : ${MinimumValue}`);
          newValue = parseInt(MinimumValue, 10);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.maximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          newValue = parseFloat(MaximumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.allowNegative) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.integerRange) {
          showAlert("info", `Value should be with in [${minValue},${maxValue}]`);
          newValue = "";
        }
        // if (isNaN(newValue)) newValue = null; // Reset if not a valid number
        if (isNaN(newValue) || newValue === "") newValue = null;
        setValue({
          name,
          value: newValue ?? 0
        });
        // Reformat with `Intl.NumberFormat`
        const formattedValue = newValue !== null ? new Intl.NumberFormat("en-US", {
          style: "decimal",
          maximumFractionDigits: 0
        }).format(newValue) : "";
        setInputValue(formattedValue);
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
        return;
      }
      if (type === InputType.biginteger) {
        let newValue = event?.target?.value || "";
        const errorResponse = validateInput({
          type,
          value: newValue,
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative,
          // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar
        });
        if (newValue) {
          // Remove commas and ensure valid negative number formatting
          newValue = newValue.replace(/,/g, "");

          // Check if the value is a negative number or not
          const isNegative = newValue.startsWith("-");
          if (isNegative) {
            newValue = "-" + newValue.replace(/-/g, ""); // Retain only the first `-` sign
          }
          try {
            newValue = BigInt(newValue);
            if (errorResponse == errorMessages.minimumValue) {
              showAlert("info", `Minimum value is : ${MinimumValue}`);
              newValue = BigInt(MinimumValue);
              // return;  // Prevent updating the value when less than MinimumValue
            }
            if (errorResponse == errorMessages.maximumValue) {
              showAlert("info", `Maximum value is : ${MaximumValue}`);
              newValue = BigInt(MaximumValue);
              // return;  // Prevent updating the value when less than MinimumValue
            }
            if (errorResponse == errorMessages.allowNegative) {
              showAlert("info", `Negative values not allowed`);
              newValue = "";
              // return;  // Prevent updating the value when less than MinimumValue
            }
            if (errorResponse == errorMessages.integerRange) {
              showAlert("info", `Value should be with in [${minValue},${maxValue}]`);
              newValue = "";
            }
            newValue = Number(newValue);

            // if (isNaN(newValue)) newValue = null; // Reset if not a valid number
            if (newValue === "") newValue = null;
            setValue({
              name,
              value: newValue ?? 0
            });
            newValue = newValue?.toString();

            // Reformat with `Intl.NumberFormat`
            const formattedValue = newValue !== null ? new Intl.NumberFormat("en-US", {
              style: "decimal",
              maximumFractionDigits: 0
            }).format(newValue) : "";
            setInputValue(formattedValue);
            setFieldKey(fieldKey + 1);
            if (onBlur && !disabled && !isBlurred) {
              onBlur(newValue); // Call the onBlur prop function
              setIsBlurred(true); // Set blurred state to true
            }
          } catch {
            setValue({
              name,
              value: 0
            });
            setInputValue(null);
            setFieldKey(fieldKey + 1);
            if (onBlur && !disabled && !isBlurred) {
              onBlur(newValue); // Call the onBlur prop function
              setIsBlurred(true); // Set blurred state to true
            }
          }
        } else {
          setValue({
            name,
            value: 0
          });
          setInputValue(null);
          setFieldKey(fieldKey + 1);
          if (onBlur && !disabled && !isBlurred) {
            onBlur(newValue); // Call the onBlur prop function
            setIsBlurred(true); // Set blurred state to true
          }
        }
        return;
      }
      if (type === InputType.text) {
        const errorResponse = validateInput({
          type,
          value: event?.target?.value ?? "",
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative,
          // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar,
          maxSize: maxLength,
          languageName: languageName?.toLowerCase()
        });
        if (errorResponse == errorMessages.specialCharacter) {
          showAlert("info", `special characters not allowed`);
          newValue = ""; // Reset value if invalid
        }
        if (errorResponse == errorMessages.maxSize) {
          newValue = newValue.substring(0, maxLength); // Truncate to max length
          showAlert("info", `maximum length reached`);
        }
        // Regular expression validation for text fields
        if (RegularExpression) {
          if (errorResponse == errorMessages.regexFailed) {
            //showAlert("info", `regular expression mismatch`);
            newValue = "";
            // return;  // Prevent updating the value when less than MinimumValue
          }
        }
      }
      if (type == InputType.date) {
        newValue = newValue ? newValue : null; // Default to today's date
      }
      if (type == InputType.time) {
        newValue = newValue ? newValue : null; // Default to today's date
      }
      if (type == InputType.datetime) {
        newValue = newValue ? newValue : null; // Default to today's date
      }
      setValue({
        name,
        value: newValue ?? ""
      });
      setInputValue(newValue);
      setFieldKey(fieldKey + 1);
      if (onBlur && !disabled && !isBlurred) {
        onBlur(newValue); // Call the onBlur prop function
        setIsBlurred(true); // Set blurred state to true
      }
    }
  };
  const getIntegerRange = (type, isSigned) => {
    switch (type.toLowerCase()) {
      case InputType.tinyinteger:
        return [-128, 127];
      // 8-bit signed range
      case InputType.smallinteger:
        return [-32768, 32767];
      // 16-bit signed range (Int16)
      case InputType.integer:
        return [-2147483648, 2147483647];
      // 32-bit signed range (Int32)
      case InputType.biginteger:
        return [-9223372036854775808n, 9223372036854775807n];
      // 64-bit signed range (Int64)
      default:
        return [null, null];
      // No range for unrecognized types
    }
  };
  const handleChange = event => {
    if (disabled) {
      return;
    }
    setIsBlurred(false);
    if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")) {
      let newValue = event.target.value || null;

      // Apply character casing based on CharacterCasing prop
      if (type == InputType.text && newValue) {
        if (CharacterCasing === 1) {
          newValue = newValue.toUpperCase(); // Convert to uppercase
        } else if (CharacterCasing === 2) {
          newValue = newValue.toLowerCase(); // Convert to lowercase
        }
        if (!validateSpecialChars(newValue)) {
          showAlert("info", `special characters not allowed`);
          return;
        }
        // Enforce maxLength here
        if (maxLength && newValue.length > maxLength) {
          newValue = newValue.substring(0, maxLength); // Truncate to max length
          showAlert("info", `maximum length reached`);
        }
      }

      // Allow only integers if field type is integer
      // if (['tiny integer','small integer', 'big integer', 'integer'].includes(type) && newValue && !AllowNegative && newValue < 0) {
      //   showAlert('info', 'Negative values are not allowed');
      //   newValue = 0;
      // }
      if ([InputType.tinyinteger, InputType.smallinteger, InputType.integer].includes(type) && newValue) {
        newValue = newValue.replace(/,/g, "");
        if (!AllowNegative && parseInt(newValue, 10) < 0) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
        }
        // Allow only numbers and decimal points
        if (!/^[+-]?\d*\.?\d*$/.test(newValue)) {
          return; // Reject non-numeric characters
        }

        // Handle the edge case where newValue is just a minus sign "-"
        if (newValue === "-" || newValue === "") {
          setInputValue(newValue); // Let user continue typing for negative numbers
          return;
        }
        // Parse the value as an integer
        let parsedValue = parseInt(newValue, 10);
        if (isNaN(parsedValue)) {
          showAlert("info", `Invalid integer`);
          return;
        }

        // Get the valid range for the current type
        const [minValue, maxValue] = getIntegerRange(type);

        // Ensure the value is within the range
        if (parsedValue < minValue || parsedValue > maxValue) {
          showAlert("info", `Value should be with in [${minValue},${maxValue}]`);
          return;
        }
        if (MaximumValue != null && parsedValue > MaximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          return; // Prevent updating the value when greater than MaximumValue
        }
        // Set the parsed integer value

        // Format the value using `Intl.NumberFormat`
        const formattedValue = newValue !== null ? new Intl.NumberFormat("en-US", {
          style: "decimal",
          maximumFractionDigits: 0
        }).format(parsedValue) : "";
        newValue = formattedValue?.toString();
        setInputValue(formattedValue); // Update formatted value locally
      }
      if (type === InputType.biginteger && newValue) {
        newValue = newValue.replace(/,/g, "");
        if (!AllowNegative && newValue < 0) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
        }
        if (!/^[+-]?\d*$/.test(newValue)) {
          return; // Reject non-numeric characters
        }
        if (newValue === "-" || newValue === "") {
          setInputValue(newValue); // Let user continue typing for negative numbers
          return;
        }

        // Parse the value as an integer
        let parsedValue = BigInt(newValue);

        // Get the valid range for the current type
        const [minValue, maxValue] = getIntegerRange(type);

        // Ensure the value is within the range
        if (parsedValue < BigInt(minValue) || parsedValue > BigInt(maxValue)) {
          showAlert("info", `Value should be with in [${minValue},${maxValue}]`);
          return;
        }
        if (MaximumValue != null && parsedValue > MaximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          return; // Prevent updating the value when greater than MaximumValue
        }

        // Set the parsed integer value

        // Format the value using `Intl.NumberFormat`
        const formattedValue = newValue !== null ? new Intl.NumberFormat("en-US", {
          style: "decimal",
          maximumFractionDigits: 0
        }).format(parsedValue) : "";
        newValue = formattedValue?.toString();
        setInputValue(formattedValue); // Update formatted value locally
      }

      // Handle numeric input with decimals based on RegularExpression
      if (type === InputType.numeric && newValue) {
        newValue = newValue.replace(/,/g, "");
        if (!AllowNegative && parseFloat(newValue) < 0) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
        }
        // Allow only valid numeric values, including a single decimal point
        if (!/^[+-]?\d*\.?\d*$/.test(newValue)) {
          return; // Reject non-numeric characters
        }
        if (newValue === "-" || newValue === "") {
          setInputValue(newValue); // Let user continue typing for negative numbers
          return;
        }
        if (newValue.slice(-1) === ".") {
          // Format the integer part before the decimal, but keep the decimal point
          const integerPart = newValue.slice(0, -1).replace(/,/g, ""); // Remove commas
          const formattedIntegerPart = new Intl.NumberFormat("en-US", {
            style: "decimal"
          }).format(integerPart);

          // Set the input value with the formatted integer part and the decimal point
          setInputValue(`${formattedIntegerPart}.`); // Append the decimal point
          return; // Skip further validation to allow the decimal point input
        }

        // Handle case where the last character is a '0' after a decimal point
        if (newValue.includes(".") && newValue.slice(-1) === "0") {
          const parts = newValue.split(".");
          const integerPart = parts[0].replace(/,/g, ""); // Get the integer part
          const formattedIntegerPart = new Intl.NumberFormat("en-US", {
            style: "decimal"
          }).format(integerPart);

          // Set the input value with the formatted integer part and the decimal portion
          setInputValue(`${formattedIntegerPart}.${parts[1]}`); // Append the decimal portion including any trailing zeros
          return; // Skip further validation to allow the decimal input
        }
        const regexString = RegularExpression?.toString();
        const maxFractionDigits = RegularExpression ? getMaxFractionDigitsFromRegex(regexString) : null;

        // Check if regular expression is provided for decimal precision
        if (RegularExpression && maxFractionDigits) {
          if (!regex.test(newValue)) {
            //showAlert("info", `regular expression mismatch`);
            return; // Reset value if it doesn't match the regular expression
          }
        }
        if (MaximumValue != null && newValue && parseFloat(newValue) > MaximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          // Remove the last character from newValue until it fits the range
          while (parseFloat(newValue) > MaximumValue) {
            newValue = newValue.slice(0, -1); // Remove last character
          }
        }
        const formattedValue = newValue !== null ? new Intl.NumberFormat(
        //here take only regex rounding qty only. not consider decimal DecimalPoints
        "en-US", {
          style: "decimal",
          minimumFractionDigits: 0,
          // Minimum fraction digits
          maximumFractionDigits: maxFractionDigits > 0 ? maxFractionDigits : FixedValues.DisplayDecimals // Apply the same logic as minimumFractionDigits
        }).format(newValue?.toString()) : "";

        // newValue = parseFloat(newValue); // Convert to float
        newValue = formattedValue?.toString();
      }
      setInputValue(newValue); // Update local state
    }
  };
  const direction = "ltr";

  // Determine the autoComplete value
  const autoCompleteValue = type == InputType.password ? "new-password" : "off";
  //Handle InputTag Type
  const getInputType = fieldType => {
    switch (fieldType) {
      case InputType.text:
        return "text";
      // For normal text input
      case InputType.numeric:
        return "text";
      case InputType.biginteger:
        return "text";
      case InputType.tinyinteger:
        return "text";
      case InputType.smallinteger:
        return "text";
      case InputType.integer:
        return "text";
      case InputType.date:
        return "date";
      case InputType.time:
        return "time";
      case InputType.datetime:
        return "datetime-local";
      case InputType.password:
        return "password";
      default:
        return "text";
      // Default to text if not recognized
    }
  };
  window.innerWidth || document.documentElement.clientWidth;

  //#region  Date view
  // Helper function to get formatted date in yyyy-mm-dd
  const getFormattedDate = date => {
    return date.toLocaleDateString("en-CA");
  };

  // Determine today's date and previous/next day dates
  const today = new Date();
  const todayDate = getFormattedDate(today); // Today's date in yyyy-mm-dd format

  // Calculate previous day and next day dates
  const nextDayDate = getFormattedDate(new Date(today.setDate(today.getDate() + 1))); // Tomorrow's date
  today.setDate(today.getDate() - 2); // Set to the day before today
  const previousDayDate = getFormattedDate(today); // Yesterday's date

  // Determine the `min` and `max` based on `dateType`
  let minDate, maxDate;
  switch (dateType) {
    case 1:
      // Allow only future dates
      minDate = nextDayDate;
      maxDate = undefined;
      break;
    case 2:
      // Allow only past dates
      minDate = undefined;
      maxDate = previousDayDate;
      break;
    case 3:
      // Allow only today's date
      minDate = todayDate;
      maxDate = todayDate;
      break;
    case 4:
      // Allow future dates including today
      minDate = todayDate;
      maxDate = undefined;
      break;
    case 5:
      // Allow past dates including today
      minDate = undefined;
      maxDate = todayDate;
      break;
    default:
      minDate = undefined;
      maxDate = undefined;
      break;
  }
  //#endregion date view

  //#region Datetime

  // Helper function to format datetime in 'YYYY-MM-DDTHH:MM' format
  const getFormattedDateTime = date => {
    const pad = number => number < 10 ? `0${number}` : number;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Calculate the base datetime for today
  const now = new Date();
  const todayDateTime = getFormattedDateTime(now);

  // Calculate next day's datetime (for future dates)
  const nextDay = new Date();
  nextDay.setDate(now.getDate() + 1);
  const nextDayDateTime = getFormattedDateTime(nextDay); // Tomorrow's date-time

  // Calculate previous day's datetime (for past dates)
  const previousDay = new Date();
  previousDay.setDate(now.getDate() - 1);
  const previousDayDateTime = getFormattedDateTime(previousDay); // Yesterday's date-time

  // Determine the `min` and `max` values based on `dateType`
  let minDateTime, maxDateTime;
  switch (dateType) {
    case 1:
      // Allow only future dates (excluding today)
      minDateTime = nextDayDateTime;
      maxDateTime = undefined;
      break;
    case 2:
      // Allow only past dates (excluding today)
      minDateTime = undefined;
      maxDateTime = previousDayDateTime;
      break;
    case 3:
      // Allow only today's datetime
      minDateTime = todayDateTime;
      maxDateTime = todayDateTime;
      break;
    case 4:
      // Allow future dates including today
      minDateTime = todayDateTime;
      maxDateTime = undefined;
      break;
    case 5:
      // Allow past dates including today
      minDateTime = undefined;
      maxDateTime = todayDateTime;
      break;
    default:
      minDateTime = undefined;
      maxDateTime = undefined;
      break;
  }
  return /*#__PURE__*/jsxRuntime.jsx(CustomTextField, {
    margin: tableField ? undefined : "normal",
    size: "small",
    id: name
    // value={
    //   (type == InputType.date || type == InputType.time || type == InputType.datetime) && !inputValue
    //     ? " "
    //     : inputValue ?? ""
    // }
    ,
    value: inputValue ?? "",
    type: getInputType(type),
    label: label,
    maxLength: maxLength,
    required: !!mandatory,
    multiline: multiline && (getInputType(type) == "text" || getInputType(type) == "number") ? multiline : null,
    rows: multiline && (getInputType(type) == "text" || getInputType(type) == "number") ? RowSpan : null,
    autoComplete: autoCompleteValue,
    disabled: disabled,
    onChange: handleChange,
    onClick: onClick,
    onKeyDown: onKeyDown,
    onBlur: handleBlurOrMouseLeave // this always required as to set value to parent when on blur
    //onMouseLeave={onBlur ? handleBlurOrMouseLeave : undefined}// only when onblur action in parent
    ,
    InputProps: {
      inputProps: {
        autoComplete: autoCompleteValue,
        ...(type == InputType.date ? {
          min: minDate,
          max: maxDate,
          onKeyDown: e => {
            // Only trigger the date picker when Enter or Space is pressed
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.target.showPicker?.();
            }
          }

          //onFocus: (e) => e.target.showPicker?.(),
          //onClick: (e) => e.target.showPicker?.(),
        } : type == InputType.time ? {
          step: 1,
          // Allows time input in HH:mm:ss format
          onKeyDown: e => {
            // Prevent default only for keys other than Tab

            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.target.showPicker?.();
            }
          }

          //onFocus: (e) => e.target.showPicker?.(),
          //onClick: (e) => e.target.showPicker?.(),
        } : type == InputType.datetime ? {
          step: 1,
          // For precise datetime input including seconds
          onKeyDown: e => {
            // Disable manual typing for datetime fields
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.target.showPicker?.();
            }
          },
          //onFocus: (e) => e.target.showPicker?.(),
          //onClick: (e) => e.target.showPicker?.(),
          min: minDateTime || undefined,
          // Set min to restrict future dates
          max: maxDateTime || undefined // Set max if needed for past dates
        } : [InputType.numeric, InputType.tinyinteger, InputType.smallinteger, InputType.integer, InputType.biginteger].includes(type) ? {
          onFocus: e => {
            // If the field is numeric and its current value is "0" or "0.00", clear it
            if (parseFloat(e.target.value) === 0) {
              setInputValue("");
              // Force cursor to the start
              requestAnimationFrame(() => e.target.setSelectionRange(0, 0));
            }
          }
        } : {}),
        style: {
          direction: type == InputType.text ? direction : "ltr",
          // Default to LTR if direction is not found
          fontFamily: "inherit" // Default to inherit if fontFamily is not found
        }
      },
      endAdornment: type == InputType.time && inputValue ? /*#__PURE__*/jsxRuntime.jsx(material.InputAdornment, {
        position: "end",
        children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
          onClick: () => {
            setInputValue(""); // Clear the input value
            setValue({
              name,
              value: null
            }); // Update the parent state
          },
          edge: "end",
          "aria-label": "clear time",
          tabIndex: -1 // Prevents Tab from focusing on this icon
          ,
          children: /*#__PURE__*/jsxRuntime.jsx(ClearIcon__default["default"], {
            fontSize: "small"
          })
        })
      }) : null,
      sx: {
        '& input[type="date"]::-webkit-calendar-picker-indicator': {
          filter: "invert(0)"
        },
        '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
          filter: "invert(0)"
        },
        '& input[type="time"]::-webkit-calendar-picker-indicator': {
          filter: "invert(0)" // Ensures visibility in dark mode
        }
      }
    },
    InputLabelProps: {
      shrink: !value || !!inputValue || type === "date" || type === "time",
      // Shrink the label if it's a password field and has a value
      sx: {
        textAlign: "left",
        right: "auto"
      }
    },
    sx: {
      minWidth: width + ColumnSpan * 50,
      // Adjust the width as needed
      // "@media (max-width: 360px)": {
      //       width: 220, // Reduced width for small screens
      //     },
      "& .MuiInputBase-root": {
        ...(multiline && (getInputType(type) == "text" || getInputType(type) == "number") ? {} : {
          height: 30
        }),
        // Adjust the height of the input area if not multiline
        "& textarea": {
          "&::-webkit-scrollbar": {
            width: "6px" // Adjust the width as needed
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            // Adjust the color as needed
            borderRadius: "3px",
            // Adjust the border radius as needed
            cursor: "pointer"
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(0, 0, 0, 0.1)" // Adjust the track color as needed
          }
        }
      },
      "& .MuiInputLabel-root": {
        fontSize: "14px",
        transform: "translate(10px, 5px) scale(0.9)",
        // Adjust label position when not focused
        color: "inherit"
      },
      "& .MuiInputLabel-shrink": {
        transform: "translate(14px, -9px) scale(0.75)" // Adjust label position when focused
        // right:direction === 'rtl' ? -25:null,
        // top:direction === 'rtl' ? -8:null
      },
      "& .MuiInputBase-input": {
        fontSize: "0.75rem",
        // Adjust the font size of the input text
        color: "inherit"
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "currentColor" // Keeps the current border color
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "currentColor" // Optional: Keeps the border color on hover
      },
      "& .MuiFormLabel-root.Mui-focused": {
        color: "inherit" // Ensure the label color when focused
      },
      "& .MuiOutlinedInput-root": {
        "& fieldset": {
          borderColor: "#ddd",
          textAlign: "left"
        },
        "&:hover fieldset": {
          borderColor: "currentColor" // Keeps the border color on hover
        },
        "&.Mui-focused fieldset": {
          borderColor: "currentColor" // Keeps the current border color
        },
        "& legend": {
          width: "max-content" // Let legend adjust width in RTL
        }
      }
    }
  }, fieldKey);
}

const UserPhotoUpload = ({
  formData,
  handleUploadClick,
  handleDeleteClick,
  uploadIconstyle,
  field,
  label,
  disabled
}) => {
  //  image dailog
  const [openDialog, setOpenDialog] = React.useState(false);
  const [dialogImageSrc, setDialogImageSrc] = React.useState('');
  const handleClickOpen = imageUrl => {
    setOpenDialog(true);
    setDialogImageSrc(imageUrl);
  };
  const handleDialogClose = () => {
    setOpenDialog(false);
  };
  const getIconForField = field => {
    switch (field.toLowerCase()) {
      case "image":
      case "photo":
      case "user":
        return /*#__PURE__*/jsxRuntime.jsx(PersonIcon__default["default"], {
          style: {
            fontSize: "25px"
          }
        });
      case "signature":
        return /*#__PURE__*/jsxRuntime.jsx(BorderColorIcon__default["default"], {
          style: {
            fontSize: "25px"
          }
        });
      default:
        return /*#__PURE__*/jsxRuntime.jsx(CloudUploadIcon__default["default"], {
          style: {
            fontSize: "25px"
          }
        });
    }
  };
  const imageField = field + "_preview";
  return /*#__PURE__*/jsxRuntime.jsxs("div", {
    style: {
      width: 250,
      alignItems: "center",
      textAlign: "center"
    },
    children: [formData[imageField] ? /*#__PURE__*/jsxRuntime.jsxs("div", {
      style: {
        position: "relative"
      },
      children: [/*#__PURE__*/jsxRuntime.jsx("img", {
        src: formData[imageField],
        alt: "Upload",
        style: {
          width: "60px",
          height: "60px"
        },
        onClick: () => handleClickOpen(formData[imageField])
      }), /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
        title: `Delete ${label}`,
        arrow: true,
        children: /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
          onClick: handleDeleteClick(field) // Fixed invocation here
          ,
          style: {
            position: "absolute",
            right: -5,
            top: -10
          },
          disabled: disabled,
          children: /*#__PURE__*/jsxRuntime.jsx(DeleteIcon__default["default"], {})
        })
      })]
    }) : /*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
      onClick: handleUploadClick(field) // Fixed invocation here
      ,
      style: {
        color: secondaryColor
      },
      disabled: disabled,
      children: getIconForField(field)
    }), !formData[imageField] && /*#__PURE__*/jsxRuntime.jsxs(material.Typography, {
      sx: {
        fontSize: "12px",
        mt: 1
      },
      variant: "subtitle1",
      children: ["Add ", label]
    }), /*#__PURE__*/jsxRuntime.jsxs(material.Dialog, {
      open: openDialog,
      onClose: handleDialogClose,
      "aria-labelledby": "image-dialog-title",
      sx: {
        '& .MuiDialog-container': {
          '& .MuiPaper-root': {
            width: '60%',
            // Set the dialog width to 60% of the screen size
            maxHeight: '80vh'
          }
        }
      },
      children: [/*#__PURE__*/jsxRuntime.jsx(material.IconButton, {
        "aria-label": "close",
        onClick: handleDialogClose,
        sx: {
          position: 'absolute',
          right: 20,
          top: 8,
          color: "#FFF",
          backgroundColor: secondaryColor,
          '&:hover': {
            // Overrides the default hover style
            backgroundColor: secondaryColor,
            // Keeps the same background color on hover
            // Optionally, you can adjust the opacity to 1 if it still fades
            opacity: 1
          }
        },
        children: /*#__PURE__*/jsxRuntime.jsx(CloseIcon__default["default"], {})
      }), /*#__PURE__*/jsxRuntime.jsx(material.DialogContent, {
        dividers: true,
        children: /*#__PURE__*/jsxRuntime.jsx("img", {
          src: dialogImageSrc,
          alt: "Full Size",
          style: {
            width: '100%',
            height: 'auto'
          }
        })
      })]
    })]
  });
};

function encrypt(plainText, useDefaultEncryptKey = true) {
  // Ensure the encryption key matches the one used in .NET (UTF-8 encoded)
  const key = CryptoJS__default["default"].enc.Utf8.parse(getEncryptionKey(useDefaultEncryptKey));

  // Use a 16-byte IV of all zeros, which matches the .NET code (aes.IV = new byte[16];)
  const iv = CryptoJS__default["default"].enc.Utf8.parse('\0'.repeat(16));

  // Perform AES encryption with CBC mode and PKCS#7 padding (same as in .NET)
  const encrypted = CryptoJS__default["default"].AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS__default["default"].mode.CBC,
    padding: CryptoJS__default["default"].pad.Pkcs7
  });

  // Convert the ciphertext to a Base64 string to match .NET's Convert.ToBase64String
  return encrypted.toString();
}
function getEncryptionKey(useDefaultEncryptKey = true) {
  // Use the same encryption key logic as in the .NET code
  return useDefaultEncryptKey ? "a8h3GZ9KsNp5Rv2t" // Example key, replace with actual key
  : "a8h3GZ9KsNp5Rv2t";
}

function ResetPasswordAlert({
  handleClose,
  open,
  detailPageId,
  passwordPolicy
}) {
  const {
    updateuserpassword
  } = securityApis();
  material.useTheme();
  const {
    showAlert
  } = useAlert();
  const [formData, setFormData] = React.useState({
    password: "",
    CPassword: ""
  });
  const handleResetPassword = async () => {
    if (!formData?.password) {
      showAlert("info", "Please Provide new password");
      return;
    }
    // if (
    //   !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])[^\s]{6,}$/.test(
    //     formData.password
    //   )
    // ) {
    //   showAlert(
    //     "info",
    //     `Password must be at least 6 characters long and include at least one letter, one number, and one special character.`
    //   );
    //   return;
    // }
    const regex = new RegExp(passwordPolicy?.PolicyRegExp ?? "^.*$");
    if (!regex.test(formData.password)) {
      showAlert("info", passwordPolicy?.Description || "Password does not meet the required policy.");
      return;
    }
    if (passwordPolicy?.MinLength > 0 && formData.password.length < passwordPolicy.MinLength) {
      showAlert("info", `Password must be at least ${passwordPolicy.MinLength} characters long.`);
      return;
    }
    if (formData.password !== formData.CPassword) {
      showAlert("info", `Password and Confirm Password mismatch`);
      return;
    }

    //const encryptedNewPassword = await encrypt(formData?.password);
    const saveData = {
      be: 1,
      Password: encrypt(formData?.password),
      UserId: detailPageId
    };
    const response = await updateuserpassword(saveData);
    if (response?.status === "Success") {
      showAlert("success", response?.message);
      handleClose();
      setFormData({
        userId: 0,
        password: ""
      });
    }
  };
  const PasswordTooltip = () => /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
    sx: {
      p: 0.5
    },
    children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
      sx: {
        fontSize: "12px"
      },
      children: passwordPolicy?.Description || "No password policy set"
    }), passwordPolicy?.MinLength > 0 && /*#__PURE__*/jsxRuntime.jsxs(material.Typography, {
      sx: {
        fontSize: "12px"
      },
      children: ["Minimum Length: ", passwordPolicy.MinLength]
    })]
  });
  React.useEffect(() => {
    setFormData({
      userId: 0,
      password: "",
      CPassword: ""
    });
  }, [open]);
  return /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModal, {
      open: open,
      onClose: () => handleClose(0),
      tabIndex: "-1",
      centered: true,
      children: /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalDialog, {
        size: "md",
        style: {
          marginTop: '55px'
        },
        children: /*#__PURE__*/jsxRuntime.jsxs(mdbReactUiKit.MDBModalContent, {
          children: [/*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalHeader, {
            className: `bg-primary text-white d-flex justify-content-center`,
            children: /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBModalTitle, {
              children: "Reset Password"
            })
          }), /*#__PURE__*/jsxRuntime.jsxs(mdbReactUiKit.MDBModalBody, {
            className: "d-flex flex-column align-items-center",
            children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
              m: 0,
              color: "grey",
              children: "Enter the New Password"
            }), /*#__PURE__*/jsxRuntime.jsx("br", {}), /*#__PURE__*/jsxRuntime.jsx(material.TextField, {
              label: "New Password",
              name: "password",
              type: "password",
              size: "small",
              disabled: false,
              value: formData.password,
              onChange: e => setFormData({
                ...formData,
                password: e.target.value
              }),
              autoComplete: "off",
              InputProps: {
                endAdornment: /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
                  title: /*#__PURE__*/jsxRuntime.jsx(PasswordTooltip, {}),
                  arrow: true,
                  placement: "right",
                  children: /*#__PURE__*/jsxRuntime.jsx(material.Box, {
                    sx: {
                      cursor: "pointer",
                      color: "gray",
                      display: "flex",
                      alignItems: "center"
                    },
                    children: /*#__PURE__*/jsxRuntime.jsx("i", {
                      className: "fa-solid fa-circle-info",
                      style: {
                        fontSize: "16px"
                      }
                    })
                  })
                }),
                style: {
                  fontSize: "12px",
                  height: "30px"
                }
              },
              InputLabelProps: {
                style: {
                  fontSize: "14px"
                }
              },
              sx: {
                paddingTop: "16px",
                minWidth: "200px",
                "& .MuiInputLabel-outlined": {
                  transform: "translate(14px, 22px) scale(0.85)"
                },
                "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
                  transform: "translate(14px, 7px) scale(0.75)"
                },
                "& .MuiOutlinedInput-root": {
                  height: 30,
                  "& fieldset": {
                    borderColor: "#ddd"
                  },
                  "&:hover fieldset": {
                    borderColor: "currentColor"
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "currentColor"
                  }
                },
                "& .MuiInputLabel-root": {
                  color: "inherit",
                  fontSize: "14px"
                }
              }
            }), /*#__PURE__*/jsxRuntime.jsx(UserInputField, {
              label: "Confirm Password",
              name: "CPassword",
              type: "password",
              disabled: false,
              value: formData,
              setValue: setFormData
            })]
          }), /*#__PURE__*/jsxRuntime.jsxs(mdbReactUiKit.MDBModalFooter, {
            className: "d-flex justify-content-center",
            children: [/*#__PURE__*/jsxRuntime.jsxs(mdbReactUiKit.MDBBtn, {
              color: "secondary",
              onClick: handleClose,
              children: ["close", " "]
            }), /*#__PURE__*/jsxRuntime.jsx(mdbReactUiKit.MDBBtn, {
              onClick: handleResetPassword,
              color: "primary",
              children: "Reset"
            })]
          })]
        })
      })
    })
  });
}

const AutoComplete = ({
  apiKey,
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  required,
  languageId,
  disabled,
  params1,
  params2,
  params3,
  params3Value,
  params4,
  params4Value,
  params5,
  params5Value,
  refreshTrigger,
  languageName,
  ColumnSpan = 0,
  isSwitchable = false,
  tableField = false,
  screenTagId,
  handleClick,
  handleValidate,
  LinkTagId,
  detailScreeniId,
  width = isSwitchable && !disabled ? 220 : 250,
  setManualChange = () => {} // default empty function
}) => {
  const [iTypeF2, setiTypeF2] = React.useState(1);
  const [searchkey, setsearchkey] = React.useState("");
  const [Menu, setMenu] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [autoCompleteKey, setAutoCompleteKey] = React.useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = React.useState(false);
  const [toggleFocus, settoggleFocus] = React.useState(false);
  const direction = "ltr";
  const focusedRef = React.useRef(false); // Use ref to track focus state
  const highlightRef = React.useRef(false); // Separate ref to track component focus state
  const clearedManually = React.useRef(false); // Add this ref

  const handleAutocompleteChange = (event, newValue) => {
    if (disabled) {
      return;
    }
    if (newValue == null && handleValidate) {
      const canChange = handleValidate();
      if (canChange === false) {
        return; // Stop the change
      }
    }
    if (newValue && newValue.Id === formData[formDataiId] && newValue.Name === formData[formDataName]) {
      return;
    }
    const updatedFormData = {
      ...formData,
      [formDataName]: newValue ? newValue?.Name : "",
      [formDataiId]: newValue ? newValue?.Id : 0
    };
    setFormData(updatedFormData); // This will now update the parent's state
    setiTypeF2(1);
    highlightRef.current = false;
    setManualChange(true);
    setMenu([]);
    // Set cleared flag if clearing manually
    if (!newValue) {
      clearedManually.current = true;
      setTimeout(() => {
        clearedManually.current = false; // Reset after a delay
      }, 1000);
    }
  };
  const lastRequestId = React.useRef(0);
  const latest = React.useRef({});
  latest.current = {
    apiKey,
    params1,
    params2,
    params3,
    params3Value,
    params4,
    params4Value,
    params5,
    params5Value,
    languageId,
    iTypeF2
  };
  const debouncedFetchOptions = React.useMemo(() => lodash.debounce(async searchKey => {
    const {
      apiKey,
      params1,
      params2,
      params3,
      params3Value,
      params4,
      params4Value,
      params5,
      params5Value,
      languageId,
      iTypeF2
    } = latest.current;
    if (!focusedRef.current) {
      return; // Fetch only if the input is focused
    }
    const currentRequestId = ++lastRequestId.current;
    setLoading(true);
    try {
      let params = {};
      if (params1) {
        params[params1] = searchKey ?? "";
      }
      if (params2) {
        params[params2] = iTypeF2;
      }
      if (params3) {
        params[params3] = params3Value;
      }
      if (params4) {
        params[params4] = params4Value;
      }
      if (params5) {
        params[params5] = params5Value;
      }
      if (languageId) {
        params.languageId = languageId;
      }
      const response = await apiKey(params);
      const results = JSON.parse(response?.result) || [];
      if (currentRequestId === lastRequestId.current) {
        let filteredResults = results;

        // Check if LinkTagId and screenTagId are available and equal
        if (LinkTagId && screenTagId && LinkTagId === screenTagId) {
          // Filter out the item with Id equal to detailScreeniId
          filteredResults = results.filter(item => item.Id !== detailScreeniId);
        }
        setMenu(filteredResults);
      }
    } catch (error) {
      setMenu([]);
    }
    setLoading(false);
  }, 500), []);
  React.useEffect(() => {
    if (focusedRef.current) {
      debouncedFetchOptions(searchkey);
    }
  }, [searchkey, iTypeF2, toggleFocus]);
  const handleFocus = () => {
    if (handleClick) {
      const canFocus = handleClick();
      // If validation fails (returns false), do not proceed with focus logic
      if (canFocus === false) {
        return;
      }
    }
    focusedRef.current = true;
    settoggleFocus(!toggleFocus);
    setPopupClosedByEscape(false);
  };
  const handleBlur = () => {
    highlightRef.current = false;
    focusedRef.current = false; // Reset focus state when the component loses focus
    // Check for the existence in Menu or the existing formData value
    const existsInMenu = Menu.some(option => option.Name === searchkey);
    const existingFormValue = formData[formDataName] || "";
    if (!existsInMenu && searchkey !== existingFormValue) {
      setFormData({
        ...formData,
        [formDataName]: "",
        [formDataiId]: 0
      });
      setsearchkey("");
      setAutoCompleteKey(prevKey => prevKey + 1);
      setMenu([]);
    }
  };
  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue ?? "");
  };
  const CustomListBox = /*#__PURE__*/React__default["default"].forwardRef((props, ref) => {
    const {
      children,
      ...other
    } = props;

    // Determine if any option has a `Code` property
    const showCodeHeader = Menu.some(option => option?.Code);
    return /*#__PURE__*/jsxRuntime.jsxs("ul", {
      style: {
        paddingTop: 0,
        scrollbarWidth: "thin"
      },
      ref: ref,
      ...other,
      children: [/*#__PURE__*/jsxRuntime.jsx(material.ListSubheader, {
        style: {
          backgroundColor: thirdColor,
          padding: "5px",
          color: secondaryColor
        },
        children: /*#__PURE__*/jsxRuntime.jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            width: "100%"
          },
          children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
            style: {
              marginRight: "auto",
              fontSize: "0.8rem"
            },
            children: "Name"
          }), showCodeHeader && /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
            style: {
              marginLeft: "auto",
              fontSize: "0.8rem"
            },
            children: "Code"
          })]
        })
      }), children]
    });
  });
  const isLatinScript = text => {
    const latinRegex = /^[\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]*$/;
    return latinRegex.test(text); // Returns true if the text is Latin-based (including special chars)
  };
  const filterOptions = (options, {
    inputValue
  }) => {
    return options.filter(option => {
      const name = option?.Name || '';
      const code = option?.Code || '';

      // Use toLowerCase() only for Latin script inputs
      const normalizedInput = isLatinScript(inputValue) ? inputValue?.toLowerCase() : inputValue;
      const normalizedName = isLatinScript(name) ? name?.toLowerCase() : name;
      const normalizedCode = isLatinScript(code) ? code?.toLowerCase() : code;
      return normalizedName?.includes(normalizedInput) || normalizedCode && normalizedCode?.includes(normalizedInput);
    });
  };
  //auto select if only one item and mandatory
  //   useEffect(() => {
  //   if (focusedRef.current&&!searchkey && required && Menu.length === 1 && !formData[formDataiId] && !clearedManually.current) {
  //     // Automatically select the only option
  //     const singleOption = Menu[0];

  //      if (
  //     singleOption &&
  //     singleOption.Id === formData[formDataiId] &&
  //     singleOption.Name === formData[formDataName]
  //     ) {
  //       return;
  //     }
  //     const updatedFormData = {
  //       ...formData,
  //       [formDataName]: singleOption.Name,
  //       [formDataiId]: singleOption.Id,
  //     };

  //     setFormData(updatedFormData);
  //     setsearchkey(singleOption.Name);
  //     setManualChange(true);
  //     setMenu([])
  //   }
  // }, [Menu, focusedRef.current, required]); // Run when Menu changes or focus state changes

  return /*#__PURE__*/jsxRuntime.jsx(material.Box, {
    sx: {
      display: "flex",
      flexDirection: "flex-end",
      width: `${width + 40}`
    },
    children: /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
      title: disabled ? formData[formDataName] || "" : "",
      arrow: true,
      placement: "bottom",
      PopperProps: {
        modifiers: [{
          name: 'offset',
          options: {
            offset: [0, -10] // [horizontal, vertical]; -10 moves it 10px up
          }
        }]
      },
      children: /*#__PURE__*/jsxRuntime.jsx(material.Autocomplete, {
        autoHighlight: true,
        disabled: disabled,
        loading: loading,
        loadingText: /*#__PURE__*/jsxRuntime.jsx(material.CircularProgress, {
          size: 20
        }),
        noOptionsText: "",
        size: "small",
        PaperComponent: ({
          children
        }) => /*#__PURE__*/jsxRuntime.jsx(material.Paper, {
          style: {
            minWidth: "150px",
            maxWidth: "300px"
          },
          children: children
        })
        // freeSolo
        ,
        id: autoId,
        options: Menu,
        getOptionLabel: option => option?.Name || formData[formDataName] || "",
        value: formData[formDataName] ?? "",
        inputValue: searchkey // Add this line
        ,
        onChange: handleAutocompleteChange,
        onFocus: handleFocus
        //openOnFocus={true} // Automatically open dropdown on focus
        ,
        onBlur: handleBlur,
        groupBy: option => option.group,
        filterOptions: filterOptions,
        disableClearable: !formData[formDataiId] || disabled,
        onInputChange: handleInputChange,
        onHighlightChange: (event, option) => {
          if (option !== highlightRef.current) {
            highlightRef.current = option; // Update ref without re-rendering
          }
        },
        renderOption: (props, option) => /*#__PURE__*/React.createElement("li", {
          ...props,
          key: option.Id
        }, /*#__PURE__*/jsxRuntime.jsxs("div", {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            // Align items vertically for better layout
            width: "100%",
            gap: 1 // Add gap between Name and Code
          },
          children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
            style: {
              fontSize: "12px",
              flex: 1,
              textAlign: "left"
            },
            children: option?.Name
          }), /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
            style: {
              fontSize: "12px",
              flex: 1,
              textAlign: "right"
            },
            children: option?.Code
          })]
        })),
        renderInput: params => /*#__PURE__*/jsxRuntime.jsx(material.TextField, {
          required: required,
          label: label,
          ...params,
          disabled: disabled,
          inputProps: {
            ...params.inputProps,
            autoComplete: "off",
            // disable autocomplete and autofill
            // readOnly: !!formData[formDataiId],//newly added to avoid overflow when a selection and try to type after that
            style: {
              borderColor: "transparent",
              borderStyle: "solid",
              fontSize: "12px",
              height: "18px",
              padding: "0px 10px 0px 10px",
              margin: 0,
              color: "inherit"
            },
            inputProps: {
              style: {
                direction: direction ,
                // Default to LTR if direction is not found
                fontFamily: "inherit" // Default to inherit if fontFamily is not found
              }
            },
            onKeyDown: event => {
              if (event.key === "F2") {
                const updatedFormData = {
                  ...formData,
                  [formDataName]: "",
                  [formDataiId]: 0
                };
                setFormData(updatedFormData);
                setMenu([]);
                setsearchkey("");
                highlightRef.current = false;
                setiTypeF2(prevType => prevType === 1 ? 2 : 1);
                event.preventDefault();
              }
              if (event.key === "Escape") {
                setPopupClosedByEscape(true);
                highlightRef.current = null;
                return; // Allow the default behavior to close the popup
              }
              // if (
              //   event.key === "Tab" &&
              //   !popupClosedByEscape &&
              //   !highlightRef.current &&
              //   searchkey &&
              //   Menu.length > 0
              // ) {
              //   highlightRef.current = Menu[0];
              // }
              if (event.key === "Tab" || event.key === "Enter") {
                // Select the currently highlighted option
                if (highlightRef.current) {
                  const newValue = highlightRef.current;
                  if (newValue && newValue.Id === formData[formDataiId] && newValue.Name === formData[formDataName]) {
                    return;
                  }
                  // Set the form data directly with the highlighted option
                  setFormData({
                    ...formData,
                    [formDataName]: newValue?.Name,
                    [formDataiId]: newValue?.Id
                  });
                  setMenu([]);

                  // Update the value directly
                  setsearchkey(newValue?.Name || "");
                  highlightRef.current = false;
                  setManualChange(true);
                }
                setTimeout(() => {
                  event.target.blur(); // Move focus to the next field
                }, 0);
                // event.preventDefault();
              }
              if (event.key === "ArrowDown") {
                // Only recall API if:
                // 1. The dropdown is not already open, OR
                // 2. We have a search term but no results, OR  
                // 3. We want to refresh the data
                const shouldRecallAPI = Menu.length === 0 || searchkey && Menu.length === 0 || !focusedRef.current;
                if (shouldRecallAPI) {
                  setLoading(true);
                  debouncedFetchOptions(searchkey);
                }

                // Ensure the dropdown opens
                if (!focusedRef.current) {
                  focusedRef.current = true;
                }
                return; // Allow default arrow down behavior to highlight first item
              }
            }
          },
          InputLabelProps: {
            style: {
              fontSize: "14px",
              padding: "0 0px",
              zIndex: 1
            },
            sx: {
              textAlign: "left",
              right: "auto"
            }
          },
          sx: {
            paddingTop: tableField ? "0px" : "16px",
            minWidth: width + ColumnSpan * 50,
            // "@media (max-width: 360px)": {
            //   width: 220, // Reduced width for small screens
            // },
            "& .MuiOutlinedInput-input": {
              padding: "2px 2px ",
              transform: "translate(-1px, 0px) scale(1)",
              textAlign: "left"
            },
            "& .MuiInputBase-input": {
              fontSize: "0.75rem"
            },
            "& .MuiInputLabel-outlined": {
              transform: "translate(14px, 22px) scale(0.85)"
            },
            "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
              // transform: "translate(14px, 7px) scale(0.75)",
              transform: "translate(14px, 7px) scale(0.75)",
              // Adjust label position when focused
              padding: "0px 2px",
              color: "inherit"
            },
            "& .MuiOutlinedInput-root": {
              height: 30,
              // Adjust the height of the input area
              display: "flex",
              flexDirection: "row",
              "& fieldset": {
                borderColor: "#ddd",
                textAlign: "left"
              },
              "&:hover fieldset": {
                borderColor: "currentColor" // Keeps the border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "currentColor" // Keeps the current border color
              },
              "& legend": {
                width: "max-content" // Let legend adjust width in RTL
              },
              "& .MuiAutocomplete-endAdornment": {
                right: 0,
                // Position icons on the left in RTL
                left: "auto" // Swap the position of the icons
              },
              "& .MuiSvgIcon-root": {
                marginRight: 0,
                marginLeft: "auto" // Adjust icon spacing
              }
            },
            "& .MuiInputLabel-root": {
              color: "inherit",
              fontSize: "14px",
              transform: null // Adjust label position when not focused
            }
          }
        })
        // ListboxProps={{
        //   style: { maxHeight: '200px', overflow: 'auto' },
        // }}
        ,
        ListboxComponent: CustomListBox
      }, `${label}_${autoCompleteKey}`)
    })
  });
};

material.styled(material.Avatar)(({
  theme
}) => ({
  width: 22,
  height: 22,
  border: `2px solid ${theme.palette.background.paper}`
}));
({
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired
});
function BasicBreadcrumbs() {
  const style = {
    display: "flex",
    alignItems: "center",
    fontSize: "1.2rem",
    color: primaryColor,
    "@media (max-width: 600px)": {
      fontSize: "1rem" // Reduce font size on smaller screens
    },
    fontWeight: "bold"
  };
  return /*#__PURE__*/jsxRuntime.jsx("div", {
    role: "presentation",
    style: {
      display: "flex",
      flexDirection: "row",
      maxWidth: "fit-content",
      alignItems: "center"
    },
    children: /*#__PURE__*/jsxRuntime.jsx(material.Stack, {
      spacing: 2,
      sx: {
        flex: 1
      },
      children: /*#__PURE__*/jsxRuntime.jsx(Breadcrumbs__default["default"], {
        separator: /*#__PURE__*/jsxRuntime.jsx(NavigateNextIcon__default["default"], {
          fontSize: "small",
          sx: {
            color: primaryColor
          }
        }),
        "aria-label": "breadcrumb",
        children: /*#__PURE__*/jsxRuntime.jsx(material.Typography, {
          underline: "hover",
          sx: style,
          children: "User Details"
        }, "1")
      })
    })
  });
}
const DefaultIcons = ({
  iconsClick,
  detailPageId,
  userAction
}) => {
  return /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
    sx: {
      display: "flex",
      flexDirection: "row",
      gap: "5px",
      alignItems: "center",
      overflowX: "auto",
      scrollbarWidth: "thin",
      minWidth: "fit-Content"
    },
    children: [userAction.some(action => action.Action_Name === "New") && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-plus",
      caption: "New",
      iconName: "new"
    }), userAction.some(action => action.Action_Name === "New" && detailPageId === 0 || action.Action_Name === "Edit" && detailPageId !== 0) && /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "save",
      caption: "Save",
      iconName: "save"
    }), userAction.some(action => action.Action_Name === "Delete") && /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
      children: detailPageId != 0 ? /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
        iconsClick: iconsClick,
        icon: "trash",
        caption: "Delete",
        iconName: "delete"
      }) : null
    }), userAction.some(action => action.Action_Name === "Change Password") && detailPageId ? /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-screwdriver-wrench",
      caption: "Reset Password",
      iconName: "reset"
    }) : null, /*#__PURE__*/jsxRuntime.jsx(ActionButton, {
      iconsClick: iconsClick,
      icon: "fa-solid fa-xmark",
      caption: "Close",
      iconName: "close"
    })]
  });
};
const suggestionUserType = [{
  Id: 1,
  Name: "Web"
}, {
  Id: 2,
  Name: "Mob"
}, {
  Id: 3,
  Name: "Both"
}];
const status = [{
  "Id": true,
  "Name": "InActive"
}, {
  "Id": false,
  "Name": "Active"
}]; //Inactive Status
function UserDetails({
  setPageRender,
  detailPageId: summaryId,
  userAction,
  disabledDetailed
}) {
  const [mainDetails, setMainDetails] = React.useState({});
  const [detailPageId, setDetailPageId] = React.useState(summaryId);
  const [confirmAlert, setConfirmAlert] = React.useState(false);
  const [confirmData, setConfirmData] = React.useState({});
  const [confirmType, setConfirmType] = React.useState(null);
  const [resetPassword, setResetPassword] = React.useState(false);
  const [passwordPolicy, setPasswordPolicy] = React.useState({
    PolicyRegExp: "^.*$",
    Description: "Choose Role"
  });
  const {
    getuserdetails,
    gettimezonelist,
    getroleslist,
    upsertuser,
    deleteuser,
    checkuserexistence,
    uploaduserfile,
    deleteuserfile,
    getroledetails,
    getpasswordpolicyregex,
    GetTagList
  } = securityApis();
  const {
    showAlert
  } = useAlert();

  //   useEffect(() => {
  //   fetchPasswordPolicy();
  // }, []);

  React.useEffect(() => {
    if (mainDetails?.Role) {
      fetchPolicyByRole(mainDetails.Role);
    } else {
      setPasswordPolicy({
        PolicyRegExp: "^.*$",
        Description: "Choose Role"
      });
    }
  }, [mainDetails?.Role]);
  const fetchPolicyByRole = async roleId => {
    try {
      const roleResponse = await getroledetails({
        id: roleId
      });
      if (roleResponse?.status === "Success") {
        const parsed = JSON.parse(roleResponse.result);
        const pwdPolicyId = parsed?.RoleDetails?.[0]?.PwdPolicy;
        const regexResponse = await getpasswordpolicyregex({
          roleId: roleId
        });
        if (regexResponse?.status === "Success" && regexResponse?.result) {
          const regexParsed = JSON.parse(regexResponse.result);
          const regexData = Array.isArray(regexParsed) ? regexParsed[0] : regexParsed;
          setPasswordPolicy({
            PolicyRegExp: regexData?.PolicyRegExp ?? "^.*$",
            Description: regexData?.Description ?? "No password policy set",
            MinLength: regexData?.MinLength ?? 0
          });
        }
      }
    } catch (error) {
      console.error("fetchPolicyByRole error:", error);
    }
  };

  // useEffect(() => {
  //   fetchPasswordPolicy(mainDetails?.Role || 0);
  // }, [mainDetails?.Role]);

  const PasswordTooltip = () => /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
    sx: {
      p: 0.5
    },
    children: [/*#__PURE__*/jsxRuntime.jsx(material.Typography, {
      sx: {
        fontSize: "12px"
      },
      children: passwordPolicy.Description || "No password policy set"
    }), passwordPolicy.MinLength > 0 && /*#__PURE__*/jsxRuntime.jsxs(material.Typography, {
      sx: {
        fontSize: "12px"
      },
      children: ["Minimum Length: ", passwordPolicy.MinLength]
    })]
  });
  React.useEffect(() => {
    const fetchData = async () => {
      await tagDetails();
    };
    fetchData();
  }, [detailPageId]);
  const tagDetails = async () => {
    try {
      if (detailPageId == 0) {
        handleNew();
      } else {
        const response = await getuserdetails({
          id: detailPageId
        });
        if (response?.status === "Success") {
          const myObject = JSON.parse(response?.result);

          // Find matching status name
          const activeStatus = status.find(s => s.Id === myObject[0]?.InActive)?.Name || "Unknown";
          if (myObject[0]?.ImagePath || myObject[0]?.SignaturePath) {
            setMainDetails({
              ...myObject[0],
              image: myObject[0]?.Image,
              image_preview: myObject[0]?.ImagePath,
              image_previousFileName: myObject[0]?.Image,
              signature: myObject[0]?.Signature,
              signature_preview: myObject[0]?.SignaturePath,
              signature_previousFileName: myObject[0]?.Signature,
              InActive_Name: activeStatus
            });
          } else {
            setMainDetails({
              ...myObject[0],
              InActive_Name: activeStatus
            });
          }
        } else {
          handleNew();
        }
      }
    } catch (error) {
      throw error;
    }
  };
  const handleNew = () => {
    setMainDetails({
      Email: "",
      Password: "",
      CPassword: "",
      Employee: "",
      Id: 0,
      LoginName: "",
      Mobile: "",
      Phone: "",
      Photo: "",
      Role: 0,
      Name: "",
      Timezone: 0,
      Type: "",
      UserType: 0,
      UserTypeName: "",
      image: "",
      image_file: "",
      image_preview: "",
      signature: "",
      signature_file: "",
      signature_preview: "",
      InActive_Name: "Active",
      InActive: false,
      image_previousFileName: "",
      signature_previousFileName: ""
    });
    setDetailPageId(0);
  };
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  const handleIconsClick = async value => {
    switch (value.trim()) {
      case "new":
        handleNew();
        break;
      case "close":
        handleclose();
        break;
      case "save":
        const emptyFields = [];
        // const result = await handleUserExist();
        // if (!result) {
        //   return; // If the user exists, stop further execution
        // }
        let namePattern = /[A-Za-z]/;
        if (!mainDetails.LoginName) {
          emptyFields.push("Login Name");
        } else if (!namePattern.test(mainDetails.LoginName)) {
          showAlert("info", "Login Name must contain at least one letter.");
          return;
        }
        if (!mainDetails.Role) emptyFields.push("Role");
        //if (!mainDetails.Email) emptyFields.push("Email");
        if (mainDetails?.Email && !emailRegex.test(mainDetails?.Email)) emptyFields.push("Valid Email");
        if (!mainDetails.Password && detailPageId === 0) emptyFields.push("Password");
        if (!mainDetails.CPassword && detailPageId === 0) emptyFields.push("Confirm Password");
        //if (!mainDetails.Timezone) emptyFields.push("Time Zone");
        if (!mainDetails.UserType) emptyFields.push("User Type");
        // if (mainDetails.InActive == null) emptyFields.push("Status");
        if (mainDetails.Mobile && !/^\+?[0-9]{10,15}$/.test(mainDetails.Mobile.trim())) {
          emptyFields.push("Valid Mobile Number");
        }
        if (mainDetails.Phone && !/^[0-9]{10,15}$/.test(mainDetails.Phone)) emptyFields.push("Valid Phone Number");
        // if (!mainDetails.signature_preview)
        //   emptyFields.push("Signature");
        if (emptyFields.length > 0) {
          showAlert("info", `Please Provide ${emptyFields[0]}`);
          return;
        }
        // if (
        //   !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s])[^\s]{6,}$/.test(
        //     mainDetails.Password
        //   ) &&
        //   detailPageId === 0
        // ) {
        //   showAlert(
        //     "info",
        //     `Password must be at least 6 characters long and include at least one letter, one number, and one special character.`
        //   );
        //   return;
        // }
        if (detailPageId === 0) {
          if (passwordPolicy.MinLength > 0 && mainDetails.Password.length < passwordPolicy.MinLength) {
            showAlert("info", `Password must be at least ${passwordPolicy.MinLength} characters long.`);
            return;
          }
          if (!new RegExp(passwordPolicy.PolicyRegExp).test(mainDetails.Password)) {
            showAlert("info", passwordPolicy.Description || "Password does not meet the required policy.");
            return;
          }
        }
        if (mainDetails.Password !== mainDetails.CPassword && detailPageId === 0) {
          showAlert("info", `Incorrect Password`);
          return;
        }
        // if ((mainDetails.UserType==2 || mainDetails.UserType==3)&& !mainDetails?.Vendor){
        //    showAlert(
        //     "info",
        //     `Please select vendor`
        //   );
        //   return
        // }
        setConfirmData({
          message: "Save",
          type: "success"
        });
        setConfirmType("save");
        setConfirmAlert(true);
        break;
      case "reset":
        setResetPassword(true);
        break;
      case "delete":
        setConfirmData({
          message: "Delete",
          type: "danger"
        });
        setConfirmType("delete");
        setConfirmAlert(true);
        break;
    }
  };
  // Handlers for your icons

  const handleclose = () => {
    setPageRender(1);
  };
  const handleSave = async () => {
    const encryptedPassword = await encrypt(mainDetails.Password);
    const saveData = {
      Id: mainDetails?.Id,
      loginName: mainDetails?.LoginName,
      employee: mainDetails?.Employee ?? 0,
      photo: mainDetails?.Photo,
      timezone: mainDetails?.Timezone,
      email: mainDetails?.Email,
      phone: mainDetails?.Phone,
      mobile: mainDetails?.Mobile,
      userType: mainDetails.UserType,
      role: mainDetails?.Role,
      inActive: mainDetails?.InActive,
      password: detailPageId === 0 ? encryptedPassword : "",
      image: mainDetails.image,
      signature: mainDetails.signature,
      cutomer: mainDetails?.Customer ?? 0
    };
    const response = await upsertuser(saveData);
    if (response.status === "Success") {
      const numericId = parseInt(response.result, 10); //To edit profile after newly inserted. here detailpage id changes from 0 to new id(response.result gives new id)
      // setDetailPageId(numericId);

      if (mainDetails.image_file || mainDetails.signature_file) {
        await handleFileUpload(numericId);
      }
      showAlert("success", response?.message);
      handleNew();
      const actionExists = userAction.some(action => action.Action_Name === "New");
      if (!actionExists) {
        setPageRender(1);
      }
    } else {
      showAlert("info", response?.message);
    }
  };

  //confirmation

  const handleConfirmSubmit = () => {
    if (confirmType === "save") {
      handleSave();
    } else if (confirmType === "delete") {
      if (detailPageId == 0) {
        setConfirmAlert(false);
        setConfirmData({});
        setConfirmType(null);
        return;
      }
      deleteClick();
    } else if (confirmType == "image" || confirmType == "signature") {
      handledeletePhoto(confirmType);
    }
    setConfirmAlert(false);
    setConfirmData({});
    setConfirmType(null);
  };
  const handleConfrimClose = () => {
    setConfirmAlert(false);
    setConfirmData({});
    setConfirmType(null);
  };

  //Delete alert open
  const deleteClick = async () => {
    let response;
    response = await deleteuser([{
      id: detailPageId
    }]);
    if (response?.status === "Success") {
      if (mainDetails?.ImagePath) {
        deleteUploadImage(Number(response?.result));
      }
      showAlert("success", response?.message);
      handleNew();
      const actionExists = userAction.some(action => action.Action_Name === "New");
      if (!actionExists) {
        setPageRender(1);
      }
    }
  };
  const handleUserExist = async () => {
    try {
      const response = await checkuserexistence({
        userId: mainDetails?.Id,
        loginName: mainDetails?.LoginName
      });
      if (response.status === "Success") {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  //Upload 
  const uploadIconstyle = {
    backgroundColor: "#fff",
    // Set a background color
    borderRadius: "50%",
    // Make the button round
    padding: "5px",
    // Padding to make the icon look bigger and floating
    boxShadow: "0px 4px 12px rgba(0,0,0,0.2)" // Add shadow to make it look floating
  };
  const handleUploadClick = field => () => {
    if (disabledDetailed) {
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.gif"; // Accept only specific file types
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        // Check if the selected file has an allowed extension
        if (!allowedExtensionsUser.includes(fileExtension)) {
          showAlert('info', `Allowed file Type : ${allowedExtensionsUser.join(', ')}`);
          return;
        }
        const reader = new FileReader();
        reader.onload = e => {
          // Store the Base64 string for preview purposes
          setMainDetails(prev => ({
            ...prev,
            [field + "_preview"]: e.target.result
            // [field] :file.name
          }));
          // Store the file object for upload
          setMainDetails(prev => ({
            ...prev,
            [field + "_file"]: file // Ensure this is a File object
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };
  const handleDeleteClick = field => () => {
    if (disabledDetailed) {
      return;
    }
    if (mainDetails[`${field}_previousFileName`] == "") {
      setMainDetails(prev => ({
        ...prev,
        [field]: "",
        [`${field}_file`]: "",
        [`${field}_preview`]: ""
      }));
      return;
    }

    // Set confirmation data for deleting the photo
    setConfirmData({
      message: "delete",
      type: "danger"
    });
    setConfirmType(field);
    setConfirmAlert(true);
    // setFormData((prev) => ({ ...prev,[`${field}`]: "",   [`${field}_file`]: "", [`${field}_preview`]:""  }));
  };
  const handleFileUpload = async userId => {
    if (!mainDetails.image_file && !mainDetails.signature_file) {
      return;
    }
    const formDataFiles = new FormData();
    let fileIndex = 0;
    if (mainDetails.image_file) {
      formDataFiles.append(`userFiles[${fileIndex}].FieldType`, 'Image');
      formDataFiles.append(`userFiles[${fileIndex}].previousFileName`, mainDetails?.image_previousFileName || '');
      formDataFiles.append(`userFiles[${fileIndex}].FileContent`, mainDetails.image_file);
      fileIndex++;
    }
    if (mainDetails.signature_file) {
      formDataFiles.append(`userFiles[${fileIndex}].FieldType`, 'Signature');
      formDataFiles.append(`userFiles[${fileIndex}].previousFileName`, mainDetails?.signature_previousFileName || '');
      formDataFiles.append(`userFiles[${fileIndex}].FileContent`, mainDetails.signature_file);
    }
    try {
      const uploadResponse = await uploaduserfile(userId, formDataFiles);
    } catch (uploadError) {}
  };
  const handledeletePhoto = async field => {
    const deletePayload = {
      id: detailPageId,
      fileName: mainDetails[`${field}_previousFileName`],
      fieldType: field
    };
    try {
      const response = await deleteuserfile(deletePayload);
      if (response?.status === "Success") {
        showAlert("success", response?.message);
        setMainDetails(prev => ({
          ...prev,
          [field]: "",
          [`${field}_file`]: "",
          [`${field}_preview`]: "",
          [`${field}_previousFileName`]: ""
        }));
      }
    } catch (error) {

      // if(error){

      //     warningOpen();
      //     setWaringData({ message:  error?.message, type: "warning" });

      // }
    } finally {}
  };
  return /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
    sx: {
      display: "flex",
      flexDirection: "column",
      width: "100%"
    },
    children: [/*#__PURE__*/jsxRuntime.jsxs(material.Box, {
      sx: {
        display: "flex",
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 1.5,
        paddingRight: 1.5,
        flexWrap: "wrap"
      },
      children: [/*#__PURE__*/jsxRuntime.jsx(BasicBreadcrumbs, {}), /*#__PURE__*/jsxRuntime.jsx(material.Box, {
        sx: {
          overflowX: "auto"
        },
        children: /*#__PURE__*/jsxRuntime.jsx(DefaultIcons, {
          detailPageId: detailPageId,
          iconsClick: handleIconsClick,
          userAction: userAction,
          disabledDetailed: disabledDetailed
        })
      })]
    }), /*#__PURE__*/jsxRuntime.jsx(material.Box, {
      sx: {
        width: "100%",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        scrollbarWidth: "thin",
        paddingBottom: "30px"
      },
      children: /*#__PURE__*/jsxRuntime.jsx(material.Box, {
        sx: {
          width: "98%",
          margin: "auto",
          display: "flex",
          flexDirection: "column",
          paddingTop: "10px"
        },
        children: /*#__PURE__*/jsxRuntime.jsxs(material.Box, {
          sx: {
            display: "flex",
            width: "100%",
            flexDirection: "row",
            justifyContent: "flex-start",
            // Changed from center to flex-start
            padding: 1,
            gap: "10px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            flexWrap: "wrap",
            "@media (max-width: 768px)": {
              gap: "10px" // Reduced width for small screens
            },
            "@media (max-width: 420px)": {
              gap: "2px" // Reduced width for small screens
            }
          },
          children: [/*#__PURE__*/jsxRuntime.jsx(InputCommon, {
            label: "Login Name",
            name: "LoginName",
            type: "text",
            disabled: detailPageId !== 0,
            mandatory: true,
            value: mainDetails.LoginName,
            setValue: data => {
              const {
                name,
                value
              } = data;
              setMainDetails({
                ...mainDetails,
                [name]: value
              });
            },
            maxLength: 50,
            onBlurAction: handleUserExist
          }), /*#__PURE__*/jsxRuntime.jsx(AutoComplete, {
            apiKey: getroleslist,
            formData: mainDetails,
            setFormData: setMainDetails,
            label: "Role",
            autoId: "Role",
            required: true,
            formDataName: "Role_Name",
            formDataiId: "Role",
            params1: "Search",
            params2: "Type"
          }), /*#__PURE__*/jsxRuntime.jsx(InputCommon, {
            label: "Email Id",
            name: "Email",
            type: "email",
            mandatory: false,
            disabled: false,
            value: mainDetails.Email,
            setValue: data => {
              const {
                name,
                value
              } = data;
              setMainDetails({
                ...mainDetails,
                [name]: value
              });
            }
          }), detailPageId === 0 && /*#__PURE__*/jsxRuntime.jsxs(jsxRuntime.Fragment, {
            children: [/*#__PURE__*/jsxRuntime.jsx(material.TextField, {
              label: "Password",
              name: "Password",
              type: "password",
              size: "small",
              disabled: false,
              mandatory: true,
              value: mainDetails.Password || "",
              onChange: e => setMainDetails({
                ...mainDetails,
                Password: e.target.value
              }),
              autoComplete: "off",
              InputProps: {
                endAdornment: /*#__PURE__*/jsxRuntime.jsx(material.Tooltip, {
                  title: /*#__PURE__*/jsxRuntime.jsx(PasswordTooltip, {
                    description: passwordPolicy.Description
                  }),
                  arrow: true,
                  placement: "right",
                  children: /*#__PURE__*/jsxRuntime.jsx(material.Box, {
                    sx: {
                      cursor: "pointer",
                      color: "gray",
                      display: "flex",
                      alignItems: "center"
                    },
                    children: /*#__PURE__*/jsxRuntime.jsx("i", {
                      className: "fa-solid fa-circle-info",
                      style: {
                        fontSize: "16px"
                      }
                    })
                  })
                }),
                style: {
                  fontSize: "12px",
                  height: "30px"
                }
              },
              InputLabelProps: {
                style: {
                  fontSize: "14px"
                }
              },
              sx: {
                paddingTop: "16px",
                minWidth: "200px",
                "& .MuiInputLabel-outlined": {
                  transform: "translate(14px, 22px) scale(0.85)"
                },
                "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
                  transform: "translate(14px, 7px) scale(0.75)"
                },
                "& .MuiOutlinedInput-root": {
                  height: 30,
                  "& fieldset": {
                    borderColor: "#ddd"
                  },
                  "&:hover fieldset": {
                    borderColor: "currentColor"
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "currentColor"
                  }
                },
                "& .MuiInputLabel-root": {
                  color: "inherit",
                  fontSize: "14px"
                }
              }
            }), /*#__PURE__*/jsxRuntime.jsx(InputCommon, {
              label: "Confirm Password",
              name: "CPassword",
              type: "password",
              disabled: false,
              mandatory: true,
              value: mainDetails.CPassword,
              setValue: data => {
                const {
                  name,
                  value
                } = data;
                setMainDetails({
                  ...mainDetails,
                  [name]: value
                });
              },
              languageName: "english",
              key1: `Mobile`,
              maxLength: 100
            }, "Mobile")]
          }), /*#__PURE__*/jsxRuntime.jsx(AutoComplete, {
            apiKey: GetTagList,
            formData: mainDetails,
            setFormData: setMainDetails,
            label: "Timezone",
            autoId: "Timezone",
            required: false,
            formDataName: "Timezone_Name",
            formDataiId: "Timezone",
            params1: "Search",
            params2: "Type",
            params4: "TagId",
            params4Value: 7
          }), /*#__PURE__*/jsxRuntime.jsx(AutoSelect, {
            formData: mainDetails,
            setFormData: setMainDetails,
            autoId: "userType",
            formDataName: `UserType_Name`,
            formDataiId: "UserType",
            required: true,
            label: "User Type",
            languageName: "english",
            ColumnSpan: 0,
            Menu: suggestionUserType
          }, "userType"), /*#__PURE__*/jsxRuntime.jsx(AutoSelect, {
            formData: mainDetails,
            setFormData: setMainDetails,
            autoId: "InActive",
            formDataName: `InActive_Name`,
            formDataiId: "InActive",
            required: true,
            label: "Status",
            languageName: "english",
            ColumnSpan: 0,
            Menu: status
          }, "status"), /*#__PURE__*/jsxRuntime.jsx(UserInputField, {
            label: "Mobile",
            name: "Mobile",
            type: "text",
            disabled: false,
            value: mainDetails,
            setValue: setMainDetails
          }), /*#__PURE__*/jsxRuntime.jsx(UserInputField, {
            label: "Phone",
            name: "Phone",
            type: "text",
            disabled: false,
            value: mainDetails,
            setValue: setMainDetails
          }), /*#__PURE__*/jsxRuntime.jsx(material.Box, {
            sx: {
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyContent: "flex-start",
              // Changed from center to flex-start
              padding: 1,
              gap: "10px",
              flexWrap: "wrap",
              "@media (max-width: 768px)": {
                gap: "10px" // Reduced width for small screens
              },
              "@media (max-width: 420px)": {
                gap: "2px" // Reduced width for small screens
              }
            },
            children: /*#__PURE__*/jsxRuntime.jsx(UserPhotoUpload, {
              formData: mainDetails,
              handleUploadClick: handleUploadClick,
              handleDeleteClick: handleDeleteClick,
              uploadIconstyle: uploadIconstyle,
              field: "image",
              label: "Photo",
              disabled: disabledDetailed
            })
          })]
        })
      })
    }), /*#__PURE__*/jsxRuntime.jsx(ConfirmationAlert, {
      handleClose: handleConfrimClose,
      open: confirmAlert,
      data: confirmData,
      submite: handleConfirmSubmit
    }), /*#__PURE__*/jsxRuntime.jsx(ResetPasswordAlert, {
      handleClose: () => setResetPassword(false),
      open: resetPassword,
      detailPageId: detailPageId,
      passwordPolicy: passwordPolicy
    })]
  });
}

function UserContainer() {
  const location = reactRouterDom.useLocation();
  const [page, setPage] = React.useState(1);
  const [id, setId] = React.useState(0);
  const [menuIdLocal, setmenuIdLocal] = React.useState(null);
  const [userAction, setuserAction] = React.useState([]);
  const menuId = location?.state;
  const navigate = reactRouterDom.useNavigate();
  const {
    getuseractionsforscreen
  } = securityApis();
  React.useEffect(() => {
    if (menuId?.Screen) setmenuIdLocal(menuId?.Screen);else if (menuId?.Screen == undefined && menuIdLocal == null) {
      navigate("/home", {
        state: {
          Screen: 1
        }
      });
    }
    setPage(1);
  }, [menuId?.Screen]);
  React.useEffect(() => {
    const fetchUserActions = async () => {
      try {
        const response = await getuseractionsforscreen({
          Screen: menuIdLocal
        });
        const data = JSON.parse(response?.result);
        setuserAction(data);
      } catch (error) {
        navigate("/home", {
          state: {
            Screen: 1
          }
        });
      }
    };
    if (menuIdLocal) fetchUserActions();
  }, [menuIdLocal]);
  return /*#__PURE__*/jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: page === 1 ? /*#__PURE__*/jsxRuntime.jsx(UserSummary, {
      setPageRender: setPage,
      setId: setId,
      Id: id,
      userAction: userAction,
      screenId: menuId
    }) : page === 2 ? /*#__PURE__*/jsxRuntime.jsx(UserDetails, {
      setPageRender: setPage,
      detailPageId: id,
      userAction: userAction
    }) : null
  });
}

const UserContext = /*#__PURE__*/React.createContext();
const UserProvider = ({
  children,
  token,
  refreshToken,
  onTokensRefreshed
}) => {
  // Sync incoming props → module store
  React.useEffect(() => {
    setTokens(token, refreshToken);
  }, [token, refreshToken]);

  // Let the package notify the host app when a refresh happens
  React.useEffect(() => {
    setOnTokensRefreshed(onTokensRefreshed);
  }, [onTokensRefreshed]);
  return /*#__PURE__*/jsxRuntime.jsx(UserContext.Provider, {
    value: {
      token,
      refreshToken,
      getAccessToken: getAccessToken$1,
      getRefreshToken
    },
    children: children
  });
};
const useUserContext = () => React.useContext(UserContext);

exports.UserContainer = UserContainer;
exports.UserDetails = UserDetails;
exports.UserProvider = UserProvider;
exports.UserSummary = UserSummary;
exports.useUserContext = useUserContext;
//# sourceMappingURL=index.js.map
