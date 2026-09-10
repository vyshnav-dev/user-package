import { TextField, FormLabel, Button, Box, Popover, IconButton, InputAdornment } from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { styled } from "@mui/system";
import { showAlert as uiShowAlert, setLoader as uiSetLoader } from "../../uiStore";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from "@mui/icons-material/Clear";

const CustomTextField = styled(TextField)({
    '& .MuiInputBase-root': {
        '& textarea': {
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '3px',
                cursor: 'pointer',
            },
            '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
            '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&[data-mode="dark"]::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
        },
    },
});

// ========== UTC HELPERS ==========
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

// ========== FORMAT DATETIME-LOCAL ==========
const formatDateTimeLocal = (val) => {
    if (!val) return "";
    if (val instanceof Date) {
        const pad = (n) => (n < 10 ? `0${n}` : n);
        return `${val.getFullYear()}-${pad(val.getMonth()+1)}-${pad(val.getDate())}T${pad(val.getHours())}:${pad(val.getMinutes())}`;
    }
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
        return val;
    }
    const d = new Date(val);
    if (!isNaN(d)) {
        const pad = (n) => (n < 10 ? `0${n}` : n);
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "";
};

// ========== FIREFOX TIME PICKER (unchanged) ==========
const FirefoxTimePicker = ({ value, onChange, disabled, width, label, mandatory, direction, utcMode = false, onClear }) => {
    // ... (same as before) ...
    // Keeping it brief – you can copy from the full version above
    // For brevity, I’m leaving it out, but it’s identical to previous version.
    // (It includes the clear button and popover)
};

// ========== FIREFOX DATE PICKER (unchanged) ==========
const FirefoxDatePicker = ({ value, onChange, disabled, width, label, mandatory, direction, minDate, maxDate }) => {
    // ... (same as before) ...
};

// ========== FIREFOX DATETIME PICKER (supports typing) ==========
const FirefoxDateTimePicker = ({ value, onChange, disabled, width, label, mandatory, direction, minDate, maxDate }) => {
    // ... (same as before) ...
};

