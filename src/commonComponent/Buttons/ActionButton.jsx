import React from 'react'
import { IconButton, Stack, Typography, Box, Tooltip, useTheme } from '@mui/material';
import { MDBIcon } from 'mdb-react-ui-kit';
import { primaryColor, thirdColor } from '../../config/config';

function ActionButton({ 
  iconsClick, 
  icon, 
  caption, 
  iconName, 
  variant = 'default', // 'default', 'outlined', 'filled'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  tooltip = '',
  loading = false
}) {
  const theme = useTheme();

  // Size configurations
  const sizeConfig = {
    small: {
      iconSize: "0.7rem",
      buttonPadding: "0.4rem",
      fontSize: "0.5rem",
      iconMargin: "0.1rem"
    },
    medium: {
      iconSize: "0.8rem",
      buttonPadding: "0.5rem",
      fontSize: "0.6rem",
      iconMargin: "0.2rem"
    },
    large: {
      iconSize: "1rem",
      buttonPadding: "0.6rem",
      fontSize: "0.7rem",
      iconMargin: "0.3rem"
    }
  };

  // Variant styles
  const variantStyles = {
    default: {
      button: {
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
          transform: "translateY(-1px)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      },
      icon: { color: primaryColor },
      text: { color: primaryColor }
    },
    outlined: {
      button: {
        backgroundColor: "transparent",
        border: `1px solid ${primaryColor}20`,
        "&:hover": {
          backgroundColor: "transparent",
          border: `1px solid ${primaryColor}40`,
          transform: "translateY(-1px)",
        },
      },
      icon: { color: primaryColor },
      text: { color: primaryColor }
    },
    filled: {
      button: {
        backgroundColor: "transparent",
        "&:hover": {
          backgroundColor: "transparent",
          transform: "translateY(-1px)",
        },
      },
      icon: { color: "#ffffff" },
      text: { color: "#ffffff" }
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantStyles[variant];

  const buttonSx = {
    borderRadius: "8px",
    padding: currentSize.buttonPadding,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "transparent",
      transform: currentVariant.button["&:hover"].transform,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    },
    ...currentVariant.button,
    ...(variant === 'outlined' && currentVariant.button.border ? { border: currentVariant.button.border } : {}),
  };

  const iconStyle = {
    fontSize: currentSize.iconSize,
    marginBottom: currentSize.iconMargin,
    transition: "all 0.2s ease-in-out",
    ...currentVariant.icon,
  };

  const textStyle = {
    fontSize: currentSize.fontSize,
    fontWeight: 500,
    lineHeight: 1.2,
    transition: "all 0.2s ease-in-out",
    ...currentVariant.text,
    "@media (max-width: 600px)": {
      fontSize: `calc(${currentSize.fontSize} - 0.1rem)`,
    },
  };

  const buttonContent = (
    <Stack direction="column" alignItems="center" spacing={0.1}>
      {loading ? (
        <MDBIcon fas icon="spinner" spin style={iconStyle} />
      ) : (
        <MDBIcon fas icon={icon} style={iconStyle} />
      )}
      <Typography variant="caption" align="center" sx={textStyle}>
        {caption}
      </Typography>
    </Stack>
  );

  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Box component="span">
        <IconButton
          aria-label={caption || iconName}
          sx={buttonSx}
          onClick={() => iconsClick(iconName)}
          disabled={disabled || loading}
          size={size}
        >
          {buttonContent}
        </IconButton>
      </Box>
    </Tooltip>
  );
}

export default ActionButton;