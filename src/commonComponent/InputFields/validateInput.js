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
export const validateInput = ({
    type,
    value,
    minimumValue,
    maximumValue,
    allowNegative,
    regularExpression,
    donotAllowSpecialChar,
    languageName="english",
    maxSize
  }) => {
  
    
    let newValue = value?.replace(/,/g, "") || ""; // Remove commas
    let error = null; // To hold the error message

    type = type?.toLowerCase()

    const regex = typeof regularExpression === 'string'
  ? new RegExp(regularExpression.replace(/\\\\/g, '\\')) // Replace double backslashes with a single backslash
  : regularExpression;

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
    const getIntegerRange = (type) => {
        switch (type) {
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

      const validateSpecialChars = (val) => {
        if (donotAllowSpecialChar) {
          if (languageName === "english") {
            const englishRegex = /^[a-zA-Z0-9 ]*$/; // Alphanumeric and space for English
            return englishRegex.test(val);
          } else if (languageName === "arabic") {
            const arabicRegex = /^[\u0621-\u064A0-9 ]*$/; // Arabic characters, digits, and space
            return arabicRegex.test(val);
          }
        }
        return true; // Allow special characters if true
      }; 
  
    if (type === InputType.numeric) {
      // Handle numeric values
      newValue = parseFloat(newValue);
    
      if (!allowNegative && newValue < 0) {
       
        return errorMessages.allowNegative
      }
      if (minimumValue != null && newValue < minimumValue) {
        
        return errorMessages.minimumValue
      }
      if (maximumValue != null && newValue > maximumValue) {
       
        return errorMessages.maximumValue
      }
      if (regularExpression && newValue) {
        if (!regex.test(newValue)) {
            return errorMessages.regexFailed
        }
      }
      return "noError"
    }
  
    if ([InputType.tinyinteger,InputType.smallinteger, InputType.integer].includes(type)) {
      // Handle integer types
      newValue = parseInt(newValue, 10);
      if (!allowNegative && newValue < 0) {
       
        return errorMessages.allowNegative
      }
      if (minimumValue != null && newValue < minimumValue) {
        
        return errorMessages.minimumValue
      }
      if (maximumValue != null && newValue > maximumValue) {
       
        return errorMessages.maximumValue
      }
      const [minValue, maxValue] = getIntegerRange(type);
          if (newValue < minValue || newValue > maxValue) {
            return errorMessages.integerRange
          }
          return "noError"
    }
  
    if (type === InputType.biginteger) {
      // Handle big integer types
      try {
        newValue = BigInt(newValue);
        if (!allowNegative && newValue < 0) {
       
            return errorMessages.allowNegative
          }
        if (minimumValue !== null && newValue < BigInt(minimumValue))
            return errorMessages.minimumValue
        if (maximumValue !== null && newValue > BigInt(maximumValue))
            return errorMessages.maximumValue
        const [minValue, maxValue] = getIntegerRange(type);
          if (newValue < minValue || newValue > maxValue) {
            return errorMessages.integerRange
          }
          return "noError"
       
      } catch  {
        return   errorMessages.invalidInteger
      }
    }
  
    if (type === "text") {
      // Handle text input
      if (donotAllowSpecialChar && !validateSpecialChars(newValue))
        return errorMessages.specialCharacter
      if (regularExpression) {
      
        if (!regex.test(newValue)) {
          
            return errorMessages.regularExpression
        } 
      }
       
      if (maxSize && newValue.length > maxSize) {
     
        return errorMessages.maxSize
       
      }
      return "noError"
    }
  
    // Return the validated value and error (null if no error)
    return { newValue, error };
  };