// ========== HELPERS ==========
const formatTimeForInput = (timeString) => {
    if (!timeString) return "";
    if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
    const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/i);
    if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3] ? match[3].toUpperCase() : null;
        if (period === 'PM' && hours < 12) hours += 12;
        else if (period === 'AM' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
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

// ========== MAIN COMPONENT ==========
export default function NewUserInputField({
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
    dateType = 0,
}) {
    const [tabPressed, setTabPressed] = useState(false);
    const [timeFormat, setTimeFormat] = useState('24h');
    const [isPickerSupported, setIsPickerSupported] = useState(false);
    const [isFirefoxBrowser, setIsFirefoxBrowser] = useState(false);
    const inputRef = useRef(null);

    // Compute min/max based on dateType
    const getFormattedDate = (date) => date.toLocaleDateString("en-CA");
    const getFormattedDateTime = (date) => {
        const pad = (n) => (n < 10 ? `0${n}` : n);
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    let computedMinDate, computedMaxDate, computedMinDateTime, computedMaxDateTime;
    if (type === 'date') {
        const today = new Date();
        const todayDate = getFormattedDate(today);
        const nextDay = new Date(today); nextDay.setDate(today.getDate()+1);
        const prevDay = new Date(today); prevDay.setDate(today.getDate()-1);
        let min, max;
        switch(dateType){
            case 1: min = getFormattedDate(nextDay); max = undefined; break;
            case 2: min = undefined; max = getFormattedDate(prevDay); break;
            case 3: min = todayDate; max = todayDate; break;
            case 4: min = todayDate; max = undefined; break;
            case 5: min = undefined; max = todayDate; break;
            default: min = undefined; max = undefined;
        }
        computedMinDate = min || preDate;
        computedMaxDate = max || postDate;
    } else if (type === 'datetime-local') {
        const now = new Date();
        const nowStr = getFormattedDateTime(now);
        const nextDay = new Date(now); nextDay.setDate(now.getDate()+1);
        const prevDay = new Date(now); prevDay.setDate(now.getDate()-1);
        let min, max;
        switch(dateType){
            case 1: min = getFormattedDateTime(nextDay); max = undefined; break;
            case 2: min = undefined; max = getFormattedDateTime(prevDay); break;
            case 3: min = nowStr; max = nowStr; break;
            case 4: min = nowStr; max = undefined; break;
            case 5: min = undefined; max = nowStr; break;
            default: min = undefined; max = undefined;
        }
        computedMinDateTime = min || preDate;
        computedMaxDateTime = max || postDate;
    }

    useEffect(() => {
        setTimeFormat(getBrowserTimeFormat());
        setIsFirefoxBrowser(isFirefox());
        const input = document.createElement('input');
        input.type = 'datetime-local';
        setIsPickerSupported(typeof input.showPicker === 'function');
        const handleLanguageChange = () => setTimeFormat(getBrowserTimeFormat());
        window.addEventListener('languagechange', handleLanguageChange);
        return () => window.removeEventListener('languagechange', handleLanguageChange);
    }, []);

    // ---- Firefox overrides ----
    if (isFirefoxBrowser) {
        if (type === "time") {
            return (
                <FirefoxTimePicker
                    value={value[name] || ''}
                    onChange={(timeValue) => {
                        const update = { ...value };
                        update[name] = timeValue;
                        setValue(update);
                        if (onBlurAction) onBlurAction();
                    }}
                    onClear={() => {
                        const update = { ...value };
                        update[name] = null;
                        setValue(update);
                        if (onBlurAction) onBlurAction();
                    }}
                    disabled={disabled}
                    width={width}
                    label={label}
                    mandatory={mandatory}
                    direction={direction}
                />
            );
        }
        if (type === "UtcTime") {
            return (
                <FirefoxTimePicker
                    utcMode={true}
                    value={value[name] || ''}
                    onChange={(utcValue) => {
                        const update = { ...value };
                        update[name] = utcValue;
                        setValue(update);
                        if (onBlurAction) onBlurAction();
                    }}
                    onClear={() => {
                        const update = { ...value };
                        update[name] = null;
                        setValue(update);
                        if (onBlurAction) onBlurAction();
                    }}
                    disabled={disabled}
                    width={width}
                    label={label}
                    mandatory={mandatory}
                    direction={direction}
                />
            );
        }
        if (type === "date") {
            return (
                <FirefoxDatePicker
                    value={value[name] || ''}
                    onChange={(dateValue) => {
                        const update = { ...value };
                        update[name] = dateValue;
                        setValue(update);
                        if (onBlurAction) onBlurAction();
                    }}
                    disabled={disabled}
                    width={width}
                    label={label}
                    mandatory={mandatory}
                    direction={direction}
                    minDate={computedMinDate}
                    maxDate={computedMaxDate}
                />
            );
        }
        if (type === "datetime-local") {
            return (
                <FirefoxDateTimePicker
                    value={value[name] || ''}
                    onChange={(datetimeValue) => {
                        const update = { ...value };
                        update[name] = datetimeValue;
                        setValue(update);
                        if (onBlurAction) onBlurAction();
                    }}
                    disabled={disabled}
                    width={width}
                    label={label}
                    mandatory={mandatory}
                    direction={direction}
                    minDate={computedMinDateTime}
                    maxDate={computedMaxDateTime}
                />
            );
        }
    }

    // ---- Non-Firefox ----
    const getDisplayValue = () => {
        if (!value[name]) return "";
        if (type === "UtcTime") {
            return utcToLocalTime(value[name]);
        }
        if (type === "time") {
            const timeParts = value[name].split(':');
            if (timeParts.length === 2) {
                const hours = parseInt(timeParts[0]);
                const minutes = timeParts[1];
                if (timeFormat === '12h') {
                    const displayHours = hours % 12 || 12;
                    const period = hours >= 12 ? 'PM' : 'AM';
                    return `${displayHours.toString().padStart(2, '0')}:${minutes} ${period}`;
                }
            }
        }
        return value[name] || "";
    };

    const handleChange = (event) => {
        const inputValue = event.target.value;

        if (type === "UtcTime") {
            const utcTime = localToUtcTime(inputValue);
            const update = { ...value };
            update[name] = utcTime;
            setValue(update);
            return;
        }

        if (type === "number") {
            const decimalRegex = decimalLength !== undefined
                ? new RegExp(`^\\d*\\.?\\d{0,${decimalLength}}$`)
                : /^(\d+\.?\d*|\.\d+)$/;
            if (!decimalRegex.test(inputValue) || inputValue.includes('e') || inputValue.includes('+') || inputValue.includes('-')) {
                return;
            }
        } else if (type === "time") {
            if (inputValue && !/^\d{1,2}:\d{2}$/.test(inputValue) && !/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/i.test(inputValue)) {
                uiShowAlert("warning", "Please enter time in HH:MM format");
            }
        }

        const update = { ...value };
        if (type === "datetime-local") {
            update[name] = inputValue || null;
        } else if (type === "time" && inputValue) {
            update[name] = formatTimeForInput(inputValue);
        } else {
            update[name] = type === "number" && inputValue !== "" ? Number(inputValue) : inputValue;
        }
        setValue(update);
    };

    const handleKeyDown = (event) => {
        if (event.target.value.length === maxLength) {
            uiShowAlert("info", "Maximum length reached");
        }
        if (event.key === "Tab") {
            setTabPressed(true);
        }
        // Removed the block that opened the picker on Space/Enter
    };

    const handleBlur = (event) => {
        if (type === "time") {
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

        if ((type === "date" || type === "datetime-local" || type === "time" || type === "UtcTime") && !event.target.value) {
            const update = { ...value };
            update[name] = null;
            setValue(update);
        }

        if (tabPressed) {
            setTabPressed(false);
            if (typeof onBlurAction === "function") {
                onBlurAction();
            }
        }
    };

    const handleClearTime = () => {
        const update = { ...value };
        update[name] = null;
        setValue(update);
        if (onBlurAction) onBlurAction();
    };

    const inputProps = {
        ref: inputRef,
        maxLength: maxLength,
        autoComplete: `off`,
        placeholder: (type === "time" || type === "UtcTime") ? "HH:MM" : undefined,
        style: { direction: direction ? "rtl" : "ltr" },
        // No onClick handler – let the browser handle it naturally
        ...(type === "date" && { min: computedMinDate, max: computedMaxDate }),
        ...(type === "datetime-local" && { step: 1, min: computedMinDateTime, max: computedMaxDateTime }),
        ...((type === "time" || type === "UtcTime") && { step: 300 }),
    };

    const endAdornment = (type === "time" || type === "UtcTime") && value[name] ? (
        <InputAdornment position="end">
            <IconButton onClick={handleClearTime} edge="end" aria-label="clear time" tabIndex={-1} size="small">
                <ClearIcon fontSize="small" />
            </IconButton>
        </InputAdornment>
    ) : null;

    return (
        <CustomTextField
            margin="normal"
            size="small"
            id="search1"
            value={
                type === "datetime-local"
                    ? formatDateTimeLocal(value[name])
                    : (type === "UtcTime" ? getDisplayValue() : (value[name] || ""))
            }
            type={type === "UtcTime" ? "time" : type}
            onMouseLeave={value[name] ? onBlurAction : null}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            label={label}
            required={mandatory}
            multiline={multiline}
            rows={multiline ? 3 : null}
            autoComplete="off"
            disabled={disabled}
            onChange={handleChange}
            InputProps={{
                inputProps: inputProps,
                endAdornment: endAdornment,
                sx: {
                    '& input[type="date"]::-webkit-calendar-picker-indicator': {
                        filter: 'invert(0)',
                        cursor: 'pointer',
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                    },
                    '& input[type="time"]::-webkit-calendar-picker-indicator': {
                        filter: 'invert(0)',
                        cursor: 'pointer',
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                    },
                    '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
                        filter: 'invert(0)',
                        cursor: 'pointer',
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                    },
                },
            }}
            InputLabelProps={{
                shrink: true,
                style: { direction: direction ? "rtl" : "ltr", fontSize: "14px" },
            }}
            sx={{
                width: width ? width : 250,
                "@media (max-width: 360px)": { width: 220 },
                "& .MuiInputBase-root": {
                    ...(multiline ? {} : { height: 30 }),
                    '& textarea': {
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '3px',
                            cursor: 'pointer',
                        },
                        '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
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
                    "& fieldset": { borderColor: "#ddd" },
                    "&:hover fieldset": { borderColor: "currentColor" },
                    "&.Mui-focused fieldset": { borderColor: "currentColor" },
                },
            }}
        />
    );
}