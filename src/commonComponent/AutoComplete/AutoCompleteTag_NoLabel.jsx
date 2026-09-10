import React, { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  ListSubheader,
  Paper,
  useTheme,
} from "@mui/material";
import { debounce } from "lodash";
import { useRef } from "react";
import { secondaryColor, thirdColor } from "../../config/config";


const AutoCompleteTag_NoLabel = ({
  apiKey,
  formData,
  setFormData,
  autoId,
  formDataName,
  formDataiId,
  required,
  languageId,
  disabled,
  tagId,
  tabId,
  onBlur,
  width = 200,
  rows,
  index,
  params1,
  params2,
  params3,
  params3Value,
  params4,
  params4Value,
  params5,
  params5Value,
  extraFieldKey = ""
}) => {
  const [iTypeF2, setiTypeF2] = useState(1);
  const [searchkey, setsearchkey] = useState("");
  const [Menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);


  const theme = useTheme();

  const focusedRef = useRef(false); // Use ref to track focus state
  const highlightRef = useRef(false); // Separate ref to track component focus state


  // Effect to sync state with prop changes
  // useEffect(() => {
  //   setsearchkey(formData[formDataName] || "");
  // }, [formData[formDataName]]);

  const updateExtraFields = (updatedFormData, selectedValue) => {
    if (!selectedValue || !Array.isArray(extraFieldKey)) {
      return updatedFormData;
    }

    extraFieldKey.forEach((key) => {
      updatedFormData[key] = selectedValue[key] ?? "";
    });

    return updatedFormData;
  };

  const handleAutocompleteChange = (event, newValue) => {
    if (disabled) {
      return;
    }
    const updatedFormData = {
      ...formData,
      [formDataName]: newValue ? newValue.Name : "",
      [formDataiId]: newValue ? newValue.Id : 0,
    };

    updateExtraFields(updatedFormData, newValue);

    setFormData(updatedFormData);
    setiTypeF2(1);
  };

  const debouncedFetchOptions =
    debounce(async (searchKey) => {
      if (!focusedRef.current) {
        return; // Fetch only if the input is focused
      }
      setLoading(true);
      try {
        let params = {};

        if (params1) {
          params[params1] = searchKey ?? "";
        }

        if (params2) {
          params[params2] = iTypeF2;
        }

        if (params3) {
          params[params3] = params3Value;
        }
        if (params4) {
          params[params4] = params4Value;
        }
        if (params5) {
          params[params5] = params5Value;
        }
        if (languageId) {
          params.languageId = languageId;
        }

        const response = await apiKey(params);
        const results = JSON.parse(response?.result);
        // Extract formDataiIds from rows, excluding the current index
        const existingIds = rows
          .filter((_, rowIndex) => rowIndex !== index)
          .map((row) => row[formDataiId]);

        // Filter results to exclude objects with IDs already in existingIds
        const filteredResults = results.filter(
          (item) => !existingIds.includes(item.Id)
        );

        setMenu(filteredResults);
      } catch (error) {
        setMenu([]);
      }
      setLoading(false);
    }, 300)

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
      setAutoCompleteKey(prevKey => prevKey + 1);
    }
    // onBlur();
  };

  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue);
  };

  const CustomListBox = React.forwardRef((props, ref) => {
    const { children, ...other } = props;

    const showCodeHeader = Menu.some(option => option?.Code);
    return (
      <div style={{ position: "relative" }}>
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
            {showCodeHeader && (
              <Typography style={{ marginLeft: "auto" }}>Code</Typography>
            )}
          </div>
        </ListSubheader>
        <ul ref={ref} {...other} style={{ paddingTop: 0, margin: 0 }}>
          {React.Children.toArray(children)}
        </ul>
      </div>
    );
  });

  return (
    <Autocomplete
      key={`${autoId}_${autoCompleteKey}`}
      disabled={disabled}
      size="small"
      PaperComponent={({ children }) => (
        <Paper style={{ minWidth: "150px", maxWidth: "300px" }}>
          {children}
        </Paper>
      )}
      // freeSolo
      id={autoId}
      options={Menu}
      getOptionLabel={(option) => option?.Name || formData[formDataName] || ""}
      value={formData[formDataName] ?? ""}
      disableClearable={!formData[formDataiId]}
      onChange={handleAutocompleteChange}
      onFocus={handleFocus} // Set focus state and fetch options when focused
      onBlur={handleBlur}
      onHighlightChange={(event, option) => {
        if (option !== highlightRef.current) {
          highlightRef.current = option; // Update ref without re-rendering
        }
      }}
      filterOptions={(options, { inputValue }) => {
        return options.filter(
          (option) =>
            option?.Name.toLowerCase().includes(inputValue?.toLowerCase()) ||
            (option?.Code && option?.Code.toLowerCase().includes(inputValue?.toLowerCase()))
        );
      }}
      onInputChange={handleInputChange}
      renderOption={(props, option) => (
        <li {...props}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto", fontSize: "12px", color: "inherit", }}>
              {option?.Name}
            </Typography>
            {option?.Code && (
              <Typography style={{ marginLeft: "auto", fontSize: "12px", color: "inherit", }}>
                {option?.Code}
              </Typography>
            )}
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          required={required}
          {...params}
          disabled={disabled}
          inputProps={{
            ...params.inputProps,
            autoComplete: "off",
            style: {
              borderColor: "transparent",
              borderStyle: "solid",
              fontSize: "12px",
              height: "18px",
              padding: "0px 25px 0px 10px",
              margin: 0,
              color: "inherit",
            },
            onKeyDown: (event) => {
              if (event.key === "F2") {
                const updatedFormData = {
                  ...formData,
                  [formDataName]: "",
                  [formDataiId]: 0,
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

                  const updatedFormData = {
                    ...formData,
                    [formDataName]: newValue?.Name,
                    [formDataiId]: newValue?.Id,
                  };
                  if (extraFieldKey?.trim() !== "") {
                    const keys = extraFieldKey.split(",").map(k => k.trim());

                    keys.forEach(key => {
                      updatedFormData[key] = newValue[key] ?? "";
                    });
                  }

                  setFormData(updatedFormData);

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
          sx={{
            width: width,
            "& .MuiOutlinedInput-input": {
              padding: "4px 8px", // Adjust padding for compact fit
            },
            "& .MuiInputBase-input": {
              fontSize: "0.75rem",
            },
            "& .MuiOutlinedInput-root": {
              height: 30,
              "& fieldset": {
                borderColor: "#ddd",
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
      )}
      ListboxComponent={CustomListBox}
    />
  );
};

export default AutoCompleteTag_NoLabel;
