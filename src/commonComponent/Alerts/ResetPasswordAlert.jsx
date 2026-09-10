import React, { useEffect, useState } from "react";
import {
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
} from "mdb-react-ui-kit";
import { Box, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { useAlert } from "./AlertContext";
import { encrypt } from "../../Infrastructure/security/encryptionUtils";
import UserInputField from "../InputFields/UserInputField";
import { securityApis } from "../../Infrastructure/security/security";

export default function ResetPasswordAlert({
  handleClose,
  open,
  detailPageId,
  passwordPolicy
}) {
  const { updateuserpassword } = securityApis();
  
  const themes = useTheme();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    password: "",
    CPassword: "",
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
             be :1,
             Password : encrypt(formData?.password),
             UserId:detailPageId
            };
    const response = await updateuserpassword(saveData);
    if (response?.status === "Success") {
      showAlert("success", response?.message);
      handleClose();
      setFormData({ userId: 0, password: "" });
    }
  };

  const PasswordTooltip = () => (
  <Box sx={{ p: 0.5 }}>
    <Typography sx={{ fontSize: "12px" }}>
      {passwordPolicy?.Description || "No password policy set"}
    </Typography>
    {passwordPolicy?.MinLength > 0 && (
      <Typography sx={{ fontSize: "12px" }}>
        Minimum Length: {passwordPolicy.MinLength}
      </Typography>
    )}
  </Box>
);

  useEffect(() => {
    setFormData({ userId: 0, password: "", CPassword: "" });
  }, [open]);

  return (
    <>
      <MDBModal
        open={open}
        onClose={() => handleClose(0)}
        tabIndex="-1"
        centered
      >
        <MDBModalDialog size="md" style={{ marginTop: '55px' }}>
          <MDBModalContent>
            <MDBModalHeader
              className={`bg-primary text-white d-flex justify-content-center`}
            >
              <MDBModalTitle>Reset Password</MDBModalTitle>
            </MDBModalHeader>
            <MDBModalBody className="d-flex flex-column align-items-center">
              <Typography m={0} color="grey">
                Enter the New Password
              </Typography>
              <br />
              <TextField
                label="New Password"
                name="password"
                type="password"
                size="small"
                disabled={false}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <Tooltip title={<PasswordTooltip />} arrow placement="right">
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

              <UserInputField
                label={"Confirm Password"}
                name={"CPassword"}
                type={"password"}
                disabled={false}
                value={formData}
                setValue={setFormData}
              />
            </MDBModalBody>

            <MDBModalFooter className="d-flex justify-content-center">
              {/* <MDBBtn color='secondary' onClick={()=>handleClose(0)}>
                Close
              </MDBBtn> */}
              <MDBBtn color="secondary" onClick={handleClose}>
                close{" "}
              </MDBBtn>
              <MDBBtn onClick={handleResetPassword} color="primary">
                Reset
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
}
