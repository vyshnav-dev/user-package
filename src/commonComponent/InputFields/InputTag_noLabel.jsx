import { TextField, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { styled } from '@mui/system';
import { useAlert } from '../../component/Alerts/AlertContext';
import { useEffect } from 'react';

const CustomTextField = styled(TextField)({
  '& .MuiInputBase-root': {
    '& textarea': {
      '&::-webkit-scrollbar': {
        width: '6px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '3px',
        cursor: 'pointer',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
});

export default function InputTag_noLabel({ name, type, disabled, value, setValue, width, multiline, maxLength, onBlur,languageName }) {
 
  const { showAlert } = useAlert();

 

  const [isBlurred, setIsBlurred] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value); // Update local state whenever the value prop changes
  }, [value]);


  const handleBlur = (event) => {
    let newValue = event.target.value || '';

     // Convert to number if type is number
    if (type === 'number' && newValue !== "") {
      newValue = parseFloat(newValue);
      if (isNaN(newValue)) newValue = 0;
    }
    if (type === 'number' && newValue == "") {
      newValue = parseFloat(newValue);
      if (isNaN(newValue)) newValue = 0;
    }

    if (newValue && maxLength && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
      showAlert('info', `Maximum limit of characters reached`);
    }

    setValue({ name, value: newValue });
    setInputValue(newValue); // Update the local state with the final value after blur

    if (onBlur) {
      onBlur(event); // Call the onBlur prop if provided
    }
  };

  // const handleChange = (event) => {
  //   if (disabled) {
  //     return;
  //   }
  //   setIsBlurred(false);
  //   let value = event.target.value || null;
  //   if (value && maxLength && value.length > maxLength) {
  //     value = value.substring(0, maxLength);
  //     showAlert('info', `Maximum limit of characters reached`);
  //   }
  //   setValue({ name, value });
  // };
  const handleChange = (event) => {
    if (disabled) {
      return;
    }

    let newValue = event.target.value || '';

    if (newValue && maxLength && newValue.length > maxLength) {
      newValue = newValue.substring(0, maxLength);
      showAlert('info', `Maximum limit of characters reached`);
    }

    setInputValue(newValue); // Update the local state as the user types
  };

  const autoCompleteValue = type === "password" ? "new-password" : "off";

 


  return (
    <CustomTextField
      size="small"
      id={name}
      value={inputValue} // Bind the input value to the local state
      type={type}
      multiline={multiline}
      rows={multiline ? 3 : null}
      autoComplete={autoCompleteValue}
      disabled={disabled}
      onChange={handleChange}
      onBlur={handleBlur}
      InputProps={{
        inputProps: {
          autoComplete: autoCompleteValue,
          ...(type === "date"
            ? {
              onKeyDown: (e) => {
                // Prevent default only for keys other than Tab
                if (e.key !== "Tab") {
                  e.preventDefault();
                }
              },
                onClick: (e) => e.target.showPicker?.(),
                onFocus: (e) => e.target.showPicker?.(),
              }
            : type === "time"
            ? {
                step: 1,
                onClick: (e) => e.target.showPicker?.(),
                onFocus: (e) => e.target.showPicker?.(),
              }
            : {}),
            style: {
              direction: 'ltr', // Default to LTR if direction is not found
              fontFamily: 'inherit', // Default to inherit if fontFamily is not found
            },
        },
        sx: {
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            filter: 'invert(0)',
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            filter:'invert(0)',
          },
        },
      }}
      sx={{
        width: width ? width : '100%', // Use full width by default
        "& .MuiInputBase-root": {
          height: multiline ? 'auto' : 30, // Adjust height for multiline or single-line
          '& textarea': {
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor:'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
              cursor: 'pointer',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
            },
          },
        },
        "& .MuiInputBase-input": {
          fontSize: "0.75rem",
          color: "inherit",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "currentColor",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "currentColor",
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: "#ddd",
          },
          "&:hover fieldset": {
            borderColor:  "currentColor",
          },
          "&.Mui-focused fieldset": {
            borderColor: "currentColor",
          },
        },
      }}
    />
  );
}
