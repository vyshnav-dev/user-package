import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { rowsPerSheet } from '../../config/config';

// ========== Date formatting helpers (mirroring the component) ==========
const convertToLocaleDateString1 = (dateString) => { // dd-mm-yyyy
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const convertToLocaleDateString2 = (dateString) => { // yyyy-mm-dd
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

const convertToLocaleDateString4 = (dateString) => { // mm-dd-yyyy
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
};

// Fallback date format (dd-mm-yyyy) – can be replaced with your existing convertToLocalDDMMYYYY
const convertToLocalDDMMYYYY = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// ========== Main export function ==========
const TagsExcelExport = async ({ reportName, filteredRows, excludedFields = [], columnObj = [] }) => {
  
  
  // Helper to convert column index to Excel letter (e.g., 1→A, 27→AA)
  function columnIndexToLetter(columnIndex) {
    let columnLetter = '';
    while (columnIndex > 0) {
      let remainder = (columnIndex - 1) % 26;
      columnLetter = String.fromCharCode(65 + remainder) + columnLetter;
      columnIndex = parseInt((columnIndex - remainder) / 26, 10);
    }
    return columnLetter;
  }

  // Helper to format a single value based on column definition
  const formatCellValue = (value, column) => {
    if (value === null || value === undefined || value == "") {
      return column.DefaultValue ?? '';
    }

    const dataType = column.DataType?.toLowerCase() || '';
    const format = column.Format || '';

    switch (dataType) {
      case 'boolean':
        return typeof value === 'boolean' ? value.toString() : (column.DefaultValue?.toString() || '');

      case 'numeric': {
        let numericValue = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(numericValue)) numericValue = column.DefaultValue ?? 0;
        if (format) {
          const userLocale = navigator.language || 'en-US';
          const fractionalPart = format.split('.')[1] || '';
          const fractionDigits = fractionalPart.length;
          return new Intl.NumberFormat(userLocale, {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
          }).format(numericValue);
        }
        return numericValue;
      }

      case 'tiny integer':
      case 'small integer':
      case 'big integer':
      case 'integer': {
        let intValue = typeof value === 'number' ? value : parseInt(value, 10);
        if (isNaN(intValue)) intValue = column.DefaultValue ?? 0;
        // Always show integers with 0 fraction digits
        const userLocale = navigator.language || 'en-US';
        return new Intl.NumberFormat(userLocale, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(intValue);
      }

      case 'date': {
        if (!value) return column.DefaultValue || '';
        // Determine format from column.Format
        const fmt = format.toLowerCase();
        if (fmt === 'dd-mm-yyyy') return convertToLocaleDateString1(value);
        if (fmt === 'yyyy-mm-dd') return convertToLocaleDateString2(value);
        if (fmt === 'mm-dd-yyyy') return convertToLocaleDateString4(value);
        // Fallback to default dd-mm-yyyy (or your own convertToLocalDDMMYYYY)
        return convertToLocalDDMMYYYY(value);
      }

      default:
        return value; // plain text
    }
  };

  // Determine which columns to export: visible and not excluded
  let exportColumns = [];
  if (columnObj && Array.isArray(columnObj) && columnObj.length > 0) {
    // Use column definitions
    exportColumns = columnObj
      .filter(col => col.Visible !== false && !excludedFields.includes(col.Name))
      .sort((a, b) => (a.Order || 0) - (b.Order || 0));
  } else {
    // Fallback: use all keys from the first row, excluding excludedFields
    if (filteredRows.length === 0) return;
    const headers = Object.keys(filteredRows[0]).filter(h => !excludedFields.includes(h));
    exportColumns = headers.map(name => ({ Name: name, DataType: 'Text', Format: '' }));
  }

  let sheet = null;
  let currentRowCount = 0;
  let sheetNumber = 0;
  const workbook = new ExcelJS.Workbook();

  const createNewSheet = () => {
    sheetNumber++;
    sheet = workbook.addWorksheet(`${reportName} - ${sheetNumber}`);
    currentRowCount = 0;

    // Set column widths and prepare header row
    const headers = exportColumns.map(col => col.Caption || col.Name);
    headers.forEach((_, index) => {
      sheet.getColumn(index + 1).width = 20;
    });
    const lastColumnLetter = columnIndexToLetter(headers.length);

    // Title row
    sheet.addRow([reportName]);
    sheet.mergeCells(`A1:${lastColumnLetter}1`);
    sheet.getCell('A1').font = { size: 18, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'left' };

    // Header row
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });
    currentRowCount++; // count the header row
  };

  createNewSheet();

  // Add data rows
  filteredRows.forEach((row) => {
    if (currentRowCount >= rowsPerSheet) {
      createNewSheet();
    }

    const rowData = exportColumns.map(col => {
      const rawValue = row[col.Name];
      return formatCellValue(rawValue, col);
    });

    sheet.addRow(rowData);
    currentRowCount++;
  });

  // Save file
  const formatDateTimeForFilename = () => {
    const now = new Date();
    let day = String(now.getDate()).padStart(2, '0');
    let month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const dateTimeString = formatDateTimeForFilename();
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${reportName}_${dateTimeString}.xlsx`
  );
};

export default TagsExcelExport;