import axios from "axios";
import { showAlertGlobal } from "./interceptorSecurityApi";
import {
  getAccessToken as storeGetAccessToken,
  getRefreshToken as storeGetRefreshToken,
  notifyTokensRefreshed,
  clearTokenStore,
} from "../../tokenStore";

let refreshInProgress = false;
let refreshPromise = null;
let broadcastChannel = null;
let isLeader = false;
let leaderTabId = null;

// Initialize BroadcastChannel for tab communication
const initBroadcastChannel = () => {
  if (typeof BroadcastChannel !== "undefined" && !broadcastChannel) {
    broadcastChannel = new BroadcastChannel("auth_token_channel");

    broadcastChannel.onmessage = (event) => {
      const { type, data, tabId, timestamp } = event.data;
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
          if (
            !leaderTabId ||
            (timestamp && timestamp < getLeadershipTimestamp())
          ) {
            leaderTabId = tabId;
            isLeader = false;
            localStorage.setItem("auth_leader_tab", tabId);
            localStorage.setItem(
              "auth_leader_timestamp",
              timestamp || Date.now()
            );
          }
          break;

        case "TOKEN_REFRESH_STARTED":
          leaderTabId = tabId;
          isLeader = false;
          refreshInProgress = true;
          break;

        case "TOKEN_REFRESH_COMPLETED":
          if (data.accessToken && data.refreshToken) {
            // Update in-memory store + localStorage (for cross-tab) + notify host
            notifyTokensRefreshed(data.accessToken, data.refreshToken);
            localStorage.setItem("TimeCaptureAccessToken", data.accessToken);
            localStorage.setItem("TimeCaptureRefreshToken", data.refreshToken);

            // Resolve any pending refresh promise in this tab
            if (
              refreshPromise &&
              typeof refreshPromise.resolve === "function"
            ) {
              refreshPromise.resolve(data.accessToken);
            }
          }

          refreshInProgress = false;
          refreshPromise = null;
          leaderTabId = null;
          isLeader = false;
          localStorage.removeItem("auth_leader_tab");
          break;

        case "TOKEN_REFRESH_FAILED":
          refreshInProgress = false;
          refreshPromise = null;
          leaderTabId = null;
          isLeader = false;
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
const becomeLeader = (tabId) => {
  isLeader = true;
  leaderTabId = tabId;

  localStorage.setItem("auth_leader_tab", tabId);
  localStorage.setItem("auth_leader_timestamp", Date.now().toString());

  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "LEADER_ELECTION",
      tabId: tabId,
      timestamp: Date.now(),
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
    sessionStorage.tabId =
      Math.random().toString(36).substring(2) + Date.now();
  }
  return sessionStorage.tabId;
};

/**
 * Common function to refresh access token
 * @param {string} baseUrl - The base URL for the refresh token endpoint
 * @param {boolean} isRetry - Whether this is a retry attempt
 * @returns {Promise<string>} - Promise that resolves with the new access token
 */
export const refreshToken = async (baseUrl, isRetry = false) => {
  initBroadcastChannel();

  const currentTabId = getTabId();

  const storedLeader = localStorage.getItem("auth_leader_tab");
  const leaderTimestamp = getLeadershipTimestamp();
  const leaderAge = Date.now() - leaderTimestamp;

  // If there's a valid leader (less than 10 seconds old), wait for it
  if (storedLeader && storedLeader !== currentTabId && leaderAge < 10000) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const newAccessToken =
          storeGetAccessToken() ||
          localStorage.getItem("TimeCaptureAccessToken");
        if (newAccessToken) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(newAccessToken);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
        becomeLeader(currentTabId);
        executeRefresh(baseUrl, isRetry, currentTabId)
          .then(resolve)
          .catch(reject);
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
      timestamp: Date.now(),
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
      timestamp: Date.now(),
    });
  }

  (async () => {
    let refreshTokenValue;

    try {
      // ✅ Read from in-memory store first, then fall back to localStorage
      refreshTokenValue =
        storeGetRefreshToken() ||
        localStorage.getItem("TimeCaptureRefreshToken");

      if (!refreshTokenValue) {
        console.error(`[Tab ${tabId}] No refresh token found`);

        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: "TOKEN_REFRESH_FAILED",
            tabId: tabId,
            reason: "NO_REFRESH_TOKEN",
            shouldClearStorage: false,
          });
        }

        externalReject(new Error("No refresh token found"));
        return;
      }

      const response = await axios.get(
        `${baseUrl}login/regeneratetokens?refreshToken=${refreshTokenValue}`,
        { timeout: 30000 }
      );

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
            refreshToken: parsedRefreshToken,
          },
        });
      }

      externalResolve(parsedAccessToken);
    } catch (error) {
      console.error(`[Tab ${tabId}] Error during token refresh:`, error);

      const isTokenAlreadyUsed = error?.response?.status === 400;

      const currentRefreshToken =
        storeGetRefreshToken() ||
        localStorage.getItem("TimeCaptureRefreshToken");
      const refreshTokenChanged =
        refreshTokenValue && refreshTokenValue !== currentRefreshToken;

      if (isTokenAlreadyUsed && refreshTokenChanged) {
        const newAccessToken =
          storeGetAccessToken() ||
          localStorage.getItem("TimeCaptureAccessToken");
        if (newAccessToken) {
          externalResolve(newAccessToken);
          return;
        }
      }

      const shouldClearStorage = error?.response?.status !== 400;

      if (shouldClearStorage) {
        if (typeof showAlertGlobal === "function") {
          showAlertGlobal(
            "error",
            error?.response?.data?.message || "Authentication failed"
          );
        }
        clearAuthTokens();
      }

      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: "TOKEN_REFRESH_FAILED",
          tabId: tabId,
          reason: error.message,
          shouldClearStorage: shouldClearStorage,
        });
      }

      externalReject(error);
    } finally {
      refreshInProgress = false;
      refreshPromise = null;
      leaderTabId = null;
      isLeader = false;
      localStorage.removeItem("auth_leader_tab");
      localStorage.removeItem("auth_leader_timestamp");
    }
  })();

  return refreshPromise;
};

/**
 * Check if token refresh is in progress
 */
export const isTokenRefreshInProgress = () => {
  return refreshInProgress;
};

/**
 * Reset token refresh state
 */
export const resetTokenRefresh = () => {
  refreshInProgress = false;
  refreshPromise = null;
  leaderTabId = null;
  isLeader = false;
  localStorage.removeItem("auth_leader_tab");
  localStorage.removeItem("auth_leader_timestamp");

  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "LOGOUT",
      tabId: getTabId(),
    });
  }
};

/**
 * Get current access token — prefers in-memory store, falls back to localStorage
 */
export const getAccessToken = () => {
  return storeGetAccessToken() || localStorage.getItem("TimeCaptureAccessToken");
};

/**
 * Get current refresh token — prefers in-memory store, falls back to localStorage
 */
export const getRefreshToken = () => {
  return (
    storeGetRefreshToken() || localStorage.getItem("TimeCaptureRefreshToken")
  );
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = () => {
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