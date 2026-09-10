import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function ImagePreview({
  open,
  items,
  initialIndex = 0,
  onClose,
}) {

  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (open) setCurrentIndex(initialIndex || 0);
  }, [open, initialIndex]);

  if (!items || items.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      PaperProps={{
        sx: {
          background: "#fff",
          borderRadius: 2,
          minHeight: 400,
          minWidth: 350,
          maxWidth: 700,
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          minWidth: 320,
          minHeight: 350,
          background: "#f9f9f9",
        }}
      >
        <IconButton
          onClick={handlePrev}
          disabled={items.length <= 1}
          sx={{ mx: 1 }}
        >
          <ArrowBackIosIcon />
        </IconButton>
        <Box
          sx={{
            maxWidth: 480,
            maxHeight: 350,
            width: "100%",
            height: "100%",
            textAlign: "center",
            position: "relative",
          }}
        >
          <img
            src={items[currentIndex]?.url}
            alt={items[currentIndex]?.name || `Preview ${currentIndex + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "320px",
              objectFit: "contain",
              borderRadius: 6,
              background: "#fff",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          />
          {/* {items[currentIndex].name && (
            <Typography sx={{ mt: 1, fontWeight: 500, fontSize: 15 }}>
              {items[currentIndex].name}
            </Typography>
          )} */}
        </Box>
        <IconButton
          onClick={handleNext}
          disabled={items.length <= 1}
          sx={{ mx: 1 }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      </DialogContent>
      <Box sx={{ textAlign: "center", p: 1, fontSize: 13, color: "#888" }}>
        {currentIndex + 1} / {items.length}
      </Box>
    </Dialog>
  );
}