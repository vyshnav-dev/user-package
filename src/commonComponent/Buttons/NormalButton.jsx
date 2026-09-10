import * as React from "react";
import { Button } from "@mui/material";
import { thirdColor } from "../../config/config";

export default function NormalButton({ label, action, disabled = false,color }) {
  const buttonStyle = {
    backgroundColor: color ? color :thirdColor,
    color: "white",
    fontSize:'12px',
    textTransform: "none",
    padding: "15px",
    height: "30px",
    minWidth: "30px",
    "&:hover": {
      backgroundColor: color ? color :thirdColor,
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
