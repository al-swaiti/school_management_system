import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearAlert } from '../../store/slices/uiSlice';

const AlertMessage = () => {
  const dispatch = useDispatch();
  const { alertMessage, alertType } = useSelector((state) => state.ui);
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(clearAlert());
  };
  
  return (
    <Snackbar
      open={Boolean(alertMessage)}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {alertMessage && (
        <Alert 
          onClose={handleClose} 
          severity={alertType || 'info'} 
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      )}
    </Snackbar>
  );
};

export default AlertMessage;
