import * as React from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Typography,
  TextField,
  useTheme,
  Tooltip,
} from "@mui/material";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import Pagination from "@mui/material/Pagination";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  backgroundColor,
  primaryColor,
  profileDateFields,
  rowEvenColor,
  secondaryColor,
  selectedColor,
  thirdColor,
  transactionDateTimeFields
} from "../../config/config";
import AttachmentIcon from "@mui/icons-material/Attachment";
import TableButton from "../Buttons/TableButton";
import ImagePreview from "../ImagePreview/ImagePreview";
import NormalButton from "../Buttons/NormalButton";
import AutoSelectNoHeader from "../AutoComplete/AutoSelectNoHeader";

const iconsExtraSx = {
  fontSize: "0.8rem",
  padding: "0.5rem",
  "&:hover": {
    backgroundColor: "transparent",
  },
  marginRight: 1,
};
const StatusMenu = [{ "Id": 2, "Name": "Completed" }]

export default function SummaryTable(props) {
  const {
    rows,
    totalPages,
    hardRefresh,
    IdName,
    handleLongPressStart,
    handleLongPressEnd,
    handleParentGroup,
    parentList,
    selectConvertRow,
    IsSignature = false,
    IsAttachments = false,
    totalRows,
    onStatusIconClick, // New callback function for status icon click
    StatusDropdown,
    statusDetails,
    setstatusDetails,
    UpdateStatus,
    userAction,
    handleConvert,
    screenId

  } = props;
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredRows, setFilteredRows] = React.useState([]);
  const [columns, setColumns] = React.useState([]);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [previewItems, setPreviewItems] = React.useState([]);
  const [previewInitialIndex, setPreviewInitialIndex] = React.useState(0);


  const excludedFields = [IdName, "Group", "GroupId", "TotalRows", "IsConverted", "iOutlet", "Signature", "Attachments", "Salesman_Id"];

  const isConvert = userAction?.some((action) => action.Action_Name == "Convert")



  // Helper function to format numbers
  const formatValue = (value) => {
    if (value === null || value === undefined) return ""; // Handle null or undefined values
    if (typeof value === "boolean") {
      return value ? "True" : "False"; // Convert boolean values to readable format
    }
    if (typeof value === "number") {
      const decimalPlaces = value.toString().split(".")[1]?.length ;
      // Check if the value is a number
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value);
    }
    return value; // Return the value as-is if not a number
  };

  const profileDateFieldsArray = profileDateFields
    .split(",")
    .map((field) => field.trim());
  // Create an array for date-time fields
  const transactionDateTimeFieldsArray = transactionDateTimeFields
    .split(",")
    .map((field) => field.trim());
  //To apply some filters on table rows
  const initialColumns =
    rows && rows.length > 0
      ? Object.keys(rows[0])
        .filter((key) => !excludedFields.includes(key))
        .map((key) => ({
          id: key,
          label:
            key.charAt(0).toUpperCase() +
            key
              .slice(1)
              .replace(/([a-z])([A-Z])/g, "$1 $2") // Only add space between lowercase and uppercase
              .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // Handle acronyms followed by lowercase
              .trim(),
          minWidth: 100, // Set default minWidth for all columns
          maxWidth: 200,
        }))
      : [];
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [rows]);

  //To expand column on mouse dragging
  const handleResize = (index, event) => {
    const startWidth = columns[index].minWidth;
    const startX = event.clientX;

    const handleMouseMove = (e) => {
      const currentX = e.clientX;
      const newWidth = Math.max(50, startWidth + (currentX - startX));
      setColumns((cols) =>
        cols.map((col, i) =>
          i === index ? { ...col, minWidth: newWidth, maxWidth: newWidth } : col
        )
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  //To expand double Clicked column
  const handleDoubleClick = (index) => {
    setColumns((cols) =>
      cols.map((col, i) =>
        i === index ? { ...col, maxWidth: col.maxWidth ? null : 200 } : col
      )
    );
  };
  // To reduce all columns width
  const handleFitContent = () => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        maxWidth: 100,
        minWidth: 100,
      }))
    );
  };

  //To expand all columns
  const handleExpandAll = () => {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        maxWidth: null,
        minWidth: 150,
      }))
    );
  };

  //To Search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
    props.onpageNumberChange(1);
    props.onSearchKeyChange(event.target.value);
  };

  const handleClick = (event, row) => {
    if (!row[IdName]) {
      return
    }
    const selectedIndex = selected.indexOf(row[IdName]);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, row[IdName]); // Add the entire row object
    } else {
      newSelected = [
        ...selected.slice(0, selectedIndex),
        ...selected.slice(selectedIndex + 1),
      ];
    }

    setSelected(newSelected);
  };

  // Handle status icon click
  const handleStatusIconClick = (event, row) => {
    event.stopPropagation(); // Prevent row selection when clicking the icon
    if (onStatusIconClick) {
      onStatusIconClick(row); // Pass the entire row to the callback
    }
  };

  //To change page //remove event if Nan comes in pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    props.onpageNumberChange(newPage + 1);
  };

  //To change rows per page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value));
    setPage(0);
    props.onpageNumberChange(1);
    props.onDisplayLengthChange(parseInt(event.target.value));
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  React.useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);

  React.useEffect(() => {
    setPage(0); // Reset page to 0
    props.onpageNumberChange(1); // Call the callback function with 0 if needed
    props.setchangesTriggered(false);
    setSelected([]);
    setSearchTerm("")
  }, [props.changesTriggered]);


  React.useEffect(() => {
    props.onSelectedRowsChange(selected);
  }, [selected]);

  //To convert date and time to dd/mm/yyyy format
  const convertToLocaleDateString = (dateString) => {
    if (!dateString) return ""; // Return an empty string for null or undefined values
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // If date is invalid, return the original string

    // Convert to local time
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );

    const day = String(localDate.getDate()).padStart(2, "0");
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = localDate.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Helper function to convert date-time strings (dd-mm-yyyy hh:mm:ss)
  const convertToLocaleDateTimeString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const day = String(localDateTime.getDate()).padStart(2, "0");
    const month = String(localDateTime.getMonth() + 1).padStart(2, "0");
    const year = localDateTime.getFullYear();
    const hours = String(localDateTime.getHours()).padStart(2, "0");
    const minutes = String(localDateTime.getMinutes()).padStart(2, "0");
    const seconds = String(localDateTime.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  };

  // Handler to open signature preview
  const handleSignaturePreview = (signatureUrl) => {
    setPreviewItems(signatureUrl ? [{ url: signatureUrl, name: "Signature" }] : []);
    setPreviewInitialIndex(0);
    setImageDialogOpen(true);
  };;

  // Handler to open attachments preview
  const handleAttachmentsPreview = (attachmentsStr) => {
    if (!attachmentsStr) return;
    const urls = attachmentsStr
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url, i) => ({ url, name: `Attachment ${i + 1}` }));
    setPreviewItems(urls);
    setPreviewInitialIndex(0);
    setImageDialogOpen(true);
  };

  
  


  return (
    <Box
      sx={{
        width: "98%",
        margin: "auto",
        marginTop: "5px",
        boxShadow: 3,
        paddingLeft: "10px",
        paddingRight: "10px",
        paddingBottom: "5px",
        backgroundColor: "#f3f3f3ff"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      ><div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "auto",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "8px",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
          <FormControl>
            <InputLabel
              htmlFor="rows-per-page"
              sx={{
                "&.Mui-focused": {
                  color: "currentColor", // Keeps the current color
                },
              }}
            >
              Show Entries
            </InputLabel>
            <Select
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              label="Rows per page"
              inputProps={{
                name: "rows-per-page",
                id: "rows-per-page",
              }}
              sx={{
                width: "120px",
                height: "30px",
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "currentColor", // Keeps the current border color
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "currentColor", // Optional: Keeps the border color on hover
                },
              }}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
          {StatusDropdown ? <>
            <Box sx={{ mt: -2 }}>
              <AutoSelectNoHeader
                key={"Status"}
                formData={statusDetails}
                setFormData={setstatusDetails}
                autoId={"Status"}
                formDataName={`Status_Name`}
                formDataiId={"Status"}
                required={false}
                label={"Change Status"}
                languageName={"english"}
                ColumnSpan={0}
                disabled={false}
                Menu={StatusMenu}
                width={130}
              />
            </Box>
            <NormalButton action={UpdateStatus} label="Apply" />
          </>
            : null}

        </div>
        <div
          style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}
        >
          <Tooltip title="Refresh">
            <IconButton onClick={hardRefresh} sx={iconsExtraSx}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit Content">
            <IconButton onClick={handleFitContent} sx={iconsExtraSx}>
              <FitScreenIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Expand All">
            <IconButton onClick={handleExpandAll} sx={iconsExtraSx}>
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
          <TextField
            margin="normal"
            size="small"
            id="search"
            label="Search"
            autoComplete="off"
            value={searchTerm}
            onChange={handleSearch}
            sx={{
              width: 200, // Default width
              "@media (max-width: 600px)": {
                width: 150, // Reduced width for small screens
              },
              "& .MuiOutlinedInput-root": {
                height: 30, // Adjust the height of the input area
                "& fieldset": {
                  borderColor: `${primaryColor}`,
                },
                "&:hover fieldset": {
                  borderColor: primaryColor,
                },
                "&.Mui-focused fieldset": {
                  borderColor: primaryColor,
                },
              },
              "& .MuiInputLabel-root": {
                transform: "translate(10px, 5px) scale(0.9)", // Adjust label position when not focused
                color: primaryColor,
                "&.Mui-focused,&.MuiInputLabel-shrink": {
                  transform: "translate(14px, -9px) scale(0.75)", // Adjust label position when focused or shrunken
                },
              },
              "& .MuiInputBase-input": {
                fontSize: "0.75rem", // Adjust the font size of the input text
                color: primaryColor,
              },
              "& .MuiFormLabel-root.Mui-focused": {
                color: primaryColor,
              },
            }}

          />
        </div>
      </div>
      <div
        style={{
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: "100%", // Ensure it respects the container width
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "thin",
        }}
      >
        {parentList?.map((parent, index) => (
          <React.Fragment key={parent.Id}>
            <Typography
              variant="body2"
              onClick={() => handleParentGroup(parent.Id)}
              style={{
                cursor: "pointer",
                // You can style the text
              }}
            >
              {parent.Name}
            </Typography>
            {index < parentList.length - 1 && (
              <ChevronRightIcon fontSize="small" />
            )}
          </React.Fragment>
        ))}
      </div>
      {filteredRows && filteredRows.length > 0 ? (
        <Paper sx={{ width: "100%", mb: 1 }}>
          {/* <EnhancedTableToolbar numSelected={selected.length} /> */}
          {/* <TableContainer sx={{maxHeight:"60vh",overflow:"scroll" }}> */}
          <TableContainer
            sx={{ maxHeight: "58vh", overflow: "auto", scrollbarWidth: "thin" }}
          >
            <Table stickyHeader sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ position: "sticky", top: 0, zIndex: 10 }}>
                  {columns.map((column, index) => (
                    <TableCell
                      key={column.id}

                      sx={{
                        padding: "0px",
                        paddingLeft: "4px",
                        border: `1px solid #ddd`,
                        fontWeight: "600",
                        font: "14px",
                        backgroundColor: thirdColor,
                        color: "white",
                        paddingTop: "3px",
                        paddingBottom: "3px",
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                        position: "relative",
                      }}
                      onDoubleClick={() => handleDoubleClick(index)}
                    >
                      {column.label}
                      <span
                        style={{
                          position: "absolute",
                          height: "100%",
                          right: 0,
                          top: 0,
                          width: "5px",
                          cursor: "col-resize",
                          backgroundColor: "rgba(0,0,0,0.1)",
                        }}
                        onMouseDown={(e) => handleResize(index, e)}
                      />
                    </TableCell>
                  ))}
                  {IsSignature && totalPages > 0 && (

                    <TableCell
                      key="signature-header"
                      sx={{
                        padding: "0px",
                        paddingLeft: "4px",
                        border: `1px solid #ddd`,
                        fontWeight: "600",
                        font: "14px",
                        backgroundColor: secondaryColor,
                        color: "white",
                        paddingTop: "3px",
                        paddingBottom: "3px",
                        minWidth: 120,
                      }}
                    >
                      Signature
                    </TableCell>
                  )}
                  {IsAttachments && totalPages > 0 && (
                    <TableCell
                      key="attachments-header"
                      sx={{
                        padding: "0px",
                        paddingLeft: "4px",
                        border: `1px solid #ddd`,
                        fontWeight: "600",
                        font: "14px",
                        backgroundColor: secondaryColor,
                        color: "white",
                        paddingTop: "3px",
                        paddingBottom: "3px",
                        minWidth: 120,
                      }}
                    >
                      Attachments
                    </TableCell>

                  )}
                  {isConvert && [21, 22].includes(Number(screenId)) && 
                    <TableCell
                      key="Action-header"
                      sx={{
                        padding: "3px 4px",
                        border: "1px solid #ddd",
                        fontWeight: 600,
                        fontSize: "14px",
                        backgroundColor: thirdColor,
                        color: "white",
                        minWidth: 120,
                        textAlign: "center",
                      }}
                    >
                      Action
                    </TableCell>
                  }

                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row, index) => {
                  const isItemSelected = isSelected(row[IdName]);
                  return (
                    <TableRow
                      key={`${row[IdName]}-${index}`}
                      onMouseUp={handleLongPressEnd}
                      onMouseLeave={handleLongPressEnd} // In case the user drags out of the row
                      onTouchStart={(event) => handleLongPressStart(event, row)} // For mobile
                      onTouchEnd={handleLongPressEnd}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      //onDoubleClick={() => props.onRowDoubleClick(row[IdName])}
                      tabIndex={-1}
                      sx={{
                        cursor: "pointer",

                        backgroundColor: isItemSelected
                          ? selectedColor
                          : index % 2 === 1 ? secondaryColor : null,
                      }}
                    >
                      {/* <TableCell sx={{ padding: "0px",textAlign:"center" }}>
                        <Checkbox
                          sx={{ padding: "0px" }}
                          checked={isItemSelected}
                          inputProps={{ "aria-labelledby": labelId }}
                        />
                      </TableCell> */}

                      {columns.map((column) => (
                        <Tooltip
                          title={
                            column.id === "Narration" ? row[column.id] : null
                          }
                          key={column.id}
                        >
                          <TableCell
                            sx={{
                              padding: "0px",
                              paddingLeft: "4px",
                              border: `1px solid #ddd`,
                              minWidth: column.minWidth,
                              maxWidth: column.maxWidth,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              fontWeight: row["Group"] ? 800 : null,
                              textAlign: column.id.toLowerCase() == "status" ? "center" : typeof row[column.id] === "number" ? "right" : "left", // Align numbers to the right
                            }}
                            key={column.id}
                            onDoubleClick={() => props.onRowDoubleClick && props.onRowDoubleClick(row[IdName])}
                            onClick={(event) => handleClick(event, row)}
                          >
                            {profileDateFieldsArray.includes(column.label)
                              ? convertToLocaleDateString(row[column.id])
                              : transactionDateTimeFieldsArray.includes(column.label)
                                ? convertToLocaleDateTimeString(row[column.id])
                                : formatValue(row[column.id])}
                          </TableCell>
                        </Tooltip>
                      ))}
                      {IsSignature && totalPages > 0 && (
                        <TableCell
                          key={`signature-${row[IdName]}`}
                          sx={{
                            padding: "0px",
                            textAlign: "center",
                            border: `1px solid #ddd`,
                            minWidth: "100px",
                          }}
                        >
                          {row.Signature ? (
                            <Tooltip title="View Signature">
                              <img
                                src={row?.Signature ?? ""}
                                alt=""
                                style={{ cursor: 'pointer', width: '20px', height: '20px' }} // Adjust the style as needed
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSignaturePreview(row.Signature);
                                }}
                              />
                            </Tooltip>
                          ) : (
                            ""
                          )}
                        </TableCell>
                      )}
                      {IsAttachments && totalPages > 0 && (

                        <TableCell
                          key={`attachments-${row[IdName]}`}
                          sx={{
                            padding: "0px",
                            textAlign: "center",
                            border: `1px solid #ddd`,
                            minWidth: "100px",
                          }}
                        >
                          {!!row.Attachments ? (
                            <Tooltip title="View Attachments">
                              <IconButton
                                onClick={e => {
                                  e.stopPropagation();
                                  handleAttachmentsPreview(row.Attachments);
                                }}
                                sx={{ color: primaryColor, width: "5px", height: "5px" }}
                              >
                                <AttachmentIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            ""
                          )}
                        </TableCell>
                      )}

                      { isConvert && row?.TransId > 0 && [21, 22].includes(Number(screenId)) && 
                        <TableCell
                          sx={{
                            padding: "0px",
                            paddingLeft: "4px",
                            border: "1px solid #ddd",
                            minWidth: "100px",
                            maxWidth: "auto",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontWeight: row["Group"] ? 800 : null,
                            textAlign: "center",
                          }}
                          style={{ minWidth: "100px" }}
                        >
                          <TableButton disabled={row?.Status == "Draft"  || row?.Status == "Converted" } action={() => handleConvert(row)} label="Convert" />
                        </TableCell>
                      }


                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <>
          <Box sx={{ width: "100%", textAlign: "center", my: 4 }}>
            {/* <Typography>No Data</Typography> */}
          </Box>
        </>
      )}
      {filteredRows && filteredRows.length > 0 && (<>
        <Box
          sx={{
            width: "100%",
            textAlign: "right",
            fontSize: "0.85rem",
            color: "#333",
            mt: 1,
            mb: -1,
            pr: 2,
          }}
        >
          Total Rows: <b>{totalRows || rows?.[0]?.TotalRows || 0}</b>
        </Box>
        <Pagination
          count={rows.length > 0 ? totalPages : 0}
          page={page + 1} // Pagination component is 1-based, but state is 0-based
          onChange={(event, value) => handleChangePage(null, value - 1)}
          variant="outlined"
          shape="rounded"
          showFirstButton
          showLastButton
          ActionsComponent={TablePaginationActions}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "8px 0", // Reduced padding to decrease gap
            "& .MuiPagination-ul": {
              margin: 0,
            },
            "& .MuiPaginationItem-root": {
              height: "24px", // Reduced height of pagination items
              minWidth: "24px", // Adjusted width of pagination items
            },
          }}
        />
      </>
      )}
      <ImagePreview
        open={imageDialogOpen}
        items={previewItems}
        initialIndex={previewInitialIndex}
        onClose={() => {
          setImageDialogOpen(false);
          setPreviewInitialIndex(0);
          setPreviewItems([])
        }}
      />
    </Box>
  );
}
const TablePaginationActions = (props) => {
  const { count, page, rowsPerPage, onPageChange } = props;

  // Calculate the last page index
  const lastPage = Math.ceil(count / rowsPerPage) - 1;

  // Generate page numbers: we want to show 2 pages on each side if possible
  const startPage = Math.max(0, page - 2); // Current page - 2, but not less than 0
  const endPage = Math.min(lastPage, page + 2); // Current page + 2, but not more than last page

  // Create an array of page numbers to be shown
  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, idx) => startPage + idx
  );

  const handlePageButtonClick = (newPage) => {
    onPageChange(newPage);
  };

  return (
    <div style={{ flexShrink: 0, marginLeft: 20 }}>
      {page > 0 && (
        <IconButton onClick={() => handlePageButtonClick(0)}>
          <FirstPageIcon />
        </IconButton>
      )}
      {pages.map((pageNum) => (
        <IconButton
          sx={{
            minWidth: "30px",
            minHeight: "30px",
            padding: "2px",
            margin: "1px",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "50%", // Make the background round
            color: "inherit",
            backgroundColor: pageNum === page ? "grey" : "white",
            "&:hover": {
              backgroundColor: pageNum === page ? "grey" : "lightgrey", // Change hover color
            },
            "&.Mui-disabled": {
              backgroundColor: "white",
            },
            fontSize: "14px",
          }}
          key={pageNum}
          color={pageNum === page ? "primary" : "default"}
          onClick={() => handlePageButtonClick(pageNum)}
          disabled={pageNum > lastPage}
        >
          {pageNum + 1}
        </IconButton>
      ))}
      {page < lastPage && (
        <IconButton onClick={() => handlePageButtonClick(lastPage)}>
          <LastPageIcon />
        </IconButton>
      )}
    </div>
  );
};