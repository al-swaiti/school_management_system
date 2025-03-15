import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import classReducer from './slices/classSlice';
import contentReducer from './slices/contentSlice';
import communicationReducer from './slices/communicationSlice';
import uiReducer from './slices/uiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    classes: classReducer,
    content: contentReducer,
    communication: communicationReducer,
    ui: uiReducer
  }
});

export default store;
