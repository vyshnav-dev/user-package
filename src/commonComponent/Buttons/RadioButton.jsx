import { Box, FormControlLabel, Radio, Typography } from "@mui/material";
import React from "react";

export default function RadioButton({
  label,
  value,
  changeValue,
  fieldName,
  checkValue,
  disable,
  width
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", width:width? width : 250 }}>
      <FormControlLabel
        value="code"
        control={
          <Radio
          disabled={disable}
            aria-labelledby="demo-radio-buttons-group-label"
            sx={{ paddingLeft: 2.5 }}
            color="info"
            checked={value[fieldName] === checkValue}
            onChange={(e) => {
              const update = { ...value };
              update[fieldName] = checkValue;
              changeValue(update);
            }}
          />
        }
        label={<Typography sx={{ fontSize: "12px" }}>{label}</Typography>}
        labelPlacement="end"
      />
    </Box>
  );
}
