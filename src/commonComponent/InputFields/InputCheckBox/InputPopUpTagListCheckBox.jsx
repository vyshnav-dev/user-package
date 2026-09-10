import {
    Box,
    Checkbox,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Popover,
    TextField,
    Typography,
    useTheme,
  } from "@mui/material";
  import React, { useEffect, useRef, useState } from "react";
  import { styled, useMediaQuery } from "@mui/system";
  
  import { MDBIcon } from "mdb-react-ui-kit";
  

  import { secondaryColor, thirdColor } from "../../../config/config";
import UserInputField from "../UserInputField";
import { transactionApis } from "../../../service/Transaction/transaction";
import { masterApis } from "../../../service/Master/masterApis";

  const CustomTextField = styled(TextField)({
    "& .MuiInputBase-root": {
      "& textarea": {
        "&::-webkit-scrollbar": {
          width: "6px", // Adjust the width as needed
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(0, 0, 0, 0.2)", // Adjust the color as needed
          borderRadius: "3px", // Adjust the border radius as needed
          cursor: "pointer",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "rgba(0, 0, 0, 0.1)", // Adjust the track color as needed
        },
        // Dark mode specific styles
        '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
          backgroundColor: "rgba(255, 255, 255, 0.2)", // Adjust the color as needed
        },
        '&[data-mode="dark"]::-webkit-scrollbar-track': {
          backgroundColor: "rgba(255, 255, 255, 0.1)", // Adjust the track color as needed
        },
      },
    },
  });
  
  export default function InputPopUpTagListCheckBox({
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
    iTag
  }) {
  
    const theme = useTheme();
  
    const [tabPressed, setTabPressed] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [formula, setFormula] = useState([]);
    const [search, setSearch] = useState({ search: "" });
     const {GetTagList} = masterApis()
  
    useEffect(() => {
      const fetchData = async () => {
        try { 
          if (anchorEl) {
          
            const response = await GetTagList({
              iTag: iTag,
              Type: 1,
              SearchString: search?.search,
            });

  
            if (response?.status === "Success") {
              const myObject = JSON.parse(response?.result);
              setFormula(myObject);
            } else {
              setFormula([]);
            }
          } else {
            setFormula([]);
          }
        } catch (error) {
        
          setFormula([]); // Ensure the state is cleared if an error occurs
        }
      };
  
      fetchData();
    }, [search?.search, anchorEl]);
  
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
  
    // Function to close the popover
    const handleClose = () => {
      setAnchorEl(null);
    };
  
    const handleChange = (event) => {
      const inputValue = event.target.value;
      if (type === "number" && inputValue < 0) {
        return;
      }
  
      const update = Array.isArray(value) ? [...value] : [];
      update[name] =
        type === "number" && inputValue !== "" ? Number(inputValue) : inputValue;
      setValue(update);
    };
  
    const handleKeyDown = (event, values) => {
      if (
        event.key !== "Tab" &&
        // event.key !== "Enter" &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowLeft" &&
        event.key !== "ArrowRight"
      ) {
        event.preventDefault();
      }
      if (event.key === "Tab") {
        setTabPressed(true);
      }
      else if(event.key === "Enter"){
        if (values) {
          // Trigger checkbox change on Enter key
          const isChecked = value?.some(
            (restriction) =>
              restriction[name] === values?.Id &&
              values?.Name === restriction[`${name}_Name`]
          );
          handleOutLet({ target: { checked: !isChecked } }, values);
        } else {
          handleClick(event); // Open the popover if Enter is pressed elsewhere
        }
      }
    };
  
    const handleBlur = (event) => {
      if (tabPressed) {
        setTabPressed(false); // Reset flag after handling
        if (typeof onBlurAction === "function") {
          onBlurAction();
        }
      }
    };
  
    const open = Boolean(anchorEl);
    const id = open ? "simple-popover" : undefined;
  
    const handleOutLet = (e, value) => {
     
      const checked = e.target.checked;
      if (checked) {
        setValue((prevData) => [...prevData, {  [name]: value?.Id, [`${name}_Name`]: value?.Name}]);
      } else {
        setValue((prevArray) => prevArray.filter((item) => item[name] !== value.Id));
      }
    };
  
    return (
      <>
        <CustomTextField
          margin="normal"
          size="small"
          id="search1"
          value={
            Array.isArray(value) && value.length > 0
              ? value.map((item) => item?.[`${name}_Name`]).join(",")
              : ""
          }
          type={type}
          onMouseLeave={value && value?.map((item) => item[`${name}_Name`]).join(',') ? onBlurAction : null} // Trigger on mouse leave
          onBlur={handleBlur} // Trigger only if Tab key was pressed
          onKeyDown={handleKeyDown} // Detect if Tab is pressed
          label={label}
          required={mandatory}
          multiline={true}
          rows={3}
          autoComplete="off"
          disabled={disabled}
          onChange={handleChange}
          onClick={handleClick}
          InputProps={{
            inputProps: {
              maxLength: maxLength,
              autoComplete: `off`,
              ...(type === "date"
                ? {
                    onClick: (e) => e.target.showPicker?.(),
                  }
                : type === "datetime-local"
                ? {
                    step: 1, // For precise datetime input including seconds
                    onKeyDown: (e) => {
                      // Disable manual typing for datetime fields
                      if (e.key !== "Tab") e.preventDefault();
                    },
                    onClick: (e) => e.target.showPicker?.(),
                    onFocus: (e) => e.target.showPicker?.(),
                  }
                : {}),
              style: {
                direction: direction ? "rtl" : "ltr", // Default to LTR if direction is not found
              },
            },
            sx: {
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                filter: theme.palette.mode === "dark" ? "invert(1)" : "invert(0)",
              },
              '& input[type="time"]::-webkit-calendar-picker-indicator': {
                filter: theme.palette.mode === "dark" ? "invert(1)" : "invert(0)", // Ensures visibility in dark mode
              },
              '& input[type="datetime-local"]::-webkit-calendar-picker-indicator':
                {
                  filter:
                    theme.palette.mode === "dark" ? "invert(1)" : "invert(0)",
                },
            },
          }}
          InputLabelProps={{
            style: {
              direction: direction ? "rtl" : "ltr", // Apply RTL to the label
            },
          }}
          sx={{
            width: width ? width : 250, // Adjust the width as needed
            "@media (max-width: 360px)": {
              width: 220, // Reduced width for small screens
            },
            "& .MuiInputBase-root": {
              ...({}), // Adjust the height of the input area if not multiline
              "& textarea": {
                "&::-webkit-scrollbar": {
                  width: "6px", // Adjust the width as needed
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.2)"
                      : "rgba(0, 0, 0, 0.2)", // Adjust the color as needed
                  borderRadius: "3px", // Adjust the border radius as needed
                  cursor: "pointer",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)", // Adjust the track color as needed
                },
              },
            },
            "& .MuiInputLabel-root": {
              fontSize: "14px",
              transform: "translate(10px, 5px) scale(0.9)", // Adjust label position when not focused
              color: "inherit",
            },
            "& .MuiInputLabel-shrink": {
              transform: "translate(14px, -9px) scale(0.75)", // Adjust label position when focused
            },
            "& .MuiInputBase-input": {
              fontSize: "0.75rem", // Adjust the font size of the input text
              color: "inherit",
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
                borderColor: `${"#ddd"}`,
              },
              "&:hover fieldset": {
                borderColor: "currentColor", // Keeps the border color on hover
              },
              "&.Mui-focused fieldset": {
                borderColor: "currentColor", // Keeps the current border color
              },
            },
          }}
        />
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "column", md: "row" }, // Stack on small screens, side-by-side on larger screens
                justifyContent: "space-between",
                alignItems: "flex-start", // Align items at the top
                gap: 2, // Space between the input and the table
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column", // Stack input and buttons vertically
                  gap: 1, // Space between the input and the buttons
                  flex: 1, // Allow it to take up available space
                  // Set a minimum width to ensure usability
                }}
              >
                {/* Right Section: Table */}
                <UserInputField
                  label="Search"
                  disabled={false}
                  value={search}
                  setValue={setSearch}
                  type="text"
                  name={"search"}
                />
                <Box
                  sx={{
                    display: "flex",
                    borderRadius: 1,
                    flexDirection: "column",
                    maxHeight: "400px",
                    overflow: "auto",
                    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
                    scrollbarWidth: "thin",
                    backgroundColor: secondaryColor,
                    // color: currentTheme.tableHeaderColor,
                  }}
                >
                  <div>
                    <Paper
                      sx={{
                        width: "100%",
                        height: 300,
                        overflow: "auto",
                        scrollbarWidth: "thin",
                        padding: 0,
                      }}
                    >
                      <List
                        dense
                        component="div"
                        role="list"
                        style={{ padding: 0, margin: 0 }}
                      >
                          {formula && formula.length ? (
                              <>
                                 {formula.map((values) => (
                          <ListItemButton role="listitem" key={values?.Id} tabIndex={-1}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                width: "auto",
                              }}
                           
                              onKeyDown={(event) => handleKeyDown(event, values)}
                            >
                              <Checkbox
                                checked={value?.some(
                                  (restriction) =>
                                    restriction[name] === values?.Id &&
                                    values?.Name === restriction[`${name}_Name`]
                                )}
                                onChange={(e) => handleOutLet(e, values)}
                                inputProps={{ "aria-label": "controlled" }}
                                sx={{
                                  p: 0, // Remove default padding
  
                                  "& .MuiSvgIcon-root": {
                                    fontSize: 16, // Reduce icon size
                                  },
                                }}
                                color="default"
                              />
                              <ListItemText
                                sx={{
                                  paddingLeft: 0.5, // Reduce padding between checkbox and text
                                  "& .MuiTypography-root": {
                                    fontSize: "0.6rem", // Adjust font size
                                  },
                                }}
                                id={`transfer-list-item-${values?.Name}-label`}
                                primary={values?.Name || "No Name"}
                              />
                            </Box>
                          </ListItemButton>
                        ))}</>
                          ) : (
                              <Box sx={{ width: "100%", textAlign: "center", my: 4,  }}>
                              <Typography sx={{fontSize: 12}}> {name} not found</Typography>
                            </Box>
                          )}
                     
                      </List>
                    </Paper>
                  </div>
                </Box>
              </Box>
            </Box>
          </Box>
        </Popover>
      </>
    );
  }
  