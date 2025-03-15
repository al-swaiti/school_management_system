import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  Message as MessageIcon,
  Announcement as AnnouncementIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Grade as GradeIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { setSidebarOpen } from '../../store/slices/uiSlice';

// Drawer width
const drawerWidth = 240;

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  
  const [openMenus, setOpenMenus] = useState({
    classes: false,
    content: false,
    communication: false
  });
  
  const handleDrawerToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen));
  };
  
  const handleMenuToggle = (menu) => {
    setOpenMenus({
      ...openMenus,
      [menu]: !openMenus[menu]
    });
  };
  
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Admin menu items
  const adminMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin/dashboard',
      onClick: () => handleNavigate('/admin/dashboard')
    },
    {
      text: 'User Management',
      icon: <PeopleIcon />,
      path: '/admin/users',
      onClick: () => handleNavigate('/admin/users')
    },
    {
      text: 'Class Management',
      icon: <SchoolIcon />,
      path: '/admin/classes',
      onClick: () => handleNavigate('/admin/classes')
    },
    {
      text: 'System Settings',
      icon: <SettingsIcon />,
      path: '/admin/settings',
      onClick: () => handleNavigate('/admin/settings')
    }
  ];
  
  // Teacher menu items
  const teacherMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/teacher/dashboard',
      onClick: () => handleNavigate('/teacher/dashboard')
    },
    {
      text: 'Classes',
      icon: <SchoolIcon />,
      path: '/teacher/classes',
      onClick: () => handleNavigate('/teacher/classes'),
      submenu: true,
      open: openMenus.classes,
      onToggle: () => handleMenuToggle('classes'),
      items: [
        {
          text: 'All Classes',
          path: '/teacher/classes',
          onClick: () => handleNavigate('/teacher/classes')
        }
      ]
    },
    {
      text: 'Content',
      icon: <BookIcon />,
      path: '/teacher/content',
      onClick: () => handleNavigate('/teacher/content'),
      submenu: true,
      open: openMenus.content,
      onToggle: () => handleMenuToggle('content'),
      items: [
        {
          text: 'Manage Content',
          path: '/teacher/content',
          onClick: () => handleNavigate('/teacher/content')
        }
      ]
    },
    {
      text: 'Student Progress',
      icon: <GradeIcon />,
      path: '/teacher/students',
      onClick: () => handleNavigate('/teacher/students')
    }
  ];
  
  // Student menu items
  const studentMenuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/student/dashboard',
      onClick: () => handleNavigate('/student/dashboard')
    },
    {
      text: 'My Courses',
      icon: <SchoolIcon />,
      path: '/student/courses',
      onClick: () => handleNavigate('/student/courses')
    },
    {
      text: 'Assignments',
      icon: <AssignmentIcon />,
      path: '/student/assignments',
      onClick: () => handleNavigate('/student/assignments')
    },
    {
      text: 'Grades',
      icon: <GradeIcon />,
      path: '/student/grades',
      onClick: () => handleNavigate('/student/grades')
    }
  ];
  
  // Shared menu items
  const sharedMenuItems = [
    {
      text: 'Messages',
      icon: <MessageIcon />,
      path: '/messages',
      onClick: () => handleNavigate('/messages')
    },
    {
      text: 'Announcements',
      icon: <AnnouncementIcon />,
      path: '/announcements',
      onClick: () => handleNavigate('/announcements')
    },
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/profile',
      onClick: () => handleNavigate('/profile')
    }
  ];
  
  // Determine which menu items to show based on user role
  let menuItems = [];
  if (user) {
    if (user.role === 'admin') {
      menuItems = adminMenuItems;
    } else if (user.role === 'teacher') {
      menuItems = teacherMenuItems;
    } else if (user.role === 'student') {
      menuItems = studentMenuItems;
    }
  }
  
  const drawer = (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={handleDrawerToggle}>
          {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={item.submenu ? item.onToggle : item.onClick}
                selected={isActive(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: sidebarOpen ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: sidebarOpen ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {sidebarOpen && (
                  <>
                    <ListItemText primary={item.text} />
                    {item.submenu && (item.open ? <ExpandLess /> : <ExpandMore />)}
                  </>
                )}
              </ListItemButton>
            </ListItem>
            
            {item.submenu && sidebarOpen && (
              <Collapse in={item.open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.items.map((subItem) => (
                    <ListItemButton
                      key={subItem.text}
                      onClick={subItem.onClick}
                      selected={isActive(subItem.path)}
                      sx={{ pl: 4 }}
                    >
                      <ListItemText primary={subItem.text} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>
      <Divider />
      <List>
        {sharedMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={item.onClick}
              selected={isActive(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: sidebarOpen ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
  
  return (
    <Box
      component="nav"
      sx={{ width: { sm: sidebarOpen ? drawerWidth : 64 }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth 
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: sidebarOpen ? drawerWidth : 64,
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden'
          },
        }}
        open={sidebarOpen}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
