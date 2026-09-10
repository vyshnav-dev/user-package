import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  ListSubheader,
  Paper,
  useTheme,
} from "@mui/material";
import { secondaryColor, thirdColor } from "../../../config/config";


const ManualNameAutoComplete = ({
  formData,
  setFormData,
  label,
  autoId,
  formDataId,
  required,
  suggestion,
  readOnly, disabled,
  onUpdate

}) => {
  const [Menu, setMenu] = useState([]);

  useEffect(() => {
    setMenu(suggestion);
  }, [suggestion]);

  const handleAutocompleteChange = (event, newValue) => {
    const updatedFormData = {
      ...formData,
      [formDataId]: newValue ? newValue.Id : 0,
    };
    setFormData(updatedFormData);
    if(onUpdate){
      onUpdate(newValue);
    }
  };

  const CustomListBox = React.forwardRef((props, ref) => {
    const { children, ...other } = props;
    return (
      <ul style={{ paddingTop: 0, scrollbarWidth: "thin", }} ref={ref} {...other}>
        <ListSubheader
          style={{
            backgroundColor:thirdColor,
            padding: "5px",
            color:'white'
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Typography style={{ marginRight: "auto", fontSize:"0.8rem"}}>Name</Typography>
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
              color:"inherit",
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
            width: 250,
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
              color:"inherit",
            },
            "& .MuiOutlinedInput-root": {
              height: 30,
              "& fieldset": {
                borderColor: `${"#ddd" }`,
              },
              "&:hover fieldset": {
                borderColor:"currentColor",
              },
              "&.Mui-focused fieldset": {
                borderColor:"currentColor",
              },
            },
            "& .MuiInputLabel-root": {
              color:"inherit",
            },
          }}
        />
      )}
      ListboxComponent={CustomListBox}
    />
  );
};

export default ManualNameAutoComplete;
