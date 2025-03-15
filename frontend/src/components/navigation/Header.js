import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Badge, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import { toggleSidebar, toggleDarkMode } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { unreadNotificationsCount } = useSelector((state) => state.communication);
  
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = React.useState(null);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/login');
  };
  
  const handleProfile = () => {
    handleMenuClose();
    navigate('/profile');
  };
  
  const handleMessages = () => {
    navigate('/messages');
  };
  
  const handleNotifications = () => {
    handleNotificationsMenuClose();
    navigate('/notifications');
  };
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };
  
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleProfile}>Profile</MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );
  
  const renderNotificationsMenu = (
    <Menu
      anchorEl={notificationsAnchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={Boolean(notificationsAnchorEl)}
      onClose={handleNotificationsMenuClose}
    >
      <MenuItem onClick={handleNotifications}>View All Notifications</MenuItem>
    </Menu>
  );
  
  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          School Management System
        </Typography>
        
        <IconButton color="inherit" onClick={handleToggleDarkMode}>
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        
        <IconButton color="inherit" onClick={handleMessages}>
          <Badge badgeContent={0} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        
        <IconButton color="inherit" onClick={handleNotificationsMenuOpen}>
          <Badge badgeContent={unreadNotificationsCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        
        <Tooltip title={user?.firstName ? `${user.firstName} ${user.lastName}` : 'Account'}>
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {user?.avatar ? (
              <Avatar src={user.avatar} alt={user.firstName} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircleIcon />
            )}
          </IconButton>
        </Tooltip>
      </Toolbar>
      {renderMenu}
      {renderNotificationsMenu}
    </AppBar>
  );
};

export default Header;
