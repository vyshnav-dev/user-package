import React, { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  ListSubheader,
  Paper,
  CircularProgress,
  IconButton,
  Stack,
  Box,
  Tooltip,

} from "@mui/material";
import { debounce } from "lodash";
import { useRef } from "react";
import { secondaryColor, thirdColor } from "../../config/config";

const LinkAutoComplete = ({
  apiKey,
  formData,
  setFormData,
  label,
  autoId,
  formDataName,
  formDataiId,
  formDataType,
  required,
  languageId,
  disabled,
  params1,
  params2,
  params3,
  params3Value,
  params4,
  params4Value,
  refreshTrigger,
  languageName,
  ColumnSpan = 0,
  isSwitchable=false,
  tableField=false,
  screenTagId,
  LinkTagId,
  detailScreeniId,
  width = (isSwitchable&&!disabled)?220:250,
  setManualChange = () => {}, // default empty function
}) => {
  const [iTypeF2, setiTypeF2] = useState(1);
  const [searchkey, setsearchkey] = useState("");
  const [Menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoCompleteKey, setAutoCompleteKey] = useState(0);
  const [popupClosedByEscape, setPopupClosedByEscape] = useState(false);


   const [toggleFocus, settoggleFocus] = useState(false)





  const direction ="ltr"
 
  

  
    const focusedRef = useRef(false); // Use ref to track focus state
    const highlightRef = useRef(false); // Separate ref to track component focus state
    const clearedManually = useRef(false); // Add this ref



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
      [formDataType]: newValue ? newValue?.Type : 0,
    };
    setFormData(updatedFormData); // This will now update the parent's state
    setiTypeF2(1);
    highlightRef.current = false
    setManualChange(true)
    setMenu([])
    // Set cleared flag if clearing manually
  if (!newValue) {
    clearedManually.current = true;
    setTimeout(() => {
      clearedManually.current = false; // Reset after a delay
    }, 1000);
  }
  };

  const lastRequestId = useRef(0);

  const debouncedFetchOptions =
    debounce(async (searchKey) => {

      if (!focusedRef.current) {
        return; // Fetch only if the input is focused
      }
      const currentRequestId = ++lastRequestId.current;
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
        if (languageId) {
          params.languageId = languageId;
        }

        const response = await apiKey(params);

    

        
        const results = JSON.parse(response?.result) || [];
        if (currentRequestId === lastRequestId.current) {
          let filteredResults = results;

      // Check if LinkTagId and screenTagId are available and equal
      if (LinkTagId && screenTagId && LinkTagId === screenTagId) {
        // Filter out the item with Id equal to detailScreeniId
        filteredResults = results.filter((item) => item.Id !== detailScreeniId);
      }

      setMenu(filteredResults);
      }
      } catch (error) {
        setMenu([]);
      }
      setLoading(false);
    }, 300)

  useEffect(() => {
    if (focusedRef.current) {
      
      debouncedFetchOptions(searchkey);
    }
  }, [searchkey, iTypeF2,toggleFocus]);

  const handleFocus = () => {
    focusedRef.current = true; // Set focused state to true in ref
    settoggleFocus(!toggleFocus)
    setPopupClosedByEscape(false);
   
  };

  const handleBlur = () => {
    highlightRef.current = false
    focusedRef.current = false; // Reset focus state when the component loses focus
    // Check for the existence in Menu or the existing formData value
    const existsInMenu = Menu.some((option) => option.Name === searchkey);
    const existingFormValue = formData[formDataName] || "";

    if (!existsInMenu && searchkey !== existingFormValue) { 
      setFormData({
        ...formData,
        [formDataName]: "",
        [formDataiId]: 0,
        [formDataType]: 0,

      });
      setsearchkey("");
      setAutoCompleteKey(prevKey => prevKey + 1);
      setMenu([])
    }
  };


  const handleInputChange = (event, newInputValue) => {
    setsearchkey(newInputValue??"");
        
  };

  const CustomListBox = React.forwardRef((props, ref) => {
    const { children, ...other } = props;

     // Determine if any option has a `Code` property
     const showCodeHeader = Menu.some((option) => option?.Code);
    return (
      <ul style={{ paddingTop: 0, scrollbarWidth: "thin", }} ref={ref} {...other}>
        <ListSubheader
          style={{
            backgroundColor:thirdColor,
            padding: "5px",
            color:"#fff"
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
            {showCodeHeader && (
            <Typography style={{ marginLeft: "auto", fontSize:"0.8rem"  }}>Code</Typography>
          )}
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
        ? inputValue?.toLowerCase()
        : inputValue;
  
      const normalizedName = isLatinScript(name) ? name?.toLowerCase() : name;
      const normalizedCode = isLatinScript(code) ? code?.toLowerCase() : code;
   
      
      return (
        normalizedName?.includes(normalizedInput) ||
        (normalizedCode && normalizedCode?.includes(normalizedInput))
      );
    });
  };

  const handleAddClick = (option) => {
   
  };
  //auto select if only one item and mandatory
//   useEffect(() => {
//   if (focusedRef.current&&!searchkey && required && Menu.length === 1 && !formData[formDataiId] && !clearedManually.current) {
//     // Automatically select the only option
//     const singleOption = Menu[0];

//      if (
//     singleOption &&
//     singleOption.Id === formData[formDataiId] &&
//     singleOption.Name === formData[formDataName]
//     ) {
//       return;
//     }
//     const updatedFormData = {
//       ...formData,
//       [formDataName]: singleOption.Name,
//       [formDataiId]: singleOption.Id,
//     };
    
//     setFormData(updatedFormData);
//     setsearchkey(singleOption.Name);
//     setManualChange(true);
//     setMenu([])
//   }
// }, [Menu, focusedRef.current, required]); // Run when Menu changes or focus state changes

  return (
    <Box
    sx={{
      display: "flex",
      flexDirection: direction === "rtl" ? "flex-start":"flex-end",
     
      width: `${width+40}`,
    }}
  >
    <Tooltip title={disabled ? formData[formDataName] || "" : ""} arrow placement="bottom" 
  PopperProps={{
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -10], // [horizontal, vertical]; -10 moves it 10px up
        },
      },
    ],
  }}>
    <Autocomplete
      autoHighlight
      key={`${label}_${autoCompleteKey}`}
      disabled={disabled}
      loading={loading}
      loadingText={<CircularProgress size={20} />} 
      noOptionsText={""}
      size="small"
      PaperComponent={({ children }) => (
        <Paper style={{ minWidth: "150px", maxWidth: "300px" }}>
          {children}
        </Paper>
      )}
      // freeSolo
      id={autoId}
      options={Menu}
      getOptionLabel={(option) => option?.Name || formData[formDataName] ||""}
      value={formData[formDataName]??""}
      inputValue={searchkey} // Add this line
      onChange={handleAutocompleteChange}
      onFocus={handleFocus} 
      //openOnFocus={true} // Automatically open dropdown on focus
      onBlur={handleBlur} 
      groupBy={(option) => option.group}
      filterOptions={filterOptions}
      disableClearable={!formData[formDataiId] || disabled} 
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
                fontFamily: "inherit", // Default to inherit if fontFamily is not found
              },
            },
            onKeyDown: (event) => {
              if (event.key === "F2") {
                const updatedFormData = {
                  ...formData,
                  [formDataName]: "",
                  [formDataiId]:0,
                  [formDataType]:0,
                };
                setFormData(updatedFormData);
                setMenu([])
                setsearchkey("");
                highlightRef.current = false
                setiTypeF2((prevType) => (prevType === 1 ? 2 : 1));

                event.preventDefault();
              }
              if (event.key === "Escape") {
                setPopupClosedByEscape(true);
                highlightRef.current = null;
                return; // Allow the default behavior to close the popup
              }
              // if (
              //   event.key === "Tab" &&
              //   !popupClosedByEscape &&
              //   !highlightRef.current &&
              //   searchkey &&
              //   Menu.length > 0
              // ) {
              //   highlightRef.current = Menu[0];
              // }
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
                    [formDataType]: newValue?.Type,
                  });
                  setMenu([])
            
                  // Update the value directly
                  setsearchkey(newValue?.Name || "");
                  highlightRef.current = false
                  setManualChange(true)
                }
                setTimeout(() => {
                  event.target.blur(); // Move focus to the next field
                }, 0);
                // event.preventDefault();
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
              height: 30, // Adjust the height of the input area
              display: "flex",
              flexDirection: direction === "rtl" ? "row-reverse" : "row",
              "& fieldset": {
                borderColor:  "#ddd",
                textAlign: direction === "rtl" ? "right" : "left",
              },
              "&:hover fieldset": {
                borderColor:"currentColor", // Keeps the border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "currentColor", // Keeps the current border color
              },
              "& legend": {
                width: direction === "rtl" ? "auto" : "max-content", // Let legend adjust width in RTL
              },

              "& .MuiAutocomplete-endAdornment": {
                right: direction === "rtl" ? "auto" : 0, // Position icons on the left in RTL
                left: direction === "rtl" ? 0 : "auto", // Swap the position of the icons
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
      // ListboxProps={{
      //   style: { maxHeight: '200px', overflow: 'auto' },
      // }}
      ListboxComponent={CustomListBox}
    />
    </Tooltip>
   
    </Box>
  );
};

export default LinkAutoComplete;
