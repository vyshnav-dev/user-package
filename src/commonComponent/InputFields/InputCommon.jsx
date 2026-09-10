import { IconButton, InputAdornment, TextField, useTheme } from "@mui/material";
import React from "react";
import { styled } from "@mui/system";
import { useState } from "react";
import { useEffect } from "react";
import ClearIcon from "@mui/icons-material/Clear";
import { validateInput } from "./ValidateInput";
import { useAlert } from "../Alerts/AlertContext";
import { FixedValues } from "../../config/config";

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
const errorMessages = {
  minimumValue: "minimumValue",
  maximumValue: "maximumValue",
  invalidInteger: "invalidInteger",
  invalidNumber: "invalidNumber",
  allowNegative: "allowNegative",
  specialCharacter: "specialCharacter",
  regexFailed: "regexFailed",
  integerRange:"integerRange",
  maxSize:"maxSize"
};

export default function InputCommon({
  key1,
  name,
  label,
  type,
  disabled,
  value,
  setValue,
  width = 250,
  multiline,
  mandatory,
  onBlur,
  maxLength,
  onClick,
  AllowNegative,
  DefaultValue,
  ErrorMessage,
  languageName,
  ColumnSpan = 0,
  RowSpan = 1,
  CharacterCasing,
  RegularExpression,
  MinimumValue,
  MaximumValue,
  dateType,
  DonotAllowSpecialChar,
  tableField=false,
  hardRefresh=false,
  trigger,
  DecimalPoints,
  onKeyDown
}) {



    const { showAlert } = useAlert();
  

  const [inputValue, setInputValue] = useState(value || "");
  const [isBlurred, setIsBlurred] = useState(false);
  const [fieldKey, setFieldKey] = useState(0);

  type = type?.toLowerCase();

    const InputType = {
      numeric: "numeric",
      text: "text",
      tinyinteger:"tiny integer",
      smallinteger:"small integer",
      integer:"integer",
      biginteger:"big integer",
      date:"date",
      time:"time",
      datetime:"datetime",
      geography:"geography",
      boolean:"boolean",
      tag:"tag",
      password:"password"

      // Add other types as needed
    };
  

    useEffect(() => {
      if(hardRefresh){
      setFieldKey(fieldKey + 1);
  
      if(!value){
        setInputValue("")
      }
      else{
        setInputValue(value)
      }
    }
    }, [trigger])
    

  const validateSpecialChars = (val) => {
    if (DonotAllowSpecialChar) {
      if (languageName?.toLowerCase() === "english") {
        const englishRegex = /^[a-zA-Z0-9 ]*$/; // Alphanumeric and space for English
        return englishRegex.test(val);
      } else if (languageName?.toLowerCase() === "arabic") {
        const arabicRegex = /^[\u0621-\u064A0-9 ]*$/; // Arabic characters, digits, and space
        return arabicRegex.test(val);
      }
    }
    return true; // Allow special characters if true
  };

  // Convert RegularExpression string to RegExp object if it's a string
  const regex =
    typeof RegularExpression === "string"
      ? new RegExp(RegularExpression?.replace(/\\\\/g, "\\")) // Replace double backslashes with a single backslash
      : RegularExpression;

      const getMaxFractionDigitsFromRegex = (regexString) => {
        const match = regexString?.match(/\.?\[0-9]{0,(\d+)}/);
        if (match && match[1]) {
          return parseInt(match[1], 10); // Return the number of decimal places
        }
        return 0; // Default to 0 if no decimal places are specified
      };  
      
      useEffect(() => {
        let parentValue = value ?? null;
        if (
          [
            InputType.tinyinteger,InputType.smallinteger, InputType.biginteger, InputType.integer
           
          ].includes(type) &&
          parentValue !== null
        ) {
          let formattedValue = "";
          formattedValue =  parentValue !== null
          ? new Intl.NumberFormat(
            "en-US",
            {
              style: "decimal",
              maximumFractionDigits: 0, // Max 0 decimal for integers, up to 8 for numeric
            }
          ).format(parentValue)
          :""
         
          
          setInputValue(formattedValue); // Set formatted value
        }
        else if(type ==InputType.numeric){
          let formattedValue = "";
          const regexString = RegularExpression?.toString();
          const maxFractionDigits =  RegularExpression ?getMaxFractionDigitsFromRegex(regexString):null;
          const fractionDigits = DecimalPoints ?? maxFractionDigits;  // NEW
          formattedValue = 
          parentValue !== null
          ? new Intl.NumberFormat(
            "en-US",
            {
              style: "decimal",
             minimumFractionDigits: Math.min(FixedValues.MinDisplayDecimals, (fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals)),
             maximumFractionDigits: fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals, // Apply the same logic as minimumFractionDigits
            }
          ).format(parentValue)
          :""
       
          setInputValue(formattedValue);
        } else {
          setInputValue(parentValue); // Set default value if not provided
        }
      }, [value, type, languageName]);
       

  const handleBlurOrMouseLeave = (event) => {
    if(disabled){
      return
    }
    if (event.target && (event.target.tagName === "INPUT"|| event.target.tagName === "TEXTAREA")) {
      let newValue = event?.target?.value || "";

      // Convert to number if type is number
      if (type === InputType.numeric) {
        const errorResponse = validateInput({
          type,
          value: event?.target?.value ??"",
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative, // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar,
     
        });
        let newValue = event?.target?.value.replace(/,/g, "") || "";
        newValue = parseFloat(newValue);
     
       
        
        if (errorResponse == errorMessages.minimumValue) {
          showAlert("info", `Minimum value is ${MinimumValue}`);
          newValue = parseFloat(MinimumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.maximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          newValue = parseFloat(MaximumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.allowNegative) {
          showAlert("info", `Negative value not allowed`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }
        
        if (errorResponse == errorMessages.regexFailed) {
          //showAlert("info", `Regular expresion mismatch`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }
        
        // if (isNaN(newValue)) newValue =null;
        if (isNaN(newValue) || newValue === "") newValue = null;

        const regexString = RegularExpression?.toString();
        const maxFractionDigits =  RegularExpression ?getMaxFractionDigitsFromRegex(regexString):null;
        const fractionDigits = DecimalPoints ?? maxFractionDigits;  // NEW
        setValue({ name, value: newValue??0 });
        const formattedValue =
          newValue !== null
            ? new Intl.NumberFormat(
                "en-US",
                {
                  style: "decimal",
                  minimumFractionDigits: Math.min(FixedValues.MinDisplayDecimals, (fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals)),
                  maximumFractionDigits: fractionDigits > 0 ? fractionDigits : FixedValues.DisplayDecimals, // Apply the same logic as minimumFractionDigits
                  
                }
              ).format(newValue)
            : "";
         
             
        setInputValue(formattedValue?.toString());
      
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
        return;
      }
      // Convert to integer if field type is integer
      if ([InputType.tinyinteger,InputType.smallinteger, InputType.integer].includes(type)) {
        const errorResponse = validateInput({
          type,
          value: event?.target?.value ??"",
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative, // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar,
     
        });
        let newValue = event?.target?.value.replace(/,/g, "") || "";
        newValue = parseInt(newValue, 10);

        if (errorResponse == errorMessages.minimumValue) {
          showAlert("info", `Minimum value is : ${MinimumValue}`);
          newValue = parseInt(MinimumValue, 10);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.maximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          newValue = parseFloat(MaximumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.allowNegative) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.integerRange) {
          showAlert(
            "info",
            `Value should be with in [${minValue},${maxValue}]`
          );
          newValue = "";
        }
        // if (isNaN(newValue)) newValue = null; // Reset if not a valid number
        if (isNaN(newValue) || newValue === "") newValue = null;

        setValue({ name, value: newValue??0 });
        // Reformat with `Intl.NumberFormat`
        const formattedValue =
          newValue !== null
            ? new Intl.NumberFormat(
                "en-US",
                {
                  style: "decimal",
                  maximumFractionDigits: 0,
                }
              ).format(newValue)
            : "";
        setInputValue(formattedValue);
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
        return;
      }
      if (type ===  InputType.biginteger ) {
        
        let newValue = event?.target?.value || "";
        const errorResponse = validateInput({
          type,
          value:newValue,
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative, // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar,
     
        });

      if(newValue){
  
        // Remove commas and ensure valid negative number formatting
        newValue = newValue.replace(/,/g, "");

              // Check if the value is a negative number or not
        const isNegative = newValue.startsWith("-");
        if (isNegative) {
          newValue = "-" + newValue.replace(/-/g, ""); // Retain only the first `-` sign
        }
        try {
       
          
        newValue = BigInt(newValue);
   
        if (errorResponse == errorMessages.minimumValue) {
          showAlert("info", `Minimum value is : ${MinimumValue}`);
          newValue = BigInt(MinimumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.maximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          newValue = BigInt(MaximumValue);
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.allowNegative) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
          // return;  // Prevent updating the value when less than MinimumValue
        }
        if (errorResponse == errorMessages.integerRange) {
          showAlert(
            "info",
            `Value should be with in [${minValue},${maxValue}]`
          );
          newValue = "";
        }
        newValue = Number(newValue)
      
        // if (isNaN(newValue)) newValue = null; // Reset if not a valid number
        if (newValue === "") newValue = null;

        setValue({ name, value: newValue??0 });
        newValue = newValue?.toString();

        // Reformat with `Intl.NumberFormat`
        const formattedValue =
          newValue !== null
            ? new Intl.NumberFormat(
                "en-US",
                {
                  style: "decimal",
                  maximumFractionDigits: 0,
                }
              ).format(newValue)
            : "";
        setInputValue(formattedValue);
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
      }
      catch{
        setValue({ name, value: 0 });
        setInputValue(null);
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
      }
      
      }
      else{
        setValue({ name, value: 0 });
        setInputValue(null);
        setFieldKey(fieldKey + 1);
        if (onBlur && !disabled && !isBlurred) {
          onBlur(newValue); // Call the onBlur prop function
          setIsBlurred(true); // Set blurred state to true
        }
      }
      return
        
      }
      if (type ===  InputType.text) {
        const errorResponse = validateInput({
          type,
          value: event?.target?.value ??"",
          minimumValue: MinimumValue,
          maximumValue: MaximumValue,
          allowNegative: AllowNegative, // or false based on your requirement
          regularExpression: RegularExpression,
          donotAllowSpecialChar: DonotAllowSpecialChar,
          maxSize:maxLength,
          languageName:languageName?.toLowerCase()
     
        });
        if (errorResponse == errorMessages.specialCharacter) {
          showAlert("info", `special characters not allowed`);
          newValue = ""; // Reset value if invalid
        }
        if (errorResponse == errorMessages.maxSize) {
          newValue = newValue.substring(0, maxLength); // Truncate to max length
          showAlert("info", `maximum length reached`);
        }
        // Regular expression validation for text fields
        if (RegularExpression) {
          
          if (errorResponse == errorMessages.regexFailed) {
            //showAlert("info", `regular expression mismatch`);
            newValue = "";
            // return;  // Prevent updating the value when less than MinimumValue
          }
        }
      }

     
      if (type ==  InputType.date) {
        newValue = newValue ? newValue : null; // Default to today's date
      }
      if (type ==  InputType.time) {
        newValue = newValue ? newValue : null; // Default to today's date
      }
      if (type ==  InputType.datetime) {
        newValue = newValue ? newValue : null; // Default to today's date
      }
 
      setValue({ name, value: newValue??"" });
      setInputValue(newValue);
      setFieldKey(fieldKey + 1);
      if (onBlur && !disabled && !isBlurred) {
        onBlur(newValue); // Call the onBlur prop function
        setIsBlurred(true); // Set blurred state to true
      }
    }
  };

  const getIntegerRange = (type, isSigned) => {
    switch (type.toLowerCase()) {
      case InputType.tinyinteger:
        return [-128, 127]; // 8-bit signed range
      case InputType.smallinteger:
        return [-32768, 32767]; // 16-bit signed range (Int16)
      case InputType.integer:
        return [-2147483648, 2147483647]; // 32-bit signed range (Int32)
      case InputType.biginteger:
        return [-9223372036854775808n, 9223372036854775807n]; // 64-bit signed range (Int64)
      default:
        return [null, null]; // No range for unrecognized types
    }
  };

  const handleChange = (event) => {
    if (disabled) {
      return;
    }
    setIsBlurred(false);
    if (event.target && (event.target.tagName === "INPUT"|| event.target.tagName === "TEXTAREA")) {
      let newValue = event.target.value || null;

      // Apply character casing based on CharacterCasing prop
      if (type == InputType.text && newValue) {
        if (CharacterCasing === 1) {
          newValue = newValue.toUpperCase(); // Convert to uppercase
        } else if (CharacterCasing === 2) {
          newValue = newValue.toLowerCase(); // Convert to lowercase
        }
        if (!validateSpecialChars(newValue)) {
          showAlert("info", `special characters not allowed`);
          return;
        }
        // Enforce maxLength here
        if (maxLength && newValue.length > maxLength) {
          newValue = newValue.substring(0, maxLength); // Truncate to max length
          showAlert("info", `maximum length reached`);
        }
      }

      // Allow only integers if field type is integer
      // if (['tiny integer','small integer', 'big integer', 'integer'].includes(type) && newValue && !AllowNegative && newValue < 0) {
      //   showAlert('info', 'Negative values are not allowed');
      //   newValue = 0;
      // }
      if (
        [InputType.tinyinteger,InputType.smallinteger, InputType.integer].includes(type) &&
        newValue
      ) {
        newValue = newValue.replace(/,/g, "");

        if (!AllowNegative && parseInt(newValue,10) < 0) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
        }
        // Allow only numbers and decimal points
        if (!/^[+-]?\d*\.?\d*$/.test(newValue)) {
          return; // Reject non-numeric characters
        }

              // Handle the edge case where newValue is just a minus sign "-"
        if (newValue === "-" || newValue === "") {
          setInputValue(newValue); // Let user continue typing for negative numbers
          return;
        }
        // Parse the value as an integer
        let parsedValue = parseInt(newValue, 10);
        if (isNaN(parsedValue)) {
          showAlert("info", `Invalid integer`);
          return;
        }

        // Get the valid range for the current type
        const [minValue, maxValue] = getIntegerRange(type, AllowNegative);

        // Ensure the value is within the range
        if (parsedValue < minValue || parsedValue > maxValue) {
          showAlert(
            "info",
            `Value should be with in [${minValue},${maxValue}]`
          );
          return;
        }

        if (MaximumValue != null && parsedValue > MaximumValue) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          return; // Prevent updating the value when greater than MaximumValue
        }
        // Set the parsed integer value
        

        // Format the value using `Intl.NumberFormat`
        const formattedValue =
          newValue !== null
            ? new Intl.NumberFormat(
                "en-US",
                {
                  style: "decimal",
                  maximumFractionDigits: 0,
                }
              ).format(parsedValue)
            : "";
            newValue = formattedValue?.toString();
        setInputValue(formattedValue); // Update formatted value locally
      }
      if (type === InputType.biginteger && newValue) {
        newValue = newValue.replace(/,/g, "");

        if (!AllowNegative && newValue < 0) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
        }
        if (!/^[+-]?\d*$/.test(newValue)) {
          return; // Reject non-numeric characters
        }

        if (newValue === "-" || newValue === "") {
          setInputValue(newValue); // Let user continue typing for negative numbers
          return;
        }

        // Parse the value as an integer
        let parsedValue = BigInt(newValue);

        // Get the valid range for the current type
        const [minValue, maxValue] = getIntegerRange(type, AllowNegative);

        // Ensure the value is within the range
        if (parsedValue < BigInt(minValue) || parsedValue > BigInt(maxValue)) {
          showAlert(
            "info",
            `Value should be with in [${minValue},${maxValue}]`
          );
          return;
        }

        if (MaximumValue != null && parsedValue > (MaximumValue)) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          return; // Prevent updating the value when greater than MaximumValue
        }

        // Set the parsed integer value
        
        // Format the value using `Intl.NumberFormat`
        const formattedValue =
          newValue !== null
            ? new Intl.NumberFormat(
                "en-US",
                {
                  style: "decimal",
                  maximumFractionDigits: 0,
                }
              ).format(parsedValue)
            : "";
       newValue = formattedValue?.toString();

        setInputValue(formattedValue); // Update formatted value locally
      }

      // Handle numeric input with decimals based on RegularExpression
      if (type === InputType.numeric && newValue) {
        newValue = newValue.replace(/,/g, "");
        if (!AllowNegative && parseFloat(newValue) < 0) {
          showAlert("info", `Negative values not allowed`);
          newValue = "";
        }
         // Allow only valid numeric values, including a single decimal point
      if (!/^[+-]?\d*\.?\d*$/.test(newValue)) {
        return; // Reject non-numeric characters
      }
      if (newValue === "-" || newValue === "") {
        setInputValue(newValue); // Let user continue typing for negative numbers
        return;
      }
      if (newValue.slice(-1) === "." ) {
        // Format the integer part before the decimal, but keep the decimal point
        const integerPart = newValue.slice(0, -1).replace(/,/g, ""); // Remove commas
        const formattedIntegerPart = new Intl.NumberFormat("en-US", {
          style: "decimal",
         
        }).format(integerPart);
      
        // Set the input value with the formatted integer part and the decimal point
        setInputValue(`${formattedIntegerPart}.`); // Append the decimal point
        return; // Skip further validation to allow the decimal point input
      }
  
      
      // Handle case where the last character is a '0' after a decimal point
      if (newValue.includes(".") && newValue.slice(-1) === "0") {
        const parts = newValue.split(".");
        const integerPart = parts[0].replace(/,/g, ""); // Get the integer part
        const formattedIntegerPart = new Intl.NumberFormat("en-US", {
          style: "decimal",
         
        }).format(integerPart);

        // Set the input value with the formatted integer part and the decimal portion
        setInputValue(`${formattedIntegerPart}.${parts[1]}`); // Append the decimal portion including any trailing zeros
        return; // Skip further validation to allow the decimal input
      }

      const regexString = RegularExpression?.toString();
      const maxFractionDigits =  RegularExpression ?getMaxFractionDigitsFromRegex(regexString):null;
      
      
        
        // Check if regular expression is provided for decimal precision
        if (RegularExpression && maxFractionDigits) {
          if (!regex.test(newValue)) {
            //showAlert("info", `regular expression mismatch`);
            return; // Reset value if it doesn't match the regular expression
          }
        }
     
        if (
          MaximumValue != null &&
          newValue &&
          parseFloat(newValue) > MaximumValue
        ) {
          showAlert("info", `Maximum value is : ${MaximumValue}`);
          // Remove the last character from newValue until it fits the range
          while (parseFloat(newValue) > MaximumValue) {
            newValue = newValue.slice(0, -1); // Remove last character
          }
        }
       
        
        const formattedValue =
        newValue !== null
          ? new Intl.NumberFormat(//here take only regex rounding qty only. not consider decimal DecimalPoints
              "en-US",
              {
                style: "decimal",
                minimumFractionDigits: 0, // Minimum fraction digits
                maximumFractionDigits: maxFractionDigits > 0 ? maxFractionDigits : FixedValues.DisplayDecimals, // Apply the same logic as minimumFractionDigits
                
              }
            ).format(newValue?.toString())
          : "";
         
        // newValue = parseFloat(newValue); // Convert to float
        newValue = formattedValue?.toString();
       
      }

      setInputValue(newValue); // Update local state
    }
  };

  const direction = "ltr"

  // Determine the autoComplete value
  const autoCompleteValue = type == InputType.password ? "new-password" : "off";
  //Handle InputTag Type
  const getInputType = (fieldType) => {
    switch (fieldType) {
      case InputType.text:
        return "text"; // For normal text input
      case InputType.numeric:
        return "text";
      case InputType.biginteger:
        return "text";
      case InputType.tinyinteger:
        return "text";
      case InputType.smallinteger:
        return "text";
      case InputType.integer:
        return "text";
      case InputType.date:
        return "date";
      case InputType.time:
        return "time";
      case InputType.datetime:
        return "datetime-local";
      case InputType.password:
        return "password";  
      default:
        return "text"; // Default to text if not recognized
    }
  };

  const calculateLabelPosition = (width, isShrink) => {
    if (width <= 300) {
      return isShrink ? Math.max(0, width * 0.2) : 15; //40 Smaller fields have smaller translateX values
    } else if (width <= 400) {
      return isShrink ? Math.max(0, width * 0.21) : 25; //45 Mid-size fields
    } else if (width <= 500) {
      return isShrink ? Math.max(0, width * 0.22) : 35; //60 Mid-size fields
    } else if (width <= 600) {
      return isShrink ? Math.max(0, width * 0.23) : 40; //65 Mid-size fields
    } else if (width <= 700) {
      return isShrink ? Math.max(0, width * 0.23) : 50; //75 Mid-size fields
    } else if (width <= 800) {
      return isShrink ? Math.max(0, width * 0.233) : 60; //85 Mid-size fields
    } else if (width > 800) {
      return isShrink ? Math.max(0, width * 0.235) : 70; //95 Mid-size fields
    } else {
      return isShrink ? 80 : 65; // Larger fields need larger translateX values
    }
  };
  const screenWidth = window.innerWidth || document.documentElement.clientWidth;

  //#region  Date view
  // Helper function to get formatted date in yyyy-mm-dd
  const getFormattedDate = (date) => {
    return date.toLocaleDateString("en-CA");
  };

  // Determine today's date and previous/next day dates
  const today = new Date();
  const todayDate = getFormattedDate(today); // Today's date in yyyy-mm-dd format

  // Calculate previous day and next day dates
  const nextDayDate = getFormattedDate(
    new Date(today.setDate(today.getDate() + 1))
  ); // Tomorrow's date
  today.setDate(today.getDate() - 2); // Set to the day before today
  const previousDayDate = getFormattedDate(today); // Yesterday's date

  // Determine the `min` and `max` based on `dateType`
  let minDate, maxDate;
  switch (dateType) {
    case 1: // Allow only future dates
      minDate = nextDayDate;
      maxDate = undefined;
      break;
    case 2: // Allow only past dates
      minDate = undefined;
      maxDate = previousDayDate;
      break;
    case 3: // Allow only today's date
      minDate = todayDate;
      maxDate = todayDate;
      break;
    case 4: // Allow future dates including today
      minDate = todayDate;
      maxDate = undefined;
      break;
    case 5: // Allow past dates including today
      minDate = undefined;
      maxDate = todayDate;
      break;
    default:
      minDate = undefined;
      maxDate = undefined;
      break;
  }
  //#endregion date view

  //#region Datetime

  // Helper function to format datetime in 'YYYY-MM-DDTHH:MM' format
  const getFormattedDateTime = (date) => {
    const pad = (number) => (number < 10 ? `0${number}` : number);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Calculate the base datetime for today
  const now = new Date();
  const todayDateTime = getFormattedDateTime(now);

  // Calculate next day's datetime (for future dates)
  const nextDay = new Date();
  nextDay.setDate(now.getDate() + 1);
  const nextDayDateTime = getFormattedDateTime(nextDay); // Tomorrow's date-time

  // Calculate previous day's datetime (for past dates)
  const previousDay = new Date();
  previousDay.setDate(now.getDate() - 1);
  const previousDayDateTime = getFormattedDateTime(previousDay); // Yesterday's date-time

  // Determine the `min` and `max` values based on `dateType`
  let minDateTime, maxDateTime;
  switch (dateType) {
    case 1: // Allow only future dates (excluding today)
      minDateTime = nextDayDateTime;
      maxDateTime = undefined;
      break;
    case 2: // Allow only past dates (excluding today)
      minDateTime = undefined;
      maxDateTime = previousDayDateTime;
      break;
    case 3: // Allow only today's datetime
      minDateTime = todayDateTime;
      maxDateTime = todayDateTime;
      break;
    case 4: // Allow future dates including today
      minDateTime = todayDateTime;
      maxDateTime = undefined;
      break;
    case 5: // Allow past dates including today
      minDateTime = undefined;
      maxDateTime = todayDateTime;
      break;
    default:
      minDateTime = undefined;
      maxDateTime = undefined;
      break;
  }

  return (
    <CustomTextField
      key={fieldKey}
      margin={tableField?undefined:"normal"}
      size="small"
      id={name}
      // value={
      //   (type == InputType.date || type == InputType.time || type == InputType.datetime) && !inputValue
      //     ? " "
      //     : inputValue ?? ""
      // }
      value={inputValue ?? ""}
      type={getInputType(type)}
      label={label}
      maxLength={maxLength}
      required={!!mandatory}
      multiline={
        multiline &&
        (getInputType(type) == "text" || getInputType(type) == "number")
          ? multiline
          : null
      }
      rows={
        multiline &&
        (getInputType(type) == "text" || getInputType(type) == "number")
          ? RowSpan
          : null
      }
      autoComplete={autoCompleteValue}
      disabled={disabled}
      onChange={handleChange}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onBlur={handleBlurOrMouseLeave}// this always required as to set value to parent when on blur
      //onMouseLeave={onBlur ? handleBlurOrMouseLeave : undefined}// only when onblur action in parent
      InputProps={{
        inputProps: {
          autoComplete: autoCompleteValue,
          ...(type == InputType.date
            ? {
                min: minDate,
                max: maxDate,
                onKeyDown: (e) => {
                  // Only trigger the date picker when Enter or Space is pressed
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.showPicker?.();
                  }
                },
                
                //onFocus: (e) => e.target.showPicker?.(),
                //onClick: (e) => e.target.showPicker?.(),
              }
            : type == InputType.time
            ? {
                step: 1, // Allows time input in HH:mm:ss format
                onKeyDown: (e) => {
                  // Prevent default only for keys other than Tab
                  
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.showPicker?.();
                  }
                },
                
                //onFocus: (e) => e.target.showPicker?.(),
                //onClick: (e) => e.target.showPicker?.(),
              }
            : type == InputType.datetime
            ? {
                step: 1, // For precise datetime input including seconds
                onKeyDown: (e) => {
                  // Disable manual typing for datetime fields
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.showPicker?.();
                  }

                },
                //onFocus: (e) => e.target.showPicker?.(),
                //onClick: (e) => e.target.showPicker?.(),
                min: minDateTime || undefined, // Set min to restrict future dates
                max: maxDateTime || undefined, // Set max if needed for past dates
              }
              : [InputType.numeric, InputType.tinyinteger, InputType.smallinteger, InputType.integer, InputType.biginteger].includes(type)
            ? {
                onFocus: (e) => {
              
                  
                  // If the field is numeric and its current value is "0" or "0.00", clear it
                  if (parseFloat(e.target.value) === 0) {
                    setInputValue("");
                    // Force cursor to the start
                    requestAnimationFrame(() => e.target.setSelectionRange(0, 0));
                  }
                },
              }
            : {}),
          style: {
            direction: type == InputType.text ? direction : "ltr", // Default to LTR if direction is not found
            fontFamily: "inherit", // Default to inherit if fontFamily is not found
          },
        },
        endAdornment:
          type == InputType.time && inputValue ? (
            <InputAdornment position="end">
              <IconButton
                onClick={() => {
                  setInputValue(""); // Clear the input value
                  setValue({ name, value: null }); // Update the parent state
                }}
                edge="end"
                aria-label="clear time"
                tabIndex={-1} // Prevents Tab from focusing on this icon
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        sx: {
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            filter: "invert(0)",
          },
          '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
            filter:"invert(0)",
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            filter: "invert(0)", // Ensures visibility in dark mode
          },
        },
      }}
      InputLabelProps={{
        shrink: !value || !!inputValue || type === "date" || type === "time", // Shrink the label if it's a password field and has a value
        sx: {
          textAlign: direction === "rtl" ? "right" : "left",
          right: direction === "rtl" ? 0 : "auto",
        },
      }}
      sx={{
        minWidth: width + ColumnSpan * 50, // Adjust the width as needed
        // "@media (max-width: 360px)": {
        //       width: 220, // Reduced width for small screens
        //     },
        "& .MuiInputBase-root": {
          ...(multiline &&
          (getInputType(type) == "text" || getInputType(type) == "number")
            ? {}
            : { height: 30 }), // Adjust the height of the input area if not multiline
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
          },
        },
        "& .MuiInputLabel-root": {
          fontSize: "14px",
          transform:
            direction === "rtl"
              ? `translate(${calculateLabelPosition(
                  width + ColumnSpan * 50,
                  false
                )}px, 5px) scale(0.9)`
              : "translate(10px, 5px) scale(0.9)", // Adjust label position when not focused
          color: "inherit",
        },
        "& .MuiInputLabel-shrink": {
          transform:
            direction === "rtl"
              ? `translate(${calculateLabelPosition(
                  width + ColumnSpan * 50,
                  true
                )}px, -7px) scale(0.75)`
              : "translate(14px, -9px) scale(0.75)", // Adjust label position when focused
          // right:direction === 'rtl' ? -25:null,
          // top:direction === 'rtl' ? -8:null
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
            borderColor: "#ddd",
            textAlign: direction === "rtl" ? "right" : "left",
          },
          "&:hover fieldset": {
            borderColor: "currentColor", // Keeps the border color on hover
          },
          "&.Mui-focused fieldset": {
            borderColor: "currentColor", // Keeps the current border color
          },
          "& legend": {
            width: direction === "rtl" ? "auto" : "max-content", // Let legend adjust width in RTL
          },
        },
      }}
    />
  );
}
