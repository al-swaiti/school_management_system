import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { useSelector } from 'react-redux';

import Header from '../navigation/Header';
import Sidebar from '../navigation/Sidebar';
import AlertMessage from '../common/AlertMessage';
import DialogModal from '../common/DialogModal';

const MainLayout = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header */}
      <Header />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? 240 : 64}px)` },
          ml: { sm: `${sidebarOpen ? 240 : 64}px` },
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacer for fixed header */}
        
        {/* Alert Message */}
        <AlertMessage />
        
        {/* Dialog Modal */}
        <DialogModal />
        
        {/* Page Content */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
