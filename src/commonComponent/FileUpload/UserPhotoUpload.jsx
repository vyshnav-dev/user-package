import React, { useState } from "react";
import { IconButton, Typography, useTheme,Tooltip, Dialog, DialogContent } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from "@mui/icons-material/Delete";
import { secondaryColor, thirdColor } from "../../config/config";
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from "@mui/icons-material/Person";
import BorderColorIcon from "@mui/icons-material/BorderColor";

const UserPhotoUpload = ({
  formData,
  handleUploadClick,
  handleDeleteClick,
  uploadIconstyle,
  field,
  label,
  disabled
}) => {

     //  image dailog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogImageSrc, setDialogImageSrc] = useState('');

  const handleClickOpen = (imageUrl) => {
    setOpenDialog(true);
    setDialogImageSrc(imageUrl);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };
    const getIconForField = (field) => {
  switch (field.toLowerCase()) {
    case "image":
    case "photo":
    case "user":
      return <PersonIcon style={{ fontSize: "25px" }} />;
    case "signature":
      return <BorderColorIcon style={{ fontSize: "25px" }} />;
    default:
      return <CloudUploadIcon style={{ fontSize: "25px" }} />;
  }
};


    const imageField = field + "_preview";
  return (
    <div
      style={{
     
        width: 250,
        alignItems: "center",
        textAlign: "center",
       
      }}
    >
      {formData[imageField] ? (
        <div style={{ position: "relative" }}>
          <img
            src={formData[imageField]}
            alt="Upload"
            style={{ width: "60px", height: "60px" }}
            onClick={() => handleClickOpen(formData[imageField])}
          />
           <Tooltip title={`Delete ${label}`} arrow>
          <IconButton
            onClick={handleDeleteClick(field)}  // Fixed invocation here
            style={{
              position: "absolute",
              right: -5,
              top: -10,
            }}
            disabled={disabled}
          >
            <DeleteIcon />
          </IconButton>
          </Tooltip>
        </div>
      ) : (
        <IconButton
          onClick={handleUploadClick(field)}  // Fixed invocation here
          style={{ color: secondaryColor, }}
            disabled={disabled}
        >
          {getIconForField(field)}
        </IconButton>
      )}
      {!formData[imageField] &&
      <Typography sx={{ fontSize: "12px",mt:1 }} variant="subtitle1">
        Add {label}
      </Typography>
      }


<Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="image-dialog-title"
        sx={{
          '& .MuiDialog-container': {
            '& .MuiPaper-root': {
              width: '60%', // Set the dialog width to 60% of the screen size
              maxHeight: '80vh',
            },
          },
        }}
      >
        <IconButton
          aria-label="close"
          onClick={handleDialogClose}
          sx={{
            position: 'absolute',
            right: 20,
            top: 8,
            color: "#FFF",
            backgroundColor: secondaryColor,
            '&:hover': { // Overrides the default hover style
              backgroundColor: secondaryColor, // Keeps the same background color on hover
              // Optionally, you can adjust the opacity to 1 if it still fades
              opacity: 1,
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <img src={dialogImageSrc} alt="Full Size" style={{ width: '100%', height: 'auto' }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPhotoUpload;