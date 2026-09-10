// In your package, export a UserProvider
import React, { createContext, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children, apis, config }) => (
  <UserContext.Provider value={{ apis, config }}>
    {children}
  </UserContext.Provider>
);

export const useUserContext = () => useContext(UserContext);