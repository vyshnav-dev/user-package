import axios from "axios";
import { showAlertGlobal } from "./interceptorSecurityApi";

let refreshInProgress = false;
let refreshPromise = null;
let broadcastChannel = null;
let isLeader = false;
let leaderTabId = null;

// Initialize BroadcastChannel for tab communication
const initBroadcastChannel = () => {
  if (typeof BroadcastChannel !== 'undefined' && !broadcastChannel) {
    broadcastChannel = new BroadcastChannel('auth_token_channel');
    
    broadcastChannel.onmessage = (event) => {
      const { type, data, tabId, timestamp } = event.data;
      const currentTabId = getTabId();
      
      // Ignore messages from self
      if (tabId === currentTabId) return;
      
      switch (type) {
        case 'REFRESH_NEEDED':

          
          // If we don't have a leader yet, become leader
          if (!leaderTabId) {
            becomeLeader(currentTabId);
          }
          break;
          
        case 'LEADER_ELECTION':

          
          // If this tab has an older timestamp, defer to the new leader
          if (!leaderTabId || (timestamp && timestamp < getLeadershipTimestamp())) {
            leaderTabId = tabId;
            isLeader = false;
            
            // Store leader info in localStorage for cross-tab sync
            localStorage.setItem('auth_leader_tab', tabId);
            localStorage.setItem('auth_leader_timestamp', timestamp || Date.now());
          }
          break;
          
        case 'TOKEN_REFRESH_STARTED':
          // Leader started refresh

          leaderTabId = tabId;
          isLeader = false;
          refreshInProgress = true;
          break;
          
        case 'TOKEN_REFRESH_COMPLETED':
          // Leader completed refresh successfully

          
          if (data.accessToken && data.refreshToken) {
            // Update tokens from leader
            localStorage.setItem("TimeCaptureAccessToken", data.accessToken);
            localStorage.setItem("TimeCaptureRefreshToken", data.refreshToken);
            
            // Resolve any pending refresh promise
            if (refreshPromise && typeof refreshPromise.resolve === 'function') {
              refreshPromise.resolve(data.accessToken);
            }
          }
          
          refreshInProgress = false;
          refreshPromise = null;
          leaderTabId = null;
          isLeader = false;
          localStorage.removeItem('auth_leader_tab');
          break;
          
        case 'TOKEN_REFRESH_FAILED':

          
          refreshInProgress = false;
          refreshPromise = null;
          leaderTabId = null;
          isLeader = false;
          localStorage.removeItem('auth_leader_tab');
          
          // Only clear storage if this is a critical failure
          if (data?.shouldClearStorage) {
            clearAuthTokens();
          }
          break;
          
        case 'LOGOUT':
          // Another tab logged out
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
  
  // Store leadership in localStorage
  localStorage.setItem('auth_leader_tab', tabId);
  localStorage.setItem('auth_leader_timestamp', Date.now().toString());
  
  // Broadcast leadership claim
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'LEADER_ELECTION',
      tabId: tabId,
      timestamp: Date.now()
    });
  }
};

/**
 * Get leadership timestamp from localStorage
 */
