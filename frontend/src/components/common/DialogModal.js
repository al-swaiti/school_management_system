import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { closeDialog } from '../../store/slices/uiSlice';

const DialogModal = () => {
  const dispatch = useDispatch();
  const { dialogOpen, dialogTitle, dialogContent, dialogActions } = useSelector((state) => state.ui);
  
  const handleClose = () => {
    dispatch(closeDialog());
  };
  
  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      maxWidth="sm"
      fullWidth
    >
      {dialogTitle && (
        <DialogTitle id="dialog-title">
          {dialogTitle}
        </DialogTitle>
      )}
      
      {dialogContent && (
        <DialogContent id="dialog-description">
          {dialogContent}
        </DialogContent>
      )}
      
      <DialogActions>
        {dialogActions ? (
          dialogActions
        ) : (
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DialogModal;
