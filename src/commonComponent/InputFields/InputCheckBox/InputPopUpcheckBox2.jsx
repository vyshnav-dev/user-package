import {
    Box,
    Button,
    Checkbox,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Popover,
    TextField,
    Typography,
    useTheme,
    FormControlLabel,
} from "@mui/material";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { styled, useMediaQuery } from "@mui/system";

import { MDBIcon } from "mdb-react-ui-kit";

import { secondaryColor, thirdColor } from "../../../config/config";
import UserInputField from "../UserInputField";

const CustomTextField = styled(TextField)({
    "& .MuiInputBase-root": {
        "& textarea": {
            "&::-webkit-scrollbar": {
                width: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderRadius: "3px",
                cursor: "pointer",
            },
            "&::-webkit-scrollbar-track": {
                backgroundColor: "rgba(0, 0, 0, 0.1)",
            },
            '&[data-mode="dark"]::-webkit-scrollbar-thumb': {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
            '&[data-mode="dark"]::-webkit-scrollbar-track': {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
        },
    },
});

export default function InputPopUpcheckBox2({
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
    iTag,
    apiKey,
    params1,
    params2,
    params3,
    params3Value,
    params4,
    params4Value,
    params5,
    params5Value,
    params6,
    params6Value,
    params7,
    params7Value,
    languageId,
    refreshTrigger,
    required = mandatory,
    ColumnSpan = 0,
}) {
    const theme = useTheme();

    const [tabPressed, setTabPressed] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [formula, setFormula] = useState([]);
    const [search, setSearch] = useState({ search: "" });
    const [tempSelected, setTempSelected] = useState([]);

    const open = Boolean(anchorEl);
    const id = open ? "simple-popover" : undefined;
    const apiFunction = apiKey;

    // Fetch data when popover opens or search changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (anchorEl) {
                    let params = {};

                    if (params1) {
                        params[params1] = search?.search.trim() ?? "";
                    } else {
                        params.Search = search?.search.trim() ?? "";
                    }

                    if (params2) {
                        params[params2] = 1;
                    } else {
                        params.Type = 1;
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

                    if (params5) {
                            params[params5] = params5Value;
                        }

                    if (params6) {
                            params[params6] = params6Value;
                        }

                    if (params7) {
                            params[params7] = params7Value;
                        }

                    const response = await apiFunction(params);

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
                setFormula([]);
            }
        };

        fetchData();
    }, [search?.search, anchorEl]);

    // Initialize tempSelected when popover opens
    useEffect(() => {
        if (open) {
            setTempSelected(value || []);
        }
    }, [open, value]);

    // --- Memoized derived state for performance ---
    const selectedIds = useMemo(
        () => tempSelected.map(item => item[name]),
        [tempSelected, name]
    );

    const formulaItemIds = useMemo(
        () => formula.map(item => item.Id),
        [formula]
    );

    const selectedCountInFormula = useMemo(
        () => formula.filter(item => selectedIds.includes(item.Id)).length,
        [formula, selectedIds]
    );

    const allSelected = formula.length > 0 && selectedCountInFormula === formula.length;
    const someSelected = selectedCountInFormula > 0 && selectedCountInFormula < formula.length;

    // Combine selected items first, then unselected (for display)
    const sortedItems = useMemo(() => {
        const selectedItemsFromFormula = formula.filter(item => selectedIds.includes(item.Id));
        const unselectedItems = formula.filter(item => !selectedIds.includes(item.Id));
        return [...selectedItemsFromFormula, ...unselectedItems];
    }, [formula, selectedIds]);

    // --- Event handlers ---
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setSearch({ search: "" });
        setAnchorEl(null);
    };

    const handleOk = () => {
        setValue(tempSelected);
        handleClose();
    };

    const handleReset = () => {
        setTempSelected([]);
        setValue([]);
        setSearch({ search: "" });
    };

    const handleTempOutLet = (e, value) => {
        const checked = e.target.checked;
        if (checked) {
            setTempSelected((prevData) => [...prevData, {
                [name]: value?.Id,
                [`${name}_Name`]: value?.Name
            }]);
        } else {
            setTempSelected((prevArray) => prevArray.filter((item) => item[name] !== value.Id));
        }
    };

    const handleSelectAll = () => {
        if (allSelected) {
            // Deselect all items that are currently in the formula
            setTempSelected(prev =>
                prev.filter(selectedItem => !formula.some(item => item.Id === selectedItem[name]))
            );
        } else {
            // Select all items from formula that are not already selected
            const newItems = formula
                .filter(item => !selectedIds.includes(item.Id))
                .map(item => ({
                    [name]: item.Id,
                    [`${name}_Name`]: item.Name
                }));
            setTempSelected(prev => [...prev, ...newItems]);
        }
    };

    const handleKeyDown = (event, values) => {
        if (
            event.key !== "Tab" &&
            event.key !== "ArrowDown" &&
            event.key !== "ArrowLeft" &&
            event.key !== "ArrowRight"
        ) {
            event.preventDefault();
        }
        if (event.key === "Tab") {
            setTabPressed(true);
        } else if (event.key === "Enter") {
            if (values) {
                const isChecked = tempSelected?.some(
                    (restriction) =>
                        restriction[name] === values?.Id &&
                        values?.Name === restriction[`${name}_Name`]
                );
                handleTempOutLet({ target: { checked: !isChecked } }, values);
            } else {
                handleClick(event);
            }
        }
    };

    const handleBlur = (event) => {
        if (tabPressed) {
            setTabPressed(false);
            if (typeof onBlurAction === "function") {
                onBlurAction();
            }
        }
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

    return (
        <>
            <CustomTextField
                margin="normal"
                size="small"
                id="search1"
                value={
                    Array.isArray(value) && value.length > 0
                        ? value.map((item) => item?.[`${name}_Name`]).join(", ")
                        : ""
                }
                type={type}
                onMouseLeave={value && value?.map((item) => item[`${name}_Name`]).join(', ') ? onBlurAction : null}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                label={label}
                required={required}
                multiline={multiline}
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
                                    step: 1,
                                    onKeyDown: (e) => {
                                        if (e.key !== "Tab") e.preventDefault();
                                    },
                                    onClick: (e) => e.target.showPicker?.(),
                                    onFocus: (e) => e.target.showPicker?.(),
                                }
                                : {}),
                        style: {
                            direction: direction ? "rtl" : "ltr",
                        },
                    },
                    sx: {
                        height:'30px',
                        '& input[type="date"]::-webkit-calendar-picker-indicator': {
                            filter: theme.palette.mode === "dark" ? "invert(1)" : "invert(0)",
                        },
                        '& input[type="time"]::-webkit-calendar-picker-indicator': {
                            filter: theme.palette.mode === "dark" ? "invert(1)" : "invert(0)",
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
                        direction: direction ? "rtl" : "ltr",
                    },
                }}
                sx={{
                    width: width ? width : 250,
                    "@media (max-width: 360px)": {
                        width: 220,
                    },
                    "& .MuiInputBase-root": {
                        "& textarea": {
                            "&::-webkit-scrollbar": {
                                width: "6px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(255, 255, 255, 0.2)"
                                        : "rgba(0, 0, 0, 0.2)",
                                borderRadius: "3px",
                                cursor: "pointer",
                            },
                            "&::-webkit-scrollbar-track": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(255, 255, 255, 0.1)"
                                        : "rgba(0, 0, 0, 0.1)",
                            },
                        },
                    },
                    "& .MuiInputLabel-root": {
                        fontSize: "14px",
                        transform: "translate(10px, 5px) scale(0.9)",
                        color: "inherit",
                    },
                    "& .MuiInputLabel-shrink": {
                        transform: "translate(14px, -9px) scale(0.75)",
                    },
                    "& .MuiInputBase-input": {
                        fontSize: "0.75rem",
                        color: "inherit",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "currentColor",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "currentColor",
                    },
                    "& .MuiFormLabel-root.Mui-focused": {
                        color: "inherit",
                    },
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: `${"#ddd"}`,
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
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
                PaperProps={{
                    sx: {
                        width: width ? Math.min(width, 300) : 400,
                        maxWidth: "90vw",
                    }
                }}
            >
                <Box sx={{ p: 2 }}>
                    {/* Action Buttons */}
                    <Box sx={{
                        display: "flex",
                        justifyContent: "end",
                        mb: 2,
                        gap: 1
                    }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleOk}
                            sx={{ flex: 1, fontSize: "10px" }}
                        >
                            OK
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            onClick={handleClose}
                            sx={{ flex: 1, fontSize: "10px" }}
                        >
                            Close
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleReset}
                            sx={{ flex: 1, fontSize: "10px" }}
                        >
                            Reset
                        </Button>
                    </Box>

                    {/* Search and List Section */}
                    <Box sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                    }}>
                        <UserInputField
                            label="Search"
                            disabled={false}
                            value={search}
                            setValue={setSearch}
                            type="text"
                            name={"search"}
                            width={"100%"}
                        />

                        {/* Select All row */}
                        {formula.length > 0 && (
                            <Box sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 0.5,
                                mb: 0.5
                            }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={handleSelectAll}
                                            size="small"
                                            sx={{
                                                "& .MuiSvgIcon-root": { fontSize: 16 },
                                                p: 0,
                                                mr: 1
                                            }}
                                        />
                                    }
                                    label={
                                        <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 500 }}>
                                            Select All
                                        </Typography>
                                    }
                                    sx={{ m: 0 }}
                                />
                                {selectedCountInFormula > 0 && (
                                    <Typography variant="caption" sx={{
                                        color: "primary.main",
                                        fontWeight: "bold",
                                        fontSize: "0.7rem"
                                    }}>
                                        {selectedCountInFormula} / {formula.length} selected
                                    </Typography>
                                )}
                            </Box>
                        )}

                        <Box
                            sx={{
                                display: "flex",
                                borderRadius: 1,
                                flexDirection: "column",
                                maxHeight: "300px",
                                overflow: "auto",
                                boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
                                scrollbarWidth: "thin",
                                backgroundColor: secondaryColor,
                            }}
                        >
                            <Paper
                                sx={{
                                    width: "100%",
                                    height: 250,
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
                                        sortedItems.map((values) => {
                                            const isSelected = selectedIds.includes(values?.Id);
                                            return (
                                                <ListItemButton
                                                    role="listitem"
                                                    key={values?.Id}
                                                    tabIndex={-1}
                                                    sx={{
                                                        backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                                        '&:hover': {
                                                            backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                                        }
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            width: "auto",
                                                        }}
                                                        onKeyDown={(event) => handleKeyDown(event, values)}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={(e) => handleTempOutLet(e, values)}
                                                            inputProps={{ "aria-label": "controlled" }}
                                                            sx={{
                                                                p: 0,
                                                                "& .MuiSvgIcon-root": {
                                                                    fontSize: 16,
                                                                },
                                                            }}
                                                            color="default"
                                                        />
                                                        <ListItemText
                                                            sx={{
                                                                paddingLeft: 0.5,
                                                                "& .MuiTypography-root": {
                                                                    fontSize: "0.6rem",
                                                                    fontWeight: isSelected ? "bold" : "normal",
                                                                    color: isSelected ? "primary.main" : "inherit",
                                                                },
                                                            }}
                                                            id={`transfer-list-item-${values?.Name}-label`}
                                                            primary={values?.Name || "No Name"}
                                                        />
                                                    </Box>
                                                </ListItemButton>
                                            );
                                        })
                                    ) : (
                                        <Box sx={{ width: "100%", textAlign: "center", my: 4 }}>
                                            <Typography sx={{ fontSize: 12 }}> {name} not found</Typography>
                                        </Box>
                                    )}
                                </List>
                            </Paper>
                        </Box>
                    </Box>
                </Box>
            </Popover>
        </>
    );
}