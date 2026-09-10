import React, { useState } from "react";
import {
  Box,
  Stack,
  Button as ButtonM,
  useTheme,
  Typography,
  styled,
  Badge,
  Avatar,
  Tooltip,
  TextField,
} from "@mui/material";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import PropTypes from "prop-types";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { useEffect } from "react";
import ConfirmationAlert from "./commonComponent/Alerts/ConfirmationAlert";
import UserInputField from "./commonComponent/InputFields/UserInputField";
import AutoSelect from "./commonComponent/AutoComplete/AutoSelect";
import InputCommon from "./commonComponent/InputFields/InputCommon";
import UserPhotoUpload from "./commonComponent/FileUpload/UserPhotoUpload";
import ResetPasswordAlert from "./commonComponent/Alerts/ResetPasswordAlert";
import AutoComplete from "./commonComponent/AutoComplete/AutoComplete";
import { securityApis } from "./Infrastructure/security/security";
import { encrypt } from "./Infrastructure/security/encryptionUtils";
import ActionButton from "./commonComponent/Buttons/ActionButton";
import { allowedExtensionsUser,primaryColor } from "./config/config";
import { useAlert } from "./commonComponent/Alerts/AlertContext";
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

const SmallAvatar = styled(Avatar)(({ theme }) => ({
  width: 22,
  height: 22,
  border: `2px solid ${theme.palette.background.paper}`,
}));

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function BasicBreadcrumbs() {
  const style = {
    display: "flex",
    alignItems: "center",
    fontSize: "1.2rem",
    color: primaryColor,
    "@media (max-width: 600px)": {
      fontSize: "1rem", // Reduce font size on smaller screens
    },
    fontWeight: "bold",
  };
  return (
    <div
      role="presentation"
      style={{
        display: "flex",
        flexDirection: "row",
        maxWidth: "fit-content",
        alignItems: "center",
      }}
    >
      <Stack spacing={2} sx={{ flex: 1 }}>
        <Breadcrumbs
          separator={
            <NavigateNextIcon
              fontSize="small"
              sx={{
                color: primaryColor,
              }}
            />
          }
          aria-label="breadcrumb"
        >
          <Typography underline="hover" sx={style} key="1">
            User Details
          </Typography>
        </Breadcrumbs>
      </Stack>
    </div>
  );
}
const DefaultIcons = ({ iconsClick, detailPageId, userAction }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: "5px",
        alignItems: "center",
        overflowX: "auto",
        scrollbarWidth: "thin",
        minWidth: "fit-Content",
      }}
    >
      {userAction.some((action) => action.Action_Name === "New") && (
        <ActionButton
          iconsClick={iconsClick}
          icon={"fa-solid fa-plus"}
          caption={"New"}
          iconName={"new"}
        />
      )}
      {userAction.some(
        (action) =>
          (action.Action_Name === "New" && detailPageId === 0) ||
          (action.Action_Name === "Edit" && detailPageId !== 0)
      ) && (
          <ActionButton
            iconsClick={iconsClick}
            icon={"save"}
            caption={"Save"}
            iconName={"save"}
          />
        )}
      {userAction.some((action) => action.Action_Name === "Delete") && (
        <>
          {detailPageId != 0 ? (
            <ActionButton
              iconsClick={iconsClick}
              icon={"trash"}
              caption={"Delete"}
              iconName={"delete"}
            />
          ) : null}
        </>
      )}

      {(userAction.some((action) => action.Action_Name === "Change Password") && detailPageId) ? (
        <ActionButton
          iconsClick={iconsClick}
          icon={"fa-solid fa-screwdriver-wrench"}
          caption={"Reset Password"}
          iconName={"reset"}
        />
      ) : null}

      <ActionButton
        iconsClick={iconsClick}
        icon={"fa-solid fa-xmark"}
        caption={"Close"}
        iconName={"close"}
      />
    </Box>
  );
};

