import React, { createContext, useContext, useEffect } from "react";
import {
  setTokens,
  setOnTokensRefreshed,
  getAccessToken,
  getRefreshToken,
} from "./tokenStore";

const UserContext = createContext();

export const UserProvider = ({
  children,
  token,
  refreshToken,
  onTokensRefreshed,
}) => {
  // Sync incoming props → module store
  useEffect(() => {
    setTokens(token, refreshToken);
  }, [token, refreshToken]);

  // Let the package notify the host app when a refresh happens
  useEffect(() => {
    setOnTokensRefreshed(onTokensRefreshed);
  }, [onTokensRefreshed]);

  return (
    <UserContext.Provider
      value={{ token, refreshToken, getAccessToken, getRefreshToken }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);