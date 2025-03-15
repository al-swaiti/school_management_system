import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Container, Paper, Typography, Grid } from '@mui/material';
import AlertMessage from '../common/AlertMessage';

const AuthLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" />;
    } else if (user.role === 'student') {
      return <Navigate to="/student/dashboard" />;
    }
  }
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme) => theme.palette.background.default,
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Grid container justifyContent="center" spacing={2}>
          <Grid item xs={12}>
            <Typography 
              variant="h4" 
              component="h1" 
              align="center" 
              gutterBottom
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              School Management System
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4, 
                borderRadius: 2,
                boxShadow: (theme) => theme.shadows[10]
              }}
            >
              {/* Alert Message */}
              <AlertMessage />
              
              {/* Auth Pages (Login, Register, etc.) */}
              <Outlet />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthLayout;
