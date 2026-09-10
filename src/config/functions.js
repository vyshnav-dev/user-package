export const validateName = (name) => {
  // 1. Check if name is not empty
  if (!name || name.trim().length === 0) {
    return "Name field cannot be empty.";
  }

  // 2. Check character limits (1 to 100 characters)
  if (name.length < 1 || name.length > 100) {
    return "Name must be between 1 and 100 characters.";
  }

  // 3. Ensure the name does not contain only special characters or underscores
  const onlySpecialCharactersRegex = /^[^a-zA-Z0-9]+$/;
  if (onlySpecialCharactersRegex.test(name)) {
    return "Name cannot contain only special characters, underscores, or symbols.";
  }

  // 4. Ensure the name includes valid characters
  const validCharactersRegex = /^[a-zA-Z0-9 _\-@#$%^&*(),!?'"`:;\[\]{}<>+=|\\/~£€¥₹%°±÷×^√∞≠\.]+$/;
  if (!validCharactersRegex.test(name)) {
    return "Name can include letters, numbers, spaces, underscores, apostrophes, dots, commas, colons, semicolons, programming symbols, brackets, currency symbols, mathematical symbols, and punctuation marks.";
  }

  // 5. Ensure special characters, symbols, or underscores are used with alphabets or numbers
  const hasAlphabetsOrNumbers = /[a-zA-Z0-9]/.test(name);
  if (!hasAlphabetsOrNumbers) {
    return "Special characters, symbols, underscores, or punctuation must be combined with alphabets or numbers.";
  }

  // 6. Check for consecutive spaces
  if (/ {2,}/.test(name)) {
    return "Name cannot contain consecutive spaces.";
  }

  // If all conditions are met
  return null;
};


export const validateCode = (code) => {
  // 1. Check if name is not empty
  if (!code || code.trim().length === 0) {
    return "Code field cannot be empty.";
  }

  // 2. Check character limits (1 to 100 characters)
  if (code.length < 1 || code.length > 100) {
    return "Code must be between 1 and 100 characters.";
  }

  // 3. Ensure the name does not contain only special characters or underscores
  const onlySpecialCharactersRegex = /^[^a-zA-Z0-9]+$/;
  if (onlySpecialCharactersRegex.test(code)) {
    return "Code cannot contain only special characters, underscores, or symbols.";
  }

  // 4. Ensure the name includes valid characters
  const validCharactersRegex = /^[a-zA-Z0-9 _\-@#$%^&*(),!?'"`:;\[\]{}<>+=|\\/~£€¥₹%°±÷×^√∞≠\.]+$/;
  if (!validCharactersRegex.test(code)) {
    return "Code can include letters, numbers, spaces, underscores, apostrophes, dots, commas, colons, semicolons, programming symbols, brackets, currency symbols, mathematical symbols, and punctuation marks.";
  }

  // 5. Ensure special characters, symbols, or underscores are used with alphabets or numbers
  const hasAlphabetsOrNumbers = /[a-zA-Z0-9]/.test(code);
  if (!hasAlphabetsOrNumbers) {
    return "Special characters, symbols, underscores, or punctuation must be combined with alphabets or numbers.";
  }

  // 6. Check for consecutive spaces
  if (/ {2,}/.test(code)) {
    return "Code cannot contain consecutive spaces.";
  }

  // If all conditions are met
  return null;
};

export const hasDuplicateSerialNo = (data) => {
  const productSerialMap = new Map();

  for (const item of data) {
    const { productId, SerialNo } = item;

    if (!productSerialMap.has(productId)) {
      productSerialMap.set(productId, new Set());
    }

    const serialSet = productSerialMap.get(productId);

    if (serialSet.has(SerialNo)) {
      return true; // Duplicate SerialNo found for the same productId
    }

    serialSet.add(SerialNo);
  }

  return false;
};

export const convertToLocaleDateString = (dateString) => {
  if (!dateString) return ""; // Handle null or undefined values

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original string if the date is invalid

  // Extract components in local time
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

export const convertTo12Hour = (time) => {
  if (!time || typeof time !== "string" || !time.includes(":")) {
    return "";
  }

  const parts = time.split(":");
  if (parts.length < 2) return "";

  let hours = Number(parts[0]);
  let minutes = Number(parts[1]);

  if (isNaN(hours) || isNaN(minutes)) return "";

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}


export const timeToMinutes = (time) => {
  if (!time) return 0;

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");

  return `${hh}:${mm}`;
}

export const isValidDate = (dateString) => {
  if (!dateString) return false;

  const [year, month, day] = dateString.split("-").map(Number);

  // Year, month, day basic validation
  if (year < 1900 || year > 2100) return false;   // <-- FIX
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const tempDate = new Date(year, month - 1, day);

  return (
    tempDate.getFullYear() === year &&
    tempDate.getMonth() === (month - 1) &&
    tempDate.getDate() === day
  );
};

export const utcToLocalTime = (utcTimeStr) => {
  if (!utcTimeStr || !utcTimeStr.includes(':')) return '';
  const [hours, minutes] = utcTimeStr.split(':').map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`;
};

export const BaseUnit = (qty, conversionFactor) => {
  const factor = conversionFactor ?? 1;
  return factor > 0 ? qty * Math.abs(factor) : qty / Math.abs(factor);

}

export const DisplayUnit = (qty, conversionFactor) => {
  const factor = conversionFactor ?? 1;
  return factor > 0 ? qty / Math.abs(factor) : qty * Math.abs(factor);

}


export const convertUtcToLocalTime = (utcTimeStr, offsetStr) => {
  if (!utcTimeStr || !offsetStr || utcTimeStr == null ) return null;

  const utcDate = new Date(utcTimeStr.endsWith('Z') ? utcTimeStr : utcTimeStr + 'Z');
  if (isNaN(utcDate)) return null;

  const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, sign, hh, mm] = match;

  const offsetMinutes =
    (sign === '+' ? 1 : -1) * (Number(hh) * 60 + Number(mm));

  const localDate = new Date(utcDate.getTime() + offsetMinutes * 60000);

  return localDate.toISOString().slice(0, 19);
};

export const convertToUTC = (localTimeStr, offsetStr) => {
  if (!localTimeStr || !offsetStr || localTimeStr == null) return null;

  // Treat the local time as if it were UTC (append 'Z')
  const localAsUtc = new Date(localTimeStr.endsWith('Z') ? localTimeStr : localTimeStr + 'Z');
  if (isNaN(localAsUtc)) return null;

  // Parse offset like "+05:30" or "-04:00"
  const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, sign, hh, mm] = match;
  const offsetMinutes = (sign === '+' ? 1 : -1) * (Number(hh) * 60 + Number(mm));

  // Subtract offset to get UTC time
  const utcDate = new Date(localAsUtc.getTime() - offsetMinutes * 60000);

  return utcDate.toISOString().slice(0, 19);
}

export const formatToLocal12Hour = (localIsoString, val = 0) => {
  if(localIsoString == null) return null
  const date = new Date(localIsoString);
  if (isNaN(date)) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, '0');
  if (val == 1) {
    return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  } else {
    return ` ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  }

};

export const convertUtcToLocalTimeStdFormate = (utcTimeStr, offsetStr, val = 0) => {
  const localIso = convertUtcToLocalTime(utcTimeStr, offsetStr);
  return localIso ? formatToLocal12Hour(localIso, val) : null;
}

export const formatTimestampWithAmPm = (timestamp) => {
  if (!timestamp || timestamp === null) return "";
  const date = new Date(timestamp);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  // Convert to 12‑hour format (0 → 12, 13→1, …)
  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
}
