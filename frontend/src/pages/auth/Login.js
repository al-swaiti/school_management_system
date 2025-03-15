import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { login } from '../../../store/slices/authSlice';
import { showAlert } from '../../../store/slices/uiSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const resultAction = await dispatch(login(values));
        if (login.fulfilled.match(resultAction)) {
          const user = resultAction.payload;
          
          // Redirect based on user role
          if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (user.role === 'teacher') {
            navigate('/teacher/dashboard');
          } else if (user.role === 'student') {
            navigate('/student/dashboard');
          }
          
          dispatch(showAlert({
            message: 'Login successful!',
            type: 'success'
          }));
        } else {
          dispatch(showAlert({
            message: resultAction.payload || 'Login failed. Please try again.',
            type: 'error'
          }));
        }
      } catch (error) {
        dispatch(showAlert({
          message: 'An error occurred during login. Please try again.',
          type: 'error'
        }));
      } finally {
        setIsSubmitting(false);
      }
    }
  });
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom align="center">
        Sign In
      </Typography>
      
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="Email"
          variant="outlined"
          margin="normal"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          autoComplete="email"
        />
        
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          margin="normal"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <Box sx={{ mt: 2, mb: 2, textAlign: 'right' }}>
          <Link href="/forgot-password" variant="body2">
            Forgot password?
          </Link>
        </Box>
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 2, mb: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link href="/register" variant="body2">
              Sign Up
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Login;
