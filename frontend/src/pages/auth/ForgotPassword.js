import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Link, 
  CircularProgress 
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../../store/slices/uiSlice';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
    }),
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll simulate a successful response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setEmailSent(true);
        dispatch(showAlert({
          message: 'Password reset instructions sent to your email',
          type: 'success'
        }));
      } catch (error) {
        dispatch(showAlert({
          message: 'Failed to send password reset email. Please try again.',
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
        Reset Password
      </Typography>
      
      {!emailSent ? (
        <>
          <Typography variant="body1" paragraph>
            Enter your email address and we'll send you instructions to reset your password.
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
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              sx={{ mt: 3, mb: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Send Reset Link'}
            </Button>
          </form>
        </>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" paragraph>
            We've sent password reset instructions to your email address.
          </Typography>
          <Typography variant="body1" paragraph>
            Please check your inbox and follow the instructions to reset your password.
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Didn't receive the email? Check your spam folder or{' '}
            <Link 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                setEmailSent(false);
              }}
            >
              try again
            </Link>
          </Typography>
        </Box>
      )}
      
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2">
          Remember your password?{' '}
          <Link href="/login" variant="body2">
            Sign In
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
