import * as React from "react";
import { Button } from "@mui/material";
import { thirdColor } from "../../config/config";

export default function TableButton({ label, action, disabled = false }) {
  const buttonStyle = {
    backgroundColor: thirdColor,
    color: "white",
    textTransform: "none",
    fontSize:'11px',
    padding: "10px",
    margin:.5,
    height: "25px",
    minWidth: "30px",
    "&:hover": {
      backgroundColor: thirdColor,
      opacity: 0.9,
    },
    "&:disabled": {
      backgroundColor: "#cccccc",
      color: "#666666",
    },
  };

  return (
    <Button 
      onClick={action} 
      sx={buttonStyle} 
      variant="contained"
      disabled={disabled}
    >
      {label}
    </Button>
  );
}

