
export const mathFloorWithPrecision = (value, decimalPlaces) => {
    const factor = Math.pow(10, decimalPlaces);
    return Math.floor(value * factor) / factor;
  };
  
 