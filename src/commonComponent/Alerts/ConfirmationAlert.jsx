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

export default function ConfirmationAlert({ handleClose, open, data,submite }) {
  const themes = useTheme();
  return (
    <>
      <MDBModal open={open} onClose={handleClose} tabIndex='-1' centered>
        <MDBModalDialog size='sm' style={{ marginTop:100 }}>
          <MDBModalContent>
            <MDBModalHeader className={`bg-${data?.type} text-white d-flex justify-content-center`}>
              <MDBModalTitle>{data?.message}</MDBModalTitle>
            </MDBModalHeader>
            <MDBModalBody className='d-flex justify-content-center align-items-center'>
              <Typography sx={{textTransform:'none'}} m={2} color="grey">Do you want to {data?.message}</Typography>
            </MDBModalBody>
            <MDBModalFooter className='d-flex justify-content-center'>
              <MDBBtn color='secondary' onClick={handleClose} style={{textTransform:"none"}}>
                Close
              </MDBBtn >
              <MDBBtn onClick={submite} color={data?.type} style={{textTransform:"none"}}>{data?.message}</MDBBtn>
            </MDBModalFooter>
          </MDBModalContent>
        </MDBModalDialog>
      </MDBModal>
    </>
  );
}
