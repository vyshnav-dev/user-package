import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  ListSubheader,
  Paper,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { debounce } from "lodash";
import { primaryColor, secondaryColor, thirdColor } from "../../config/config";
import { useAlert } from "../Alerts/AlertContext";

export default function UserAutoComplete({
  apiKey,
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  required,
  disable,
  tagId,
  beId,
}) {
  const [iTypeF2, setiTypeF2] = useState(1);
  const [searchkey, setsearchkey] = useState("");
  const [Menu, setMenu] = useState([]);
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const focusedRef = useRef(false); // Use ref to track focus state
  const highlightRef = useRef(false); // Separate ref to track component focus state
  const { showAlert } = useAlert();

  const handleAutocompleteChange = (event, newValue) => {
    if (newValue) {
      const updatedFormData = {
        ...formData,
        [formDataiId]: newValue ? newValue.Id : null,
        [formDataName]: newValue ? newValue.Name : "",
      };
      setFormData(updatedFormData); // This will now update the parent's state
    } else {
      const updatedFormData = {
        ...formData,
        [formDataiId]: null,
        [formDataName]: "",
      };
      setFormData(updatedFormData); // This will now update the parent's state
    }
    setiTypeF2(1);
  };

  const debouncedFetchOptions = debounce(async (searchKey) => {
    if (!focusedRef.current) {
      return; // Fetch only if the input is focused
    }
    try {
      const response = await apiKey({
        search: searchKey,
        type: iTypeF2,
        bE:1,
        languageId:1,
        tagId,
      });
      const results = JSON.parse(response?.result);
      setMenu(results || []);
    } catch (error) {
      setMenu([]);
    }
  }, 300);

  useEffect(() => {
    if (focusedRef.current) {
      debouncedFetchOptions(searchkey);
    }
  }, [searchkey, iTypeF2, beId, tagId]);

  const handleFocus = () => {
    focusedRef.current = true; // Set focused state to true in ref
    debouncedFetchOptions(searchkey); // Call fetchOptions on focus
  };

  const handleBlur = () => {
    focusedRef.current = false; // Reset focus state when the component loses focus
    // Check for the existence in Menu or the existing formData value
    const existsInMenu = Menu.some((option) => option.Name === searchkey);
    const existingFormValue = formData[formDataName] || "";

    if (!existsInMenu && searchkey !== existingFormValue) {
      setFormData({
        ...formData,
        [formDataName]: "",
        [formDataiId]: 0,
      });
      setsearchkey("");
      setAutoCompleteKey((prevKey) => prevKey + 1);
    }
  };

  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue);
  };

  const CustomListBox = React.forwardRef((props, ref) => {
    const { children, ...other } = props;
    return (
      <ul
        style={{ paddingTop: 0, scrollbarWidth: "thin" }}
        ref={ref}
        {...other}
      >
        <ListSubheader
          style={{
            backgroundColor: secondaryColor,
            padding: "5px",
            color: thirdColor,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto", fontSize: "0.8rem" }}>
              Name
            </Typography>
            <Typography style={{ marginLeft: "auto", fontSize: "0.8rem" }}>
              Code
            </Typography>
          </div>
        </ListSubheader>
        {children}
      </ul>
    );
  });

  return (
    <Autocomplete
      key={`${label}_${autoCompleteKey}`}
      size="small"
      PaperComponent={({ children }) => (
        <Paper style={{ minWidth: "150px", maxWidth: "300px" }}>
          {children}
        </Paper>
      )}
      disabled={disable}
      // freeSolo
      id={autoId}
      options={Menu}
      onFocus={handleFocus} // Set focus state and fetch options when focused
      onBlur={handleBlur} // Reset focus state on blur
      getOptionLabel={(option) => option?.Name || formData[formDataName] || ""}
      value={formData[formDataName] ?? ""}
      onChange={handleAutocompleteChange}
      filterOptions={(options, { inputValue }) => {
        return options.filter(
          (option) =>
            option?.Name?.toLowerCase()?.includes(inputValue?.toLowerCase()) ||
            option?.Code?.toLowerCase()?.includes(inputValue?.toLowerCase())
        );
      }}
      onHighlightChange={(event, option) => {
        if (option !== highlightRef.current) {
          highlightRef.current = option; // Update ref without re-rendering
        }
      }}
      onInputChange={handleInputChange}
      renderOption={(props, option) => (
        <li {...props} key={option.Id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center", // Align items vertically for better layout
              width: "100%",
              gap: 1, // Add gap between Name and Code
            }}
          >
            <Typography
              style={{ fontSize: "12px", flex: 1, textAlign: "left" }}
            >
              {option?.Name}
            </Typography>
            <Typography
              style={{ fontSize: "12px", flex: 1, textAlign: "right" }}
            >
              {option?.Code}
            </Typography>
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          required={required}
          label={label}
          {...params}
          inputProps={{
            ...params.inputProps,
            autoComplete: "off", // disable autocomplete and autofill
            style: {
              borderColor: "transparent",
              borderStyle: "solid",
              fontSize: "12px",
              height: "18px",
              padding: "0px 25px 0px 10px",
              margin: 0,
              color: "inherit",
            },
            onKeyDown: (event, newValue) => {
              if (event.key === "F2") {
                const updatedFormData = {
                  ...formData,
                  [formDataName]: newValue ? newValue.Name : "",
                  [formDataiId]: newValue ? newValue.Id : 0,
                };
                setFormData(updatedFormData);
                setiTypeF2((prevType) => (prevType === 1 ? 2 : 1));
                setsearchkey("");
                event.preventDefault();
              }
              if (event.key === "Tab" || event.key === "Enter") {
                // Select the currently highlighted option
                if (highlightRef.current) {
                  const newValue = highlightRef.current;

                  // Set the form data directly with the highlighted option
                  setFormData({
                    ...formData,
                    [formDataName]: newValue?.Name,
                    [formDataiId]: newValue?.Id,
                  });

                  // Update the value directly
                  setsearchkey(newValue?.Name || "");
                }
                setTimeout(() => {
                  event.target.blur(); // Move focus to the next field
                }, 0);
                event.preventDefault();
              }
            },
          }}
          InputLabelProps={{
            style: {
              fontSize: "14px",
              padding: "0 0px",
              zIndex: 1,
            },
          }}
          sx={{
            paddingTop: "16px",
            width: 250, // Default width
            "@media (max-width: 360px)": {
              width: 220, // Reduced width for small screens
            },
            "& .MuiOutlinedInput-input": {
              padding: "8px 14px",
              transform: "translate(-1px, 0px) scale(1)",
            },
            "& .MuiInputBase-input": {
              fontSize: "0.75rem",
            },
            "& .MuiInputLabel-outlined": {
              transform: "translate(14px, 22px) scale(0.85)",
            },
            "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
              transform: "translate(14px, 7px) scale(0.75)",
              padding: "0px 2px",
              color: "inherit",
            },
            "& .MuiOutlinedInput-root": {
              height: 30, // Adjust the height of the input area
              "& fieldset": {
                borderColor: `"#ddd"}`,
              },
              "&:hover fieldset": {
                borderColor: "currentColor", // Keeps the border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "currentColor", // Keeps the current border color
              },
            },
            "& .MuiInputLabel-root": {
              color: "inherit",
            },
          }}
        />
      )}
      ListboxComponent={CustomListBox}
      isOptionEqualToValue={(option, value) => option.Id === value.Id} // Add this line
    />
  );
}
