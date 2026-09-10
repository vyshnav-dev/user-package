import React from 'react';
import {
  MDBBtn,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
} from 'mdb-react-ui-kit';
import { Typography, useTheme } from '@mui/material';

export default function ConfirmationAlert2({ handleClose, open, data, submite }) {
  const themes = useTheme();
  return (
    <>
      <MDBModal
        open={open}
        // onClose={handleClose}   // <-- removed to prevent automatic close
        tabIndex="-1"
        centered
        backdrop="static"         // prevents backdrop click
        keyboard={false}          // prevents Escape key
        // fallback for older versions
        closeOnBackdropClick={false}
        closeOnEscape={false}
      >
        <MDBModalDialog size="sm" style={{ marginTop: '75px' }}>
          <MDBModalContent>
            <MDBModalHeader className={`bg-${data?.type} text-white d-flex justify-content-center`}>
              <MDBModalTitle>{data?.title}</MDBModalTitle>
            </MDBModalHeader>
            <MDBModalBody className="d-flex justify-content-center align-items-center">
              <Typography m={2} color="grey">{data?.message}</Typography>
            </MDBModalBody>
            <MDBModalFooter className="d-flex justify-content-center">
              <MDBBtn style={{ textTransform: 'none' }} color="secondary" onClick={handleClose}>
                {data?.close ?? "Close"}
              </MDBBtn>
              <MDBBtn style={{ textTransform: 'none' }} onClick={submite} color={data?.type}>
                {data?.button}
              </MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
}