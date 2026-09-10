// src/tokenStore.js
// In-memory token store (source of truth for the current tab)

let _accessToken = null;
let _refreshToken = null;
let _onTokensRefreshed = null;

export const setTokens = (access, refresh) => {
  _accessToken = access ?? null;
  _refreshToken = refresh ?? null;
};

export const setOnTokensRefreshed = (cb) => {
  _onTokensRefreshed = typeof cb === "function" ? cb : null;
};

export const getAccessToken = () => _accessToken;
export const getRefreshToken = () => _refreshToken;

export const notifyTokensRefreshed = (access, refresh) => {
  setTokens(access, refresh);
  if (_onTokensRefreshed) _onTokensRefreshed(access, refresh);
};

export const clearTokenStore = () => {
  _accessToken = null;
  _refreshToken = null;
};