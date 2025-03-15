import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  sidebarOpen: true,
  darkMode: false,
  currentTheme: 'light',
  alertMessage: null,
  alertType: null,
  dialogOpen: false,
  dialogContent: null,
  dialogTitle: null,
  dialogActions: null,
  mobileMenuOpen: false
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      state.currentTheme = state.darkMode ? 'dark' : 'light';
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      state.currentTheme = state.darkMode ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.currentTheme = action.payload;
      state.darkMode = action.payload === 'dark';
    },
    showAlert: (state, action) => {
      state.alertMessage = action.payload.message;
      state.alertType = action.payload.type || 'info';
    },
    clearAlert: (state) => {
      state.alertMessage = null;
      state.alertType = null;
    },
    openDialog: (state, action) => {
      state.dialogOpen = true;
      state.dialogTitle = action.payload.title;
      state.dialogContent = action.payload.content;
      state.dialogActions = action.payload.actions;
    },
    closeDialog: (state) => {
      state.dialogOpen = false;
      state.dialogTitle = null;
      state.dialogContent = null;
      state.dialogActions = null;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action) => {
      state.mobileMenuOpen = action.payload;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setTheme,
  showAlert,
  clearAlert,
  openDialog,
  closeDialog,
  toggleMobileMenu,
  setMobileMenuOpen
} = uiSlice.actions;

export default uiSlice.reducer;
