// src/uiStore.js
// Holds callbacks the host app injects (showAlert, setLoader).
// Used because axios interceptors and api helpers run outside React,
// and because the package must not mount its own AlertProvider.

let _showAlert = null;
let _setLoader = null;

export const setUIHandlers = ({ showAlert, setLoader }) => {
  if (typeof showAlert === "function") _showAlert = showAlert;
  if (typeof setLoader === "function") _setLoader = setLoader;
};

export const showAlert = (type, message) => {
  if (typeof _showAlert === "function") {
    _showAlert(type, message);
  } else {
    // Fallback so missing wiring is visible but not fatal
    console.warn("[user-package] showAlert not provided by host:", type, message);
  }
};

export const setLoader = (value) => {
  if (typeof _setLoader === "function") {
    _setLoader(value);
  }
};