const getLeadershipTimestamp = () => {
  const timestamp = localStorage.getItem('auth_leader_timestamp');
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
export const refreshToken = async (baseUrl, isRetry = false) => {
  // Initialize broadcast channel
  initBroadcastChannel();
  
  const currentTabId = getTabId();
  
  // Check if there's already a leader
  const storedLeader = localStorage.getItem('auth_leader_tab');
  const leaderTimestamp = getLeadershipTimestamp();
  const leaderAge = Date.now() - leaderTimestamp;
  
  // If there's a valid leader (less than 10 seconds old), wait for it
  if (storedLeader && storedLeader !== currentTabId && leaderAge < 10000) {

    
    // Wait for leader to complete refresh
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const newAccessToken = localStorage.getItem("TimeCaptureAccessToken");
        if (newAccessToken) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(newAccessToken);
        }
      }, 100);
      
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);

        becomeLeader(currentTabId);
        // Continue with refresh
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
      type: 'REFRESH_NEEDED',
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
  // Set flag BEFORE any async operations
  refreshInProgress = true;
  
  // Create a new promise that we can resolve/reject externally
  let externalResolve, externalReject;
  
  refreshPromise = new Promise((resolve, reject) => {
    externalResolve = resolve;
    externalReject = reject;
  });
  
  // Store resolve/reject functions for cross-tab communication
  refreshPromise.resolve = externalResolve;
  refreshPromise.reject = externalReject;
  
  // Broadcast that we're starting refresh
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'TOKEN_REFRESH_STARTED',
      tabId: tabId,
      timestamp: Date.now()
    });
  }
  
  // Execute the actual refresh
  (async () => {
    let refreshTokenValue;
    
    try {
      refreshTokenValue = localStorage.getItem("TimeCaptureRefreshToken");
      
      if (!refreshTokenValue) {
        console.error(`[Tab ${tabId}] No refresh token found`);
        
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'TOKEN_REFRESH_FAILED',
            tabId: tabId,
            reason: 'NO_REFRESH_TOKEN',
            shouldClearStorage: false
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
      
      // Parse tokens
      let parsedAccessToken, parsedRefreshToken;
      try {
        parsedAccessToken = JSON.parse(myObject.accessToken);
        parsedRefreshToken = JSON.parse(myObject.refreshToken);
      } catch (parseError) {
        throw new Error("Failed to parse tokens");
      }
      
      // Store tokens in localStorage
      localStorage.setItem("TimeCaptureAccessToken", parsedAccessToken);
      localStorage.setItem("TimeCaptureRefreshToken", parsedRefreshToken);
      

      
      // Broadcast success to other tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'TOKEN_REFRESH_COMPLETED',
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
      
      // Check if error is due to refresh token already used
      const isTokenAlreadyUsed = error?.response?.status === 400;
      
      // Check if we have a new refresh token from another tab
      const currentRefreshToken = localStorage.getItem("TimeCaptureRefreshToken");
      const refreshTokenChanged = refreshTokenValue && refreshTokenValue !== currentRefreshToken;
      
      // If token was already used and we have a new token, use it
      if (isTokenAlreadyUsed && refreshTokenChanged) {

        const newAccessToken = localStorage.getItem("TimeCaptureAccessToken");
        if (newAccessToken) {
          externalResolve(newAccessToken);
          return;
        }
      }
      
      // Don't show alert or clear storage for 400 errors (token reuse)
      const shouldClearStorage = error?.response?.status !== 400;
      
      if (shouldClearStorage) {
        if (typeof showAlertGlobal === "function") {
          showAlertGlobal("error", error?.response?.data?.message || "Authentication failed");
        }
        clearAuthTokens();
      }
      
      // Broadcast failure
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'TOKEN_REFRESH_FAILED',
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
      isLeader = false;
      localStorage.removeItem('auth_leader_tab');
      localStorage.removeItem('auth_leader_timestamp');

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
  localStorage.removeItem('auth_leader_tab');
  localStorage.removeItem('auth_leader_timestamp');
  
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: 'LOGOUT',
      tabId: getTabId()
    });
  }
};

/**
 * Get current access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem("TimeCaptureAccessToken");
};

/**
 * Get current refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem("TimeCaptureRefreshToken");
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = () => {
  localStorage.removeItem("TimeCaptureAccessToken");
  localStorage.removeItem("TimeCaptureRefreshToken");
  localStorage.removeItem('TimeCaptureUserData');
  localStorage.removeItem("TimeCaptureSessionId");
  resetTokenRefresh();
};

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (broadcastChannel) {
      broadcastChannel.close();
    }
    // Don't remove leadership on unload - let other tabs handle it
  });
  
  // On page load, check for stale leadership
  window.addEventListener('load', () => {
    const storedLeader = localStorage.getItem('auth_leader_tab');
    const leaderTimestamp = getLeadershipTimestamp();
    
    if (storedLeader && Date.now() - leaderTimestamp > 10000) {
      localStorage.removeItem('auth_leader_tab');
      localStorage.removeItem('auth_leader_timestamp');
    }
  });
}