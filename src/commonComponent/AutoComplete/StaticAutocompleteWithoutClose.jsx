import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  ListSubheader,
  Paper,
  useTheme,
} from "@mui/material";
import { secondaryColor, thirdColor } from "../../config/config";

const StaticAutocompleteWithoutClose = ({
  formData,
  setFormData,
  label,
  autoId,
  formDataId,
  formDataName,
  required,
  suggestion,
  readOnly, disabled,
  Top=1,
  width=250
}) => {
  const [Menu, setMenu] = useState([]);
  useEffect(() => {
    setMenu(suggestion);
  }, [suggestion]);

  const handleAutocompleteChange = (event, newValue) => {
    const updatedFormData = {
      ...formData,
      [formDataId]: newValue ? newValue.Id : null,
      ...(formDataName && { [formDataName]: newValue ? newValue.Name : null }),
    };
    
    setFormData(updatedFormData);
    
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
          </div>
        </ListSubheader>
        {children}
      </ul>
    );
  });

  return (
    <Autocomplete
      size="small"
      PaperComponent={({ children }) => (
        <Paper style={{ minWidth: "150px", maxWidth: "300px" }}>
          {children}
        </Paper>
      )}
      readOnly={readOnly}
      disabled={disabled}
      id={autoId}
      options={Menu}
      getOptionLabel={(option) => option.Name}
      value={Menu.find((option) => option.Id === formData[formDataId]) || null}
      onChange={handleAutocompleteChange}
      filterOptions={(options, { inputValue }) =>
        options.filter((option) =>
          option.Name.toLowerCase().includes(inputValue.toLowerCase())
        )
      }
      isOptionEqualToValue={(option, value) => option.Id === value.Id}
      disableClearable // This removes the clear (close) icon
      renderOption={(props, option) => (
        <li {...props} key={option.Id}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto", fontSize: "12px" }}>
              {option.Name}
            </Typography>
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          required={required}
          label={label}
          {...params}
          InputProps={{
            ...params.InputProps,
            // Remove the clear button from the input
            endAdornment: null,
          }}
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
          }}
          InputLabelProps={{
            style: {
              fontSize: "14px",
              padding: "0 0px",
              zIndex: 1,
            },
          }}
          sx={{
            paddingTop: Top == 0 ? "0px" : "16px",
            width: width,
            "@media (max-width: 360px)": {
              width: 220,
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
              height: 30,
              // Remove padding to give more space for text
              paddingRight: "0px !important",
              "& fieldset": {
                borderColor: `${ "#ddd"
                }`,
              },
              "&:hover fieldset": {
                borderColor: "currentColor",
              },
              "&.Mui-focused fieldset": {
                borderColor: "currentColor",
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

export default StaticAutocompleteWithoutClose;