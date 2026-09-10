
import React, { createContext, useContext, useState, useEffect } from 'react';
import ValidationAlert from './ValidationAlert';


const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState(false);
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [loader, setLoader] = useState(false)
   const [currentError, setCurrentError] = useState(null);


  const showAlert = (type, msg) => {
    setAlertType(type);
    setMessage(msg);
    setAlert(true);
  };

  const handleAlertClose = () => {
    setAlert(false);
  };

  //Logging
  const logError = async (errorDetails) => {
    
    if (navigator.onLine) {
      try {
        await axios.post(`${LOG_URL}/log/createlog`, errorDetails);
        setCurrentError(null); // Clear the current error on successful post
      } catch (error) {
        setCurrentError(errorDetails); // Store the current error if the post fails
      }
    } else {
      setCurrentError(errorDetails); // Store the current error if offline
    }
  };

  //Logging
  useEffect(() => {
    const handleOnline = async () => {
      if (currentError) {
        try {
          await axios.post(`${LOG_URL}/log/createlog`, currentError);
          setCurrentError(null); // Clear the current error on successful post
        } catch (error) {}
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [currentError]); // Dependency on currentError ensures the latest error is retried


  return (
    <AlertContext.Provider value={{ showAlert, loader, setLoader,logError }}>
      {children}
      <ValidationAlert
        open={alert}
        handleClose={handleAlertClose}
        data={{ message: message, type: alertType }}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  return useContext(AlertContext);
};
