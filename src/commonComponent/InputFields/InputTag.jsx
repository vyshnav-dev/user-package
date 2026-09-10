import { TextField, useTheme } from '@mui/material'
import React from 'react'
import { styled } from '@mui/system';
import { showAlert as uiShowAlert, setLoader as uiSetLoader } from "../../uiStore";
import { useState } from 'react';

const CustomTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    '& textarea': {
      '&::-webkit-scrollbar': {
        width: '6px', // Adjust the width as needed
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)', // Adjust the color as needed
        borderRadius: '3px', // Adjust the border radius as needed
        cursor: 'pointer',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the track color as needed
      },
      // Dark mode specific styles
      '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Adjust the color as needed
      },
      '&[data-mode="dark"]::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Adjust the track color as needed
      },
    },
  },
});

export default function InputTag({key,name, label,type,disabled,value,setValue,width,multiline,mandatory,onBlur,maxLength,onClick}) {
  
  const theme = useTheme();


  const [isBlurred, setIsBlurred] = useState(false);
  const handleBlurOrMouseLeave = () => {
    // if (!disabled) {
    //   onBlur(); // Call the onBlur prop function
    // }
    if (onBlur && !disabled && !isBlurred) {
      onBlur(); // Call the onBlur prop function
      setIsBlurred(true); // Set blurred state to true
    }
  };

  const handleChange = (event) => {
    if(disabled){
      return;
    }
    setIsBlurred(false)
    let  value = event.target.value || null
   
    
    if (value && maxLength && value?.length > maxLength) {
      value = value.substring(0, maxLength);  // Truncate the value to max length
      uiShowAlert('info', `Maximum limit of ${label} characters reached`);
    }
    if(value)
    setValue({name,value});  
  else{
    if(type=="date"){
      value = ""
      setValue({name,value})
    }
   
    else{
      value = null
      setValue({name,value})
    }
  }
  };
   // Determine the autoComplete value
   const autoCompleteValue = type === "password" ? "new-password" : "off";
  return (
    <CustomTextField
      key={key}
      margin="normal"
      size="small"
      id={name}
      value={value}
      type={type}
      label={label}
      required={!!mandatory}
      multiline={multiline}
      rows={multiline ? 3 : null}
      autoComplete={autoCompleteValue}
      disabled={disabled}
      onChange={handleChange}
      onClick={onClick}
      onBlur={onBlur ? handleBlurOrMouseLeave : undefined}
      onMouseLeave={onBlur ? handleBlurOrMouseLeave : undefined}
      InputProps={{
        inputProps: {
          autoComplete:autoCompleteValue,
          ...(type === "date"
            ? {
              onKeyDown: (e) => {
                // Prevent default only for keys other than Tab
                if (e.key !== "Tab") {
                  e.preventDefault();
                }
              },
                onClick: (e) => e.target.showPicker?.(),
                onFocus: (e) => e.target.showPicker?.()
              }
              : type === "time"
              ? {
                  step: 1, // Allows time input in HH:mm:ss format
                  onClick: (e) => e.target.showPicker?.(),
                  onFocus: (e) => e.target.showPicker?.(),
                }
              : {}),
        },
        sx: {
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            filter:  'invert(0)',
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            filter:  'invert(0)', // Ensures visibility in dark mode
          },
        },
      }}
      InputLabelProps={{
        shrink: type === 'password' && value ? true : undefined, // Shrink the label if it's a password field and has a value
      }}
      sx={{
        width: width ? width : 250, // Adjust the width as needed
        "@media (max-width: 360px)": {
              width: 220, // Reduced width for small screens
            },
        "& .MuiInputBase-root": {
          ...(multiline ? {} : { height: 30 }), // Adjust the height of the input area if not multiline
          '& textarea': {
      '&::-webkit-scrollbar': {
        width: '6px', // Adjust the width as needed
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor:  'rgba(0, 0, 0, 0.2)', // Adjust the color as needed
        borderRadius: '3px', // Adjust the border radius as needed
        cursor: 'pointer',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the track color as needed
      },
    },
        },
        "& .MuiInputLabel-root": {
          fontSize:"14px",
          transform: "translate(13px, 7px) scale(0.85)", // Adjust label position when not focused
          color:  "inherit",
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(14px, -9px) scale(0.75)", // Adjust label position when focused
        },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem", // Adjust the font size of the input text
          color:
            "inherit",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "currentColor", // Keeps the current border color
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "currentColor", // Optional: Keeps the border color on hover
        },
        "& .MuiFormLabel-root.Mui-focused": {
          color: "inherit", // Ensure the label color when focused
        },
        "& .MuiOutlinedInput-root": {
         
          "& fieldset": {
            borderColor: `${ "#ddd"
            }`,
          },
          "&:hover fieldset": {
            borderColor: "currentColor", // Keeps the border color on hover
          },
          "&.Mui-focused fieldset": {
            borderColor:  "currentColor", // Keeps the current border color
          },
        },
      }}
    />
  );
}