
import { baseSecurityApis } from "../ApiInterceptors/interceptorSecurityApi";

const securityApis = () => {
  const { makeAuthorizedRequestBaseSecurity } = baseSecurityApis()

  const GetTagList = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "tag/gettaglist",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getuseractionsforscreen = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "user/getuseraction",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getSecuritysummary = async (payload, url) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        url,
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };


  const deleteuser = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "delete",
        "user/deleteuser",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };


  const getuserdetails = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "user/GetUserDetails",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const gettimezonelist = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "timezone/gettimezonelist",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getroleslist = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "role/getrolelist",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const upsertuser = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        "user/upsertuser",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getroledetails = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "/role/getroledetails",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getscreensforuser = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "user/getuserscreens",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const checkuserexistence = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "user/checkuserexistence",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const checkrolenameexistence = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "role/checkrolenameexistence",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleterole = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "delete",
        `role/deleterole`,
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getactions = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "role/getactionlist",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const upsertrole = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        "role/UpsertRole",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };


  const uploaduserfile = async (id, payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        `user/uploaduserfile?id=${id}`,
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const deleteuserfile = async (id, payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "delete",
        `user/deleteuserfile?id=${id}&fileName=${payload}`,
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const updatepassword = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        `user/updatepassword`,
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updateuserpassword = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        `user/updateuserpassword`,
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };


  const Auth_Logout = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        "/login/logout",
        {},
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const GetDocTypeList = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "/Settings/GetDocTypeList",
        payload,
        false
      );
      return response;
    } catch (error) {
      return error
    }
  };


  //#region role
  const getpasswordpolicy = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "/passwordpolicy/getpasswordpolicylist",
        payload
      );
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getroleScreens = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "role/getscreens",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getRoleSummary = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "/role/getrolesummary",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };
  const getDeleteRole = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "delete",
        "/role/deleterole",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };





  //#region user department allocation

  const getuserdepartmentdetails = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "/user/getuserdepartmentdetails",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const upsertuserdepartment = async (payload) => {

    try {
      const response = await makeAuthorizedRequestBaseSecurity("post", "/user/upsertuserdepartment", payload, true);
      return response;
    } catch (error) {
      // console.error(error);
      throw error;
    }
  };

  // ----- user list ----------

  const getuserlist = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "/user/getuserlist",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const insertusersessionhistory = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        `/login/insertusersessionhistory?be=${payload?.be}`,

        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };
  const updateusersessionhistory = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        "/login/updateusersessionhistory",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };




  const upsertpasswordpolicy = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        "passwordpolicy/upsertpasswordpolicy",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const deletepasswordpolicy = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "delete",
        "passwordpolicy/deletepasswordpolicy",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getpasswordpolicydetails = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "passwordpolicy/getpasswordpolicydetails",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const checkpasswordpolicyexistence = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "passwordpolicy/checkpasswordpolicyexistence",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getpasswordpolicylist = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "passwordpolicy/getpasswordpolicylist",
        {},
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getpasswordpolicyregexbyuser = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "passwordpolicy/getpasswordpolicyregexbyuser",
        {},
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getpasswordpolicyregex = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "passwordpolicy/getpasswordpolicyregex",
        payload,
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getuserpasswordpolicy = async () => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "get",
        "passwordpolicy/getuserpasswordpolicy",
        {},
        false
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const forcelogoutusers = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        "login/forcelogout",
        payload,
        true
      );
      return response;
    } catch (error) {
      throw error;
    }
  };

  const syncmaster = async (payload) => {
    try {
      const response = await makeAuthorizedRequestBaseSecurity(
        "post",
        `login/syncmaster?be=${payload?.be}`,
        payload,
        true
      );
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
  }
}

export { securityApis }