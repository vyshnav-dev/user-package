import React, { createContext, useContext, useEffect } from "react";
import {
  setTokens,
  setOnTokensRefreshed,
  getAccessToken,
  getRefreshToken,
} from "./tokenStore";
import { setUIHandlers } from "./uiStore";

const UserContext = createContext();

export const UserProvider = ({
  children,
  token,
  refreshToken,
  showAlert,        // ← passed from host: useAlert().showAlert
  setLoader,        // ← passed from host: useAlert().setLoader
  onTokensRefreshed,
}) => {
  useEffect(() => {
    setTokens(token, refreshToken);
  }, [token, refreshToken]);

 
  useEffect(() => {
    setUIHandlers({ showAlert, setLoader });
  }, [showAlert, setLoader]);

  useEffect(() => {
    setOnTokensRefreshed(onTokensRefreshed);
  }, [onTokensRefreshed]);

  return (
    <UserContext.Provider
      value={{
        token,
        refreshToken,
        showAlert,
        setLoader,
        getAccessToken,
        getRefreshToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);