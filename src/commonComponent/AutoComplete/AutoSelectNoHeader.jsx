import React, { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  ListSubheader,
  Paper,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useRef } from "react";
import { secondaryColor, thirdColor } from "../../config/config";

const AutoSelectNoHeader = ({
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  required,
  disabled,
  languageName,
  width = 250,
  ColumnSpan = 0,
  Menu=[],
  tableField=false,
  needHeader=true,
  onManualChange
}) => {

  const [searchkey, setsearchkey] = useState("");
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = useState(false);
  const direction ="ltr"
  
    const focusedRef = useRef(false); // Use ref to track focus state
    const highlightRef = useRef(false); // Separate ref to track component focus state
      



  // Effect to set the formDataName based on formDataiId
  useEffect(() => {
    if (formData[formDataiId]) {
      // Find the corresponding Name from Menu using formDataiId
      const selectedOption = Menu.find((item) => item.Id === formData[formDataiId]);

      // Set the formDataName if the selected option is found
      if (selectedOption) {
        setFormData({
          ...formData,
          [formDataName]: selectedOption.Name,  // Set the Name corresponding to the Id
        });
      }
    }
  }, [formData[formDataiId]]);

  const handleAutocompleteChange = (event, newValue) => {
    if (disabled) {
      return;
    }
     if (
    newValue &&
    newValue.Id === formData[formDataiId] &&
    newValue.Name === formData[formDataName]
    ) {
      return;
    }
    const updatedFormData = {
      ...formData,
      [formDataName]: newValue ? newValue?.Name : "",
      [formDataiId]: newValue ? newValue?.Id : 0,
    };
    setFormData(updatedFormData); // This will now update the parent's state
       if (onManualChange) {
           onManualChange(true);
         }
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
  };


  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue);
  };

  const CustomListBox = React.forwardRef((props, ref) => {
    const { children, ...other } = props;
    return (
      <ul style={{ paddingTop: 0, scrollbarWidth: "thin", }} ref={ref} {...other}>
        <ListSubheader
          style={{
            backgroundColor:secondaryColor,
            padding: "5px",
            color:thirdColor
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto",fontSize:"0.8rem" }}>Name</Typography>
            <Typography style={{ marginLeft: "auto", fontSize:"0.8rem"  }}>Code</Typography>
          </div>
        </ListSubheader>
        {children}
      </ul>
    );
  });

  const calculateLabelPosition = (width, isShrink) => {
    if (width <= 300) {
      return isShrink ? Math.max(0, width * 0.2) : 15; //30 Smaller fields have smaller translateX values
    } else if (width <= 400) {
      return isShrink ? Math.max(0, width * 0.21) : 20; //30 Mid-size fields
    } else if (width <= 500) {
      return isShrink ? Math.max(0, width * 0.22) : 25; //40 Mid-size fields
    } else if (width <= 600) {
      return isShrink ? Math.max(0, width * 0.23) : 40; //50 Mid-size fields
    } else if (width <= 700) {
      return isShrink ? Math.max(0, width * 0.23) : 50; //60 Mid-size fields
    } else if (width <= 800) {
      return isShrink ? Math.max(0, width * 0.233) : 60; //70 Mid-size fields
    } else if (width > 800) {
      return isShrink ? Math.max(0, width * 0.235) : 70; //80 Mid-size fields
    } else {
      return isShrink ? 80 : 65; // Larger fields need larger translateX values
    }
  };
  const isLatinScript = (text) => {
    const latinRegex = /^[\u0000-\u007F\u00C0-\u024F\u1E00-\u1EFF]*$/;
    return latinRegex.test(text); // Returns true if the text is Latin-based (including special chars)
  };

  const filterOptions = (options, { inputValue }) => {
    return options.filter((option) => {
      const name = option?.Name || '';
      const code = option?.Code || '';
  
      // Use toLowerCase() only for Latin script inputs
      const normalizedInput = isLatinScript(inputValue)
        ? inputValue.toLowerCase()
        : inputValue;
  
      const normalizedName = isLatinScript(name) ? name.toLowerCase() : name;
      const normalizedCode = isLatinScript(code) ? code.toLowerCase() : code;
   
      
      return (
        normalizedName.includes(normalizedInput) ||
        (normalizedCode && normalizedCode.includes(normalizedInput))
      );
    });
  };
  const handleFocus = () => {
    
    setPopupClosedByEscape(false);
   
  };
  return (
    <Autocomplete
      autoHighlight
      key={`${label}_${autoCompleteKey}`}
      disabled={disabled}
      size="small"
      PaperComponent={({ children }) => (
        <Paper style={{ minWidth: "150px", maxWidth: "300px" }}>
          {children}
        </Paper>
      )}
      sx={{
        width:width + ColumnSpan * 50,
      }}
      //freeSolo
      id={autoId}
      options={Menu}
      getOptionLabel={(option) => option?.Name || formData[formDataName] ||""}
      inputValue={searchkey}
      value={formData[formDataName]??""}
      onChange={handleAutocompleteChange}
      onFocus={handleFocus} 
      //openOnFocus={true} // Automatically open dropdown on focus
      onBlur={handleBlur} 
      filterOptions={filterOptions}
      disableClearable={!formData[formDataiId]} 
      onInputChange={handleInputChange}
      onHighlightChange={(event, option) => {
        if (option !== highlightRef.current) {
          highlightRef.current = option; // Update ref without re-rendering
        }
      }}
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
                 <Typography style={{ fontSize: "12px", flex: 1, textAlign: "left" }}>
                   {option?.Name}
                 </Typography>
                 <Typography style={{ fontSize: "12px", flex: 1, textAlign: "right" }}>
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
          disabled={disabled}
          inputProps={{
            ...params.inputProps,
            autoComplete: "off", // disable autocomplete and autofill
            // readOnly: !!formData[formDataiId],//newly added to avoid overflow when a selection and try to type after that
            style: {
              borderColor: "transparent",
              borderStyle: "solid",
              fontSize: "12px",
              height: "18px",
              padding:
                direction == "rtl" ? (formData[formDataiId] ?"0px 20px 0px 55px":"0px 0px 0px 55px" ) : "0px 10px 0px 10px",
              margin:
                direction == "rtl" ? (formData[formDataiId] ? -72 : -25) : 0,
              color:"inherit",
            },
            inputProps: {
              style: {
                direction: direction ?? "ltr", // Default to LTR if direction is not found
               // Default to inherit if fontFamily is not found
              },
            },
            onKeyDown: (event) => {
              if (event.key === "F2") {
                const updatedFormData = {
                  ...formData,
                  [formDataName]: "",
                  [formDataiId]:0,
                };
                setFormData(updatedFormData);

                setsearchkey("");

             

                event.preventDefault();
              }
              if (event.key === "Escape") {
                setPopupClosedByEscape(true);
                highlightRef.current = null;
                return; // Allow the default behavior to close the popup
              }
              if (
                event.key === "Tab" &&
                !popupClosedByEscape &&
                !highlightRef.current &&
                searchkey &&
                Menu.length > 0
              ) {
                const filteredOptions = filterOptions(Menu, { inputValue: searchkey });
                  if (filteredOptions.length > 0) {
                    highlightRef.current = filteredOptions[0];
                  }
              }
              if (event.key === "Tab" || event.key === "Enter") {
                // Select the currently highlighted option
                if (highlightRef.current) {
                  const newValue = highlightRef.current;
                   if (
                  newValue &&
                  newValue.Id === formData[formDataiId] &&
                  newValue.Name === formData[formDataName]
                  ) {
                    return;
                  }
            
                  // Set the form data directly with the highlighted option
                  setFormData({
                    ...formData,
                    [formDataName]: newValue?.Name,
                    [formDataiId]: newValue?.Id,
                  });
            
                  // Update the value directly
                  setsearchkey(newValue?.Name || "");
                }
                highlightRef.current = null;
                 if (onManualChange) {
                    onManualChange(true);
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
            sx: {
              textAlign: direction === "rtl" ? "right" : "left",
              right: direction === "rtl" ? 0 : "auto",
            },
          }}
          sx={{
            paddingTop:tableField?"0px":"16px",
            minWidth: width + ColumnSpan * 50,
            // "@media (max-width: 360px)": {
            //   width: 220, // Reduced width for small screens
            // },
            "& .MuiOutlinedInput-input": {
              padding: direction == "rtl" ? "8px 14px" : "2px 2px ",
              transform: "translate(-1px, 0px) scale(1)",
              textAlign: direction === "rtl" ? "right" : "left",
            },
            "& .MuiInputBase-input": {
              fontSize: "0.75rem",
            },
            "& .MuiInputLabel-outlined": {
              transform: "translate(14px, 22px) scale(0.85)",
            },
            "& .MuiInputLabel-outlined.MuiInputLabel-shrink": {
              // transform: "translate(14px, 7px) scale(0.75)",
              transform:
                direction === "rtl"
                  ? `translate(${calculateLabelPosition(
                      width + ColumnSpan * 50,
                      true
                    )}px, 7px) scale(0.75)`
                  : "translate(14px, 7px) scale(0.75)", // Adjust label position when focused
              padding: "0px 2px",
              color:"inherit",
            },
            "& .MuiOutlinedInput-root": {
              paddingRight: "0px !important",   // remove extra space
              "& .MuiAutocomplete-endAdornment": {
                right: 2,                        // bring icons closer
              },
              height: 30, // Adjust the height of the input area
              display: "flex",
              flexDirection: direction === "rtl" ? "row-reverse" : "row",
              // "& .MuiAutocomplete-endAdornment": {
              //   right: direction === "rtl" ? "auto" : 0, // Position icons on the left in RTL
              //   left: direction === "rtl" ? 0 : "auto", // Swap the position of the icons
              // },
              "& fieldset": {
                borderColor: `#ddd`,
                textAlign: direction === "rtl" ? "right" : "left",
              },
              "&:hover fieldset": {
                borderColor: "currentColor", // Keeps the border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "currentColor", // Keeps the current border color
              },
              "& legend": {
                width: direction === "rtl" ? "auto" : "max-content", // Let legend adjust width in RTL
              },

              "& .MuiSvgIcon-root": {
                marginRight: direction === "rtl" ? "auto" : 0,
                marginLeft: direction === "rtl" ? 0 : "auto", // Adjust icon spacing
              },
            },
            "& .MuiInputLabel-root": {
              color:"inherit",
              fontSize: "14px",
              transform:
                direction === "rtl"
                  ? `translate(${calculateLabelPosition(
                      width + ColumnSpan * 50,
                      false
                    )}px, 20px) scale(0.9)`
                  : null, // Adjust label position when not focused
            },
          }}
        />
      )}
      //ListboxComponent={needHeader?CustomListBox:null}
    />
  );
};

export default AutoSelectNoHeader;
