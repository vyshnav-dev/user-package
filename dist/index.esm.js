import * as React from 'react';
import React__default, { forwardRef, useContext, Children, isValidElement, cloneElement, createContext, useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button, Autocomplete, Paper as Paper$2, Typography as Typography$2, TextField, FormControl, InputLabel, Select, MenuItem, Tooltip, IconButton as IconButton$2, useTheme as useTheme$3, Box as Box$2, Stack, ListSubheader, InputAdornment, Dialog as Dialog$2, DialogContent as DialogContent$2, CircularProgress, styled as styled$5, Avatar } from '@mui/material';
import NavigateNextIcon$1 from '@mui/icons-material/NavigateNext';
import RefreshIcon from '@mui/icons-material/Refresh';
import FirstPageIcon$1 from '@mui/icons-material/FirstPage';
import LastPageIcon$1 from '@mui/icons-material/LastPage';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AttachmentIcon from '@mui/icons-material/Attachment';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import * as ReactDOM from 'react-dom';
import ReactDOM__default from 'react-dom';
import { MDBModal, MDBModalDialog, MDBModalContent, MDBModalHeader, MDBModalTitle, MDBModalBody, MDBModalFooter, MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import ClearIcon from '@mui/icons-material/Clear';
import '@mui/icons-material/AddCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import CryptoJS from 'crypto-js';
import { debounce } from 'lodash';

let config$1 = null;
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
  config$1 = await response.json();
  const response1 = await fetch('./masterDocType.json');
  config1 = await response1.json();
  config$1.baseUrl;
  config$1.logo;
  primaryColor = config$1.primaryColor;
  secondaryColor = config$1.secondaryColor;
  thirdColor = config$1.thirdColor;
  selectedColor = config$1.selectedColor;
  config$1.backgroundColor;
  profileDateFields = config$1.profileDateFields;
  config$1.rowEvenColor;
  config$1.ChannelId;
  FolderPath = config$1.FolderPath;
  SecurityBaseUrl = config$1.SecurityBaseUrl;
  allowedExtensionsUser = config$1.allowedExtensionsUser;
  transactionDateTimeFields = config$1.transactionDateTimeFields;
  FixedValues = config1.FixedValues;
};

const securityApi = axios.create({
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
      const response = await axios.get(`${baseUrl}login/regeneratetokens?refreshToken=${refreshTokenValue}`, {
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

function _extends$3() {
  return _extends$3 = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$3.apply(null, arguments);
}

function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}

function _extends$2() {
  return _extends$2 = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$2.apply(null, arguments);
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch (e) {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var propTypes = {exports: {}};

var reactIs$2 = {exports: {}};

var reactIs_production_min$1 = {};

/** @license React v16.13.1
 * react-is.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_production_min$1;

function requireReactIs_production_min$1 () {
	if (hasRequiredReactIs_production_min$1) return reactIs_production_min$1;
	hasRequiredReactIs_production_min$1 = 1;
var b="function"===typeof Symbol&&Symbol.for,c=b?Symbol.for("react.element"):60103,d=b?Symbol.for("react.portal"):60106,e=b?Symbol.for("react.fragment"):60107,f=b?Symbol.for("react.strict_mode"):60108,g=b?Symbol.for("react.profiler"):60114,h=b?Symbol.for("react.provider"):60109,k=b?Symbol.for("react.context"):60110,l=b?Symbol.for("react.async_mode"):60111,m=b?Symbol.for("react.concurrent_mode"):60111,n=b?Symbol.for("react.forward_ref"):60112,p=b?Symbol.for("react.suspense"):60113,q=b?
	Symbol.for("react.suspense_list"):60120,r=b?Symbol.for("react.memo"):60115,t=b?Symbol.for("react.lazy"):60116,v=b?Symbol.for("react.block"):60121,w=b?Symbol.for("react.fundamental"):60117,x=b?Symbol.for("react.responder"):60118,y=b?Symbol.for("react.scope"):60119;
	function z(a){if("object"===typeof a&&null!==a){var u=a.$$typeof;switch(u){case c:switch(a=a.type,a){case l:case m:case e:case g:case f:case p:return a;default:switch(a=a&&a.$$typeof,a){case k:case n:case t:case r:case h:return a;default:return u}}case d:return u}}}function A(a){return z(a)===m}reactIs_production_min$1.AsyncMode=l;reactIs_production_min$1.ConcurrentMode=m;reactIs_production_min$1.ContextConsumer=k;reactIs_production_min$1.ContextProvider=h;reactIs_production_min$1.Element=c;reactIs_production_min$1.ForwardRef=n;reactIs_production_min$1.Fragment=e;reactIs_production_min$1.Lazy=t;reactIs_production_min$1.Memo=r;reactIs_production_min$1.Portal=d;
	reactIs_production_min$1.Profiler=g;reactIs_production_min$1.StrictMode=f;reactIs_production_min$1.Suspense=p;reactIs_production_min$1.isAsyncMode=function(a){return A(a)||z(a)===l};reactIs_production_min$1.isConcurrentMode=A;reactIs_production_min$1.isContextConsumer=function(a){return z(a)===k};reactIs_production_min$1.isContextProvider=function(a){return z(a)===h};reactIs_production_min$1.isElement=function(a){return "object"===typeof a&&null!==a&&a.$$typeof===c};reactIs_production_min$1.isForwardRef=function(a){return z(a)===n};reactIs_production_min$1.isFragment=function(a){return z(a)===e};reactIs_production_min$1.isLazy=function(a){return z(a)===t};
	reactIs_production_min$1.isMemo=function(a){return z(a)===r};reactIs_production_min$1.isPortal=function(a){return z(a)===d};reactIs_production_min$1.isProfiler=function(a){return z(a)===g};reactIs_production_min$1.isStrictMode=function(a){return z(a)===f};reactIs_production_min$1.isSuspense=function(a){return z(a)===p};
	reactIs_production_min$1.isValidElementType=function(a){return "string"===typeof a||"function"===typeof a||a===e||a===m||a===g||a===f||a===p||a===q||"object"===typeof a&&null!==a&&(a.$$typeof===t||a.$$typeof===r||a.$$typeof===h||a.$$typeof===k||a.$$typeof===n||a.$$typeof===w||a.$$typeof===x||a.$$typeof===y||a.$$typeof===v)};reactIs_production_min$1.typeOf=z;
	return reactIs_production_min$1;
}

var reactIs_development$2 = {};

/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_development$2;

function requireReactIs_development$2 () {
	if (hasRequiredReactIs_development$2) return reactIs_development$2;
	hasRequiredReactIs_development$2 = 1;



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

	reactIs_development$2.AsyncMode = AsyncMode;
	reactIs_development$2.ConcurrentMode = ConcurrentMode;
	reactIs_development$2.ContextConsumer = ContextConsumer;
	reactIs_development$2.ContextProvider = ContextProvider;
	reactIs_development$2.Element = Element;
	reactIs_development$2.ForwardRef = ForwardRef;
	reactIs_development$2.Fragment = Fragment;
	reactIs_development$2.Lazy = Lazy;
	reactIs_development$2.Memo = Memo;
	reactIs_development$2.Portal = Portal;
	reactIs_development$2.Profiler = Profiler;
	reactIs_development$2.StrictMode = StrictMode;
	reactIs_development$2.Suspense = Suspense;
	reactIs_development$2.isAsyncMode = isAsyncMode;
	reactIs_development$2.isConcurrentMode = isConcurrentMode;
	reactIs_development$2.isContextConsumer = isContextConsumer;
	reactIs_development$2.isContextProvider = isContextProvider;
	reactIs_development$2.isElement = isElement;
	reactIs_development$2.isForwardRef = isForwardRef;
	reactIs_development$2.isFragment = isFragment;
	reactIs_development$2.isLazy = isLazy;
	reactIs_development$2.isMemo = isMemo;
	reactIs_development$2.isPortal = isPortal;
	reactIs_development$2.isProfiler = isProfiler;
	reactIs_development$2.isStrictMode = isStrictMode;
	reactIs_development$2.isSuspense = isSuspense;
	reactIs_development$2.isValidElementType = isValidElementType;
	reactIs_development$2.typeOf = typeOf;
	  })();
	}
	return reactIs_development$2;
}

var hasRequiredReactIs$2;

function requireReactIs$2 () {
	if (hasRequiredReactIs$2) return reactIs$2.exports;
	hasRequiredReactIs$2 = 1;

	if (process.env.NODE_ENV === 'production') {
	  reactIs$2.exports = requireReactIs_production_min$1();
	} else {
	  reactIs$2.exports = requireReactIs_development$2();
	}
	return reactIs$2.exports;
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

	var ReactIs = requireReactIs$2();
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
	  var ReactIs = requireReactIs$2();

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

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

function composeClasses(slots, getUtilityClass, classes = undefined) {
  const output = {};
  Object.keys(slots).forEach(
  // `Object.keys(slots)` can't be wider than `T` because we infer `T` from `slots`.
  // @ts-expect-error https://github.com/microsoft/TypeScript/pull/12253#issuecomment-263132208
  slot => {
    output[slot] = slots[slot].reduce((acc, key) => {
      if (key) {
        const utilityClass = getUtilityClass(key);
        if (utilityClass !== '') {
          acc.push(utilityClass);
        }
        if (classes && classes[key]) {
          acc.push(classes[key]);
        }
      }
      return acc;
    }, []).join(' ');
  });
  return output;
}

var colorManipulator = {};

var interopRequireDefault = {exports: {}};

interopRequireDefault.exports;

var hasRequiredInteropRequireDefault;

function requireInteropRequireDefault () {
	if (hasRequiredInteropRequireDefault) return interopRequireDefault.exports;
	hasRequiredInteropRequireDefault = 1;
	(function (module) {
		function _interopRequireDefault(e) {
		  return e && e.__esModule ? e : {
		    "default": e
		  };
		}
		module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports; 
	} (interopRequireDefault));
	return interopRequireDefault.exports;
}

/**
 * WARNING: Don't import this directly.
 * Use `MuiError` from `@mui/internal-babel-macros/MuiError.macro` instead.
 * @param {number} code
 */
function formatMuiErrorMessage$1(code) {
  // Apply babel-plugin-transform-template-literals in loose mode
  // loose mode is safe if we're concatenating primitives
  // see https://babeljs.io/docs/en/babel-plugin-transform-template-literals#loose
  /* eslint-disable prefer-template */
  let url = 'https://mui.com/production-error/?code=' + code;
  for (let i = 1; i < arguments.length; i += 1) {
    // rest params over-transpile for this case
    // eslint-disable-next-line prefer-rest-params
    url += '&args[]=' + encodeURIComponent(arguments[i]);
  }
  return 'Minified MUI error #' + code + '; visit ' + url + ' for the full message.';
  /* eslint-enable prefer-template */
}

var formatMuiErrorMessage = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': formatMuiErrorMessage$1
});

var require$$1 = /*@__PURE__*/getAugmentedNamespace(formatMuiErrorMessage);

function clamp$1(val, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  return Math.max(min, Math.min(val, max));
}

var clamp = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': clamp$1
});

var require$$2 = /*@__PURE__*/getAugmentedNamespace(clamp);

var hasRequiredColorManipulator;

function requireColorManipulator () {
	if (hasRequiredColorManipulator) return colorManipulator;
	hasRequiredColorManipulator = 1;

	var _interopRequireDefault = requireInteropRequireDefault();
	Object.defineProperty(colorManipulator, "__esModule", {
	  value: true
	});
	colorManipulator.alpha = alpha;
	colorManipulator.blend = blend;
	colorManipulator.colorChannel = void 0;
	colorManipulator.darken = darken;
	colorManipulator.decomposeColor = decomposeColor;
	colorManipulator.emphasize = emphasize;
	colorManipulator.getContrastRatio = getContrastRatio;
	colorManipulator.getLuminance = getLuminance;
	colorManipulator.hexToRgb = hexToRgb;
	colorManipulator.hslToRgb = hslToRgb;
	colorManipulator.lighten = lighten;
	colorManipulator.private_safeAlpha = private_safeAlpha;
	colorManipulator.private_safeColorChannel = void 0;
	colorManipulator.private_safeDarken = private_safeDarken;
	colorManipulator.private_safeEmphasize = private_safeEmphasize;
	colorManipulator.private_safeLighten = private_safeLighten;
	colorManipulator.recomposeColor = recomposeColor;
	colorManipulator.rgbToHex = rgbToHex;
	var _formatMuiErrorMessage2 = _interopRequireDefault(require$$1);
	var _clamp = _interopRequireDefault(require$$2);
	/* eslint-disable @typescript-eslint/naming-convention */

	/**
	 * Returns a number whose value is limited to the given range.
	 * @param {number} value The value to be clamped
	 * @param {number} min The lower boundary of the output range
	 * @param {number} max The upper boundary of the output range
	 * @returns {number} A number in the range [min, max]
	 */
	function clampWrapper(value, min = 0, max = 1) {
	  if (process.env.NODE_ENV !== 'production') {
	    if (value < min || value > max) {
	      console.error(`MUI: The value provided ${value} is out of range [${min}, ${max}].`);
	    }
	  }
	  return (0, _clamp.default)(value, min, max);
	}

	/**
	 * Converts a color from CSS hex format to CSS rgb format.
	 * @param {string} color - Hex color, i.e. #nnn or #nnnnnn
	 * @returns {string} A CSS rgb color string
	 */
	function hexToRgb(color) {
	  color = color.slice(1);
	  const re = new RegExp(`.{1,${color.length >= 6 ? 2 : 1}}`, 'g');
	  let colors = color.match(re);
	  if (colors && colors[0].length === 1) {
	    colors = colors.map(n => n + n);
	  }
	  return colors ? `rgb${colors.length === 4 ? 'a' : ''}(${colors.map((n, index) => {
	    return index < 3 ? parseInt(n, 16) : Math.round(parseInt(n, 16) / 255 * 1000) / 1000;
	  }).join(', ')})` : '';
	}
	function intToHex(int) {
	  const hex = int.toString(16);
	  return hex.length === 1 ? `0${hex}` : hex;
	}

	/**
	 * Returns an object with the type and values of a color.
	 *
	 * Note: Does not support rgb % values.
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @returns {object} - A MUI color object: {type: string, values: number[]}
	 */
	function decomposeColor(color) {
	  // Idempotent
	  if (color.type) {
	    return color;
	  }
	  if (color.charAt(0) === '#') {
	    return decomposeColor(hexToRgb(color));
	  }
	  const marker = color.indexOf('(');
	  const type = color.substring(0, marker);
	  if (['rgb', 'rgba', 'hsl', 'hsla', 'color'].indexOf(type) === -1) {
	    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: Unsupported \`${color}\` color.
The following formats are supported: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color().` : (0, _formatMuiErrorMessage2.default)(9, color));
	  }
	  let values = color.substring(marker + 1, color.length - 1);
	  let colorSpace;
	  if (type === 'color') {
	    values = values.split(' ');
	    colorSpace = values.shift();
	    if (values.length === 4 && values[3].charAt(0) === '/') {
	      values[3] = values[3].slice(1);
	    }
	    if (['srgb', 'display-p3', 'a98-rgb', 'prophoto-rgb', 'rec-2020'].indexOf(colorSpace) === -1) {
	      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: unsupported \`${colorSpace}\` color space.
The following color spaces are supported: srgb, display-p3, a98-rgb, prophoto-rgb, rec-2020.` : (0, _formatMuiErrorMessage2.default)(10, colorSpace));
	    }
	  } else {
	    values = values.split(',');
	  }
	  values = values.map(value => parseFloat(value));
	  return {
	    type,
	    values,
	    colorSpace
	  };
	}

	/**
	 * Returns a channel created from the input color.
	 *
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @returns {string} - The channel for the color, that can be used in rgba or hsla colors
	 */
	const colorChannel = color => {
	  const decomposedColor = decomposeColor(color);
	  return decomposedColor.values.slice(0, 3).map((val, idx) => decomposedColor.type.indexOf('hsl') !== -1 && idx !== 0 ? `${val}%` : val).join(' ');
	};
	colorManipulator.colorChannel = colorChannel;
	const private_safeColorChannel = (color, warning) => {
	  try {
	    return colorChannel(color);
	  } catch (error) {
	    if (warning && process.env.NODE_ENV !== 'production') {
	      console.warn(warning);
	    }
	    return color;
	  }
	};

	/**
	 * Converts a color object with type and values to a string.
	 * @param {object} color - Decomposed color
	 * @param {string} color.type - One of: 'rgb', 'rgba', 'hsl', 'hsla', 'color'
	 * @param {array} color.values - [n,n,n] or [n,n,n,n]
	 * @returns {string} A CSS color string
	 */
	colorManipulator.private_safeColorChannel = private_safeColorChannel;
	function recomposeColor(color) {
	  const {
	    type,
	    colorSpace
	  } = color;
	  let {
	    values
	  } = color;
	  if (type.indexOf('rgb') !== -1) {
	    // Only convert the first 3 values to int (i.e. not alpha)
	    values = values.map((n, i) => i < 3 ? parseInt(n, 10) : n);
	  } else if (type.indexOf('hsl') !== -1) {
	    values[1] = `${values[1]}%`;
	    values[2] = `${values[2]}%`;
	  }
	  if (type.indexOf('color') !== -1) {
	    values = `${colorSpace} ${values.join(' ')}`;
	  } else {
	    values = `${values.join(', ')}`;
	  }
	  return `${type}(${values})`;
	}

	/**
	 * Converts a color from CSS rgb format to CSS hex format.
	 * @param {string} color - RGB color, i.e. rgb(n, n, n)
	 * @returns {string} A CSS rgb color string, i.e. #nnnnnn
	 */
	function rgbToHex(color) {
	  // Idempotent
	  if (color.indexOf('#') === 0) {
	    return color;
	  }
	  const {
	    values
	  } = decomposeColor(color);
	  return `#${values.map((n, i) => intToHex(i === 3 ? Math.round(255 * n) : n)).join('')}`;
	}

	/**
	 * Converts a color from hsl format to rgb format.
	 * @param {string} color - HSL color values
	 * @returns {string} rgb color values
	 */
	function hslToRgb(color) {
	  color = decomposeColor(color);
	  const {
	    values
	  } = color;
	  const h = values[0];
	  const s = values[1] / 100;
	  const l = values[2] / 100;
	  const a = s * Math.min(l, 1 - l);
	  const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	  let type = 'rgb';
	  const rgb = [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
	  if (color.type === 'hsla') {
	    type += 'a';
	    rgb.push(values[3]);
	  }
	  return recomposeColor({
	    type,
	    values: rgb
	  });
	}
	/**
	 * The relative brightness of any point in a color space,
	 * normalized to 0 for darkest black and 1 for lightest white.
	 *
	 * Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @returns {number} The relative brightness of the color in the range 0 - 1
	 */
	function getLuminance(color) {
	  color = decomposeColor(color);
	  let rgb = color.type === 'hsl' || color.type === 'hsla' ? decomposeColor(hslToRgb(color)).values : color.values;
	  rgb = rgb.map(val => {
	    if (color.type !== 'color') {
	      val /= 255; // normalized
	    }
	    return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
	  });

	  // Truncate at 3 digits
	  return Number((0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]).toFixed(3));
	}

	/**
	 * Calculates the contrast ratio between two colors.
	 *
	 * Formula: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
	 * @param {string} foreground - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
	 * @param {string} background - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla()
	 * @returns {number} A contrast ratio value in the range 0 - 21.
	 */
	function getContrastRatio(foreground, background) {
	  const lumA = getLuminance(foreground);
	  const lumB = getLuminance(background);
	  return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
	}

	/**
	 * Sets the absolute transparency of a color.
	 * Any existing alpha values are overwritten.
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @param {number} value - value to set the alpha channel to in the range 0 - 1
	 * @returns {string} A CSS color string. Hex input values are returned as rgb
	 */
	function alpha(color, value) {
	  color = decomposeColor(color);
	  value = clampWrapper(value);
	  if (color.type === 'rgb' || color.type === 'hsl') {
	    color.type += 'a';
	  }
	  if (color.type === 'color') {
	    color.values[3] = `/${value}`;
	  } else {
	    color.values[3] = value;
	  }
	  return recomposeColor(color);
	}
	function private_safeAlpha(color, value, warning) {
	  try {
	    return alpha(color, value);
	  } catch (error) {
	    if (warning && process.env.NODE_ENV !== 'production') {
	      console.warn(warning);
	    }
	    return color;
	  }
	}

	/**
	 * Darkens a color.
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @param {number} coefficient - multiplier in the range 0 - 1
	 * @returns {string} A CSS color string. Hex input values are returned as rgb
	 */
	function darken(color, coefficient) {
	  color = decomposeColor(color);
	  coefficient = clampWrapper(coefficient);
	  if (color.type.indexOf('hsl') !== -1) {
	    color.values[2] *= 1 - coefficient;
	  } else if (color.type.indexOf('rgb') !== -1 || color.type.indexOf('color') !== -1) {
	    for (let i = 0; i < 3; i += 1) {
	      color.values[i] *= 1 - coefficient;
	    }
	  }
	  return recomposeColor(color);
	}
	function private_safeDarken(color, coefficient, warning) {
	  try {
	    return darken(color, coefficient);
	  } catch (error) {
	    if (warning && process.env.NODE_ENV !== 'production') {
	      console.warn(warning);
	    }
	    return color;
	  }
	}

	/**
	 * Lightens a color.
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @param {number} coefficient - multiplier in the range 0 - 1
	 * @returns {string} A CSS color string. Hex input values are returned as rgb
	 */
	function lighten(color, coefficient) {
	  color = decomposeColor(color);
	  coefficient = clampWrapper(coefficient);
	  if (color.type.indexOf('hsl') !== -1) {
	    color.values[2] += (100 - color.values[2]) * coefficient;
	  } else if (color.type.indexOf('rgb') !== -1) {
	    for (let i = 0; i < 3; i += 1) {
	      color.values[i] += (255 - color.values[i]) * coefficient;
	    }
	  } else if (color.type.indexOf('color') !== -1) {
	    for (let i = 0; i < 3; i += 1) {
	      color.values[i] += (1 - color.values[i]) * coefficient;
	    }
	  }
	  return recomposeColor(color);
	}
	function private_safeLighten(color, coefficient, warning) {
	  try {
	    return lighten(color, coefficient);
	  } catch (error) {
	    if (warning && process.env.NODE_ENV !== 'production') {
	      console.warn(warning);
	    }
	    return color;
	  }
	}

	/**
	 * Darken or lighten a color, depending on its luminance.
	 * Light colors are darkened, dark colors are lightened.
	 * @param {string} color - CSS color, i.e. one of: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla(), color()
	 * @param {number} coefficient=0.15 - multiplier in the range 0 - 1
	 * @returns {string} A CSS color string. Hex input values are returned as rgb
	 */
	function emphasize(color, coefficient = 0.15) {
	  return getLuminance(color) > 0.5 ? darken(color, coefficient) : lighten(color, coefficient);
	}
	function private_safeEmphasize(color, coefficient, warning) {
	  try {
	    return emphasize(color, coefficient);
	  } catch (error) {
	    if (warning && process.env.NODE_ENV !== 'production') {
	      console.warn(warning);
	    }
	    return color;
	  }
	}

	/**
	 * Blend a transparent overlay color with a background color, resulting in a single
	 * RGB color.
	 * @param {string} background - CSS color
	 * @param {string} overlay - CSS color
	 * @param {number} opacity - Opacity multiplier in the range 0 - 1
	 * @param {number} [gamma=1.0] - Gamma correction factor. For gamma-correct blending, 2.2 is usual.
	 */
	function blend(background, overlay, opacity, gamma = 1.0) {
	  const blendChannel = (b, o) => Math.round((b ** (1 / gamma) * (1 - opacity) + o ** (1 / gamma) * opacity) ** gamma);
	  const backgroundColor = decomposeColor(background);
	  const overlayColor = decomposeColor(overlay);
	  const rgb = [blendChannel(backgroundColor.values[0], overlayColor.values[0]), blendChannel(backgroundColor.values[1], overlayColor.values[1]), blendChannel(backgroundColor.values[2], overlayColor.values[2])];
	  return recomposeColor({
	    type: 'rgb',
	    values: rgb
	  });
	}
	return colorManipulator;
}

var colorManipulatorExports = /*@__PURE__*/ requireColorManipulator();

/**
 * Add keys, values of `defaultProps` that does not exist in `props`
 * @param {object} defaultProps
 * @param {object} props
 * @returns {object} resolved props
 */
function resolveProps(defaultProps, props) {
  const output = _extends$2({}, props);
  Object.keys(defaultProps).forEach(propName => {
    if (propName.toString().match(/^(components|slots)$/)) {
      output[propName] = _extends$2({}, defaultProps[propName], output[propName]);
    } else if (propName.toString().match(/^(componentsProps|slotProps)$/)) {
      const defaultSlotProps = defaultProps[propName] || {};
      const slotProps = props[propName];
      output[propName] = {};
      if (!slotProps || !Object.keys(slotProps)) {
        // Reduce the iteration if the slot props is empty
        output[propName] = defaultSlotProps;
      } else if (!defaultSlotProps || !Object.keys(defaultSlotProps)) {
        // Reduce the iteration if the default slot props is empty
        output[propName] = slotProps;
      } else {
        output[propName] = _extends$2({}, slotProps);
        Object.keys(defaultSlotProps).forEach(slotPropName => {
          output[propName][slotPropName] = resolveProps(defaultSlotProps[slotPropName], slotProps[slotPropName]);
        });
      }
    } else if (output[propName] === undefined) {
      output[propName] = defaultProps[propName];
    }
  });
  return output;
}

// https://github.com/sindresorhus/is-plain-obj/blob/main/index.js
function isPlainObject(item) {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  const prototype = Object.getPrototypeOf(item);
  return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in item) && !(Symbol.iterator in item);
}
function deepClone(source) {
  if ( /*#__PURE__*/React.isValidElement(source) || !isPlainObject(source)) {
    return source;
  }
  const output = {};
  Object.keys(source).forEach(key => {
    output[key] = deepClone(source[key]);
  });
  return output;
}
function deepmerge$1(target, source, options = {
  clone: true
}) {
  const output = options.clone ? _extends$2({}, target) : target;
  if (isPlainObject(target) && isPlainObject(source)) {
    Object.keys(source).forEach(key => {
      if ( /*#__PURE__*/React.isValidElement(source[key])) {
        output[key] = source[key];
      } else if (isPlainObject(source[key]) &&
      // Avoid prototype pollution
      Object.prototype.hasOwnProperty.call(target, key) && isPlainObject(target[key])) {
        // Since `output` is a clone of `target` and we have narrowed `target` in this block we can cast to the same type.
        output[key] = deepmerge$1(target[key], source[key], options);
      } else if (options.clone) {
        output[key] = isPlainObject(source[key]) ? deepClone(source[key]) : source[key];
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

var deepmerge = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': deepmerge$1,
  isPlainObject: isPlainObject
});

const _excluded$v = ["values", "unit", "step"];
const sortBreakpointsValues = values => {
  const breakpointsAsArray = Object.keys(values).map(key => ({
    key,
    val: values[key]
  })) || [];
  // Sort in ascending order
  breakpointsAsArray.sort((breakpoint1, breakpoint2) => breakpoint1.val - breakpoint2.val);
  return breakpointsAsArray.reduce((acc, obj) => {
    return _extends$2({}, acc, {
      [obj.key]: obj.val
    });
  }, {});
};

// Keep in mind that @media is inclusive by the CSS specification.
function createBreakpoints(breakpoints) {
  const {
      // The breakpoint **start** at this value.
      // For instance with the first breakpoint xs: [xs, sm).
      values = {
        xs: 0,
        // phone
        sm: 600,
        // tablet
        md: 900,
        // small laptop
        lg: 1200,
        // desktop
        xl: 1536 // large screen
      },
      unit = 'px',
      step = 5
    } = breakpoints,
    other = _objectWithoutPropertiesLoose(breakpoints, _excluded$v);
  const sortedValues = sortBreakpointsValues(values);
  const keys = Object.keys(sortedValues);
  function up(key) {
    const value = typeof values[key] === 'number' ? values[key] : key;
    return `@media (min-width:${value}${unit})`;
  }
  function down(key) {
    const value = typeof values[key] === 'number' ? values[key] : key;
    return `@media (max-width:${value - step / 100}${unit})`;
  }
  function between(start, end) {
    const endIndex = keys.indexOf(end);
    return `@media (min-width:${typeof values[start] === 'number' ? values[start] : start}${unit}) and ` + `(max-width:${(endIndex !== -1 && typeof values[keys[endIndex]] === 'number' ? values[keys[endIndex]] : end) - step / 100}${unit})`;
  }
  function only(key) {
    if (keys.indexOf(key) + 1 < keys.length) {
      return between(key, keys[keys.indexOf(key) + 1]);
    }
    return up(key);
  }
  function not(key) {
    // handle first and last key separately, for better readability
    const keyIndex = keys.indexOf(key);
    if (keyIndex === 0) {
      return up(keys[1]);
    }
    if (keyIndex === keys.length - 1) {
      return down(keys[keyIndex]);
    }
    return between(key, keys[keys.indexOf(key) + 1]).replace('@media', '@media not all and');
  }
  return _extends$2({
    keys,
    values: sortedValues,
    up,
    down,
    between,
    only,
    not,
    unit
  }, other);
}

const shape = {
  borderRadius: 4
};
var shape$1 = shape;

const responsivePropType = process.env.NODE_ENV !== 'production' ? PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.object, PropTypes.array]) : {};
var responsivePropType$1 = responsivePropType;

function merge(acc, item) {
  if (!item) {
    return acc;
  }
  return deepmerge$1(acc, item, {
    clone: false // No need to clone deep, it's way faster.
  });
}

// The breakpoint **start** at this value.
// For instance with the first breakpoint xs: [xs, sm[.
const values$1 = {
  xs: 0,
  // phone
  sm: 600,
  // tablet
  md: 900,
  // small laptop
  lg: 1200,
  // desktop
  xl: 1536 // large screen
};
const defaultBreakpoints = {
  // Sorted ASC by size. That's important.
  // It can't be configured as it's used statically for propTypes.
  keys: ['xs', 'sm', 'md', 'lg', 'xl'],
  up: key => `@media (min-width:${values$1[key]}px)`
};
function handleBreakpoints(props, propValue, styleFromPropValue) {
  const theme = props.theme || {};
  if (Array.isArray(propValue)) {
    const themeBreakpoints = theme.breakpoints || defaultBreakpoints;
    return propValue.reduce((acc, item, index) => {
      acc[themeBreakpoints.up(themeBreakpoints.keys[index])] = styleFromPropValue(propValue[index]);
      return acc;
    }, {});
  }
  if (typeof propValue === 'object') {
    const themeBreakpoints = theme.breakpoints || defaultBreakpoints;
    return Object.keys(propValue).reduce((acc, breakpoint) => {
      // key is breakpoint
      if (Object.keys(themeBreakpoints.values || values$1).indexOf(breakpoint) !== -1) {
        const mediaKey = themeBreakpoints.up(breakpoint);
        acc[mediaKey] = styleFromPropValue(propValue[breakpoint], breakpoint);
      } else {
        const cssKey = breakpoint;
        acc[cssKey] = propValue[cssKey];
      }
      return acc;
    }, {});
  }
  const output = styleFromPropValue(propValue);
  return output;
}
function createEmptyBreakpointObject(breakpointsInput = {}) {
  var _breakpointsInput$key;
  const breakpointsInOrder = (_breakpointsInput$key = breakpointsInput.keys) == null ? void 0 : _breakpointsInput$key.reduce((acc, key) => {
    const breakpointStyleKey = breakpointsInput.up(key);
    acc[breakpointStyleKey] = {};
    return acc;
  }, {});
  return breakpointsInOrder || {};
}
function removeUnusedBreakpoints(breakpointKeys, style) {
  return breakpointKeys.reduce((acc, key) => {
    const breakpointOutput = acc[key];
    const isBreakpointUnused = !breakpointOutput || Object.keys(breakpointOutput).length === 0;
    if (isBreakpointUnused) {
      delete acc[key];
    }
    return acc;
  }, style);
}

// It should to be noted that this function isn't equivalent to `text-transform: capitalize`.
//
// A strict capitalization should uppercase the first letter of each word in the sentence.
// We only handle the first word.
function capitalize$1(string) {
  if (typeof string !== 'string') {
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: \`capitalize(string)\` expects a string argument.` : formatMuiErrorMessage$1(7));
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

var capitalize = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': capitalize$1
});

function getPath(obj, path, checkVars = true) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // Check if CSS variables are used
  if (obj && obj.vars && checkVars) {
    const val = `vars.${path}`.split('.').reduce((acc, item) => acc && acc[item] ? acc[item] : null, obj);
    if (val != null) {
      return val;
    }
  }
  return path.split('.').reduce((acc, item) => {
    if (acc && acc[item] != null) {
      return acc[item];
    }
    return null;
  }, obj);
}
function getStyleValue(themeMapping, transform, propValueFinal, userValue = propValueFinal) {
  let value;
  if (typeof themeMapping === 'function') {
    value = themeMapping(propValueFinal);
  } else if (Array.isArray(themeMapping)) {
    value = themeMapping[propValueFinal] || userValue;
  } else {
    value = getPath(themeMapping, propValueFinal) || userValue;
  }
  if (transform) {
    value = transform(value, userValue, themeMapping);
  }
  return value;
}
function style$1(options) {
  const {
    prop,
    cssProperty = options.prop,
    themeKey,
    transform
  } = options;

  // false positive
  // eslint-disable-next-line react/function-component-definition
  const fn = props => {
    if (props[prop] == null) {
      return null;
    }
    const propValue = props[prop];
    const theme = props.theme;
    const themeMapping = getPath(theme, themeKey) || {};
    const styleFromPropValue = propValueFinal => {
      let value = getStyleValue(themeMapping, transform, propValueFinal);
      if (propValueFinal === value && typeof propValueFinal === 'string') {
        // Haven't found value
        value = getStyleValue(themeMapping, transform, `${prop}${propValueFinal === 'default' ? '' : capitalize$1(propValueFinal)}`, propValueFinal);
      }
      if (cssProperty === false) {
        return value;
      }
      return {
        [cssProperty]: value
      };
    };
    return handleBreakpoints(props, propValue, styleFromPropValue);
  };
  fn.propTypes = process.env.NODE_ENV !== 'production' ? {
    [prop]: responsivePropType$1
  } : {};
  fn.filterProps = [prop];
  return fn;
}

function memoize$2(fn) {
  const cache = {};
  return arg => {
    if (cache[arg] === undefined) {
      cache[arg] = fn(arg);
    }
    return cache[arg];
  };
}

const properties = {
  m: 'margin',
  p: 'padding'
};
const directions = {
  t: 'Top',
  r: 'Right',
  b: 'Bottom',
  l: 'Left',
  x: ['Left', 'Right'],
  y: ['Top', 'Bottom']
};
const aliases = {
  marginX: 'mx',
  marginY: 'my',
  paddingX: 'px',
  paddingY: 'py'
};

// memoize() impact:
// From 300,000 ops/sec
// To 350,000 ops/sec
const getCssProperties = memoize$2(prop => {
  // It's not a shorthand notation.
  if (prop.length > 2) {
    if (aliases[prop]) {
      prop = aliases[prop];
    } else {
      return [prop];
    }
  }
  const [a, b] = prop.split('');
  const property = properties[a];
  const direction = directions[b] || '';
  return Array.isArray(direction) ? direction.map(dir => property + dir) : [property + direction];
});
const marginKeys = ['m', 'mt', 'mr', 'mb', 'ml', 'mx', 'my', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'marginX', 'marginY', 'marginInline', 'marginInlineStart', 'marginInlineEnd', 'marginBlock', 'marginBlockStart', 'marginBlockEnd'];
const paddingKeys = ['p', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'paddingX', 'paddingY', 'paddingInline', 'paddingInlineStart', 'paddingInlineEnd', 'paddingBlock', 'paddingBlockStart', 'paddingBlockEnd'];
const spacingKeys = [...marginKeys, ...paddingKeys];
function createUnaryUnit(theme, themeKey, defaultValue, propName) {
  var _getPath;
  const themeSpacing = (_getPath = getPath(theme, themeKey, false)) != null ? _getPath : defaultValue;
  if (typeof themeSpacing === 'number') {
    return abs => {
      if (typeof abs === 'string') {
        return abs;
      }
      if (process.env.NODE_ENV !== 'production') {
        if (typeof abs !== 'number') {
          console.error(`MUI: Expected ${propName} argument to be a number or a string, got ${abs}.`);
        }
      }
      return themeSpacing * abs;
    };
  }
  if (Array.isArray(themeSpacing)) {
    return abs => {
      if (typeof abs === 'string') {
        return abs;
      }
      if (process.env.NODE_ENV !== 'production') {
        if (!Number.isInteger(abs)) {
          console.error([`MUI: The \`theme.${themeKey}\` array type cannot be combined with non integer values.` + `You should either use an integer value that can be used as index, or define the \`theme.${themeKey}\` as a number.`].join('\n'));
        } else if (abs > themeSpacing.length - 1) {
          console.error([`MUI: The value provided (${abs}) overflows.`, `The supported values are: ${JSON.stringify(themeSpacing)}.`, `${abs} > ${themeSpacing.length - 1}, you need to add the missing values.`].join('\n'));
        }
      }
      return themeSpacing[abs];
    };
  }
  if (typeof themeSpacing === 'function') {
    return themeSpacing;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error([`MUI: The \`theme.${themeKey}\` value (${themeSpacing}) is invalid.`, 'It should be a number, an array or a function.'].join('\n'));
  }
  return () => undefined;
}
function createUnarySpacing(theme) {
  return createUnaryUnit(theme, 'spacing', 8, 'spacing');
}
function getValue(transformer, propValue) {
  if (typeof propValue === 'string' || propValue == null) {
    return propValue;
  }
  const abs = Math.abs(propValue);
  const transformed = transformer(abs);
  if (propValue >= 0) {
    return transformed;
  }
  if (typeof transformed === 'number') {
    return -transformed;
  }
  return `-${transformed}`;
}
function getStyleFromPropValue(cssProperties, transformer) {
  return propValue => cssProperties.reduce((acc, cssProperty) => {
    acc[cssProperty] = getValue(transformer, propValue);
    return acc;
  }, {});
}
function resolveCssProperty(props, keys, prop, transformer) {
  // Using a hash computation over an array iteration could be faster, but with only 28 items,
  // it's doesn't worth the bundle size.
  if (keys.indexOf(prop) === -1) {
    return null;
  }
  const cssProperties = getCssProperties(prop);
  const styleFromPropValue = getStyleFromPropValue(cssProperties, transformer);
  const propValue = props[prop];
  return handleBreakpoints(props, propValue, styleFromPropValue);
}
function style(props, keys) {
  const transformer = createUnarySpacing(props.theme);
  return Object.keys(props).map(prop => resolveCssProperty(props, keys, prop, transformer)).reduce(merge, {});
}
function margin(props) {
  return style(props, marginKeys);
}
margin.propTypes = process.env.NODE_ENV !== 'production' ? marginKeys.reduce((obj, key) => {
  obj[key] = responsivePropType$1;
  return obj;
}, {}) : {};
margin.filterProps = marginKeys;
function padding(props) {
  return style(props, paddingKeys);
}
padding.propTypes = process.env.NODE_ENV !== 'production' ? paddingKeys.reduce((obj, key) => {
  obj[key] = responsivePropType$1;
  return obj;
}, {}) : {};
padding.filterProps = paddingKeys;
process.env.NODE_ENV !== 'production' ? spacingKeys.reduce((obj, key) => {
  obj[key] = responsivePropType$1;
  return obj;
}, {}) : {};

// The different signatures imply different meaning for their arguments that can't be expressed structurally.
// We express the difference with variable names.

function createSpacing(spacingInput = 8) {
  // Already transformed.
  if (spacingInput.mui) {
    return spacingInput;
  }

  // Material Design layouts are visually balanced. Most measurements align to an 8dp grid, which aligns both spacing and the overall layout.
  // Smaller components, such as icons, can align to a 4dp grid.
  // https://m2.material.io/design/layout/understanding-layout.html
  const transform = createUnarySpacing({
    spacing: spacingInput
  });
  const spacing = (...argsInput) => {
    if (process.env.NODE_ENV !== 'production') {
      if (!(argsInput.length <= 4)) {
        console.error(`MUI: Too many arguments provided, expected between 0 and 4, got ${argsInput.length}`);
      }
    }
    const args = argsInput.length === 0 ? [1] : argsInput;
    return args.map(argument => {
      const output = transform(argument);
      return typeof output === 'number' ? `${output}px` : output;
    }).join(' ');
  };
  spacing.mui = true;
  return spacing;
}

function compose(...styles) {
  const handlers = styles.reduce((acc, style) => {
    style.filterProps.forEach(prop => {
      acc[prop] = style;
    });
    return acc;
  }, {});

  // false positive
  // eslint-disable-next-line react/function-component-definition
  const fn = props => {
    return Object.keys(props).reduce((acc, prop) => {
      if (handlers[prop]) {
        return merge(acc, handlers[prop](props));
      }
      return acc;
    }, {});
  };
  fn.propTypes = process.env.NODE_ENV !== 'production' ? styles.reduce((acc, style) => Object.assign(acc, style.propTypes), {}) : {};
  fn.filterProps = styles.reduce((acc, style) => acc.concat(style.filterProps), []);
  return fn;
}

function borderTransform(value) {
  if (typeof value !== 'number') {
    return value;
  }
  return `${value}px solid`;
}
function createBorderStyle(prop, transform) {
  return style$1({
    prop,
    themeKey: 'borders',
    transform
  });
}
const border = createBorderStyle('border', borderTransform);
const borderTop = createBorderStyle('borderTop', borderTransform);
const borderRight = createBorderStyle('borderRight', borderTransform);
const borderBottom = createBorderStyle('borderBottom', borderTransform);
const borderLeft = createBorderStyle('borderLeft', borderTransform);
const borderColor = createBorderStyle('borderColor');
const borderTopColor = createBorderStyle('borderTopColor');
const borderRightColor = createBorderStyle('borderRightColor');
const borderBottomColor = createBorderStyle('borderBottomColor');
const borderLeftColor = createBorderStyle('borderLeftColor');
const outline = createBorderStyle('outline', borderTransform);
const outlineColor = createBorderStyle('outlineColor');

// false positive
// eslint-disable-next-line react/function-component-definition
const borderRadius = props => {
  if (props.borderRadius !== undefined && props.borderRadius !== null) {
    const transformer = createUnaryUnit(props.theme, 'shape.borderRadius', 4, 'borderRadius');
    const styleFromPropValue = propValue => ({
      borderRadius: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.borderRadius, styleFromPropValue);
  }
  return null;
};
borderRadius.propTypes = process.env.NODE_ENV !== 'production' ? {
  borderRadius: responsivePropType$1
} : {};
borderRadius.filterProps = ['borderRadius'];
compose(border, borderTop, borderRight, borderBottom, borderLeft, borderColor, borderTopColor, borderRightColor, borderBottomColor, borderLeftColor, borderRadius, outline, outlineColor);

// false positive
// eslint-disable-next-line react/function-component-definition
const gap = props => {
  if (props.gap !== undefined && props.gap !== null) {
    const transformer = createUnaryUnit(props.theme, 'spacing', 8, 'gap');
    const styleFromPropValue = propValue => ({
      gap: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.gap, styleFromPropValue);
  }
  return null;
};
gap.propTypes = process.env.NODE_ENV !== 'production' ? {
  gap: responsivePropType$1
} : {};
gap.filterProps = ['gap'];

// false positive
// eslint-disable-next-line react/function-component-definition
const columnGap = props => {
  if (props.columnGap !== undefined && props.columnGap !== null) {
    const transformer = createUnaryUnit(props.theme, 'spacing', 8, 'columnGap');
    const styleFromPropValue = propValue => ({
      columnGap: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.columnGap, styleFromPropValue);
  }
  return null;
};
columnGap.propTypes = process.env.NODE_ENV !== 'production' ? {
  columnGap: responsivePropType$1
} : {};
columnGap.filterProps = ['columnGap'];

// false positive
// eslint-disable-next-line react/function-component-definition
const rowGap = props => {
  if (props.rowGap !== undefined && props.rowGap !== null) {
    const transformer = createUnaryUnit(props.theme, 'spacing', 8, 'rowGap');
    const styleFromPropValue = propValue => ({
      rowGap: getValue(transformer, propValue)
    });
    return handleBreakpoints(props, props.rowGap, styleFromPropValue);
  }
  return null;
};
rowGap.propTypes = process.env.NODE_ENV !== 'production' ? {
  rowGap: responsivePropType$1
} : {};
rowGap.filterProps = ['rowGap'];
const gridColumn = style$1({
  prop: 'gridColumn'
});
const gridRow = style$1({
  prop: 'gridRow'
});
const gridAutoFlow = style$1({
  prop: 'gridAutoFlow'
});
const gridAutoColumns = style$1({
  prop: 'gridAutoColumns'
});
const gridAutoRows = style$1({
  prop: 'gridAutoRows'
});
const gridTemplateColumns = style$1({
  prop: 'gridTemplateColumns'
});
const gridTemplateRows = style$1({
  prop: 'gridTemplateRows'
});
const gridTemplateAreas = style$1({
  prop: 'gridTemplateAreas'
});
const gridArea = style$1({
  prop: 'gridArea'
});
compose(gap, columnGap, rowGap, gridColumn, gridRow, gridAutoFlow, gridAutoColumns, gridAutoRows, gridTemplateColumns, gridTemplateRows, gridTemplateAreas, gridArea);

function paletteTransform(value, userValue) {
  if (userValue === 'grey') {
    return userValue;
  }
  return value;
}
const color = style$1({
  prop: 'color',
  themeKey: 'palette',
  transform: paletteTransform
});
const bgcolor = style$1({
  prop: 'bgcolor',
  cssProperty: 'backgroundColor',
  themeKey: 'palette',
  transform: paletteTransform
});
const backgroundColor = style$1({
  prop: 'backgroundColor',
  themeKey: 'palette',
  transform: paletteTransform
});
compose(color, bgcolor, backgroundColor);

function sizingTransform(value) {
  return value <= 1 && value !== 0 ? `${value * 100}%` : value;
}
const width = style$1({
  prop: 'width',
  transform: sizingTransform
});
const maxWidth = props => {
  if (props.maxWidth !== undefined && props.maxWidth !== null) {
    const styleFromPropValue = propValue => {
      var _props$theme, _props$theme2;
      const breakpoint = ((_props$theme = props.theme) == null || (_props$theme = _props$theme.breakpoints) == null || (_props$theme = _props$theme.values) == null ? void 0 : _props$theme[propValue]) || values$1[propValue];
      if (!breakpoint) {
        return {
          maxWidth: sizingTransform(propValue)
        };
      }
      if (((_props$theme2 = props.theme) == null || (_props$theme2 = _props$theme2.breakpoints) == null ? void 0 : _props$theme2.unit) !== 'px') {
        return {
          maxWidth: `${breakpoint}${props.theme.breakpoints.unit}`
        };
      }
      return {
        maxWidth: breakpoint
      };
    };
    return handleBreakpoints(props, props.maxWidth, styleFromPropValue);
  }
  return null;
};
maxWidth.filterProps = ['maxWidth'];
const minWidth = style$1({
  prop: 'minWidth',
  transform: sizingTransform
});
const height = style$1({
  prop: 'height',
  transform: sizingTransform
});
const maxHeight = style$1({
  prop: 'maxHeight',
  transform: sizingTransform
});
const minHeight = style$1({
  prop: 'minHeight',
  transform: sizingTransform
});
style$1({
  prop: 'size',
  cssProperty: 'width',
  transform: sizingTransform
});
style$1({
  prop: 'size',
  cssProperty: 'height',
  transform: sizingTransform
});
const boxSizing = style$1({
  prop: 'boxSizing'
});
compose(width, maxWidth, minWidth, height, maxHeight, minHeight, boxSizing);

const defaultSxConfig = {
  // borders
  border: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderTop: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderRight: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderBottom: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderLeft: {
    themeKey: 'borders',
    transform: borderTransform
  },
  borderColor: {
    themeKey: 'palette'
  },
  borderTopColor: {
    themeKey: 'palette'
  },
  borderRightColor: {
    themeKey: 'palette'
  },
  borderBottomColor: {
    themeKey: 'palette'
  },
  borderLeftColor: {
    themeKey: 'palette'
  },
  outline: {
    themeKey: 'borders',
    transform: borderTransform
  },
  outlineColor: {
    themeKey: 'palette'
  },
  borderRadius: {
    themeKey: 'shape.borderRadius',
    style: borderRadius
  },
  // palette
  color: {
    themeKey: 'palette',
    transform: paletteTransform
  },
  bgcolor: {
    themeKey: 'palette',
    cssProperty: 'backgroundColor',
    transform: paletteTransform
  },
  backgroundColor: {
    themeKey: 'palette',
    transform: paletteTransform
  },
  // spacing
  p: {
    style: padding
  },
  pt: {
    style: padding
  },
  pr: {
    style: padding
  },
  pb: {
    style: padding
  },
  pl: {
    style: padding
  },
  px: {
    style: padding
  },
  py: {
    style: padding
  },
  padding: {
    style: padding
  },
  paddingTop: {
    style: padding
  },
  paddingRight: {
    style: padding
  },
  paddingBottom: {
    style: padding
  },
  paddingLeft: {
    style: padding
  },
  paddingX: {
    style: padding
  },
  paddingY: {
    style: padding
  },
  paddingInline: {
    style: padding
  },
  paddingInlineStart: {
    style: padding
  },
  paddingInlineEnd: {
    style: padding
  },
  paddingBlock: {
    style: padding
  },
  paddingBlockStart: {
    style: padding
  },
  paddingBlockEnd: {
    style: padding
  },
  m: {
    style: margin
  },
  mt: {
    style: margin
  },
  mr: {
    style: margin
  },
  mb: {
    style: margin
  },
  ml: {
    style: margin
  },
  mx: {
    style: margin
  },
  my: {
    style: margin
  },
  margin: {
    style: margin
  },
  marginTop: {
    style: margin
  },
  marginRight: {
    style: margin
  },
  marginBottom: {
    style: margin
  },
  marginLeft: {
    style: margin
  },
  marginX: {
    style: margin
  },
  marginY: {
    style: margin
  },
  marginInline: {
    style: margin
  },
  marginInlineStart: {
    style: margin
  },
  marginInlineEnd: {
    style: margin
  },
  marginBlock: {
    style: margin
  },
  marginBlockStart: {
    style: margin
  },
  marginBlockEnd: {
    style: margin
  },
  // display
  displayPrint: {
    cssProperty: false,
    transform: value => ({
      '@media print': {
        display: value
      }
    })
  },
  display: {},
  overflow: {},
  textOverflow: {},
  visibility: {},
  whiteSpace: {},
  // flexbox
  flexBasis: {},
  flexDirection: {},
  flexWrap: {},
  justifyContent: {},
  alignItems: {},
  alignContent: {},
  order: {},
  flex: {},
  flexGrow: {},
  flexShrink: {},
  alignSelf: {},
  justifyItems: {},
  justifySelf: {},
  // grid
  gap: {
    style: gap
  },
  rowGap: {
    style: rowGap
  },
  columnGap: {
    style: columnGap
  },
  gridColumn: {},
  gridRow: {},
  gridAutoFlow: {},
  gridAutoColumns: {},
  gridAutoRows: {},
  gridTemplateColumns: {},
  gridTemplateRows: {},
  gridTemplateAreas: {},
  gridArea: {},
  // positions
  position: {},
  zIndex: {
    themeKey: 'zIndex'
  },
  top: {},
  right: {},
  bottom: {},
  left: {},
  // shadows
  boxShadow: {
    themeKey: 'shadows'
  },
  // sizing
  width: {
    transform: sizingTransform
  },
  maxWidth: {
    style: maxWidth
  },
  minWidth: {
    transform: sizingTransform
  },
  height: {
    transform: sizingTransform
  },
  maxHeight: {
    transform: sizingTransform
  },
  minHeight: {
    transform: sizingTransform
  },
  boxSizing: {},
  // typography
  fontFamily: {
    themeKey: 'typography'
  },
  fontSize: {
    themeKey: 'typography'
  },
  fontStyle: {
    themeKey: 'typography'
  },
  fontWeight: {
    themeKey: 'typography'
  },
  letterSpacing: {},
  textTransform: {},
  lineHeight: {},
  textAlign: {},
  typography: {
    cssProperty: false,
    themeKey: 'typography'
  }
};
var defaultSxConfig$1 = defaultSxConfig;

function objectsHaveSameKeys(...objects) {
  const allKeys = objects.reduce((keys, object) => keys.concat(Object.keys(object)), []);
  const union = new Set(allKeys);
  return objects.every(object => union.size === Object.keys(object).length);
}
function callIfFn(maybeFn, arg) {
  return typeof maybeFn === 'function' ? maybeFn(arg) : maybeFn;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function unstable_createStyleFunctionSx() {
  function getThemeValue(prop, val, theme, config) {
    const props = {
      [prop]: val,
      theme
    };
    const options = config[prop];
    if (!options) {
      return {
        [prop]: val
      };
    }
    const {
      cssProperty = prop,
      themeKey,
      transform,
      style
    } = options;
    if (val == null) {
      return null;
    }

    // TODO v6: remove, see https://github.com/mui/material-ui/pull/38123
    if (themeKey === 'typography' && val === 'inherit') {
      return {
        [prop]: val
      };
    }
    const themeMapping = getPath(theme, themeKey) || {};
    if (style) {
      return style(props);
    }
    const styleFromPropValue = propValueFinal => {
      let value = getStyleValue(themeMapping, transform, propValueFinal);
      if (propValueFinal === value && typeof propValueFinal === 'string') {
        // Haven't found value
        value = getStyleValue(themeMapping, transform, `${prop}${propValueFinal === 'default' ? '' : capitalize$1(propValueFinal)}`, propValueFinal);
      }
      if (cssProperty === false) {
        return value;
      }
      return {
        [cssProperty]: value
      };
    };
    return handleBreakpoints(props, val, styleFromPropValue);
  }
  function styleFunctionSx(props) {
    var _theme$unstable_sxCon;
    const {
      sx,
      theme = {},
      nested
    } = props || {};
    if (!sx) {
      return null; // Emotion & styled-components will neglect null
    }
    const config = (_theme$unstable_sxCon = theme.unstable_sxConfig) != null ? _theme$unstable_sxCon : defaultSxConfig$1;

    /*
     * Receive `sxInput` as object or callback
     * and then recursively check keys & values to create media query object styles.
     * (the result will be used in `styled`)
     */
    function traverse(sxInput) {
      let sxObject = sxInput;
      if (typeof sxInput === 'function') {
        sxObject = sxInput(theme);
      } else if (typeof sxInput !== 'object') {
        // value
        return sxInput;
      }
      if (!sxObject) {
        return null;
      }
      const emptyBreakpoints = createEmptyBreakpointObject(theme.breakpoints);
      const breakpointsKeys = Object.keys(emptyBreakpoints);
      let css = emptyBreakpoints;
      Object.keys(sxObject).forEach(styleKey => {
        const value = callIfFn(sxObject[styleKey], theme);
        if (value !== null && value !== undefined) {
          if (typeof value === 'object') {
            if (config[styleKey]) {
              css = merge(css, getThemeValue(styleKey, value, theme, config));
            } else {
              const breakpointsValues = handleBreakpoints({
                theme
              }, value, x => ({
                [styleKey]: x
              }));
              if (objectsHaveSameKeys(breakpointsValues, value)) {
                css[styleKey] = styleFunctionSx({
                  sx: value,
                  theme,
                  nested: true
                });
              } else {
                css = merge(css, breakpointsValues);
              }
            }
          } else {
            css = merge(css, getThemeValue(styleKey, value, theme, config));
          }
        }
      });
      if (!nested && theme.modularCssLayers) {
        return {
          '@layer sx': removeUnusedBreakpoints(breakpointsKeys, css)
        };
      }
      return removeUnusedBreakpoints(breakpointsKeys, css);
    }
    return Array.isArray(sx) ? sx.map(traverse) : traverse(sx);
  }
  return styleFunctionSx;
}
const styleFunctionSx$1 = unstable_createStyleFunctionSx();
styleFunctionSx$1.filterProps = ['sx'];
var styleFunctionSx$2 = styleFunctionSx$1;

/**
 * A universal utility to style components with multiple color modes. Always use it from the theme object.
 * It works with:
 *  - [Basic theme](https://mui.com/material-ui/customization/dark-mode/)
 *  - [CSS theme variables](https://mui.com/material-ui/experimental-api/css-theme-variables/overview/)
 *  - Zero-runtime engine
 *
 * Tips: Use an array over object spread and place `theme.applyStyles()` last.
 *
 * ✅ [{ background: '#e5e5e5' }, theme.applyStyles('dark', { background: '#1c1c1c' })]
 *
 * 🚫 { background: '#e5e5e5', ...theme.applyStyles('dark', { background: '#1c1c1c' })}
 *
 * @example
 * 1. using with `styled`:
 * ```jsx
 *   const Component = styled('div')(({ theme }) => [
 *     { background: '#e5e5e5' },
 *     theme.applyStyles('dark', {
 *       background: '#1c1c1c',
 *       color: '#fff',
 *     }),
 *   ]);
 * ```
 *
 * @example
 * 2. using with `sx` prop:
 * ```jsx
 *   <Box sx={theme => [
 *     { background: '#e5e5e5' },
 *     theme.applyStyles('dark', {
 *        background: '#1c1c1c',
 *        color: '#fff',
 *      }),
 *     ]}
 *   />
 * ```
 *
 * @example
 * 3. theming a component:
 * ```jsx
 *   extendTheme({
 *     components: {
 *       MuiButton: {
 *         styleOverrides: {
 *           root: ({ theme }) => [
 *             { background: '#e5e5e5' },
 *             theme.applyStyles('dark', {
 *               background: '#1c1c1c',
 *               color: '#fff',
 *             }),
 *           ],
 *         },
 *       }
 *     }
 *   })
 *```
 */
function applyStyles(key, styles) {
  // @ts-expect-error this is 'any' type
  const theme = this;
  if (theme.vars && typeof theme.getColorSchemeSelector === 'function') {
    // If CssVarsProvider is used as a provider,
    // returns '* :where([data-mui-color-scheme="light|dark"]) &'
    const selector = theme.getColorSchemeSelector(key).replace(/(\[[^\]]+\])/, '*:where($1)');
    return {
      [selector]: styles
    };
  }
  if (theme.palette.mode === key) {
    return styles;
  }
  return {};
}

const _excluded$u = ["breakpoints", "palette", "spacing", "shape"];
function createTheme$2(options = {}, ...args) {
  const {
      breakpoints: breakpointsInput = {},
      palette: paletteInput = {},
      spacing: spacingInput,
      shape: shapeInput = {}
    } = options,
    other = _objectWithoutPropertiesLoose(options, _excluded$u);
  const breakpoints = createBreakpoints(breakpointsInput);
  const spacing = createSpacing(spacingInput);
  let muiTheme = deepmerge$1({
    breakpoints,
    direction: 'ltr',
    components: {},
    // Inject component definitions.
    palette: _extends$2({
      mode: 'light'
    }, paletteInput),
    spacing,
    shape: _extends$2({}, shape$1, shapeInput)
  }, other);
  muiTheme.applyStyles = applyStyles;
  muiTheme = args.reduce((acc, argument) => deepmerge$1(acc, argument), muiTheme);
  muiTheme.unstable_sxConfig = _extends$2({}, defaultSxConfig$1, other == null ? void 0 : other.unstable_sxConfig);
  muiTheme.unstable_sx = function sx(props) {
    return styleFunctionSx$2({
      sx: props,
      theme: this
    });
  };
  return muiTheme;
}

var createTheme$1 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': createTheme$2,
  private_createBreakpoints: createBreakpoints,
  unstable_applyStyles: applyStyles
});

function _extends$1() {
  return _extends$1 = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends$1.apply(null, arguments);
}

function memoize$1(fn) {
  var cache = Object.create(null);
  return function (arg) {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}

// eslint-disable-next-line no-undef
var reactPropsRegex = /^((children|dangerouslySetInnerHTML|key|ref|autoFocus|defaultValue|defaultChecked|innerHTML|suppressContentEditableWarning|suppressHydrationWarning|valueLink|abbr|accept|acceptCharset|accessKey|action|allow|allowUserMedia|allowPaymentRequest|allowFullScreen|allowTransparency|alt|async|autoComplete|autoPlay|capture|cellPadding|cellSpacing|challenge|charSet|checked|cite|classID|className|cols|colSpan|content|contentEditable|contextMenu|controls|controlsList|coords|crossOrigin|data|dateTime|decoding|default|defer|dir|disabled|disablePictureInPicture|disableRemotePlayback|download|draggable|encType|enterKeyHint|form|formAction|formEncType|formMethod|formNoValidate|formTarget|frameBorder|headers|height|hidden|high|href|hrefLang|htmlFor|httpEquiv|id|inputMode|integrity|is|keyParams|keyType|kind|label|lang|list|loading|loop|low|marginHeight|marginWidth|max|maxLength|media|mediaGroup|method|min|minLength|multiple|muted|name|nonce|noValidate|open|optimum|pattern|placeholder|playsInline|poster|preload|profile|radioGroup|readOnly|referrerPolicy|rel|required|reversed|role|rows|rowSpan|sandbox|scope|scoped|scrolling|seamless|selected|shape|size|sizes|slot|span|spellCheck|src|srcDoc|srcLang|srcSet|start|step|style|summary|tabIndex|target|title|translate|type|useMap|value|width|wmode|wrap|about|datatype|inlist|prefix|property|resource|typeof|vocab|autoCapitalize|autoCorrect|autoSave|color|incremental|fallback|inert|itemProp|itemScope|itemType|itemID|itemRef|on|option|results|security|unselectable|accentHeight|accumulate|additive|alignmentBaseline|allowReorder|alphabetic|amplitude|arabicForm|ascent|attributeName|attributeType|autoReverse|azimuth|baseFrequency|baselineShift|baseProfile|bbox|begin|bias|by|calcMode|capHeight|clip|clipPathUnits|clipPath|clipRule|colorInterpolation|colorInterpolationFilters|colorProfile|colorRendering|contentScriptType|contentStyleType|cursor|cx|cy|d|decelerate|descent|diffuseConstant|direction|display|divisor|dominantBaseline|dur|dx|dy|edgeMode|elevation|enableBackground|end|exponent|externalResourcesRequired|fill|fillOpacity|fillRule|filter|filterRes|filterUnits|floodColor|floodOpacity|focusable|fontFamily|fontSize|fontSizeAdjust|fontStretch|fontStyle|fontVariant|fontWeight|format|from|fr|fx|fy|g1|g2|glyphName|glyphOrientationHorizontal|glyphOrientationVertical|glyphRef|gradientTransform|gradientUnits|hanging|horizAdvX|horizOriginX|ideographic|imageRendering|in|in2|intercept|k|k1|k2|k3|k4|kernelMatrix|kernelUnitLength|kerning|keyPoints|keySplines|keyTimes|lengthAdjust|letterSpacing|lightingColor|limitingConeAngle|local|markerEnd|markerMid|markerStart|markerHeight|markerUnits|markerWidth|mask|maskContentUnits|maskUnits|mathematical|mode|numOctaves|offset|opacity|operator|order|orient|orientation|origin|overflow|overlinePosition|overlineThickness|panose1|paintOrder|pathLength|patternContentUnits|patternTransform|patternUnits|pointerEvents|points|pointsAtX|pointsAtY|pointsAtZ|preserveAlpha|preserveAspectRatio|primitiveUnits|r|radius|refX|refY|renderingIntent|repeatCount|repeatDur|requiredExtensions|requiredFeatures|restart|result|rotate|rx|ry|scale|seed|shapeRendering|slope|spacing|specularConstant|specularExponent|speed|spreadMethod|startOffset|stdDeviation|stemh|stemv|stitchTiles|stopColor|stopOpacity|strikethroughPosition|strikethroughThickness|string|stroke|strokeDasharray|strokeDashoffset|strokeLinecap|strokeLinejoin|strokeMiterlimit|strokeOpacity|strokeWidth|surfaceScale|systemLanguage|tableValues|targetX|targetY|textAnchor|textDecoration|textRendering|textLength|to|transform|u1|u2|underlinePosition|underlineThickness|unicode|unicodeBidi|unicodeRange|unitsPerEm|vAlphabetic|vHanging|vIdeographic|vMathematical|values|vectorEffect|version|vertAdvY|vertOriginX|vertOriginY|viewBox|viewTarget|visibility|widths|wordSpacing|writingMode|x|xHeight|x1|x2|xChannelSelector|xlinkActuate|xlinkArcrole|xlinkHref|xlinkRole|xlinkShow|xlinkTitle|xlinkType|xmlBase|xmlns|xmlnsXlink|xmlLang|xmlSpace|y|y1|y2|yChannelSelector|z|zoomAndPan|for|class|autofocus)|(([Dd][Aa][Tt][Aa]|[Aa][Rr][Ii][Aa]|x)-.*))$/; // https://esbench.com/bench/5bfee68a4cd7e6009ef61d23

var isPropValid = /* #__PURE__ */memoize$1(function (prop) {
  return reactPropsRegex.test(prop) || prop.charCodeAt(0) === 111
  /* o */ && prop.charCodeAt(1) === 110
  /* n */ && prop.charCodeAt(2) < 91;
}
/* Z+1 */);

var isDevelopment$4 = false;

/*

Based off glamor's StyleSheet, thanks Sunil ❤️

high performance StyleSheet for css-in-js systems

- uses multiple style tags behind the scenes for millions of rules
- uses `insertRule` for appending in production for *much* faster performance

// usage

import { StyleSheet } from '@emotion/sheet'

let styleSheet = new StyleSheet({ key: '', container: document.head })

styleSheet.insert('#box { border: 1px solid red; }')
- appends a css rule into the stylesheet

styleSheet.flush()
- empties the stylesheet of all its contents

*/

function sheetForTag$1(tag) {
  if (tag.sheet) {
    return tag.sheet;
  } // this weirdness brought to you by firefox

  /* istanbul ignore next */

  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      return document.styleSheets[i];
    }
  } // this function should always return with a value
  // TS can't understand it though so we make it stop complaining here

  return undefined;
}
function createStyleElement$1(options) {
  var tag = document.createElement('style');
  tag.setAttribute('data-emotion', options.key);
  if (options.nonce !== undefined) {
    tag.setAttribute('nonce', options.nonce);
  }
  tag.appendChild(document.createTextNode(''));
  tag.setAttribute('data-s', '');
  return tag;
}
var StyleSheet$1 = /*#__PURE__*/function () {
  // Using Node instead of HTMLElement since container may be a ShadowRoot
  function StyleSheet(options) {
    var _this = this;
    this._insertTag = function (tag) {
      var before;
      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }
      _this.container.insertBefore(tag, before);
      _this.tags.push(tag);
    };
    this.isSpeedy = options.speedy === undefined ? !isDevelopment$4 : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce; // key is the value of the data-emotion attribute, it's used to identify different sheets

    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }
  var _proto = StyleSheet.prototype;
  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };
  _proto.insert = function insert(rule) {
    // the max length is how many rules we have per style tag, it's 65000 in speedy mode
    // it's 1 in dev because we insert source maps that map a single rule to a location
    // and you can only have one source map per style tag
    if (this.ctr % (this.isSpeedy ? 65000 : 1) === 0) {
      this._insertTag(createStyleElement$1(this));
    }
    var tag = this.tags[this.tags.length - 1];
    if (this.isSpeedy) {
      var sheet = sheetForTag$1(tag);
      try {
        // this is the ultrafast version, works across browsers
        // the big drawback is that the css won't be editable in devtools
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {}
    } else {
      tag.appendChild(document.createTextNode(rule));
    }
    this.ctr++;
  };
  _proto.flush = function flush() {
    this.tags.forEach(function (tag) {
      var _tag$parentNode;
      return (_tag$parentNode = tag.parentNode) == null ? void 0 : _tag$parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;
  };
  return StyleSheet;
}();

var MS$1 = '-ms-';
var MOZ$1 = '-moz-';
var WEBKIT$1 = '-webkit-';
var COMMENT$1 = 'comm';
var RULESET$1 = 'rule';
var DECLARATION$1 = 'decl';
var IMPORT$1 = '@import';
var KEYFRAMES$1 = '@keyframes';
var LAYER$1 = '@layer';

/**
 * @param {number}
 * @return {number}
 */
var abs$1 = Math.abs;

/**
 * @param {number}
 * @return {string}
 */
var from$1 = String.fromCharCode;

/**
 * @param {object}
 * @return {object}
 */
var assign$1 = Object.assign;

/**
 * @param {string} value
 * @param {number} length
 * @return {number}
 */
function hash$1(value, length) {
  return charat$1(value, 0) ^ 45 ? (((length << 2 ^ charat$1(value, 0)) << 2 ^ charat$1(value, 1)) << 2 ^ charat$1(value, 2)) << 2 ^ charat$1(value, 3) : 0;
}

/**
 * @param {string} value
 * @return {string}
 */
function trim$1(value) {
  return value.trim();
}

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @return {string?}
 */
function match$1(value, pattern) {
  return (value = pattern.exec(value)) ? value[0] : value;
}

/**
 * @param {string} value
 * @param {(string|RegExp)} pattern
 * @param {string} replacement
 * @return {string}
 */
function replace$1(value, pattern, replacement) {
  return value.replace(pattern, replacement);
}

/**
 * @param {string} value
 * @param {string} search
 * @return {number}
 */
function indexof$1(value, search) {
  return value.indexOf(search);
}

/**
 * @param {string} value
 * @param {number} index
 * @return {number}
 */
function charat$1(value, index) {
  return value.charCodeAt(index) | 0;
}

/**
 * @param {string} value
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function substr$1(value, begin, end) {
  return value.slice(begin, end);
}

/**
 * @param {string} value
 * @return {number}
 */
function strlen$1(value) {
  return value.length;
}

/**
 * @param {any[]} value
 * @return {number}
 */
function sizeof$1(value) {
  return value.length;
}

/**
 * @param {any} value
 * @param {any[]} array
 * @return {any}
 */
function append$1(value, array) {
  return array.push(value), value;
}

/**
 * @param {string[]} array
 * @param {function} callback
 * @return {string}
 */
function combine$1(array, callback) {
  return array.map(callback).join('');
}

var line$1 = 1;
var column$1 = 1;
var length$1 = 0;
var position$1 = 0;
var character$1 = 0;
var characters$1 = '';

/**
 * @param {string} value
 * @param {object | null} root
 * @param {object | null} parent
 * @param {string} type
 * @param {string[] | string} props
 * @param {object[] | string} children
 * @param {number} length
 */
function node$1(value, root, parent, type, props, children, length) {
  return {
    value: value,
    root: root,
    parent: parent,
    type: type,
    props: props,
    children: children,
    line: line$1,
    column: column$1,
    length: length,
    return: ''
  };
}

/**
 * @param {object} root
 * @param {object} props
 * @return {object}
 */
function copy$1(root, props) {
  return assign$1(node$1('', null, null, '', null, null, 0), root, {
    length: -root.length
  }, props);
}

/**
 * @return {number}
 */
function char$1() {
  return character$1;
}

/**
 * @return {number}
 */
function prev$1() {
  character$1 = position$1 > 0 ? charat$1(characters$1, --position$1) : 0;
  if (column$1--, character$1 === 10) column$1 = 1, line$1--;
  return character$1;
}

/**
 * @return {number}
 */
function next$1() {
  character$1 = position$1 < length$1 ? charat$1(characters$1, position$1++) : 0;
  if (column$1++, character$1 === 10) column$1 = 1, line$1++;
  return character$1;
}

/**
 * @return {number}
 */
function peek$1() {
  return charat$1(characters$1, position$1);
}

/**
 * @return {number}
 */
function caret$1() {
  return position$1;
}

/**
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function slice$1(begin, end) {
  return substr$1(characters$1, begin, end);
}

/**
 * @param {number} type
 * @return {number}
 */
function token$1(type) {
  switch (type) {
    // \0 \t \n \r \s whitespace token
    case 0:
    case 9:
    case 10:
    case 13:
    case 32:
      return 5;
    // ! + , / > @ ~ isolate token
    case 33:
    case 43:
    case 44:
    case 47:
    case 62:
    case 64:
    case 126:
    // ; { } breakpoint token
    case 59:
    case 123:
    case 125:
      return 4;
    // : accompanied token
    case 58:
      return 3;
    // " ' ( [ opening delimit token
    case 34:
    case 39:
    case 40:
    case 91:
      return 2;
    // ) ] closing delimit token
    case 41:
    case 93:
      return 1;
  }
  return 0;
}

/**
 * @param {string} value
 * @return {any[]}
 */
function alloc$1(value) {
  return line$1 = column$1 = 1, length$1 = strlen$1(characters$1 = value), position$1 = 0, [];
}

/**
 * @param {any} value
 * @return {any}
 */
function dealloc$1(value) {
  return characters$1 = '', value;
}

/**
 * @param {number} type
 * @return {string}
 */
function delimit$1(type) {
  return trim$1(slice$1(position$1 - 1, delimiter$1(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
}

/**
 * @param {number} type
 * @return {string}
 */
function whitespace$1(type) {
  while (character$1 = peek$1()) if (character$1 < 33) next$1();else break;
  return token$1(type) > 2 || token$1(character$1) > 3 ? '' : ' ';
}

/**
 * @param {number} index
 * @param {number} count
 * @return {string}
 */
function escaping$1(index, count) {
  while (--count && next$1())
  // not 0-9 A-F a-f
  if (character$1 < 48 || character$1 > 102 || character$1 > 57 && character$1 < 65 || character$1 > 70 && character$1 < 97) break;
  return slice$1(index, caret$1() + (count < 6 && peek$1() == 32 && next$1() == 32));
}

/**
 * @param {number} type
 * @return {number}
 */
function delimiter$1(type) {
  while (next$1()) switch (character$1) {
    // ] ) " '
    case type:
      return position$1;
    // " '
    case 34:
    case 39:
      if (type !== 34 && type !== 39) delimiter$1(character$1);
      break;
    // (
    case 40:
      if (type === 41) delimiter$1(type);
      break;
    // \
    case 92:
      next$1();
      break;
  }
  return position$1;
}

/**
 * @param {number} type
 * @param {number} index
 * @return {number}
 */
function commenter$1(type, index) {
  while (next$1())
  // //
  if (type + character$1 === 47 + 10) break;
  // /*
  else if (type + character$1 === 42 + 42 && peek$1() === 47) break;
  return '/*' + slice$1(index, position$1 - 1) + '*' + from$1(type === 47 ? type : next$1());
}

/**
 * @param {number} index
 * @return {string}
 */
function identifier$1(index) {
  while (!token$1(peek$1())) next$1();
  return slice$1(index, position$1);
}

/**
 * @param {string} value
 * @return {object[]}
 */
function compile$1(value) {
  return dealloc$1(parse$1('', null, null, null, [''], value = alloc$1(value), 0, [0], value));
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {string[]} rule
 * @param {string[]} rules
 * @param {string[]} rulesets
 * @param {number[]} pseudo
 * @param {number[]} points
 * @param {string[]} declarations
 * @return {object}
 */
function parse$1(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
  var index = 0;
  var offset = 0;
  var length = pseudo;
  var atrule = 0;
  var property = 0;
  var previous = 0;
  var variable = 1;
  var scanning = 1;
  var ampersand = 1;
  var character = 0;
  var type = '';
  var props = rules;
  var children = rulesets;
  var reference = rule;
  var characters = type;
  while (scanning) switch (previous = character, character = next$1()) {
    // (
    case 40:
      if (previous != 108 && charat$1(characters, length - 1) == 58) {
        if (indexof$1(characters += replace$1(delimit$1(character), '&', '&\f'), '&\f') != -1) ampersand = -1;
        break;
      }
    // " ' [
    case 34:
    case 39:
    case 91:
      characters += delimit$1(character);
      break;
    // \t \n \r \s
    case 9:
    case 10:
    case 13:
    case 32:
      characters += whitespace$1(previous);
      break;
    // \
    case 92:
      characters += escaping$1(caret$1() - 1, 7);
      continue;
    // /
    case 47:
      switch (peek$1()) {
        case 42:
        case 47:
          append$1(comment$1(commenter$1(next$1(), caret$1()), root, parent), declarations);
          break;
        default:
          characters += '/';
      }
      break;
    // {
    case 123 * variable:
      points[index++] = strlen$1(characters) * ampersand;
    // } ; \0
    case 125 * variable:
    case 59:
    case 0:
      switch (character) {
        // \0 }
        case 0:
        case 125:
          scanning = 0;
        // ;
        case 59 + offset:
          if (ampersand == -1) characters = replace$1(characters, /\f/g, '');
          if (property > 0 && strlen$1(characters) - length) append$1(property > 32 ? declaration$1(characters + ';', rule, parent, length - 1) : declaration$1(replace$1(characters, ' ', '') + ';', rule, parent, length - 2), declarations);
          break;
        // @ ;
        case 59:
          characters += ';';
        // { rule/at-rule
        default:
          append$1(reference = ruleset$1(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length), rulesets);
          if (character === 123) if (offset === 0) parse$1(characters, root, reference, reference, props, rulesets, length, points, children);else switch (atrule === 99 && charat$1(characters, 3) === 110 ? 100 : atrule) {
            // d l m s
            case 100:
            case 108:
            case 109:
            case 115:
              parse$1(value, reference, reference, rule && append$1(ruleset$1(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length), children), rules, children, length, points, rule ? props : children);
              break;
            default:
              parse$1(characters, reference, reference, reference, [''], children, 0, points, children);
          }
      }
      index = offset = property = 0, variable = ampersand = 1, type = characters = '', length = pseudo;
      break;
    // :
    case 58:
      length = 1 + strlen$1(characters), property = previous;
    default:
      if (variable < 1) if (character == 123) --variable;else if (character == 125 && variable++ == 0 && prev$1() == 125) continue;
      switch (characters += from$1(character), character * variable) {
        // &
        case 38:
          ampersand = offset > 0 ? 1 : (characters += '\f', -1);
          break;
        // ,
        case 44:
          points[index++] = (strlen$1(characters) - 1) * ampersand, ampersand = 1;
          break;
        // @
        case 64:
          // -
          if (peek$1() === 45) characters += delimit$1(next$1());
          atrule = peek$1(), offset = length = strlen$1(type = characters += identifier$1(caret$1())), character++;
          break;
        // -
        case 45:
          if (previous === 45 && strlen$1(characters) == 2) variable = 0;
      }
  }
  return rulesets;
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} index
 * @param {number} offset
 * @param {string[]} rules
 * @param {number[]} points
 * @param {string} type
 * @param {string[]} props
 * @param {string[]} children
 * @param {number} length
 * @return {object}
 */
function ruleset$1(value, root, parent, index, offset, rules, points, type, props, children, length) {
  var post = offset - 1;
  var rule = offset === 0 ? rules : [''];
  var size = sizeof$1(rule);
  for (var i = 0, j = 0, k = 0; i < index; ++i) for (var x = 0, y = substr$1(value, post + 1, post = abs$1(j = points[i])), z = value; x < size; ++x) if (z = trim$1(j > 0 ? rule[x] + ' ' + y : replace$1(y, /&\f/g, rule[x]))) props[k++] = z;
  return node$1(value, root, parent, offset === 0 ? RULESET$1 : type, props, children, length);
}

/**
 * @param {number} value
 * @param {object} root
 * @param {object?} parent
 * @return {object}
 */
function comment$1(value, root, parent) {
  return node$1(value, root, parent, COMMENT$1, from$1(char$1()), substr$1(value, 2, -2), 0);
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} length
 * @return {object}
 */
function declaration$1(value, root, parent, length) {
  return node$1(value, root, parent, DECLARATION$1, substr$1(value, 0, length), substr$1(value, length + 1, -1), length);
}

/**
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function serialize$1(children, callback) {
  var output = '';
  var length = sizeof$1(children);
  for (var i = 0; i < length; i++) output += callback(children[i], i, children, callback) || '';
  return output;
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function stringify$1(element, index, children, callback) {
  switch (element.type) {
    case LAYER$1:
      if (element.children.length) break;
    case IMPORT$1:
    case DECLARATION$1:
      return element.return = element.return || element.value;
    case COMMENT$1:
      return '';
    case KEYFRAMES$1:
      return element.return = element.value + '{' + serialize$1(element.children, callback) + '}';
    case RULESET$1:
      element.value = element.props.join(',');
  }
  return strlen$1(children = serialize$1(element.children, callback)) ? element.return = element.value + '{' + children + '}' : '';
}

/**
 * @param {function[]} collection
 * @return {function}
 */
function middleware$1(collection) {
  var length = sizeof$1(collection);
  return function (element, index, children, callback) {
    var output = '';
    for (var i = 0; i < length; i++) output += collection[i](element, index, children, callback) || '';
    return output;
  };
}

/**
 * @param {function} callback
 * @return {function}
 */
function rulesheet$1(callback) {
  return function (element) {
    if (!element.root) if (element = element.return) callback(element);
  };
}

var weakMemoize$1 = function weakMemoize(func) {
  var cache = new WeakMap();
  return function (arg) {
    if (cache.has(arg)) {
      // Use non-null assertion because we just checked that the cache `has` it
      // This allows us to remove `undefined` from the return value
      return cache.get(arg);
    }
    var ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
};

var isBrowser$5 = typeof document !== 'undefined';
var identifierWithPointTracking$1 = function identifierWithPointTracking(begin, points, index) {
  var previous = 0;
  var character = 0;
  while (true) {
    previous = character;
    character = peek$1(); // &\f

    if (previous === 38 && character === 12) {
      points[index] = 1;
    }
    if (token$1(character)) {
      break;
    }
    next$1();
  }
  return slice$1(begin, position$1);
};
var toRules$1 = function toRules(parsed, points) {
  // pretend we've started with a comma
  var index = -1;
  var character = 44;
  do {
    switch (token$1(character)) {
      case 0:
        // &\f
        if (character === 38 && peek$1() === 12) {
          // this is not 100% correct, we don't account for literal sequences here - like for example quoted strings
          // stylis inserts \f after & to know when & where it should replace this sequence with the context selector
          // and when it should just concatenate the outer and inner selectors
          // it's very unlikely for this sequence to actually appear in a different context, so we just leverage this fact here
          points[index] = 1;
        }
        parsed[index] += identifierWithPointTracking$1(position$1 - 1, points, index);
        break;
      case 2:
        parsed[index] += delimit$1(character);
        break;
      case 4:
        // comma
        if (character === 44) {
          // colon
          parsed[++index] = peek$1() === 58 ? '&\f' : '';
          points[index] = parsed[index].length;
          break;
        }

      // fallthrough

      default:
        parsed[index] += from$1(character);
    }
  } while (character = next$1());
  return parsed;
};
var getRules$1 = function getRules(value, points) {
  return dealloc$1(toRules$1(alloc$1(value), points));
}; // WeakSet would be more appropriate, but only WeakMap is supported in IE11

var fixedElements$1 = /* #__PURE__ */new WeakMap();
var compat$1 = function compat(element) {
  if (element.type !== 'rule' || !element.parent ||
  // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }
  var value = element.value,
    parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;
  while (parent.type !== 'rule') {
    parent = parent.parent;
    if (!parent) return;
  } // short-circuit for the simplest case

  if (element.props.length === 1 && value.charCodeAt(0) !== 58
  /* colon */ && !fixedElements$1.get(parent)) {
    return;
  } // if this is an implicitly inserted rule (the one eagerly inserted at the each new nested level)
  // then the props has already been manipulated beforehand as they that array is shared between it and its "rule parent"

  if (isImplicitRule) {
    return;
  }
  fixedElements$1.set(element, true);
  var points = [];
  var rules = getRules$1(value, points);
  var parentRules = parent.props;
  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};
var removeLabel$1 = function removeLabel(element) {
  if (element.type === 'decl') {
    var value = element.value;
    if (
    // charcode for l
    value.charCodeAt(0) === 108 &&
    // charcode for b
    value.charCodeAt(2) === 98) {
      // this ignores label
      element["return"] = '';
      element.value = '';
    }
  }
};

/* eslint-disable no-fallthrough */

function prefix$1(value, length) {
  switch (hash$1(value, length)) {
    // color-adjust
    case 5103:
      return WEBKIT$1 + 'print-' + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)

    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921: // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break

    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005: // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,

    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855: // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)

    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT$1 + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust

    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT$1 + value + MOZ$1 + value + MS$1 + value + value;
    // flex, flex-direction

    case 6828:
    case 4268:
      return WEBKIT$1 + value + MS$1 + value + value;
    // order

    case 6165:
      return WEBKIT$1 + value + MS$1 + 'flex-' + value + value;
    // align-items

    case 5187:
      return WEBKIT$1 + value + replace$1(value, /(\w+).+(:[^]+)/, WEBKIT$1 + 'box-$1$2' + MS$1 + 'flex-$1$2') + value;
    // align-self

    case 5443:
      return WEBKIT$1 + value + MS$1 + 'flex-item-' + replace$1(value, /flex-|-self/, '') + value;
    // align-content

    case 4675:
      return WEBKIT$1 + value + MS$1 + 'flex-line-pack' + replace$1(value, /align-content|flex-|-self/, '') + value;
    // flex-shrink

    case 5548:
      return WEBKIT$1 + value + MS$1 + replace$1(value, 'shrink', 'negative') + value;
    // flex-basis

    case 5292:
      return WEBKIT$1 + value + MS$1 + replace$1(value, 'basis', 'preferred-size') + value;
    // flex-grow

    case 6060:
      return WEBKIT$1 + 'box-' + replace$1(value, '-grow', '') + WEBKIT$1 + value + MS$1 + replace$1(value, 'grow', 'positive') + value;
    // transition

    case 4554:
      return WEBKIT$1 + replace$1(value, /([^-])(transform)/g, '$1' + WEBKIT$1 + '$2') + value;
    // cursor

    case 6187:
      return replace$1(replace$1(replace$1(value, /(zoom-|grab)/, WEBKIT$1 + '$1'), /(image-set)/, WEBKIT$1 + '$1'), value, '') + value;
    // background, background-image

    case 5495:
    case 3959:
      return replace$1(value, /(image-set\([^]*)/, WEBKIT$1 + '$1' + '$`$1');
    // justify-content

    case 4968:
      return replace$1(replace$1(value, /(.+:)(flex-)?(.*)/, WEBKIT$1 + 'box-pack:$3' + MS$1 + 'flex-pack:$3'), /s.+-b[^;]+/, 'justify') + WEBKIT$1 + value + value;
    // (margin|padding)-inline-(start|end)

    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace$1(value, /(.+)-inline(.+)/, WEBKIT$1 + '$1$2') + value;
    // (min|max)?(width|height|inline-size|block-size)

    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      // stretch, max-content, min-content, fill-available
      if (strlen$1(value) - 1 - length > 6) switch (charat$1(value, length + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          // -
          if (charat$1(value, length + 4) !== 45) break;
        // (f)ill-available, (f)it-content

        case 102:
          return replace$1(value, /(.+:)(.+)-([^]+)/, '$1' + WEBKIT$1 + '$2-$3' + '$1' + MOZ$1 + (charat$1(value, length + 3) == 108 ? '$3' : '$2-$3')) + value;
        // (s)tretch

        case 115:
          return ~indexof$1(value, 'stretch') ? prefix$1(replace$1(value, 'stretch', 'fill-available'), length) + value : value;
      }
      break;
    // position: sticky

    case 4949:
      // (s)ticky?
      if (charat$1(value, length + 1) !== 115) break;
    // display: (flex|inline-flex)

    case 6444:
      switch (charat$1(value, strlen$1(value) - 3 - (~indexof$1(value, '!important') && 10))) {
        // stic(k)y
        case 107:
          return replace$1(value, ':', ':' + WEBKIT$1) + value;
        // (inline-)?fl(e)x

        case 101:
          return replace$1(value, /(.+:)([^;!]+)(;|!.+)?/, '$1' + WEBKIT$1 + (charat$1(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + WEBKIT$1 + '$2$3' + '$1' + MS$1 + '$2box$3') + value;
      }
      break;
    // writing-mode

    case 5936:
      switch (charat$1(value, length + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT$1 + value + MS$1 + replace$1(value, /[svh]\w+-[tblr]{2}/, 'tb') + value;
        // vertical-r(l)

        case 108:
          return WEBKIT$1 + value + MS$1 + replace$1(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value;
        // horizontal(-)tb

        case 45:
          return WEBKIT$1 + value + MS$1 + replace$1(value, /[svh]\w+-[tblr]{2}/, 'lr') + value;
      }
      return WEBKIT$1 + value + MS$1 + value + value;
  }
  return value;
}
var prefixer$1 = function prefixer(element, index, children, callback) {
  if (element.length > -1) if (!element["return"]) switch (element.type) {
    case DECLARATION$1:
      element["return"] = prefix$1(element.value, element.length);
      break;
    case KEYFRAMES$1:
      return serialize$1([copy$1(element, {
        value: replace$1(element.value, '@', '@' + WEBKIT$1)
      })], callback);
    case RULESET$1:
      if (element.length) return combine$1(element.props, function (value) {
        switch (match$1(value, /(::plac\w+|:read-\w+)/)) {
          // :read-(only|write)
          case ':read-only':
          case ':read-write':
            return serialize$1([copy$1(element, {
              props: [replace$1(value, /:(read-\w+)/, ':' + MOZ$1 + '$1')]
            })], callback);
          // :placeholder

          case '::placeholder':
            return serialize$1([copy$1(element, {
              props: [replace$1(value, /:(plac\w+)/, ':' + WEBKIT$1 + 'input-$1')]
            }), copy$1(element, {
              props: [replace$1(value, /:(plac\w+)/, ':' + MOZ$1 + '$1')]
            }), copy$1(element, {
              props: [replace$1(value, /:(plac\w+)/, MS$1 + 'input-$1')]
            })], callback);
        }
        return '';
      });
  }
};

/* import type { StylisPlugin } from './types' */

/*
export type Options = {
  nonce?: string,
  stylisPlugins?: StylisPlugin[],
  key: string,
  container?: HTMLElement,
  speedy?: boolean,
  prepend?: boolean,
  insertionPoint?: HTMLElement
}
*/

var getServerStylisCache$1 = isBrowser$5 ? undefined : weakMemoize$1(function () {
  return memoize$1(function () {
    var cache = {};
    return function (name) {
      return cache[name];
    };
  });
});
var defaultStylisPlugins$1 = [prefixer$1];
var createCache$1 = function /*: EmotionCache */
createCache(options
/*: Options */) {
  var key = options.key;
  if (isBrowser$5 && key === 'css') {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])"); // get SSRed styles out of the way of React's hydration
    // document.head is a safe place to move them to(though note document.head is not necessarily the last place they will be)
    // note this very very intentionally targets all style elements regardless of the key to ensure
    // that creating a cache works inside of render of a React component

    Array.prototype.forEach.call(ssrStyles, function (node
    /*: HTMLStyleElement */) {
      // we want to only move elements which have a space in the data-emotion attribute value
      // because that indicates that it is an Emotion 11 server-side rendered style elements
      // while we will already ignore Emotion 11 client-side inserted styles because of the :not([data-s]) part in the selector
      // Emotion 10 client-side inserted styles did not have data-s (but importantly did not have a space in their data-emotion attributes)
      // so checking for the space ensures that loading Emotion 11 after Emotion 10 has inserted some styles
      // will not result in the Emotion 10 styles being destroyed
      var dataEmotionAttribute = node.getAttribute('data-emotion');
      if (dataEmotionAttribute.indexOf(' ') === -1) {
        return;
      }
      document.head.appendChild(node);
      node.setAttribute('data-s', '');
    });
  }
  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins$1;
  var inserted = {};
  var container;
  /* : Node */

  var nodesToHydrate = [];
  if (isBrowser$5) {
    container = options.container || document.head;
    Array.prototype.forEach.call(
    // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll("style[data-emotion^=\"" + key + " \"]"), function (node
    /*: HTMLStyleElement */) {
      var attrib = node.getAttribute("data-emotion").split(' ');
      for (var i = 1; i < attrib.length; i++) {
        inserted[attrib[i]] = true;
      }
      nodesToHydrate.push(node);
    });
  }
  var _insert;
  /*: (
  selector: string,
  serialized: SerializedStyles,
  sheet: StyleSheet,
  shouldCache: boolean
  ) => string | void */

  var omnipresentPlugins = [compat$1, removeLabel$1];
  if (isBrowser$5) {
    var currentSheet;
    var finalizingPlugins = [stringify$1, rulesheet$1(function (rule) {
      currentSheet.insert(rule);
    })];
    var serializer = middleware$1(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));
    var stylis = function stylis(styles) {
      return serialize$1(compile$1(styles), serializer);
    };
    _insert = function /*: void */
    insert(selector
    /*: string */, serialized
    /*: SerializedStyles */, sheet
    /*: StyleSheet */, shouldCache
    /*: boolean */) {
      currentSheet = sheet;
      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      if (shouldCache) {
        cache.inserted[serialized.name] = true;
      }
    };
  } else {
    var _finalizingPlugins = [stringify$1];
    var _serializer = middleware$1(omnipresentPlugins.concat(stylisPlugins, _finalizingPlugins));
    var _stylis = function _stylis(styles) {
      return serialize$1(compile$1(styles), _serializer);
    };
    var serverStylisCache = getServerStylisCache$1(stylisPlugins)(key);
    var getRules = function /*: string */
    getRules(selector
    /*: string */, serialized
    /*: SerializedStyles */) {
      var name = serialized.name;
      if (serverStylisCache[name] === undefined) {
        serverStylisCache[name] = _stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      }
      return serverStylisCache[name];
    };
    _insert = function /*: string | void */
    _insert(selector
    /*: string */, serialized
    /*: SerializedStyles */, sheet
    /*: StyleSheet */, shouldCache
    /*: boolean */) {
      var name = serialized.name;
      var rules = getRules(selector, serialized);
      if (cache.compat === undefined) {
        // in regular mode, we don't set the styles on the inserted cache
        // since we don't need to and that would be wasting memory
        // we return them so that they are rendered in a style tag
        if (shouldCache) {
          cache.inserted[name] = true;
        }
        return rules;
      } else {
        // in compat mode, we put the styles on the inserted cache so
        // that emotion-server can pull out the styles
        // except when we don't want to cache it which was in Global but now
        // is nowhere but we don't want to do a major right now
        // and just in case we're going to leave the case here
        // it's also not affecting client side bundle size
        // so it's really not a big deal
        if (shouldCache) {
          cache.inserted[name] = rules;
        } else {
          return rules;
        }
      }
    };
  }
  var cache
  /*: EmotionCache */ = {
    key: key,
    sheet: new StyleSheet$1({
      key: key,
      container: container,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted: inserted,
    registered: {},
    insert: _insert
  };
  cache.sheet.hydrate(nodesToHydrate);
  return cache;
};

var reactIs$1 = {exports: {}};

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
function requireReactIs_production_min() {
  if (hasRequiredReactIs_production_min) return reactIs_production_min;
  hasRequiredReactIs_production_min = 1;
  var b = "function" === typeof Symbol && Symbol.for,
    c = b ? Symbol.for("react.element") : 60103,
    d = b ? Symbol.for("react.portal") : 60106,
    e = b ? Symbol.for("react.fragment") : 60107,
    f = b ? Symbol.for("react.strict_mode") : 60108,
    g = b ? Symbol.for("react.profiler") : 60114,
    h = b ? Symbol.for("react.provider") : 60109,
    k = b ? Symbol.for("react.context") : 60110,
    l = b ? Symbol.for("react.async_mode") : 60111,
    m = b ? Symbol.for("react.concurrent_mode") : 60111,
    n = b ? Symbol.for("react.forward_ref") : 60112,
    p = b ? Symbol.for("react.suspense") : 60113,
    q = b ? Symbol.for("react.suspense_list") : 60120,
    r = b ? Symbol.for("react.memo") : 60115,
    t = b ? Symbol.for("react.lazy") : 60116,
    v = b ? Symbol.for("react.block") : 60121,
    w = b ? Symbol.for("react.fundamental") : 60117,
    x = b ? Symbol.for("react.responder") : 60118,
    y = b ? Symbol.for("react.scope") : 60119;
  function z(a) {
    if ("object" === typeof a && null !== a) {
      var u = a.$$typeof;
      switch (u) {
        case c:
          switch (a = a.type, a) {
            case l:
            case m:
            case e:
            case g:
            case f:
            case p:
              return a;
            default:
              switch (a = a && a.$$typeof, a) {
                case k:
                case n:
                case t:
                case r:
                case h:
                  return a;
                default:
                  return u;
              }
          }
        case d:
          return u;
      }
    }
  }
  function A(a) {
    return z(a) === m;
  }
  reactIs_production_min.AsyncMode = l;
  reactIs_production_min.ConcurrentMode = m;
  reactIs_production_min.ContextConsumer = k;
  reactIs_production_min.ContextProvider = h;
  reactIs_production_min.Element = c;
  reactIs_production_min.ForwardRef = n;
  reactIs_production_min.Fragment = e;
  reactIs_production_min.Lazy = t;
  reactIs_production_min.Memo = r;
  reactIs_production_min.Portal = d;
  reactIs_production_min.Profiler = g;
  reactIs_production_min.StrictMode = f;
  reactIs_production_min.Suspense = p;
  reactIs_production_min.isAsyncMode = function (a) {
    return A(a) || z(a) === l;
  };
  reactIs_production_min.isConcurrentMode = A;
  reactIs_production_min.isContextConsumer = function (a) {
    return z(a) === k;
  };
  reactIs_production_min.isContextProvider = function (a) {
    return z(a) === h;
  };
  reactIs_production_min.isElement = function (a) {
    return "object" === typeof a && null !== a && a.$$typeof === c;
  };
  reactIs_production_min.isForwardRef = function (a) {
    return z(a) === n;
  };
  reactIs_production_min.isFragment = function (a) {
    return z(a) === e;
  };
  reactIs_production_min.isLazy = function (a) {
    return z(a) === t;
  };
  reactIs_production_min.isMemo = function (a) {
    return z(a) === r;
  };
  reactIs_production_min.isPortal = function (a) {
    return z(a) === d;
  };
  reactIs_production_min.isProfiler = function (a) {
    return z(a) === g;
  };
  reactIs_production_min.isStrictMode = function (a) {
    return z(a) === f;
  };
  reactIs_production_min.isSuspense = function (a) {
    return z(a) === p;
  };
  reactIs_production_min.isValidElementType = function (a) {
    return "string" === typeof a || "function" === typeof a || a === e || a === m || a === g || a === f || a === p || a === q || "object" === typeof a && null !== a && (a.$$typeof === t || a.$$typeof === r || a.$$typeof === h || a.$$typeof === k || a.$$typeof === n || a.$$typeof === w || a.$$typeof === x || a.$$typeof === y || a.$$typeof === v);
  };
  reactIs_production_min.typeOf = z;
  return reactIs_production_min;
}

var reactIs_development$1 = {};

/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var hasRequiredReactIs_development$1;
function requireReactIs_development$1() {
  if (hasRequiredReactIs_development$1) return reactIs_development$1;
  hasRequiredReactIs_development$1 = 1;
  if (process.env.NODE_ENV !== "production") {
    (function () {

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
        return typeof type === 'string' || typeof type === 'function' ||
        // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
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
      reactIs_development$1.AsyncMode = AsyncMode;
      reactIs_development$1.ConcurrentMode = ConcurrentMode;
      reactIs_development$1.ContextConsumer = ContextConsumer;
      reactIs_development$1.ContextProvider = ContextProvider;
      reactIs_development$1.Element = Element;
      reactIs_development$1.ForwardRef = ForwardRef;
      reactIs_development$1.Fragment = Fragment;
      reactIs_development$1.Lazy = Lazy;
      reactIs_development$1.Memo = Memo;
      reactIs_development$1.Portal = Portal;
      reactIs_development$1.Profiler = Profiler;
      reactIs_development$1.StrictMode = StrictMode;
      reactIs_development$1.Suspense = Suspense;
      reactIs_development$1.isAsyncMode = isAsyncMode;
      reactIs_development$1.isConcurrentMode = isConcurrentMode;
      reactIs_development$1.isContextConsumer = isContextConsumer;
      reactIs_development$1.isContextProvider = isContextProvider;
      reactIs_development$1.isElement = isElement;
      reactIs_development$1.isForwardRef = isForwardRef;
      reactIs_development$1.isFragment = isFragment;
      reactIs_development$1.isLazy = isLazy;
      reactIs_development$1.isMemo = isMemo;
      reactIs_development$1.isPortal = isPortal;
      reactIs_development$1.isProfiler = isProfiler;
      reactIs_development$1.isStrictMode = isStrictMode;
      reactIs_development$1.isSuspense = isSuspense;
      reactIs_development$1.isValidElementType = isValidElementType;
      reactIs_development$1.typeOf = typeOf;
    })();
  }
  return reactIs_development$1;
}

var hasRequiredReactIs$1;
function requireReactIs$1() {
  if (hasRequiredReactIs$1) return reactIs$1.exports;
  hasRequiredReactIs$1 = 1;
  if (process.env.NODE_ENV === 'production') {
    reactIs$1.exports = requireReactIs_production_min();
  } else {
    reactIs$1.exports = requireReactIs_development$1();
  }
  return reactIs$1.exports;
}

var hoistNonReactStatics_cjs;
var hasRequiredHoistNonReactStatics_cjs;
function requireHoistNonReactStatics_cjs() {
  if (hasRequiredHoistNonReactStatics_cjs) return hoistNonReactStatics_cjs;
  hasRequiredHoistNonReactStatics_cjs = 1;
  var reactIs = requireReactIs$1();

  /**
   * Copyright 2015, Yahoo! Inc.
   * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
   */
  var REACT_STATICS = {
    childContextTypes: true,
    contextType: true,
    contextTypes: true,
    defaultProps: true,
    displayName: true,
    getDefaultProps: true,
    getDerivedStateFromError: true,
    getDerivedStateFromProps: true,
    mixins: true,
    propTypes: true,
    type: true
  };
  var KNOWN_STATICS = {
    name: true,
    length: true,
    prototype: true,
    caller: true,
    callee: true,
    arguments: true,
    arity: true
  };
  var FORWARD_REF_STATICS = {
    '$$typeof': true,
    render: true,
    defaultProps: true,
    displayName: true,
    propTypes: true
  };
  var MEMO_STATICS = {
    '$$typeof': true,
    compare: true,
    defaultProps: true,
    displayName: true,
    propTypes: true,
    type: true
  };
  var TYPE_STATICS = {};
  TYPE_STATICS[reactIs.ForwardRef] = FORWARD_REF_STATICS;
  TYPE_STATICS[reactIs.Memo] = MEMO_STATICS;
  function getStatics(component) {
    // React v16.11 and below
    if (reactIs.isMemo(component)) {
      return MEMO_STATICS;
    } // React v16.12 and above

    return TYPE_STATICS[component['$$typeof']] || REACT_STATICS;
  }
  var defineProperty = Object.defineProperty;
  var getOwnPropertyNames = Object.getOwnPropertyNames;
  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  var getPrototypeOf = Object.getPrototypeOf;
  var objectPrototype = Object.prototype;
  function hoistNonReactStatics(targetComponent, sourceComponent, blacklist) {
    if (typeof sourceComponent !== 'string') {
      // don't hoist over string (html) components
      if (objectPrototype) {
        var inheritedComponent = getPrototypeOf(sourceComponent);
        if (inheritedComponent && inheritedComponent !== objectPrototype) {
          hoistNonReactStatics(targetComponent, inheritedComponent, blacklist);
        }
      }
      var keys = getOwnPropertyNames(sourceComponent);
      if (getOwnPropertySymbols) {
        keys = keys.concat(getOwnPropertySymbols(sourceComponent));
      }
      var targetStatics = getStatics(targetComponent);
      var sourceStatics = getStatics(sourceComponent);
      for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        if (!KNOWN_STATICS[key] && !(blacklist && blacklist[key]) && !(sourceStatics && sourceStatics[key]) && !(targetStatics && targetStatics[key])) {
          var descriptor = getOwnPropertyDescriptor(sourceComponent, key);
          try {
            // Avoid failures from read-only properties
            defineProperty(targetComponent, key, descriptor);
          } catch (e) {}
        }
      }
    }
    return targetComponent;
  }
  hoistNonReactStatics_cjs = hoistNonReactStatics;
  return hoistNonReactStatics_cjs;
}

requireHoistNonReactStatics_cjs();

var isBrowser$4 = typeof document !== 'undefined';
function getRegisteredStyles(registered, registeredStyles, classNames) {
  var rawClassName = '';
  classNames.split(' ').forEach(function (className) {
    if (registered[className] !== undefined) {
      registeredStyles.push(registered[className] + ";");
    } else {
      rawClassName += className + " ";
    }
  });
  return rawClassName;
}
var registerStyles = function registerStyles(cache, serialized, isStringTag) {
  var className = cache.key + "-" + serialized.name;
  if (
  // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (isStringTag === false ||
  // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  isBrowser$4 === false && cache.compat !== undefined) && cache.registered[className] === undefined) {
    cache.registered[className] = serialized.styles;
  }
};
var insertStyles = function insertStyles(cache, serialized, isStringTag) {
  registerStyles(cache, serialized, isStringTag);
  var className = cache.key + "-" + serialized.name;
  if (cache.inserted[serialized.name] === undefined) {
    var stylesForSSR = '';
    var current = serialized;
    do {
      var maybeStyles = cache.insert(serialized === current ? "." + className : '', current, cache.sheet, true);
      if (!isBrowser$4 && maybeStyles !== undefined) {
        stylesForSSR += maybeStyles;
      }
      current = current.next;
    } while (current !== undefined);
    if (!isBrowser$4 && stylesForSSR.length !== 0) {
      return stylesForSSR;
    }
  }
};

/* eslint-disable */
// Inspired by https://github.com/garycourt/murmurhash-js
// Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
function murmur2$1(str) {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.
  // const m = 0x5bd1e995;
  // const r = 24;
  // Initialize the hash
  var h = 0; // Mix 4 bytes at a time into the hash

  var k,
    i = 0,
    len = str.length;
  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
    k = /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16);
    k ^= /* k >>> r: */
    k >>> 24;
    h = /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16) ^ /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Handle the last few bytes of the input array

  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h = /* Math.imul(h, m): */
      (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.

  h ^= h >>> 13;
  h = /* Math.imul(h, m): */
  (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

var unitlessKeys$1 = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

var isDevelopment$3 = false;
var hyphenateRegex$1 = /[A-Z]|^ms/g;
var animationRegex$1 = /_EMO_([^_]+?)_([^]*?)_EMO_/g;
var isCustomProperty$1 = function isCustomProperty(property) {
  return property.charCodeAt(1) === 45;
};
var isProcessableValue$1 = function isProcessableValue(value) {
  return value != null && typeof value !== 'boolean';
};
var processStyleName$1 = /* #__PURE__ */memoize$1(function (styleName) {
  return isCustomProperty$1(styleName) ? styleName : styleName.replace(hyphenateRegex$1, '-$&').toLowerCase();
});
var processStyleValue$1 = function processStyleValue(key, value) {
  switch (key) {
    case 'animation':
    case 'animationName':
      {
        if (typeof value === 'string') {
          return value.replace(animationRegex$1, function (match, p1, p2) {
            cursor$1 = {
              name: p1,
              styles: p2,
              next: cursor$1
            };
            return p1;
          });
        }
      }
  }
  if (unitlessKeys$1[key] !== 1 && !isCustomProperty$1(key) && typeof value === 'number' && value !== 0) {
    return value + 'px';
  }
  return value;
};
var noComponentSelectorMessage$1 = 'Component selectors can only be used in conjunction with ' + '@emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware ' + 'compiler transform.';
function handleInterpolation$1(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return '';
  }
  var componentSelector = interpolation;
  if (componentSelector.__emotion_styles !== undefined) {
    return componentSelector;
  }
  switch (typeof interpolation) {
    case 'boolean':
      {
        return '';
      }
    case 'object':
      {
        var keyframes = interpolation;
        if (keyframes.anim === 1) {
          cursor$1 = {
            name: keyframes.name,
            styles: keyframes.styles,
            next: cursor$1
          };
          return keyframes.name;
        }
        var serializedStyles = interpolation;
        if (serializedStyles.styles !== undefined) {
          var next = serializedStyles.next;
          if (next !== undefined) {
            // not the most efficient thing ever but this is a pretty rare case
            // and there will be very few iterations of this generally
            while (next !== undefined) {
              cursor$1 = {
                name: next.name,
                styles: next.styles,
                next: cursor$1
              };
              next = next.next;
            }
          }
          var styles = serializedStyles.styles + ";";
          return styles;
        }
        return createStringFromObject$1(mergedProps, registered, interpolation);
      }
    case 'function':
      {
        if (mergedProps !== undefined) {
          var previousCursor = cursor$1;
          var result = interpolation(mergedProps);
          cursor$1 = previousCursor;
          return handleInterpolation$1(mergedProps, registered, result);
        }
        break;
      }
  } // finalize string values (regular strings and functions interpolated into css calls)

  var asString = interpolation;
  if (registered == null) {
    return asString;
  }
  var cached = registered[asString];
  return cached !== undefined ? cached : asString;
}
function createStringFromObject$1(mergedProps, registered, obj) {
  var string = '';
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation$1(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var key in obj) {
      var value = obj[key];
      if (typeof value !== 'object') {
        var asString = value;
        if (registered != null && registered[asString] !== undefined) {
          string += key + "{" + registered[asString] + "}";
        } else if (isProcessableValue$1(asString)) {
          string += processStyleName$1(key) + ":" + processStyleValue$1(key, asString) + ";";
        }
      } else {
        if (key === 'NO_COMPONENT_SELECTOR' && isDevelopment$3) {
          throw new Error(noComponentSelectorMessage$1);
        }
        if (Array.isArray(value) && typeof value[0] === 'string' && (registered == null || registered[value[0]] === undefined)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue$1(value[_i])) {
              string += processStyleName$1(key) + ":" + processStyleValue$1(key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation$1(mergedProps, registered, value);
          switch (key) {
            case 'animation':
            case 'animationName':
              {
                string += processStyleName$1(key) + ":" + interpolated + ";";
                break;
              }
            default:
              {
                string += key + "{" + interpolated + "}";
              }
          }
        }
      }
    }
  }
  return string;
}
var labelPattern$1 = /label:\s*([^\s;\n{]+)\s*(;|$)/g;
// keyframes are stored on the SerializedStyles object as a linked list

var cursor$1;
function serializeStyles$1(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0].styles !== undefined) {
    return args[0];
  }
  var stringMode = true;
  var styles = '';
  cursor$1 = undefined;
  var strings = args[0];
  if (strings == null || strings.raw === undefined) {
    stringMode = false;
    styles += handleInterpolation$1(mergedProps, registered, strings);
  } else {
    var asTemplateStringsArr = strings;
    styles += asTemplateStringsArr[0];
  } // we start at 1 since we've already handled the first arg

  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation$1(mergedProps, registered, args[i]);
    if (stringMode) {
      var templateStringsArr = strings;
      styles += templateStringsArr[i];
    }
  }
  labelPattern$1.lastIndex = 0;
  var identifierName = '';
  var match; // https://esbench.com/bench/5b809c2cf2949800a0f61fb5

  while ((match = labelPattern$1.exec(styles)) !== null) {
    identifierName += '-' + match[1];
  }
  var name = murmur2$1(styles) + identifierName;
  return {
    name: name,
    styles: styles,
    next: cursor$1
  };
}

var isBrowser$3 = typeof document !== 'undefined';
var syncFallback = function syncFallback(create) {
  return create();
};
var useInsertionEffect = React['useInsertion' + 'Effect'] ? React['useInsertion' + 'Effect'] : false;
var useInsertionEffectAlwaysWithSyncFallback = !isBrowser$3 ? syncFallback : useInsertionEffect || syncFallback;
var useInsertionEffectWithLayoutFallback = useInsertionEffect || React.useLayoutEffect;

var isBrowser$2 = typeof document !== 'undefined';

/* import { type EmotionCache } from '@emotion/utils' */
var EmotionCacheContext
/*: React.Context<EmotionCache | null> */ = /* #__PURE__ */React.createContext(
// we're doing this to avoid preconstruct's dead code elimination in this one case
// because this module is primarily intended for the browser and node
// but it's also required in react native and similar environments sometimes
// and we could have a special build just for that
// but this is much easier and the native packages
// might use a different theme context in the future anyway
typeof HTMLElement !== 'undefined' ? /* #__PURE__ */createCache$1({
  key: 'css'
}) : null);
var CacheProvider = EmotionCacheContext.Provider;
var withEmotionCache = function withEmotionCache
/* <Props, Ref: React.Ref<*>> */(func
/*: (props: Props, cache: EmotionCache, ref: Ref) => React.Node */) /*: React.AbstractComponent<Props> */
{
  return /*#__PURE__*/forwardRef(function (props
  /*: Props */, ref
  /*: Ref */) {
    // the cache will never be null in the browser
    var cache = useContext(EmotionCacheContext);
    return func(props, cache, ref);
  });
};
if (!isBrowser$2) {
  withEmotionCache = function withEmotionCache
  /* <Props> */(func
  /*: (props: Props, cache: EmotionCache) => React.Node */) /*: React.StatelessFunctionalComponent<Props> */
  {
    return function (props
    /*: Props */) {
      var cache = useContext(EmotionCacheContext);
      if (cache === null) {
        // yes, we're potentially creating this on every render
        // it doesn't actually matter though since it's only on the server
        // so there will only every be a single render
        // that could change in the future because of suspense and etc. but for now,
        // this works and i don't want to optimise for a future thing that we aren't sure about
        cache = createCache$1({
          key: 'css'
        });
        return /*#__PURE__*/React.createElement(EmotionCacheContext.Provider, {
          value: cache
        }, func(props, cache));
      } else {
        return func(props, cache);
      }
    };
  };
}
var ThemeContext = /* #__PURE__ */React.createContext({});

// initial render from browser, insertBefore context.sheet.tags[0] or if a style hasn't been inserted there yet, appendChild
// initial client-side render from SSR, use place of hydrating tag

var Global
/*: React.AbstractComponent<
GlobalProps
> */ = /* #__PURE__ */withEmotionCache(function (props
/*: GlobalProps */, cache) {
  var styles = props.styles;
  var serialized = serializeStyles$1([styles], undefined, React.useContext(ThemeContext));
  if (!isBrowser$2) {
    var _ref;
    var serializedNames = serialized.name;
    var serializedStyles = serialized.styles;
    var next = serialized.next;
    while (next !== undefined) {
      serializedNames += ' ' + next.name;
      serializedStyles += next.styles;
      next = next.next;
    }
    var shouldCache = cache.compat === true;
    var rules = cache.insert("", {
      name: serializedNames,
      styles: serializedStyles
    }, cache.sheet, shouldCache);
    if (shouldCache) {
      return null;
    }
    return /*#__PURE__*/React.createElement("style", (_ref = {}, _ref["data-emotion"] = cache.key + "-global " + serializedNames, _ref.dangerouslySetInnerHTML = {
      __html: rules
    }, _ref.nonce = cache.sheet.nonce, _ref));
  } // yes, i know these hooks are used conditionally
  // but it is based on a constant that will never change at runtime
  // it's effectively like having two implementations and switching them out
  // so it's not actually breaking anything

  var sheetRef = React.useRef();
  useInsertionEffectWithLayoutFallback(function () {
    var key = cache.key + "-global"; // use case of https://github.com/emotion-js/emotion/issues/2675

    var sheet = new cache.sheet.constructor({
      key: key,
      nonce: cache.sheet.nonce,
      container: cache.sheet.container,
      speedy: cache.sheet.isSpeedy
    });
    var rehydrating = false;
    var node
    /*: HTMLStyleElement | null*/ = document.querySelector("style[data-emotion=\"" + key + " " + serialized.name + "\"]");
    if (cache.sheet.tags.length) {
      sheet.before = cache.sheet.tags[0];
    }
    if (node !== null) {
      rehydrating = true; // clear the hash so this node won't be recognizable as rehydratable by other <Global/>s

      node.setAttribute('data-emotion', key);
      sheet.hydrate([node]);
    }
    sheetRef.current = [sheet, rehydrating];
    return function () {
      sheet.flush();
    };
  }, [cache]);
  useInsertionEffectWithLayoutFallback(function () {
    var sheetRefCurrent = sheetRef.current;
    var sheet = sheetRefCurrent[0],
      rehydrating = sheetRefCurrent[1];
    if (rehydrating) {
      sheetRefCurrent[1] = false;
      return;
    }
    if (serialized.next !== undefined) {
      // insert keyframes
      insertStyles(cache, serialized.next, true);
    }
    if (sheet.tags.length) {
      // if this doesn't exist then it will be null so the style element will be appended
      var element = sheet.tags[sheet.tags.length - 1].nextElementSibling;
      sheet.before = element;
      sheet.flush();
    }
    cache.insert("", serialized, sheet, false);
  }, [cache, serialized.name]);
  return null;
});

/* import type { Interpolation, SerializedStyles } from '@emotion/utils' */

function css() /*: SerializedStyles */
{
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return serializeStyles$1(args);
}

/*
type Keyframes = {|
  name: string,
  styles: string,
  anim: 1,
  toString: () => string
|} & string
*/

var keyframes = function /*: Keyframes */
keyframes() {
  var insertable = css.apply(void 0, arguments);
  var name = "animation-" + insertable.name;
  return {
    name: name,
    styles: "@keyframes " + name + "{" + insertable.styles + "}",
    anim: 1,
    toString: function toString() {
      return "_EMO_" + this.name + "_" + this.styles + "_EMO_";
    }
  };
};

/* import type {
  ElementType,
  StatelessFunctionalComponent,
  AbstractComponent
} from 'react' */
/*
export type Interpolations = Array<any>

export type StyledElementType<Props> =
  | string
  | AbstractComponent<{ ...Props, className: string }, mixed>

export type StyledOptions = {
  label?: string,
  shouldForwardProp?: string => boolean,
  target?: string
}

export type StyledComponent<Props> = StatelessFunctionalComponent<Props> & {
  defaultProps: any,
  toString: () => string,
  withComponent: (
    nextTag: StyledElementType<Props>,
    nextOptions?: StyledOptions
  ) => StyledComponent<Props>
}

export type PrivateStyledComponent<Props> = StyledComponent<Props> & {
  __emotion_real: StyledComponent<Props>,
  __emotion_base: any,
  __emotion_styles: any,
  __emotion_forwardProp: any
}
*/

var testOmitPropsOnStringTag = isPropValid;
var testOmitPropsOnComponent = function testOmitPropsOnComponent(key
/*: string */) {
  return key !== 'theme';
};
var getDefaultShouldForwardProp = function getDefaultShouldForwardProp(tag
/*: ElementType */) {
  return typeof tag === 'string' &&
  // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  tag.charCodeAt(0) > 96 ? testOmitPropsOnStringTag : testOmitPropsOnComponent;
};
var composeShouldForwardProps = function composeShouldForwardProps(tag
/*: PrivateStyledComponent<any> */, options
/*: StyledOptions | void */, isReal
/*: boolean */) {
  var shouldForwardProp;
  if (options) {
    var optionsShouldForwardProp = options.shouldForwardProp;
    shouldForwardProp = tag.__emotion_forwardProp && optionsShouldForwardProp ? function (propName
    /*: string */) {
      return tag.__emotion_forwardProp(propName) && optionsShouldForwardProp(propName);
    } : optionsShouldForwardProp;
  }
  if (typeof shouldForwardProp !== 'function' && isReal) {
    shouldForwardProp = tag.__emotion_forwardProp;
  }
  return shouldForwardProp;
};
/*
export type CreateStyledComponent = <Props>(
  ...args: Interpolations
) => StyledComponent<Props>

export type CreateStyled = {
  <Props>(
    tag: StyledElementType<Props>,
    options?: StyledOptions
  ): (...args: Interpolations) => StyledComponent<Props>,
  [key: string]: CreateStyledComponent,
  bind: () => CreateStyled
}
*/

var isDevelopment$2 = false;
var isBrowser$1 = typeof document !== 'undefined';
var Insertion = function Insertion(_ref) {
  var cache = _ref.cache,
    serialized = _ref.serialized,
    isStringTag = _ref.isStringTag;
  registerStyles(cache, serialized, isStringTag);
  var rules = useInsertionEffectAlwaysWithSyncFallback(function () {
    return insertStyles(cache, serialized, isStringTag);
  });
  if (!isBrowser$1 && rules !== undefined) {
    var _ref2;
    var serializedNames = serialized.name;
    var next = serialized.next;
    while (next !== undefined) {
      serializedNames += ' ' + next.name;
      next = next.next;
    }
    return /*#__PURE__*/React.createElement("style", (_ref2 = {}, _ref2["data-emotion"] = cache.key + " " + serializedNames, _ref2.dangerouslySetInnerHTML = {
      __html: rules
    }, _ref2.nonce = cache.sheet.nonce, _ref2));
  }
  return null;
};
var createStyled$3
/*: CreateStyled */ = function createStyled
/*: CreateStyled */(tag
/*: any */, options
/* ?: StyledOptions */) {
  var isReal = tag.__emotion_real === tag;
  var baseTag = isReal && tag.__emotion_base || tag;
  var identifierName;
  var targetClassName;
  if (options !== undefined) {
    identifierName = options.label;
    targetClassName = options.target;
  }
  var shouldForwardProp = composeShouldForwardProps(tag, options, isReal);
  var defaultShouldForwardProp = shouldForwardProp || getDefaultShouldForwardProp(baseTag);
  var shouldUseAs = !defaultShouldForwardProp('as');
  /* return function<Props>(): PrivateStyledComponent<Props> { */

  return function () {
    var args = arguments;
    var styles = isReal && tag.__emotion_styles !== undefined ? tag.__emotion_styles.slice(0) : [];
    if (identifierName !== undefined) {
      styles.push("label:" + identifierName + ";");
    }
    if (args[0] == null || args[0].raw === undefined) {
      styles.push.apply(styles, args);
    } else {
      styles.push(args[0][0]);
      var len = args.length;
      var i = 1;
      for (; i < len; i++) {
        styles.push(args[i], args[0][i]);
      }
    }
    var Styled
    /*: PrivateStyledComponent<Props> */ = withEmotionCache(function (props, cache, ref) {
      var FinalTag = shouldUseAs && props.as || baseTag;
      var className = '';
      var classInterpolations = [];
      var mergedProps = props;
      if (props.theme == null) {
        mergedProps = {};
        for (var key in props) {
          mergedProps[key] = props[key];
        }
        mergedProps.theme = React.useContext(ThemeContext);
      }
      if (typeof props.className === 'string') {
        className = getRegisteredStyles(cache.registered, classInterpolations, props.className);
      } else if (props.className != null) {
        className = props.className + " ";
      }
      var serialized = serializeStyles$1(styles.concat(classInterpolations), cache.registered, mergedProps);
      className += cache.key + "-" + serialized.name;
      if (targetClassName !== undefined) {
        className += " " + targetClassName;
      }
      var finalShouldForwardProp = shouldUseAs && shouldForwardProp === undefined ? getDefaultShouldForwardProp(FinalTag) : defaultShouldForwardProp;
      var newProps = {};
      for (var _key in props) {
        if (shouldUseAs && _key === 'as') continue;
        if (finalShouldForwardProp(_key)) {
          newProps[_key] = props[_key];
        }
      }
      newProps.className = className;
      if (ref) {
        newProps.ref = ref;
      }
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Insertion, {
        cache: cache,
        serialized: serialized,
        isStringTag: typeof FinalTag === 'string'
      }), /*#__PURE__*/React.createElement(FinalTag, newProps));
    });
    Styled.displayName = identifierName !== undefined ? identifierName : "Styled(" + (typeof baseTag === 'string' ? baseTag : baseTag.displayName || baseTag.name || 'Component') + ")";
    Styled.defaultProps = tag.defaultProps;
    Styled.__emotion_real = Styled;
    Styled.__emotion_base = baseTag;
    Styled.__emotion_styles = styles;
    Styled.__emotion_forwardProp = shouldForwardProp;
    Object.defineProperty(Styled, 'toString', {
      value: function value() {
        if (targetClassName === undefined && isDevelopment$2) {
          return 'NO_COMPONENT_SELECTOR';
        }
        return "." + targetClassName;
      }
    });
    Styled.withComponent = function (nextTag
    /*: StyledElementType<Props> */, nextOptions
    /* ?: StyledOptions */) {
      return createStyled(nextTag, _extends$1({}, options, nextOptions, {
        shouldForwardProp: composeShouldForwardProps(Styled, nextOptions, true)
      })).apply(void 0, styles);
    };
    return Styled;
  };
};

var tags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
// SVG
'circle', 'clipPath', 'defs', 'ellipse', 'foreignObject', 'g', 'image', 'line', 'linearGradient', 'mask', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'text', 'tspan'];
var newStyled = createStyled$3.bind();
tags.forEach(function (tagName) {
  newStyled[tagName] = newStyled(tagName);
});

/* eslint-disable */
// Inspired by https://github.com/garycourt/murmurhash-js
// Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
function murmur2(str) {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.
  // const m = 0x5bd1e995;
  // const r = 24;
  // Initialize the hash
  var h = 0; // Mix 4 bytes at a time into the hash

  var k,
      i = 0,
      len = str.length;

  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
    k =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16);
    k ^=
    /* k >>> r: */
    k >>> 24;
    h =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16) ^
    /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Handle the last few bytes of the input array


  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h =
      /* Math.imul(h, m): */
      (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.


  h ^= h >>> 13;
  h =
  /* Math.imul(h, m): */
  (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}

var unitlessKeys = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};

function memoize(fn) {
  var cache = Object.create(null);
  return function (arg) {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}

var isDevelopment$1 = false;

var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;

var isCustomProperty = function isCustomProperty(property) {
  return property.charCodeAt(1) === 45;
};

var isProcessableValue = function isProcessableValue(value) {
  return value != null && typeof value !== 'boolean';
};

var processStyleName = /* #__PURE__ */memoize(function (styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, '-$&').toLowerCase();
});

var processStyleValue = function processStyleValue(key, value) {
  switch (key) {
    case 'animation':
    case 'animationName':
      {
        if (typeof value === 'string') {
          return value.replace(animationRegex, function (match, p1, p2) {
            cursor = {
              name: p1,
              styles: p2,
              next: cursor
            };
            return p1;
          });
        }
      }
  }

  if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0) {
    return value + 'px';
  }

  return value;
};

var noComponentSelectorMessage = 'Component selectors can only be used in conjunction with ' + '@emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware ' + 'compiler transform.';

function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return '';
  }

  var componentSelector = interpolation;

  if (componentSelector.__emotion_styles !== undefined) {

    return componentSelector;
  }

  switch (typeof interpolation) {
    case 'boolean':
      {
        return '';
      }

    case 'object':
      {
        var keyframes = interpolation;

        if (keyframes.anim === 1) {
          cursor = {
            name: keyframes.name,
            styles: keyframes.styles,
            next: cursor
          };
          return keyframes.name;
        }

        var serializedStyles = interpolation;

        if (serializedStyles.styles !== undefined) {
          var next = serializedStyles.next;

          if (next !== undefined) {
            // not the most efficient thing ever but this is a pretty rare case
            // and there will be very few iterations of this generally
            while (next !== undefined) {
              cursor = {
                name: next.name,
                styles: next.styles,
                next: cursor
              };
              next = next.next;
            }
          }

          var styles = serializedStyles.styles + ";";
          return styles;
        }

        return createStringFromObject(mergedProps, registered, interpolation);
      }

    case 'function':
      {
        if (mergedProps !== undefined) {
          var previousCursor = cursor;
          var result = interpolation(mergedProps);
          cursor = previousCursor;
          return handleInterpolation(mergedProps, registered, result);
        }

        break;
      }
  } // finalize string values (regular strings and functions interpolated into css calls)


  var asString = interpolation;

  if (registered == null) {
    return asString;
  }

  var cached = registered[asString];
  return cached !== undefined ? cached : asString;
}

function createStringFromObject(mergedProps, registered, obj) {
  var string = '';

  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var key in obj) {
      var value = obj[key];

      if (typeof value !== 'object') {
        var asString = value;

        if (registered != null && registered[asString] !== undefined) {
          string += key + "{" + registered[asString] + "}";
        } else if (isProcessableValue(asString)) {
          string += processStyleName(key) + ":" + processStyleValue(key, asString) + ";";
        }
      } else {
        if (key === 'NO_COMPONENT_SELECTOR' && isDevelopment$1) {
          throw new Error(noComponentSelectorMessage);
        }

        if (Array.isArray(value) && typeof value[0] === 'string' && (registered == null || registered[value[0]] === undefined)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue(value[_i])) {
              string += processStyleName(key) + ":" + processStyleValue(key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation(mergedProps, registered, value);

          switch (key) {
            case 'animation':
            case 'animationName':
              {
                string += processStyleName(key) + ":" + interpolated + ";";
                break;
              }

            default:
              {

                string += key + "{" + interpolated + "}";
              }
          }
        }
      }
    }
  }

  return string;
}

var labelPattern = /label:\s*([^\s;{]+)\s*(;|$)/g; // this is the cursor for keyframes
// keyframes are stored on the SerializedStyles object as a linked list

var cursor;
function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0].styles !== undefined) {
    return args[0];
  }

  var stringMode = true;
  var styles = '';
  cursor = undefined;
  var strings = args[0];

  if (strings == null || strings.raw === undefined) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    var asTemplateStringsArr = strings;

    styles += asTemplateStringsArr[0];
  } // we start at 1 since we've already handled the first arg


  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation(mergedProps, registered, args[i]);

    if (stringMode) {
      var templateStringsArr = strings;

      styles += templateStringsArr[i];
    }
  } // using a global regex with .exec is stateful so lastIndex has to be reset each time


  labelPattern.lastIndex = 0;
  var identifierName = '';
  var match; // https://esbench.com/bench/5b809c2cf2949800a0f61fb5

  while ((match = labelPattern.exec(styles)) !== null) {
    identifierName += '-' + match[1];
  }

  var name = murmur2(styles) + identifierName;

  return {
    name: name,
    styles: styles,
    next: cursor
  };
}

var isDevelopment = false;

/*

Based off glamor's StyleSheet, thanks Sunil ❤️

high performance StyleSheet for css-in-js systems

- uses multiple style tags behind the scenes for millions of rules
- uses `insertRule` for appending in production for *much* faster performance

// usage

import { StyleSheet } from '@emotion/sheet'

let styleSheet = new StyleSheet({ key: '', container: document.head })

styleSheet.insert('#box { border: 1px solid red; }')
- appends a css rule into the stylesheet

styleSheet.flush()
- empties the stylesheet of all its contents

*/

function sheetForTag(tag) {
  if (tag.sheet) {
    return tag.sheet;
  } // this weirdness brought to you by firefox

  /* istanbul ignore next */


  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      return document.styleSheets[i];
    }
  } // this function should always return with a value
  // TS can't understand it though so we make it stop complaining here


  return undefined;
}

function createStyleElement(options) {
  var tag = document.createElement('style');
  tag.setAttribute('data-emotion', options.key);

  if (options.nonce !== undefined) {
    tag.setAttribute('nonce', options.nonce);
  }

  tag.appendChild(document.createTextNode(''));
  tag.setAttribute('data-s', '');
  return tag;
}

var StyleSheet = /*#__PURE__*/function () {
  // Using Node instead of HTMLElement since container may be a ShadowRoot
  function StyleSheet(options) {
    var _this = this;

    this._insertTag = function (tag) {
      var before;

      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }

      _this.container.insertBefore(tag, before);

      _this.tags.push(tag);
    };

    this.isSpeedy = options.speedy === undefined ? !isDevelopment : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce; // key is the value of the data-emotion attribute, it's used to identify different sheets

    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }

  var _proto = StyleSheet.prototype;

  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };

  _proto.insert = function insert(rule) {
    // the max length is how many rules we have per style tag, it's 65000 in speedy mode
    // it's 1 in dev because we insert source maps that map a single rule to a location
    // and you can only have one source map per style tag
    if (this.ctr % (this.isSpeedy ? 65000 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }

    var tag = this.tags[this.tags.length - 1];

    if (this.isSpeedy) {
      var sheet = sheetForTag(tag);

      try {
        // this is the ultrafast version, works across browsers
        // the big drawback is that the css won't be editable in devtools
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }

    this.ctr++;
  };

  _proto.flush = function flush() {
    this.tags.forEach(function (tag) {
      var _tag$parentNode;

      return (_tag$parentNode = tag.parentNode) == null ? void 0 : _tag$parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;
  };

  return StyleSheet;
}();

var MS = '-ms-';
var MOZ = '-moz-';
var WEBKIT = '-webkit-';

var COMMENT = 'comm';
var RULESET = 'rule';
var DECLARATION = 'decl';
var IMPORT = '@import';
var KEYFRAMES = '@keyframes';
var LAYER = '@layer';

/**
 * @param {number}
 * @return {number}
 */
var abs = Math.abs;

/**
 * @param {number}
 * @return {string}
 */
var from = String.fromCharCode;

/**
 * @param {object}
 * @return {object}
 */
var assign = Object.assign;

/**
 * @param {string} value
 * @param {number} length
 * @return {number}
 */
function hash (value, length) {
	return charat(value, 0) ^ 45 ? (((((((length << 2) ^ charat(value, 0)) << 2) ^ charat(value, 1)) << 2) ^ charat(value, 2)) << 2) ^ charat(value, 3) : 0
}

/**
 * @param {string} value
 * @return {string}
 */
function trim (value) {
	return value.trim()
}

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @return {string?}
 */
function match (value, pattern) {
	return (value = pattern.exec(value)) ? value[0] : value
}

/**
 * @param {string} value
 * @param {(string|RegExp)} pattern
 * @param {string} replacement
 * @return {string}
 */
function replace (value, pattern, replacement) {
	return value.replace(pattern, replacement)
}

/**
 * @param {string} value
 * @param {string} search
 * @return {number}
 */
function indexof (value, search) {
	return value.indexOf(search)
}

/**
 * @param {string} value
 * @param {number} index
 * @return {number}
 */
function charat (value, index) {
	return value.charCodeAt(index) | 0
}

/**
 * @param {string} value
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function substr (value, begin, end) {
	return value.slice(begin, end)
}

/**
 * @param {string} value
 * @return {number}
 */
function strlen (value) {
	return value.length
}

/**
 * @param {any[]} value
 * @return {number}
 */
function sizeof (value) {
	return value.length
}

/**
 * @param {any} value
 * @param {any[]} array
 * @return {any}
 */
function append (value, array) {
	return array.push(value), value
}

/**
 * @param {string[]} array
 * @param {function} callback
 * @return {string}
 */
function combine (array, callback) {
	return array.map(callback).join('')
}

var line = 1;
var column = 1;
var length = 0;
var position = 0;
var character = 0;
var characters = '';

/**
 * @param {string} value
 * @param {object | null} root
 * @param {object | null} parent
 * @param {string} type
 * @param {string[] | string} props
 * @param {object[] | string} children
 * @param {number} length
 */
function node (value, root, parent, type, props, children, length) {
	return {value: value, root: root, parent: parent, type: type, props: props, children: children, line: line, column: column, length: length, return: ''}
}

/**
 * @param {object} root
 * @param {object} props
 * @return {object}
 */
function copy (root, props) {
	return assign(node('', null, null, '', null, null, 0), root, {length: -root.length}, props)
}

/**
 * @return {number}
 */
function char () {
	return character
}

/**
 * @return {number}
 */
function prev () {
	character = position > 0 ? charat(characters, --position) : 0;

	if (column--, character === 10)
		column = 1, line--;

	return character
}

/**
 * @return {number}
 */
function next () {
	character = position < length ? charat(characters, position++) : 0;

	if (column++, character === 10)
		column = 1, line++;

	return character
}

/**
 * @return {number}
 */
function peek () {
	return charat(characters, position)
}

/**
 * @return {number}
 */
function caret () {
	return position
}

/**
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function slice (begin, end) {
	return substr(characters, begin, end)
}

/**
 * @param {number} type
 * @return {number}
 */
function token (type) {
	switch (type) {
		// \0 \t \n \r \s whitespace token
		case 0: case 9: case 10: case 13: case 32:
			return 5
		// ! + , / > @ ~ isolate token
		case 33: case 43: case 44: case 47: case 62: case 64: case 126:
		// ; { } breakpoint token
		case 59: case 123: case 125:
			return 4
		// : accompanied token
		case 58:
			return 3
		// " ' ( [ opening delimit token
		case 34: case 39: case 40: case 91:
			return 2
		// ) ] closing delimit token
		case 41: case 93:
			return 1
	}

	return 0
}

/**
 * @param {string} value
 * @return {any[]}
 */
function alloc (value) {
	return line = column = 1, length = strlen(characters = value), position = 0, []
}

/**
 * @param {any} value
 * @return {any}
 */
function dealloc (value) {
	return characters = '', value
}

/**
 * @param {number} type
 * @return {string}
 */
function delimit (type) {
	return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)))
}

/**
 * @param {number} type
 * @return {string}
 */
function whitespace (type) {
	while (character = peek())
		if (character < 33)
			next();
		else
			break

	return token(type) > 2 || token(character) > 3 ? '' : ' '
}

/**
 * @param {number} index
 * @param {number} count
 * @return {string}
 */
function escaping (index, count) {
	while (--count && next())
		// not 0-9 A-F a-f
		if (character < 48 || character > 102 || (character > 57 && character < 65) || (character > 70 && character < 97))
			break

	return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32))
}

/**
 * @param {number} type
 * @return {number}
 */
function delimiter (type) {
	while (next())
		switch (character) {
			// ] ) " '
			case type:
				return position
			// " '
			case 34: case 39:
				if (type !== 34 && type !== 39)
					delimiter(character);
				break
			// (
			case 40:
				if (type === 41)
					delimiter(type);
				break
			// \
			case 92:
				next();
				break
		}

	return position
}

/**
 * @param {number} type
 * @param {number} index
 * @return {number}
 */
function commenter (type, index) {
	while (next())
		// //
		if (type + character === 47 + 10)
			break
		// /*
		else if (type + character === 42 + 42 && peek() === 47)
			break

	return '/*' + slice(index, position - 1) + '*' + from(type === 47 ? type : next())
}

/**
 * @param {number} index
 * @return {string}
 */
function identifier (index) {
	while (!token(peek()))
		next();

	return slice(index, position)
}

/**
 * @param {string} value
 * @return {object[]}
 */
function compile (value) {
	return dealloc(parse('', null, null, null, [''], value = alloc(value), 0, [0], value))
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {string[]} rule
 * @param {string[]} rules
 * @param {string[]} rulesets
 * @param {number[]} pseudo
 * @param {number[]} points
 * @param {string[]} declarations
 * @return {object}
 */
function parse (value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
	var index = 0;
	var offset = 0;
	var length = pseudo;
	var atrule = 0;
	var property = 0;
	var previous = 0;
	var variable = 1;
	var scanning = 1;
	var ampersand = 1;
	var character = 0;
	var type = '';
	var props = rules;
	var children = rulesets;
	var reference = rule;
	var characters = type;

	while (scanning)
		switch (previous = character, character = next()) {
			// (
			case 40:
				if (previous != 108 && charat(characters, length - 1) == 58) {
					if (indexof(characters += replace(delimit(character), '&', '&\f'), '&\f') != -1)
						ampersand = -1;
					break
				}
			// " ' [
			case 34: case 39: case 91:
				characters += delimit(character);
				break
			// \t \n \r \s
			case 9: case 10: case 13: case 32:
				characters += whitespace(previous);
				break
			// \
			case 92:
				characters += escaping(caret() - 1, 7);
				continue
			// /
			case 47:
				switch (peek()) {
					case 42: case 47:
						append(comment(commenter(next(), caret()), root, parent), declarations);
						break
					default:
						characters += '/';
				}
				break
			// {
			case 123 * variable:
				points[index++] = strlen(characters) * ampersand;
			// } ; \0
			case 125 * variable: case 59: case 0:
				switch (character) {
					// \0 }
					case 0: case 125: scanning = 0;
					// ;
					case 59 + offset: if (ampersand == -1) characters = replace(characters, /\f/g, '');
						if (property > 0 && (strlen(characters) - length))
							append(property > 32 ? declaration(characters + ';', rule, parent, length - 1) : declaration(replace(characters, ' ', '') + ';', rule, parent, length - 2), declarations);
						break
					// @ ;
					case 59: characters += ';';
					// { rule/at-rule
					default:
						append(reference = ruleset(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length), rulesets);

						if (character === 123)
							if (offset === 0)
								parse(characters, root, reference, reference, props, rulesets, length, points, children);
							else
								switch (atrule === 99 && charat(characters, 3) === 110 ? 100 : atrule) {
									// d l m s
									case 100: case 108: case 109: case 115:
										parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length), children), rules, children, length, points, rule ? props : children);
										break
									default:
										parse(characters, reference, reference, reference, [''], children, 0, points, children);
								}
				}

				index = offset = property = 0, variable = ampersand = 1, type = characters = '', length = pseudo;
				break
			// :
			case 58:
				length = 1 + strlen(characters), property = previous;
			default:
				if (variable < 1)
					if (character == 123)
						--variable;
					else if (character == 125 && variable++ == 0 && prev() == 125)
						continue

				switch (characters += from(character), character * variable) {
					// &
					case 38:
						ampersand = offset > 0 ? 1 : (characters += '\f', -1);
						break
					// ,
					case 44:
						points[index++] = (strlen(characters) - 1) * ampersand, ampersand = 1;
						break
					// @
					case 64:
						// -
						if (peek() === 45)
							characters += delimit(next());

						atrule = peek(), offset = length = strlen(type = characters += identifier(caret())), character++;
						break
					// -
					case 45:
						if (previous === 45 && strlen(characters) == 2)
							variable = 0;
				}
		}

	return rulesets
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} index
 * @param {number} offset
 * @param {string[]} rules
 * @param {number[]} points
 * @param {string} type
 * @param {string[]} props
 * @param {string[]} children
 * @param {number} length
 * @return {object}
 */
function ruleset (value, root, parent, index, offset, rules, points, type, props, children, length) {
	var post = offset - 1;
	var rule = offset === 0 ? rules : [''];
	var size = sizeof(rule);

	for (var i = 0, j = 0, k = 0; i < index; ++i)
		for (var x = 0, y = substr(value, post + 1, post = abs(j = points[i])), z = value; x < size; ++x)
			if (z = trim(j > 0 ? rule[x] + ' ' + y : replace(y, /&\f/g, rule[x])))
				props[k++] = z;

	return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length)
}

/**
 * @param {number} value
 * @param {object} root
 * @param {object?} parent
 * @return {object}
 */
function comment (value, root, parent) {
	return node(value, root, parent, COMMENT, from(char()), substr(value, 2, -2), 0)
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} length
 * @return {object}
 */
function declaration (value, root, parent, length) {
	return node(value, root, parent, DECLARATION, substr(value, 0, length), substr(value, length + 1, -1), length)
}

/**
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function serialize (children, callback) {
	var output = '';
	var length = sizeof(children);

	for (var i = 0; i < length; i++)
		output += callback(children[i], i, children, callback) || '';

	return output
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function stringify (element, index, children, callback) {
	switch (element.type) {
		case LAYER: if (element.children.length) break
		case IMPORT: case DECLARATION: return element.return = element.return || element.value
		case COMMENT: return ''
		case KEYFRAMES: return element.return = element.value + '{' + serialize(element.children, callback) + '}'
		case RULESET: element.value = element.props.join(',');
	}

	return strlen(children = serialize(element.children, callback)) ? element.return = element.value + '{' + children + '}' : ''
}

/**
 * @param {function[]} collection
 * @return {function}
 */
function middleware (collection) {
	var length = sizeof(collection);

	return function (element, index, children, callback) {
		var output = '';

		for (var i = 0; i < length; i++)
			output += collection[i](element, index, children, callback) || '';

		return output
	}
}

/**
 * @param {function} callback
 * @return {function}
 */
function rulesheet (callback) {
	return function (element) {
		if (!element.root)
			if (element = element.return)
				callback(element);
	}
}

var weakMemoize = function weakMemoize(func) {
  var cache = new WeakMap();
  return function (arg) {
    if (cache.has(arg)) {
      // Use non-null assertion because we just checked that the cache `has` it
      // This allows us to remove `undefined` from the return value
      return cache.get(arg);
    }

    var ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
};

var isBrowser = typeof document !== 'undefined';

var identifierWithPointTracking = function identifierWithPointTracking(begin, points, index) {
  var previous = 0;
  var character = 0;

  while (true) {
    previous = character;
    character = peek(); // &\f

    if (previous === 38 && character === 12) {
      points[index] = 1;
    }

    if (token(character)) {
      break;
    }

    next();
  }

  return slice(begin, position);
};

var toRules = function toRules(parsed, points) {
  // pretend we've started with a comma
  var index = -1;
  var character = 44;

  do {
    switch (token(character)) {
      case 0:
        // &\f
        if (character === 38 && peek() === 12) {
          // this is not 100% correct, we don't account for literal sequences here - like for example quoted strings
          // stylis inserts \f after & to know when & where it should replace this sequence with the context selector
          // and when it should just concatenate the outer and inner selectors
          // it's very unlikely for this sequence to actually appear in a different context, so we just leverage this fact here
          points[index] = 1;
        }

        parsed[index] += identifierWithPointTracking(position - 1, points, index);
        break;

      case 2:
        parsed[index] += delimit(character);
        break;

      case 4:
        // comma
        if (character === 44) {
          // colon
          parsed[++index] = peek() === 58 ? '&\f' : '';
          points[index] = parsed[index].length;
          break;
        }

      // fallthrough

      default:
        parsed[index] += from(character);
    }
  } while (character = next());

  return parsed;
};

var getRules = function getRules(value, points) {
  return dealloc(toRules(alloc(value), points));
}; // WeakSet would be more appropriate, but only WeakMap is supported in IE11


var fixedElements = /* #__PURE__ */new WeakMap();
var compat = function compat(element) {
  if (element.type !== 'rule' || !element.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }

  var value = element.value;
  var parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;

  while (parent.type !== 'rule') {
    parent = parent.parent;
    if (!parent) return;
  } // short-circuit for the simplest case


  if (element.props.length === 1 && value.charCodeAt(0) !== 58
  /* colon */
  && !fixedElements.get(parent)) {
    return;
  } // if this is an implicitly inserted rule (the one eagerly inserted at the each new nested level)
  // then the props has already been manipulated beforehand as they that array is shared between it and its "rule parent"


  if (isImplicitRule) {
    return;
  }

  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;

  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};
var removeLabel = function removeLabel(element) {
  if (element.type === 'decl') {
    var value = element.value;

    if ( // charcode for l
    value.charCodeAt(0) === 108 && // charcode for b
    value.charCodeAt(2) === 98) {
      // this ignores label
      element["return"] = '';
      element.value = '';
    }
  }
};

/* eslint-disable no-fallthrough */

function prefix(value, length) {
  switch (hash(value, length)) {
    // color-adjust
    case 5103:
      return WEBKIT + 'print-' + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)

    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921: // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break

    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005: // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,

    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855: // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)

    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust

    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    // flex, flex-direction

    case 6828:
    case 4268:
      return WEBKIT + value + MS + value + value;
    // order

    case 6165:
      return WEBKIT + value + MS + 'flex-' + value + value;
    // align-items

    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + 'box-$1$2' + MS + 'flex-$1$2') + value;
    // align-self

    case 5443:
      return WEBKIT + value + MS + 'flex-item-' + replace(value, /flex-|-self/, '') + value;
    // align-content

    case 4675:
      return WEBKIT + value + MS + 'flex-line-pack' + replace(value, /align-content|flex-|-self/, '') + value;
    // flex-shrink

    case 5548:
      return WEBKIT + value + MS + replace(value, 'shrink', 'negative') + value;
    // flex-basis

    case 5292:
      return WEBKIT + value + MS + replace(value, 'basis', 'preferred-size') + value;
    // flex-grow

    case 6060:
      return WEBKIT + 'box-' + replace(value, '-grow', '') + WEBKIT + value + MS + replace(value, 'grow', 'positive') + value;
    // transition

    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, '$1' + WEBKIT + '$2') + value;
    // cursor

    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + '$1'), /(image-set)/, WEBKIT + '$1'), value, '') + value;
    // background, background-image

    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + '$1' + '$`$1');
    // justify-content

    case 4968:
      return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + 'box-pack:$3' + MS + 'flex-pack:$3'), /s.+-b[^;]+/, 'justify') + WEBKIT + value + value;
    // (margin|padding)-inline-(start|end)

    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + '$1$2') + value;
    // (min|max)?(width|height|inline-size|block-size)

    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      // stretch, max-content, min-content, fill-available
      if (strlen(value) - 1 - length > 6) switch (charat(value, length + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          // -
          if (charat(value, length + 4) !== 45) break;
        // (f)ill-available, (f)it-content

        case 102:
          return replace(value, /(.+:)(.+)-([^]+)/, '$1' + WEBKIT + '$2-$3' + '$1' + MOZ + (charat(value, length + 3) == 108 ? '$3' : '$2-$3')) + value;
        // (s)tretch

        case 115:
          return ~indexof(value, 'stretch') ? prefix(replace(value, 'stretch', 'fill-available'), length) + value : value;
      }
      break;
    // position: sticky

    case 4949:
      // (s)ticky?
      if (charat(value, length + 1) !== 115) break;
    // display: (flex|inline-flex)

    case 6444:
      switch (charat(value, strlen(value) - 3 - (~indexof(value, '!important') && 10))) {
        // stic(k)y
        case 107:
          return replace(value, ':', ':' + WEBKIT) + value;
        // (inline-)?fl(e)x

        case 101:
          return replace(value, /(.+:)([^;!]+)(;|!.+)?/, '$1' + WEBKIT + (charat(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + WEBKIT + '$2$3' + '$1' + MS + '$2box$3') + value;
      }

      break;
    // writing-mode

    case 5936:
      switch (charat(value, length + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb') + value;
        // vertical-r(l)

        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value;
        // horizontal(-)tb

        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'lr') + value;
      }

      return WEBKIT + value + MS + value + value;
  }

  return value;
}

var prefixer = function prefixer(element, index, children, callback) {
  if (element.length > -1) if (!element["return"]) switch (element.type) {
    case DECLARATION:
      element["return"] = prefix(element.value, element.length);
      break;

    case KEYFRAMES:
      return serialize([copy(element, {
        value: replace(element.value, '@', '@' + WEBKIT)
      })], callback);

    case RULESET:
      if (element.length) return combine(element.props, function (value) {
        switch (match(value, /(::plac\w+|:read-\w+)/)) {
          // :read-(only|write)
          case ':read-only':
          case ':read-write':
            return serialize([copy(element, {
              props: [replace(value, /:(read-\w+)/, ':' + MOZ + '$1')]
            })], callback);
          // :placeholder

          case '::placeholder':
            return serialize([copy(element, {
              props: [replace(value, /:(plac\w+)/, ':' + WEBKIT + 'input-$1')]
            }), copy(element, {
              props: [replace(value, /:(plac\w+)/, ':' + MOZ + '$1')]
            }), copy(element, {
              props: [replace(value, /:(plac\w+)/, MS + 'input-$1')]
            })], callback);
        }

        return '';
      });
  }
};

var getServerStylisCache = isBrowser ? undefined : weakMemoize(function () {
  return memoize(function () {
    return {};
  });
});
var defaultStylisPlugins = [prefixer];

var createCache = function createCache(options) {
  var key = options.key;

  if (isBrowser && key === 'css') {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])"); // get SSRed styles out of the way of React's hydration
    // document.head is a safe place to move them to(though note document.head is not necessarily the last place they will be)
    // note this very very intentionally targets all style elements regardless of the key to ensure
    // that creating a cache works inside of render of a React component

    Array.prototype.forEach.call(ssrStyles, function (node) {
      // we want to only move elements which have a space in the data-emotion attribute value
      // because that indicates that it is an Emotion 11 server-side rendered style elements
      // while we will already ignore Emotion 11 client-side inserted styles because of the :not([data-s]) part in the selector
      // Emotion 10 client-side inserted styles did not have data-s (but importantly did not have a space in their data-emotion attributes)
      // so checking for the space ensures that loading Emotion 11 after Emotion 10 has inserted some styles
      // will not result in the Emotion 10 styles being destroyed
      var dataEmotionAttribute = node.getAttribute('data-emotion');

      if (dataEmotionAttribute.indexOf(' ') === -1) {
        return;
      }

      document.head.appendChild(node);
      node.setAttribute('data-s', '');
    });
  }

  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;

  var inserted = {};
  var container;
  var nodesToHydrate = [];

  if (isBrowser) {
    container = options.container || document.head;
    Array.prototype.forEach.call( // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll("style[data-emotion^=\"" + key + " \"]"), function (node) {
      var attrib = node.getAttribute("data-emotion").split(' ');

      for (var i = 1; i < attrib.length; i++) {
        inserted[attrib[i]] = true;
      }

      nodesToHydrate.push(node);
    });
  }

  var _insert;

  var omnipresentPlugins = [compat, removeLabel];

  if (!getServerStylisCache) {
    var currentSheet;
    var finalizingPlugins = [stringify, rulesheet(function (rule) {
      currentSheet.insert(rule);
    })];
    var serializer = middleware(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));

    var stylis = function stylis(styles) {
      return serialize(compile(styles), serializer);
    };

    _insert = function insert(selector, serialized, sheet, shouldCache) {
      currentSheet = sheet;

      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);

      if (shouldCache) {
        cache.inserted[serialized.name] = true;
      }
    };
  } else {
    var _finalizingPlugins = [stringify];

    var _serializer = middleware(omnipresentPlugins.concat(stylisPlugins, _finalizingPlugins));

    var _stylis = function _stylis(styles) {
      return serialize(compile(styles), _serializer);
    };

    var serverStylisCache = getServerStylisCache(stylisPlugins)(key);

    var getRules = function getRules(selector, serialized) {
      var name = serialized.name;

      if (serverStylisCache[name] === undefined) {
        serverStylisCache[name] = _stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);
      }

      return serverStylisCache[name];
    };

    _insert = function _insert(selector, serialized, sheet, shouldCache) {
      var name = serialized.name;
      var rules = getRules(selector, serialized);

      if (cache.compat === undefined) {
        // in regular mode, we don't set the styles on the inserted cache
        // since we don't need to and that would be wasting memory
        // we return them so that they are rendered in a style tag
        if (shouldCache) {
          cache.inserted[name] = true;
        }

        return rules;
      } else {
        // in compat mode, we put the styles on the inserted cache so
        // that emotion-server can pull out the styles
        // except when we don't want to cache it which was in Global but now
        // is nowhere but we don't want to do a major right now
        // and just in case we're going to leave the case here
        // it's also not affecting client side bundle size
        // so it's really not a big deal
        if (shouldCache) {
          cache.inserted[name] = rules;
        } else {
          return rules;
        }
      }
    };
  }

  var cache = {
    key: key,
    sheet: new StyleSheet({
      key: key,
      container: container,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted: inserted,
    registered: {},
    insert: _insert
  };
  cache.sheet.hydrate(nodesToHydrate);
  return cache;
};

var jsxRuntime = {exports: {}};

var reactJsxRuntime_production = {};

/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production;

function requireReactJsxRuntime_production () {
	if (hasRequiredReactJsxRuntime_production) return reactJsxRuntime_production;
	hasRequiredReactJsxRuntime_production = 1;
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
	  var key = null;
	  void 0 !== maybeKey && (key = "" + maybeKey);
	  void 0 !== config.key && (key = "" + config.key);
	  if ("key" in config) {
	    maybeKey = {};
	    for (var propName in config)
	      "key" !== propName && (maybeKey[propName] = config[propName]);
	  } else maybeKey = config;
	  config = maybeKey.ref;
	  return {
	    $$typeof: REACT_ELEMENT_TYPE,
	    type: type,
	    key: key,
	    ref: void 0 !== config ? config : null,
	    props: maybeKey
	  };
	}
	reactJsxRuntime_production.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_production.jsx = jsxProd;
	reactJsxRuntime_production.jsxs = jsxProd;
	return reactJsxRuntime_production;
}

var reactJsxRuntime_development = {};

/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_development;

function requireReactJsxRuntime_development () {
	if (hasRequiredReactJsxRuntime_development) return reactJsxRuntime_development;
	hasRequiredReactJsxRuntime_development = 1;
	"production" !== process.env.NODE_ENV &&
	  (function () {
	    function getComponentNameFromType(type) {
	      if (null == type) return null;
	      if ("function" === typeof type)
	        return type.$$typeof === REACT_CLIENT_REFERENCE
	          ? null
	          : type.displayName || type.name || null;
	      if ("string" === typeof type) return type;
	      switch (type) {
	        case REACT_FRAGMENT_TYPE:
	          return "Fragment";
	        case REACT_PROFILER_TYPE:
	          return "Profiler";
	        case REACT_STRICT_MODE_TYPE:
	          return "StrictMode";
	        case REACT_SUSPENSE_TYPE:
	          return "Suspense";
	        case REACT_SUSPENSE_LIST_TYPE:
	          return "SuspenseList";
	        case REACT_ACTIVITY_TYPE:
	          return "Activity";
	      }
	      if ("object" === typeof type)
	        switch (
	          ("number" === typeof type.tag &&
	            console.error(
	              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
	            ),
	          type.$$typeof)
	        ) {
	          case REACT_PORTAL_TYPE:
	            return "Portal";
	          case REACT_CONTEXT_TYPE:
	            return type.displayName || "Context";
	          case REACT_CONSUMER_TYPE:
	            return (type._context.displayName || "Context") + ".Consumer";
	          case REACT_FORWARD_REF_TYPE:
	            var innerType = type.render;
	            type = type.displayName;
	            type ||
	              ((type = innerType.displayName || innerType.name || ""),
	              (type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef"));
	            return type;
	          case REACT_MEMO_TYPE:
	            return (
	              (innerType = type.displayName || null),
	              null !== innerType
	                ? innerType
	                : getComponentNameFromType(type.type) || "Memo"
	            );
	          case REACT_LAZY_TYPE:
	            innerType = type._payload;
	            type = type._init;
	            try {
	              return getComponentNameFromType(type(innerType));
	            } catch (x) {}
	        }
	      return null;
	    }
	    function testStringCoercion(value) {
	      return "" + value;
	    }
	    function checkKeyStringCoercion(value) {
	      try {
	        testStringCoercion(value);
	        var JSCompiler_inline_result = !1;
	      } catch (e) {
	        JSCompiler_inline_result = !0;
	      }
	      if (JSCompiler_inline_result) {
	        JSCompiler_inline_result = console;
	        var JSCompiler_temp_const = JSCompiler_inline_result.error;
	        var JSCompiler_inline_result$jscomp$0 =
	          ("function" === typeof Symbol &&
	            Symbol.toStringTag &&
	            value[Symbol.toStringTag]) ||
	          value.constructor.name ||
	          "Object";
	        JSCompiler_temp_const.call(
	          JSCompiler_inline_result,
	          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
	          JSCompiler_inline_result$jscomp$0
	        );
	        return testStringCoercion(value);
	      }
	    }
	    function getTaskName(type) {
	      if (type === REACT_FRAGMENT_TYPE) return "<>";
	      if (
	        "object" === typeof type &&
	        null !== type &&
	        type.$$typeof === REACT_LAZY_TYPE
	      )
	        return "<...>";
	      try {
	        var name = getComponentNameFromType(type);
	        return name ? "<" + name + ">" : "<...>";
	      } catch (x) {
	        return "<...>";
	      }
	    }
	    function getOwner() {
	      var dispatcher = ReactSharedInternals.A;
	      return null === dispatcher ? null : dispatcher.getOwner();
	    }
	    function UnknownOwner() {
	      return Error("react-stack-top-frame");
	    }
	    function hasValidKey(config) {
	      if (hasOwnProperty.call(config, "key")) {
	        var getter = Object.getOwnPropertyDescriptor(config, "key").get;
	        if (getter && getter.isReactWarning) return !1;
	      }
	      return void 0 !== config.key;
	    }
	    function defineKeyPropWarningGetter(props, displayName) {
	      function warnAboutAccessingKey() {
	        specialPropKeyWarningShown ||
	          ((specialPropKeyWarningShown = !0),
	          console.error(
	            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
	            displayName
	          ));
	      }
	      warnAboutAccessingKey.isReactWarning = !0;
	      Object.defineProperty(props, "key", {
	        get: warnAboutAccessingKey,
	        configurable: !0
	      });
	    }
	    function elementRefGetterWithDeprecationWarning() {
	      var componentName = getComponentNameFromType(this.type);
	      didWarnAboutElementRef[componentName] ||
	        ((didWarnAboutElementRef[componentName] = !0),
	        console.error(
	          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
	        ));
	      componentName = this.props.ref;
	      return void 0 !== componentName ? componentName : null;
	    }
	    function ReactElement(type, key, props, owner, debugStack, debugTask) {
	      var refProp = props.ref;
	      type = {
	        $$typeof: REACT_ELEMENT_TYPE,
	        type: type,
	        key: key,
	        props: props,
	        _owner: owner
	      };
	      null !== (void 0 !== refProp ? refProp : null)
	        ? Object.defineProperty(type, "ref", {
	            enumerable: !1,
	            get: elementRefGetterWithDeprecationWarning
	          })
	        : Object.defineProperty(type, "ref", { enumerable: !1, value: null });
	      type._store = {};
	      Object.defineProperty(type._store, "validated", {
	        configurable: !1,
	        enumerable: !1,
	        writable: !0,
	        value: 0
	      });
	      Object.defineProperty(type, "_debugInfo", {
	        configurable: !1,
	        enumerable: !1,
	        writable: !0,
	        value: null
	      });
	      Object.defineProperty(type, "_debugStack", {
	        configurable: !1,
	        enumerable: !1,
	        writable: !0,
	        value: debugStack
	      });
	      Object.defineProperty(type, "_debugTask", {
	        configurable: !1,
	        enumerable: !1,
	        writable: !0,
	        value: debugTask
	      });
	      Object.freeze && (Object.freeze(type.props), Object.freeze(type));
	      return type;
	    }
	    function jsxDEVImpl(
	      type,
	      config,
	      maybeKey,
	      isStaticChildren,
	      debugStack,
	      debugTask
	    ) {
	      var children = config.children;
	      if (void 0 !== children)
	        if (isStaticChildren)
	          if (isArrayImpl(children)) {
	            for (
	              isStaticChildren = 0;
	              isStaticChildren < children.length;
	              isStaticChildren++
	            )
	              validateChildKeys(children[isStaticChildren]);
	            Object.freeze && Object.freeze(children);
	          } else
	            console.error(
	              "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
	            );
	        else validateChildKeys(children);
	      if (hasOwnProperty.call(config, "key")) {
	        children = getComponentNameFromType(type);
	        var keys = Object.keys(config).filter(function (k) {
	          return "key" !== k;
	        });
	        isStaticChildren =
	          0 < keys.length
	            ? "{key: someKey, " + keys.join(": ..., ") + ": ...}"
	            : "{key: someKey}";
	        didWarnAboutKeySpread[children + isStaticChildren] ||
	          ((keys =
	            0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}"),
	          console.error(
	            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
	            isStaticChildren,
	            children,
	            keys,
	            children
	          ),
	          (didWarnAboutKeySpread[children + isStaticChildren] = !0));
	      }
	      children = null;
	      void 0 !== maybeKey &&
	        (checkKeyStringCoercion(maybeKey), (children = "" + maybeKey));
	      hasValidKey(config) &&
	        (checkKeyStringCoercion(config.key), (children = "" + config.key));
	      if ("key" in config) {
	        maybeKey = {};
	        for (var propName in config)
	          "key" !== propName && (maybeKey[propName] = config[propName]);
	      } else maybeKey = config;
	      children &&
	        defineKeyPropWarningGetter(
	          maybeKey,
	          "function" === typeof type
	            ? type.displayName || type.name || "Unknown"
	            : type
	        );
	      return ReactElement(
	        type,
	        children,
	        maybeKey,
	        getOwner(),
	        debugStack,
	        debugTask
	      );
	    }
	    function validateChildKeys(node) {
	      isValidElement(node)
	        ? node._store && (node._store.validated = 1)
	        : "object" === typeof node &&
	          null !== node &&
	          node.$$typeof === REACT_LAZY_TYPE &&
	          ("fulfilled" === node._payload.status
	            ? isValidElement(node._payload.value) &&
	              node._payload.value._store &&
	              (node._payload.value._store.validated = 1)
	            : node._store && (node._store.validated = 1));
	    }
	    function isValidElement(object) {
	      return (
	        "object" === typeof object &&
	        null !== object &&
	        object.$$typeof === REACT_ELEMENT_TYPE
	      );
	    }
	    var React = React__default,
	      REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	      REACT_PORTAL_TYPE = Symbol.for("react.portal"),
	      REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
	      REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
	      REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
	      REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
	      REACT_CONTEXT_TYPE = Symbol.for("react.context"),
	      REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
	      REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
	      REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
	      REACT_MEMO_TYPE = Symbol.for("react.memo"),
	      REACT_LAZY_TYPE = Symbol.for("react.lazy"),
	      REACT_ACTIVITY_TYPE = Symbol.for("react.activity"),
	      REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"),
	      ReactSharedInternals =
	        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
	      hasOwnProperty = Object.prototype.hasOwnProperty,
	      isArrayImpl = Array.isArray,
	      createTask = console.createTask
	        ? console.createTask
	        : function () {
	            return null;
	          };
	    React = {
	      react_stack_bottom_frame: function (callStackForError) {
	        return callStackForError();
	      }
	    };
	    var specialPropKeyWarningShown;
	    var didWarnAboutElementRef = {};
	    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(
	      React,
	      UnknownOwner
	    )();
	    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
	    var didWarnAboutKeySpread = {};
	    reactJsxRuntime_development.Fragment = REACT_FRAGMENT_TYPE;
	    reactJsxRuntime_development.jsx = function (type, config, maybeKey) {
	      var trackActualOwner =
	        1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
	      return jsxDEVImpl(
	        type,
	        config,
	        maybeKey,
	        !1,
	        trackActualOwner
	          ? Error("react-stack-top-frame")
	          : unknownOwnerDebugStack,
	        trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
	      );
	    };
	    reactJsxRuntime_development.jsxs = function (type, config, maybeKey) {
	      var trackActualOwner =
	        1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
	      return jsxDEVImpl(
	        type,
	        config,
	        maybeKey,
	        !0,
	        trackActualOwner
	          ? Error("react-stack-top-frame")
	          : unknownOwnerDebugStack,
	        trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
	      );
	    };
	  })();
	return reactJsxRuntime_development;
}

var hasRequiredJsxRuntime;

function requireJsxRuntime () {
	if (hasRequiredJsxRuntime) return jsxRuntime.exports;
	hasRequiredJsxRuntime = 1;

	if (process.env.NODE_ENV === 'production') {
	  jsxRuntime.exports = requireReactJsxRuntime_production();
	} else {
	  jsxRuntime.exports = requireReactJsxRuntime_development();
	}
	return jsxRuntime.exports;
}

var jsxRuntimeExports = requireJsxRuntime();

function getCache(injectFirst, enableCssLayer) {
  const emotionCache = createCache({
    key: 'css',
    prepend: injectFirst
  });
  if (enableCssLayer) {
    const prevInsert = emotionCache.insert;
    emotionCache.insert = (...args) => {
      if (!args[1].styles.match(/^@layer\s+[^{]*$/)) {
        // avoid nested @layer
        args[1].styles = `@layer mui {${args[1].styles}}`;
      }
      return prevInsert(...args);
    };
  }
  return emotionCache;
}
const cacheMap = new Map();
function StyledEngineProvider(props) {
  const {
    injectFirst,
    enableCssLayer,
    children
  } = props;
  const cache = React.useMemo(() => {
    const cacheKey = `${injectFirst}-${enableCssLayer}`;
    if (typeof document === 'object' && cacheMap.has(cacheKey)) {
      return cacheMap.get(cacheKey);
    }
    const fresh = getCache(injectFirst, enableCssLayer);
    cacheMap.set(cacheKey, fresh);
    return fresh;
  }, [injectFirst, enableCssLayer]);
  if (injectFirst || enableCssLayer) {
    return /*#__PURE__*/jsxRuntimeExports.jsx(CacheProvider, {
      value: cache,
      children: children
    });
  }
  return children;
}
process.env.NODE_ENV !== "production" ? StyledEngineProvider.propTypes = {
  /**
   * Your component tree.
   */
  children: PropTypes.node,
  /**
   * If true, MUI styles are wrapped in CSS `@layer mui` rule.
   * It helps to override MUI styles when using CSS Modules, Tailwind CSS, plain CSS, or any other styling solution.
   */
  enableCssLayer: PropTypes.bool,
  /**
   * By default, the styles are injected last in the <head> element of the page.
   * As a result, they gain more specificity than any other style sheet.
   * If you want to override MUI's styles, set this prop.
   */
  injectFirst: PropTypes.bool
} : void 0;

function isEmpty$1(obj) {
  return obj === undefined || obj === null || Object.keys(obj).length === 0;
}
function GlobalStyles(props) {
  const {
    styles,
    defaultTheme = {}
  } = props;
  const globalStyles = typeof styles === 'function' ? themeInput => styles(isEmpty$1(themeInput) ? defaultTheme : themeInput) : styles;
  return /*#__PURE__*/jsxRuntimeExports.jsx(Global, {
    styles: globalStyles
  });
}
process.env.NODE_ENV !== "production" ? GlobalStyles.propTypes = {
  defaultTheme: PropTypes.object,
  styles: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object, PropTypes.func])
} : void 0;

/**
 * @mui/styled-engine v5.18.0
 *
 * @license MIT
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
function styled$4(tag, options) {
  const stylesFactory = newStyled(tag, options);
  if (process.env.NODE_ENV !== 'production') {
    return (...styles) => {
      const component = typeof tag === 'string' ? `"${tag}"` : 'component';
      if (styles.length === 0) {
        console.error([`MUI: Seems like you called \`styled(${component})()\` without a \`style\` argument.`, 'You must provide a `styles` argument: `styled("div")(styleYouForgotToPass)`.'].join('\n'));
      } else if (styles.some(style => style === undefined)) {
        console.error(`MUI: the styled(${component})(...args) API requires all its args to be defined.`);
      }
      return stylesFactory(...styles);
    };
  }
  return stylesFactory;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const internal_processStyles = (tag, processor) => {
  // Emotion attaches all the styles as `__emotion_styles`.
  // Ref: https://github.com/emotion-js/emotion/blob/16d971d0da229596d6bcc39d282ba9753c9ee7cf/packages/styled/src/base.js#L186
  if (Array.isArray(tag.__emotion_styles)) {
    tag.__emotion_styles = processor(tag.__emotion_styles);
  }
};

// Emotion only accepts an array, but we want to avoid allocations
const wrapper = [];
// eslint-disable-next-line @typescript-eslint/naming-convention
function internal_serializeStyles(styles) {
  wrapper[0] = styles;
  return serializeStyles(wrapper);
}

var styledEngine = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': styled$4,
  internal_processStyles: internal_processStyles,
  internal_serializeStyles: internal_serializeStyles,
  ThemeContext: ThemeContext,
  keyframes: keyframes,
  css: css,
  StyledEngineProvider: StyledEngineProvider,
  GlobalStyles: GlobalStyles
});

function isObjectEmpty(obj) {
  return Object.keys(obj).length === 0;
}
function useTheme$2(defaultTheme = null) {
  const contextTheme = React.useContext(ThemeContext);
  return !contextTheme || isObjectEmpty(contextTheme) ? defaultTheme : contextTheme;
}

const systemDefaultTheme$1 = createTheme$2();
function useTheme$1(defaultTheme = systemDefaultTheme$1) {
  return useTheme$2(defaultTheme);
}

const _excluded$t = ["sx"];
const splitProps = props => {
  var _props$theme$unstable, _props$theme;
  const result = {
    systemProps: {},
    otherProps: {}
  };
  const config = (_props$theme$unstable = props == null || (_props$theme = props.theme) == null ? void 0 : _props$theme.unstable_sxConfig) != null ? _props$theme$unstable : defaultSxConfig$1;
  Object.keys(props).forEach(prop => {
    if (config[prop]) {
      result.systemProps[prop] = props[prop];
    } else {
      result.otherProps[prop] = props[prop];
    }
  });
  return result;
};
function extendSxProp(props) {
  const {
      sx: inSx
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$t);
  const {
    systemProps,
    otherProps
  } = splitProps(other);
  let finalSx;
  if (Array.isArray(inSx)) {
    finalSx = [systemProps, ...inSx];
  } else if (typeof inSx === 'function') {
    finalSx = (...args) => {
      const result = inSx(...args);
      if (!isPlainObject(result)) {
        return systemProps;
      }
      return _extends$2({}, systemProps, result);
    };
  } else {
    finalSx = _extends$2({}, systemProps, inSx);
  }
  return _extends$2({}, otherProps, {
    sx: finalSx
  });
}

var styleFunctionSx = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': styleFunctionSx$2,
  unstable_createStyleFunctionSx: unstable_createStyleFunctionSx,
  extendSxProp: extendSxProp,
  unstable_defaultSxConfig: defaultSxConfig$1
});

const defaultGenerator = componentName => componentName;
const createClassNameGenerator = () => {
  let generate = defaultGenerator;
  return {
    configure(generator) {
      generate = generator;
    },
    generate(componentName) {
      return generate(componentName);
    },
    reset() {
      generate = defaultGenerator;
    }
  };
};
const ClassNameGenerator = createClassNameGenerator();
var ClassNameGenerator$1 = ClassNameGenerator;

const globalStateClasses = {
  active: 'active',
  checked: 'checked',
  completed: 'completed',
  disabled: 'disabled',
  error: 'error',
  expanded: 'expanded',
  focused: 'focused',
  focusVisible: 'focusVisible',
  open: 'open',
  readOnly: 'readOnly',
  required: 'required',
  selected: 'selected'
};
function generateUtilityClass(componentName, slot, globalStatePrefix = 'Mui') {
  const globalStateClass = globalStateClasses[slot];
  return globalStateClass ? `${globalStatePrefix}-${globalStateClass}` : `${ClassNameGenerator$1.generate(componentName)}-${slot}`;
}

function createMixins(breakpoints, mixins) {
  return _extends$2({
    toolbar: {
      minHeight: 56,
      [breakpoints.up('xs')]: {
        '@media (orientation: landscape)': {
          minHeight: 48
        }
      },
      [breakpoints.up('sm')]: {
        minHeight: 64
      }
    }
  }, mixins);
}

const common = {
  black: '#000',
  white: '#fff'
};
var common$1 = common;

const grey = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  A100: '#f5f5f5',
  A200: '#eeeeee',
  A400: '#bdbdbd',
  A700: '#616161'
};
var grey$1 = grey;

const purple = {
  50: '#f3e5f5',
  100: '#e1bee7',
  200: '#ce93d8',
  300: '#ba68c8',
  400: '#ab47bc',
  500: '#9c27b0',
  600: '#8e24aa',
  700: '#7b1fa2',
  800: '#6a1b9a',
  900: '#4a148c',
  A100: '#ea80fc',
  A200: '#e040fb',
  A400: '#d500f9',
  A700: '#aa00ff'
};
var purple$1 = purple;

const red = {
  50: '#ffebee',
  100: '#ffcdd2',
  200: '#ef9a9a',
  300: '#e57373',
  400: '#ef5350',
  500: '#f44336',
  600: '#e53935',
  700: '#d32f2f',
  800: '#c62828',
  900: '#b71c1c',
  A100: '#ff8a80',
  A200: '#ff5252',
  A400: '#ff1744',
  A700: '#d50000'
};
var red$1 = red;

const orange = {
  50: '#fff3e0',
  100: '#ffe0b2',
  200: '#ffcc80',
  300: '#ffb74d',
  400: '#ffa726',
  500: '#ff9800',
  600: '#fb8c00',
  700: '#f57c00',
  800: '#ef6c00',
  900: '#e65100',
  A100: '#ffd180',
  A200: '#ffab40',
  A400: '#ff9100',
  A700: '#ff6d00'
};
var orange$1 = orange;

const blue = {
  50: '#e3f2fd',
  100: '#bbdefb',
  200: '#90caf9',
  300: '#64b5f6',
  400: '#42a5f5',
  500: '#2196f3',
  600: '#1e88e5',
  700: '#1976d2',
  800: '#1565c0',
  900: '#0d47a1',
  A100: '#82b1ff',
  A200: '#448aff',
  A400: '#2979ff',
  A700: '#2962ff'
};
var blue$1 = blue;

const lightBlue = {
  50: '#e1f5fe',
  100: '#b3e5fc',
  200: '#81d4fa',
  300: '#4fc3f7',
  400: '#29b6f6',
  500: '#03a9f4',
  600: '#039be5',
  700: '#0288d1',
  800: '#0277bd',
  900: '#01579b',
  A100: '#80d8ff',
  A200: '#40c4ff',
  A400: '#00b0ff',
  A700: '#0091ea'
};
var lightBlue$1 = lightBlue;

const green = {
  50: '#e8f5e9',
  100: '#c8e6c9',
  200: '#a5d6a7',
  300: '#81c784',
  400: '#66bb6a',
  500: '#4caf50',
  600: '#43a047',
  700: '#388e3c',
  800: '#2e7d32',
  900: '#1b5e20',
  A100: '#b9f6ca',
  A200: '#69f0ae',
  A400: '#00e676',
  A700: '#00c853'
};
var green$1 = green;

const _excluded$s = ["mode", "contrastThreshold", "tonalOffset"];
const light = {
  // The colors used to style the text.
  text: {
    // The most important text.
    primary: 'rgba(0, 0, 0, 0.87)',
    // Secondary text.
    secondary: 'rgba(0, 0, 0, 0.6)',
    // Disabled text have even lower visual prominence.
    disabled: 'rgba(0, 0, 0, 0.38)'
  },
  // The color used to divide different elements.
  divider: 'rgba(0, 0, 0, 0.12)',
  // The background colors used to style the surfaces.
  // Consistency between these values is important.
  background: {
    paper: common$1.white,
    default: common$1.white
  },
  // The colors used to style the action elements.
  action: {
    // The color of an active action like an icon button.
    active: 'rgba(0, 0, 0, 0.54)',
    // The color of an hovered action.
    hover: 'rgba(0, 0, 0, 0.04)',
    hoverOpacity: 0.04,
    // The color of a selected action.
    selected: 'rgba(0, 0, 0, 0.08)',
    selectedOpacity: 0.08,
    // The color of a disabled action.
    disabled: 'rgba(0, 0, 0, 0.26)',
    // The background color of a disabled action.
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(0, 0, 0, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.12
  }
};
const dark = {
  text: {
    primary: common$1.white,
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
    icon: 'rgba(255, 255, 255, 0.5)'
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  background: {
    paper: '#121212',
    default: '#121212'
  },
  action: {
    active: common$1.white,
    hover: 'rgba(255, 255, 255, 0.08)',
    hoverOpacity: 0.08,
    selected: 'rgba(255, 255, 255, 0.16)',
    selectedOpacity: 0.16,
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)',
    disabledOpacity: 0.38,
    focus: 'rgba(255, 255, 255, 0.12)',
    focusOpacity: 0.12,
    activatedOpacity: 0.24
  }
};
function addLightOrDark(intent, direction, shade, tonalOffset) {
  const tonalOffsetLight = tonalOffset.light || tonalOffset;
  const tonalOffsetDark = tonalOffset.dark || tonalOffset * 1.5;
  if (!intent[direction]) {
    if (intent.hasOwnProperty(shade)) {
      intent[direction] = intent[shade];
    } else if (direction === 'light') {
      intent.light = colorManipulatorExports.lighten(intent.main, tonalOffsetLight);
    } else if (direction === 'dark') {
      intent.dark = colorManipulatorExports.darken(intent.main, tonalOffsetDark);
    }
  }
}
function getDefaultPrimary(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: blue$1[200],
      light: blue$1[50],
      dark: blue$1[400]
    };
  }
  return {
    main: blue$1[700],
    light: blue$1[400],
    dark: blue$1[800]
  };
}
function getDefaultSecondary(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: purple$1[200],
      light: purple$1[50],
      dark: purple$1[400]
    };
  }
  return {
    main: purple$1[500],
    light: purple$1[300],
    dark: purple$1[700]
  };
}
function getDefaultError(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: red$1[500],
      light: red$1[300],
      dark: red$1[700]
    };
  }
  return {
    main: red$1[700],
    light: red$1[400],
    dark: red$1[800]
  };
}
function getDefaultInfo(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: lightBlue$1[400],
      light: lightBlue$1[300],
      dark: lightBlue$1[700]
    };
  }
  return {
    main: lightBlue$1[700],
    light: lightBlue$1[500],
    dark: lightBlue$1[900]
  };
}
function getDefaultSuccess(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: green$1[400],
      light: green$1[300],
      dark: green$1[700]
    };
  }
  return {
    main: green$1[800],
    light: green$1[500],
    dark: green$1[900]
  };
}
function getDefaultWarning(mode = 'light') {
  if (mode === 'dark') {
    return {
      main: orange$1[400],
      light: orange$1[300],
      dark: orange$1[700]
    };
  }
  return {
    main: '#ed6c02',
    // closest to orange[800] that pass 3:1.
    light: orange$1[500],
    dark: orange$1[900]
  };
}
function createPalette(palette) {
  const {
      mode = 'light',
      contrastThreshold = 3,
      tonalOffset = 0.2
    } = palette,
    other = _objectWithoutPropertiesLoose(palette, _excluded$s);
  const primary = palette.primary || getDefaultPrimary(mode);
  const secondary = palette.secondary || getDefaultSecondary(mode);
  const error = palette.error || getDefaultError(mode);
  const info = palette.info || getDefaultInfo(mode);
  const success = palette.success || getDefaultSuccess(mode);
  const warning = palette.warning || getDefaultWarning(mode);

  // Use the same logic as
  // Bootstrap: https://github.com/twbs/bootstrap/blob/1d6e3710dd447de1a200f29e8fa521f8a0908f70/scss/_functions.scss#L59
  // and material-components-web https://github.com/material-components/material-components-web/blob/ac46b8863c4dab9fc22c4c662dc6bd1b65dd652f/packages/mdc-theme/_functions.scss#L54
  function getContrastText(background) {
    const contrastText = colorManipulatorExports.getContrastRatio(background, dark.text.primary) >= contrastThreshold ? dark.text.primary : light.text.primary;
    if (process.env.NODE_ENV !== 'production') {
      const contrast = colorManipulatorExports.getContrastRatio(background, contrastText);
      if (contrast < 3) {
        console.error([`MUI: The contrast ratio of ${contrast}:1 for ${contrastText} on ${background}`, 'falls below the WCAG recommended absolute minimum contrast ratio of 3:1.', 'https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast'].join('\n'));
      }
    }
    return contrastText;
  }
  const augmentColor = ({
    color,
    name,
    mainShade = 500,
    lightShade = 300,
    darkShade = 700
  }) => {
    color = _extends$2({}, color);
    if (!color.main && color[mainShade]) {
      color.main = color[mainShade];
    }
    if (!color.hasOwnProperty('main')) {
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${name ? ` (${name})` : ''} provided to augmentColor(color) is invalid.
The color object needs to have a \`main\` property or a \`${mainShade}\` property.` : formatMuiErrorMessage$1(11, name ? ` (${name})` : '', mainShade));
    }
    if (typeof color.main !== 'string') {
      throw new Error(process.env.NODE_ENV !== "production" ? `MUI: The color${name ? ` (${name})` : ''} provided to augmentColor(color) is invalid.
\`color.main\` should be a string, but \`${JSON.stringify(color.main)}\` was provided instead.

Did you intend to use one of the following approaches?

import { green } from "@mui/material/colors";

const theme1 = createTheme({ palette: {
  primary: green,
} });

const theme2 = createTheme({ palette: {
  primary: { main: green[500] },
} });` : formatMuiErrorMessage$1(12, name ? ` (${name})` : '', JSON.stringify(color.main)));
    }
    addLightOrDark(color, 'light', lightShade, tonalOffset);
    addLightOrDark(color, 'dark', darkShade, tonalOffset);
    if (!color.contrastText) {
      color.contrastText = getContrastText(color.main);
    }
    return color;
  };
  const modes = {
    dark,
    light
  };
  if (process.env.NODE_ENV !== 'production') {
    if (!modes[mode]) {
      console.error(`MUI: The palette mode \`${mode}\` is not supported.`);
    }
  }
  const paletteOutput = deepmerge$1(_extends$2({
    // A collection of common colors.
    common: _extends$2({}, common$1),
    // prevent mutable object.
    // The palette mode, can be light or dark.
    mode,
    // The colors used to represent primary interface elements for a user.
    primary: augmentColor({
      color: primary,
      name: 'primary'
    }),
    // The colors used to represent secondary interface elements for a user.
    secondary: augmentColor({
      color: secondary,
      name: 'secondary',
      mainShade: 'A400',
      lightShade: 'A200',
      darkShade: 'A700'
    }),
    // The colors used to represent interface elements that the user should be made aware of.
    error: augmentColor({
      color: error,
      name: 'error'
    }),
    // The colors used to represent potentially dangerous actions or important messages.
    warning: augmentColor({
      color: warning,
      name: 'warning'
    }),
    // The colors used to present information to the user that is neutral and not necessarily important.
    info: augmentColor({
      color: info,
      name: 'info'
    }),
    // The colors used to indicate the successful completion of an action that user triggered.
    success: augmentColor({
      color: success,
      name: 'success'
    }),
    // The grey colors.
    grey: grey$1,
    // Used by `getContrastText()` to maximize the contrast between
    // the background and the text.
    contrastThreshold,
    // Takes a background color and returns the text color that maximizes the contrast.
    getContrastText,
    // Generate a rich color object.
    augmentColor,
    // Used by the functions below to shift a color's luminance by approximately
    // two indexes within its tonal palette.
    // E.g., shift from Red 500 to Red 300 or Red 700.
    tonalOffset
  }, modes[mode]), other);
  return paletteOutput;
}

const _excluded$r = ["fontFamily", "fontSize", "fontWeightLight", "fontWeightRegular", "fontWeightMedium", "fontWeightBold", "htmlFontSize", "allVariants", "pxToRem"];
function round(value) {
  return Math.round(value * 1e5) / 1e5;
}
const caseAllCaps = {
  textTransform: 'uppercase'
};
const defaultFontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';

/**
 * @see @link{https://m2.material.io/design/typography/the-type-system.html}
 * @see @link{https://m2.material.io/design/typography/understanding-typography.html}
 */
function createTypography(palette, typography) {
  const _ref = typeof typography === 'function' ? typography(palette) : typography,
    {
      fontFamily = defaultFontFamily,
      // The default font size of the Material Specification.
      fontSize = 14,
      // px
      fontWeightLight = 300,
      fontWeightRegular = 400,
      fontWeightMedium = 500,
      fontWeightBold = 700,
      // Tell MUI what's the font-size on the html element.
      // 16px is the default font-size used by browsers.
      htmlFontSize = 16,
      // Apply the CSS properties to all the variants.
      allVariants,
      pxToRem: pxToRem2
    } = _ref,
    other = _objectWithoutPropertiesLoose(_ref, _excluded$r);
  if (process.env.NODE_ENV !== 'production') {
    if (typeof fontSize !== 'number') {
      console.error('MUI: `fontSize` is required to be a number.');
    }
    if (typeof htmlFontSize !== 'number') {
      console.error('MUI: `htmlFontSize` is required to be a number.');
    }
  }
  const coef = fontSize / 14;
  const pxToRem = pxToRem2 || (size => `${size / htmlFontSize * coef}rem`);
  const buildVariant = (fontWeight, size, lineHeight, letterSpacing, casing) => _extends$2({
    fontFamily,
    fontWeight,
    fontSize: pxToRem(size),
    // Unitless following https://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/
    lineHeight
  }, fontFamily === defaultFontFamily ? {
    letterSpacing: `${round(letterSpacing / size)}em`
  } : {}, casing, allVariants);
  const variants = {
    h1: buildVariant(fontWeightLight, 96, 1.167, -1.5),
    h2: buildVariant(fontWeightLight, 60, 1.2, -0.5),
    h3: buildVariant(fontWeightRegular, 48, 1.167, 0),
    h4: buildVariant(fontWeightRegular, 34, 1.235, 0.25),
    h5: buildVariant(fontWeightRegular, 24, 1.334, 0),
    h6: buildVariant(fontWeightMedium, 20, 1.6, 0.15),
    subtitle1: buildVariant(fontWeightRegular, 16, 1.75, 0.15),
    subtitle2: buildVariant(fontWeightMedium, 14, 1.57, 0.1),
    body1: buildVariant(fontWeightRegular, 16, 1.5, 0.15),
    body2: buildVariant(fontWeightRegular, 14, 1.43, 0.15),
    button: buildVariant(fontWeightMedium, 14, 1.75, 0.4, caseAllCaps),
    caption: buildVariant(fontWeightRegular, 12, 1.66, 0.4),
    overline: buildVariant(fontWeightRegular, 12, 2.66, 1, caseAllCaps),
    // TODO v6: Remove handling of 'inherit' variant from the theme as it is already handled in Material UI's Typography component. Also, remember to remove the associated types.
    inherit: {
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      letterSpacing: 'inherit'
    }
  };
  return deepmerge$1(_extends$2({
    htmlFontSize,
    pxToRem,
    fontFamily,
    fontSize,
    fontWeightLight,
    fontWeightRegular,
    fontWeightMedium,
    fontWeightBold
  }, variants), other, {
    clone: false // No need to clone deep
  });
}

const shadowKeyUmbraOpacity = 0.2;
const shadowKeyPenumbraOpacity = 0.14;
const shadowAmbientShadowOpacity = 0.12;
function createShadow(...px) {
  return [`${px[0]}px ${px[1]}px ${px[2]}px ${px[3]}px rgba(0,0,0,${shadowKeyUmbraOpacity})`, `${px[4]}px ${px[5]}px ${px[6]}px ${px[7]}px rgba(0,0,0,${shadowKeyPenumbraOpacity})`, `${px[8]}px ${px[9]}px ${px[10]}px ${px[11]}px rgba(0,0,0,${shadowAmbientShadowOpacity})`].join(',');
}

// Values from https://github.com/material-components/material-components-web/blob/be8747f94574669cb5e7add1a7c54fa41a89cec7/packages/mdc-elevation/_variables.scss
const shadows = ['none', createShadow(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0), createShadow(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0), createShadow(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0), createShadow(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0), createShadow(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0), createShadow(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0), createShadow(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1), createShadow(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2), createShadow(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2), createShadow(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3), createShadow(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3), createShadow(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4), createShadow(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4), createShadow(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4), createShadow(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5), createShadow(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5), createShadow(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5), createShadow(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6), createShadow(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6), createShadow(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7), createShadow(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7), createShadow(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7), createShadow(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8), createShadow(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8)];
var shadows$1 = shadows;

const _excluded$q = ["duration", "easing", "delay"];
// Follow https://material.google.com/motion/duration-easing.html#duration-easing-natural-easing-curves
// to learn the context in which each easing should be used.
const easing = {
  // This is the most common easing curve.
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Objects enter the screen at full velocity from off-screen and
  // slowly decelerate to a resting point.
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  // Objects leave the screen at full velocity. They do not decelerate when off-screen.
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  // The sharp curve is used by objects that may return to the screen at any time.
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
};

// Follow https://m2.material.io/guidelines/motion/duration-easing.html#duration-easing-common-durations
// to learn when use what timing
const duration = {
  shortest: 150,
  shorter: 200,
  short: 250,
  // most basic recommended timing
  standard: 300,
  // this is to be used in complex animations
  complex: 375,
  // recommended when something is entering screen
  enteringScreen: 225,
  // recommended when something is leaving screen
  leavingScreen: 195
};
function formatMs(milliseconds) {
  return `${Math.round(milliseconds)}ms`;
}
function getAutoHeightDuration(height) {
  if (!height) {
    return 0;
  }
  const constant = height / 36;

  // https://www.wolframalpha.com/input/?i=(4+%2B+15+*+(x+%2F+36+)+**+0.25+%2B+(x+%2F+36)+%2F+5)+*+10
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
}
function createTransitions(inputTransitions) {
  const mergedEasing = _extends$2({}, easing, inputTransitions.easing);
  const mergedDuration = _extends$2({}, duration, inputTransitions.duration);
  const create = (props = ['all'], options = {}) => {
    const {
        duration: durationOption = mergedDuration.standard,
        easing: easingOption = mergedEasing.easeInOut,
        delay = 0
      } = options,
      other = _objectWithoutPropertiesLoose(options, _excluded$q);
    if (process.env.NODE_ENV !== 'production') {
      const isString = value => typeof value === 'string';
      // IE11 support, replace with Number.isNaN
      // eslint-disable-next-line no-restricted-globals
      const isNumber = value => !isNaN(parseFloat(value));
      if (!isString(props) && !Array.isArray(props)) {
        console.error('MUI: Argument "props" must be a string or Array.');
      }
      if (!isNumber(durationOption) && !isString(durationOption)) {
        console.error(`MUI: Argument "duration" must be a number or a string but found ${durationOption}.`);
      }
      if (!isString(easingOption)) {
        console.error('MUI: Argument "easing" must be a string.');
      }
      if (!isNumber(delay) && !isString(delay)) {
        console.error('MUI: Argument "delay" must be a number or a string.');
      }
      if (typeof options !== 'object') {
        console.error(['MUI: Secong argument of transition.create must be an object.', "Arguments should be either `create('prop1', options)` or `create(['prop1', 'prop2'], options)`"].join('\n'));
      }
      if (Object.keys(other).length !== 0) {
        console.error(`MUI: Unrecognized argument(s) [${Object.keys(other).join(',')}].`);
      }
    }
    return (Array.isArray(props) ? props : [props]).map(animatedProp => `${animatedProp} ${typeof durationOption === 'string' ? durationOption : formatMs(durationOption)} ${easingOption} ${typeof delay === 'string' ? delay : formatMs(delay)}`).join(',');
  };
  return _extends$2({
    getAutoHeightDuration,
    create
  }, inputTransitions, {
    easing: mergedEasing,
    duration: mergedDuration
  });
}

// We need to centralize the zIndex definitions as they work
// like global values in the browser.
const zIndex = {
  mobileStepper: 1000,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
};
var zIndex$1 = zIndex;

const _excluded$p = ["breakpoints", "mixins", "spacing", "palette", "transitions", "typography", "shape"];
function createTheme(options = {}, ...args) {
  const {
      mixins: mixinsInput = {},
      palette: paletteInput = {},
      transitions: transitionsInput = {},
      typography: typographyInput = {}
    } = options,
    other = _objectWithoutPropertiesLoose(options, _excluded$p);
  if (options.vars &&
  // The error should throw only for the root theme creation because user is not allowed to use a custom node `vars`.
  // `generateCssVars` is the closest identifier for checking that the `options` is a result of `extendTheme` with CSS variables so that user can create new theme for nested ThemeProvider.
  options.generateCssVars === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? `MUI: \`vars\` is a private field used for CSS variables support.
Please use another name.` : formatMuiErrorMessage$1(18));
  }
  const palette = createPalette(paletteInput);
  const systemTheme = createTheme$2(options);
  let muiTheme = deepmerge$1(systemTheme, {
    mixins: createMixins(systemTheme.breakpoints, mixinsInput),
    palette,
    // Don't use [...shadows] until you've verified its transpiled code is not invoking the iterator protocol.
    shadows: shadows$1.slice(),
    typography: createTypography(palette, typographyInput),
    transitions: createTransitions(transitionsInput),
    zIndex: _extends$2({}, zIndex$1)
  });
  muiTheme = deepmerge$1(muiTheme, other);
  muiTheme = args.reduce((acc, argument) => deepmerge$1(acc, argument), muiTheme);
  if (process.env.NODE_ENV !== 'production') {
    // TODO v6: Refactor to use globalStateClassesMapping from @mui/utils once `readOnly` state class is used in Rating component.
    const stateClasses = ['active', 'checked', 'completed', 'disabled', 'error', 'expanded', 'focused', 'focusVisible', 'required', 'selected'];
    const traverse = (node, component) => {
      let key;

      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (key in node) {
        const child = node[key];
        if (stateClasses.indexOf(key) !== -1 && Object.keys(child).length > 0) {
          if (process.env.NODE_ENV !== 'production') {
            const stateClass = generateUtilityClass('', key);
            console.error([`MUI: The \`${component}\` component increases ` + `the CSS specificity of the \`${key}\` internal state.`, 'You can not override it like this: ', JSON.stringify(node, null, 2), '', `Instead, you need to use the '&.${stateClass}' syntax:`, JSON.stringify({
              root: {
                [`&.${stateClass}`]: child
              }
            }, null, 2), '', 'https://mui.com/r/state-classes-guide'].join('\n'));
          }
          // Remove the style to prevent global conflicts.
          node[key] = {};
        }
      }
    };
    Object.keys(muiTheme.components).forEach(component => {
      const styleOverrides = muiTheme.components[component].styleOverrides;
      if (styleOverrides && component.indexOf('Mui') === 0) {
        traverse(styleOverrides, component);
      }
    });
  }
  muiTheme.unstable_sxConfig = _extends$2({}, defaultSxConfig$1, other == null ? void 0 : other.unstable_sxConfig);
  muiTheme.unstable_sx = function sx(props) {
    return styleFunctionSx$2({
      sx: props,
      theme: this
    });
  };
  return muiTheme;
}

const defaultTheme$1 = createTheme();
var defaultTheme$2 = defaultTheme$1;

var THEME_ID = '$$material';

var createStyled$2 = {};

var _extends = {exports: {}};

_extends.exports;

var hasRequired_extends;

function require_extends () {
	if (hasRequired_extends) return _extends.exports;
	hasRequired_extends = 1;
	(function (module) {
		function _extends() {
		  return module.exports = _extends = Object.assign ? Object.assign.bind() : function (n) {
		    for (var e = 1; e < arguments.length; e++) {
		      var t = arguments[e];
		      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
		    }
		    return n;
		  }, module.exports.__esModule = true, module.exports["default"] = module.exports, _extends.apply(null, arguments);
		}
		module.exports = _extends, module.exports.__esModule = true, module.exports["default"] = module.exports; 
	} (_extends));
	return _extends.exports;
}

var objectWithoutPropertiesLoose = {exports: {}};

objectWithoutPropertiesLoose.exports;

var hasRequiredObjectWithoutPropertiesLoose;

function requireObjectWithoutPropertiesLoose () {
	if (hasRequiredObjectWithoutPropertiesLoose) return objectWithoutPropertiesLoose.exports;
	hasRequiredObjectWithoutPropertiesLoose = 1;
	(function (module) {
		function _objectWithoutPropertiesLoose(r, e) {
		  if (null == r) return {};
		  var t = {};
		  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
		    if (-1 !== e.indexOf(n)) continue;
		    t[n] = r[n];
		  }
		  return t;
		}
		module.exports = _objectWithoutPropertiesLoose, module.exports.__esModule = true, module.exports["default"] = module.exports; 
	} (objectWithoutPropertiesLoose));
	return objectWithoutPropertiesLoose.exports;
}

var require$$3 = /*@__PURE__*/getAugmentedNamespace(styledEngine);

var require$$4 = /*@__PURE__*/getAugmentedNamespace(deepmerge);

var require$$5 = /*@__PURE__*/getAugmentedNamespace(capitalize);

var reactIs = {exports: {}};

var reactIs_production = {};

/**
 * @license React
 * react-is.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_production;

function requireReactIs_production () {
	if (hasRequiredReactIs_production) return reactIs_production;
	hasRequiredReactIs_production = 1;
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
	  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
	  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
	  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
	  REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
	  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
	  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
	  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
	  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
	  REACT_MEMO_TYPE = Symbol.for("react.memo"),
	  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
	  REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"),
	  REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
	function typeOf(object) {
	  if ("object" === typeof object && null !== object) {
	    var $$typeof = object.$$typeof;
	    switch ($$typeof) {
	      case REACT_ELEMENT_TYPE:
	        switch (((object = object.type), object)) {
	          case REACT_FRAGMENT_TYPE:
	          case REACT_PROFILER_TYPE:
	          case REACT_STRICT_MODE_TYPE:
	          case REACT_SUSPENSE_TYPE:
	          case REACT_SUSPENSE_LIST_TYPE:
	          case REACT_VIEW_TRANSITION_TYPE:
	            return object;
	          default:
	            switch (((object = object && object.$$typeof), object)) {
	              case REACT_CONTEXT_TYPE:
	              case REACT_FORWARD_REF_TYPE:
	              case REACT_LAZY_TYPE:
	              case REACT_MEMO_TYPE:
	                return object;
	              case REACT_CONSUMER_TYPE:
	                return object;
	              default:
	                return $$typeof;
	            }
	        }
	      case REACT_PORTAL_TYPE:
	        return $$typeof;
	    }
	  }
	}
	reactIs_production.ContextConsumer = REACT_CONSUMER_TYPE;
	reactIs_production.ContextProvider = REACT_CONTEXT_TYPE;
	reactIs_production.Element = REACT_ELEMENT_TYPE;
	reactIs_production.ForwardRef = REACT_FORWARD_REF_TYPE;
	reactIs_production.Fragment = REACT_FRAGMENT_TYPE;
	reactIs_production.Lazy = REACT_LAZY_TYPE;
	reactIs_production.Memo = REACT_MEMO_TYPE;
	reactIs_production.Portal = REACT_PORTAL_TYPE;
	reactIs_production.Profiler = REACT_PROFILER_TYPE;
	reactIs_production.StrictMode = REACT_STRICT_MODE_TYPE;
	reactIs_production.Suspense = REACT_SUSPENSE_TYPE;
	reactIs_production.SuspenseList = REACT_SUSPENSE_LIST_TYPE;
	reactIs_production.isContextConsumer = function (object) {
	  return typeOf(object) === REACT_CONSUMER_TYPE;
	};
	reactIs_production.isContextProvider = function (object) {
	  return typeOf(object) === REACT_CONTEXT_TYPE;
	};
	reactIs_production.isElement = function (object) {
	  return (
	    "object" === typeof object &&
	    null !== object &&
	    object.$$typeof === REACT_ELEMENT_TYPE
	  );
	};
	reactIs_production.isForwardRef = function (object) {
	  return typeOf(object) === REACT_FORWARD_REF_TYPE;
	};
	reactIs_production.isFragment = function (object) {
	  return typeOf(object) === REACT_FRAGMENT_TYPE;
	};
	reactIs_production.isLazy = function (object) {
	  return typeOf(object) === REACT_LAZY_TYPE;
	};
	reactIs_production.isMemo = function (object) {
	  return typeOf(object) === REACT_MEMO_TYPE;
	};
	reactIs_production.isPortal = function (object) {
	  return typeOf(object) === REACT_PORTAL_TYPE;
	};
	reactIs_production.isProfiler = function (object) {
	  return typeOf(object) === REACT_PROFILER_TYPE;
	};
	reactIs_production.isStrictMode = function (object) {
	  return typeOf(object) === REACT_STRICT_MODE_TYPE;
	};
	reactIs_production.isSuspense = function (object) {
	  return typeOf(object) === REACT_SUSPENSE_TYPE;
	};
	reactIs_production.isSuspenseList = function (object) {
	  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
	};
	reactIs_production.isValidElementType = function (type) {
	  return "string" === typeof type ||
	    "function" === typeof type ||
	    type === REACT_FRAGMENT_TYPE ||
	    type === REACT_PROFILER_TYPE ||
	    type === REACT_STRICT_MODE_TYPE ||
	    type === REACT_SUSPENSE_TYPE ||
	    type === REACT_SUSPENSE_LIST_TYPE ||
	    ("object" === typeof type &&
	      null !== type &&
	      (type.$$typeof === REACT_LAZY_TYPE ||
	        type.$$typeof === REACT_MEMO_TYPE ||
	        type.$$typeof === REACT_CONTEXT_TYPE ||
	        type.$$typeof === REACT_CONSUMER_TYPE ||
	        type.$$typeof === REACT_FORWARD_REF_TYPE ||
	        type.$$typeof === REACT_CLIENT_REFERENCE ||
	        void 0 !== type.getModuleId))
	    ? !0
	    : !1;
	};
	reactIs_production.typeOf = typeOf;
	return reactIs_production;
}

var reactIs_development = {};

/**
 * @license React
 * react-is.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactIs_development;

function requireReactIs_development () {
	if (hasRequiredReactIs_development) return reactIs_development;
	hasRequiredReactIs_development = 1;
	"production" !== process.env.NODE_ENV &&
	  (function () {
	    function typeOf(object) {
	      if ("object" === typeof object && null !== object) {
	        var $$typeof = object.$$typeof;
	        switch ($$typeof) {
	          case REACT_ELEMENT_TYPE:
	            switch (((object = object.type), object)) {
	              case REACT_FRAGMENT_TYPE:
	              case REACT_PROFILER_TYPE:
	              case REACT_STRICT_MODE_TYPE:
	              case REACT_SUSPENSE_TYPE:
	              case REACT_SUSPENSE_LIST_TYPE:
	              case REACT_VIEW_TRANSITION_TYPE:
	                return object;
	              default:
	                switch (((object = object && object.$$typeof), object)) {
	                  case REACT_CONTEXT_TYPE:
	                  case REACT_FORWARD_REF_TYPE:
	                  case REACT_LAZY_TYPE:
	                  case REACT_MEMO_TYPE:
	                    return object;
	                  case REACT_CONSUMER_TYPE:
	                    return object;
	                  default:
	                    return $$typeof;
	                }
	            }
	          case REACT_PORTAL_TYPE:
	            return $$typeof;
	        }
	      }
	    }
	    var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	      REACT_PORTAL_TYPE = Symbol.for("react.portal"),
	      REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
	      REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
	      REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
	      REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
	      REACT_CONTEXT_TYPE = Symbol.for("react.context"),
	      REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
	      REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
	      REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
	      REACT_MEMO_TYPE = Symbol.for("react.memo"),
	      REACT_LAZY_TYPE = Symbol.for("react.lazy"),
	      REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"),
	      REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
	    reactIs_development.ContextConsumer = REACT_CONSUMER_TYPE;
	    reactIs_development.ContextProvider = REACT_CONTEXT_TYPE;
	    reactIs_development.Element = REACT_ELEMENT_TYPE;
	    reactIs_development.ForwardRef = REACT_FORWARD_REF_TYPE;
	    reactIs_development.Fragment = REACT_FRAGMENT_TYPE;
	    reactIs_development.Lazy = REACT_LAZY_TYPE;
	    reactIs_development.Memo = REACT_MEMO_TYPE;
	    reactIs_development.Portal = REACT_PORTAL_TYPE;
	    reactIs_development.Profiler = REACT_PROFILER_TYPE;
	    reactIs_development.StrictMode = REACT_STRICT_MODE_TYPE;
	    reactIs_development.Suspense = REACT_SUSPENSE_TYPE;
	    reactIs_development.SuspenseList = REACT_SUSPENSE_LIST_TYPE;
	    reactIs_development.isContextConsumer = function (object) {
	      return typeOf(object) === REACT_CONSUMER_TYPE;
	    };
	    reactIs_development.isContextProvider = function (object) {
	      return typeOf(object) === REACT_CONTEXT_TYPE;
	    };
	    reactIs_development.isElement = function (object) {
	      return (
	        "object" === typeof object &&
	        null !== object &&
	        object.$$typeof === REACT_ELEMENT_TYPE
	      );
	    };
	    reactIs_development.isForwardRef = function (object) {
	      return typeOf(object) === REACT_FORWARD_REF_TYPE;
	    };
	    reactIs_development.isFragment = function (object) {
	      return typeOf(object) === REACT_FRAGMENT_TYPE;
	    };
	    reactIs_development.isLazy = function (object) {
	      return typeOf(object) === REACT_LAZY_TYPE;
	    };
	    reactIs_development.isMemo = function (object) {
	      return typeOf(object) === REACT_MEMO_TYPE;
	    };
	    reactIs_development.isPortal = function (object) {
	      return typeOf(object) === REACT_PORTAL_TYPE;
	    };
	    reactIs_development.isProfiler = function (object) {
	      return typeOf(object) === REACT_PROFILER_TYPE;
	    };
	    reactIs_development.isStrictMode = function (object) {
	      return typeOf(object) === REACT_STRICT_MODE_TYPE;
	    };
	    reactIs_development.isSuspense = function (object) {
	      return typeOf(object) === REACT_SUSPENSE_TYPE;
	    };
	    reactIs_development.isSuspenseList = function (object) {
	      return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
	    };
	    reactIs_development.isValidElementType = function (type) {
	      return "string" === typeof type ||
	        "function" === typeof type ||
	        type === REACT_FRAGMENT_TYPE ||
	        type === REACT_PROFILER_TYPE ||
	        type === REACT_STRICT_MODE_TYPE ||
	        type === REACT_SUSPENSE_TYPE ||
	        type === REACT_SUSPENSE_LIST_TYPE ||
	        ("object" === typeof type &&
	          null !== type &&
	          (type.$$typeof === REACT_LAZY_TYPE ||
	            type.$$typeof === REACT_MEMO_TYPE ||
	            type.$$typeof === REACT_CONTEXT_TYPE ||
	            type.$$typeof === REACT_CONSUMER_TYPE ||
	            type.$$typeof === REACT_FORWARD_REF_TYPE ||
	            type.$$typeof === REACT_CLIENT_REFERENCE ||
	            void 0 !== type.getModuleId))
	        ? !0
	        : !1;
	    };
	    reactIs_development.typeOf = typeOf;
	  })();
	return reactIs_development;
}

var hasRequiredReactIs;

function requireReactIs () {
	if (hasRequiredReactIs) return reactIs.exports;
	hasRequiredReactIs = 1;

	if (process.env.NODE_ENV === 'production') {
	  reactIs.exports = /*@__PURE__*/ requireReactIs_production();
	} else {
	  reactIs.exports = /*@__PURE__*/ requireReactIs_development();
	}
	return reactIs.exports;
}

var reactIsExports = /*@__PURE__*/ requireReactIs();

// Simplified polyfill for IE11 support
// https://github.com/JamesMGreene/Function.name/blob/58b314d4a983110c3682f1228f845d39ccca1817/Function.name.js#L3
const fnNameMatchRegex = /^\s*function(?:\s|\s*\/\*.*\*\/\s*)+([^(\s/]*)\s*/;
function getFunctionName(fn) {
  const match = `${fn}`.match(fnNameMatchRegex);
  const name = match && match[1];
  return name || '';
}
function getFunctionComponentName(Component, fallback = '') {
  return Component.displayName || Component.name || getFunctionName(Component) || fallback;
}
function getWrappedName(outerType, innerType, wrapperName) {
  const functionName = getFunctionComponentName(innerType);
  return outerType.displayName || (functionName !== '' ? `${wrapperName}(${functionName})` : wrapperName);
}

/**
 * cherry-pick from
 * https://github.com/facebook/react/blob/769b1f270e1251d9dbdce0fcbd9e92e502d059b8/packages/shared/getComponentName.js
 * originally forked from recompose/getDisplayName with added IE11 support
 */
function getDisplayName$1(Component) {
  if (Component == null) {
    return undefined;
  }
  if (typeof Component === 'string') {
    return Component;
  }
  if (typeof Component === 'function') {
    return getFunctionComponentName(Component, 'Component');
  }

  // TypeScript can't have components as objects but they exist in the form of `memo` or `Suspense`
  if (typeof Component === 'object') {
    switch (Component.$$typeof) {
      case reactIsExports.ForwardRef:
        return getWrappedName(Component, Component.render, 'ForwardRef');
      case reactIsExports.Memo:
        return getWrappedName(Component, Component.type, 'memo');
      default:
        return undefined;
    }
  }
  return undefined;
}

var getDisplayName = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': getDisplayName$1,
  getFunctionName: getFunctionName
});

var require$$6 = /*@__PURE__*/getAugmentedNamespace(getDisplayName);

var require$$7 = /*@__PURE__*/getAugmentedNamespace(createTheme$1);

var require$$8 = /*@__PURE__*/getAugmentedNamespace(styleFunctionSx);

var hasRequiredCreateStyled;

function requireCreateStyled () {
	if (hasRequiredCreateStyled) return createStyled$2;
	hasRequiredCreateStyled = 1;

	var _interopRequireDefault = requireInteropRequireDefault();
	Object.defineProperty(createStyled$2, "__esModule", {
	  value: true
	});
	createStyled$2.default = createStyled;
	createStyled$2.shouldForwardProp = shouldForwardProp;
	createStyled$2.systemDefaultTheme = void 0;
	var _extends2 = _interopRequireDefault(require_extends());
	var _objectWithoutPropertiesLoose2 = _interopRequireDefault(requireObjectWithoutPropertiesLoose());
	var _styledEngine = _interopRequireWildcard(require$$3);
	var _deepmerge = require$$4;
	var _capitalize = _interopRequireDefault(require$$5);
	var _getDisplayName = _interopRequireDefault(require$$6);
	var _createTheme = _interopRequireDefault(require$$7);
	var _styleFunctionSx = _interopRequireDefault(require$$8);
	const _excluded = ["ownerState"],
	  _excluded2 = ["variants"],
	  _excluded3 = ["name", "slot", "skipVariantsResolver", "skipSx", "overridesResolver"];
	/* eslint-disable no-underscore-dangle */
	function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
	function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
	function isEmpty(obj) {
	  return Object.keys(obj).length === 0;
	}

	// https://github.com/emotion-js/emotion/blob/26ded6109fcd8ca9875cc2ce4564fee678a3f3c5/packages/styled/src/utils.js#L40
	function isStringTag(tag) {
	  return typeof tag === 'string' &&
	  // 96 is one less than the char code
	  // for "a" so this is checking that
	  // it's a lowercase character
	  tag.charCodeAt(0) > 96;
	}

	// Update /system/styled/#api in case if this changes
	function shouldForwardProp(prop) {
	  return prop !== 'ownerState' && prop !== 'theme' && prop !== 'sx' && prop !== 'as';
	}
	function shallowLayer(serialized, layerName) {
	  if (layerName && serialized && typeof serialized === 'object' && serialized.styles && !serialized.styles.startsWith('@layer') // only add the layer if it is not already there.
	  ) {
	    serialized.styles = `@layer ${layerName}{${String(serialized.styles)}}`;
	  }
	  return serialized;
	}
	const systemDefaultTheme = createStyled$2.systemDefaultTheme = (0, _createTheme.default)();
	const lowercaseFirstLetter = string => {
	  if (!string) {
	    return string;
	  }
	  return string.charAt(0).toLowerCase() + string.slice(1);
	};
	function resolveTheme({
	  defaultTheme,
	  theme,
	  themeId
	}) {
	  return isEmpty(theme) ? defaultTheme : theme[themeId] || theme;
	}
	function defaultOverridesResolver(slot) {
	  if (!slot) {
	    return null;
	  }
	  return (props, styles) => styles[slot];
	}
	function processStyleArg(callableStyle, _ref, layerName) {
	  let {
	      ownerState
	    } = _ref,
	    props = (0, _objectWithoutPropertiesLoose2.default)(_ref, _excluded);
	  const resolvedStylesArg = typeof callableStyle === 'function' ? callableStyle((0, _extends2.default)({
	    ownerState
	  }, props)) : callableStyle;
	  if (Array.isArray(resolvedStylesArg)) {
	    return resolvedStylesArg.flatMap(resolvedStyle => processStyleArg(resolvedStyle, (0, _extends2.default)({
	      ownerState
	    }, props), layerName));
	  }
	  if (!!resolvedStylesArg && typeof resolvedStylesArg === 'object' && Array.isArray(resolvedStylesArg.variants)) {
	    const {
	        variants = []
	      } = resolvedStylesArg,
	      otherStyles = (0, _objectWithoutPropertiesLoose2.default)(resolvedStylesArg, _excluded2);
	    let result = otherStyles;
	    variants.forEach(variant => {
	      let isMatch = true;
	      if (typeof variant.props === 'function') {
	        isMatch = variant.props((0, _extends2.default)({
	          ownerState
	        }, props, ownerState));
	      } else {
	        Object.keys(variant.props).forEach(key => {
	          if ((ownerState == null ? void 0 : ownerState[key]) !== variant.props[key] && props[key] !== variant.props[key]) {
	            isMatch = false;
	          }
	        });
	      }
	      if (isMatch) {
	        if (!Array.isArray(result)) {
	          result = [result];
	        }
	        const variantStyle = typeof variant.style === 'function' ? variant.style((0, _extends2.default)({
	          ownerState
	        }, props, ownerState)) : variant.style;
	        result.push(layerName ? shallowLayer((0, _styledEngine.internal_serializeStyles)(variantStyle), layerName) : variantStyle);
	      }
	    });
	    return result;
	  }
	  return layerName ? shallowLayer((0, _styledEngine.internal_serializeStyles)(resolvedStylesArg), layerName) : resolvedStylesArg;
	}
	function createStyled(input = {}) {
	  const {
	    themeId,
	    defaultTheme = systemDefaultTheme,
	    rootShouldForwardProp = shouldForwardProp,
	    slotShouldForwardProp = shouldForwardProp
	  } = input;
	  const systemSx = props => {
	    return (0, _styleFunctionSx.default)((0, _extends2.default)({}, props, {
	      theme: resolveTheme((0, _extends2.default)({}, props, {
	        defaultTheme,
	        themeId
	      }))
	    }));
	  };
	  systemSx.__mui_systemSx = true;
	  return (tag, inputOptions = {}) => {
	    // Filter out the `sx` style function from the previous styled component to prevent unnecessary styles generated by the composite components.
	    (0, _styledEngine.internal_processStyles)(tag, styles => styles.filter(style => !(style != null && style.__mui_systemSx)));
	    const {
	        name: componentName,
	        slot: componentSlot,
	        skipVariantsResolver: inputSkipVariantsResolver,
	        skipSx: inputSkipSx,
	        // TODO v6: remove `lowercaseFirstLetter()` in the next major release
	        // For more details: https://github.com/mui/material-ui/pull/37908
	        overridesResolver = defaultOverridesResolver(lowercaseFirstLetter(componentSlot))
	      } = inputOptions,
	      options = (0, _objectWithoutPropertiesLoose2.default)(inputOptions, _excluded3);
	    const layerName = componentName && componentName.startsWith('Mui') || !!componentSlot ? 'components' : 'custom';

	    // if skipVariantsResolver option is defined, take the value, otherwise, true for root and false for other slots.
	    const skipVariantsResolver = inputSkipVariantsResolver !== undefined ? inputSkipVariantsResolver :
	    // TODO v6: remove `Root` in the next major release
	    // For more details: https://github.com/mui/material-ui/pull/37908
	    componentSlot && componentSlot !== 'Root' && componentSlot !== 'root' || false;
	    const skipSx = inputSkipSx || false;
	    let label;
	    if (process.env.NODE_ENV !== 'production') {
	      if (componentName) {
	        // TODO v6: remove `lowercaseFirstLetter()` in the next major release
	        // For more details: https://github.com/mui/material-ui/pull/37908
	        label = `${componentName}-${lowercaseFirstLetter(componentSlot || 'Root')}`;
	      }
	    }
	    let shouldForwardPropOption = shouldForwardProp;

	    // TODO v6: remove `Root` in the next major release
	    // For more details: https://github.com/mui/material-ui/pull/37908
	    if (componentSlot === 'Root' || componentSlot === 'root') {
	      shouldForwardPropOption = rootShouldForwardProp;
	    } else if (componentSlot) {
	      // any other slot specified
	      shouldForwardPropOption = slotShouldForwardProp;
	    } else if (isStringTag(tag)) {
	      // for string (html) tag, preserve the behavior in emotion & styled-components.
	      shouldForwardPropOption = undefined;
	    }
	    const defaultStyledResolver = (0, _styledEngine.default)(tag, (0, _extends2.default)({
	      shouldForwardProp: shouldForwardPropOption,
	      label
	    }, options));
	    const transformStyleArg = stylesArg => {
	      // On the server Emotion doesn't use React.forwardRef for creating components, so the created
	      // component stays as a function. This condition makes sure that we do not interpolate functions
	      // which are basically components used as a selectors.
	      if (typeof stylesArg === 'function' && stylesArg.__emotion_real !== stylesArg || (0, _deepmerge.isPlainObject)(stylesArg)) {
	        return props => {
	          const theme = resolveTheme({
	            theme: props.theme,
	            defaultTheme,
	            themeId
	          });
	          return processStyleArg(stylesArg, (0, _extends2.default)({}, props, {
	            theme
	          }), theme.modularCssLayers ? layerName : undefined);
	        };
	      }
	      return stylesArg;
	    };
	    const muiStyledResolver = (styleArg, ...expressions) => {
	      let transformedStyleArg = transformStyleArg(styleArg);
	      const expressionsWithDefaultTheme = expressions ? expressions.map(transformStyleArg) : [];
	      if (componentName && overridesResolver) {
	        expressionsWithDefaultTheme.push(props => {
	          const theme = resolveTheme((0, _extends2.default)({}, props, {
	            defaultTheme,
	            themeId
	          }));
	          if (!theme.components || !theme.components[componentName] || !theme.components[componentName].styleOverrides) {
	            return null;
	          }
	          const styleOverrides = theme.components[componentName].styleOverrides;
	          const resolvedStyleOverrides = {};
	          // TODO: v7 remove iteration and use `resolveStyleArg(styleOverrides[slot])` directly
	          Object.entries(styleOverrides).forEach(([slotKey, slotStyle]) => {
	            resolvedStyleOverrides[slotKey] = processStyleArg(slotStyle, (0, _extends2.default)({}, props, {
	              theme
	            }), theme.modularCssLayers ? 'theme' : undefined);
	          });
	          return overridesResolver(props, resolvedStyleOverrides);
	        });
	      }
	      if (componentName && !skipVariantsResolver) {
	        expressionsWithDefaultTheme.push(props => {
	          var _theme$components;
	          const theme = resolveTheme((0, _extends2.default)({}, props, {
	            defaultTheme,
	            themeId
	          }));
	          const themeVariants = theme == null || (_theme$components = theme.components) == null || (_theme$components = _theme$components[componentName]) == null ? void 0 : _theme$components.variants;
	          return processStyleArg({
	            variants: themeVariants
	          }, (0, _extends2.default)({}, props, {
	            theme
	          }), theme.modularCssLayers ? 'theme' : undefined);
	        });
	      }
	      if (!skipSx) {
	        expressionsWithDefaultTheme.push(systemSx);
	      }
	      const numOfCustomFnsApplied = expressionsWithDefaultTheme.length - expressions.length;
	      if (Array.isArray(styleArg) && numOfCustomFnsApplied > 0) {
	        const placeholders = new Array(numOfCustomFnsApplied).fill('');
	        // If the type is array, than we need to add placeholders in the template for the overrides, variants and the sx styles.
	        transformedStyleArg = [...styleArg, ...placeholders];
	        transformedStyleArg.raw = [...styleArg.raw, ...placeholders];
	      }
	      const Component = defaultStyledResolver(transformedStyleArg, ...expressionsWithDefaultTheme);
	      if (process.env.NODE_ENV !== 'production') {
	        let displayName;
	        if (componentName) {
	          displayName = `${componentName}${(0, _capitalize.default)(componentSlot || '')}`;
	        }
	        if (displayName === undefined) {
	          displayName = `Styled(${(0, _getDisplayName.default)(tag)})`;
	        }
	        Component.displayName = displayName;
	      }
	      if (tag.muiName) {
	        Component.muiName = tag.muiName;
	      }
	      return Component;
	    };
	    if (defaultStyledResolver.withConfig) {
	      muiStyledResolver.withConfig = defaultStyledResolver.withConfig;
	    }
	    return muiStyledResolver;
	  };
	}
	return createStyled$2;
}

var createStyledExports = /*@__PURE__*/ requireCreateStyled();
var createStyled$1 = /*@__PURE__*/getDefaultExportFromCjs(createStyledExports);

// copied from @mui/system/createStyled
function slotShouldForwardProp(prop) {
  return prop !== 'ownerState' && prop !== 'theme' && prop !== 'sx' && prop !== 'as';
}

const rootShouldForwardProp = prop => slotShouldForwardProp(prop) && prop !== 'classes';
var rootShouldForwardProp$1 = rootShouldForwardProp;

const styled$2 = createStyled$1({
  themeId: THEME_ID,
  defaultTheme: defaultTheme$2,
  rootShouldForwardProp: rootShouldForwardProp$1
});
var styled$3 = styled$2;

const PropsContext = /*#__PURE__*/React.createContext(undefined);
process.env.NODE_ENV !== "production" ? {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  value: PropTypes.object
} : void 0;
function getThemeProps(params) {
  const {
    theme,
    name,
    props
  } = params;
  if (!theme || !theme.components || !theme.components[name]) {
    return props;
  }
  const config = theme.components[name];
  if (config.defaultProps) {
    // compatible with v5 signature
    return resolveProps(config.defaultProps, props);
  }
  if (!config.styleOverrides && !config.variants) {
    // v6 signature, no property 'defaultProps'
    return resolveProps(config, props);
  }
  return props;
}
function useDefaultProps$1({
  props,
  name
}) {
  const ctx = React.useContext(PropsContext);
  return getThemeProps({
    props,
    name,
    theme: {
      components: ctx
    }
  });
}

process.env.NODE_ENV !== "production" ? {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  value: PropTypes.object.isRequired
} : void 0;
function useDefaultProps(params) {
  return useDefaultProps$1(params);
}

/**
 * TODO v5: consider making it private
 *
 * passes {value} to {ref}
 *
 * WARNING: Be sure to only call this inside a callback that is passed as a ref.
 * Otherwise, make sure to cleanup the previous {ref} if it changes. See
 * https://github.com/mui/material-ui/issues/13539
 *
 * Useful if you want to expose the ref of an inner component to the public API
 * while still using it inside the component.
 * @param ref A ref callback or ref object. If anything falsy, this is a no-op.
 */
function setRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function useForkRef(...refs) {
  /**
   * This will create a new function if the refs passed to this hook change and are all defined.
   * This means react will call the old forkRef with `null` and the new forkRef
   * with the ref. Cleanup naturally emerges from this behavior.
   */
  return React.useMemo(() => {
    if (refs.every(ref => ref == null)) {
      return null;
    }
    return instance => {
      refs.forEach(ref => {
        setRef(ref, instance);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}

/**
 * Determines if a given element is a DOM element name (i.e. not a React component).
 */
function isHostComponent(element) {
  return typeof element === 'string';
}

/**
 * Type of the ownerState based on the type of an element it applies to.
 * This resolves to the provided OwnerState for React components and `undefined` for host components.
 * Falls back to `OwnerState | undefined` when the exact type can't be determined in development time.
 */

/**
 * Appends the ownerState object to the props, merging with the existing one if necessary.
 *
 * @param elementType Type of the element that owns the `existingProps`. If the element is a DOM node or undefined, `ownerState` is not applied.
 * @param otherProps Props of the element.
 * @param ownerState
 */
function appendOwnerState(elementType, otherProps, ownerState) {
  if (elementType === undefined || isHostComponent(elementType)) {
    return otherProps;
  }
  return _extends$2({}, otherProps, {
    ownerState: _extends$2({}, otherProps.ownerState, ownerState)
  });
}

/**
 * If `componentProps` is a function, calls it with the provided `ownerState`.
 * Otherwise, just returns `componentProps`.
 */
function resolveComponentProps(componentProps, ownerState, slotState) {
  if (typeof componentProps === 'function') {
    return componentProps(ownerState, slotState);
  }
  return componentProps;
}

/**
 * Extracts event handlers from a given object.
 * A prop is considered an event handler if it is a function and its name starts with `on`.
 *
 * @param object An object to extract event handlers from.
 * @param excludeKeys An array of keys to exclude from the returned object.
 */
function extractEventHandlers(object, excludeKeys = []) {
  if (object === undefined) {
    return {};
  }
  const result = {};
  Object.keys(object).filter(prop => prop.match(/^on[A-Z]/) && typeof object[prop] === 'function' && !excludeKeys.includes(prop)).forEach(prop => {
    result[prop] = object[prop];
  });
  return result;
}

/**
 * Removes event handlers from the given object.
 * A field is considered an event handler if it is a function with a name beginning with `on`.
 *
 * @param object Object to remove event handlers from.
 * @returns Object with event handlers removed.
 */
function omitEventHandlers(object) {
  if (object === undefined) {
    return {};
  }
  const result = {};
  Object.keys(object).filter(prop => !(prop.match(/^on[A-Z]/) && typeof object[prop] === 'function')).forEach(prop => {
    result[prop] = object[prop];
  });
  return result;
}

/**
 * Merges the slot component internal props (usually coming from a hook)
 * with the externally provided ones.
 *
 * The merge order is (the latter overrides the former):
 * 1. The internal props (specified as a getter function to work with get*Props hook result)
 * 2. Additional props (specified internally on a Base UI component)
 * 3. External props specified on the owner component. These should only be used on a root slot.
 * 4. External props specified in the `slotProps.*` prop.
 * 5. The `className` prop - combined from all the above.
 * @param parameters
 * @returns
 */
function mergeSlotProps(parameters) {
  const {
    getSlotProps,
    additionalProps,
    externalSlotProps,
    externalForwardedProps,
    className
  } = parameters;
  if (!getSlotProps) {
    // The simpler case - getSlotProps is not defined, so no internal event handlers are defined,
    // so we can simply merge all the props without having to worry about extracting event handlers.
    const joinedClasses = clsx(additionalProps == null ? void 0 : additionalProps.className, className, externalForwardedProps == null ? void 0 : externalForwardedProps.className, externalSlotProps == null ? void 0 : externalSlotProps.className);
    const mergedStyle = _extends$2({}, additionalProps == null ? void 0 : additionalProps.style, externalForwardedProps == null ? void 0 : externalForwardedProps.style, externalSlotProps == null ? void 0 : externalSlotProps.style);
    const props = _extends$2({}, additionalProps, externalForwardedProps, externalSlotProps);
    if (joinedClasses.length > 0) {
      props.className = joinedClasses;
    }
    if (Object.keys(mergedStyle).length > 0) {
      props.style = mergedStyle;
    }
    return {
      props,
      internalRef: undefined
    };
  }

  // In this case, getSlotProps is responsible for calling the external event handlers.
  // We don't need to include them in the merged props because of this.

  const eventHandlers = extractEventHandlers(_extends$2({}, externalForwardedProps, externalSlotProps));
  const componentsPropsWithoutEventHandlers = omitEventHandlers(externalSlotProps);
  const otherPropsWithoutEventHandlers = omitEventHandlers(externalForwardedProps);
  const internalSlotProps = getSlotProps(eventHandlers);

  // The order of classes is important here.
  // Emotion (that we use in libraries consuming Base UI) depends on this order
  // to properly override style. It requires the most important classes to be last
  // (see https://github.com/mui/material-ui/pull/33205) for the related discussion.
  const joinedClasses = clsx(internalSlotProps == null ? void 0 : internalSlotProps.className, additionalProps == null ? void 0 : additionalProps.className, className, externalForwardedProps == null ? void 0 : externalForwardedProps.className, externalSlotProps == null ? void 0 : externalSlotProps.className);
  const mergedStyle = _extends$2({}, internalSlotProps == null ? void 0 : internalSlotProps.style, additionalProps == null ? void 0 : additionalProps.style, externalForwardedProps == null ? void 0 : externalForwardedProps.style, externalSlotProps == null ? void 0 : externalSlotProps.style);
  const props = _extends$2({}, internalSlotProps, additionalProps, otherPropsWithoutEventHandlers, componentsPropsWithoutEventHandlers);
  if (joinedClasses.length > 0) {
    props.className = joinedClasses;
  }
  if (Object.keys(mergedStyle).length > 0) {
    props.style = mergedStyle;
  }
  return {
    props,
    internalRef: internalSlotProps.ref
  };
}

function getTypeByValue(value) {
  const valueType = typeof value;
  switch (valueType) {
    case 'number':
      if (Number.isNaN(value)) {
        return 'NaN';
      }
      if (!Number.isFinite(value)) {
        return 'Infinity';
      }
      if (value !== Math.floor(value)) {
        return 'float';
      }
      return 'number';
    case 'object':
      if (value === null) {
        return 'null';
      }
      return value.constructor.name;
    default:
      return valueType;
  }
}

// IE 11 support
function ponyfillIsInteger(x) {
  // eslint-disable-next-line no-restricted-globals
  return typeof x === 'number' && isFinite(x) && Math.floor(x) === x;
}
const isInteger = Number.isInteger || ponyfillIsInteger;
function requiredInteger(props, propName, componentName, location) {
  const propValue = props[propName];
  if (propValue == null || !isInteger(propValue)) {
    const propType = getTypeByValue(propValue);
    return new RangeError(`Invalid ${location} \`${propName}\` of type \`${propType}\` supplied to \`${componentName}\`, expected \`integer\`.`);
  }
  return null;
}
function validator(props, propName, ...other) {
  const propValue = props[propName];
  if (propValue === undefined) {
    return null;
  }
  return requiredInteger(props, propName, ...other);
}
function validatorNoop() {
  return null;
}
validator.isRequired = requiredInteger;
validatorNoop.isRequired = validatorNoop;
var integerPropType = process.env.NODE_ENV === 'production' ? validatorNoop : validator;

function chainPropTypes(propType1, propType2) {
  if (process.env.NODE_ENV === 'production') {
    return () => null;
  }
  return function validate(...args) {
    return propType1(...args) || propType2(...args);
  };
}

// Inspired by https://github.com/material-components/material-components-ios/blob/bca36107405594d5b7b16265a5b0ed698f85a5ee/components/Elevation/src/UIColor%2BMaterialElevation.m#L61
const getOverlayAlpha = elevation => {
  let alphaValue;
  if (elevation < 1) {
    alphaValue = 5.11916 * elevation ** 2;
  } else {
    alphaValue = 4.5 * Math.log(elevation + 1) + 2;
  }
  return (alphaValue / 100).toFixed(2);
};
var getOverlayAlpha$1 = getOverlayAlpha;

const _excluded$o = ["className", "component"];
function createBox(options = {}) {
  const {
    themeId,
    defaultTheme,
    defaultClassName = 'MuiBox-root',
    generateClassName
  } = options;
  const BoxRoot = styled$4('div', {
    shouldForwardProp: prop => prop !== 'theme' && prop !== 'sx' && prop !== 'as'
  })(styleFunctionSx$2);
  const Box = /*#__PURE__*/React.forwardRef(function Box(inProps, ref) {
    const theme = useTheme$1(defaultTheme);
    const _extendSxProp = extendSxProp(inProps),
      {
        className,
        component = 'div'
      } = _extendSxProp,
      other = _objectWithoutPropertiesLoose(_extendSxProp, _excluded$o);
    return /*#__PURE__*/jsxRuntimeExports.jsx(BoxRoot, _extends$2({
      as: component,
      ref: ref,
      className: clsx(className, generateClassName ? generateClassName(defaultClassName) : defaultClassName),
      theme: themeId ? theme[themeId] || theme : theme
    }, other));
  });
  return Box;
}

function generateUtilityClasses(componentName, slots, globalStatePrefix = 'Mui') {
  const result = {};
  slots.forEach(slot => {
    result[slot] = generateUtilityClass(componentName, slot, globalStatePrefix);
  });
  return result;
}

const _excluded$n = ["ownerState"],
  _excluded2 = ["variants"],
  _excluded3 = ["name", "slot", "skipVariantsResolver", "skipSx", "overridesResolver"];
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

// https://github.com/emotion-js/emotion/blob/26ded6109fcd8ca9875cc2ce4564fee678a3f3c5/packages/styled/src/utils.js#L40
function isStringTag(tag) {
  return typeof tag === 'string' &&
  // 96 is one less than the char code
  // for "a" so this is checking that
  // it's a lowercase character
  tag.charCodeAt(0) > 96;
}

// Update /system/styled/#api in case if this changes
function shouldForwardProp(prop) {
  return prop !== 'ownerState' && prop !== 'theme' && prop !== 'sx' && prop !== 'as';
}
function shallowLayer(serialized, layerName) {
  if (layerName && serialized && typeof serialized === 'object' && serialized.styles && !serialized.styles.startsWith('@layer') // only add the layer if it is not already there.
  ) {
    serialized.styles = `@layer ${layerName}{${String(serialized.styles)}}`;
  }
  return serialized;
}
const systemDefaultTheme = createTheme$2();
const lowercaseFirstLetter = string => {
  if (!string) {
    return string;
  }
  return string.charAt(0).toLowerCase() + string.slice(1);
};
function resolveTheme({
  defaultTheme,
  theme,
  themeId
}) {
  return isEmpty(theme) ? defaultTheme : theme[themeId] || theme;
}
function defaultOverridesResolver(slot) {
  if (!slot) {
    return null;
  }
  return (props, styles) => styles[slot];
}
function processStyleArg(callableStyle, _ref, layerName) {
  let {
      ownerState
    } = _ref,
    props = _objectWithoutPropertiesLoose(_ref, _excluded$n);
  const resolvedStylesArg = typeof callableStyle === 'function' ? callableStyle(_extends$2({
    ownerState
  }, props)) : callableStyle;
  if (Array.isArray(resolvedStylesArg)) {
    return resolvedStylesArg.flatMap(resolvedStyle => processStyleArg(resolvedStyle, _extends$2({
      ownerState
    }, props), layerName));
  }
  if (!!resolvedStylesArg && typeof resolvedStylesArg === 'object' && Array.isArray(resolvedStylesArg.variants)) {
    const {
        variants = []
      } = resolvedStylesArg,
      otherStyles = _objectWithoutPropertiesLoose(resolvedStylesArg, _excluded2);
    let result = otherStyles;
    variants.forEach(variant => {
      let isMatch = true;
      if (typeof variant.props === 'function') {
        isMatch = variant.props(_extends$2({
          ownerState
        }, props, ownerState));
      } else {
        Object.keys(variant.props).forEach(key => {
          if ((ownerState == null ? void 0 : ownerState[key]) !== variant.props[key] && props[key] !== variant.props[key]) {
            isMatch = false;
          }
        });
      }
      if (isMatch) {
        if (!Array.isArray(result)) {
          result = [result];
        }
        const variantStyle = typeof variant.style === 'function' ? variant.style(_extends$2({
          ownerState
        }, props, ownerState)) : variant.style;
        result.push(layerName ? shallowLayer(internal_serializeStyles(variantStyle), layerName) : variantStyle);
      }
    });
    return result;
  }
  return layerName ? shallowLayer(internal_serializeStyles(resolvedStylesArg), layerName) : resolvedStylesArg;
}
function createStyled(input = {}) {
  const {
    themeId,
    defaultTheme = systemDefaultTheme,
    rootShouldForwardProp = shouldForwardProp,
    slotShouldForwardProp = shouldForwardProp
  } = input;
  const systemSx = props => {
    return styleFunctionSx$2(_extends$2({}, props, {
      theme: resolveTheme(_extends$2({}, props, {
        defaultTheme,
        themeId
      }))
    }));
  };
  systemSx.__mui_systemSx = true;
  return (tag, inputOptions = {}) => {
    // Filter out the `sx` style function from the previous styled component to prevent unnecessary styles generated by the composite components.
    internal_processStyles(tag, styles => styles.filter(style => !(style != null && style.__mui_systemSx)));
    const {
        name: componentName,
        slot: componentSlot,
        skipVariantsResolver: inputSkipVariantsResolver,
        skipSx: inputSkipSx,
        // TODO v6: remove `lowercaseFirstLetter()` in the next major release
        // For more details: https://github.com/mui/material-ui/pull/37908
        overridesResolver = defaultOverridesResolver(lowercaseFirstLetter(componentSlot))
      } = inputOptions,
      options = _objectWithoutPropertiesLoose(inputOptions, _excluded3);
    const layerName = componentName && componentName.startsWith('Mui') || !!componentSlot ? 'components' : 'custom';

    // if skipVariantsResolver option is defined, take the value, otherwise, true for root and false for other slots.
    const skipVariantsResolver = inputSkipVariantsResolver !== undefined ? inputSkipVariantsResolver :
    // TODO v6: remove `Root` in the next major release
    // For more details: https://github.com/mui/material-ui/pull/37908
    componentSlot && componentSlot !== 'Root' && componentSlot !== 'root' || false;
    const skipSx = inputSkipSx || false;
    let label;
    if (process.env.NODE_ENV !== 'production') {
      if (componentName) {
        // TODO v6: remove `lowercaseFirstLetter()` in the next major release
        // For more details: https://github.com/mui/material-ui/pull/37908
        label = `${componentName}-${lowercaseFirstLetter(componentSlot || 'Root')}`;
      }
    }
    let shouldForwardPropOption = shouldForwardProp;

    // TODO v6: remove `Root` in the next major release
    // For more details: https://github.com/mui/material-ui/pull/37908
    if (componentSlot === 'Root' || componentSlot === 'root') {
      shouldForwardPropOption = rootShouldForwardProp;
    } else if (componentSlot) {
      // any other slot specified
      shouldForwardPropOption = slotShouldForwardProp;
    } else if (isStringTag(tag)) {
      // for string (html) tag, preserve the behavior in emotion & styled-components.
      shouldForwardPropOption = undefined;
    }
    const defaultStyledResolver = styled$4(tag, _extends$2({
      shouldForwardProp: shouldForwardPropOption,
      label
    }, options));
    const transformStyleArg = stylesArg => {
      // On the server Emotion doesn't use React.forwardRef for creating components, so the created
      // component stays as a function. This condition makes sure that we do not interpolate functions
      // which are basically components used as a selectors.
      if (typeof stylesArg === 'function' && stylesArg.__emotion_real !== stylesArg || isPlainObject(stylesArg)) {
        return props => {
          const theme = resolveTheme({
            theme: props.theme,
            defaultTheme,
            themeId
          });
          return processStyleArg(stylesArg, _extends$2({}, props, {
            theme
          }), theme.modularCssLayers ? layerName : undefined);
        };
      }
      return stylesArg;
    };
    const muiStyledResolver = (styleArg, ...expressions) => {
      let transformedStyleArg = transformStyleArg(styleArg);
      const expressionsWithDefaultTheme = expressions ? expressions.map(transformStyleArg) : [];
      if (componentName && overridesResolver) {
        expressionsWithDefaultTheme.push(props => {
          const theme = resolveTheme(_extends$2({}, props, {
            defaultTheme,
            themeId
          }));
          if (!theme.components || !theme.components[componentName] || !theme.components[componentName].styleOverrides) {
            return null;
          }
          const styleOverrides = theme.components[componentName].styleOverrides;
          const resolvedStyleOverrides = {};
          // TODO: v7 remove iteration and use `resolveStyleArg(styleOverrides[slot])` directly
          Object.entries(styleOverrides).forEach(([slotKey, slotStyle]) => {
            resolvedStyleOverrides[slotKey] = processStyleArg(slotStyle, _extends$2({}, props, {
              theme
            }), theme.modularCssLayers ? 'theme' : undefined);
          });
          return overridesResolver(props, resolvedStyleOverrides);
        });
      }
      if (componentName && !skipVariantsResolver) {
        expressionsWithDefaultTheme.push(props => {
          var _theme$components;
          const theme = resolveTheme(_extends$2({}, props, {
            defaultTheme,
            themeId
          }));
          const themeVariants = theme == null || (_theme$components = theme.components) == null || (_theme$components = _theme$components[componentName]) == null ? void 0 : _theme$components.variants;
          return processStyleArg({
            variants: themeVariants
          }, _extends$2({}, props, {
            theme
          }), theme.modularCssLayers ? 'theme' : undefined);
        });
      }
      if (!skipSx) {
        expressionsWithDefaultTheme.push(systemSx);
      }
      const numOfCustomFnsApplied = expressionsWithDefaultTheme.length - expressions.length;
      if (Array.isArray(styleArg) && numOfCustomFnsApplied > 0) {
        const placeholders = new Array(numOfCustomFnsApplied).fill('');
        // If the type is array, than we need to add placeholders in the template for the overrides, variants and the sx styles.
        transformedStyleArg = [...styleArg, ...placeholders];
        transformedStyleArg.raw = [...styleArg.raw, ...placeholders];
      }
      const Component = defaultStyledResolver(transformedStyleArg, ...expressionsWithDefaultTheme);
      if (process.env.NODE_ENV !== 'production') {
        let displayName;
        if (componentName) {
          displayName = `${componentName}${capitalize$1(componentSlot || '')}`;
        }
        if (displayName === undefined) {
          displayName = `Styled(${getDisplayName$1(tag)})`;
        }
        Component.displayName = displayName;
      }
      if (tag.muiName) {
        Component.muiName = tag.muiName;
      }
      return Component;
    };
    if (defaultStyledResolver.withConfig) {
      muiStyledResolver.withConfig = defaultStyledResolver.withConfig;
    }
    return muiStyledResolver;
  };
}

const styled = createStyled();
var styled$1 = styled;

/**
 * A version of `React.useLayoutEffect` that does not show a warning when server-side rendering.
 * This is useful for effects that are only needed for client-side rendering but not for SSR.
 *
 * Before you use this hook, make sure to read https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
 * and confirm it doesn't apply to your use-case.
 */
const useEnhancedEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;
var useEnhancedEffect$1 = useEnhancedEffect;

function isClassComponent$1(elementType) {
  // elementType.prototype?.isReactComponent
  const {
    prototype = {}
  } = elementType;
  return Boolean(prototype.isReactComponent);
}
function acceptingRef(props, propName, componentName, location, propFullName) {
  const element = props[propName];
  const safePropName = propFullName || propName;
  if (element == null ||
  // When server-side rendering React doesn't warn either.
  // This is not an accurate check for SSR.
  // This is only in place for Emotion compat.
  // TODO: Revisit once https://github.com/facebook/react/issues/20047 is resolved.
  typeof window === 'undefined') {
    return null;
  }
  let warningHint;
  const elementType = element.type;
  /**
   * Blacklisting instead of whitelisting
   *
   * Blacklisting will miss some components, such as React.Fragment. Those will at least
   * trigger a warning in React.
   * We can't whitelist because there is no safe way to detect React.forwardRef
   * or class components. "Safe" means there's no public API.
   *
   */
  if (typeof elementType === 'function' && !isClassComponent$1(elementType)) {
    warningHint = 'Did you accidentally use a plain function component for an element instead?';
  }
  if (warningHint !== undefined) {
    return new Error(`Invalid ${location} \`${safePropName}\` supplied to \`${componentName}\`. ` + `Expected an element that can hold a ref. ${warningHint} ` + 'For more information see https://mui.com/r/caveat-with-refs-guide');
  }
  return null;
}
const elementAcceptingRef = chainPropTypes(PropTypes.element, acceptingRef);
elementAcceptingRef.isRequired = chainPropTypes(PropTypes.element.isRequired, acceptingRef);
var elementAcceptingRef$1 = elementAcceptingRef;

function isClassComponent(elementType) {
  // elementType.prototype?.isReactComponent
  const {
    prototype = {}
  } = elementType;
  return Boolean(prototype.isReactComponent);
}
function elementTypeAcceptingRef(props, propName, componentName, location, propFullName) {
  const propValue = props[propName];
  const safePropName = propFullName || propName;
  if (propValue == null ||
  // When server-side rendering React doesn't warn either.
  // This is not an accurate check for SSR.
  // This is only in place for emotion compat.
  // TODO: Revisit once https://github.com/facebook/react/issues/20047 is resolved.
  typeof window === 'undefined') {
    return null;
  }
  let warningHint;

  /**
   * Blacklisting instead of whitelisting
   *
   * Blacklisting will miss some components, such as React.Fragment. Those will at least
   * trigger a warning in React.
   * We can't whitelist because there is no safe way to detect React.forwardRef
   * or class components. "Safe" means there's no public API.
   *
   */
  if (typeof propValue === 'function' && !isClassComponent(propValue)) {
    warningHint = 'Did you accidentally provide a plain function component instead?';
  }
  if (warningHint !== undefined) {
    return new Error(`Invalid ${location} \`${safePropName}\` supplied to \`${componentName}\`. ` + `Expected an element type that can hold a ref. ${warningHint} ` + 'For more information see https://mui.com/r/caveat-with-refs-guide');
  }
  return null;
}
var elementTypeAcceptingRef$1 = chainPropTypes(PropTypes.elementType, elementTypeAcceptingRef);

// This module is based on https://github.com/airbnb/prop-types-exact repository.
// However, in order to reduce the number of dependencies and to remove some extra safe checks
// the module was forked.

const specialProperty = 'exact-prop: \u200b';
function exactProp(propTypes) {
  if (process.env.NODE_ENV === 'production') {
    return propTypes;
  }
  return _extends$2({}, propTypes, {
    [specialProperty]: props => {
      const unsupportedProps = Object.keys(props).filter(prop => !propTypes.hasOwnProperty(prop));
      if (unsupportedProps.length > 0) {
        return new Error(`The following props are not supported: ${unsupportedProps.map(prop => `\`${prop}\``).join(', ')}. Please remove them.`);
      }
      return null;
    }
  });
}

function HTMLElementType(props, propName, componentName, location, propFullName) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const propValue = props[propName];
  const safePropName = propFullName || propName;
  if (propValue == null) {
    return null;
  }
  if (propValue && propValue.nodeType !== 1) {
    return new Error(`Invalid ${location} \`${safePropName}\` supplied to \`${componentName}\`. ` + `Expected an HTMLElement.`);
  }
  return null;
}

const refType = PropTypes.oneOfType([PropTypes.func, PropTypes.object]);
var refType$1 = refType;

/**
 * Safe chained function.
 *
 * Will only create a new function if needed,
 * otherwise will pass back existing functions or null.
 */
function createChainedFunction(...funcs) {
  return funcs.reduce((acc, func) => {
    if (func == null) {
      return acc;
    }
    return function chainedFunction(...args) {
      acc.apply(this, args);
      func.apply(this, args);
    };
  }, () => {});
}

function ownerDocument(node) {
  return node && node.ownerDocument || document;
}

function ownerWindow(node) {
  const doc = ownerDocument(node);
  return doc.defaultView || window;
}

let globalId = 0;
function useGlobalId(idOverride) {
  const [defaultId, setDefaultId] = React.useState(idOverride);
  const id = idOverride || defaultId;
  React.useEffect(() => {
    if (defaultId == null) {
      // Fallback to this default id when possible.
      // Use the incrementing value for client-side rendering only.
      // We can't use it server-side.
      // If you want to use random values please consider the Birthday Problem: https://en.wikipedia.org/wiki/Birthday_problem
      globalId += 1;
      setDefaultId(`mui-${globalId}`);
    }
  }, [defaultId]);
  return id;
}

// downstream bundlers may remove unnecessary concatenation, but won't remove toString call -- Workaround for https://github.com/webpack/webpack/issues/14814
const maybeReactUseId = React['useId'.toString()];
/**
 *
 * @example <div id={useId()} />
 * @param idOverride
 * @returns {string}
 */
function useId(idOverride) {
  if (maybeReactUseId !== undefined) {
    const reactId = maybeReactUseId();
    return idOverride != null ? idOverride : reactId;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks -- `React.useId` is invariant at runtime.
  return useGlobalId(idOverride);
}

function useControlled({
  controlled,
  default: defaultProp,
  name,
  state = 'value'
}) {
  // isControlled is ignored in the hook dependency lists as it should never change.
  const {
    current: isControlled
  } = React.useRef(controlled !== undefined);
  const [valueState, setValue] = React.useState(defaultProp);
  const value = isControlled ? controlled : valueState;
  if (process.env.NODE_ENV !== 'production') {
    React.useEffect(() => {
      if (isControlled !== (controlled !== undefined)) {
        console.error([`MUI: A component is changing the ${isControlled ? '' : 'un'}controlled ${state} state of ${name} to be ${isControlled ? 'un' : ''}controlled.`, 'Elements should not switch from uncontrolled to controlled (or vice versa).', `Decide between using a controlled or uncontrolled ${name} ` + 'element for the lifetime of the component.', "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.", 'More info: https://fb.me/react-controlled-components'].join('\n'));
      }
    }, [state, name, controlled]);
    const {
      current: defaultValue
    } = React.useRef(defaultProp);
    React.useEffect(() => {
      if (!isControlled && !Object.is(defaultValue, defaultProp)) {
        console.error([`MUI: A component is changing the default ${state} state of an uncontrolled ${name} after being initialized. ` + `To suppress this warning opt to use a controlled ${name}.`].join('\n'));
      }
    }, [JSON.stringify(defaultProp)]);
  }
  const setValueIfUncontrolled = React.useCallback(newValue => {
    if (!isControlled) {
      setValue(newValue);
    }
  }, []);
  return [value, setValueIfUncontrolled];
}

/**
 * Inspired by https://github.com/facebook/react/issues/14099#issuecomment-440013892
 * See RFC in https://github.com/reactjs/rfcs/pull/220
 */

function useEventCallback(fn) {
  const ref = React.useRef(fn);
  useEnhancedEffect$1(() => {
    ref.current = fn;
  });
  return React.useRef((...args) =>
  // @ts-expect-error hide `this`
  (0, ref.current)(...args)).current;
}

const UNINITIALIZED = {};

/**
 * A React.useRef() that is initialized lazily with a function. Note that it accepts an optional
 * initialization argument, so the initialization function doesn't need to be an inline closure.
 *
 * @usage
 *   const ref = useLazyRef(sortColumns, columns)
 */
function useLazyRef(init, initArg) {
  const ref = React.useRef(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) {
    ref.current = init(initArg);
  }
  return ref;
}

const EMPTY = [];

/**
 * A React.useEffect equivalent that runs once, when the component is mounted.
 */
function useOnMount(fn) {
  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(fn, EMPTY);
  /* eslint-enable react-hooks/exhaustive-deps */
}

class Timeout {
  constructor() {
    this.currentId = null;
    this.clear = () => {
      if (this.currentId !== null) {
        clearTimeout(this.currentId);
        this.currentId = null;
      }
    };
    this.disposeEffect = () => {
      return this.clear;
    };
  }
  static create() {
    return new Timeout();
  }
  /**
   * Executes `fn` after `delay`, clearing any previously scheduled call.
   */
  start(delay, fn) {
    this.clear();
    this.currentId = setTimeout(() => {
      this.currentId = null;
      fn();
    }, delay);
  }
}
function useTimeout() {
  const timeout = useLazyRef(Timeout.create).current;
  useOnMount(timeout.disposeEffect);
  return timeout;
}

let hadKeyboardEvent = true;
let hadFocusVisibleRecently = false;
const hadFocusVisibleRecentlyTimeout = new Timeout();
const inputTypesWhitelist = {
  text: true,
  search: true,
  url: true,
  tel: true,
  email: true,
  password: true,
  number: true,
  date: true,
  month: true,
  week: true,
  time: true,
  datetime: true,
  'datetime-local': true
};

/**
 * Computes whether the given element should automatically trigger the
 * `focus-visible` class being added, i.e. whether it should always match
 * `:focus-visible` when focused.
 * @param {Element} node
 * @returns {boolean}
 */
function focusTriggersKeyboardModality(node) {
  const {
    type,
    tagName
  } = node;
  if (tagName === 'INPUT' && inputTypesWhitelist[type] && !node.readOnly) {
    return true;
  }
  if (tagName === 'TEXTAREA' && !node.readOnly) {
    return true;
  }
  if (node.isContentEditable) {
    return true;
  }
  return false;
}

/**
 * Keep track of our keyboard modality state with `hadKeyboardEvent`.
 * If the most recent user interaction was via the keyboard;
 * and the key press did not include a meta, alt/option, or control key;
 * then the modality is keyboard. Otherwise, the modality is not keyboard.
 * @param {KeyboardEvent} event
 */
function handleKeyDown(event) {
  if (event.metaKey || event.altKey || event.ctrlKey) {
    return;
  }
  hadKeyboardEvent = true;
}

/**
 * If at any point a user clicks with a pointing device, ensure that we change
 * the modality away from keyboard.
 * This avoids the situation where a user presses a key on an already focused
 * element, and then clicks on a different element, focusing it with a
 * pointing device, while we still think we're in keyboard modality.
 */
function handlePointerDown() {
  hadKeyboardEvent = false;
}
function handleVisibilityChange() {
  if (this.visibilityState === 'hidden') {
    // If the tab becomes active again, the browser will handle calling focus
    // on the element (Safari actually calls it twice).
    // If this tab change caused a blur on an element with focus-visible,
    // re-apply the class when the user switches back to the tab.
    if (hadFocusVisibleRecently) {
      hadKeyboardEvent = true;
    }
  }
}
function prepare(doc) {
  doc.addEventListener('keydown', handleKeyDown, true);
  doc.addEventListener('mousedown', handlePointerDown, true);
  doc.addEventListener('pointerdown', handlePointerDown, true);
  doc.addEventListener('touchstart', handlePointerDown, true);
  doc.addEventListener('visibilitychange', handleVisibilityChange, true);
}
function isFocusVisible(event) {
  const {
    target
  } = event;
  try {
    return target.matches(':focus-visible');
  } catch (error) {
    // Browsers not implementing :focus-visible will throw a SyntaxError.
    // We use our own heuristic for those browsers.
    // Rethrow might be better if it's not the expected error but do we really
    // want to crash if focus-visible malfunctioned?
  }

  // No need for validFocusTarget check. The user does that by attaching it to
  // focusable events only.
  return hadKeyboardEvent || focusTriggersKeyboardModality(target);
}
function useIsFocusVisible() {
  const ref = React.useCallback(node => {
    if (node != null) {
      prepare(node.ownerDocument);
    }
  }, []);
  const isFocusVisibleRef = React.useRef(false);

  /**
   * Should be called if a blur event is fired
   */
  function handleBlurVisible() {
    // checking against potential state variable does not suffice if we focus and blur synchronously.
    // React wouldn't have time to trigger a re-render so `focusVisible` would be stale.
    // Ideally we would adjust `isFocusVisible(event)` to look at `relatedTarget` for blur events.
    // This doesn't work in IE11 due to https://github.com/facebook/react/issues/3751
    // TODO: check again if React releases their internal changes to focus event handling (https://github.com/facebook/react/pull/19186).
    if (isFocusVisibleRef.current) {
      // To detect a tab/window switch, we look for a blur event followed
      // rapidly by a visibility change.
      // If we don't see a visibility change within 100ms, it's probably a
      // regular focus change.
      hadFocusVisibleRecently = true;
      hadFocusVisibleRecentlyTimeout.start(100, () => {
        hadFocusVisibleRecently = false;
      });
      isFocusVisibleRef.current = false;
      return true;
    }
    return false;
  }

  /**
   * Should be called if a blur event is fired
   */
  function handleFocusVisible(event) {
    if (isFocusVisible(event)) {
      isFocusVisibleRef.current = true;
      return true;
    }
    return false;
  }
  return {
    isFocusVisibleRef,
    onFocus: handleFocusVisible,
    onBlur: handleBlurVisible,
    ref
  };
}

// A change of the browser zoom change the scrollbar size.
// Credit https://github.com/twbs/bootstrap/blob/488fd8afc535ca3a6ad4dc581f5e89217b6a36ac/js/src/util/scrollbar.js#L14-L18
function getScrollbarSize(doc) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/innerWidth#usage_notes
  const documentWidth = doc.documentElement.clientWidth;
  return Math.abs(window.innerWidth - documentWidth);
}

const _excluded$m = ["elementType", "externalSlotProps", "ownerState", "skipResolvingSlotProps"];
/**
 * @ignore - do not document.
 * Builds the props to be passed into the slot of an unstyled component.
 * It merges the internal props of the component with the ones supplied by the user, allowing to customize the behavior.
 * If the slot component is not a host component, it also merges in the `ownerState`.
 *
 * @param parameters.getSlotProps - A function that returns the props to be passed to the slot component.
 */
function useSlotProps(parameters) {
  var _parameters$additiona;
  const {
      elementType,
      externalSlotProps,
      ownerState,
      skipResolvingSlotProps = false
    } = parameters,
    rest = _objectWithoutPropertiesLoose(parameters, _excluded$m);
  const resolvedComponentsProps = skipResolvingSlotProps ? {} : resolveComponentProps(externalSlotProps, ownerState);
  const {
    props: mergedProps,
    internalRef
  } = mergeSlotProps(_extends$2({}, rest, {
    externalSlotProps: resolvedComponentsProps
  }));
  const ref = useForkRef(internalRef, resolvedComponentsProps == null ? void 0 : resolvedComponentsProps.ref, (_parameters$additiona = parameters.additionalProps) == null ? void 0 : _parameters$additiona.ref);
  const props = appendOwnerState(elementType, _extends$2({}, mergedProps, {
    ref
  }), ownerState);
  return props;
}

/**
 * Returns the ref of a React element handling differences between React 19 and older versions.
 * It will throw runtime error if the element is not a valid React element.
 *
 * @param element React.ReactElement
 * @returns React.Ref<any> | null
 */
function getReactElementRef(element) {
  // 'ref' is passed as prop in React 19, whereas 'ref' is directly attached to children in older versions
  if (parseInt(React.version, 10) >= 19) {
    var _element$props;
    return (element == null || (_element$props = element.props) == null ? void 0 : _element$props.ref) || null;
  }
  // @ts-expect-error element.ref is not included in the ReactElement type
  // https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/70189
  return (element == null ? void 0 : element.ref) || null;
}

const RtlContext = /*#__PURE__*/React.createContext();
process.env.NODE_ENV !== "production" ? {
  children: PropTypes.node,
  value: PropTypes.bool
} : void 0;
const useRtl = () => {
  const value = React.useContext(RtlContext);
  return value != null ? value : false;
};

function useTheme() {
  const theme = useTheme$1(defaultTheme$2);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useDebugValue(theme);
  }
  return theme[THEME_ID] || theme;
}

function getPaperUtilityClass(slot) {
  return generateUtilityClass('MuiPaper', slot);
}
generateUtilityClasses('MuiPaper', ['root', 'rounded', 'outlined', 'elevation', 'elevation0', 'elevation1', 'elevation2', 'elevation3', 'elevation4', 'elevation5', 'elevation6', 'elevation7', 'elevation8', 'elevation9', 'elevation10', 'elevation11', 'elevation12', 'elevation13', 'elevation14', 'elevation15', 'elevation16', 'elevation17', 'elevation18', 'elevation19', 'elevation20', 'elevation21', 'elevation22', 'elevation23', 'elevation24']);

const _excluded$l = ["className", "component", "elevation", "square", "variant"];
const useUtilityClasses$h = ownerState => {
  const {
    square,
    elevation,
    variant,
    classes
  } = ownerState;
  const slots = {
    root: ['root', variant, !square && 'rounded', variant === 'elevation' && `elevation${elevation}`]
  };
  return composeClasses(slots, getPaperUtilityClass, classes);
};
const PaperRoot = styled$3('div', {
  name: 'MuiPaper',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, styles[ownerState.variant], !ownerState.square && styles.rounded, ownerState.variant === 'elevation' && styles[`elevation${ownerState.elevation}`]];
  }
})(({
  theme,
  ownerState
}) => {
  var _theme$vars$overlays;
  return _extends$2({
    backgroundColor: (theme.vars || theme).palette.background.paper,
    color: (theme.vars || theme).palette.text.primary,
    transition: theme.transitions.create('box-shadow')
  }, !ownerState.square && {
    borderRadius: theme.shape.borderRadius
  }, ownerState.variant === 'outlined' && {
    border: `1px solid ${(theme.vars || theme).palette.divider}`
  }, ownerState.variant === 'elevation' && _extends$2({
    boxShadow: (theme.vars || theme).shadows[ownerState.elevation]
  }, !theme.vars && theme.palette.mode === 'dark' && {
    backgroundImage: `linear-gradient(${colorManipulatorExports.alpha('#fff', getOverlayAlpha$1(ownerState.elevation))}, ${colorManipulatorExports.alpha('#fff', getOverlayAlpha$1(ownerState.elevation))})`
  }, theme.vars && {
    backgroundImage: (_theme$vars$overlays = theme.vars.overlays) == null ? void 0 : _theme$vars$overlays[ownerState.elevation]
  }));
});
const Paper = /*#__PURE__*/React.forwardRef(function Paper(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiPaper'
  });
  const {
      className,
      component = 'div',
      elevation = 1,
      square = false,
      variant = 'elevation'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$l);
  const ownerState = _extends$2({}, props, {
    component,
    elevation,
    square,
    variant
  });
  const classes = useUtilityClasses$h(ownerState);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const theme = useTheme();
    if (theme.shadows[elevation] === undefined) {
      console.error([`MUI: The elevation provided <Paper elevation={${elevation}}> is not available in the theme.`, `Please make sure that \`theme.shadows[${elevation}]\` is defined.`].join('\n'));
    }
  }
  return /*#__PURE__*/jsxRuntimeExports.jsx(PaperRoot, _extends$2({
    as: component,
    ownerState: ownerState,
    className: clsx(classes.root, className),
    ref: ref
  }, other));
});
process.env.NODE_ENV !== "production" ? Paper.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * Shadow depth, corresponds to `dp` in the spec.
   * It accepts values between 0 and 24 inclusive.
   * @default 1
   */
  elevation: chainPropTypes(integerPropType, props => {
    const {
      elevation,
      variant
    } = props;
    if (elevation > 0 && variant === 'outlined') {
      return new Error(`MUI: Combining \`elevation={${elevation}}\` with \`variant="${variant}"\` has no effect. Either use \`elevation={0}\` or use a different \`variant\`.`);
    }
    return null;
  }),
  /**
   * If `true`, rounded corners are disabled.
   * @default false
   */
  square: PropTypes.bool,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The variant to use.
   * @default 'elevation'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['elevation', 'outlined']), PropTypes.string])
} : void 0;
var Paper$1 = Paper;

function _setPrototypeOf(t, e) {
  return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
    return t.__proto__ = e, t;
  }, _setPrototypeOf(t, e);
}

function _inheritsLoose(t, o) {
  t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o);
}

var config = {
  disabled: false
};

var timeoutsShape = process.env.NODE_ENV !== 'production' ? PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
  enter: PropTypes.number,
  exit: PropTypes.number,
  appear: PropTypes.number
}).isRequired]) : null;
process.env.NODE_ENV !== 'production' ? PropTypes.oneOfType([PropTypes.string, PropTypes.shape({
  enter: PropTypes.string,
  exit: PropTypes.string,
  active: PropTypes.string
}), PropTypes.shape({
  enter: PropTypes.string,
  enterDone: PropTypes.string,
  enterActive: PropTypes.string,
  exit: PropTypes.string,
  exitDone: PropTypes.string,
  exitActive: PropTypes.string
})]) : null;

var TransitionGroupContext = React__default.createContext(null);

var forceReflow = function forceReflow(node) {
  return node.scrollTop;
};

var UNMOUNTED = 'unmounted';
var EXITED = 'exited';
var ENTERING = 'entering';
var ENTERED = 'entered';
var EXITING = 'exiting';
/**
 * The Transition component lets you describe a transition from one component
 * state to another _over time_ with a simple declarative API. Most commonly
 * it's used to animate the mounting and unmounting of a component, but can also
 * be used to describe in-place transition states as well.
 *
 * ---
 *
 * **Note**: `Transition` is a platform-agnostic base component. If you're using
 * transitions in CSS, you'll probably want to use
 * [`CSSTransition`](https://reactcommunity.org/react-transition-group/css-transition)
 * instead. It inherits all the features of `Transition`, but contains
 * additional features necessary to play nice with CSS transitions (hence the
 * name of the component).
 *
 * ---
 *
 * By default the `Transition` component does not alter the behavior of the
 * component it renders, it only tracks "enter" and "exit" states for the
 * components. It's up to you to give meaning and effect to those states. For
 * example we can add styles to a component when it enters or exits:
 *
 * ```jsx
 * import { Transition } from 'react-transition-group';
 *
 * const duration = 300;
 *
 * const defaultStyle = {
 *   transition: `opacity ${duration}ms ease-in-out`,
 *   opacity: 0,
 * }
 *
 * const transitionStyles = {
 *   entering: { opacity: 1 },
 *   entered:  { opacity: 1 },
 *   exiting:  { opacity: 0 },
 *   exited:  { opacity: 0 },
 * };
 *
 * const Fade = ({ in: inProp }) => (
 *   <Transition in={inProp} timeout={duration}>
 *     {state => (
 *       <div style={{
 *         ...defaultStyle,
 *         ...transitionStyles[state]
 *       }}>
 *         I'm a fade Transition!
 *       </div>
 *     )}
 *   </Transition>
 * );
 * ```
 *
 * There are 4 main states a Transition can be in:
 *  - `'entering'`
 *  - `'entered'`
 *  - `'exiting'`
 *  - `'exited'`
 *
 * Transition state is toggled via the `in` prop. When `true` the component
 * begins the "Enter" stage. During this stage, the component will shift from
 * its current transition state, to `'entering'` for the duration of the
 * transition and then to the `'entered'` stage once it's complete. Let's take
 * the following example (we'll use the
 * [useState](https://reactjs.org/docs/hooks-reference.html#usestate) hook):
 *
 * ```jsx
 * function App() {
 *   const [inProp, setInProp] = useState(false);
 *   return (
 *     <div>
 *       <Transition in={inProp} timeout={500}>
 *         {state => (
 *           // ...
 *         )}
 *       </Transition>
 *       <button onClick={() => setInProp(true)}>
 *         Click to Enter
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * When the button is clicked the component will shift to the `'entering'` state
 * and stay there for 500ms (the value of `timeout`) before it finally switches
 * to `'entered'`.
 *
 * When `in` is `false` the same thing happens except the state moves from
 * `'exiting'` to `'exited'`.
 */

var Transition = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(Transition, _React$Component);

  function Transition(props, context) {
    var _this;

    _this = _React$Component.call(this, props, context) || this;
    var parentGroup = context; // In the context of a TransitionGroup all enters are really appears

    var appear = parentGroup && !parentGroup.isMounting ? props.enter : props.appear;
    var initialStatus;
    _this.appearStatus = null;

    if (props.in) {
      if (appear) {
        initialStatus = EXITED;
        _this.appearStatus = ENTERING;
      } else {
        initialStatus = ENTERED;
      }
    } else {
      if (props.unmountOnExit || props.mountOnEnter) {
        initialStatus = UNMOUNTED;
      } else {
        initialStatus = EXITED;
      }
    }

    _this.state = {
      status: initialStatus
    };
    _this.nextCallback = null;
    return _this;
  }

  Transition.getDerivedStateFromProps = function getDerivedStateFromProps(_ref, prevState) {
    var nextIn = _ref.in;

    if (nextIn && prevState.status === UNMOUNTED) {
      return {
        status: EXITED
      };
    }

    return null;
  } // getSnapshotBeforeUpdate(prevProps) {
  //   let nextStatus = null
  //   if (prevProps !== this.props) {
  //     const { status } = this.state
  //     if (this.props.in) {
  //       if (status !== ENTERING && status !== ENTERED) {
  //         nextStatus = ENTERING
  //       }
  //     } else {
  //       if (status === ENTERING || status === ENTERED) {
  //         nextStatus = EXITING
  //       }
  //     }
  //   }
  //   return { nextStatus }
  // }
  ;

  var _proto = Transition.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.updateStatus(true, this.appearStatus);
  };

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var nextStatus = null;

    if (prevProps !== this.props) {
      var status = this.state.status;

      if (this.props.in) {
        if (status !== ENTERING && status !== ENTERED) {
          nextStatus = ENTERING;
        }
      } else {
        if (status === ENTERING || status === ENTERED) {
          nextStatus = EXITING;
        }
      }
    }

    this.updateStatus(false, nextStatus);
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.cancelNextCallback();
  };

  _proto.getTimeouts = function getTimeouts() {
    var timeout = this.props.timeout;
    var exit, enter, appear;
    exit = enter = appear = timeout;

    if (timeout != null && typeof timeout !== 'number') {
      exit = timeout.exit;
      enter = timeout.enter; // TODO: remove fallback for next major

      appear = timeout.appear !== undefined ? timeout.appear : enter;
    }

    return {
      exit: exit,
      enter: enter,
      appear: appear
    };
  };

  _proto.updateStatus = function updateStatus(mounting, nextStatus) {
    if (mounting === void 0) {
      mounting = false;
    }

    if (nextStatus !== null) {
      // nextStatus will always be ENTERING or EXITING.
      this.cancelNextCallback();

      if (nextStatus === ENTERING) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var node = this.props.nodeRef ? this.props.nodeRef.current : ReactDOM__default.findDOMNode(this); // https://github.com/reactjs/react-transition-group/pull/749
          // With unmountOnExit or mountOnEnter, the enter animation should happen at the transition between `exited` and `entering`.
          // To make the animation happen,  we have to separate each rendering and avoid being processed as batched.

          if (node) forceReflow(node);
        }

        this.performEnter(mounting);
      } else {
        this.performExit();
      }
    } else if (this.props.unmountOnExit && this.state.status === EXITED) {
      this.setState({
        status: UNMOUNTED
      });
    }
  };

  _proto.performEnter = function performEnter(mounting) {
    var _this2 = this;

    var enter = this.props.enter;
    var appearing = this.context ? this.context.isMounting : mounting;

    var _ref2 = this.props.nodeRef ? [appearing] : [ReactDOM__default.findDOMNode(this), appearing],
        maybeNode = _ref2[0],
        maybeAppearing = _ref2[1];

    var timeouts = this.getTimeouts();
    var enterTimeout = appearing ? timeouts.appear : timeouts.enter; // no enter animation skip right to ENTERED
    // if we are mounting and running this it means appear _must_ be set

    if (!mounting && !enter || config.disabled) {
      this.safeSetState({
        status: ENTERED
      }, function () {
        _this2.props.onEntered(maybeNode);
      });
      return;
    }

    this.props.onEnter(maybeNode, maybeAppearing);
    this.safeSetState({
      status: ENTERING
    }, function () {
      _this2.props.onEntering(maybeNode, maybeAppearing);

      _this2.onTransitionEnd(enterTimeout, function () {
        _this2.safeSetState({
          status: ENTERED
        }, function () {
          _this2.props.onEntered(maybeNode, maybeAppearing);
        });
      });
    });
  };

  _proto.performExit = function performExit() {
    var _this3 = this;

    var exit = this.props.exit;
    var timeouts = this.getTimeouts();
    var maybeNode = this.props.nodeRef ? undefined : ReactDOM__default.findDOMNode(this); // no exit animation skip right to EXITED

    if (!exit || config.disabled) {
      this.safeSetState({
        status: EXITED
      }, function () {
        _this3.props.onExited(maybeNode);
      });
      return;
    }

    this.props.onExit(maybeNode);
    this.safeSetState({
      status: EXITING
    }, function () {
      _this3.props.onExiting(maybeNode);

      _this3.onTransitionEnd(timeouts.exit, function () {
        _this3.safeSetState({
          status: EXITED
        }, function () {
          _this3.props.onExited(maybeNode);
        });
      });
    });
  };

  _proto.cancelNextCallback = function cancelNextCallback() {
    if (this.nextCallback !== null) {
      this.nextCallback.cancel();
      this.nextCallback = null;
    }
  };

  _proto.safeSetState = function safeSetState(nextState, callback) {
    // This shouldn't be necessary, but there are weird race conditions with
    // setState callbacks and unmounting in testing, so always make sure that
    // we can cancel any pending setState callbacks after we unmount.
    callback = this.setNextCallback(callback);
    this.setState(nextState, callback);
  };

  _proto.setNextCallback = function setNextCallback(callback) {
    var _this4 = this;

    var active = true;

    this.nextCallback = function (event) {
      if (active) {
        active = false;
        _this4.nextCallback = null;
        callback(event);
      }
    };

    this.nextCallback.cancel = function () {
      active = false;
    };

    return this.nextCallback;
  };

  _proto.onTransitionEnd = function onTransitionEnd(timeout, handler) {
    this.setNextCallback(handler);
    var node = this.props.nodeRef ? this.props.nodeRef.current : ReactDOM__default.findDOMNode(this);
    var doesNotHaveTimeoutOrListener = timeout == null && !this.props.addEndListener;

    if (!node || doesNotHaveTimeoutOrListener) {
      setTimeout(this.nextCallback, 0);
      return;
    }

    if (this.props.addEndListener) {
      var _ref3 = this.props.nodeRef ? [this.nextCallback] : [node, this.nextCallback],
          maybeNode = _ref3[0],
          maybeNextCallback = _ref3[1];

      this.props.addEndListener(maybeNode, maybeNextCallback);
    }

    if (timeout != null) {
      setTimeout(this.nextCallback, timeout);
    }
  };

  _proto.render = function render() {
    var status = this.state.status;

    if (status === UNMOUNTED) {
      return null;
    }

    var _this$props = this.props,
        children = _this$props.children;
        _this$props.in;
        _this$props.mountOnEnter;
        _this$props.unmountOnExit;
        _this$props.appear;
        _this$props.enter;
        _this$props.exit;
        _this$props.timeout;
        _this$props.addEndListener;
        _this$props.onEnter;
        _this$props.onEntering;
        _this$props.onEntered;
        _this$props.onExit;
        _this$props.onExiting;
        _this$props.onExited;
        _this$props.nodeRef;
        var childProps = _objectWithoutPropertiesLoose(_this$props, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);

    return (
      /*#__PURE__*/
      // allows for nested Transitions
      React__default.createElement(TransitionGroupContext.Provider, {
        value: null
      }, typeof children === 'function' ? children(status, childProps) : React__default.cloneElement(React__default.Children.only(children), childProps))
    );
  };

  return Transition;
}(React__default.Component);

Transition.contextType = TransitionGroupContext;
Transition.propTypes = process.env.NODE_ENV !== "production" ? {
  /**
   * A React reference to DOM element that need to transition:
   * https://stackoverflow.com/a/51127130/4671932
   *
   *   - When `nodeRef` prop is used, `node` is not passed to callback functions
   *      (e.g. `onEnter`) because user already has direct access to the node.
   *   - When changing `key` prop of `Transition` in a `TransitionGroup` a new
   *     `nodeRef` need to be provided to `Transition` with changed `key` prop
   *     (see
   *     [test/CSSTransition-test.js](https://github.com/reactjs/react-transition-group/blob/13435f897b3ab71f6e19d724f145596f5910581c/test/CSSTransition-test.js#L362-L437)).
   */
  nodeRef: PropTypes.shape({
    current: typeof Element === 'undefined' ? PropTypes.any : function (propValue, key, componentName, location, propFullName, secret) {
      var value = propValue[key];
      return PropTypes.instanceOf(value && 'ownerDocument' in value ? value.ownerDocument.defaultView.Element : Element)(propValue, key, componentName, location, propFullName, secret);
    }
  }),

  /**
   * A `function` child can be used instead of a React element. This function is
   * called with the current transition status (`'entering'`, `'entered'`,
   * `'exiting'`, `'exited'`), which can be used to apply context
   * specific props to a component.
   *
   * ```jsx
   * <Transition in={this.state.in} timeout={150}>
   *   {state => (
   *     <MyComponent className={`fade fade-${state}`} />
   *   )}
   * </Transition>
   * ```
   */
  children: PropTypes.oneOfType([PropTypes.func.isRequired, PropTypes.element.isRequired]).isRequired,

  /**
   * Show the component; triggers the enter or exit states
   */
  in: PropTypes.bool,

  /**
   * By default the child component is mounted immediately along with
   * the parent `Transition` component. If you want to "lazy mount" the component on the
   * first `in={true}` you can set `mountOnEnter`. After the first enter transition the component will stay
   * mounted, even on "exited", unless you also specify `unmountOnExit`.
   */
  mountOnEnter: PropTypes.bool,

  /**
   * By default the child component stays mounted after it reaches the `'exited'` state.
   * Set `unmountOnExit` if you'd prefer to unmount the component after it finishes exiting.
   */
  unmountOnExit: PropTypes.bool,

  /**
   * By default the child component does not perform the enter transition when
   * it first mounts, regardless of the value of `in`. If you want this
   * behavior, set both `appear` and `in` to `true`.
   *
   * > **Note**: there are no special appear states like `appearing`/`appeared`, this prop
   * > only adds an additional enter transition. However, in the
   * > `<CSSTransition>` component that first enter transition does result in
   * > additional `.appear-*` classes, that way you can choose to style it
   * > differently.
   */
  appear: PropTypes.bool,

  /**
   * Enable or disable enter transitions.
   */
  enter: PropTypes.bool,

  /**
   * Enable or disable exit transitions.
   */
  exit: PropTypes.bool,

  /**
   * The duration of the transition, in milliseconds.
   * Required unless `addEndListener` is provided.
   *
   * You may specify a single timeout for all transitions:
   *
   * ```jsx
   * timeout={500}
   * ```
   *
   * or individually:
   *
   * ```jsx
   * timeout={{
   *  appear: 500,
   *  enter: 300,
   *  exit: 500,
   * }}
   * ```
   *
   * - `appear` defaults to the value of `enter`
   * - `enter` defaults to `0`
   * - `exit` defaults to `0`
   *
   * @type {number | { enter?: number, exit?: number, appear?: number }}
   */
  timeout: function timeout(props) {
    var pt = timeoutsShape;
    if (!props.addEndListener) pt = pt.isRequired;

    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return pt.apply(void 0, [props].concat(args));
  },

  /**
   * Add a custom transition end trigger. Called with the transitioning
   * DOM node and a `done` callback. Allows for more fine grained transition end
   * logic. Timeouts are still used as a fallback if provided.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * ```jsx
   * addEndListener={(node, done) => {
   *   // use the css transitionend event to mark the finish of a transition
   *   node.addEventListener('transitionend', done, false);
   * }}
   * ```
   */
  addEndListener: PropTypes.func,

  /**
   * Callback fired before the "entering" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool) -> void
   */
  onEnter: PropTypes.func,

  /**
   * Callback fired after the "entering" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool)
   */
  onEntering: PropTypes.func,

  /**
   * Callback fired after the "entered" status is applied. An extra parameter
   * `isAppearing` is supplied to indicate if the enter stage is occurring on the initial mount
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement, isAppearing: bool) -> void
   */
  onEntered: PropTypes.func,

  /**
   * Callback fired before the "exiting" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExit: PropTypes.func,

  /**
   * Callback fired after the "exiting" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed.
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExiting: PropTypes.func,

  /**
   * Callback fired after the "exited" status is applied.
   *
   * **Note**: when `nodeRef` prop is passed, `node` is not passed
   *
   * @type Function(node: HtmlElement) -> void
   */
  onExited: PropTypes.func
} : {}; // Name the function so it is clearer in the documentation

function noop() {}

Transition.defaultProps = {
  in: false,
  mountOnEnter: false,
  unmountOnExit: false,
  appear: false,
  enter: true,
  exit: true,
  onEnter: noop,
  onEntering: noop,
  onEntered: noop,
  onExit: noop,
  onExiting: noop,
  onExited: noop
};
Transition.UNMOUNTED = UNMOUNTED;
Transition.EXITED = EXITED;
Transition.ENTERING = ENTERING;
Transition.ENTERED = ENTERED;
Transition.EXITING = EXITING;
var Transition$1 = Transition;

function _assertThisInitialized(e) {
  if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}

/**
 * Given `this.props.children`, return an object mapping key to child.
 *
 * @param {*} children `this.props.children`
 * @return {object} Mapping of key to child
 */

function getChildMapping(children, mapFn) {
  var mapper = function mapper(child) {
    return mapFn && isValidElement(child) ? mapFn(child) : child;
  };

  var result = Object.create(null);
  if (children) Children.map(children, function (c) {
    return c;
  }).forEach(function (child) {
    // run the map function here instead so that the key is the computed one
    result[child.key] = mapper(child);
  });
  return result;
}
/**
 * When you're adding or removing children some may be added or removed in the
 * same render pass. We want to show *both* since we want to simultaneously
 * animate elements in and out. This function takes a previous set of keys
 * and a new set of keys and merges them with its best guess of the correct
 * ordering. In the future we may expose some of the utilities in
 * ReactMultiChild to make this easy, but for now React itself does not
 * directly have this concept of the union of prevChildren and nextChildren
 * so we implement it here.
 *
 * @param {object} prev prev children as returned from
 * `ReactTransitionChildMapping.getChildMapping()`.
 * @param {object} next next children as returned from
 * `ReactTransitionChildMapping.getChildMapping()`.
 * @return {object} a key set that contains all keys in `prev` and all keys
 * in `next` in a reasonable order.
 */

function mergeChildMappings(prev, next) {
  prev = prev || {};
  next = next || {};

  function getValueForKey(key) {
    return key in next ? next[key] : prev[key];
  } // For each key of `next`, the list of keys to insert before that key in
  // the combined list


  var nextKeysPending = Object.create(null);
  var pendingKeys = [];

  for (var prevKey in prev) {
    if (prevKey in next) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys;
        pendingKeys = [];
      }
    } else {
      pendingKeys.push(prevKey);
    }
  }

  var i;
  var childMapping = {};

  for (var nextKey in next) {
    if (nextKeysPending[nextKey]) {
      for (i = 0; i < nextKeysPending[nextKey].length; i++) {
        var pendingNextKey = nextKeysPending[nextKey][i];
        childMapping[nextKeysPending[nextKey][i]] = getValueForKey(pendingNextKey);
      }
    }

    childMapping[nextKey] = getValueForKey(nextKey);
  } // Finally, add the keys which didn't appear before any key in `next`


  for (i = 0; i < pendingKeys.length; i++) {
    childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
  }

  return childMapping;
}

function getProp(child, prop, props) {
  return props[prop] != null ? props[prop] : child.props[prop];
}

function getInitialChildMapping(props, onExited) {
  return getChildMapping(props.children, function (child) {
    return cloneElement(child, {
      onExited: onExited.bind(null, child),
      in: true,
      appear: getProp(child, 'appear', props),
      enter: getProp(child, 'enter', props),
      exit: getProp(child, 'exit', props)
    });
  });
}
function getNextChildMapping(nextProps, prevChildMapping, onExited) {
  var nextChildMapping = getChildMapping(nextProps.children);
  var children = mergeChildMappings(prevChildMapping, nextChildMapping);
  Object.keys(children).forEach(function (key) {
    var child = children[key];
    if (!isValidElement(child)) return;
    var hasPrev = (key in prevChildMapping);
    var hasNext = (key in nextChildMapping);
    var prevChild = prevChildMapping[key];
    var isLeaving = isValidElement(prevChild) && !prevChild.props.in; // item is new (entering)

    if (hasNext && (!hasPrev || isLeaving)) {
      // console.log('entering', key)
      children[key] = cloneElement(child, {
        onExited: onExited.bind(null, child),
        in: true,
        exit: getProp(child, 'exit', nextProps),
        enter: getProp(child, 'enter', nextProps)
      });
    } else if (!hasNext && hasPrev && !isLeaving) {
      // item is old (exiting)
      // console.log('leaving', key)
      children[key] = cloneElement(child, {
        in: false
      });
    } else if (hasNext && hasPrev && isValidElement(prevChild)) {
      // item hasn't changed transition states
      // copy over the last transition props;
      // console.log('unchanged', key)
      children[key] = cloneElement(child, {
        onExited: onExited.bind(null, child),
        in: prevChild.props.in,
        exit: getProp(child, 'exit', nextProps),
        enter: getProp(child, 'enter', nextProps)
      });
    }
  });
  return children;
}

var values = Object.values || function (obj) {
  return Object.keys(obj).map(function (k) {
    return obj[k];
  });
};

var defaultProps = {
  component: 'div',
  childFactory: function childFactory(child) {
    return child;
  }
};
/**
 * The `<TransitionGroup>` component manages a set of transition components
 * (`<Transition>` and `<CSSTransition>`) in a list. Like with the transition
 * components, `<TransitionGroup>` is a state machine for managing the mounting
 * and unmounting of components over time.
 *
 * Consider the example below. As items are removed or added to the TodoList the
 * `in` prop is toggled automatically by the `<TransitionGroup>`.
 *
 * Note that `<TransitionGroup>`  does not define any animation behavior!
 * Exactly _how_ a list item animates is up to the individual transition
 * component. This means you can mix and match animations across different list
 * items.
 */

var TransitionGroup = /*#__PURE__*/function (_React$Component) {
  _inheritsLoose(TransitionGroup, _React$Component);

  function TransitionGroup(props, context) {
    var _this;

    _this = _React$Component.call(this, props, context) || this;

    var handleExited = _this.handleExited.bind(_assertThisInitialized(_this)); // Initial children should all be entering, dependent on appear


    _this.state = {
      contextValue: {
        isMounting: true
      },
      handleExited: handleExited,
      firstRender: true
    };
    return _this;
  }

  var _proto = TransitionGroup.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.mounted = true;
    this.setState({
      contextValue: {
        isMounting: false
      }
    });
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.mounted = false;
  };

  TransitionGroup.getDerivedStateFromProps = function getDerivedStateFromProps(nextProps, _ref) {
    var prevChildMapping = _ref.children,
        handleExited = _ref.handleExited,
        firstRender = _ref.firstRender;
    return {
      children: firstRender ? getInitialChildMapping(nextProps, handleExited) : getNextChildMapping(nextProps, prevChildMapping, handleExited),
      firstRender: false
    };
  } // node is `undefined` when user provided `nodeRef` prop
  ;

  _proto.handleExited = function handleExited(child, node) {
    var currentChildMapping = getChildMapping(this.props.children);
    if (child.key in currentChildMapping) return;

    if (child.props.onExited) {
      child.props.onExited(node);
    }

    if (this.mounted) {
      this.setState(function (state) {
        var children = _extends$2({}, state.children);

        delete children[child.key];
        return {
          children: children
        };
      });
    }
  };

  _proto.render = function render() {
    var _this$props = this.props,
        Component = _this$props.component,
        childFactory = _this$props.childFactory,
        props = _objectWithoutPropertiesLoose(_this$props, ["component", "childFactory"]);

    var contextValue = this.state.contextValue;
    var children = values(this.state.children).map(childFactory);
    delete props.appear;
    delete props.enter;
    delete props.exit;

    if (Component === null) {
      return /*#__PURE__*/React__default.createElement(TransitionGroupContext.Provider, {
        value: contextValue
      }, children);
    }

    return /*#__PURE__*/React__default.createElement(TransitionGroupContext.Provider, {
      value: contextValue
    }, /*#__PURE__*/React__default.createElement(Component, props, children));
  };

  return TransitionGroup;
}(React__default.Component);

TransitionGroup.propTypes = process.env.NODE_ENV !== "production" ? {
  /**
   * `<TransitionGroup>` renders a `<div>` by default. You can change this
   * behavior by providing a `component` prop.
   * If you use React v16+ and would like to avoid a wrapping `<div>` element
   * you can pass in `component={null}`. This is useful if the wrapping div
   * borks your css styles.
   */
  component: PropTypes.any,

  /**
   * A set of `<Transition>` components, that are toggled `in` and out as they
   * leave. the `<TransitionGroup>` will inject specific transition props, so
   * remember to spread them through if you are wrapping the `<Transition>` as
   * with our `<Fade>` example.
   *
   * While this component is meant for multiple `Transition` or `CSSTransition`
   * children, sometimes you may want to have a single transition child with
   * content that you want to be transitioned out and in when you change it
   * (e.g. routes, images etc.) In that case you can change the `key` prop of
   * the transition child as you change its content, this will cause
   * `TransitionGroup` to transition the child out and back in.
   */
  children: PropTypes.node,

  /**
   * A convenience prop that enables or disables appear animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  appear: PropTypes.bool,

  /**
   * A convenience prop that enables or disables enter animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  enter: PropTypes.bool,

  /**
   * A convenience prop that enables or disables exit animations
   * for all children. Note that specifying this will override any defaults set
   * on individual children Transitions.
   */
  exit: PropTypes.bool,

  /**
   * You may need to apply reactive updates to a child as it is exiting.
   * This is generally done by using `cloneElement` however in the case of an exiting
   * child the element has already been removed and not accessible to the consumer.
   *
   * If you do need to update a child as it leaves you can provide a `childFactory`
   * to wrap every child, even the ones that are leaving.
   *
   * @type Function(child: ReactElement) -> ReactElement
   */
  childFactory: PropTypes.func
} : {};
TransitionGroup.defaultProps = defaultProps;
var TransitionGroup$1 = TransitionGroup;

function Ripple(props) {
  const {
    className,
    classes,
    pulsate = false,
    rippleX,
    rippleY,
    rippleSize,
    in: inProp,
    onExited,
    timeout
  } = props;
  const [leaving, setLeaving] = React.useState(false);
  const rippleClassName = clsx(className, classes.ripple, classes.rippleVisible, pulsate && classes.ripplePulsate);
  const rippleStyles = {
    width: rippleSize,
    height: rippleSize,
    top: -(rippleSize / 2) + rippleY,
    left: -(rippleSize / 2) + rippleX
  };
  const childClassName = clsx(classes.child, leaving && classes.childLeaving, pulsate && classes.childPulsate);
  if (!inProp && !leaving) {
    setLeaving(true);
  }
  React.useEffect(() => {
    if (!inProp && onExited != null) {
      // react-transition-group#onExited
      const timeoutId = setTimeout(onExited, timeout);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [onExited, inProp, timeout]);
  return /*#__PURE__*/jsxRuntimeExports.jsx("span", {
    className: rippleClassName,
    style: rippleStyles,
    children: /*#__PURE__*/jsxRuntimeExports.jsx("span", {
      className: childClassName
    })
  });
}
process.env.NODE_ENV !== "production" ? Ripple.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object.isRequired,
  className: PropTypes.string,
  /**
   * @ignore - injected from TransitionGroup
   */
  in: PropTypes.bool,
  /**
   * @ignore - injected from TransitionGroup
   */
  onExited: PropTypes.func,
  /**
   * If `true`, the ripple pulsates, typically indicating the keyboard focus state of an element.
   */
  pulsate: PropTypes.bool,
  /**
   * Diameter of the ripple.
   */
  rippleSize: PropTypes.number,
  /**
   * Horizontal position of the ripple center.
   */
  rippleX: PropTypes.number,
  /**
   * Vertical position of the ripple center.
   */
  rippleY: PropTypes.number,
  /**
   * exit delay
   */
  timeout: PropTypes.number.isRequired
} : void 0;

const touchRippleClasses = generateUtilityClasses('MuiTouchRipple', ['root', 'ripple', 'rippleVisible', 'ripplePulsate', 'child', 'childLeaving', 'childPulsate']);
var touchRippleClasses$1 = touchRippleClasses;

const _excluded$k = ["center", "classes", "className"];
let _ = t => t,
  _t,
  _t2,
  _t3,
  _t4;
const DURATION = 550;
const DELAY_RIPPLE = 80;
const enterKeyframe = keyframes(_t || (_t = _`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`));
const exitKeyframe = keyframes(_t2 || (_t2 = _`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`));
const pulsateKeyframe = keyframes(_t3 || (_t3 = _`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`));
const TouchRippleRoot = styled$3('span', {
  name: 'MuiTouchRipple',
  slot: 'Root'
})({
  overflow: 'hidden',
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: 'inherit'
});

// This `styled()` function invokes keyframes. `styled-components` only supports keyframes
// in string templates. Do not convert these styles in JS object as it will break.
const TouchRippleRipple = styled$3(Ripple, {
  name: 'MuiTouchRipple',
  slot: 'Ripple'
})(_t4 || (_t4 = _`
  opacity: 0;
  position: absolute;

  &.${0} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${0};
    animation-duration: ${0}ms;
    animation-timing-function: ${0};
  }

  &.${0} {
    animation-duration: ${0}ms;
  }

  & .${0} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${0} {
    opacity: 0;
    animation-name: ${0};
    animation-duration: ${0}ms;
    animation-timing-function: ${0};
  }

  & .${0} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${0};
    animation-duration: 2500ms;
    animation-timing-function: ${0};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`), touchRippleClasses$1.rippleVisible, enterKeyframe, DURATION, ({
  theme
}) => theme.transitions.easing.easeInOut, touchRippleClasses$1.ripplePulsate, ({
  theme
}) => theme.transitions.duration.shorter, touchRippleClasses$1.child, touchRippleClasses$1.childLeaving, exitKeyframe, DURATION, ({
  theme
}) => theme.transitions.easing.easeInOut, touchRippleClasses$1.childPulsate, pulsateKeyframe, ({
  theme
}) => theme.transitions.easing.easeInOut);

/**
 * @ignore - internal component.
 *
 * TODO v5: Make private
 */
const TouchRipple = /*#__PURE__*/React.forwardRef(function TouchRipple(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTouchRipple'
  });
  const {
      center: centerProp = false,
      classes = {},
      className
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$k);
  const [ripples, setRipples] = React.useState([]);
  const nextKey = React.useRef(0);
  const rippleCallback = React.useRef(null);
  React.useEffect(() => {
    if (rippleCallback.current) {
      rippleCallback.current();
      rippleCallback.current = null;
    }
  }, [ripples]);

  // Used to filter out mouse emulated events on mobile.
  const ignoringMouseDown = React.useRef(false);
  // We use a timer in order to only show the ripples for touch "click" like events.
  // We don't want to display the ripple for touch scroll events.
  const startTimer = useTimeout();

  // This is the hook called once the previous timeout is ready.
  const startTimerCommit = React.useRef(null);
  const container = React.useRef(null);
  const startCommit = React.useCallback(params => {
    const {
      pulsate,
      rippleX,
      rippleY,
      rippleSize,
      cb
    } = params;
    setRipples(oldRipples => [...oldRipples, /*#__PURE__*/jsxRuntimeExports.jsx(TouchRippleRipple, {
      classes: {
        ripple: clsx(classes.ripple, touchRippleClasses$1.ripple),
        rippleVisible: clsx(classes.rippleVisible, touchRippleClasses$1.rippleVisible),
        ripplePulsate: clsx(classes.ripplePulsate, touchRippleClasses$1.ripplePulsate),
        child: clsx(classes.child, touchRippleClasses$1.child),
        childLeaving: clsx(classes.childLeaving, touchRippleClasses$1.childLeaving),
        childPulsate: clsx(classes.childPulsate, touchRippleClasses$1.childPulsate)
      },
      timeout: DURATION,
      pulsate: pulsate,
      rippleX: rippleX,
      rippleY: rippleY,
      rippleSize: rippleSize
    }, nextKey.current)]);
    nextKey.current += 1;
    rippleCallback.current = cb;
  }, [classes]);
  const start = React.useCallback((event = {}, options = {}, cb = () => {}) => {
    const {
      pulsate = false,
      center = centerProp || options.pulsate,
      fakeElement = false // For test purposes
    } = options;
    if ((event == null ? void 0 : event.type) === 'mousedown' && ignoringMouseDown.current) {
      ignoringMouseDown.current = false;
      return;
    }
    if ((event == null ? void 0 : event.type) === 'touchstart') {
      ignoringMouseDown.current = true;
    }
    const element = fakeElement ? null : container.current;
    const rect = element ? element.getBoundingClientRect() : {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    };

    // Get the size of the ripple
    let rippleX;
    let rippleY;
    let rippleSize;
    if (center || event === undefined || event.clientX === 0 && event.clientY === 0 || !event.clientX && !event.touches) {
      rippleX = Math.round(rect.width / 2);
      rippleY = Math.round(rect.height / 2);
    } else {
      const {
        clientX,
        clientY
      } = event.touches && event.touches.length > 0 ? event.touches[0] : event;
      rippleX = Math.round(clientX - rect.left);
      rippleY = Math.round(clientY - rect.top);
    }
    if (center) {
      rippleSize = Math.sqrt((2 * rect.width ** 2 + rect.height ** 2) / 3);

      // For some reason the animation is broken on Mobile Chrome if the size is even.
      if (rippleSize % 2 === 0) {
        rippleSize += 1;
      }
    } else {
      const sizeX = Math.max(Math.abs((element ? element.clientWidth : 0) - rippleX), rippleX) * 2 + 2;
      const sizeY = Math.max(Math.abs((element ? element.clientHeight : 0) - rippleY), rippleY) * 2 + 2;
      rippleSize = Math.sqrt(sizeX ** 2 + sizeY ** 2);
    }

    // Touche devices
    if (event != null && event.touches) {
      // check that this isn't another touchstart due to multitouch
      // otherwise we will only clear a single timer when unmounting while two
      // are running
      if (startTimerCommit.current === null) {
        // Prepare the ripple effect.
        startTimerCommit.current = () => {
          startCommit({
            pulsate,
            rippleX,
            rippleY,
            rippleSize,
            cb
          });
        };
        // Delay the execution of the ripple effect.
        // We have to make a tradeoff with this delay value.
        startTimer.start(DELAY_RIPPLE, () => {
          if (startTimerCommit.current) {
            startTimerCommit.current();
            startTimerCommit.current = null;
          }
        });
      }
    } else {
      startCommit({
        pulsate,
        rippleX,
        rippleY,
        rippleSize,
        cb
      });
    }
  }, [centerProp, startCommit, startTimer]);
  const pulsate = React.useCallback(() => {
    start({}, {
      pulsate: true
    });
  }, [start]);
  const stop = React.useCallback((event, cb) => {
    startTimer.clear();

    // The touch interaction occurs too quickly.
    // We still want to show ripple effect.
    if ((event == null ? void 0 : event.type) === 'touchend' && startTimerCommit.current) {
      startTimerCommit.current();
      startTimerCommit.current = null;
      startTimer.start(0, () => {
        stop(event, cb);
      });
      return;
    }
    startTimerCommit.current = null;
    setRipples(oldRipples => {
      if (oldRipples.length > 0) {
        return oldRipples.slice(1);
      }
      return oldRipples;
    });
    rippleCallback.current = cb;
  }, [startTimer]);
  React.useImperativeHandle(ref, () => ({
    pulsate,
    start,
    stop
  }), [pulsate, start, stop]);
  return /*#__PURE__*/jsxRuntimeExports.jsx(TouchRippleRoot, _extends$2({
    className: clsx(touchRippleClasses$1.root, classes.root, className),
    ref: container
  }, other, {
    children: /*#__PURE__*/jsxRuntimeExports.jsx(TransitionGroup$1, {
      component: null,
      exit: true,
      children: ripples
    })
  }));
});
process.env.NODE_ENV !== "production" ? TouchRipple.propTypes = {
  /**
   * If `true`, the ripple starts at the center of the component
   * rather than at the point of interaction.
   */
  center: PropTypes.bool,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string
} : void 0;
var TouchRipple$1 = TouchRipple;

function getButtonBaseUtilityClass(slot) {
  return generateUtilityClass('MuiButtonBase', slot);
}
const buttonBaseClasses = generateUtilityClasses('MuiButtonBase', ['root', 'disabled', 'focusVisible']);
var buttonBaseClasses$1 = buttonBaseClasses;

const _excluded$j = ["action", "centerRipple", "children", "className", "component", "disabled", "disableRipple", "disableTouchRipple", "focusRipple", "focusVisibleClassName", "LinkComponent", "onBlur", "onClick", "onContextMenu", "onDragLeave", "onFocus", "onFocusVisible", "onKeyDown", "onKeyUp", "onMouseDown", "onMouseLeave", "onMouseUp", "onTouchEnd", "onTouchMove", "onTouchStart", "tabIndex", "TouchRippleProps", "touchRippleRef", "type"];
const useUtilityClasses$g = ownerState => {
  const {
    disabled,
    focusVisible,
    focusVisibleClassName,
    classes
  } = ownerState;
  const slots = {
    root: ['root', disabled && 'disabled', focusVisible && 'focusVisible']
  };
  const composedClasses = composeClasses(slots, getButtonBaseUtilityClass, classes);
  if (focusVisible && focusVisibleClassName) {
    composedClasses.root += ` ${focusVisibleClassName}`;
  }
  return composedClasses;
};
const ButtonBaseRoot = styled$3('button', {
  name: 'MuiButtonBase',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  boxSizing: 'border-box',
  WebkitTapHighlightColor: 'transparent',
  backgroundColor: 'transparent',
  // Reset default value
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0,
  border: 0,
  margin: 0,
  // Remove the margin in Safari
  borderRadius: 0,
  padding: 0,
  // Remove the padding in Firefox
  cursor: 'pointer',
  userSelect: 'none',
  verticalAlign: 'middle',
  MozAppearance: 'none',
  // Reset
  WebkitAppearance: 'none',
  // Reset
  textDecoration: 'none',
  // So we take precedent over the style of a native <a /> element.
  color: 'inherit',
  '&::-moz-focus-inner': {
    borderStyle: 'none' // Remove Firefox dotted outline.
  },
  [`&.${buttonBaseClasses$1.disabled}`]: {
    pointerEvents: 'none',
    // Disable link interactions
    cursor: 'default'
  },
  '@media print': {
    colorAdjust: 'exact'
  }
});

/**
 * `ButtonBase` contains as few styles as possible.
 * It aims to be a simple building block for creating a button.
 * It contains a load of style reset and some focus/ripple logic.
 */
const ButtonBase = /*#__PURE__*/React.forwardRef(function ButtonBase(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiButtonBase'
  });
  const {
      action,
      centerRipple = false,
      children,
      className,
      component = 'button',
      disabled = false,
      disableRipple = false,
      disableTouchRipple = false,
      focusRipple = false,
      LinkComponent = 'a',
      onBlur,
      onClick,
      onContextMenu,
      onDragLeave,
      onFocus,
      onFocusVisible,
      onKeyDown,
      onKeyUp,
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onTouchEnd,
      onTouchMove,
      onTouchStart,
      tabIndex = 0,
      TouchRippleProps,
      touchRippleRef,
      type
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$j);
  const buttonRef = React.useRef(null);
  const rippleRef = React.useRef(null);
  const handleRippleRef = useForkRef(rippleRef, touchRippleRef);
  const {
    isFocusVisibleRef,
    onFocus: handleFocusVisible,
    onBlur: handleBlurVisible,
    ref: focusVisibleRef
  } = useIsFocusVisible();
  const [focusVisible, setFocusVisible] = React.useState(false);
  if (disabled && focusVisible) {
    setFocusVisible(false);
  }
  React.useImperativeHandle(action, () => ({
    focusVisible: () => {
      setFocusVisible(true);
      buttonRef.current.focus();
    }
  }), []);
  const [mountedState, setMountedState] = React.useState(false);
  React.useEffect(() => {
    setMountedState(true);
  }, []);
  const enableTouchRipple = mountedState && !disableRipple && !disabled;
  React.useEffect(() => {
    if (focusVisible && focusRipple && !disableRipple && mountedState) {
      rippleRef.current.pulsate();
    }
  }, [disableRipple, focusRipple, focusVisible, mountedState]);
  function useRippleHandler(rippleAction, eventCallback, skipRippleAction = disableTouchRipple) {
    return useEventCallback(event => {
      if (eventCallback) {
        eventCallback(event);
      }
      const ignore = skipRippleAction;
      if (!ignore && rippleRef.current) {
        rippleRef.current[rippleAction](event);
      }
      return true;
    });
  }
  const handleMouseDown = useRippleHandler('start', onMouseDown);
  const handleContextMenu = useRippleHandler('stop', onContextMenu);
  const handleDragLeave = useRippleHandler('stop', onDragLeave);
  const handleMouseUp = useRippleHandler('stop', onMouseUp);
  const handleMouseLeave = useRippleHandler('stop', event => {
    if (focusVisible) {
      event.preventDefault();
    }
    if (onMouseLeave) {
      onMouseLeave(event);
    }
  });
  const handleTouchStart = useRippleHandler('start', onTouchStart);
  const handleTouchEnd = useRippleHandler('stop', onTouchEnd);
  const handleTouchMove = useRippleHandler('stop', onTouchMove);
  const handleBlur = useRippleHandler('stop', event => {
    handleBlurVisible(event);
    if (isFocusVisibleRef.current === false) {
      setFocusVisible(false);
    }
    if (onBlur) {
      onBlur(event);
    }
  }, false);
  const handleFocus = useEventCallback(event => {
    // Fix for https://github.com/facebook/react/issues/7769
    if (!buttonRef.current) {
      buttonRef.current = event.currentTarget;
    }
    handleFocusVisible(event);
    if (isFocusVisibleRef.current === true) {
      setFocusVisible(true);
      if (onFocusVisible) {
        onFocusVisible(event);
      }
    }
    if (onFocus) {
      onFocus(event);
    }
  });
  const isNonNativeButton = () => {
    const button = buttonRef.current;
    return component && component !== 'button' && !(button.tagName === 'A' && button.href);
  };

  /**
   * IE11 shim for https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
   */
  const keydownRef = React.useRef(false);
  const handleKeyDown = useEventCallback(event => {
    // Check if key is already down to avoid repeats being counted as multiple activations
    if (focusRipple && !keydownRef.current && focusVisible && rippleRef.current && event.key === ' ') {
      keydownRef.current = true;
      rippleRef.current.stop(event, () => {
        rippleRef.current.start(event);
      });
    }
    if (event.target === event.currentTarget && isNonNativeButton() && event.key === ' ') {
      event.preventDefault();
    }
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Keyboard accessibility for non interactive elements
    if (event.target === event.currentTarget && isNonNativeButton() && event.key === 'Enter' && !disabled) {
      event.preventDefault();
      if (onClick) {
        onClick(event);
      }
    }
  });
  const handleKeyUp = useEventCallback(event => {
    // calling preventDefault in keyUp on a <button> will not dispatch a click event if Space is pressed
    // https://codesandbox.io/p/sandbox/button-keyup-preventdefault-dn7f0
    if (focusRipple && event.key === ' ' && rippleRef.current && focusVisible && !event.defaultPrevented) {
      keydownRef.current = false;
      rippleRef.current.stop(event, () => {
        rippleRef.current.pulsate(event);
      });
    }
    if (onKeyUp) {
      onKeyUp(event);
    }

    // Keyboard accessibility for non interactive elements
    if (onClick && event.target === event.currentTarget && isNonNativeButton() && event.key === ' ' && !event.defaultPrevented) {
      onClick(event);
    }
  });
  let ComponentProp = component;
  if (ComponentProp === 'button' && (other.href || other.to)) {
    ComponentProp = LinkComponent;
  }
  const buttonProps = {};
  if (ComponentProp === 'button') {
    buttonProps.type = type === undefined ? 'button' : type;
    buttonProps.disabled = disabled;
  } else {
    if (!other.href && !other.to) {
      buttonProps.role = 'button';
    }
    if (disabled) {
      buttonProps['aria-disabled'] = disabled;
    }
  }
  const handleRef = useForkRef(ref, focusVisibleRef, buttonRef);
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (enableTouchRipple && !rippleRef.current) {
        console.error(['MUI: The `component` prop provided to ButtonBase is invalid.', 'Please make sure the children prop is rendered in this custom component.'].join('\n'));
      }
    }, [enableTouchRipple]);
  }
  const ownerState = _extends$2({}, props, {
    centerRipple,
    component,
    disabled,
    disableRipple,
    disableTouchRipple,
    focusRipple,
    tabIndex,
    focusVisible
  });
  const classes = useUtilityClasses$g(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsxs(ButtonBaseRoot, _extends$2({
    as: ComponentProp,
    className: clsx(classes.root, className),
    ownerState: ownerState,
    onBlur: handleBlur,
    onClick: onClick,
    onContextMenu: handleContextMenu,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    onMouseDown: handleMouseDown,
    onMouseLeave: handleMouseLeave,
    onMouseUp: handleMouseUp,
    onDragLeave: handleDragLeave,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onTouchStart: handleTouchStart,
    ref: handleRef,
    tabIndex: disabled ? -1 : tabIndex,
    type: type
  }, buttonProps, other, {
    children: [children, enableTouchRipple ?
    /*#__PURE__*/
    /* TouchRipple is only needed client-side, x2 boost on the server. */
    jsxRuntimeExports.jsx(TouchRipple$1, _extends$2({
      ref: handleRippleRef,
      center: centerRipple
    }, TouchRippleProps)) : null]
  }));
});
process.env.NODE_ENV !== "production" ? ButtonBase.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref for imperative actions.
   * It currently only supports `focusVisible()` action.
   */
  action: refType$1,
  /**
   * If `true`, the ripples are centered.
   * They won't start at the cursor interaction position.
   * @default false
   */
  centerRipple: PropTypes.bool,
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: elementTypeAcceptingRef$1,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: PropTypes.bool,
  /**
   * If `true`, the touch ripple effect is disabled.
   * @default false
   */
  disableTouchRipple: PropTypes.bool,
  /**
   * If `true`, the base button will have a keyboard focus ripple.
   * @default false
   */
  focusRipple: PropTypes.bool,
  /**
   * This prop can help identify which element has keyboard focus.
   * The class name will be applied when the element gains the focus through keyboard interaction.
   * It's a polyfill for the [CSS :focus-visible selector](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo).
   * The rationale for using this feature [is explained here](https://github.com/WICG/focus-visible/blob/HEAD/explainer.md).
   * A [polyfill can be used](https://github.com/WICG/focus-visible) to apply a `focus-visible` class to other components
   * if needed.
   */
  focusVisibleClassName: PropTypes.string,
  /**
   * @ignore
   */
  href: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * The component used to render a link when the `href` prop is provided.
   * @default 'a'
   */
  LinkComponent: PropTypes.elementType,
  /**
   * @ignore
   */
  onBlur: PropTypes.func,
  /**
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * @ignore
   */
  onContextMenu: PropTypes.func,
  /**
   * @ignore
   */
  onDragLeave: PropTypes.func,
  /**
   * @ignore
   */
  onFocus: PropTypes.func,
  /**
   * Callback fired when the component is focused with a keyboard.
   * We trigger a `onFocus` callback too.
   */
  onFocusVisible: PropTypes.func,
  /**
   * @ignore
   */
  onKeyDown: PropTypes.func,
  /**
   * @ignore
   */
  onKeyUp: PropTypes.func,
  /**
   * @ignore
   */
  onMouseDown: PropTypes.func,
  /**
   * @ignore
   */
  onMouseLeave: PropTypes.func,
  /**
   * @ignore
   */
  onMouseUp: PropTypes.func,
  /**
   * @ignore
   */
  onTouchEnd: PropTypes.func,
  /**
   * @ignore
   */
  onTouchMove: PropTypes.func,
  /**
   * @ignore
   */
  onTouchStart: PropTypes.func,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * @default 0
   */
  tabIndex: PropTypes.number,
  /**
   * Props applied to the `TouchRipple` element.
   */
  TouchRippleProps: PropTypes.object,
  /**
   * A ref that points to the `TouchRipple` element.
   */
  touchRippleRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({
    current: PropTypes.shape({
      pulsate: PropTypes.func.isRequired,
      start: PropTypes.func.isRequired,
      stop: PropTypes.func.isRequired
    })
  })]),
  /**
   * @ignore
   */
  type: PropTypes.oneOfType([PropTypes.oneOf(['button', 'reset', 'submit']), PropTypes.string])
} : void 0;
var ButtonBase$1 = ButtonBase;

function getIconButtonUtilityClass(slot) {
  return generateUtilityClass('MuiIconButton', slot);
}
const iconButtonClasses = generateUtilityClasses('MuiIconButton', ['root', 'disabled', 'colorInherit', 'colorPrimary', 'colorSecondary', 'colorError', 'colorInfo', 'colorSuccess', 'colorWarning', 'edgeStart', 'edgeEnd', 'sizeSmall', 'sizeMedium', 'sizeLarge']);
var iconButtonClasses$1 = iconButtonClasses;

const _excluded$i = ["edge", "children", "className", "color", "disabled", "disableFocusRipple", "size"];
const useUtilityClasses$f = ownerState => {
  const {
    classes,
    disabled,
    color,
    edge,
    size
  } = ownerState;
  const slots = {
    root: ['root', disabled && 'disabled', color !== 'default' && `color${capitalize$1(color)}`, edge && `edge${capitalize$1(edge)}`, `size${capitalize$1(size)}`]
  };
  return composeClasses(slots, getIconButtonUtilityClass, classes);
};
const IconButtonRoot = styled$3(ButtonBase$1, {
  name: 'MuiIconButton',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.color !== 'default' && styles[`color${capitalize$1(ownerState.color)}`], ownerState.edge && styles[`edge${capitalize$1(ownerState.edge)}`], styles[`size${capitalize$1(ownerState.size)}`]];
  }
})(({
  theme,
  ownerState
}) => _extends$2({
  textAlign: 'center',
  flex: '0 0 auto',
  fontSize: theme.typography.pxToRem(24),
  padding: 8,
  borderRadius: '50%',
  overflow: 'visible',
  // Explicitly set the default value to solve a bug on IE11.
  color: (theme.vars || theme).palette.action.active,
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.shortest
  })
}, !ownerState.disableRipple && {
  '&:hover': {
    backgroundColor: theme.vars ? `rgba(${theme.vars.palette.action.activeChannel} / ${theme.vars.palette.action.hoverOpacity})` : colorManipulatorExports.alpha(theme.palette.action.active, theme.palette.action.hoverOpacity),
    // Reset on touch devices, it doesn't add specificity
    '@media (hover: none)': {
      backgroundColor: 'transparent'
    }
  }
}, ownerState.edge === 'start' && {
  marginLeft: ownerState.size === 'small' ? -3 : -12
}, ownerState.edge === 'end' && {
  marginRight: ownerState.size === 'small' ? -3 : -12
}), ({
  theme,
  ownerState
}) => {
  var _palette;
  const palette = (_palette = (theme.vars || theme).palette) == null ? void 0 : _palette[ownerState.color];
  return _extends$2({}, ownerState.color === 'inherit' && {
    color: 'inherit'
  }, ownerState.color !== 'inherit' && ownerState.color !== 'default' && _extends$2({
    color: palette == null ? void 0 : palette.main
  }, !ownerState.disableRipple && {
    '&:hover': _extends$2({}, palette && {
      backgroundColor: theme.vars ? `rgba(${palette.mainChannel} / ${theme.vars.palette.action.hoverOpacity})` : colorManipulatorExports.alpha(palette.main, theme.palette.action.hoverOpacity)
    }, {
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent'
      }
    })
  }), ownerState.size === 'small' && {
    padding: 5,
    fontSize: theme.typography.pxToRem(18)
  }, ownerState.size === 'large' && {
    padding: 12,
    fontSize: theme.typography.pxToRem(28)
  }, {
    [`&.${iconButtonClasses$1.disabled}`]: {
      backgroundColor: 'transparent',
      color: (theme.vars || theme).palette.action.disabled
    }
  });
});

/**
 * Refer to the [Icons](/material-ui/icons/) section of the documentation
 * regarding the available icon options.
 */
const IconButton = /*#__PURE__*/React.forwardRef(function IconButton(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiIconButton'
  });
  const {
      edge = false,
      children,
      className,
      color = 'default',
      disabled = false,
      disableFocusRipple = false,
      size = 'medium'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$i);
  const ownerState = _extends$2({}, props, {
    edge,
    color,
    disabled,
    disableFocusRipple,
    size
  });
  const classes = useUtilityClasses$f(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(IconButtonRoot, _extends$2({
    className: clsx(classes.root, className),
    centerRipple: true,
    focusRipple: !disableFocusRipple,
    disabled: disabled,
    ref: ref
  }, other, {
    ownerState: ownerState,
    children: children
  }));
});
process.env.NODE_ENV !== "production" ? IconButton.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The icon to display.
   */
  children: chainPropTypes(PropTypes.node, props => {
    const found = React.Children.toArray(props.children).some(child => /*#__PURE__*/React.isValidElement(child) && child.props.onClick);
    if (found) {
      return new Error(['MUI: You are providing an onClick event listener to a child of a button element.', 'Prefer applying it to the IconButton directly.', 'This guarantees that the whole <button> will be responsive to click events.'].join('\n'));
    }
    return null;
  }),
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'default'
   */
  color: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['inherit', 'default', 'primary', 'secondary', 'error', 'info', 'success', 'warning']), PropTypes.string]),
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the  keyboard focus ripple is disabled.
   * @default false
   */
  disableFocusRipple: PropTypes.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: PropTypes.bool,
  /**
   * If given, uses a negative margin to counteract the padding on one
   * side (this is often helpful for aligning the left or right
   * side of the icon with content above or below, without ruining the border
   * size and shape).
   * @default false
   */
  edge: PropTypes.oneOf(['end', 'start', false]),
  /**
   * The size of the component.
   * `small` is equivalent to the dense button styling.
   * @default 'medium'
   */
  size: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['small', 'medium', 'large']), PropTypes.string]),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var IconButton$1 = IconButton;

function getSvgIconUtilityClass(slot) {
  return generateUtilityClass('MuiSvgIcon', slot);
}
generateUtilityClasses('MuiSvgIcon', ['root', 'colorPrimary', 'colorSecondary', 'colorAction', 'colorError', 'colorDisabled', 'fontSizeInherit', 'fontSizeSmall', 'fontSizeMedium', 'fontSizeLarge']);

const _excluded$h = ["children", "className", "color", "component", "fontSize", "htmlColor", "inheritViewBox", "titleAccess", "viewBox"];
const useUtilityClasses$e = ownerState => {
  const {
    color,
    fontSize,
    classes
  } = ownerState;
  const slots = {
    root: ['root', color !== 'inherit' && `color${capitalize$1(color)}`, `fontSize${capitalize$1(fontSize)}`]
  };
  return composeClasses(slots, getSvgIconUtilityClass, classes);
};
const SvgIconRoot = styled$3('svg', {
  name: 'MuiSvgIcon',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.color !== 'inherit' && styles[`color${capitalize$1(ownerState.color)}`], styles[`fontSize${capitalize$1(ownerState.fontSize)}`]];
  }
})(({
  theme,
  ownerState
}) => {
  var _theme$transitions, _theme$transitions$cr, _theme$transitions2, _theme$typography, _theme$typography$pxT, _theme$typography2, _theme$typography2$px, _theme$typography3, _theme$typography3$px, _palette$ownerState$c, _palette, _palette2, _palette3;
  return {
    userSelect: 'none',
    width: '1em',
    height: '1em',
    display: 'inline-block',
    // the <svg> will define the property that has `currentColor`
    // for example heroicons uses fill="none" and stroke="currentColor"
    fill: ownerState.hasSvgAsChild ? undefined : 'currentColor',
    flexShrink: 0,
    transition: (_theme$transitions = theme.transitions) == null || (_theme$transitions$cr = _theme$transitions.create) == null ? void 0 : _theme$transitions$cr.call(_theme$transitions, 'fill', {
      duration: (_theme$transitions2 = theme.transitions) == null || (_theme$transitions2 = _theme$transitions2.duration) == null ? void 0 : _theme$transitions2.shorter
    }),
    fontSize: {
      inherit: 'inherit',
      small: ((_theme$typography = theme.typography) == null || (_theme$typography$pxT = _theme$typography.pxToRem) == null ? void 0 : _theme$typography$pxT.call(_theme$typography, 20)) || '1.25rem',
      medium: ((_theme$typography2 = theme.typography) == null || (_theme$typography2$px = _theme$typography2.pxToRem) == null ? void 0 : _theme$typography2$px.call(_theme$typography2, 24)) || '1.5rem',
      large: ((_theme$typography3 = theme.typography) == null || (_theme$typography3$px = _theme$typography3.pxToRem) == null ? void 0 : _theme$typography3$px.call(_theme$typography3, 35)) || '2.1875rem'
    }[ownerState.fontSize],
    // TODO v5 deprecate, v6 remove for sx
    color: (_palette$ownerState$c = (_palette = (theme.vars || theme).palette) == null || (_palette = _palette[ownerState.color]) == null ? void 0 : _palette.main) != null ? _palette$ownerState$c : {
      action: (_palette2 = (theme.vars || theme).palette) == null || (_palette2 = _palette2.action) == null ? void 0 : _palette2.active,
      disabled: (_palette3 = (theme.vars || theme).palette) == null || (_palette3 = _palette3.action) == null ? void 0 : _palette3.disabled,
      inherit: undefined
    }[ownerState.color]
  };
});
const SvgIcon = /*#__PURE__*/React.forwardRef(function SvgIcon(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiSvgIcon'
  });
  const {
      children,
      className,
      color = 'inherit',
      component = 'svg',
      fontSize = 'medium',
      htmlColor,
      inheritViewBox = false,
      titleAccess,
      viewBox = '0 0 24 24'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$h);
  const hasSvgAsChild = /*#__PURE__*/React.isValidElement(children) && children.type === 'svg';
  const ownerState = _extends$2({}, props, {
    color,
    component,
    fontSize,
    instanceFontSize: inProps.fontSize,
    inheritViewBox,
    viewBox,
    hasSvgAsChild
  });
  const more = {};
  if (!inheritViewBox) {
    more.viewBox = viewBox;
  }
  const classes = useUtilityClasses$e(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsxs(SvgIconRoot, _extends$2({
    as: component,
    className: clsx(classes.root, className),
    focusable: "false",
    color: htmlColor,
    "aria-hidden": titleAccess ? undefined : true,
    role: titleAccess ? 'img' : undefined,
    ref: ref
  }, more, other, hasSvgAsChild && children.props, {
    ownerState: ownerState,
    children: [hasSvgAsChild ? children.props.children : children, titleAccess ? /*#__PURE__*/jsxRuntimeExports.jsx("title", {
      children: titleAccess
    }) : null]
  }));
});
process.env.NODE_ENV !== "production" ? SvgIcon.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Node passed into the SVG element.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * You can use the `htmlColor` prop to apply a color attribute to the SVG element.
   * @default 'inherit'
   */
  color: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['inherit', 'action', 'disabled', 'primary', 'secondary', 'error', 'info', 'success', 'warning']), PropTypes.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The fontSize applied to the icon. Defaults to 24px, but can be configure to inherit font size.
   * @default 'medium'
   */
  fontSize: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['inherit', 'large', 'medium', 'small']), PropTypes.string]),
  /**
   * Applies a color attribute to the SVG element.
   */
  htmlColor: PropTypes.string,
  /**
   * If `true`, the root node will inherit the custom `component`'s viewBox and the `viewBox`
   * prop will be ignored.
   * Useful when you want to reference a custom `component` and have `SvgIcon` pass that
   * `component`'s viewBox to the root node.
   * @default false
   */
  inheritViewBox: PropTypes.bool,
  /**
   * The shape-rendering attribute. The behavior of the different options is described on the
   * [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering).
   * If you are having issues with blurry icons you should investigate this prop.
   */
  shapeRendering: PropTypes.string,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * Provides a human-readable title for the element that contains it.
   * https://www.w3.org/TR/SVG-access/#Equivalent
   */
  titleAccess: PropTypes.string,
  /**
   * Allows you to redefine what the coordinates without units mean inside an SVG element.
   * For example, if the SVG element is 500 (width) by 200 (height),
   * and you pass viewBox="0 0 50 20",
   * this means that the coordinates inside the SVG will go from the top left corner (0,0)
   * to bottom right (50,20) and each unit will be worth 10px.
   * @default '0 0 24 24'
   */
  viewBox: PropTypes.string
} : void 0;
SvgIcon.muiName = 'SvgIcon';
var SvgIcon$1 = SvgIcon;

function createSvgIcon(path, displayName) {
  function Component(props, ref) {
    return /*#__PURE__*/jsxRuntimeExports.jsx(SvgIcon$1, _extends$2({
      "data-testid": `${displayName}Icon`,
      ref: ref
    }, props, {
      children: path
    }));
  }
  if (process.env.NODE_ENV !== 'production') {
    // Need to set `displayName` on the inner component for React.memo.
    // React prior to 16.14 ignores `displayName` on the wrapper.
    Component.displayName = `${displayName}Icon`;
  }
  Component.muiName = SvgIcon$1.muiName;
  return /*#__PURE__*/React.memo( /*#__PURE__*/React.forwardRef(Component));
}

const AlertContext = /*#__PURE__*/createContext();
const useAlert = () => {
  return useContext(AlertContext);
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

function getTypographyUtilityClass(slot) {
  return generateUtilityClass('MuiTypography', slot);
}
generateUtilityClasses('MuiTypography', ['root', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'inherit', 'button', 'caption', 'overline', 'alignLeft', 'alignRight', 'alignCenter', 'alignJustify', 'noWrap', 'gutterBottom', 'paragraph']);

const _excluded$g = ["align", "className", "component", "gutterBottom", "noWrap", "paragraph", "variant", "variantMapping"];
const useUtilityClasses$d = ownerState => {
  const {
    align,
    gutterBottom,
    noWrap,
    paragraph,
    variant,
    classes
  } = ownerState;
  const slots = {
    root: ['root', variant, ownerState.align !== 'inherit' && `align${capitalize$1(align)}`, gutterBottom && 'gutterBottom', noWrap && 'noWrap', paragraph && 'paragraph']
  };
  return composeClasses(slots, getTypographyUtilityClass, classes);
};
const TypographyRoot = styled$3('span', {
  name: 'MuiTypography',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.variant && styles[ownerState.variant], ownerState.align !== 'inherit' && styles[`align${capitalize$1(ownerState.align)}`], ownerState.noWrap && styles.noWrap, ownerState.gutterBottom && styles.gutterBottom, ownerState.paragraph && styles.paragraph];
  }
})(({
  theme,
  ownerState
}) => _extends$2({
  margin: 0
}, ownerState.variant === 'inherit' && {
  // Some elements, like <button> on Chrome have default font that doesn't inherit, reset this.
  font: 'inherit'
}, ownerState.variant !== 'inherit' && theme.typography[ownerState.variant], ownerState.align !== 'inherit' && {
  textAlign: ownerState.align
}, ownerState.noWrap && {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}, ownerState.gutterBottom && {
  marginBottom: '0.35em'
}, ownerState.paragraph && {
  marginBottom: 16
}));
const defaultVariantMapping = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  inherit: 'p'
};

// TODO v6: deprecate these color values in v5.x and remove the transformation in v6
const colorTransformations = {
  primary: 'primary.main',
  textPrimary: 'text.primary',
  secondary: 'secondary.main',
  textSecondary: 'text.secondary',
  error: 'error.main'
};
const transformDeprecatedColors = color => {
  return colorTransformations[color] || color;
};
const Typography = /*#__PURE__*/React.forwardRef(function Typography(inProps, ref) {
  const themeProps = useDefaultProps({
    props: inProps,
    name: 'MuiTypography'
  });
  const color = transformDeprecatedColors(themeProps.color);
  const props = extendSxProp(_extends$2({}, themeProps, {
    color
  }));
  const {
      align = 'inherit',
      className,
      component,
      gutterBottom = false,
      noWrap = false,
      paragraph = false,
      variant = 'body1',
      variantMapping = defaultVariantMapping
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$g);
  const ownerState = _extends$2({}, props, {
    align,
    color,
    className,
    component,
    gutterBottom,
    noWrap,
    paragraph,
    variant,
    variantMapping
  });
  const Component = component || (paragraph ? 'p' : variantMapping[variant] || defaultVariantMapping[variant]) || 'span';
  const classes = useUtilityClasses$d(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(TypographyRoot, _extends$2({
    as: Component,
    ref: ref,
    ownerState: ownerState,
    className: clsx(classes.root, className)
  }, other));
});
process.env.NODE_ENV !== "production" ? Typography.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Set the text-align on the component.
   * @default 'inherit'
   */
  align: PropTypes.oneOf(['center', 'inherit', 'justify', 'left', 'right']),
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * If `true`, the text will have a bottom margin.
   * @default false
   */
  gutterBottom: PropTypes.bool,
  /**
   * If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   *
   * Note that text overflow can only happen with block or inline-block level elements
   * (the element needs to have a width in order to overflow).
   * @default false
   */
  noWrap: PropTypes.bool,
  /**
   * If `true`, the element will be a paragraph element.
   * @default false
   */
  paragraph: PropTypes.bool,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * Applies the theme typography styles.
   * @default 'body1'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['body1', 'body2', 'button', 'caption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'inherit', 'overline', 'subtitle1', 'subtitle2']), PropTypes.string]),
  /**
   * The component maps the variant prop to a range of different HTML element types.
   * For instance, subtitle1 to `<h6>`.
   * If you wish to change that mapping, you can provide your own.
   * Alternatively, you can use the `component` prop.
   * @default {
   *   h1: 'h1',
   *   h2: 'h2',
   *   h3: 'h3',
   *   h4: 'h4',
   *   h5: 'h5',
   *   h6: 'h6',
   *   subtitle1: 'h6',
   *   subtitle2: 'h6',
   *   body1: 'p',
   *   body2: 'p',
   *   inherit: 'p',
   * }
   */
  variantMapping: PropTypes /* @typescript-to-proptypes-ignore */.object
} : void 0;
var Typography$1 = Typography;

var MoreHorizIcon = createSvgIcon( /*#__PURE__*/jsxRuntimeExports.jsx("path", {
  d: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
}), 'MoreHoriz');

const _excluded$f = ["slots", "slotProps"];
const BreadcrumbCollapsedButton = styled$3(ButtonBase$1, {
  name: 'MuiBreadcrumbCollapsed'
})(({
  theme
}) => _extends$2({
  display: 'flex',
  marginLeft: `calc(${theme.spacing(1)} * 0.5)`,
  marginRight: `calc(${theme.spacing(1)} * 0.5)`
}, theme.palette.mode === 'light' ? {
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.grey[700]
} : {
  backgroundColor: theme.palette.grey[700],
  color: theme.palette.grey[100]
}, {
  borderRadius: 2,
  '&:hover, &:focus': _extends$2({}, theme.palette.mode === 'light' ? {
    backgroundColor: theme.palette.grey[200]
  } : {
    backgroundColor: theme.palette.grey[600]
  }),
  '&:active': _extends$2({
    boxShadow: theme.shadows[0]
  }, theme.palette.mode === 'light' ? {
    backgroundColor: colorManipulatorExports.emphasize(theme.palette.grey[200], 0.12)
  } : {
    backgroundColor: colorManipulatorExports.emphasize(theme.palette.grey[600], 0.12)
  })
}));
const BreadcrumbCollapsedIcon = styled$3(MoreHorizIcon)({
  width: 24,
  height: 16
});

/**
 * @ignore - internal component.
 */
function BreadcrumbCollapsed(props) {
  const {
      slots = {},
      slotProps = {}
    } = props,
    otherProps = _objectWithoutPropertiesLoose(props, _excluded$f);
  const ownerState = props;
  return /*#__PURE__*/jsxRuntimeExports.jsx("li", {
    children: /*#__PURE__*/jsxRuntimeExports.jsx(BreadcrumbCollapsedButton, _extends$2({
      focusRipple: true
    }, otherProps, {
      ownerState: ownerState,
      children: /*#__PURE__*/jsxRuntimeExports.jsx(BreadcrumbCollapsedIcon, _extends$2({
        as: slots.CollapsedIcon,
        ownerState: ownerState
      }, slotProps.collapsedIcon))
    }))
  });
}
process.env.NODE_ENV !== "production" ? BreadcrumbCollapsed.propTypes = {
  /**
   * The props used for the CollapsedIcon slot.
   * @default {}
   */
  slotProps: PropTypes.shape({
    collapsedIcon: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  }),
  /**
   * The components used for each slot inside the BreadcumbCollapsed.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    CollapsedIcon: PropTypes.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.object
} : void 0;

function getBreadcrumbsUtilityClass(slot) {
  return generateUtilityClass('MuiBreadcrumbs', slot);
}
const breadcrumbsClasses = generateUtilityClasses('MuiBreadcrumbs', ['root', 'ol', 'li', 'separator']);
var breadcrumbsClasses$1 = breadcrumbsClasses;

const _excluded$e = ["children", "className", "component", "slots", "slotProps", "expandText", "itemsAfterCollapse", "itemsBeforeCollapse", "maxItems", "separator"];
const useUtilityClasses$c = ownerState => {
  const {
    classes
  } = ownerState;
  const slots = {
    root: ['root'],
    li: ['li'],
    ol: ['ol'],
    separator: ['separator']
  };
  return composeClasses(slots, getBreadcrumbsUtilityClass, classes);
};
const BreadcrumbsRoot = styled$3(Typography$1, {
  name: 'MuiBreadcrumbs',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    return [{
      [`& .${breadcrumbsClasses$1.li}`]: styles.li
    }, styles.root];
  }
})({});
const BreadcrumbsOl = styled$3('ol', {
  name: 'MuiBreadcrumbs',
  slot: 'Ol',
  overridesResolver: (props, styles) => styles.ol
})({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: 0,
  margin: 0,
  listStyle: 'none'
});
const BreadcrumbsSeparator = styled$3('li', {
  name: 'MuiBreadcrumbs',
  slot: 'Separator',
  overridesResolver: (props, styles) => styles.separator
})({
  display: 'flex',
  userSelect: 'none',
  marginLeft: 8,
  marginRight: 8
});
function insertSeparators(items, className, separator, ownerState) {
  return items.reduce((acc, current, index) => {
    if (index < items.length - 1) {
      acc = acc.concat(current, /*#__PURE__*/jsxRuntimeExports.jsx(BreadcrumbsSeparator, {
        "aria-hidden": true,
        className: className,
        ownerState: ownerState,
        children: separator
      }, `separator-${index}`));
    } else {
      acc.push(current);
    }
    return acc;
  }, []);
}
const Breadcrumbs = /*#__PURE__*/React.forwardRef(function Breadcrumbs(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiBreadcrumbs'
  });
  const {
      children,
      className,
      component = 'nav',
      slots = {},
      slotProps = {},
      expandText = 'Show path',
      itemsAfterCollapse = 1,
      itemsBeforeCollapse = 1,
      maxItems = 8,
      separator = '/'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$e);
  const [expanded, setExpanded] = React.useState(false);
  const ownerState = _extends$2({}, props, {
    component,
    expanded,
    expandText,
    itemsAfterCollapse,
    itemsBeforeCollapse,
    maxItems,
    separator
  });
  const classes = useUtilityClasses$c(ownerState);
  const collapsedIconSlotProps = useSlotProps({
    elementType: slots.CollapsedIcon,
    externalSlotProps: slotProps.collapsedIcon,
    ownerState
  });
  const listRef = React.useRef(null);
  const renderItemsBeforeAndAfter = allItems => {
    const handleClickExpand = () => {
      setExpanded(true);

      // The clicked element received the focus but gets removed from the DOM.
      // Let's keep the focus in the component after expanding.
      // Moving it to the <ol> or <nav> does not cause any announcement in NVDA.
      // By moving it to some link/button at least we have some announcement.
      const focusable = listRef.current.querySelector('a[href],button,[tabindex]');
      if (focusable) {
        focusable.focus();
      }
    };

    // This defends against someone passing weird input, to ensure that if all
    // items would be shown anyway, we just show all items without the EllipsisItem
    if (itemsBeforeCollapse + itemsAfterCollapse >= allItems.length) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(['MUI: You have provided an invalid combination of props to the Breadcrumbs.', `itemsAfterCollapse={${itemsAfterCollapse}} + itemsBeforeCollapse={${itemsBeforeCollapse}} >= maxItems={${maxItems}}`].join('\n'));
      }
      return allItems;
    }
    return [...allItems.slice(0, itemsBeforeCollapse), /*#__PURE__*/jsxRuntimeExports.jsx(BreadcrumbCollapsed, {
      "aria-label": expandText,
      slots: {
        CollapsedIcon: slots.CollapsedIcon
      },
      slotProps: {
        collapsedIcon: collapsedIconSlotProps
      },
      onClick: handleClickExpand
    }, "ellipsis"), ...allItems.slice(allItems.length - itemsAfterCollapse, allItems.length)];
  };
  const allItems = React.Children.toArray(children).filter(child => {
    if (process.env.NODE_ENV !== 'production') {
      if (reactIsExports.isFragment(child)) {
        console.error(["MUI: The Breadcrumbs component doesn't accept a Fragment as a child.", 'Consider providing an array instead.'].join('\n'));
      }
    }
    return /*#__PURE__*/React.isValidElement(child);
  }).map((child, index) => /*#__PURE__*/jsxRuntimeExports.jsx("li", {
    className: classes.li,
    children: child
  }, `child-${index}`));
  return /*#__PURE__*/jsxRuntimeExports.jsx(BreadcrumbsRoot, _extends$2({
    ref: ref,
    component: component,
    color: "text.secondary",
    className: clsx(classes.root, className),
    ownerState: ownerState
  }, other, {
    children: /*#__PURE__*/jsxRuntimeExports.jsx(BreadcrumbsOl, {
      className: classes.ol,
      ref: listRef,
      ownerState: ownerState,
      children: insertSeparators(expanded || maxItems && allItems.length <= maxItems ? allItems : renderItemsBeforeAndAfter(allItems), classes.separator, separator, ownerState)
    })
  }));
});
process.env.NODE_ENV !== "production" ? Breadcrumbs.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * Override the default label for the expand button.
   *
   * For localization purposes, you can use the provided [translations](/material-ui/guides/localization/).
   * @default 'Show path'
   */
  expandText: PropTypes.string,
  /**
   * If max items is exceeded, the number of items to show after the ellipsis.
   * @default 1
   */
  itemsAfterCollapse: integerPropType,
  /**
   * If max items is exceeded, the number of items to show before the ellipsis.
   * @default 1
   */
  itemsBeforeCollapse: integerPropType,
  /**
   * Specifies the maximum number of breadcrumbs to display. When there are more
   * than the maximum number, only the first `itemsBeforeCollapse` and last `itemsAfterCollapse`
   * will be shown, with an ellipsis in between.
   * @default 8
   */
  maxItems: integerPropType,
  /**
   * Custom separator node.
   * @default '/'
   */
  separator: PropTypes.node,
  /**
   * The props used for each slot inside the Breadcumb.
   * @default {}
   */
  slotProps: PropTypes.shape({
    collapsedIcon: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  }),
  /**
   * The components used for each slot inside the Breadcumb.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    CollapsedIcon: PropTypes.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var Breadcrumbs$1 = Breadcrumbs;

const boxClasses = generateUtilityClasses('MuiBox', ['root']);
var boxClasses$1 = boxClasses;

const defaultTheme = createTheme();
const Box = createBox({
  themeId: THEME_ID,
  defaultTheme,
  defaultClassName: boxClasses$1.root,
  generateClassName: ClassNameGenerator$1.generate
});
process.env.NODE_ENV !== "production" ? Box.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var Box$1 = Box;

/**
 * @ignore - internal component.
 */
const TableContext = /*#__PURE__*/React.createContext();
if (process.env.NODE_ENV !== 'production') {
  TableContext.displayName = 'TableContext';
}
var TableContext$1 = TableContext;

function getTableUtilityClass(slot) {
  return generateUtilityClass('MuiTable', slot);
}
generateUtilityClasses('MuiTable', ['root', 'stickyHeader']);

const _excluded$d = ["className", "component", "padding", "size", "stickyHeader"];
const useUtilityClasses$b = ownerState => {
  const {
    classes,
    stickyHeader
  } = ownerState;
  const slots = {
    root: ['root', stickyHeader && 'stickyHeader']
  };
  return composeClasses(slots, getTableUtilityClass, classes);
};
const TableRoot = styled$3('table', {
  name: 'MuiTable',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.stickyHeader && styles.stickyHeader];
  }
})(({
  theme,
  ownerState
}) => _extends$2({
  display: 'table',
  width: '100%',
  borderCollapse: 'collapse',
  borderSpacing: 0,
  '& caption': _extends$2({}, theme.typography.body2, {
    padding: theme.spacing(2),
    color: (theme.vars || theme).palette.text.secondary,
    textAlign: 'left',
    captionSide: 'bottom'
  })
}, ownerState.stickyHeader && {
  borderCollapse: 'separate'
}));
const defaultComponent$3 = 'table';
const Table = /*#__PURE__*/React.forwardRef(function Table(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTable'
  });
  const {
      className,
      component = defaultComponent$3,
      padding = 'normal',
      size = 'medium',
      stickyHeader = false
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$d);
  const ownerState = _extends$2({}, props, {
    component,
    padding,
    size,
    stickyHeader
  });
  const classes = useUtilityClasses$b(ownerState);
  const table = React.useMemo(() => ({
    padding,
    size,
    stickyHeader
  }), [padding, size, stickyHeader]);
  return /*#__PURE__*/jsxRuntimeExports.jsx(TableContext$1.Provider, {
    value: table,
    children: /*#__PURE__*/jsxRuntimeExports.jsx(TableRoot, _extends$2({
      as: component,
      role: component === defaultComponent$3 ? null : 'table',
      ref: ref,
      className: clsx(classes.root, className),
      ownerState: ownerState
    }, other))
  });
});
process.env.NODE_ENV !== "production" ? Table.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the table, normally `TableHead` and `TableBody`.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * Allows TableCells to inherit padding of the Table.
   * @default 'normal'
   */
  padding: PropTypes.oneOf(['checkbox', 'none', 'normal']),
  /**
   * Allows TableCells to inherit size of the Table.
   * @default 'medium'
   */
  size: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['medium', 'small']), PropTypes.string]),
  /**
   * Set the header sticky.
   *
   * ⚠️ It doesn't work with IE11.
   * @default false
   */
  stickyHeader: PropTypes.bool,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var Table$1 = Table;

/**
 * @ignore - internal component.
 */
const Tablelvl2Context = /*#__PURE__*/React.createContext();
if (process.env.NODE_ENV !== 'production') {
  Tablelvl2Context.displayName = 'Tablelvl2Context';
}
var Tablelvl2Context$1 = Tablelvl2Context;

function getTableBodyUtilityClass(slot) {
  return generateUtilityClass('MuiTableBody', slot);
}
generateUtilityClasses('MuiTableBody', ['root']);

const _excluded$c = ["className", "component"];
const useUtilityClasses$a = ownerState => {
  const {
    classes
  } = ownerState;
  const slots = {
    root: ['root']
  };
  return composeClasses(slots, getTableBodyUtilityClass, classes);
};
const TableBodyRoot = styled$3('tbody', {
  name: 'MuiTableBody',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  display: 'table-row-group'
});
const tablelvl2$1 = {
  variant: 'body'
};
const defaultComponent$2 = 'tbody';
const TableBody = /*#__PURE__*/React.forwardRef(function TableBody(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTableBody'
  });
  const {
      className,
      component = defaultComponent$2
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$c);
  const ownerState = _extends$2({}, props, {
    component
  });
  const classes = useUtilityClasses$a(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(Tablelvl2Context$1.Provider, {
    value: tablelvl2$1,
    children: /*#__PURE__*/jsxRuntimeExports.jsx(TableBodyRoot, _extends$2({
      className: clsx(classes.root, className),
      as: component,
      ref: ref,
      role: component === defaultComponent$2 ? null : 'rowgroup',
      ownerState: ownerState
    }, other))
  });
});
process.env.NODE_ENV !== "production" ? TableBody.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component, normally `TableRow`.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var TableBody$1 = TableBody;

function getTableCellUtilityClass(slot) {
  return generateUtilityClass('MuiTableCell', slot);
}
const tableCellClasses = generateUtilityClasses('MuiTableCell', ['root', 'head', 'body', 'footer', 'sizeSmall', 'sizeMedium', 'paddingCheckbox', 'paddingNone', 'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'stickyHeader']);
var tableCellClasses$1 = tableCellClasses;

const _excluded$b = ["align", "className", "component", "padding", "scope", "size", "sortDirection", "variant"];
const useUtilityClasses$9 = ownerState => {
  const {
    classes,
    variant,
    align,
    padding,
    size,
    stickyHeader
  } = ownerState;
  const slots = {
    root: ['root', variant, stickyHeader && 'stickyHeader', align !== 'inherit' && `align${capitalize$1(align)}`, padding !== 'normal' && `padding${capitalize$1(padding)}`, `size${capitalize$1(size)}`]
  };
  return composeClasses(slots, getTableCellUtilityClass, classes);
};
const TableCellRoot = styled$3('td', {
  name: 'MuiTableCell',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, styles[ownerState.variant], styles[`size${capitalize$1(ownerState.size)}`], ownerState.padding !== 'normal' && styles[`padding${capitalize$1(ownerState.padding)}`], ownerState.align !== 'inherit' && styles[`align${capitalize$1(ownerState.align)}`], ownerState.stickyHeader && styles.stickyHeader];
  }
})(({
  theme,
  ownerState
}) => _extends$2({}, theme.typography.body2, {
  display: 'table-cell',
  verticalAlign: 'inherit',
  // Workaround for a rendering bug with spanned columns in Chrome 62.0.
  // Removes the alpha (sets it to 1), and lightens or darkens the theme color.
  borderBottom: theme.vars ? `1px solid ${theme.vars.palette.TableCell.border}` : `1px solid
    ${theme.palette.mode === 'light' ? colorManipulatorExports.lighten(colorManipulatorExports.alpha(theme.palette.divider, 1), 0.88) : colorManipulatorExports.darken(colorManipulatorExports.alpha(theme.palette.divider, 1), 0.68)}`,
  textAlign: 'left',
  padding: 16
}, ownerState.variant === 'head' && {
  color: (theme.vars || theme).palette.text.primary,
  lineHeight: theme.typography.pxToRem(24),
  fontWeight: theme.typography.fontWeightMedium
}, ownerState.variant === 'body' && {
  color: (theme.vars || theme).palette.text.primary
}, ownerState.variant === 'footer' && {
  color: (theme.vars || theme).palette.text.secondary,
  lineHeight: theme.typography.pxToRem(21),
  fontSize: theme.typography.pxToRem(12)
}, ownerState.size === 'small' && {
  padding: '6px 16px',
  [`&.${tableCellClasses$1.paddingCheckbox}`]: {
    width: 24,
    // prevent the checkbox column from growing
    padding: '0 12px 0 16px',
    '& > *': {
      padding: 0
    }
  }
}, ownerState.padding === 'checkbox' && {
  width: 48,
  // prevent the checkbox column from growing
  padding: '0 0 0 4px'
}, ownerState.padding === 'none' && {
  padding: 0
}, ownerState.align === 'left' && {
  textAlign: 'left'
}, ownerState.align === 'center' && {
  textAlign: 'center'
}, ownerState.align === 'right' && {
  textAlign: 'right',
  flexDirection: 'row-reverse'
}, ownerState.align === 'justify' && {
  textAlign: 'justify'
}, ownerState.stickyHeader && {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  backgroundColor: (theme.vars || theme).palette.background.default
}));

/**
 * The component renders a `<th>` element when the parent context is a header
 * or otherwise a `<td>` element.
 */
const TableCell = /*#__PURE__*/React.forwardRef(function TableCell(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTableCell'
  });
  const {
      align = 'inherit',
      className,
      component: componentProp,
      padding: paddingProp,
      scope: scopeProp,
      size: sizeProp,
      sortDirection,
      variant: variantProp
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$b);
  const table = React.useContext(TableContext$1);
  const tablelvl2 = React.useContext(Tablelvl2Context$1);
  const isHeadCell = tablelvl2 && tablelvl2.variant === 'head';
  let component;
  if (componentProp) {
    component = componentProp;
  } else {
    component = isHeadCell ? 'th' : 'td';
  }
  let scope = scopeProp;
  // scope is not a valid attribute for <td/> elements.
  // source: https://html.spec.whatwg.org/multipage/tables.html#the-td-element
  if (component === 'td') {
    scope = undefined;
  } else if (!scope && isHeadCell) {
    scope = 'col';
  }
  const variant = variantProp || tablelvl2 && tablelvl2.variant;
  const ownerState = _extends$2({}, props, {
    align,
    component,
    padding: paddingProp || (table && table.padding ? table.padding : 'normal'),
    size: sizeProp || (table && table.size ? table.size : 'medium'),
    sortDirection,
    stickyHeader: variant === 'head' && table && table.stickyHeader,
    variant
  });
  const classes = useUtilityClasses$9(ownerState);
  let ariaSort = null;
  if (sortDirection) {
    ariaSort = sortDirection === 'asc' ? 'ascending' : 'descending';
  }
  return /*#__PURE__*/jsxRuntimeExports.jsx(TableCellRoot, _extends$2({
    as: component,
    ref: ref,
    className: clsx(classes.root, className),
    "aria-sort": ariaSort,
    scope: scope,
    ownerState: ownerState
  }, other));
});
process.env.NODE_ENV !== "production" ? TableCell.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Set the text-align on the table cell content.
   *
   * Monetary or generally number fields **should be right aligned** as that allows
   * you to add them up quickly in your head without having to worry about decimals.
   * @default 'inherit'
   */
  align: PropTypes.oneOf(['center', 'inherit', 'justify', 'left', 'right']),
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * Sets the padding applied to the cell.
   * The prop defaults to the value (`'default'`) inherited from the parent Table component.
   */
  padding: PropTypes.oneOf(['checkbox', 'none', 'normal']),
  /**
   * Set scope attribute.
   */
  scope: PropTypes.string,
  /**
   * Specify the size of the cell.
   * The prop defaults to the value (`'medium'`) inherited from the parent Table component.
   */
  size: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['medium', 'small']), PropTypes.string]),
  /**
   * Set aria-sort direction.
   */
  sortDirection: PropTypes.oneOf(['asc', 'desc', false]),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * Specify the cell type.
   * The prop defaults to the value inherited from the parent TableHead, TableBody, or TableFooter components.
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['body', 'footer', 'head']), PropTypes.string])
} : void 0;
var TableCell$1 = TableCell;

function getTableContainerUtilityClass(slot) {
  return generateUtilityClass('MuiTableContainer', slot);
}
generateUtilityClasses('MuiTableContainer', ['root']);

const _excluded$a = ["className", "component"];
const useUtilityClasses$8 = ownerState => {
  const {
    classes
  } = ownerState;
  const slots = {
    root: ['root']
  };
  return composeClasses(slots, getTableContainerUtilityClass, classes);
};
const TableContainerRoot = styled$3('div', {
  name: 'MuiTableContainer',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  width: '100%',
  overflowX: 'auto'
});
const TableContainer = /*#__PURE__*/React.forwardRef(function TableContainer(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTableContainer'
  });
  const {
      className,
      component = 'div'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$a);
  const ownerState = _extends$2({}, props, {
    component
  });
  const classes = useUtilityClasses$8(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(TableContainerRoot, _extends$2({
    ref: ref,
    as: component,
    className: clsx(classes.root, className),
    ownerState: ownerState
  }, other));
});
process.env.NODE_ENV !== "production" ? TableContainer.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component, normally `Table`.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var TableContainer$1 = TableContainer;

function getTableHeadUtilityClass(slot) {
  return generateUtilityClass('MuiTableHead', slot);
}
generateUtilityClasses('MuiTableHead', ['root']);

const _excluded$9 = ["className", "component"];
const useUtilityClasses$7 = ownerState => {
  const {
    classes
  } = ownerState;
  const slots = {
    root: ['root']
  };
  return composeClasses(slots, getTableHeadUtilityClass, classes);
};
const TableHeadRoot = styled$3('thead', {
  name: 'MuiTableHead',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  display: 'table-header-group'
});
const tablelvl2 = {
  variant: 'head'
};
const defaultComponent$1 = 'thead';
const TableHead = /*#__PURE__*/React.forwardRef(function TableHead(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTableHead'
  });
  const {
      className,
      component = defaultComponent$1
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$9);
  const ownerState = _extends$2({}, props, {
    component
  });
  const classes = useUtilityClasses$7(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(Tablelvl2Context$1.Provider, {
    value: tablelvl2,
    children: /*#__PURE__*/jsxRuntimeExports.jsx(TableHeadRoot, _extends$2({
      as: component,
      className: clsx(classes.root, className),
      ref: ref,
      role: component === defaultComponent$1 ? null : 'rowgroup',
      ownerState: ownerState
    }, other))
  });
});
process.env.NODE_ENV !== "production" ? TableHead.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component, normally `TableRow`.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var TableHead$1 = TableHead;

function getTableRowUtilityClass(slot) {
  return generateUtilityClass('MuiTableRow', slot);
}
const tableRowClasses = generateUtilityClasses('MuiTableRow', ['root', 'selected', 'hover', 'head', 'footer']);
var tableRowClasses$1 = tableRowClasses;

const _excluded$8 = ["className", "component", "hover", "selected"];
const useUtilityClasses$6 = ownerState => {
  const {
    classes,
    selected,
    hover,
    head,
    footer
  } = ownerState;
  const slots = {
    root: ['root', selected && 'selected', hover && 'hover', head && 'head', footer && 'footer']
  };
  return composeClasses(slots, getTableRowUtilityClass, classes);
};
const TableRowRoot = styled$3('tr', {
  name: 'MuiTableRow',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.head && styles.head, ownerState.footer && styles.footer];
  }
})(({
  theme
}) => ({
  color: 'inherit',
  display: 'table-row',
  verticalAlign: 'middle',
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0,
  [`&.${tableRowClasses$1.hover}:hover`]: {
    backgroundColor: (theme.vars || theme).palette.action.hover
  },
  [`&.${tableRowClasses$1.selected}`]: {
    backgroundColor: theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / ${theme.vars.palette.action.selectedOpacity})` : colorManipulatorExports.alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
    '&:hover': {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.hoverOpacity}))` : colorManipulatorExports.alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity)
    }
  }
}));
const defaultComponent = 'tr';
/**
 * Will automatically set dynamic row height
 * based on the material table element parent (head, body, etc).
 */
const TableRow = /*#__PURE__*/React.forwardRef(function TableRow(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiTableRow'
  });
  const {
      className,
      component = defaultComponent,
      hover = false,
      selected = false
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$8);
  const tablelvl2 = React.useContext(Tablelvl2Context$1);
  const ownerState = _extends$2({}, props, {
    component,
    hover,
    selected,
    head: tablelvl2 && tablelvl2.variant === 'head',
    footer: tablelvl2 && tablelvl2.variant === 'footer'
  });
  const classes = useUtilityClasses$6(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(TableRowRoot, _extends$2({
    as: component,
    ref: ref,
    className: clsx(classes.root, className),
    role: component === defaultComponent ? null : 'row',
    ownerState: ownerState
  }, other));
});
process.env.NODE_ENV !== "production" ? TableRow.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Should be valid `<tr>` children such as `TableCell`.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * If `true`, the table row will shade on hover.
   * @default false
   */
  hover: PropTypes.bool,
  /**
   * If `true`, the table row will have the selected shading.
   * @default false
   */
  selected: PropTypes.bool,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var TableRow$1 = TableRow;

function getPaginationUtilityClass(slot) {
  return generateUtilityClass('MuiPagination', slot);
}
generateUtilityClasses('MuiPagination', ['root', 'ul', 'outlined', 'text']);

const _excluded$7 = ["boundaryCount", "componentName", "count", "defaultPage", "disabled", "hideNextButton", "hidePrevButton", "onChange", "page", "showFirstButton", "showLastButton", "siblingCount"];
function usePagination(props = {}) {
  // keep default values in sync with @default tags in Pagination.propTypes
  const {
      boundaryCount = 1,
      componentName = 'usePagination',
      count = 1,
      defaultPage = 1,
      disabled = false,
      hideNextButton = false,
      hidePrevButton = false,
      onChange: handleChange,
      page: pageProp,
      showFirstButton = false,
      showLastButton = false,
      siblingCount = 1
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$7);
  const [page, setPageState] = useControlled({
    controlled: pageProp,
    default: defaultPage,
    name: componentName,
    state: 'page'
  });
  const handleClick = (event, value) => {
    if (!pageProp) {
      setPageState(value);
    }
    if (handleChange) {
      handleChange(event, value);
    }
  };

  // https://dev.to/namirsab/comment/2050
  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({
      length
    }, (_, i) => start + i);
  };
  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);
  const siblingsStart = Math.max(Math.min(
  // Natural start
  page - siblingCount,
  // Lower boundary when page is high
  count - boundaryCount - siblingCount * 2 - 1),
  // Greater than startPages
  boundaryCount + 2);
  const siblingsEnd = Math.min(Math.max(
  // Natural end
  page + siblingCount,
  // Upper boundary when page is low
  boundaryCount + siblingCount * 2 + 2),
  // Less than endPages
  endPages.length > 0 ? endPages[0] - 2 : count - 1);

  // Basic list of items to render
  // for example itemList = ['first', 'previous', 1, 'ellipsis', 4, 5, 6, 'ellipsis', 10, 'next', 'last']
  const itemList = [...(showFirstButton ? ['first'] : []), ...(hidePrevButton ? [] : ['previous']), ...startPages,
  // Start ellipsis
  // eslint-disable-next-line no-nested-ternary
  ...(siblingsStart > boundaryCount + 2 ? ['start-ellipsis'] : boundaryCount + 1 < count - boundaryCount ? [boundaryCount + 1] : []),
  // Sibling pages
  ...range(siblingsStart, siblingsEnd),
  // End ellipsis
  // eslint-disable-next-line no-nested-ternary
  ...(siblingsEnd < count - boundaryCount - 1 ? ['end-ellipsis'] : count - boundaryCount > boundaryCount ? [count - boundaryCount] : []), ...endPages, ...(hideNextButton ? [] : ['next']), ...(showLastButton ? ['last'] : [])];

  // Map the button type to its page number
  const buttonPage = type => {
    switch (type) {
      case 'first':
        return 1;
      case 'previous':
        return page - 1;
      case 'next':
        return page + 1;
      case 'last':
        return count;
      default:
        return null;
    }
  };

  // Convert the basic item list to PaginationItem props objects
  const items = itemList.map(item => {
    return typeof item === 'number' ? {
      onClick: event => {
        handleClick(event, item);
      },
      type: 'page',
      page: item,
      selected: item === page,
      disabled,
      'aria-current': item === page ? 'true' : undefined
    } : {
      onClick: event => {
        handleClick(event, buttonPage(item));
      },
      type: item,
      page: buttonPage(item),
      selected: false,
      disabled: disabled || item.indexOf('ellipsis') === -1 && (item === 'next' || item === 'last' ? page >= count : page <= 1)
    };
  });
  return _extends$2({
    items
  }, other);
}

function getPaginationItemUtilityClass(slot) {
  return generateUtilityClass('MuiPaginationItem', slot);
}
const paginationItemClasses = generateUtilityClasses('MuiPaginationItem', ['root', 'page', 'sizeSmall', 'sizeLarge', 'text', 'textPrimary', 'textSecondary', 'outlined', 'outlinedPrimary', 'outlinedSecondary', 'rounded', 'ellipsis', 'firstLast', 'previousNext', 'focusVisible', 'disabled', 'selected', 'icon', 'colorPrimary', 'colorSecondary']);
var paginationItemClasses$1 = paginationItemClasses;

var FirstPageIcon = createSvgIcon( /*#__PURE__*/jsxRuntimeExports.jsx("path", {
  d: "M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z"
}), 'FirstPage');

var LastPageIcon = createSvgIcon( /*#__PURE__*/jsxRuntimeExports.jsx("path", {
  d: "M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z"
}), 'LastPage');

var NavigateBeforeIcon = createSvgIcon( /*#__PURE__*/jsxRuntimeExports.jsx("path", {
  d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
}), 'NavigateBefore');

var NavigateNextIcon = createSvgIcon( /*#__PURE__*/jsxRuntimeExports.jsx("path", {
  d: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
}), 'NavigateNext');

const _excluded$6 = ["className", "color", "component", "components", "disabled", "page", "selected", "shape", "size", "slots", "type", "variant"];
const overridesResolver = (props, styles) => {
  const {
    ownerState
  } = props;
  return [styles.root, styles[ownerState.variant], styles[`size${capitalize$1(ownerState.size)}`], ownerState.variant === 'text' && styles[`text${capitalize$1(ownerState.color)}`], ownerState.variant === 'outlined' && styles[`outlined${capitalize$1(ownerState.color)}`], ownerState.shape === 'rounded' && styles.rounded, ownerState.type === 'page' && styles.page, (ownerState.type === 'start-ellipsis' || ownerState.type === 'end-ellipsis') && styles.ellipsis, (ownerState.type === 'previous' || ownerState.type === 'next') && styles.previousNext, (ownerState.type === 'first' || ownerState.type === 'last') && styles.firstLast];
};
const useUtilityClasses$5 = ownerState => {
  const {
    classes,
    color,
    disabled,
    selected,
    size,
    shape,
    type,
    variant
  } = ownerState;
  const slots = {
    root: ['root', `size${capitalize$1(size)}`, variant, shape, color !== 'standard' && `color${capitalize$1(color)}`, color !== 'standard' && `${variant}${capitalize$1(color)}`, disabled && 'disabled', selected && 'selected', {
      page: 'page',
      first: 'firstLast',
      last: 'firstLast',
      'start-ellipsis': 'ellipsis',
      'end-ellipsis': 'ellipsis',
      previous: 'previousNext',
      next: 'previousNext'
    }[type]],
    icon: ['icon']
  };
  return composeClasses(slots, getPaginationItemUtilityClass, classes);
};
const PaginationItemEllipsis = styled$3('div', {
  name: 'MuiPaginationItem',
  slot: 'Root',
  overridesResolver
})(({
  theme,
  ownerState
}) => _extends$2({}, theme.typography.body2, {
  borderRadius: 32 / 2,
  textAlign: 'center',
  boxSizing: 'border-box',
  minWidth: 32,
  padding: '0 6px',
  margin: '0 3px',
  color: (theme.vars || theme).palette.text.primary,
  height: 'auto',
  [`&.${paginationItemClasses$1.disabled}`]: {
    opacity: (theme.vars || theme).palette.action.disabledOpacity
  }
}, ownerState.size === 'small' && {
  minWidth: 26,
  borderRadius: 26 / 2,
  margin: '0 1px',
  padding: '0 4px'
}, ownerState.size === 'large' && {
  minWidth: 40,
  borderRadius: 40 / 2,
  padding: '0 10px',
  fontSize: theme.typography.pxToRem(15)
}));
const PaginationItemPage = styled$3(ButtonBase$1, {
  name: 'MuiPaginationItem',
  slot: 'Root',
  overridesResolver
})(({
  theme,
  ownerState
}) => _extends$2({}, theme.typography.body2, {
  borderRadius: 32 / 2,
  textAlign: 'center',
  boxSizing: 'border-box',
  minWidth: 32,
  height: 32,
  padding: '0 6px',
  margin: '0 3px',
  color: (theme.vars || theme).palette.text.primary,
  [`&.${paginationItemClasses$1.focusVisible}`]: {
    backgroundColor: (theme.vars || theme).palette.action.focus
  },
  [`&.${paginationItemClasses$1.disabled}`]: {
    opacity: (theme.vars || theme).palette.action.disabledOpacity
  },
  transition: theme.transitions.create(['color', 'background-color'], {
    duration: theme.transitions.duration.short
  }),
  '&:hover': {
    backgroundColor: (theme.vars || theme).palette.action.hover,
    // Reset on touch devices, it doesn't add specificity
    '@media (hover: none)': {
      backgroundColor: 'transparent'
    }
  },
  [`&.${paginationItemClasses$1.selected}`]: {
    backgroundColor: (theme.vars || theme).palette.action.selected,
    '&:hover': {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette.action.selectedChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.hoverOpacity}))` : colorManipulatorExports.alpha(theme.palette.action.selected, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: (theme.vars || theme).palette.action.selected
      }
    },
    [`&.${paginationItemClasses$1.focusVisible}`]: {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette.action.selectedChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.focusOpacity}))` : colorManipulatorExports.alpha(theme.palette.action.selected, theme.palette.action.selectedOpacity + theme.palette.action.focusOpacity)
    },
    [`&.${paginationItemClasses$1.disabled}`]: {
      opacity: 1,
      color: (theme.vars || theme).palette.action.disabled,
      backgroundColor: (theme.vars || theme).palette.action.selected
    }
  }
}, ownerState.size === 'small' && {
  minWidth: 26,
  height: 26,
  borderRadius: 26 / 2,
  margin: '0 1px',
  padding: '0 4px'
}, ownerState.size === 'large' && {
  minWidth: 40,
  height: 40,
  borderRadius: 40 / 2,
  padding: '0 10px',
  fontSize: theme.typography.pxToRem(15)
}, ownerState.shape === 'rounded' && {
  borderRadius: (theme.vars || theme).shape.borderRadius
}), ({
  theme,
  ownerState
}) => _extends$2({}, ownerState.variant === 'text' && {
  [`&.${paginationItemClasses$1.selected}`]: _extends$2({}, ownerState.color !== 'standard' && {
    color: (theme.vars || theme).palette[ownerState.color].contrastText,
    backgroundColor: (theme.vars || theme).palette[ownerState.color].main,
    '&:hover': {
      backgroundColor: (theme.vars || theme).palette[ownerState.color].dark,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: (theme.vars || theme).palette[ownerState.color].main
      }
    },
    [`&.${paginationItemClasses$1.focusVisible}`]: {
      backgroundColor: (theme.vars || theme).palette[ownerState.color].dark
    }
  }, {
    [`&.${paginationItemClasses$1.disabled}`]: {
      color: (theme.vars || theme).palette.action.disabled
    }
  })
}, ownerState.variant === 'outlined' && {
  border: theme.vars ? `1px solid rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)` : `1px solid ${theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'}`,
  [`&.${paginationItemClasses$1.selected}`]: _extends$2({}, ownerState.color !== 'standard' && {
    color: (theme.vars || theme).palette[ownerState.color].main,
    border: `1px solid ${theme.vars ? `rgba(${theme.vars.palette[ownerState.color].mainChannel} / 0.5)` : colorManipulatorExports.alpha(theme.palette[ownerState.color].main, 0.5)}`,
    backgroundColor: theme.vars ? `rgba(${theme.vars.palette[ownerState.color].mainChannel} / ${theme.vars.palette.action.activatedOpacity})` : colorManipulatorExports.alpha(theme.palette[ownerState.color].main, theme.palette.action.activatedOpacity),
    '&:hover': {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette[ownerState.color].mainChannel} / calc(${theme.vars.palette.action.activatedOpacity} + ${theme.vars.palette.action.focusOpacity}))` : colorManipulatorExports.alpha(theme.palette[ownerState.color].main, theme.palette.action.activatedOpacity + theme.palette.action.focusOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent'
      }
    },
    [`&.${paginationItemClasses$1.focusVisible}`]: {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette[ownerState.color].mainChannel} / calc(${theme.vars.palette.action.activatedOpacity} + ${theme.vars.palette.action.focusOpacity}))` : colorManipulatorExports.alpha(theme.palette[ownerState.color].main, theme.palette.action.activatedOpacity + theme.palette.action.focusOpacity)
    }
  }, {
    [`&.${paginationItemClasses$1.disabled}`]: {
      borderColor: (theme.vars || theme).palette.action.disabledBackground,
      color: (theme.vars || theme).palette.action.disabled
    }
  })
}));
const PaginationItemPageIcon = styled$3('div', {
  name: 'MuiPaginationItem',
  slot: 'Icon',
  overridesResolver: (props, styles) => styles.icon
})(({
  theme,
  ownerState
}) => _extends$2({
  fontSize: theme.typography.pxToRem(20),
  margin: '0 -8px'
}, ownerState.size === 'small' && {
  fontSize: theme.typography.pxToRem(18)
}, ownerState.size === 'large' && {
  fontSize: theme.typography.pxToRem(22)
}));
const PaginationItem = /*#__PURE__*/React.forwardRef(function PaginationItem(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiPaginationItem'
  });
  const {
      className,
      color = 'standard',
      component,
      components = {},
      disabled = false,
      page,
      selected = false,
      shape = 'circular',
      size = 'medium',
      slots = {},
      type = 'page',
      variant = 'text'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$6);
  const ownerState = _extends$2({}, props, {
    color,
    disabled,
    selected,
    shape,
    size,
    type,
    variant
  });
  const isRtl = useRtl();
  const classes = useUtilityClasses$5(ownerState);
  const normalizedIcons = isRtl ? {
    previous: slots.next || components.next || NavigateNextIcon,
    next: slots.previous || components.previous || NavigateBeforeIcon,
    last: slots.first || components.first || FirstPageIcon,
    first: slots.last || components.last || LastPageIcon
  } : {
    previous: slots.previous || components.previous || NavigateBeforeIcon,
    next: slots.next || components.next || NavigateNextIcon,
    first: slots.first || components.first || FirstPageIcon,
    last: slots.last || components.last || LastPageIcon
  };
  const Icon = normalizedIcons[type];
  return type === 'start-ellipsis' || type === 'end-ellipsis' ? /*#__PURE__*/jsxRuntimeExports.jsx(PaginationItemEllipsis, {
    ref: ref,
    ownerState: ownerState,
    className: clsx(classes.root, className),
    children: "\u2026"
  }) : /*#__PURE__*/jsxRuntimeExports.jsxs(PaginationItemPage, _extends$2({
    ref: ref,
    ownerState: ownerState,
    component: component,
    disabled: disabled,
    className: clsx(classes.root, className)
  }, other, {
    children: [type === 'page' && page, Icon ? /*#__PURE__*/jsxRuntimeExports.jsx(PaginationItemPageIcon, {
      as: Icon,
      ownerState: ownerState,
      className: classes.icon
    }) : null]
  }));
});
process.env.NODE_ENV !== "production" ? PaginationItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The active color.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'standard'
   */
  color: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['primary', 'secondary', 'standard']), PropTypes.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The components used for each slot inside.
   *
   * This prop is an alias for the `slots` prop.
   * It's recommended to use the `slots` prop instead.
   *
   * @default {}
   */
  components: PropTypes.shape({
    first: PropTypes.elementType,
    last: PropTypes.elementType,
    next: PropTypes.elementType,
    previous: PropTypes.elementType
  }),
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The current page number.
   */
  page: PropTypes.node,
  /**
   * If `true` the pagination item is selected.
   * @default false
   */
  selected: PropTypes.bool,
  /**
   * The shape of the pagination item.
   * @default 'circular'
   */
  shape: PropTypes.oneOf(['circular', 'rounded']),
  /**
   * The size of the component.
   * @default 'medium'
   */
  size: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['small', 'medium', 'large']), PropTypes.string]),
  /**
   * The components used for each slot inside.
   *
   * This prop is an alias for the `components` prop, which will be deprecated in the future.
   *
   * @default {}
   */
  slots: PropTypes.shape({
    first: PropTypes.elementType,
    last: PropTypes.elementType,
    next: PropTypes.elementType,
    previous: PropTypes.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The type of pagination item.
   * @default 'page'
   */
  type: PropTypes.oneOf(['end-ellipsis', 'first', 'last', 'next', 'page', 'previous', 'start-ellipsis']),
  /**
   * The variant to use.
   * @default 'text'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['outlined', 'text']), PropTypes.string])
} : void 0;
var PaginationItem$1 = PaginationItem;

const _excluded$5 = ["boundaryCount", "className", "color", "count", "defaultPage", "disabled", "getItemAriaLabel", "hideNextButton", "hidePrevButton", "onChange", "page", "renderItem", "shape", "showFirstButton", "showLastButton", "siblingCount", "size", "variant"];
const useUtilityClasses$4 = ownerState => {
  const {
    classes,
    variant
  } = ownerState;
  const slots = {
    root: ['root', variant],
    ul: ['ul']
  };
  return composeClasses(slots, getPaginationUtilityClass, classes);
};
const PaginationRoot = styled$3('nav', {
  name: 'MuiPagination',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, styles[ownerState.variant]];
  }
})({});
const PaginationUl = styled$3('ul', {
  name: 'MuiPagination',
  slot: 'Ul',
  overridesResolver: (props, styles) => styles.ul
})({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  padding: 0,
  margin: 0,
  listStyle: 'none'
});
function defaultGetAriaLabel(type, page, selected) {
  if (type === 'page') {
    return `${selected ? '' : 'Go to '}page ${page}`;
  }
  return `Go to ${type} page`;
}
const Pagination = /*#__PURE__*/React.forwardRef(function Pagination(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiPagination'
  });
  const {
      boundaryCount = 1,
      className,
      color = 'standard',
      count = 1,
      defaultPage = 1,
      disabled = false,
      getItemAriaLabel = defaultGetAriaLabel,
      hideNextButton = false,
      hidePrevButton = false,
      renderItem = item => /*#__PURE__*/jsxRuntimeExports.jsx(PaginationItem$1, _extends$2({}, item)),
      shape = 'circular',
      showFirstButton = false,
      showLastButton = false,
      siblingCount = 1,
      size = 'medium',
      variant = 'text'
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$5);
  const {
    items
  } = usePagination(_extends$2({}, props, {
    componentName: 'Pagination'
  }));
  const ownerState = _extends$2({}, props, {
    boundaryCount,
    color,
    count,
    defaultPage,
    disabled,
    getItemAriaLabel,
    hideNextButton,
    hidePrevButton,
    renderItem,
    shape,
    showFirstButton,
    showLastButton,
    siblingCount,
    size,
    variant
  });
  const classes = useUtilityClasses$4(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(PaginationRoot, _extends$2({
    "aria-label": "pagination navigation",
    className: clsx(classes.root, className),
    ownerState: ownerState,
    ref: ref
  }, other, {
    children: /*#__PURE__*/jsxRuntimeExports.jsx(PaginationUl, {
      className: classes.ul,
      ownerState: ownerState,
      children: items.map((item, index) => /*#__PURE__*/jsxRuntimeExports.jsx("li", {
        children: renderItem(_extends$2({}, item, {
          color,
          'aria-label': getItemAriaLabel(item.type, item.page, item.selected),
          shape,
          size,
          variant
        }))
      }, index))
    })
  }));
});

// @default tags synced with default values from usePagination

process.env.NODE_ENV !== "production" ? Pagination.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Number of always visible pages at the beginning and end.
   * @default 1
   */
  boundaryCount: integerPropType,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The active color.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'standard'
   */
  color: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['primary', 'secondary', 'standard']), PropTypes.string]),
  /**
   * The total number of pages.
   * @default 1
   */
  count: integerPropType,
  /**
   * The page selected by default when the component is uncontrolled.
   * @default 1
   */
  defaultPage: integerPropType,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Accepts a function which returns a string value that provides a user-friendly name for the current page.
   * This is important for screen reader users.
   *
   * For localization purposes, you can use the provided [translations](/material-ui/guides/localization/).
   * @param {string} type The link or button type to format ('page' | 'first' | 'last' | 'next' | 'previous' | 'start-ellipsis' | 'end-ellipsis'). Defaults to 'page'.
   * @param {number} page The page number to format.
   * @param {bool} selected If true, the current page is selected.
   * @returns {string}
   */
  getItemAriaLabel: PropTypes.func,
  /**
   * If `true`, hide the next-page button.
   * @default false
   */
  hideNextButton: PropTypes.bool,
  /**
   * If `true`, hide the previous-page button.
   * @default false
   */
  hidePrevButton: PropTypes.bool,
  /**
   * Callback fired when the page is changed.
   *
   * @param {React.ChangeEvent<unknown>} event The event source of the callback.
   * @param {number} page The page selected.
   */
  onChange: PropTypes.func,
  /**
   * The current page. Unlike `TablePagination`, which starts numbering from `0`, this pagination starts from `1`.
   */
  page: integerPropType,
  /**
   * Render the item.
   * @param {PaginationRenderItemParams} params The props to spread on a PaginationItem.
   * @returns {ReactNode}
   * @default (item) => <PaginationItem {...item} />
   */
  renderItem: PropTypes.func,
  /**
   * The shape of the pagination items.
   * @default 'circular'
   */
  shape: PropTypes.oneOf(['circular', 'rounded']),
  /**
   * If `true`, show the first-page button.
   * @default false
   */
  showFirstButton: PropTypes.bool,
  /**
   * If `true`, show the last-page button.
   * @default false
   */
  showLastButton: PropTypes.bool,
  /**
   * Number of always visible pages before and after the current page.
   * @default 1
   */
  siblingCount: integerPropType,
  /**
   * The size of the component.
   * @default 'medium'
   */
  size: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['small', 'medium', 'large']), PropTypes.string]),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The variant to use.
   * @default 'text'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['outlined', 'text']), PropTypes.string])
} : void 0;
var Pagination$1 = Pagination;

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
  return /*#__PURE__*/React.createElement(Button, {
    onClick: action,
    sx: buttonStyle,
    variant: "contained",
    disabled: disabled
  }, label);
}

// Is a vertical scrollbar displayed?
function isOverflowing(container) {
  const doc = ownerDocument(container);
  if (doc.body === container) {
    return ownerWindow(container).innerWidth > doc.documentElement.clientWidth;
  }
  return container.scrollHeight > container.clientHeight;
}
function ariaHidden(element, show) {
  if (show) {
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.removeAttribute('aria-hidden');
  }
}
function getPaddingRight(element) {
  return parseInt(ownerWindow(element).getComputedStyle(element).paddingRight, 10) || 0;
}
function isAriaHiddenForbiddenOnElement(element) {
  // The forbidden HTML tags are the ones from ARIA specification that
  // can be children of body and can't have aria-hidden attribute.
  // cf. https://www.w3.org/TR/html-aria/#docconformance
  const forbiddenTagNames = ['TEMPLATE', 'SCRIPT', 'STYLE', 'LINK', 'MAP', 'META', 'NOSCRIPT', 'PICTURE', 'COL', 'COLGROUP', 'PARAM', 'SLOT', 'SOURCE', 'TRACK'];
  const isForbiddenTagName = forbiddenTagNames.indexOf(element.tagName) !== -1;
  const isInputHidden = element.tagName === 'INPUT' && element.getAttribute('type') === 'hidden';
  return isForbiddenTagName || isInputHidden;
}
function ariaHiddenSiblings(container, mountElement, currentElement, elementsToExclude, show) {
  const blacklist = [mountElement, currentElement, ...elementsToExclude];
  [].forEach.call(container.children, element => {
    const isNotExcludedElement = blacklist.indexOf(element) === -1;
    const isNotForbiddenElement = !isAriaHiddenForbiddenOnElement(element);
    if (isNotExcludedElement && isNotForbiddenElement) {
      ariaHidden(element, show);
    }
  });
}
function findIndexOf(items, callback) {
  let idx = -1;
  items.some((item, index) => {
    if (callback(item)) {
      idx = index;
      return true;
    }
    return false;
  });
  return idx;
}
function handleContainer(containerInfo, props) {
  const restoreStyle = [];
  const container = containerInfo.container;
  if (!props.disableScrollLock) {
    if (isOverflowing(container)) {
      // Compute the size before applying overflow hidden to avoid any scroll jumps.
      const scrollbarSize = getScrollbarSize(ownerDocument(container));
      restoreStyle.push({
        value: container.style.paddingRight,
        property: 'padding-right',
        el: container
      });
      // Use computed style, here to get the real padding to add our scrollbar width.
      container.style.paddingRight = `${getPaddingRight(container) + scrollbarSize}px`;

      // .mui-fixed is a global helper.
      const fixedElements = ownerDocument(container).querySelectorAll('.mui-fixed');
      [].forEach.call(fixedElements, element => {
        restoreStyle.push({
          value: element.style.paddingRight,
          property: 'padding-right',
          el: element
        });
        element.style.paddingRight = `${getPaddingRight(element) + scrollbarSize}px`;
      });
    }
    let scrollContainer;
    if (container.parentNode instanceof DocumentFragment) {
      scrollContainer = ownerDocument(container).body;
    } else {
      // Support html overflow-y: auto for scroll stability between pages
      // https://css-tricks.com/snippets/css/force-vertical-scrollbar/
      const parent = container.parentElement;
      const containerWindow = ownerWindow(container);
      scrollContainer = (parent == null ? void 0 : parent.nodeName) === 'HTML' && containerWindow.getComputedStyle(parent).overflowY === 'scroll' ? parent : container;
    }

    // Block the scroll even if no scrollbar is visible to account for mobile keyboard
    // screensize shrink.
    restoreStyle.push({
      value: scrollContainer.style.overflow,
      property: 'overflow',
      el: scrollContainer
    }, {
      value: scrollContainer.style.overflowX,
      property: 'overflow-x',
      el: scrollContainer
    }, {
      value: scrollContainer.style.overflowY,
      property: 'overflow-y',
      el: scrollContainer
    });
    scrollContainer.style.overflow = 'hidden';
  }
  const restore = () => {
    restoreStyle.forEach(({
      value,
      el,
      property
    }) => {
      if (value) {
        el.style.setProperty(property, value);
      } else {
        el.style.removeProperty(property);
      }
    });
  };
  return restore;
}
function getHiddenSiblings(container) {
  const hiddenSiblings = [];
  [].forEach.call(container.children, element => {
    if (element.getAttribute('aria-hidden') === 'true') {
      hiddenSiblings.push(element);
    }
  });
  return hiddenSiblings;
}
/**
 * @ignore - do not document.
 *
 * Proper state management for containers and the modals in those containers.
 * Simplified, but inspired by react-overlay's ModalManager class.
 * Used by the Modal to ensure proper styling of containers.
 */
class ModalManager {
  constructor() {
    this.containers = void 0;
    this.modals = void 0;
    this.modals = [];
    this.containers = [];
  }
  add(modal, container) {
    let modalIndex = this.modals.indexOf(modal);
    if (modalIndex !== -1) {
      return modalIndex;
    }
    modalIndex = this.modals.length;
    this.modals.push(modal);

    // If the modal we are adding is already in the DOM.
    if (modal.modalRef) {
      ariaHidden(modal.modalRef, false);
    }
    const hiddenSiblings = getHiddenSiblings(container);
    ariaHiddenSiblings(container, modal.mount, modal.modalRef, hiddenSiblings, true);
    const containerIndex = findIndexOf(this.containers, item => item.container === container);
    if (containerIndex !== -1) {
      this.containers[containerIndex].modals.push(modal);
      return modalIndex;
    }
    this.containers.push({
      modals: [modal],
      container,
      restore: null,
      hiddenSiblings
    });
    return modalIndex;
  }
  mount(modal, props) {
    const containerIndex = findIndexOf(this.containers, item => item.modals.indexOf(modal) !== -1);
    const containerInfo = this.containers[containerIndex];
    if (!containerInfo.restore) {
      containerInfo.restore = handleContainer(containerInfo, props);
    }
  }
  remove(modal, ariaHiddenState = true) {
    const modalIndex = this.modals.indexOf(modal);
    if (modalIndex === -1) {
      return modalIndex;
    }
    const containerIndex = findIndexOf(this.containers, item => item.modals.indexOf(modal) !== -1);
    const containerInfo = this.containers[containerIndex];
    containerInfo.modals.splice(containerInfo.modals.indexOf(modal), 1);
    this.modals.splice(modalIndex, 1);

    // If that was the last modal in a container, clean up the container.
    if (containerInfo.modals.length === 0) {
      // The modal might be closed before it had the chance to be mounted in the DOM.
      if (containerInfo.restore) {
        containerInfo.restore();
      }
      if (modal.modalRef) {
        // In case the modal wasn't in the DOM yet.
        ariaHidden(modal.modalRef, ariaHiddenState);
      }
      ariaHiddenSiblings(containerInfo.container, modal.mount, modal.modalRef, containerInfo.hiddenSiblings, false);
      this.containers.splice(containerIndex, 1);
    } else {
      // Otherwise make sure the next top modal is visible to a screen reader.
      const nextTop = containerInfo.modals[containerInfo.modals.length - 1];
      // as soon as a modal is adding its modalRef is undefined. it can't set
      // aria-hidden because the dom element doesn't exist either
      // when modal was unmounted before modalRef gets null
      if (nextTop.modalRef) {
        ariaHidden(nextTop.modalRef, false);
      }
    }
    return modalIndex;
  }
  isTopModal(modal) {
    return this.modals.length > 0 && this.modals[this.modals.length - 1] === modal;
  }
}

// Inspired by https://github.com/focus-trap/tabbable
const candidatesSelector = ['input', 'select', 'textarea', 'a[href]', 'button', '[tabindex]', 'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])'].join(',');
function getTabIndex(node) {
  const tabindexAttr = parseInt(node.getAttribute('tabindex') || '', 10);
  if (!Number.isNaN(tabindexAttr)) {
    return tabindexAttr;
  }

  // Browsers do not return `tabIndex` correctly for contentEditable nodes;
  // https://bugs.chromium.org/p/chromium/issues/detail?id=661108&q=contenteditable%20tabindex&can=2
  // so if they don't have a tabindex attribute specifically set, assume it's 0.
  // in Chrome, <details/>, <audio controls/> and <video controls/> elements get a default
  //  `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
  //  yet they are still part of the regular tab order; in FF, they get a default
  //  `tabIndex` of 0; since Chrome still puts those elements in the regular tab
  //  order, consider their tab index to be 0.
  if (node.contentEditable === 'true' || (node.nodeName === 'AUDIO' || node.nodeName === 'VIDEO' || node.nodeName === 'DETAILS') && node.getAttribute('tabindex') === null) {
    return 0;
  }
  return node.tabIndex;
}
function isNonTabbableRadio(node) {
  if (node.tagName !== 'INPUT' || node.type !== 'radio') {
    return false;
  }
  if (!node.name) {
    return false;
  }
  const getRadio = selector => node.ownerDocument.querySelector(`input[type="radio"]${selector}`);
  let roving = getRadio(`[name="${node.name}"]:checked`);
  if (!roving) {
    roving = getRadio(`[name="${node.name}"]`);
  }
  return roving !== node;
}
function isNodeMatchingSelectorFocusable(node) {
  if (node.disabled || node.tagName === 'INPUT' && node.type === 'hidden' || isNonTabbableRadio(node)) {
    return false;
  }
  return true;
}
function defaultGetTabbable(root) {
  const regularTabNodes = [];
  const orderedTabNodes = [];
  Array.from(root.querySelectorAll(candidatesSelector)).forEach((node, i) => {
    const nodeTabIndex = getTabIndex(node);
    if (nodeTabIndex === -1 || !isNodeMatchingSelectorFocusable(node)) {
      return;
    }
    if (nodeTabIndex === 0) {
      regularTabNodes.push(node);
    } else {
      orderedTabNodes.push({
        documentOrder: i,
        tabIndex: nodeTabIndex,
        node: node
      });
    }
  });
  return orderedTabNodes.sort((a, b) => a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex).map(a => a.node).concat(regularTabNodes);
}
function defaultIsEnabled() {
  return true;
}

/**
 * @ignore - internal component.
 */
function FocusTrap(props) {
  const {
    children,
    disableAutoFocus = false,
    disableEnforceFocus = false,
    disableRestoreFocus = false,
    getTabbable = defaultGetTabbable,
    isEnabled = defaultIsEnabled,
    open
  } = props;
  const ignoreNextEnforceFocus = React.useRef(false);
  const sentinelStart = React.useRef(null);
  const sentinelEnd = React.useRef(null);
  const nodeToRestore = React.useRef(null);
  const reactFocusEventTarget = React.useRef(null);
  // This variable is useful when disableAutoFocus is true.
  // It waits for the active element to move into the component to activate.
  const activated = React.useRef(false);
  const rootRef = React.useRef(null);
  const handleRef = useForkRef(getReactElementRef(children), rootRef);
  const lastKeydown = React.useRef(null);
  React.useEffect(() => {
    // We might render an empty child.
    if (!open || !rootRef.current) {
      return;
    }
    activated.current = !disableAutoFocus;
  }, [disableAutoFocus, open]);
  React.useEffect(() => {
    // We might render an empty child.
    if (!open || !rootRef.current) {
      return;
    }
    const doc = ownerDocument(rootRef.current);
    if (!rootRef.current.contains(doc.activeElement)) {
      if (!rootRef.current.hasAttribute('tabIndex')) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(['MUI: The modal content node does not accept focus.', 'For the benefit of assistive technologies, ' + 'the tabIndex of the node is being set to "-1".'].join('\n'));
        }
        rootRef.current.setAttribute('tabIndex', '-1');
      }
      if (activated.current) {
        rootRef.current.focus();
      }
    }
    return () => {
      // restoreLastFocus()
      if (!disableRestoreFocus) {
        // In IE11 it is possible for document.activeElement to be null resulting
        // in nodeToRestore.current being null.
        // Not all elements in IE11 have a focus method.
        // Once IE11 support is dropped the focus() call can be unconditional.
        if (nodeToRestore.current && nodeToRestore.current.focus) {
          ignoreNextEnforceFocus.current = true;
          nodeToRestore.current.focus();
        }
        nodeToRestore.current = null;
      }
    };
    // Missing `disableRestoreFocus` which is fine.
    // We don't support changing that prop on an open FocusTrap
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  React.useEffect(() => {
    // We might render an empty child.
    if (!open || !rootRef.current) {
      return;
    }
    const doc = ownerDocument(rootRef.current);
    const loopFocus = nativeEvent => {
      lastKeydown.current = nativeEvent;
      if (disableEnforceFocus || !isEnabled() || nativeEvent.key !== 'Tab') {
        return;
      }

      // Make sure the next tab starts from the right place.
      // doc.activeElement refers to the origin.
      if (doc.activeElement === rootRef.current && nativeEvent.shiftKey) {
        // We need to ignore the next contain as
        // it will try to move the focus back to the rootRef element.
        ignoreNextEnforceFocus.current = true;
        if (sentinelEnd.current) {
          sentinelEnd.current.focus();
        }
      }
    };
    const contain = () => {
      const rootElement = rootRef.current;

      // Cleanup functions are executed lazily in React 17.
      // Contain can be called between the component being unmounted and its cleanup function being run.
      if (rootElement === null) {
        return;
      }
      if (!doc.hasFocus() || !isEnabled() || ignoreNextEnforceFocus.current) {
        ignoreNextEnforceFocus.current = false;
        return;
      }

      // The focus is already inside
      if (rootElement.contains(doc.activeElement)) {
        return;
      }

      // The disableEnforceFocus is set and the focus is outside of the focus trap (and sentinel nodes)
      if (disableEnforceFocus && doc.activeElement !== sentinelStart.current && doc.activeElement !== sentinelEnd.current) {
        return;
      }

      // if the focus event is not coming from inside the children's react tree, reset the refs
      if (doc.activeElement !== reactFocusEventTarget.current) {
        reactFocusEventTarget.current = null;
      } else if (reactFocusEventTarget.current !== null) {
        return;
      }
      if (!activated.current) {
        return;
      }
      let tabbable = [];
      if (doc.activeElement === sentinelStart.current || doc.activeElement === sentinelEnd.current) {
        tabbable = getTabbable(rootRef.current);
      }

      // one of the sentinel nodes was focused, so move the focus
      // to the first/last tabbable element inside the focus trap
      if (tabbable.length > 0) {
        var _lastKeydown$current, _lastKeydown$current2;
        const isShiftTab = Boolean(((_lastKeydown$current = lastKeydown.current) == null ? void 0 : _lastKeydown$current.shiftKey) && ((_lastKeydown$current2 = lastKeydown.current) == null ? void 0 : _lastKeydown$current2.key) === 'Tab');
        const focusNext = tabbable[0];
        const focusPrevious = tabbable[tabbable.length - 1];
        if (typeof focusNext !== 'string' && typeof focusPrevious !== 'string') {
          if (isShiftTab) {
            focusPrevious.focus();
          } else {
            focusNext.focus();
          }
        }
        // no tabbable elements in the trap focus or the focus was outside of the focus trap
      } else {
        rootElement.focus();
      }
    };
    doc.addEventListener('focusin', contain);
    doc.addEventListener('keydown', loopFocus, true);

    // With Edge, Safari and Firefox, no focus related events are fired when the focused area stops being a focused area.
    // for example https://bugzilla.mozilla.org/show_bug.cgi?id=559561.
    // Instead, we can look if the active element was restored on the BODY element.
    //
    // The whatwg spec defines how the browser should behave but does not explicitly mention any events:
    // https://html.spec.whatwg.org/multipage/interaction.html#focus-fixup-rule.
    const interval = setInterval(() => {
      if (doc.activeElement && doc.activeElement.tagName === 'BODY') {
        contain();
      }
    }, 50);
    return () => {
      clearInterval(interval);
      doc.removeEventListener('focusin', contain);
      doc.removeEventListener('keydown', loopFocus, true);
    };
  }, [disableAutoFocus, disableEnforceFocus, disableRestoreFocus, isEnabled, open, getTabbable]);
  const onFocus = event => {
    if (nodeToRestore.current === null) {
      nodeToRestore.current = event.relatedTarget;
    }
    activated.current = true;
    reactFocusEventTarget.current = event.target;
    const childrenPropsHandler = children.props.onFocus;
    if (childrenPropsHandler) {
      childrenPropsHandler(event);
    }
  };
  const handleFocusSentinel = event => {
    if (nodeToRestore.current === null) {
      nodeToRestore.current = event.relatedTarget;
    }
    activated.current = true;
  };
  return /*#__PURE__*/jsxRuntimeExports.jsxs(React.Fragment, {
    children: [/*#__PURE__*/jsxRuntimeExports.jsx("div", {
      tabIndex: open ? 0 : -1,
      onFocus: handleFocusSentinel,
      ref: sentinelStart,
      "data-testid": "sentinelStart"
    }), /*#__PURE__*/React.cloneElement(children, {
      ref: handleRef,
      onFocus
    }), /*#__PURE__*/jsxRuntimeExports.jsx("div", {
      tabIndex: open ? 0 : -1,
      onFocus: handleFocusSentinel,
      ref: sentinelEnd,
      "data-testid": "sentinelEnd"
    })]
  });
}
process.env.NODE_ENV !== "production" ? FocusTrap.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A single child content element.
   */
  children: elementAcceptingRef$1,
  /**
   * If `true`, the focus trap will not automatically shift focus to itself when it opens, and
   * replace it to the last focused element when it closes.
   * This also works correctly with any focus trap children that have the `disableAutoFocus` prop.
   *
   * Generally this should never be set to `true` as it makes the focus trap less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableAutoFocus: PropTypes.bool,
  /**
   * If `true`, the focus trap will not prevent focus from leaving the focus trap while open.
   *
   * Generally this should never be set to `true` as it makes the focus trap less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableEnforceFocus: PropTypes.bool,
  /**
   * If `true`, the focus trap will not restore focus to previously focused element once
   * focus trap is hidden or unmounted.
   * @default false
   */
  disableRestoreFocus: PropTypes.bool,
  /**
   * Returns an array of ordered tabbable nodes (i.e. in tab order) within the root.
   * For instance, you can provide the "tabbable" npm dependency.
   * @param {HTMLElement} root
   */
  getTabbable: PropTypes.func,
  /**
   * This prop extends the `open` prop.
   * It allows to toggle the open state without having to wait for a rerender when changing the `open` prop.
   * This prop should be memoized.
   * It can be used to support multiple focus trap mounted at the same time.
   * @default function defaultIsEnabled(): boolean {
   *   return true;
   * }
   */
  isEnabled: PropTypes.func,
  /**
   * If `true`, focus is locked.
   */
  open: PropTypes.bool.isRequired
} : void 0;
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line
  FocusTrap['propTypes' + ''] = exactProp(FocusTrap.propTypes);
}

function getContainer$1(container) {
  return typeof container === 'function' ? container() : container;
}

/**
 * Portals provide a first-class way to render children into a DOM node
 * that exists outside the DOM hierarchy of the parent component.
 *
 * Demos:
 *
 * - [Portal](https://mui.com/material-ui/react-portal/)
 *
 * API:
 *
 * - [Portal API](https://mui.com/material-ui/api/portal/)
 */
const Portal = /*#__PURE__*/React.forwardRef(function Portal(props, forwardedRef) {
  const {
    children,
    container,
    disablePortal = false
  } = props;
  const [mountNode, setMountNode] = React.useState(null);
  const handleRef = useForkRef( /*#__PURE__*/React.isValidElement(children) ? getReactElementRef(children) : null, forwardedRef);
  useEnhancedEffect$1(() => {
    if (!disablePortal) {
      setMountNode(getContainer$1(container) || document.body);
    }
  }, [container, disablePortal]);
  useEnhancedEffect$1(() => {
    if (mountNode && !disablePortal) {
      setRef(forwardedRef, mountNode);
      return () => {
        setRef(forwardedRef, null);
      };
    }
    return undefined;
  }, [forwardedRef, mountNode, disablePortal]);
  if (disablePortal) {
    if ( /*#__PURE__*/React.isValidElement(children)) {
      const newProps = {
        ref: handleRef
      };
      return /*#__PURE__*/React.cloneElement(children, newProps);
    }
    return /*#__PURE__*/jsxRuntimeExports.jsx(React.Fragment, {
      children: children
    });
  }
  return /*#__PURE__*/jsxRuntimeExports.jsx(React.Fragment, {
    children: mountNode ? /*#__PURE__*/ReactDOM.createPortal(children, mountNode) : mountNode
  });
});
process.env.NODE_ENV !== "production" ? Portal.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The children to render into the `container`.
   */
  children: PropTypes.node,
  /**
   * An HTML element or function that returns one.
   * The `container` will have the portal children appended to it.
   *
   * You can also provide a callback, which is called in a React layout effect.
   * This lets you set the container from a ref, and also makes server-side rendering possible.
   *
   * By default, it uses the body of the top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, PropTypes.func]),
  /**
   * The `children` will be under the DOM hierarchy of the parent component.
   * @default false
   */
  disablePortal: PropTypes.bool
} : void 0;
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line
  Portal['propTypes' + ''] = exactProp(Portal.propTypes);
}
var Portal$1 = Portal;

const reflow = node => node.scrollTop;
function getTransitionProps(props, options) {
  var _style$transitionDura, _style$transitionTimi;
  const {
    timeout,
    easing,
    style = {}
  } = props;
  return {
    duration: (_style$transitionDura = style.transitionDuration) != null ? _style$transitionDura : typeof timeout === 'number' ? timeout : timeout[options.mode] || 0,
    easing: (_style$transitionTimi = style.transitionTimingFunction) != null ? _style$transitionTimi : typeof easing === 'object' ? easing[options.mode] : easing,
    delay: style.transitionDelay
  };
}

const _excluded$4 = ["addEndListener", "appear", "children", "easing", "in", "onEnter", "onEntered", "onEntering", "onExit", "onExited", "onExiting", "style", "timeout", "TransitionComponent"];
const styles = {
  entering: {
    opacity: 1
  },
  entered: {
    opacity: 1
  }
};

/**
 * The Fade transition is used by the [Modal](/material-ui/react-modal/) component.
 * It uses [react-transition-group](https://github.com/reactjs/react-transition-group) internally.
 */
const Fade = /*#__PURE__*/React.forwardRef(function Fade(props, ref) {
  const theme = useTheme();
  const defaultTimeout = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen
  };
  const {
      addEndListener,
      appear = true,
      children,
      easing,
      in: inProp,
      onEnter,
      onEntered,
      onEntering,
      onExit,
      onExited,
      onExiting,
      style,
      timeout = defaultTimeout,
      // eslint-disable-next-line react/prop-types
      TransitionComponent = Transition$1
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$4);
  const nodeRef = React.useRef(null);
  const handleRef = useForkRef(nodeRef, getReactElementRef(children), ref);
  const normalizedTransitionCallback = callback => maybeIsAppearing => {
    if (callback) {
      const node = nodeRef.current;

      // onEnterXxx and onExitXxx callbacks have a different arguments.length value.
      if (maybeIsAppearing === undefined) {
        callback(node);
      } else {
        callback(node, maybeIsAppearing);
      }
    }
  };
  const handleEntering = normalizedTransitionCallback(onEntering);
  const handleEnter = normalizedTransitionCallback((node, isAppearing) => {
    reflow(node); // So the animation always start from the start.

    const transitionProps = getTransitionProps({
      style,
      timeout,
      easing
    }, {
      mode: 'enter'
    });
    node.style.webkitTransition = theme.transitions.create('opacity', transitionProps);
    node.style.transition = theme.transitions.create('opacity', transitionProps);
    if (onEnter) {
      onEnter(node, isAppearing);
    }
  });
  const handleEntered = normalizedTransitionCallback(onEntered);
  const handleExiting = normalizedTransitionCallback(onExiting);
  const handleExit = normalizedTransitionCallback(node => {
    const transitionProps = getTransitionProps({
      style,
      timeout,
      easing
    }, {
      mode: 'exit'
    });
    node.style.webkitTransition = theme.transitions.create('opacity', transitionProps);
    node.style.transition = theme.transitions.create('opacity', transitionProps);
    if (onExit) {
      onExit(node);
    }
  });
  const handleExited = normalizedTransitionCallback(onExited);
  const handleAddEndListener = next => {
    if (addEndListener) {
      // Old call signature before `react-transition-group` implemented `nodeRef`
      addEndListener(nodeRef.current, next);
    }
  };
  return /*#__PURE__*/jsxRuntimeExports.jsx(TransitionComponent, _extends$2({
    appear: appear,
    in: inProp,
    nodeRef: nodeRef ,
    onEnter: handleEnter,
    onEntered: handleEntered,
    onEntering: handleEntering,
    onExit: handleExit,
    onExited: handleExited,
    onExiting: handleExiting,
    addEndListener: handleAddEndListener,
    timeout: timeout
  }, other, {
    children: (state, childProps) => {
      return /*#__PURE__*/React.cloneElement(children, _extends$2({
        style: _extends$2({
          opacity: 0,
          visibility: state === 'exited' && !inProp ? 'hidden' : undefined
        }, styles[state], style, children.props.style),
        ref: handleRef
      }, childProps));
    }
  }));
});
process.env.NODE_ENV !== "production" ? Fade.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Add a custom transition end trigger. Called with the transitioning DOM
   * node and a done callback. Allows for more fine grained transition end
   * logic. Note: Timeouts are still used as a fallback if provided.
   */
  addEndListener: PropTypes.func,
  /**
   * Perform the enter transition when it first mounts if `in` is also `true`.
   * Set this to `false` to disable this behavior.
   * @default true
   */
  appear: PropTypes.bool,
  /**
   * A single child content element.
   */
  children: elementAcceptingRef$1.isRequired,
  /**
   * The transition timing function.
   * You may specify a single easing or a object containing enter and exit values.
   */
  easing: PropTypes.oneOfType([PropTypes.shape({
    enter: PropTypes.string,
    exit: PropTypes.string
  }), PropTypes.string]),
  /**
   * If `true`, the component will transition in.
   */
  in: PropTypes.bool,
  /**
   * @ignore
   */
  onEnter: PropTypes.func,
  /**
   * @ignore
   */
  onEntered: PropTypes.func,
  /**
   * @ignore
   */
  onEntering: PropTypes.func,
  /**
   * @ignore
   */
  onExit: PropTypes.func,
  /**
   * @ignore
   */
  onExited: PropTypes.func,
  /**
   * @ignore
   */
  onExiting: PropTypes.func,
  /**
   * @ignore
   */
  style: PropTypes.object,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   * @default {
   *   enter: theme.transitions.duration.enteringScreen,
   *   exit: theme.transitions.duration.leavingScreen,
   * }
   */
  timeout: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
    appear: PropTypes.number,
    enter: PropTypes.number,
    exit: PropTypes.number
  })])
} : void 0;
var Fade$1 = Fade;

function getBackdropUtilityClass(slot) {
  return generateUtilityClass('MuiBackdrop', slot);
}
generateUtilityClasses('MuiBackdrop', ['root', 'invisible']);

const _excluded$3 = ["children", "className", "component", "components", "componentsProps", "invisible", "open", "slotProps", "slots", "TransitionComponent", "transitionDuration"];
const useUtilityClasses$3 = ownerState => {
  const {
    classes,
    invisible
  } = ownerState;
  const slots = {
    root: ['root', invisible && 'invisible']
  };
  return composeClasses(slots, getBackdropUtilityClass, classes);
};
const BackdropRoot = styled$3('div', {
  name: 'MuiBackdrop',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.invisible && styles.invisible];
  }
})(({
  ownerState
}) => _extends$2({
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  right: 0,
  bottom: 0,
  top: 0,
  left: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  WebkitTapHighlightColor: 'transparent'
}, ownerState.invisible && {
  backgroundColor: 'transparent'
}));
const Backdrop = /*#__PURE__*/React.forwardRef(function Backdrop(inProps, ref) {
  var _slotProps$root, _ref, _slots$root;
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiBackdrop'
  });
  const {
      children,
      className,
      component = 'div',
      components = {},
      componentsProps = {},
      invisible = false,
      open,
      slotProps = {},
      slots = {},
      TransitionComponent = Fade$1,
      transitionDuration
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$3);
  const ownerState = _extends$2({}, props, {
    component,
    invisible
  });
  const classes = useUtilityClasses$3(ownerState);
  const rootSlotProps = (_slotProps$root = slotProps.root) != null ? _slotProps$root : componentsProps.root;
  return /*#__PURE__*/jsxRuntimeExports.jsx(TransitionComponent, _extends$2({
    in: open,
    timeout: transitionDuration
  }, other, {
    children: /*#__PURE__*/jsxRuntimeExports.jsx(BackdropRoot, _extends$2({
      "aria-hidden": true
    }, rootSlotProps, {
      as: (_ref = (_slots$root = slots.root) != null ? _slots$root : components.Root) != null ? _ref : component,
      className: clsx(classes.root, className, rootSlotProps == null ? void 0 : rootSlotProps.className),
      ownerState: _extends$2({}, ownerState, rootSlotProps == null ? void 0 : rootSlotProps.ownerState),
      classes: classes,
      ref: ref,
      children: children
    }))
  }));
});
process.env.NODE_ENV !== "production" ? Backdrop.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The components used for each slot inside.
   *
   * This prop is an alias for the `slots` prop.
   * It's recommended to use the `slots` prop instead.
   *
   * @default {}
   */
  components: PropTypes.shape({
    Root: PropTypes.elementType
  }),
  /**
   * The extra props for the slot components.
   * You can override the existing props or add new ones.
   *
   * This prop is an alias for the `slotProps` prop.
   * It's recommended to use the `slotProps` prop instead, as `componentsProps` will be deprecated in the future.
   *
   * @default {}
   */
  componentsProps: PropTypes.shape({
    root: PropTypes.object
  }),
  /**
   * If `true`, the backdrop is invisible.
   * It can be used when rendering a popover or a custom select component.
   * @default false
   */
  invisible: PropTypes.bool,
  /**
   * If `true`, the component is shown.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The extra props for the slot components.
   * You can override the existing props or add new ones.
   *
   * This prop is an alias for the `componentsProps` prop, which will be deprecated in the future.
   *
   * @default {}
   */
  slotProps: PropTypes.shape({
    root: PropTypes.object
  }),
  /**
   * The components used for each slot inside.
   *
   * This prop is an alias for the `components` prop, which will be deprecated in the future.
   *
   * @default {}
   */
  slots: PropTypes.shape({
    root: PropTypes.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The component used for the transition.
   * [Follow this guide](/material-ui/transitions/#transitioncomponent-prop) to learn more about the requirements for this component.
   * @default Fade
   */
  TransitionComponent: PropTypes.elementType,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   */
  transitionDuration: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
    appear: PropTypes.number,
    enter: PropTypes.number,
    exit: PropTypes.number
  })])
} : void 0;
var Backdrop$1 = Backdrop;

function getContainer(container) {
  return typeof container === 'function' ? container() : container;
}
function getHasTransition(children) {
  return children ? children.props.hasOwnProperty('in') : false;
}

// A modal manager used to track and manage the state of open Modals.
// Modals don't open on the server so this won't conflict with concurrent requests.
const defaultManager = new ModalManager();
/**
 *
 * Demos:
 *
 * - [Modal](https://mui.com/base-ui/react-modal/#hook)
 *
 * API:
 *
 * - [useModal API](https://mui.com/base-ui/react-modal/hooks-api/#use-modal)
 */
function useModal(parameters) {
  const {
    container,
    disableEscapeKeyDown = false,
    disableScrollLock = false,
    // @ts-ignore internal logic - Base UI supports the manager as a prop too
    manager = defaultManager,
    closeAfterTransition = false,
    onTransitionEnter,
    onTransitionExited,
    children,
    onClose,
    open,
    rootRef
  } = parameters;

  // @ts-ignore internal logic
  const modal = React.useRef({});
  const mountNodeRef = React.useRef(null);
  const modalRef = React.useRef(null);
  const handleRef = useForkRef(modalRef, rootRef);
  const [exited, setExited] = React.useState(!open);
  const hasTransition = getHasTransition(children);
  let ariaHiddenProp = true;
  if (parameters['aria-hidden'] === 'false' || parameters['aria-hidden'] === false) {
    ariaHiddenProp = false;
  }
  const getDoc = () => ownerDocument(mountNodeRef.current);
  const getModal = () => {
    modal.current.modalRef = modalRef.current;
    modal.current.mount = mountNodeRef.current;
    return modal.current;
  };
  const handleMounted = () => {
    manager.mount(getModal(), {
      disableScrollLock
    });

    // Fix a bug on Chrome where the scroll isn't initially 0.
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  };
  const handleOpen = useEventCallback(() => {
    const resolvedContainer = getContainer(container) || getDoc().body;
    manager.add(getModal(), resolvedContainer);

    // The element was already mounted.
    if (modalRef.current) {
      handleMounted();
    }
  });
  const isTopModal = React.useCallback(() => manager.isTopModal(getModal()), [manager]);
  const handlePortalRef = useEventCallback(node => {
    mountNodeRef.current = node;
    if (!node) {
      return;
    }
    if (open && isTopModal()) {
      handleMounted();
    } else if (modalRef.current) {
      ariaHidden(modalRef.current, ariaHiddenProp);
    }
  });
  const handleClose = React.useCallback(() => {
    manager.remove(getModal(), ariaHiddenProp);
  }, [ariaHiddenProp, manager]);
  React.useEffect(() => {
    return () => {
      handleClose();
    };
  }, [handleClose]);
  React.useEffect(() => {
    if (open) {
      handleOpen();
    } else if (!hasTransition || !closeAfterTransition) {
      handleClose();
    }
  }, [open, handleClose, hasTransition, closeAfterTransition, handleOpen]);
  const createHandleKeyDown = otherHandlers => event => {
    var _otherHandlers$onKeyD;
    (_otherHandlers$onKeyD = otherHandlers.onKeyDown) == null || _otherHandlers$onKeyD.call(otherHandlers, event);

    // The handler doesn't take event.defaultPrevented into account:
    //
    // event.preventDefault() is meant to stop default behaviors like
    // clicking a checkbox to check it, hitting a button to submit a form,
    // and hitting left arrow to move the cursor in a text input etc.
    // Only special HTML elements have these default behaviors.
    if (event.key !== 'Escape' || event.which === 229 ||
    // Wait until IME is settled.
    !isTopModal()) {
      return;
    }
    if (!disableEscapeKeyDown) {
      // Swallow the event, in case someone is listening for the escape key on the body.
      event.stopPropagation();
      if (onClose) {
        onClose(event, 'escapeKeyDown');
      }
    }
  };
  const createHandleBackdropClick = otherHandlers => event => {
    var _otherHandlers$onClic;
    (_otherHandlers$onClic = otherHandlers.onClick) == null || _otherHandlers$onClic.call(otherHandlers, event);
    if (event.target !== event.currentTarget) {
      return;
    }
    if (onClose) {
      onClose(event, 'backdropClick');
    }
  };
  const getRootProps = (otherHandlers = {}) => {
    const propsEventHandlers = extractEventHandlers(parameters);

    // The custom event handlers shouldn't be spread on the root element
    delete propsEventHandlers.onTransitionEnter;
    delete propsEventHandlers.onTransitionExited;
    const externalEventHandlers = _extends$2({}, propsEventHandlers, otherHandlers);
    return _extends$2({
      role: 'presentation'
    }, externalEventHandlers, {
      onKeyDown: createHandleKeyDown(externalEventHandlers),
      ref: handleRef
    });
  };
  const getBackdropProps = (otherHandlers = {}) => {
    const externalEventHandlers = otherHandlers;
    return _extends$2({
      'aria-hidden': true
    }, externalEventHandlers, {
      onClick: createHandleBackdropClick(externalEventHandlers),
      open
    });
  };
  const getTransitionProps = () => {
    const handleEnter = () => {
      setExited(false);
      if (onTransitionEnter) {
        onTransitionEnter();
      }
    };
    const handleExited = () => {
      setExited(true);
      if (onTransitionExited) {
        onTransitionExited();
      }
      if (closeAfterTransition) {
        handleClose();
      }
    };
    return {
      onEnter: createChainedFunction(handleEnter, children == null ? void 0 : children.props.onEnter),
      onExited: createChainedFunction(handleExited, children == null ? void 0 : children.props.onExited)
    };
  };
  return {
    getRootProps,
    getBackdropProps,
    getTransitionProps,
    rootRef: handleRef,
    portalRef: handlePortalRef,
    isTopModal,
    exited,
    hasTransition
  };
}

function getModalUtilityClass(slot) {
  return generateUtilityClass('MuiModal', slot);
}
generateUtilityClasses('MuiModal', ['root', 'hidden', 'backdrop']);

const _excluded$2 = ["BackdropComponent", "BackdropProps", "classes", "className", "closeAfterTransition", "children", "container", "component", "components", "componentsProps", "disableAutoFocus", "disableEnforceFocus", "disableEscapeKeyDown", "disablePortal", "disableRestoreFocus", "disableScrollLock", "hideBackdrop", "keepMounted", "onBackdropClick", "onClose", "onTransitionEnter", "onTransitionExited", "open", "slotProps", "slots", "theme"];
const useUtilityClasses$2 = ownerState => {
  const {
    open,
    exited,
    classes
  } = ownerState;
  const slots = {
    root: ['root', !open && exited && 'hidden'],
    backdrop: ['backdrop']
  };
  return composeClasses(slots, getModalUtilityClass, classes);
};
const ModalRoot = styled$3('div', {
  name: 'MuiModal',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, !ownerState.open && ownerState.exited && styles.hidden];
  }
})(({
  theme,
  ownerState
}) => _extends$2({
  position: 'fixed',
  zIndex: (theme.vars || theme).zIndex.modal,
  right: 0,
  bottom: 0,
  top: 0,
  left: 0
}, !ownerState.open && ownerState.exited && {
  visibility: 'hidden'
}));
const ModalBackdrop = styled$3(Backdrop$1, {
  name: 'MuiModal',
  slot: 'Backdrop',
  overridesResolver: (props, styles) => {
    return styles.backdrop;
  }
})({
  zIndex: -1
});

/**
 * Modal is a lower-level construct that is leveraged by the following components:
 *
 * - [Dialog](/material-ui/api/dialog/)
 * - [Drawer](/material-ui/api/drawer/)
 * - [Menu](/material-ui/api/menu/)
 * - [Popover](/material-ui/api/popover/)
 *
 * If you are creating a modal dialog, you probably want to use the [Dialog](/material-ui/api/dialog/) component
 * rather than directly using Modal.
 *
 * This component shares many concepts with [react-overlays](https://react-bootstrap.github.io/react-overlays/#modals).
 */
const Modal = /*#__PURE__*/React.forwardRef(function Modal(inProps, ref) {
  var _ref, _slots$root, _ref2, _slots$backdrop, _slotProps$root, _slotProps$backdrop;
  const props = useDefaultProps({
    name: 'MuiModal',
    props: inProps
  });
  const {
      BackdropComponent = ModalBackdrop,
      BackdropProps,
      className,
      closeAfterTransition = false,
      children,
      container,
      component,
      components = {},
      componentsProps = {},
      disableAutoFocus = false,
      disableEnforceFocus = false,
      disableEscapeKeyDown = false,
      disablePortal = false,
      disableRestoreFocus = false,
      disableScrollLock = false,
      hideBackdrop = false,
      keepMounted = false,
      onBackdropClick,
      open,
      slotProps,
      slots
      // eslint-disable-next-line react/prop-types
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$2);
  const propsWithDefaults = _extends$2({}, props, {
    closeAfterTransition,
    disableAutoFocus,
    disableEnforceFocus,
    disableEscapeKeyDown,
    disablePortal,
    disableRestoreFocus,
    disableScrollLock,
    hideBackdrop,
    keepMounted
  });
  const {
    getRootProps,
    getBackdropProps,
    getTransitionProps,
    portalRef,
    isTopModal,
    exited,
    hasTransition
  } = useModal(_extends$2({}, propsWithDefaults, {
    rootRef: ref
  }));
  const ownerState = _extends$2({}, propsWithDefaults, {
    exited
  });
  const classes = useUtilityClasses$2(ownerState);
  const childProps = {};
  if (children.props.tabIndex === undefined) {
    childProps.tabIndex = '-1';
  }

  // It's a Transition like component
  if (hasTransition) {
    const {
      onEnter,
      onExited
    } = getTransitionProps();
    childProps.onEnter = onEnter;
    childProps.onExited = onExited;
  }
  const RootSlot = (_ref = (_slots$root = slots == null ? void 0 : slots.root) != null ? _slots$root : components.Root) != null ? _ref : ModalRoot;
  const BackdropSlot = (_ref2 = (_slots$backdrop = slots == null ? void 0 : slots.backdrop) != null ? _slots$backdrop : components.Backdrop) != null ? _ref2 : BackdropComponent;
  const rootSlotProps = (_slotProps$root = slotProps == null ? void 0 : slotProps.root) != null ? _slotProps$root : componentsProps.root;
  const backdropSlotProps = (_slotProps$backdrop = slotProps == null ? void 0 : slotProps.backdrop) != null ? _slotProps$backdrop : componentsProps.backdrop;
  const rootProps = useSlotProps({
    elementType: RootSlot,
    externalSlotProps: rootSlotProps,
    externalForwardedProps: other,
    getSlotProps: getRootProps,
    additionalProps: {
      ref,
      as: component
    },
    ownerState,
    className: clsx(className, rootSlotProps == null ? void 0 : rootSlotProps.className, classes == null ? void 0 : classes.root, !ownerState.open && ownerState.exited && (classes == null ? void 0 : classes.hidden))
  });
  const backdropProps = useSlotProps({
    elementType: BackdropSlot,
    externalSlotProps: backdropSlotProps,
    additionalProps: BackdropProps,
    getSlotProps: otherHandlers => {
      return getBackdropProps(_extends$2({}, otherHandlers, {
        onClick: e => {
          if (onBackdropClick) {
            onBackdropClick(e);
          }
          if (otherHandlers != null && otherHandlers.onClick) {
            otherHandlers.onClick(e);
          }
        }
      }));
    },
    className: clsx(backdropSlotProps == null ? void 0 : backdropSlotProps.className, BackdropProps == null ? void 0 : BackdropProps.className, classes == null ? void 0 : classes.backdrop),
    ownerState
  });
  if (!keepMounted && !open && (!hasTransition || exited)) {
    return null;
  }
  return /*#__PURE__*/jsxRuntimeExports.jsx(Portal$1, {
    ref: portalRef,
    container: container,
    disablePortal: disablePortal,
    children: /*#__PURE__*/jsxRuntimeExports.jsxs(RootSlot, _extends$2({}, rootProps, {
      children: [!hideBackdrop && BackdropComponent ? /*#__PURE__*/jsxRuntimeExports.jsx(BackdropSlot, _extends$2({}, backdropProps)) : null, /*#__PURE__*/jsxRuntimeExports.jsx(FocusTrap, {
        disableEnforceFocus: disableEnforceFocus,
        disableAutoFocus: disableAutoFocus,
        disableRestoreFocus: disableRestoreFocus,
        isEnabled: isTopModal,
        open: open,
        children: /*#__PURE__*/React.cloneElement(children, childProps)
      })]
    }))
  });
});
process.env.NODE_ENV !== "production" ? Modal.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A backdrop component. This prop enables custom backdrop rendering.
   * @deprecated Use `slots.backdrop` instead. While this prop currently works, it will be removed in the next major version.
   * Use the `slots.backdrop` prop to make your application ready for the next version of Material UI.
   * @default styled(Backdrop, {
   *   name: 'MuiModal',
   *   slot: 'Backdrop',
   *   overridesResolver: (props, styles) => {
   *     return styles.backdrop;
   *   },
   * })({
   *   zIndex: -1,
   * })
   */
  BackdropComponent: PropTypes.elementType,
  /**
   * Props applied to the [`Backdrop`](/material-ui/api/backdrop/) element.
   * @deprecated Use `slotProps.backdrop` instead.
   */
  BackdropProps: PropTypes.object,
  /**
   * A single child content element.
   */
  children: elementAcceptingRef$1.isRequired,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * When set to true the Modal waits until a nested Transition is completed before closing.
   * @default false
   */
  closeAfterTransition: PropTypes.bool,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The components used for each slot inside.
   *
   * This prop is an alias for the `slots` prop.
   * It's recommended to use the `slots` prop instead.
   *
   * @default {}
   */
  components: PropTypes.shape({
    Backdrop: PropTypes.elementType,
    Root: PropTypes.elementType
  }),
  /**
   * The extra props for the slot components.
   * You can override the existing props or add new ones.
   *
   * This prop is an alias for the `slotProps` prop.
   * It's recommended to use the `slotProps` prop instead, as `componentsProps` will be deprecated in the future.
   *
   * @default {}
   */
  componentsProps: PropTypes.shape({
    backdrop: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  }),
  /**
   * An HTML element or function that returns one.
   * The `container` will have the portal children appended to it.
   *
   * You can also provide a callback, which is called in a React layout effect.
   * This lets you set the container from a ref, and also makes server-side rendering possible.
   *
   * By default, it uses the body of the top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, PropTypes.func]),
  /**
   * If `true`, the modal will not automatically shift focus to itself when it opens, and
   * replace it to the last focused element when it closes.
   * This also works correctly with any modal children that have the `disableAutoFocus` prop.
   *
   * Generally this should never be set to `true` as it makes the modal less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableAutoFocus: PropTypes.bool,
  /**
   * If `true`, the modal will not prevent focus from leaving the modal while open.
   *
   * Generally this should never be set to `true` as it makes the modal less
   * accessible to assistive technologies, like screen readers.
   * @default false
   */
  disableEnforceFocus: PropTypes.bool,
  /**
   * If `true`, hitting escape will not fire the `onClose` callback.
   * @default false
   */
  disableEscapeKeyDown: PropTypes.bool,
  /**
   * The `children` will be under the DOM hierarchy of the parent component.
   * @default false
   */
  disablePortal: PropTypes.bool,
  /**
   * If `true`, the modal will not restore focus to previously focused element once
   * modal is hidden or unmounted.
   * @default false
   */
  disableRestoreFocus: PropTypes.bool,
  /**
   * Disable the scroll lock behavior.
   * @default false
   */
  disableScrollLock: PropTypes.bool,
  /**
   * If `true`, the backdrop is not rendered.
   * @default false
   */
  hideBackdrop: PropTypes.bool,
  /**
   * Always keep the children in the DOM.
   * This prop can be useful in SEO situation or
   * when you want to maximize the responsiveness of the Modal.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Callback fired when the backdrop is clicked.
   * @deprecated Use the `onClose` prop with the `reason` argument to handle the `backdropClick` events.
   */
  onBackdropClick: PropTypes.func,
  /**
   * Callback fired when the component requests to be closed.
   * The `reason` parameter can optionally be used to control the response to `onClose`.
   *
   * @param {object} event The event source of the callback.
   * @param {string} reason Can be: `"escapeKeyDown"`, `"backdropClick"`.
   */
  onClose: PropTypes.func,
  /**
   * A function called when a transition enters.
   */
  onTransitionEnter: PropTypes.func,
  /**
   * A function called when a transition has exited.
   */
  onTransitionExited: PropTypes.func,
  /**
   * If `true`, the component is shown.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The props used for each slot inside the Modal.
   * @default {}
   */
  slotProps: PropTypes.shape({
    backdrop: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
  }),
  /**
   * The components used for each slot inside the Modal.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    backdrop: PropTypes.elementType,
    root: PropTypes.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var Modal$1 = Modal;

function getDialogUtilityClass(slot) {
  return generateUtilityClass('MuiDialog', slot);
}
const dialogClasses = generateUtilityClasses('MuiDialog', ['root', 'scrollPaper', 'scrollBody', 'container', 'paper', 'paperScrollPaper', 'paperScrollBody', 'paperWidthFalse', 'paperWidthXs', 'paperWidthSm', 'paperWidthMd', 'paperWidthLg', 'paperWidthXl', 'paperFullWidth', 'paperFullScreen']);
var dialogClasses$1 = dialogClasses;

const DialogContext = /*#__PURE__*/React.createContext({});
if (process.env.NODE_ENV !== 'production') {
  DialogContext.displayName = 'DialogContext';
}
var DialogContext$1 = DialogContext;

const _excluded$1 = ["aria-describedby", "aria-labelledby", "BackdropComponent", "BackdropProps", "children", "className", "disableEscapeKeyDown", "fullScreen", "fullWidth", "maxWidth", "onBackdropClick", "onClick", "onClose", "open", "PaperComponent", "PaperProps", "scroll", "TransitionComponent", "transitionDuration", "TransitionProps"];
const DialogBackdrop = styled$3(Backdrop$1, {
  name: 'MuiDialog',
  slot: 'Backdrop',
  overrides: (props, styles) => styles.backdrop
})({
  // Improve scrollable dialog support.
  zIndex: -1
});
const useUtilityClasses$1 = ownerState => {
  const {
    classes,
    scroll,
    maxWidth,
    fullWidth,
    fullScreen
  } = ownerState;
  const slots = {
    root: ['root'],
    container: ['container', `scroll${capitalize$1(scroll)}`],
    paper: ['paper', `paperScroll${capitalize$1(scroll)}`, `paperWidth${capitalize$1(String(maxWidth))}`, fullWidth && 'paperFullWidth', fullScreen && 'paperFullScreen']
  };
  return composeClasses(slots, getDialogUtilityClass, classes);
};
const DialogRoot = styled$3(Modal$1, {
  name: 'MuiDialog',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  '@media print': {
    // Use !important to override the Modal inline-style.
    position: 'absolute !important'
  }
});
const DialogContainer = styled$3('div', {
  name: 'MuiDialog',
  slot: 'Container',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.container, styles[`scroll${capitalize$1(ownerState.scroll)}`]];
  }
})(({
  ownerState
}) => _extends$2({
  height: '100%',
  '@media print': {
    height: 'auto'
  },
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0
}, ownerState.scroll === 'paper' && {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}, ownerState.scroll === 'body' && {
  overflowY: 'auto',
  overflowX: 'hidden',
  textAlign: 'center',
  '&::after': {
    content: '""',
    display: 'inline-block',
    verticalAlign: 'middle',
    height: '100%',
    width: '0'
  }
}));
const DialogPaper = styled$3(Paper$1, {
  name: 'MuiDialog',
  slot: 'Paper',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.paper, styles[`scrollPaper${capitalize$1(ownerState.scroll)}`], styles[`paperWidth${capitalize$1(String(ownerState.maxWidth))}`], ownerState.fullWidth && styles.paperFullWidth, ownerState.fullScreen && styles.paperFullScreen];
  }
})(({
  theme,
  ownerState
}) => _extends$2({
  margin: 32,
  position: 'relative',
  overflowY: 'auto',
  // Fix IE11 issue, to remove at some point.
  '@media print': {
    overflowY: 'visible',
    boxShadow: 'none'
  }
}, ownerState.scroll === 'paper' && {
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100% - 64px)'
}, ownerState.scroll === 'body' && {
  display: 'inline-block',
  verticalAlign: 'middle',
  textAlign: 'left' // 'initial' doesn't work on IE11
}, !ownerState.maxWidth && {
  maxWidth: 'calc(100% - 64px)'
}, ownerState.maxWidth === 'xs' && {
  maxWidth: theme.breakpoints.unit === 'px' ? Math.max(theme.breakpoints.values.xs, 444) : `max(${theme.breakpoints.values.xs}${theme.breakpoints.unit}, 444px)`,
  [`&.${dialogClasses$1.paperScrollBody}`]: {
    [theme.breakpoints.down(Math.max(theme.breakpoints.values.xs, 444) + 32 * 2)]: {
      maxWidth: 'calc(100% - 64px)'
    }
  }
}, ownerState.maxWidth && ownerState.maxWidth !== 'xs' && {
  maxWidth: `${theme.breakpoints.values[ownerState.maxWidth]}${theme.breakpoints.unit}`,
  [`&.${dialogClasses$1.paperScrollBody}`]: {
    [theme.breakpoints.down(theme.breakpoints.values[ownerState.maxWidth] + 32 * 2)]: {
      maxWidth: 'calc(100% - 64px)'
    }
  }
}, ownerState.fullWidth && {
  width: 'calc(100% - 64px)'
}, ownerState.fullScreen && {
  margin: 0,
  width: '100%',
  maxWidth: '100%',
  height: '100%',
  maxHeight: 'none',
  borderRadius: 0,
  [`&.${dialogClasses$1.paperScrollBody}`]: {
    margin: 0,
    maxWidth: '100%'
  }
}));

/**
 * Dialogs are overlaid modal paper based components with a backdrop.
 */
const Dialog = /*#__PURE__*/React.forwardRef(function Dialog(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiDialog'
  });
  const theme = useTheme();
  const defaultTransitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen
  };
  const {
      'aria-describedby': ariaDescribedby,
      'aria-labelledby': ariaLabelledbyProp,
      BackdropComponent,
      BackdropProps,
      children,
      className,
      disableEscapeKeyDown = false,
      fullScreen = false,
      fullWidth = false,
      maxWidth = 'sm',
      onBackdropClick,
      onClick,
      onClose,
      open,
      PaperComponent = Paper$1,
      PaperProps = {},
      scroll = 'paper',
      TransitionComponent = Fade$1,
      transitionDuration = defaultTransitionDuration,
      TransitionProps
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded$1);
  const ownerState = _extends$2({}, props, {
    disableEscapeKeyDown,
    fullScreen,
    fullWidth,
    maxWidth,
    scroll
  });
  const classes = useUtilityClasses$1(ownerState);
  const backdropClick = React.useRef();
  const handleMouseDown = event => {
    // We don't want to close the dialog when clicking the dialog content.
    // Make sure the event starts and ends on the same DOM element.
    backdropClick.current = event.target === event.currentTarget;
  };
  const handleBackdropClick = event => {
    if (onClick) {
      onClick(event);
    }

    // Ignore the events not coming from the "backdrop".
    if (!backdropClick.current) {
      return;
    }
    backdropClick.current = null;
    if (onBackdropClick) {
      onBackdropClick(event);
    }
    if (onClose) {
      onClose(event, 'backdropClick');
    }
  };
  const ariaLabelledby = useId(ariaLabelledbyProp);
  const dialogContextValue = React.useMemo(() => {
    return {
      titleId: ariaLabelledby
    };
  }, [ariaLabelledby]);
  return /*#__PURE__*/jsxRuntimeExports.jsx(DialogRoot, _extends$2({
    className: clsx(classes.root, className),
    closeAfterTransition: true,
    components: {
      Backdrop: DialogBackdrop
    },
    componentsProps: {
      backdrop: _extends$2({
        transitionDuration,
        as: BackdropComponent
      }, BackdropProps)
    },
    disableEscapeKeyDown: disableEscapeKeyDown,
    onClose: onClose,
    open: open,
    ref: ref,
    onClick: handleBackdropClick,
    ownerState: ownerState
  }, other, {
    children: /*#__PURE__*/jsxRuntimeExports.jsx(TransitionComponent, _extends$2({
      appear: true,
      in: open,
      timeout: transitionDuration,
      role: "presentation"
    }, TransitionProps, {
      children: /*#__PURE__*/jsxRuntimeExports.jsx(DialogContainer, {
        className: clsx(classes.container),
        onMouseDown: handleMouseDown,
        ownerState: ownerState,
        children: /*#__PURE__*/jsxRuntimeExports.jsx(DialogPaper, _extends$2({
          as: PaperComponent,
          elevation: 24,
          role: "dialog",
          "aria-describedby": ariaDescribedby,
          "aria-labelledby": ariaLabelledby
        }, PaperProps, {
          className: clsx(classes.paper, PaperProps.className),
          ownerState: ownerState,
          children: /*#__PURE__*/jsxRuntimeExports.jsx(DialogContext$1.Provider, {
            value: dialogContextValue,
            children: children
          })
        }))
      })
    }))
  }));
});
process.env.NODE_ENV !== "production" ? Dialog.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The id(s) of the element(s) that describe the dialog.
   */
  'aria-describedby': PropTypes.string,
  /**
   * The id(s) of the element(s) that label the dialog.
   */
  'aria-labelledby': PropTypes.string,
  /**
   * A backdrop component. This prop enables custom backdrop rendering.
   * @deprecated Use `slots.backdrop` instead. While this prop currently works, it will be removed in the next major version.
   * Use the `slots.backdrop` prop to make your application ready for the next version of Material UI.
   * @default styled(Backdrop, {
   *   name: 'MuiModal',
   *   slot: 'Backdrop',
   *   overridesResolver: (props, styles) => {
   *     return styles.backdrop;
   *   },
   * })({
   *   zIndex: -1,
   * })
   */
  BackdropComponent: PropTypes.elementType,
  /**
   * @ignore
   */
  BackdropProps: PropTypes.object,
  /**
   * Dialog children, usually the included sub-components.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * If `true`, hitting escape will not fire the `onClose` callback.
   * @default false
   */
  disableEscapeKeyDown: PropTypes.bool,
  /**
   * If `true`, the dialog is full-screen.
   * @default false
   */
  fullScreen: PropTypes.bool,
  /**
   * If `true`, the dialog stretches to `maxWidth`.
   *
   * Notice that the dialog width grow is limited by the default margin.
   * @default false
   */
  fullWidth: PropTypes.bool,
  /**
   * Determine the max-width of the dialog.
   * The dialog width grows with the size of the screen.
   * Set to `false` to disable `maxWidth`.
   * @default 'sm'
   */
  maxWidth: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]), PropTypes.string]),
  /**
   * Callback fired when the backdrop is clicked.
   * @deprecated Use the `onClose` prop with the `reason` argument to handle the `backdropClick` events.
   */
  onBackdropClick: PropTypes.func,
  /**
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * Callback fired when the component requests to be closed.
   *
   * @param {object} event The event source of the callback.
   * @param {string} reason Can be: `"escapeKeyDown"`, `"backdropClick"`.
   */
  onClose: PropTypes.func,
  /**
   * If `true`, the component is shown.
   */
  open: PropTypes.bool.isRequired,
  /**
   * The component used to render the body of the dialog.
   * @default Paper
   */
  PaperComponent: PropTypes.elementType,
  /**
   * Props applied to the [`Paper`](/material-ui/api/paper/) element.
   * @default {}
   */
  PaperProps: PropTypes.object,
  /**
   * Determine the container for scrolling the dialog.
   * @default 'paper'
   */
  scroll: PropTypes.oneOf(['body', 'paper']),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The component used for the transition.
   * [Follow this guide](/material-ui/transitions/#transitioncomponent-prop) to learn more about the requirements for this component.
   * @default Fade
   */
  TransitionComponent: PropTypes.elementType,
  /**
   * The duration for the transition, in milliseconds.
   * You may specify a single timeout for all transitions, or individually with an object.
   * @default {
   *   enter: theme.transitions.duration.enteringScreen,
   *   exit: theme.transitions.duration.leavingScreen,
   * }
   */
  transitionDuration: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
    appear: PropTypes.number,
    enter: PropTypes.number,
    exit: PropTypes.number
  })]),
  /**
   * Props applied to the transition element.
   * By default, the element is based on this [`Transition`](https://reactcommunity.org/react-transition-group/transition/) component.
   */
  TransitionProps: PropTypes.object
} : void 0;
var Dialog$1 = Dialog;

function getDialogContentUtilityClass(slot) {
  return generateUtilityClass('MuiDialogContent', slot);
}
generateUtilityClasses('MuiDialogContent', ['root', 'dividers']);

const dialogTitleClasses = generateUtilityClasses('MuiDialogTitle', ['root']);
var dialogTitleClasses$1 = dialogTitleClasses;

const _excluded = ["className", "dividers"];
const useUtilityClasses = ownerState => {
  const {
    classes,
    dividers
  } = ownerState;
  const slots = {
    root: ['root', dividers && 'dividers']
  };
  return composeClasses(slots, getDialogContentUtilityClass, classes);
};
const DialogContentRoot = styled$3('div', {
  name: 'MuiDialogContent',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.dividers && styles.dividers];
  }
})(({
  theme,
  ownerState
}) => _extends$2({
  flex: '1 1 auto',
  // Add iOS momentum scrolling for iOS < 13.0
  WebkitOverflowScrolling: 'touch',
  overflowY: 'auto',
  padding: '20px 24px'
}, ownerState.dividers ? {
  padding: '16px 24px',
  borderTop: `1px solid ${(theme.vars || theme).palette.divider}`,
  borderBottom: `1px solid ${(theme.vars || theme).palette.divider}`
} : {
  [`.${dialogTitleClasses$1.root} + &`]: {
    paddingTop: 0
  }
}));
const DialogContent = /*#__PURE__*/React.forwardRef(function DialogContent(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: 'MuiDialogContent'
  });
  const {
      className,
      dividers = false
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded);
  const ownerState = _extends$2({}, props, {
    dividers
  });
  const classes = useUtilityClasses(ownerState);
  return /*#__PURE__*/jsxRuntimeExports.jsx(DialogContentRoot, _extends$2({
    className: clsx(classes.root, className),
    ownerState: ownerState,
    ref: ref
  }, other));
});
process.env.NODE_ENV !== "production" ? DialogContent.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * Display the top and bottom dividers.
   * @default false
   */
  dividers: PropTypes.bool,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
var DialogContent$1 = DialogContent;

function ImagePreview({
  open,
  items,
  initialIndex = 0,
  onClose
}) {
  const [currentIndex, setCurrentIndex] = React__default.useState(initialIndex);
  React__default.useEffect(() => {
    if (open) setCurrentIndex(initialIndex || 0);
  }, [open, initialIndex]);
  if (!items || items.length === 0) return null;
  const handlePrev = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : items.length - 1);
  };
  const handleNext = () => {
    setCurrentIndex(prev => prev < items.length - 1 ? prev + 1 : 0);
  };
  return /*#__PURE__*/React__default.createElement(Dialog$1, {
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
    }
  }, /*#__PURE__*/React__default.createElement(Box$1, {
    sx: {
      display: "flex",
      justifyContent: "flex-end",
      p: 1
    }
  }, /*#__PURE__*/React__default.createElement(IconButton$1, {
    onClick: onClose
  }, /*#__PURE__*/React__default.createElement(CloseIcon, null))), /*#__PURE__*/React__default.createElement(DialogContent$1, {
    sx: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      p: 2,
      minWidth: 320,
      minHeight: 350,
      background: "#f9f9f9"
    }
  }, /*#__PURE__*/React__default.createElement(IconButton$1, {
    onClick: handlePrev,
    disabled: items.length <= 1,
    sx: {
      mx: 1
    }
  }, /*#__PURE__*/React__default.createElement(ArrowBackIosIcon, null)), /*#__PURE__*/React__default.createElement(Box$1, {
    sx: {
      maxWidth: 480,
      maxHeight: 350,
      width: "100%",
      height: "100%",
      textAlign: "center",
      position: "relative"
    }
  }, /*#__PURE__*/React__default.createElement("img", {
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
  })), /*#__PURE__*/React__default.createElement(IconButton$1, {
    onClick: handleNext,
    disabled: items.length <= 1,
    sx: {
      mx: 1
    }
  }, /*#__PURE__*/React__default.createElement(ArrowForwardIosIcon, null))), /*#__PURE__*/React__default.createElement(Box$1, {
    sx: {
      textAlign: "center",
      p: 1,
      fontSize: 13,
      color: "#888"
    }
  }, currentIndex + 1, " / ", items.length));
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
  return /*#__PURE__*/React.createElement(Button, {
    onClick: action,
    sx: buttonStyle,
    variant: "contained",
    disabled: disabled
  }, label);
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
  const [searchkey, setsearchkey] = useState("");
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = useState(false);
  const direction = "ltr";
  const focusedRef = useRef(false); // Use ref to track focus state
  const highlightRef = useRef(false); // Separate ref to track component focus state

  // Effect to set the formDataName based on formDataiId
  useEffect(() => {
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
  return /*#__PURE__*/React__default.createElement(Autocomplete, {
    autoHighlight: true,
    key: `${label}_${autoCompleteKey}`,
    disabled: disabled,
    size: "small",
    PaperComponent: ({
      children
    }) => /*#__PURE__*/React__default.createElement(Paper$2, {
      style: {
        minWidth: "150px",
        maxWidth: "300px"
      }
    }, children),
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
    renderOption: (props, option) => /*#__PURE__*/React__default.createElement("li", _extends$3({}, props, {
      key: option.Id
    }), /*#__PURE__*/React__default.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // Align items vertically for better layout
        width: "100%",
        gap: 1 // Add gap between Name and Code
      }
    }, /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        fontSize: "12px",
        flex: 1,
        textAlign: "left"
      }
    }, option?.Name), /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        fontSize: "12px",
        flex: 1,
        textAlign: "right"
      }
    }, option?.Code))),
    renderInput: params => /*#__PURE__*/React__default.createElement(TextField, _extends$3({
      required: required,
      label: label
    }, params, {
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
    }))
    //ListboxComponent={needHeader?CustomListBox:null}
  });
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
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [previewItems, setPreviewItems] = React.useState([]);
  const [previewInitialIndex, setPreviewInitialIndex] = React.useState(0);
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
  React.useEffect(() => {
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
  React.useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);
  React.useEffect(() => {
    setPage(0); // Reset page to 0
    props.onpageNumberChange(1); // Call the callback function with 0 if needed
    props.setchangesTriggered(false);
    setSelected([]);
    setSearchTerm("");
  }, [props.changesTriggered]);
  React.useEffect(() => {
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
  return /*#__PURE__*/React.createElement(Box$1, {
    sx: {
      width: "98%",
      margin: "auto",
      marginTop: "5px",
      boxShadow: 3,
      paddingLeft: "10px",
      paddingRight: "10px",
      paddingBottom: "5px",
      backgroundColor: "#f3f3f3ff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "row",
      width: "auto",
      justifyContent: "center",
      alignItems: "center",
      marginTop: "8px",
      flexWrap: "wrap",
      gap: "4px"
    }
  }, /*#__PURE__*/React.createElement(FormControl, null, /*#__PURE__*/React.createElement(InputLabel, {
    htmlFor: "rows-per-page",
    sx: {
      "&.Mui-focused": {
        color: "currentColor" // Keeps the current color
      }
    }
  }, "Show Entries"), /*#__PURE__*/React.createElement(Select, {
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
    }
  }, /*#__PURE__*/React.createElement(MenuItem, {
    value: 25
  }, "25"), /*#__PURE__*/React.createElement(MenuItem, {
    value: 50
  }, "50"), /*#__PURE__*/React.createElement(MenuItem, {
    value: 100
  }, "100"))), StatusDropdown ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Box$1, {
    sx: {
      mt: -2
    }
  }, /*#__PURE__*/React.createElement(AutoSelectNoHeader, {
    key: "Status",
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
  })), /*#__PURE__*/React.createElement(NormalButton, {
    action: UpdateStatus,
    label: "Apply"
  })) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tooltip, {
    title: "Refresh"
  }, /*#__PURE__*/React.createElement(IconButton$2, {
    onClick: hardRefresh,
    sx: iconsExtraSx
  }, /*#__PURE__*/React.createElement(RefreshIcon, null))), /*#__PURE__*/React.createElement(Tooltip, {
    title: "Fit Content"
  }, /*#__PURE__*/React.createElement(IconButton$2, {
    onClick: handleFitContent,
    sx: iconsExtraSx
  }, /*#__PURE__*/React.createElement(FitScreenIcon, null))), /*#__PURE__*/React.createElement(Tooltip, {
    title: "Expand All"
  }, /*#__PURE__*/React.createElement(IconButton$2, {
    onClick: handleExpandAll,
    sx: iconsExtraSx
  }, /*#__PURE__*/React.createElement(FullscreenIcon, null))), /*#__PURE__*/React.createElement(TextField, {
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
  }))), /*#__PURE__*/React.createElement("div", {
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
    }
  }, parentList?.map((parent, index) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: parent.Id
  }, /*#__PURE__*/React.createElement(Typography$2, {
    variant: "body2",
    onClick: () => handleParentGroup(parent.Id),
    style: {
      cursor: "pointer"
      // You can style the text
    }
  }, parent.Name), index < parentList.length - 1 && /*#__PURE__*/React.createElement(ChevronRightIcon, {
    fontSize: "small"
  })))), filteredRows && filteredRows.length > 0 ? /*#__PURE__*/React.createElement(Paper$1, {
    sx: {
      width: "100%",
      mb: 1
    }
  }, /*#__PURE__*/React.createElement(TableContainer$1, {
    sx: {
      maxHeight: "58vh",
      overflow: "auto",
      scrollbarWidth: "thin"
    }
  }, /*#__PURE__*/React.createElement(Table$1, {
    stickyHeader: true,
    sx: {
      minWidth: 750
    }
  }, /*#__PURE__*/React.createElement(TableHead$1, null, /*#__PURE__*/React.createElement(TableRow$1, {
    sx: {
      position: "sticky",
      top: 0,
      zIndex: 10
    }
  }, columns.map((column, index) => /*#__PURE__*/React.createElement(TableCell$1, {
    key: column.id,
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
    onDoubleClick: () => handleDoubleClick(index)
  }, column.label, /*#__PURE__*/React.createElement("span", {
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
  }))), IsSignature && totalPages > 0 && /*#__PURE__*/React.createElement(TableCell$1, {
    key: "signature-header",
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
    }
  }, "Signature"), IsAttachments && totalPages > 0 && /*#__PURE__*/React.createElement(TableCell$1, {
    key: "attachments-header",
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
    }
  }, "Attachments"), isConvert && [21, 22].includes(Number(screenId)) && /*#__PURE__*/React.createElement(TableCell$1, {
    key: "Action-header",
    sx: {
      padding: "3px 4px",
      border: "1px solid #ddd",
      fontWeight: 600,
      fontSize: "14px",
      backgroundColor: thirdColor,
      color: "white",
      minWidth: 120,
      textAlign: "center"
    }
  }, "Action"))), /*#__PURE__*/React.createElement(TableBody$1, null, filteredRows.map((row, index) => {
    const isItemSelected = isSelected(row[IdName]);
    return /*#__PURE__*/React.createElement(TableRow$1, {
      key: `${row[IdName]}-${index}`,
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
      }
    }, columns.map(column => /*#__PURE__*/React.createElement(Tooltip, {
      title: column.id === "Narration" ? row[column.id] : null,
      key: column.id
    }, /*#__PURE__*/React.createElement(TableCell$1, {
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
      key: column.id,
      onDoubleClick: () => props.onRowDoubleClick && props.onRowDoubleClick(row[IdName]),
      onClick: event => handleClick(event, row)
    }, profileDateFieldsArray.includes(column.label) ? convertToLocaleDateString(row[column.id]) : transactionDateTimeFieldsArray.includes(column.label) ? convertToLocaleDateTimeString(row[column.id]) : formatValue(row[column.id])))), IsSignature && totalPages > 0 && /*#__PURE__*/React.createElement(TableCell$1, {
      key: `signature-${row[IdName]}`,
      sx: {
        padding: "0px",
        textAlign: "center",
        border: `1px solid #ddd`,
        minWidth: "100px"
      }
    }, row.Signature ? /*#__PURE__*/React.createElement(Tooltip, {
      title: "View Signature"
    }, /*#__PURE__*/React.createElement("img", {
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
    })) : ""), IsAttachments && totalPages > 0 && /*#__PURE__*/React.createElement(TableCell$1, {
      key: `attachments-${row[IdName]}`,
      sx: {
        padding: "0px",
        textAlign: "center",
        border: `1px solid #ddd`,
        minWidth: "100px"
      }
    }, !!row.Attachments ? /*#__PURE__*/React.createElement(Tooltip, {
      title: "View Attachments"
    }, /*#__PURE__*/React.createElement(IconButton$2, {
      onClick: e => {
        e.stopPropagation();
        handleAttachmentsPreview(row.Attachments);
      },
      sx: {
        color: primaryColor,
        width: "5px",
        height: "5px"
      }
    }, /*#__PURE__*/React.createElement(AttachmentIcon, null))) : ""), isConvert && row?.TransId > 0 && [21, 22].includes(Number(screenId)) && /*#__PURE__*/React.createElement(TableCell$1, {
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
      }
    }, /*#__PURE__*/React.createElement(TableButton, {
      disabled: row?.Status == "Draft" || row?.Status == "Converted",
      action: () => handleConvert(row),
      label: "Convert"
    })));
  }))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Box$1, {
    sx: {
      width: "100%",
      textAlign: "center",
      my: 4
    }
  })), filteredRows && filteredRows.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Box$1, {
    sx: {
      width: "100%",
      textAlign: "right",
      fontSize: "0.85rem",
      color: "#333",
      mt: 1,
      mb: -1,
      pr: 2
    }
  }, "Total Rows: ", /*#__PURE__*/React.createElement("b", null, totalRows || rows?.[0]?.TotalRows || 0)), /*#__PURE__*/React.createElement(Pagination$1, {
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
  })), /*#__PURE__*/React.createElement(ImagePreview, {
    open: imageDialogOpen,
    items: previewItems,
    initialIndex: previewInitialIndex,
    onClose: () => {
      setImageDialogOpen(false);
      setPreviewInitialIndex(0);
      setPreviewItems([]);
    }
  }));
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
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      marginLeft: 20
    }
  }, page > 0 && /*#__PURE__*/React.createElement(IconButton$2, {
    onClick: () => handlePageButtonClick(0)
  }, /*#__PURE__*/React.createElement(FirstPageIcon$1, null)), pages.map(pageNum => /*#__PURE__*/React.createElement(IconButton$2, {
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
    key: pageNum,
    color: pageNum === page ? "primary" : "default",
    onClick: () => handlePageButtonClick(pageNum),
    disabled: pageNum > lastPage
  }, pageNum + 1)), page < lastPage && /*#__PURE__*/React.createElement(IconButton$2, {
    onClick: () => handlePageButtonClick(lastPage)
  }, /*#__PURE__*/React.createElement(LastPageIcon$1, null)));
};

function ConfirmationAlert({
  handleClose,
  open,
  data,
  submite
}) {
  useTheme$3();
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(MDBModal, {
    open: open,
    onClose: handleClose,
    tabIndex: "-1",
    centered: true
  }, /*#__PURE__*/React__default.createElement(MDBModalDialog, {
    size: "sm",
    style: {
      marginTop: 100
    }
  }, /*#__PURE__*/React__default.createElement(MDBModalContent, null, /*#__PURE__*/React__default.createElement(MDBModalHeader, {
    className: `bg-${data?.type} text-white d-flex justify-content-center`
  }, /*#__PURE__*/React__default.createElement(MDBModalTitle, null, data?.message)), /*#__PURE__*/React__default.createElement(MDBModalBody, {
    className: "d-flex justify-content-center align-items-center"
  }, /*#__PURE__*/React__default.createElement(Typography$2, {
    sx: {
      textTransform: 'none'
    },
    m: 2,
    color: "grey"
  }, "Do you want to ", data?.message)), /*#__PURE__*/React__default.createElement(MDBModalFooter, {
    className: "d-flex justify-content-center"
  }, /*#__PURE__*/React__default.createElement(MDBBtn, {
    color: "secondary",
    onClick: handleClose,
    style: {
      textTransform: "none"
    }
  }, "Close"), /*#__PURE__*/React__default.createElement(MDBBtn, {
    onClick: submite,
    color: data?.type,
    style: {
      textTransform: "none"
    }
  }, data?.message))))));
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
  const workbook = new ExcelJS.Workbook();

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
  saveAs(new Blob([buffer], {
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
  useTheme$3();

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
  const buttonContent = /*#__PURE__*/React__default.createElement(Stack, {
    direction: "column",
    alignItems: "center",
    spacing: 0.1
  }, loading ? /*#__PURE__*/React__default.createElement(MDBIcon, {
    fas: true,
    icon: "spinner",
    spin: true,
    style: iconStyle
  }) : /*#__PURE__*/React__default.createElement(MDBIcon, {
    fas: true,
    icon: icon,
    style: iconStyle
  }), /*#__PURE__*/React__default.createElement(Typography$2, {
    variant: "caption",
    align: "center",
    sx: textStyle
  }, caption));
  return /*#__PURE__*/React__default.createElement(Tooltip, {
    title: tooltip,
    arrow: true,
    placement: "top"
  }, /*#__PURE__*/React__default.createElement(Box$2, {
    component: "span"
  }, /*#__PURE__*/React__default.createElement(IconButton$2, {
    "aria-label": caption || iconName,
    sx: buttonSx,
    onClick: () => iconsClick(iconName),
    disabled: disabled || loading,
    size: size
  }, buttonContent)));
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
  return /*#__PURE__*/React__default.createElement("div", {
    role: "presentation",
    style: {
      display: "flex",
      flexDirection: "row",
      maxWidth: "fit-content",
      alignItems: "center"
    }
  }, /*#__PURE__*/React__default.createElement(Stack, {
    spacing: 2,
    sx: {
      flex: 1
    }
  }, /*#__PURE__*/React__default.createElement(Breadcrumbs$1, {
    separator: /*#__PURE__*/React__default.createElement(NavigateNextIcon$1, {
      fontSize: "small",
      sx: {
        color: primaryColor
      }
    }),
    "aria-label": "breadcrumb"
  }, /*#__PURE__*/React__default.createElement(Typography$2, {
    underline: "hover",
    sx: style,
    key: "1"
  }, "User Summary"))));
}
const DefaultIcons$1 = ({
  iconsClick,
  userAction
}) => {
  const hasEditAction = userAction.some(action => action.Action_Name === "Edit");
  return /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      flexDirection: "row",
      gap: "5px",
      alignItems: "center",
      overflowX: "auto",
      scrollbarWidth: "thin"
    }
  }, userAction.some(action => action.Action_Name === "New") && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-plus",
    caption: "New",
    iconName: "new"
  }), userAction.some(action => action.Action_Name === "Edit") && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-pen",
    caption: "Edit",
    iconName: "edit"
  }), userAction.some(action => action.Action_Name === "Excel") && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-file-excel",
    caption: "Excel",
    iconName: "excel"
  }), userAction.some(action => action.Action_Name === "Delete") && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "trash",
    caption: "Delete",
    iconName: "delete"
  }), !hasEditAction && userAction.some(action => action.Name === "View") && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-eye",
    caption: "View",
    iconName: "view"
  }), /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-xmark",
    caption: "Close",
    iconName: "close"
  }));
};
function UserSummary({
  setPageRender,
  setId,
  userAction
}) {
  const [rows, setRows] = React__default.useState([]); //To Pass in Table
  const [displayLength, setdisplayLength] = React__default.useState(25); // Show Entries
  const [pageNumber, setpageNumber] = React__default.useState(1); //Table current page number
  const [changesTriggered, setchangesTriggered] = React__default.useState(false); //Any changes made like delete, add new role then makes it true for refreshing the table
  const [selectedDatas, setselectedDatas] = React__default.useState([]); //selected rows details
  const [totalRows, settotalRows] = useState(null); // Total rows of Api response
  const [refreshFlag, setrefreshFlag] = React__default.useState(true); //To take data from Data base
  const [searchKey, setsearchKey] = useState(""); //Table Searching
  const [totalPages, setTotalPages] = useState(null);
  const {
    showAlert
  } = useAlert();
  const [confirmAlert, setConfirmAlert] = useState(false); //To handle alert open
  const [confirmData, setConfirmData] = useState({}); //To pass alert data
  const latestSearchKeyRef = useRef(searchKey);
  const {
    getSecuritysummary,
    deleteuser,
    deleterole
  } = securityApis();
  useTheme$3();
  const navigate = useNavigate();
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
  React__default.useEffect(() => {
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
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      flexDirection: "column",
      width: "100%"
    }
  }, /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingLeft: 1.5,
      paddingRight: 1.5,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React__default.createElement(BasicBreadcrumbs$1, null), /*#__PURE__*/React__default.createElement(DefaultIcons$1, {
    iconsClick: handleIconsClick,
    userAction: userAction
  })), /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      width: "100%",
      overflowX: "auto",
      paddingBottom: "10px"
    }
  }, /*#__PURE__*/React__default.createElement(SummaryTable, {
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
  })), /*#__PURE__*/React__default.createElement(ConfirmationAlert, {
    handleClose: handleConfrimClose,
    open: confirmAlert,
    data: confirmData,
    submite: handledeleteRole
  })));
}

const CustomTextField$1 = styled$1(TextField)({
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
  const [tabPressed, setTabPressed] = useState(false);
  const [timeFormat, setTimeFormat] = useState('24h');
  const [isPickerSupported, setIsPickerSupported] = useState(false);
  const {
    showAlert
  } = useAlert();
  const inputRef = useRef(null);

  // Detect browser's time format and picker support
  useEffect(() => {
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
  return /*#__PURE__*/React__default.createElement(CustomTextField$1, {
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
  const [searchkey, setsearchkey] = useState("");
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = useState(false);
  const direction = "ltr";
  const focusedRef = useRef(false); // Use ref to track focus state
  const highlightRef = useRef(false); // Separate ref to track component focus state

  // Effect to set the formDataName based on formDataiId
  const didInitRef = useRef(false);
  useEffect(() => {
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
  const CustomListBox = /*#__PURE__*/React__default.forwardRef((props, ref) => {
    const {
      children,
      ...other
    } = props;
    return /*#__PURE__*/React__default.createElement("ul", _extends$3({
      style: {
        paddingTop: 0,
        scrollbarWidth: "thin"
      },
      ref: ref
    }, other), /*#__PURE__*/React__default.createElement(ListSubheader, {
      style: {
        backgroundColor: thirdColor,
        padding: "5px",
        color: "#fff"
      }
    }, /*#__PURE__*/React__default.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        width: "100%"
      }
    }, /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        marginRight: "auto",
        fontSize: "0.8rem"
      }
    }, "Name"), /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        marginLeft: "auto",
        fontSize: "0.8rem"
      }
    }, "Code"))), children);
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
  return /*#__PURE__*/React__default.createElement(Autocomplete, {
    autoHighlight: true,
    key: `${label}_${autoCompleteKey}`,
    disabled: disabled,
    size: "small",
    PaperComponent: ({
      children
    }) => /*#__PURE__*/React__default.createElement(Paper$2, {
      style: {
        minWidth: "150px",
        maxWidth: "300px"
      }
    }, children),
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
    renderOption: (props, option) => /*#__PURE__*/React__default.createElement("li", _extends$3({}, props, {
      key: option.Id
    }), /*#__PURE__*/React__default.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // Align items vertically for better layout
        width: "100%",
        gap: 1 // Add gap between Name and Code
      }
    }, /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        fontSize: "12px",
        flex: 1,
        textAlign: "left"
      }
    }, option?.Name), /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        fontSize: "12px",
        flex: 1,
        textAlign: "right"
      }
    }, option?.Code))),
    renderInput: params => /*#__PURE__*/React__default.createElement(TextField, _extends$3({
      required: required,
      label: label
    }, params, {
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
    })),
    ListboxComponent: CustomListBox
  });
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

const CustomTextField = styled$1(TextField)({
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
  const [inputValue, setInputValue] = useState(value || "");
  const [isBlurred, setIsBlurred] = useState(false);
  const [fieldKey, setFieldKey] = useState(0);
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
  useEffect(() => {
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
  useEffect(() => {
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
  return /*#__PURE__*/React__default.createElement(CustomTextField, {
    key: fieldKey,
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
      endAdornment: type == InputType.time && inputValue ? /*#__PURE__*/React__default.createElement(InputAdornment, {
        position: "end"
      }, /*#__PURE__*/React__default.createElement(IconButton$2, {
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
      }, /*#__PURE__*/React__default.createElement(ClearIcon, {
        fontSize: "small"
      }))) : null,
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
  });
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
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogImageSrc, setDialogImageSrc] = useState('');
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
        return /*#__PURE__*/React__default.createElement(PersonIcon, {
          style: {
            fontSize: "25px"
          }
        });
      case "signature":
        return /*#__PURE__*/React__default.createElement(BorderColorIcon, {
          style: {
            fontSize: "25px"
          }
        });
      default:
        return /*#__PURE__*/React__default.createElement(CloudUploadIcon, {
          style: {
            fontSize: "25px"
          }
        });
    }
  };
  const imageField = field + "_preview";
  return /*#__PURE__*/React__default.createElement("div", {
    style: {
      width: 250,
      alignItems: "center",
      textAlign: "center"
    }
  }, formData[imageField] ? /*#__PURE__*/React__default.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React__default.createElement("img", {
    src: formData[imageField],
    alt: "Upload",
    style: {
      width: "60px",
      height: "60px"
    },
    onClick: () => handleClickOpen(formData[imageField])
  }), /*#__PURE__*/React__default.createElement(Tooltip, {
    title: `Delete ${label}`,
    arrow: true
  }, /*#__PURE__*/React__default.createElement(IconButton$2, {
    onClick: handleDeleteClick(field) // Fixed invocation here
    ,
    style: {
      position: "absolute",
      right: -5,
      top: -10
    },
    disabled: disabled
  }, /*#__PURE__*/React__default.createElement(DeleteIcon, null)))) : /*#__PURE__*/React__default.createElement(IconButton$2, {
    onClick: handleUploadClick(field) // Fixed invocation here
    ,
    style: {
      color: secondaryColor
    },
    disabled: disabled
  }, getIconForField(field)), !formData[imageField] && /*#__PURE__*/React__default.createElement(Typography$2, {
    sx: {
      fontSize: "12px",
      mt: 1
    },
    variant: "subtitle1"
  }, "Add ", label), /*#__PURE__*/React__default.createElement(Dialog$2, {
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
    }
  }, /*#__PURE__*/React__default.createElement(IconButton$2, {
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
    }
  }, /*#__PURE__*/React__default.createElement(CloseIcon, null)), /*#__PURE__*/React__default.createElement(DialogContent$2, {
    dividers: true
  }, /*#__PURE__*/React__default.createElement("img", {
    src: dialogImageSrc,
    alt: "Full Size",
    style: {
      width: '100%',
      height: 'auto'
    }
  }))));
};

function encrypt(plainText, useDefaultEncryptKey = true) {
  // Ensure the encryption key matches the one used in .NET (UTF-8 encoded)
  const key = CryptoJS.enc.Utf8.parse(getEncryptionKey(useDefaultEncryptKey));

  // Use a 16-byte IV of all zeros, which matches the .NET code (aes.IV = new byte[16];)
  const iv = CryptoJS.enc.Utf8.parse('\0'.repeat(16));

  // Perform AES encryption with CBC mode and PKCS#7 padding (same as in .NET)
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
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
  useTheme$3();
  const {
    showAlert
  } = useAlert();
  const [formData, setFormData] = useState({
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
  const PasswordTooltip = () => /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      p: 0.5
    }
  }, /*#__PURE__*/React__default.createElement(Typography$2, {
    sx: {
      fontSize: "12px"
    }
  }, passwordPolicy?.Description || "No password policy set"), passwordPolicy?.MinLength > 0 && /*#__PURE__*/React__default.createElement(Typography$2, {
    sx: {
      fontSize: "12px"
    }
  }, "Minimum Length: ", passwordPolicy.MinLength));
  useEffect(() => {
    setFormData({
      userId: 0,
      password: "",
      CPassword: ""
    });
  }, [open]);
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(MDBModal, {
    open: open,
    onClose: () => handleClose(0),
    tabIndex: "-1",
    centered: true
  }, /*#__PURE__*/React__default.createElement(MDBModalDialog, {
    size: "md",
    style: {
      marginTop: '55px'
    }
  }, /*#__PURE__*/React__default.createElement(MDBModalContent, null, /*#__PURE__*/React__default.createElement(MDBModalHeader, {
    className: `bg-primary text-white d-flex justify-content-center`
  }, /*#__PURE__*/React__default.createElement(MDBModalTitle, null, "Reset Password")), /*#__PURE__*/React__default.createElement(MDBModalBody, {
    className: "d-flex flex-column align-items-center"
  }, /*#__PURE__*/React__default.createElement(Typography$2, {
    m: 0,
    color: "grey"
  }, "Enter the New Password"), /*#__PURE__*/React__default.createElement("br", null), /*#__PURE__*/React__default.createElement(TextField, {
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
      endAdornment: /*#__PURE__*/React__default.createElement(Tooltip, {
        title: /*#__PURE__*/React__default.createElement(PasswordTooltip, null),
        arrow: true,
        placement: "right"
      }, /*#__PURE__*/React__default.createElement(Box$2, {
        sx: {
          cursor: "pointer",
          color: "gray",
          display: "flex",
          alignItems: "center"
        }
      }, /*#__PURE__*/React__default.createElement("i", {
        className: "fa-solid fa-circle-info",
        style: {
          fontSize: "16px"
        }
      }))),
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
  }), /*#__PURE__*/React__default.createElement(UserInputField, {
    label: "Confirm Password",
    name: "CPassword",
    type: "password",
    disabled: false,
    value: formData,
    setValue: setFormData
  })), /*#__PURE__*/React__default.createElement(MDBModalFooter, {
    className: "d-flex justify-content-center"
  }, /*#__PURE__*/React__default.createElement(MDBBtn, {
    color: "secondary",
    onClick: handleClose
  }, "close", " "), /*#__PURE__*/React__default.createElement(MDBBtn, {
    onClick: handleResetPassword,
    color: "primary"
  }, "Reset"))))));
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
  const [iTypeF2, setiTypeF2] = useState(1);
  const [searchkey, setsearchkey] = useState("");
  const [Menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = useState(false);
  const [toggleFocus, settoggleFocus] = useState(false);
  const direction = "ltr";
  const focusedRef = useRef(false); // Use ref to track focus state
  const highlightRef = useRef(false); // Separate ref to track component focus state
  const clearedManually = useRef(false); // Add this ref

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
  const lastRequestId = useRef(0);
  const latest = useRef({});
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
  const debouncedFetchOptions = useMemo(() => debounce(async searchKey => {
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
  useEffect(() => {
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
  const CustomListBox = /*#__PURE__*/React__default.forwardRef((props, ref) => {
    const {
      children,
      ...other
    } = props;

    // Determine if any option has a `Code` property
    const showCodeHeader = Menu.some(option => option?.Code);
    return /*#__PURE__*/React__default.createElement("ul", _extends$3({
      style: {
        paddingTop: 0,
        scrollbarWidth: "thin"
      },
      ref: ref
    }, other), /*#__PURE__*/React__default.createElement(ListSubheader, {
      style: {
        backgroundColor: thirdColor,
        padding: "5px",
        color: secondaryColor
      }
    }, /*#__PURE__*/React__default.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        width: "100%"
      }
    }, /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        marginRight: "auto",
        fontSize: "0.8rem"
      }
    }, "Name"), showCodeHeader && /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        marginLeft: "auto",
        fontSize: "0.8rem"
      }
    }, "Code"))), children);
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

  return /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      flexDirection: "flex-end",
      width: `${width + 40}`
    }
  }, /*#__PURE__*/React__default.createElement(Tooltip, {
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
    }
  }, /*#__PURE__*/React__default.createElement(Autocomplete, {
    autoHighlight: true,
    key: `${label}_${autoCompleteKey}`,
    disabled: disabled,
    loading: loading,
    loadingText: /*#__PURE__*/React__default.createElement(CircularProgress, {
      size: 20
    }),
    noOptionsText: "",
    size: "small",
    PaperComponent: ({
      children
    }) => /*#__PURE__*/React__default.createElement(Paper$2, {
      style: {
        minWidth: "150px",
        maxWidth: "300px"
      }
    }, children)
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
    renderOption: (props, option) => /*#__PURE__*/React__default.createElement("li", _extends$3({}, props, {
      key: option.Id
    }), /*#__PURE__*/React__default.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        // Align items vertically for better layout
        width: "100%",
        gap: 1 // Add gap between Name and Code
      }
    }, /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        fontSize: "12px",
        flex: 1,
        textAlign: "left"
      }
    }, option?.Name), /*#__PURE__*/React__default.createElement(Typography$2, {
      style: {
        fontSize: "12px",
        flex: 1,
        textAlign: "right"
      }
    }, option?.Code))),
    renderInput: params => /*#__PURE__*/React__default.createElement(TextField, _extends$3({
      required: required,
      label: label
    }, params, {
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
    }))
    // ListboxProps={{
    //   style: { maxHeight: '200px', overflow: 'auto' },
    // }}
    ,
    ListboxComponent: CustomListBox
  })));
};

styled$5(Avatar)(({
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
  return /*#__PURE__*/React__default.createElement("div", {
    role: "presentation",
    style: {
      display: "flex",
      flexDirection: "row",
      maxWidth: "fit-content",
      alignItems: "center"
    }
  }, /*#__PURE__*/React__default.createElement(Stack, {
    spacing: 2,
    sx: {
      flex: 1
    }
  }, /*#__PURE__*/React__default.createElement(Breadcrumbs$1, {
    separator: /*#__PURE__*/React__default.createElement(NavigateNextIcon$1, {
      fontSize: "small",
      sx: {
        color: primaryColor
      }
    }),
    "aria-label": "breadcrumb"
  }, /*#__PURE__*/React__default.createElement(Typography$2, {
    underline: "hover",
    sx: style,
    key: "1"
  }, "User Details"))));
}
const DefaultIcons = ({
  iconsClick,
  detailPageId,
  userAction
}) => {
  return /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      flexDirection: "row",
      gap: "5px",
      alignItems: "center",
      overflowX: "auto",
      scrollbarWidth: "thin",
      minWidth: "fit-Content"
    }
  }, userAction.some(action => action.Action_Name === "New") && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-plus",
    caption: "New",
    iconName: "new"
  }), userAction.some(action => action.Action_Name === "New" && detailPageId === 0 || action.Action_Name === "Edit" && detailPageId !== 0) && /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "save",
    caption: "Save",
    iconName: "save"
  }), userAction.some(action => action.Action_Name === "Delete") && /*#__PURE__*/React__default.createElement(React__default.Fragment, null, detailPageId != 0 ? /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "trash",
    caption: "Delete",
    iconName: "delete"
  }) : null), userAction.some(action => action.Action_Name === "Change Password") && detailPageId ? /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-screwdriver-wrench",
    caption: "Reset Password",
    iconName: "reset"
  }) : null, /*#__PURE__*/React__default.createElement(ActionButton, {
    iconsClick: iconsClick,
    icon: "fa-solid fa-xmark",
    caption: "Close",
    iconName: "close"
  }));
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
  const [mainDetails, setMainDetails] = useState({});
  const [detailPageId, setDetailPageId] = useState(summaryId);
  const [confirmAlert, setConfirmAlert] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [confirmType, setConfirmType] = useState(null);
  const [resetPassword, setResetPassword] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState({
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

  useEffect(() => {
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

  const PasswordTooltip = () => /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      p: 0.5
    }
  }, /*#__PURE__*/React__default.createElement(Typography$2, {
    sx: {
      fontSize: "12px"
    }
  }, passwordPolicy.Description || "No password policy set"), passwordPolicy.MinLength > 0 && /*#__PURE__*/React__default.createElement(Typography$2, {
    sx: {
      fontSize: "12px"
    }
  }, "Minimum Length: ", passwordPolicy.MinLength));
  useEffect(() => {
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
  return /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      flexDirection: "column",
      width: "100%"
    }
  }, /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      display: "flex",
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingLeft: 1.5,
      paddingRight: 1.5,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React__default.createElement(BasicBreadcrumbs, null), /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      overflowX: "auto"
    }
  }, /*#__PURE__*/React__default.createElement(DefaultIcons, {
    detailPageId: detailPageId,
    iconsClick: handleIconsClick,
    userAction: userAction,
    disabledDetailed: disabledDetailed
  }))), /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      width: "100%",
      overflowX: "auto",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      scrollbarWidth: "thin",
      paddingBottom: "30px"
    }
  }, /*#__PURE__*/React__default.createElement(Box$2, {
    sx: {
      width: "98%",
      margin: "auto",
      display: "flex",
      flexDirection: "column",
      paddingTop: "10px"
    }
  }, /*#__PURE__*/React__default.createElement(Box$2, {
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
    }
  }, /*#__PURE__*/React__default.createElement(InputCommon, {
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
  }), /*#__PURE__*/React__default.createElement(AutoComplete, {
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
  }), /*#__PURE__*/React__default.createElement(InputCommon, {
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
  }), detailPageId === 0 && /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(TextField, {
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
      endAdornment: /*#__PURE__*/React__default.createElement(Tooltip, {
        title: /*#__PURE__*/React__default.createElement(PasswordTooltip, {
          description: passwordPolicy.Description
        }),
        arrow: true,
        placement: "right"
      }, /*#__PURE__*/React__default.createElement(Box$2, {
        sx: {
          cursor: "pointer",
          color: "gray",
          display: "flex",
          alignItems: "center"
        }
      }, /*#__PURE__*/React__default.createElement("i", {
        className: "fa-solid fa-circle-info",
        style: {
          fontSize: "16px"
        }
      }))),
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
  }), /*#__PURE__*/React__default.createElement(InputCommon, {
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
    key: "Mobile",
    languageName: "english",
    key1: `Mobile`,
    maxLength: 100
  })), /*#__PURE__*/React__default.createElement(AutoComplete, {
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
  }), /*#__PURE__*/React__default.createElement(AutoSelect, {
    key: "userType",
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
  }), /*#__PURE__*/React__default.createElement(AutoSelect, {
    key: "status",
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
  }), /*#__PURE__*/React__default.createElement(UserInputField, {
    label: "Mobile",
    name: "Mobile",
    type: "text",
    disabled: false,
    value: mainDetails,
    setValue: setMainDetails
  }), /*#__PURE__*/React__default.createElement(UserInputField, {
    label: "Phone",
    name: "Phone",
    type: "text",
    disabled: false,
    value: mainDetails,
    setValue: setMainDetails
  }), /*#__PURE__*/React__default.createElement(Box$2, {
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
    }
  }, /*#__PURE__*/React__default.createElement(UserPhotoUpload, {
    formData: mainDetails,
    handleUploadClick: handleUploadClick,
    handleDeleteClick: handleDeleteClick,
    uploadIconstyle: uploadIconstyle,
    field: "image",
    label: "Photo",
    disabled: disabledDetailed
  }))))), /*#__PURE__*/React__default.createElement(ConfirmationAlert, {
    handleClose: handleConfrimClose,
    open: confirmAlert,
    data: confirmData,
    submite: handleConfirmSubmit
  }), /*#__PURE__*/React__default.createElement(ResetPasswordAlert, {
    handleClose: () => setResetPassword(false),
    open: resetPassword,
    detailPageId: detailPageId,
    passwordPolicy: passwordPolicy
  }));
}

function UserContainer() {
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [id, setId] = useState(0);
  const [menuIdLocal, setmenuIdLocal] = useState(null);
  const [userAction, setuserAction] = useState([]);
  const menuId = location?.state;
  const navigate = useNavigate();
  const {
    getuseractionsforscreen
  } = securityApis();
  useEffect(() => {
    if (menuId?.Screen) setmenuIdLocal(menuId?.Screen);else if (menuId?.Screen == undefined && menuIdLocal == null) {
      navigate("/home", {
        state: {
          Screen: 1
        }
      });
    }
    setPage(1);
  }, [menuId?.Screen]);
  useEffect(() => {
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
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, page === 1 ? /*#__PURE__*/React__default.createElement(UserSummary, {
    setPageRender: setPage,
    setId: setId,
    Id: id,
    userAction: userAction,
    screenId: menuId
  }) : page === 2 ? /*#__PURE__*/React__default.createElement(UserDetails, {
    setPageRender: setPage,
    detailPageId: id,
    userAction: userAction
  }) : null);
}

const UserContext = /*#__PURE__*/createContext();
const UserProvider = ({
  children,
  token,
  refreshToken,
  onTokensRefreshed
}) => {
  // Sync incoming props → module store
  useEffect(() => {
    setTokens(token, refreshToken);
  }, [token, refreshToken]);

  // Let the package notify the host app when a refresh happens
  useEffect(() => {
    setOnTokensRefreshed(onTokensRefreshed);
  }, [onTokensRefreshed]);
  return /*#__PURE__*/React__default.createElement(UserContext.Provider, {
    value: {
      token,
      refreshToken,
      getAccessToken: getAccessToken$1,
      getRefreshToken
    }
  }, children);
};
const useUserContext = () => useContext(UserContext);

export { UserContainer, UserDetails, UserProvider, UserSummary, useUserContext };
//# sourceMappingURL=index.esm.js.map
