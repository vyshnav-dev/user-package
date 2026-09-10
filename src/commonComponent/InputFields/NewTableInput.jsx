import { TextField, useTheme, FormLabel, Button, Box, Popover, IconButton } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/system";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';

const CustomTextField = styled(TextField)({
  "& .MuiInputBase-root": {
    "& textarea": {
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        borderRadius: "3px",
        cursor: "pointer",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "rgba(0, 0, 0, 0.1)",
      },
      '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
      },
      '&[data-mode="dark"]::-webkit-scrollbar-track': {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
});

// ========== UTC TIME HELPERS ==========
const localToUtcTime = (localTimeStr) => {
  if (!localTimeStr || !localTimeStr.includes(':')) return '';
  const [hours, minutes] = localTimeStr.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
};

const utcToLocalTime = (utcTimeStr) => {
  if (!utcTimeStr || !utcTimeStr.includes(':')) return '';
  const [hours, minutes] = utcTimeStr.split(':').map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
};

// ========== HELPER FUNCTIONS ==========
const formatTimeForInput = (timeString) => {
  if (!timeString) return "";

  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }

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

    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes}`;
  }

  return timeString;
};

const getBrowserTimeFormat = () => {
  const testDate = new Date(2023, 0, 1, 13, 30);
  const timeString = testDate.toLocaleTimeString();
  return timeString.includes('13:30') ? '24h' : '12h';
};

const isFirefox = () => {
  return typeof navigator !== 'undefined' &&
    (navigator.userAgent.toLowerCase().includes('firefox') ||
      navigator.userAgent.toLowerCase().includes('gecko/'));
};

// ========== FIREFOX TIME PICKER FOR TABLE (with UTC mode) ==========
const FirefoxTimePickerForTable = ({ value, onChange, disabled, width, mandatory, direction, onBlurAction, utcMode = false }) => {
  // Convert external value to display value (local time if utcMode)
  const displayValue = utcMode && value ? utcToLocalTime(value) : value;

  const [hours, setHours] = useState(displayValue ? displayValue.split(':')[0] : '00');
  const [minutes, setMinutes] = useState(displayValue ? displayValue.split(':')[1] : '00');
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const effectiveValue = displayValue;
    if (effectiveValue) {
      const timeParts = effectiveValue.split(':');
      if (timeParts.length === 2) {
        setHours(timeParts[0].padStart(2, '0'));
        setMinutes(timeParts[1].padStart(2, '0'));
      }
    } else {
      setHours('00');
      setMinutes('00');
    }
  }, [displayValue]);

  const handleChange = (newTime) => {
    const finalValue = utcMode ? localToUtcTime(newTime) : newTime;
    onChange(finalValue);
  };

  const handleHourChange = (e) => {
    const newHours = e.target.value.padStart(2, '0');
    const newTime = `${newHours}:${minutes}`;
    handleChange(newTime);
  };

  const handleMinuteChange = (e) => {
    const newMinutes = e.target.value.padStart(2, '0');
    const newTime = `${hours}:${newMinutes}`;
    handleChange(newTime);
  };

  const generateOptions = (start, end) => {
    const options = [];
    for (let i = start; i <= end; i++) {
      options.push(
        <option key={i} value={i.toString().padStart(2, '0')}>
          {i.toString().padStart(2, '0')}
        </option>
      );
    }
    return options;
  };

  const formatDisplayTime = (h, m) => {
    const hourNum = parseInt(h);
    const minuteNum = m;
    const displayHours = hourNum % 12 || 12;
    const period = hourNum >= 12 ? 'PM' : 'AM';
    return `${displayHours.toString().padStart(2, '0')}:${minuteNum} ${period}`;
  };

  return (
    <div style={{
      width: width || '100%',
      position: 'relative',
    }}>
      <button
        ref={buttonRef}
        onClick={() => !disabled && setShowPicker(!showPicker)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (onBlurAction) onBlurAction();
        }}
        disabled={disabled}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
        style={{
          width: '100%',
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontSize: '0.75rem',
          color: 'inherit',
          fontFamily: 'inherit',
          outline: 'none',
          direction: direction ? "rtl" : "ltr",
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'border-color 0.2s ease',
          ...(isHovered && {
            borderColor: 'currentColor',
          }),
          ...(isFocused && {
            borderColor: 'currentColor',
            borderWidth: '2px',
          }),
        }}
      >
        <span>{displayValue ? formatDisplayTime(hours, minutes) : 'HH:MM'}</span>
        <AccessTimeIcon fontSize="small" style={{ color: disabled ? '#aaa' : '#666' }} />
      </button>

      <Popover
        open={showPicker && !disabled}
        anchorEl={buttonRef.current}
        onClose={() => setShowPicker(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        sx={{
          zIndex: 10000,
          '& .MuiPopover-paper': {
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            minWidth: '200px',
          }
        }}
      >
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}>
          <select
            value={hours}
            onChange={handleHourChange}
            size={7}
            style={{
              padding: '8px',
              fontSize: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
              maxHeight: '150px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              flex: 1,
              cursor: 'pointer',
            }}
          >
            {generateOptions(0, 23)}
          </select>

          <select
            value={minutes}
            onChange={handleMinuteChange}
            size={7}
            style={{
              padding: '8px',
              fontSize: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
              maxHeight: '150px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              flex: 1,
              cursor: 'pointer',
            }}
          >
            {generateOptions(0, 59)}
          </select>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: '#1976d2',
              minWidth: '40px',
              textAlign: 'center'
            }}>
              {parseInt(hours) >= 12 ? 'PM' : 'AM'}
            </span>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <IconButton
                size="small"
                onClick={() => setShowPicker(false)}
                sx={{
                  padding: '4px',
                  fontSize: '0.7rem',
                  backgroundColor: '#f0f0f0',
                  '&:hover': {
                    backgroundColor: '#e0e0e0',
                    color: '#d32f2f'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        </div>
      </Popover>
    </div>
  );
};

// ========== FIREFOX DATE PICKER FOR TABLE ==========
const FirefoxDatePickerForTable = ({ value, onChange, disabled, width, mandatory, direction, onBlurAction, minDate, maxDate }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDateChange = (e) => {
    onChange(e.target.value);
    if (onBlurAction) onBlurAction();
  };

  return (
    <div style={{
      width: width || '100%',
    }}>
      <input
        type="date"
        value={value || ''}
        onChange={handleDateChange}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
        min={minDate}
        max={maxDate}
        style={{
          width: '100%',
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem',
          color: 'inherit',
          fontFamily: 'inherit',
          outline: 'none',
          direction: direction ? "rtl" : "ltr",
          height: '30px',
          transition: 'border-color 0.2s ease',
          ...(isHovered && {
            borderColor: 'currentColor',
          }),
          ...(isFocused && {
            borderColor: 'currentColor',
            borderWidth: '2px',
          }),
        }}
      />
    </div>
  );
};

// ========== FIREFOX DATETIME-LOCAL PICKER FOR TABLE ==========
const FirefoxDateTimePickerForTable = ({ value, onChange, disabled, width, mandatory, direction, onBlurAction, minDate, maxDate }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeButtonRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [datePart, timePart] = value.split('T');
      setDate(datePart || '');
      if (timePart) {
        const timeOnly = timePart.substring(0, 5);
        setTime(timeOnly);
      } else {
        setTime('');
      }
    } else {
      setDate('');
      setTime('');
    }
  }, [value]);

  const handleDateTimeChange = (newDate, newTime) => {
    if (newDate !== undefined) {
      setDate(newDate);
      const finalTime = newTime !== undefined ? newTime : (time || '00:00');
      onChange(`${newDate}T${finalTime}`);
    }
    if (newTime !== undefined) {
      setTime(newTime);
      const finalDate = date || new Date().toISOString().split('T')[0];
      onChange(`${finalDate}T${newTime}`);
    }
    if (onBlurAction) onBlurAction();
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return 'HH:MM';
    const [hours, minutes] = timeStr.split(':');
    const hoursNum = parseInt(hours);
    const displayHours = hoursNum % 12 || 12;
    const period = hoursNum >= 12 ? 'PM' : 'AM';
    return `${displayHours.toString().padStart(2, '0')}:${minutes} ${period}`;
  };

  const generateOptions = (start, end) => {
    const options = [];
    for (let i = start; i <= end; i++) {
      options.push(
        <option key={i} value={i.toString().padStart(2, '0')}>
          {i.toString().padStart(2, '0')}
        </option>
      );
    }
    return options;
  };

  const handleHourChange = (e) => {
    const newHours = e.target.value.padStart(2, '0');
    const currentMinutes = time ? time.split(':')[1] : '00';
    handleDateTimeChange(undefined, `${newHours}:${currentMinutes}`);
  };

  const handleMinuteChange = (e) => {
    const currentHours = time ? time.split(':')[0] : '00';
    const newMinutes = e.target.value.padStart(2, '0');
    handleDateTimeChange(undefined, `${currentHours}:${newMinutes}`);
  };

  return (
    <div style={{
      width: width || '100%',
      position: 'relative',
    }}>
      <div
        style={{
          display: 'flex',
          gap: '0px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
          position: 'relative',
          height: '32px',
          ...(isHovered && {
            borderColor: 'currentColor',
          }),
          ...(isFocused && {
            borderColor: 'currentColor',
            borderWidth: '2px',
          }),
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => !disabled && setIsHovered(false)}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateTimeChange(e.target.value, undefined)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          min={minDate}
          max={maxDate}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '0 8px',
            border: 'none',
            borderRadius: 0,
            backgroundColor: 'transparent',
            fontSize: '0.75rem',
            color: 'inherit',
            fontFamily: 'inherit',
            outline: 'none',
            direction: direction ? "rtl" : "ltr",
            height: '30px',
            minWidth: '120px',
          }}
        />

        <div style={{
          width: '1px',
          backgroundColor: '#ccc',
          alignSelf: 'stretch',
          margin: '4px 0',
        }} />

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            ref={timeButtonRef}
            onClick={() => !disabled && setShowTimePicker(!showTimePicker)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            style={{
              width: '100px',
              padding: '0 8px',
              border: 'none',
              borderRadius: 0,
              backgroundColor: 'transparent',
              cursor: disabled ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              fontSize: '0.75rem',
              color: 'inherit',
              fontFamily: 'inherit',
              outline: 'none',
              direction: direction ? "rtl" : "ltr",
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ flex: 1 }}>{time ? formatDisplayTime(time) : 'HH:MM'}</span>
            <AccessTimeIcon fontSize="small" style={{ color: disabled ? '#aaa' : '#666' }} />
          </button>

          <Popover
            open={showTimePicker && !disabled}
            anchorEl={timeButtonRef.current}
            onClose={() => setShowTimePicker(false)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            sx={{
              zIndex: 10000,
              '& .MuiPopover-paper': {
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                minWidth: '200px',
              }
            }}
          >
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}>
              <select
                value={time ? time.split(':')[0] : '00'}
                onChange={handleHourChange}
                size={7}
                style={{
                  padding: '8px',
                  fontSize: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  outline: 'none',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  flex: 1,
                  cursor: 'pointer',
                }}
              >
                {generateOptions(0, 23)}
              </select>

              <select
                value={time ? time.split(':')[1] : '00'}
                onChange={handleMinuteChange}
                size={7}
                style={{
                  padding: '8px',
                  fontSize: '0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  outline: 'none',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  flex: 1,
                  cursor: 'pointer',
                }}
              >
                {generateOptions(0, 59)}
              </select>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {parseInt(time ? time.split(':')[0] : '00') >= 12 ? 'PM' : 'AM'}
                </span>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <IconButton
                    size="small"
                    onClick={() => setShowTimePicker(false)}
                    sx={{
                      padding: '4px',
                      fontSize: '0.7rem',
                      backgroundColor: '#f0f0f0',
                      '&:hover': {
                        backgroundColor: '#e0e0e0',
                        color: '#d32f2f'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            </div>
          </Popover>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export default function NewTableInput({
  name,
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
  readOnly,
  index,
  tabAction,
  decimalLength,
  onChange,
  autoFocus = false,
  maxDate,
  minDate,
}) {
  const [tabPressed, setTabPressed] = useState(false);
  const [isFirefoxBrowser, setIsFirefoxBrowser] = useState(false);
  const [timeFormat, setTimeFormat] = useState('24h');

  useEffect(() => {
    setIsFirefoxBrowser(isFirefox());
    setTimeFormat(getBrowserTimeFormat());
  }, []);

  // Helper to get display value for UtcTime (convert UTC to local)
  const getDisplayValue = () => {
    const rawValue = value[index]?.[name] || '';
    if (type === "UtcTime" && rawValue) {
      return utcToLocalTime(rawValue);
    }
    return rawValue;
  };

  // Handle Firefox date/time pickers
  if (isFirefoxBrowser && (type === "time" || type === "date" || type === "datetime-local" || type === "UtcTime")) {
    const currentValue = value[index]?.[name] || '';

    const handleFirefoxChange = (newValue) => {
      if (readOnly) return;

      const update = [...value];
      update[index][name] = newValue;
      setValue(update);

      if (onChange) {
        onChange(name, newValue);
      }
    };

    if (type === "time") {
      return (
        <FirefoxTimePickerForTable
          value={currentValue}
          onChange={handleFirefoxChange}
          disabled={disabled || readOnly}
          width={width}
          mandatory={mandatory}
          direction={direction}
          onBlurAction={onBlurAction}
        />
      );
    }

    if (type === "UtcTime") {
      return (
        <FirefoxTimePickerForTable
          utcMode={true}
          value={currentValue}
          onChange={handleFirefoxChange}
          disabled={disabled || readOnly}
          width={width}
          mandatory={mandatory}
          direction={direction}
          onBlurAction={onBlurAction}
        />
      );
    }

    if (type === "date") {
      return (
        <FirefoxDatePickerForTable
          value={currentValue}
          onChange={handleFirefoxChange}
          disabled={disabled || readOnly}
          width={width}
          mandatory={mandatory}
          direction={direction}
          onBlurAction={onBlurAction}
          maxDate={maxDate}
        />
      );
    }

    if (type === "datetime-local") {
      return (
        <FirefoxDateTimePickerForTable
          value={currentValue}
          onChange={handleFirefoxChange}
          disabled={disabled || readOnly}
          width={width}
          mandatory={mandatory}
          direction={direction}
          onBlurAction={onBlurAction}
          minDate={minDate}
          maxDate={maxDate}
        />
      );
    }
  }

  // Original logic for non-Firefox browsers and other input types
  const handleChange = (event) => {
    if (readOnly) return;

    let inputValue = event.target.value;

    // if (type === "datetime-local") {
    //   const selected = new Date(inputValue);
    //   const min = minDate ? new Date(minDate) : null;
    //   const max = maxDate ? new Date(maxDate) : null;

    //   // if (min && selected < min) {
    //   //     showAlert("warning", "Selected datetime is below current datetime");
    //   //     return;
    //   // }
    //   // Remove seconds & milliseconds
    //         selected.setSeconds(0, 0);
    //         max?.setSeconds(0, 0);

    //   if (max && selected > max) {
    //     showAlert("warning", "Selected date and time is in the future");
    //     return;
    //   }
    // }

    // Handle UtcTime: convert local input to UTC for storage
    if (type === "UtcTime") {
      const utcTime = localToUtcTime(inputValue);
      const update = [...value];
      update[index][name] = utcTime;
      setValue(update);
      if (onChange) onChange(name, utcTime);
      return;
    }

    if (type === "number") {
      const decimalRegex = new RegExp(`^\\d*\\.?\\d{0,${decimalLength || 0}}$`);
      if (!decimalRegex.test(inputValue) || inputValue.includes('e') || inputValue.includes('+') || inputValue.includes('-')) {
        return;
      }
    }

    const update = [...value];
    update[index][name] = type === "number" && inputValue !== "" ? Number(inputValue) : inputValue;
    setValue(update);

    if (onChange) {
      onChange(name, inputValue);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Tab") {
      setTabPressed(true);
      if (typeof tabAction === "function") {
        tabAction();
      }
    }
    if (["e", "E", "+", "-", "."].includes(event.key) && type === "number") {
      event.preventDefault();
    }
  };

  const handleBlur = (event) => {
    if (tabPressed) {
      setTabPressed(false);
      if (typeof onBlurAction === "function") {
        onBlurAction();
      }
    }
  };

  // Determine input type for the TextField (UtcTime uses "time" for native picker)
  const inputType = type === "UtcTime" ? "time" : type;

  return (
    <CustomTextField
      autoFocus={autoFocus}
      size="small"
      id="search1"
      value={type === "UtcTime" ? getDisplayValue() : (value[index]?.[name] || "")}
      type={inputType}
      onMouseLeave={value[index]?.[name] ? onBlurAction : null}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      required={mandatory}
      multiline={multiline}
      rows={multiline ? 3 : null}
      autoComplete="off"
      disabled={disabled}
      onChange={handleChange}
      InputProps={{
        inputProps: {
          maxLength: maxLength,
          max: maxDate,
          autoComplete: `off`,
          placeholder: (type === "time" || type === "UtcTime") ? "HH:MM" : undefined,
          ...(type === "date"
            ? {
              onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.target.showPicker?.();
                }
              },
            }
            : type === "datetime-local"
              ? {
                step: 1,
                min: minDate,
                max: maxDate,
                onKeyDown: (e) => {
                  if (e.key !== "Tab") e.preventDefault();
                },
                onClick: (e) => e.target.showPicker?.(),
              }
              : (type === "time" || type === "UtcTime") && {
                step: 300,
              }),
          style: {
            direction: direction ? "rtl" : "ltr",
          },
        },
        sx: {
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            filter: "invert(0)",
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            filter: "invert(0)",
          },
          '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
            filter: "invert(0)",
          },
        },
      }}
      InputLabelProps={{
        style: {
          direction: direction ? "rtl" : "ltr",
        },
      }}
      sx={{
        width: "100%",
        "& .MuiInputBase-root": {
          ...(multiline ? {} : { height: 30 }),
          "& textarea": {
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderRadius: "3px",
              cursor: "pointer",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
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
