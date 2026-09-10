import axios from 'axios';
import { loadConfig,SecurityBaseUrl } from './config';


const securityApi = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// A function to update the licence URL of the axios instance
export const updateSecurityUrl = (newBaseUrl) => {
  securityApi.defaults.baseURL = newBaseUrl;
};


// Use these functions after your config has been loaded
loadConfig().then(() => {
    updateSecurityUrl(SecurityBaseUrl)
});

export {securityApi};
