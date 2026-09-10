import { TextField, useTheme } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/system";
import { useAlert } from "../Alerts/AlertContext";

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
      '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      },
      '&[data-mode="dark"]::-webkit-scrollbar-track': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
});

// Helper function to format time in 24-hour format (HH:MM) for consistent storage
const formatTimeForInput = (timeString) => {
  if (!timeString) return "";
  
  // If it's already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If it's in 12-hour format with AM/PM, convert to 24-hour
  const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3] ? match[3].toUpperCase() : null;
    
    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Format hours to 2 digits
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes}`;
  }
  
  return timeString;
};

// Helper to get browser locale time format
const getBrowserTimeFormat = () => {
  const testDate = new Date(2023, 0, 1, 13, 30); // 1:30 PM
  const timeString = testDate.toLocaleTimeString();
  
  // Check if it's 24-hour format
  return timeString.includes('13:30') ? '24h' : '12h';
};

export default function UserInputField({
  name,
  label,
  type,
  disabled,
  value,
  setValue,
  width,
  multiline,
  mandatory,
  direction,
  maxLength,
  onBlurAction,
  decimalLength,
  preDate,
  postDate,
  rows=3
}) {
  const [tabPressed, setTabPressed] = useState(false);
  const [timeFormat, setTimeFormat] = useState('24h');
  const [isPickerSupported, setIsPickerSupported] = useState(false);
  const { showAlert } = useAlert();
  const inputRef = useRef(null);

  // Detect browser's time format and picker support
  useEffect(() => {
    setTimeFormat(getBrowserTimeFormat());
    
    // Check if showPicker is supported
    const input = document.createElement('input');
    input.type = 'datetime-local';
    setIsPickerSupported(typeof input.showPicker === 'function');
    
    // Listen for locale changes if needed
    const handleLanguageChange = () => {
      setTimeFormat(getBrowserTimeFormat());
    };
    
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const handleChange = (event) => {
    const inputValue = event.target.value;
    
    if (type === "number") {
      const decimalRegex = decimalLength !== undefined
        ? new RegExp(`^\\d*\\.?\\d{0,${decimalLength}}$`)
        : /^(\d+\.?\d*|\.\d+)$/;
    
      if (!decimalRegex.test(inputValue) || inputValue.includes('e') || inputValue.includes('+') || inputValue.includes('-')) {
        return;
      }
    } else if (type === "time") {
      // For time inputs, we'll accept various formats but store in 24-hour format
      if (inputValue && !/^\d{1,2}:\d{2}$/.test(inputValue) && !/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/i.test(inputValue)) {
        // Show gentle warning but don't prevent input
        showAlert("warning", "Please enter time in HH:MM format");
      }
    }

    const update = { ...value };
    if (type === "time" && inputValue) {
      // Store in 24-hour format consistently
      update[name] = formatTimeForInput(inputValue);
    } else {
      update[name] = type === "number" && inputValue !== "" ? Number(inputValue) : inputValue;
    }
    setValue(update);
  };

  const handleKeyDown = (event) => {
    let inputValue = event.target.value;
    
    if (inputValue.length === maxLength) { 
      showAlert("info", "Maximum length reached");
    }
    
    if (event.key === "Tab") {
      setTabPressed(true);
    }
    
    // For date/time inputs, allow showing picker on specific key presses
    if (type === "date" || type === "datetime-local" || type === "time") {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (inputRef.current && isPickerSupported) {
          inputRef.current.showPicker();
        }
      }
    }
  };

  const handleBlur = (event) => {
    if (type === "time") {
      // Validate and format time on blur
      const inputValue = event.target.value;
      if (inputValue) {
        const formattedTime = formatTimeForInput(inputValue);
        if (formattedTime && formattedTime !== inputValue) {
          const update = { ...value };
          update[name] = formattedTime;
          setValue(update);
        }
      }
    }
    
    if (tabPressed) {
      setTabPressed(false);
      if (typeof onBlurAction === "function") {
        onBlurAction();
      }
    }
  };

  // Handle click specifically for showing picker
  const handleClick = (event) => {
    // Only show picker for date/time inputs when supported
    if ((type === "date" || type === "datetime-local" || type === "time") && 
        inputRef.current && 
        isPickerSupported &&
        !disabled) {
      // Use a timeout to ensure it's in the same event loop as the user gesture
      setTimeout(() => {
        try {
          inputRef.current.showPicker();
        } catch (error) {
          // Fallback: browser's default behavior will handle it
        }
      }, 0);
    }
  };

  // Get display value for time input
  const getDisplayValue = () => {
    if (!value[name]) return "";
    
    if (type === "time") {
      // For display, show in user's preferred format
      const timeParts = value[name].split(':');
      if (timeParts.length === 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        
        if (timeFormat === '12h' && hours > 0 && hours <= 12) {
          // Convert to 12-hour format for display
          const displayHours = hours % 12 || 12;
          const period = hours >= 12 ? 'PM' : 'AM';
          return `${displayHours.toString().padStart(2, '0')}:${minutes}`;
        }
      }
    }
    
    return value[name] || "";
  };

  const inputProps = {
    ref: inputRef,
    maxLength: maxLength,
    autoComplete: `off`,
    placeholder: type === "time" ? "HH:MM" : undefined,
    style: {
      direction: direction ? "rtl" : "ltr",
    },
    // Remove all showPicker calls from inputProps to avoid the error
    ...(type === "date" && {
      min: preDate,
      max: postDate,
    }),
    ...(type === "datetime-local" && {
      step: 1,
    }),
    ...(type === "time" && {
      step: 300, // 5 minute intervals
    }),
  };

  return (
    <CustomTextField
      margin="normal"
      size="small"
      id="search1"
      value={getDisplayValue()}
      type={type}
      onMouseLeave={value[name] ? onBlurAction : null}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      label={label}
      required={mandatory}
      multiline={multiline}
      rows={multiline ? rows : null}
      autoComplete="off"
      disabled={disabled}
      onChange={handleChange}
      InputProps={{
        inputProps: inputProps,
        sx: {
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            filter: 'invert(0)',
            cursor: 'pointer',
            opacity: 0.6,
            '&:hover': {
              opacity: 1,
            },
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            filter: 'invert(0)',
            cursor: 'pointer',
            opacity: 0.6,
            '&:hover': {
              opacity: 1,
            },
          },
          '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
            filter: 'invert(0)',
            cursor: 'pointer',
            opacity: 0.6,
            '&:hover': {
              opacity: 1,
            },
          },
        },
      }}
      InputLabelProps={{
        shrink: true,
        style: {
          direction: direction ? "rtl" : "ltr",
          fontSize: "14px",
        },
      }}
      sx={{
        width: width ? width : 250,
        "@media (max-width: 360px)": {
          width: 220,
        },
        "& .MuiInputBase-root": {
          ...(multiline ? {} : { height: 30 }),
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
        "& .MuiInputLabel-root": {
          fontSize: "14px",
          transform: "translate(10px, 5px) scale(0.9)",
          color: "inherit",
        },
        "& .MuiInputLabel-shrink": {
          transform: "translate(14px, -9px) scale(0.75)",
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
        "& .MuiFormLabel-root.Mui-focused": {
          color: "inherit",
        },
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            borderColor: `${"#ddd"}`,
          },
          "&:hover fieldset": {
            borderColor: "currentColor",
          },
          "&.Mui-focused fieldset": {
            borderColor: "currentColor",
          },
        },
      }}
    />
  );
}