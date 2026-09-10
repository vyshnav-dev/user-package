import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { profileDateFields,rowsPerSheet } from '../../config/config';
import { convertTo12Hour, convertUtcToLocalTimeStdFormate } from '../../config/functions';

const ExcelExport = async ({ reportName, filteredRows, excludedFields, parameter }) => {

  const utcOffset = localStorage.getItem("utcOffset") || "+00:00";
  const EnableDate = localStorage.getItem("EnableDate") || 0;

  const reportDateFieldsArray = profileDateFields
    .split(",")
    .map((field) => field.trim());
 

  

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

  //for local time in dd-mm-yyyy format
  const formatDate = (dateString) => {

    if (!dateString) return ""; // Return an empty string for null or undefined values
    const date = new Date(dateString);
    if (isNaN(date)) return dateString; // If date is invalid, return the original string

    // Convert to local time
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    const day = String(localDate.getDate()).padStart(2, "0");
    const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = localDate.getFullYear();

    return `${day}-${month}-${year}`;
  };

  function columnIndexToLetter(columnIndex) {
    let columnLetter = '';
    while (columnIndex > 0) {
      let remainder = (columnIndex - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      columnIndex = parseInt((columnIndex - remainder) / 26, 10);
    }
    return columnLetter;
  }

  let sheet = null;
  let currentRowCount = 0;
  let sheetNumber = 0; // To increment sheet names if necessary

  // Create a new ExcelJS workbook
  const workbook = new ExcelJS.Workbook();



  // Add a sheet for the data
  const createNewSheet = () => {
    sheetNumber++;
    sheet = workbook.addWorksheet(`${reportName} - ${sheetNumber}`);
    currentRowCount = 0; // Reset row count for the new sheet

    // Create headers with formatted labels
    const rawHeaders = Object.keys(filteredRows[0] || {}).filter(
      (header) => !excludedFields.includes(header)
    );

    // Convert keys to readable labels
    const headers = rawHeaders.map((key) => {
      const label =
        key.charAt(0).toUpperCase() +
        key
          .slice(1)
          .replace(/([a-z])([A-Z])/g, "$1 $2")      // insert space between lower & upper
          .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2") // handle consecutive caps
          .trim();

      return { id: key, label };
    });

    // Set column widths
    headers.forEach((h, index) => {
      sheet.getColumn(index + 1).width = 20;
    });

    const lastColumnLetter = columnIndexToLetter(headers.length);
    // Add the first two rows as in the image
    sheet.addRow([reportName]);
    sheet.mergeCells(`A1:${lastColumnLetter}1`); // Merge cells for the title row
    sheet.getCell('A1').font = { size: 18, bold: true }; // Style the title row
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    if (parameter) {
      sheet.addRow([`From: ${formatDate(parameter.FromDate)}   To: ${formatDate(parameter.ToDate)}`]);
      sheet.mergeCells(`A2:${lastColumnLetter}2`);
      sheet.getCell('A2').font = { size: 12, bold: true };


      currentRowCount += 1; // Count both the parameter and header rows
    }
    // Style the headers
    const headerRow = sheet.addRow(headers.map(h => h.label));
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });
    currentRowCount++;
  };

  createNewSheet();

  // Add the data
  filteredRows.forEach((row) => {
    if (currentRowCount > rowsPerSheet) {
      createNewSheet();
    }
    const rowData = Object.keys(filteredRows[0])
      .filter(header => !excludedFields.includes(header))
      .map((header) => {
        if (reportDateFieldsArray.includes(header)) {
          return convertToLocaleDateString(row[header]);
        } 
        else {
          return row[header] != null ? row[header] : "";
        }
      }) || '';
    sheet.addRow(rowData);
    currentRowCount++;
  });

  // Write to a buffer and then save using FileSaver
  const formatDateTimeForFilename = () => {
    const now = new Date();
    let day = '' + now.getDate();
    let month = '' + (now.getMonth() + 1);
    const year = now.getFullYear();
    let hours = '' + now.getHours();
    let minutes = '' + now.getMinutes();
    let seconds = '' + now.getSeconds();

    if (day.length < 2) day = '0' + day;
    if (month.length < 2) month = '0' + month;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    if (seconds.length < 2) seconds = '0' + seconds;

    return [day, month, year].join('-') + '_' + [hours, minutes, seconds].join('-');
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const dateTimeStringForFilename = formatDateTimeForFilename();
  saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${reportName}_${dateTimeStringForFilename}.xlsx`);
};

export default ExcelExport;
