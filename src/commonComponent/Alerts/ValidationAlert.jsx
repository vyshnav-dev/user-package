import React from "react";
import { Snackbar, Stack, Slide } from "@mui/material";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

export default function ValidationAlert({ open, handleClose, data }) {
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Snackbar
        open={open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        TransitionComponent={SlideTransition}
        ClickAwayListenerProps={{
          onClickAway: (event) => {
            // Delay closure by 3 seconds on click away:
            setTimeout(() => {
              handleClose(event, "clickaway");
            }, 2000);
          }
        }}
      >
        <Alert
          onClose={handleClose}
          severity={data?.type}
          sx={{ width: "100%" }}
        >
          {data?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