const suggestionUserType = [
  { Id: 1, Name: "Web" },
  { Id: 2, Name: "Mob" },
  { Id: 3, Name: "Both" },
];
const status = [{ "Id": true, "Name": "InActive" }, { "Id": false, "Name": "Active" }]//Inactive Status
export default function UserDetails({
  setPageRender,
  detailPageId: summaryId,
  userAction,
  disabledDetailed,
}) {


  const [mainDetails, setMainDetails] = useState({});
  const [detailPageId, setDetailPageId] = useState(summaryId);
  const [confirmAlert, setConfirmAlert] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [confirmType, setConfirmType] = useState(null);
  const [resetPassword, setResetPassword] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState({ PolicyRegExp: "^.*$", Description: "Choose Role" });
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

  const { showAlert } = useAlert();


  //   useEffect(() => {
  //   fetchPasswordPolicy();
  // }, []);

  useEffect(() => {
    if (mainDetails?.Role) {
      fetchPolicyByRole(mainDetails.Role);
    } else {
      setPasswordPolicy({ PolicyRegExp: "^.*$", Description: "Choose Role" });
    }
  }, [mainDetails?.Role]);

  const fetchPolicyByRole = async (roleId) => {
    try {
      const roleResponse = await getroledetails({ id: roleId });
      if (roleResponse?.status === "Success") {
        const parsed = JSON.parse(roleResponse.result);
        const pwdPolicyId = parsed?.RoleDetails?.[0]?.PwdPolicy;
        const regexResponse = await getpasswordpolicyregex({ roleId: roleId });
        if (regexResponse?.status === "Success" && regexResponse?.result) {
          const regexParsed = JSON.parse(regexResponse.result);
          const regexData = Array.isArray(regexParsed) ? regexParsed[0] : regexParsed;
          setPasswordPolicy({
            PolicyRegExp: regexData?.PolicyRegExp ?? "^.*$",
            Description: regexData?.Description ?? "No password policy set",
            MinLength: regexData?.MinLength ?? 0,
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




  const PasswordTooltip = () => (
    <Box sx={{ p: 0.5 }}>
      <Typography sx={{ fontSize: "12px" }}>
        {passwordPolicy.Description || "No password policy set"}
      </Typography>
      {passwordPolicy.MinLength > 0 && (
        <Typography sx={{ fontSize: "12px" }}>
          Minimum Length: {passwordPolicy.MinLength}
        </Typography>
      )}
    </Box>
  );

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
          id: detailPageId,
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
      signature_previousFileName: "",
    });
    setDetailPageId(0);
  };



  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const handleIconsClick = async (value) => {
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
        if (mainDetails?.Email && !emailRegex.test(mainDetails?.Email))
          emptyFields.push("Valid Email");
        if (!mainDetails.Password && detailPageId === 0)
          emptyFields.push("Password");
        if (!mainDetails.CPassword && detailPageId === 0)
          emptyFields.push("Confirm Password");
        //if (!mainDetails.Timezone) emptyFields.push("Time Zone");
        if (!mainDetails.UserType) emptyFields.push("User Type");
        // if (mainDetails.InActive == null) emptyFields.push("Status");
        if (
          mainDetails.Mobile &&
          !/^\+?[0-9]{10,15}$/.test(mainDetails.Mobile.trim())
        ) {
          emptyFields.push("Valid Mobile Number");
        }
        if (mainDetails.Phone && !/^[0-9]{10,15}$/.test(mainDetails.Phone))
          emptyFields.push("Valid Phone Number");
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
        if (
          mainDetails.Password !== mainDetails.CPassword &&
          detailPageId === 0
        ) {
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
        setConfirmData({ message: "Save", type: "success" });
        setConfirmType("save");
        setConfirmAlert(true);
        break;
      case "reset":
        setResetPassword(true);
        break;
      case "delete":
        setConfirmData({ message: "Delete", type: "danger" });
        setConfirmType("delete");
        setConfirmAlert(true);
        break;

      default:
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
      const actionExists = userAction.some((action) => action.Action_Name === "New");
      if (!actionExists) {
        setPageRender(1);
      }
    }
    else {
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
    }
    else if (confirmType == "image" || confirmType == "signature") {
      handledeletePhoto(confirmType)
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
    response = await deleteuser([{ id: detailPageId }]);
    if (response?.status === "Success") {
      if (mainDetails?.ImagePath) {
        deleteUploadImage(Number(response?.result))
      }
      showAlert("success", response?.message);
      handleNew();
      const actionExists = userAction.some((action) => action.Action_Name === "New");
      if (!actionExists) {
        setPageRender(1);
      }
    }
  };

  const handleUserExist = async () => {
    try {
      const response = await checkuserexistence({
        userId: mainDetails?.Id,
        loginName: mainDetails?.LoginName,
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
    backgroundColor: "#fff", // Set a background color
    borderRadius: "50%", // Make the button round
    padding: "5px", // Padding to make the icon look bigger and floating
    boxShadow: "0px 4px 12px rgba(0,0,0,0.2)", // Add shadow to make it look floating
  };

  const handleUploadClick = (field) => () => {
    if (disabledDetailed) {
      return
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png,.gif"; // Accept only specific file types
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();

        // Check if the selected file has an allowed extension
        if (!allowedExtensionsUser.includes(fileExtension)) {


          showAlert('info', `Allowed file Type : ${allowedExtensionsUser.join(', ')}`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          // Store the Base64 string for preview purposes
          setMainDetails((prev) => ({
            ...prev,
            [field + "_preview"]: e.target.result,
            // [field] :file.name
          }));
          // Store the file object for upload
          setMainDetails((prev) => ({
            ...prev,
            [field + "_file"]: file,  // Ensure this is a File object
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };




  const handleDeleteClick = (field) => () => {
    if (disabledDetailed) {
      return
    }
    if (mainDetails[`${field}_previousFileName`] == "") {

      setMainDetails((prev) => ({
        ...prev,
        [field]: "",
        [`${field}_file`]: "",
        [`${field}_preview`]: ""
      }));
      return
    }

    // Set confirmation data for deleting the photo
    setConfirmData({ message: "delete", type: "danger" });
    setConfirmType(field);
    setConfirmAlert(true);
    // setFormData((prev) => ({ ...prev,[`${field}`]: "",   [`${field}_file`]: "", [`${field}_preview`]:""  }));
  };


  const handleFileUpload = async (userId) => {





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

    } catch (uploadError) {

    }
  };

  const handledeletePhoto = async (field) => {

    const deletePayload = { id: detailPageId, fileName: mainDetails[`${field}_previousFileName`], fieldType: field };




    try {
      const response = await deleteuserfile(deletePayload);

      if (response?.status === "Success") {

        showAlert("success", response?.message)

        setMainDetails((prev) => ({
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
    } finally {

    }
  };


  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingLeft: 1.5,
          paddingRight: 1.5,
          flexWrap: "wrap",
        }}
      >
        <BasicBreadcrumbs />
        <Box
          sx={{
            overflowX: "auto"

          }}
        >
          <DefaultIcons
            detailPageId={detailPageId}
            iconsClick={handleIconsClick}
            userAction={userAction}
            disabledDetailed={disabledDetailed}
          />
        </Box>
      </Box>
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          scrollbarWidth: "thin",
          paddingBottom: "30px",
        }}
      >
        <Box
          sx={{
            width: "98%",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            paddingTop: "10px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyContent: "flex-start", // Changed from center to flex-start
              padding: 1,
              gap: "10px",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",

              flexWrap: "wrap",
              "@media (max-width: 768px)": {
                gap: "10px", // Reduced width for small screens
              },
              "@media (max-width: 420px)": {
                gap: "2px", // Reduced width for small screens
              },
            }}
          >


            <InputCommon
              label={"Login Name"}
              name={"LoginName"}
              type={"text"}
              disabled={detailPageId !== 0}
              mandatory={true}
              value={mainDetails.LoginName}
              setValue={(data) => {
                const { name, value } = data
                setMainDetails({ ...mainDetails, [name]: value })
              }}
              maxLength={50}
              onBlurAction={handleUserExist}
            />


            <AutoComplete
              apiKey={getroleslist}
              formData={mainDetails}
              setFormData={setMainDetails}
              label={"Role"}
              autoId={"Role"}
              required={true}
              formDataName={"Role_Name"}
              formDataiId={"Role"}
              params1="Search"
              params2="Type"
            />

            <InputCommon
              label={"Email Id"}
              name={"Email"}
              type={"email"}
              mandatory={false}
              disabled={false}
              value={mainDetails.Email}
              setValue={(data) => {
                const { name, value } = data
                setMainDetails({ ...mainDetails, [name]: value })
              }}

            />


            {detailPageId === 0 && (
              <>
                <TextField
                  label="Password"
                  name="Password"
                  type="password"
                  size="small"
                  disabled={false}
                  mandatory={true}
                  value={mainDetails.Password || ""}
                  onChange={(e) => setMainDetails({ ...mainDetails, Password: e.target.value })}
                  autoComplete="off"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title={<PasswordTooltip description={passwordPolicy.Description} />} arrow placement="right">
                        <Box sx={{ cursor: "pointer", color: "gray", display: "flex", alignItems: "center" }}>
                          <i className="fa-solid fa-circle-info" style={{ fontSize: "16px" }} />
                        </Box>
                      </Tooltip>
                    ),
                    style: { fontSize: "12px", height: "30px" },
                  }}
                  InputLabelProps={{ style: { fontSize: "14px" } }}
                  sx={{
                    paddingTop: "16px",
                    minWidth: "200px",
                    "& .MuiInputLabel-outlined": {
                      transform: "translate(14px, 22px) scale(0.85)",
                    },
                    "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
                      transform: "translate(14px, 7px) scale(0.75)",
                    },
                    "& .MuiOutlinedInput-root": {
                      height: 30,
                      "& fieldset": { borderColor: "#ddd" },
                      "&:hover fieldset": { borderColor: "currentColor" },
                      "&.Mui-focused fieldset": { borderColor: "currentColor" },
                    },
                    "& .MuiInputLabel-root": { color: "inherit", fontSize: "14px" },
                  }}
                />

                <InputCommon
                  label={"Confirm Password"}
                  name={"CPassword"}
                  type={"password"}
                  disabled={false}
                  mandatory={true}
                  value={mainDetails.CPassword}
                  setValue={(data) => {
                    const { name, value } = data
                    setMainDetails({ ...mainDetails, [name]: value })
                  }}
                  key={"Mobile"}
                  languageName={"english"}
                  key1={`Mobile`}
                  maxLength={100}
                />
              </>
            )}
            <AutoComplete
              apiKey={GetTagList}
              formData={mainDetails}
              setFormData={setMainDetails}
              label={"Timezone"}
              autoId={"Timezone"}
              required={false}
              formDataName={"Timezone_Name"}
              formDataiId={"Timezone"}
              params1="Search"
              params2="Type"
              params4={"TagId"}
              params4Value={7}
            />


            <AutoSelect
              key={"userType"}
              formData={mainDetails}
              setFormData={setMainDetails}
              autoId={"userType"}
              formDataName={`UserType_Name`}
              formDataiId={"UserType"}
              required={true}
              label={"User Type"}
              languageName={"english"}
              ColumnSpan={0}
              Menu={suggestionUserType}

            />
            {/* <AutoComplete
              apiKey={GetTagList}
              formData={mainDetails}
              setFormData={setMainDetails}
              label={"Employee"}
              autoId={"Employee"}
              required={(mainDetails.UserType==2 || mainDetails.UserType==3)}
              formDataName={"Employee_Name"}
              formDataiId={"Employee"}
              docType={1}
              languageId={1}
              params1={"Search"}
              params2={"Type"}
              params3={"BE"}
              params3Value={1}
              params4={"TagId"}
              params4Value={30}
            />
            <AutoComplete
              apiKey={GetTagList}
              formData={mainDetails}
              setFormData={setMainDetails}
              label={"Customer"}
              autoId={"Customer"}
              required={(mainDetails.UserType==2 || mainDetails.UserType==3)}
              formDataName={"Customer_Name"}
              formDataiId={"Customer"}
              docType={1}
              languageId={1}
              params1={"Search"}
              params2={"Type"}
              params3={"BE"}
              params3Value={1}
              params4={"TagId"}
              params4Value={3}
            /> */}
            <AutoSelect
              key={"status"}
              formData={mainDetails}
              setFormData={setMainDetails}
              autoId={"InActive"}
              formDataName={`InActive_Name`}
              formDataiId={"InActive"}
              required={true}
              label={"Status"}
              languageName={"english"}
              ColumnSpan={0}
              Menu={status}

            />

            <UserInputField
              label={"Mobile"}
              name={"Mobile"}
              type={"text"}
              disabled={false}
              value={mainDetails}
              setValue={setMainDetails}
            />


            <UserInputField
              label={"Phone"}
              name={"Phone"}
              type={"text"}
              disabled={false}
              value={mainDetails}
              setValue={setMainDetails}
            />


            <Box sx={{
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyContent: "flex-start", // Changed from center to flex-start
              padding: 1,
              gap: "10px",


              flexWrap: "wrap",
              "@media (max-width: 768px)": {
                gap: "10px", // Reduced width for small screens
              },
              "@media (max-width: 420px)": {
                gap: "2px", // Reduced width for small screens
              },
            }}>
              <UserPhotoUpload
                formData={mainDetails}
                handleUploadClick={handleUploadClick}
                handleDeleteClick={handleDeleteClick}
                uploadIconstyle={uploadIconstyle}
                field={"image"}
                label={"Photo"}
                disabled={disabledDetailed}
              />
              {/* <UserPhotoUpload
              formData={mainDetails}
              handleUploadClick={handleUploadClick}
              handleDeleteClick={handleDeleteClick}
              uploadIconstyle={uploadIconstyle}
              field={"signature"}
              label={"Signature"}
              disabled={disabledDetailed}
            /> */}
            </Box>

          </Box>

        </Box>
      </Box>

      <ConfirmationAlert
        handleClose={handleConfrimClose}
        open={confirmAlert}
        data={confirmData}
        submite={handleConfirmSubmit}
      />

      <ResetPasswordAlert
        handleClose={() => setResetPassword(false)}
        open={resetPassword}
        detailPageId={detailPageId}
        passwordPolicy={passwordPolicy}
      />
    </Box>
  );
}
