import { FixedValues } from "../../config/config";

export const roundOffCalculator = (number, roundOffValue, roundingType, decimalPart1,type) => {


    const decimalPart = decimalPart1>0?decimalPart1:FixedValues.RoundingDecimals
    // Function to round the result to the specified decimal part
    const roundToDecimals = (value, decimals) => {
  
      const factor = Math.pow(10, decimals);
      return Math.round(value * factor) / factor;
    };
  
    // Function to calculate the rounded value based on rounding type
    const calculateRoundedValue = (num, roundOff, type) => {
      const lowerMultiple = Math.floor(num / roundOff) * roundOff;
      const higherMultiple = Math.ceil(num / roundOff) * roundOff;
  
      let roundedValue;
  
      switch (type.toLowerCase()) {
        case "nearest": // Round to the nearest multiple
        roundedValue = num
          break;
  
        case "up": // Always round up
          roundedValue = higherMultiple;
          break;
  
        case "down": // Always round down
          roundedValue = lowerMultiple;
          break;
  
        default:
          roundedValue = num; // If no valid rounding type, return the original number
      }
  
      // Apply decimal part rounding
      return roundToDecimals(roundedValue, decimalPart);
    };
  // Check and calculate roundOffValue if null, empty, or zero
  if (!roundOffValue && decimalPart > 0) {
    roundOffValue = 1 / Math.pow(10, decimalPart);
  }
   // If decimalPart is invalid, return the number as is
   if (!decimalPart || decimalPart <= 0) {
    return number;
  }

  // If roundOffValue is still null, empty, or zero, return the number as is
  if (!roundOffValue || roundOffValue <= 0) {
    return number;
  }
    // Return the calculated rounded value
    return calculateRoundedValue(number, roundOffValue, roundingType);
  };
  