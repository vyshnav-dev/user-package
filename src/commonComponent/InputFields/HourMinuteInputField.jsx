import React, { useEffect, useState } from "react";
import { Box, TextField, InputLabel } from "@mui/material";
import { styled } from "@mui/system";

const Container = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  border: "1px solid #ddd",
  borderRadius: "4px",
  height: 30,
  overflow: "hidden",
  "&:focus-within": {
    borderColor: undefined,
  },
}));

const FloatingLabel = styled(InputLabel)(() => ({
  position: "absolute",
  left: 8,
  top: -10,
  fontSize: "0.70rem",
  color: "#000",
  backgroundColor: "#fff",
  padding: "0 4px",
  pointerEvents: "none",
  transition: "all 0.2s ease",
  zIndex:1
}));

const TimeInputWrapper = styled(Box)({
  position: "relative",
  width: "50%",
});

const Suffix = styled("span")({
  position: "absolute",
  right: 6,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "0.7rem",
  color: "#888",
  pointerEvents: "none",
});

const TimeInput = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    "& fieldset": { border: "none" },
  },
  "& .MuiInputBase-input": {
    padding: "4px 22px 4px 8px", // space for suffix
    textAlign: "center",
    fontSize: "0.8rem",
    color: "inherit",
  },
});

export default function HourMinuteInputField({
  label,
  value,
  onChange,
  maxHours = 72,
  disabled = false,
  width = 250,
  mandatory = false
}) {
  const parseValue = (v) => {
    const [h = 0, m = 0] = (v || "00:00").split(":").map(Number);
    return [h, m];
  };

  const [hour, setHour] = useState(parseValue(value)[0]);
  const [minute, setMinute] = useState(parseValue(value)[1]);

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  const update = (newHour, newMinute) => {
    const h = clamp(newHour, 0, maxHours);
    const m = clamp(newMinute, 0, 59);
    setHour(h);
    setMinute(m);
    onChange?.(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const handleHourChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val === "") return setHour("");
    update(Number(val), minute);
  };

  const handleMinuteChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val === "") return setMinute("");
    update(hour, Number(val));
  };

  useEffect(() => {
  const [h, m] = parseValue(value);
  setHour(h);
  setMinute(m);
}, [value]);

const blockInvalidChars = (e) => {
  if (["e", "E", "+", "-", "."].includes(e.key)) {
    e.preventDefault();
  }
};



  return (
    <Box sx={{ position: "relative", width }}>
      {label && <FloatingLabel sx={{fontSize:'10px'}} >{label} {mandatory?"*":""}</FloatingLabel>}

      <Container
        sx={{
          backgroundColor: disabled ? "#f5f5f5" : "inherit",
        }}
      >
        <TimeInputWrapper>
          <TimeInput
            type="number"
            value={hour}
            onChange={handleHourChange}
            onKeyDown={blockInvalidChars} 
            disabled={disabled}
            inputProps={{ min: 0, max: maxHours }}
            placeholder="HH"
            size="small"
          />
          <Suffix>HH</Suffix>
        </TimeInputWrapper>

        <Box sx={{ color: "#999", fontSize: "0.8rem" }}>:</Box>

        <TimeInputWrapper>
          <TimeInput
            type="number"
            value={minute}
            onChange={handleMinuteChange}
            onKeyDown={blockInvalidChars}
            disabled={disabled}
            inputProps={{ min: 0, max: 59 }}
            placeholder="MM"
            size="small"
          />
          <Suffix>MM</Suffix>
        </TimeInputWrapper>
      </Container>
    </Box>
  );
}
