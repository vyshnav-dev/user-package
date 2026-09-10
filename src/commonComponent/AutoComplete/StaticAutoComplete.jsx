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
import { secondaryColor, thirdColor } from "../../config/config";

const StaticAutoComplete = ({
  apiKey,
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  required,
  payload
}) => {
  const [iTypeF2, setiTypeF2] = useState(1);
  const [searchkey, setsearchkey] = useState("");
  const [Menu, setMenu] = useState([]);
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const theme = useTheme();
  const focusedRef = useRef(false); // Use ref to track focus state
  const highlightRef = useRef(false); // Separate ref to track component focus state
  const [loading, setLoading] = useState(false)

  // Effect to sync state with prop changes

  const handleAutocompleteChange = (event, newValue) => {
    const updatedFormData = {
      ...formData,
      [formDataName]: newValue ? newValue.Name : "",
      [formDataiId]: newValue ? newValue.Id : 0,
    };
    setFormData(updatedFormData); // This will now update the parent's state
    setiTypeF2(1);
  };

  const debouncedFetchOptions = debounce(async (searchKey) => {
    if (!focusedRef.current) {
      return; // Fetch only if the input is focused
    }
    setLoading(true)
    try {
      const response = await apiKey({
        languageId: 1,
        type: iTypeF2,
        search: searchKey,
        ...payload
      });
      const results = JSON.parse(response?.result);
      setMenu(results || []);
      setLoading(false)
    } catch (error) {
      setMenu([]);
      setLoading(false)
    }
  }, 300);

  useEffect(() => {
    if (focusedRef.current) {
      debouncedFetchOptions(searchkey);
    }
  }, [searchkey, iTypeF2]);

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
      <ul style={{ paddingTop: 0 }} ref={ref} {...other}>
        <ListSubheader
          style={{
            backgroundColor: thirdColor,
            padding: "5px",
            color: secondaryColor,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto" }}>Name</Typography>
            <Typography style={{ marginLeft: "auto" }}>Code</Typography>
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
      // freeSolo
      clearIcon={searchkey ? undefined : null}
      id={autoId}
      options={Menu}
      loading={loading}
      onFocus={handleFocus} // Set focus state and fetch options when focused
      onBlur={handleBlur} // Reset focus state on blur
      getOptionLabel={(option) => option?.Name || formData[formDataName] || ""}
      value={formData[formDataName] ?? ""}
      onChange={handleAutocompleteChange}
      filterOptions={(options, { inputValue }) => {
        return options.filter(
          (option) =>
            option?.Name?.toLowerCase().includes(inputValue?.toLowerCase()) ||
            option?.Code?.toLowerCase().includes(inputValue?.toLowerCase())
        );
      }}
      onHighlightChange={(event, option) => {
        if (option !== highlightRef.current) {
          highlightRef.current = option; // Update ref without re-rendering
        }
      }}
      onInputChange={handleInputChange}
      renderOption={(props, option) => (
        <li {...props}>
          <div
            className=""
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto", fontSize: "12px" }}>
              {option.Name}
            </Typography>
            <Typography style={{ marginLeft: "auto", fontSize: "12px" }}>
              {option.Code}
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

                setsearchkey("");

                setiTypeF2((prevType) => (prevType === 1 ? 2 : 1));

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
                borderColor: `${ "#ddd"
                }`,
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
     
    />
  );
};

export default StaticAutoComplete;
