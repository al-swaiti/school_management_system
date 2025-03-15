import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import io from 'socket.io-client';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3004';

let socket = null;

// Initialize socket connection
export const initializeSocket = createAsyncThunk(
  'communication/initializeSocket',
  async (token, { dispatch }) => {
    if (socket) {
      socket.disconnect();
    }
    
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      socket.emit('authenticate', token);
    });
    
    socket.on('authenticated', (data) => {
      if (data.success) {
        dispatch(setSocketConnected(true));
      } else {
        dispatch(setSocketConnected(false));
      }
    });
    
    socket.on('new-message', (data) => {
      dispatch(addMessage(data.message));
      dispatch(addNotification(data.notification));
    });
    
    socket.on('new-announcement', (data) => {
      dispatch(addAnnouncement(data.announcement));
    });
    
    socket.on('announcement-updated', (data) => {
      dispatch(updateAnnouncementInState(data.announcement));
    });
    
    socket.on('announcement-deleted', (data) => {
      dispatch(removeAnnouncement(data.announcementId));
    });
    
    socket.on('disconnect', () => {
      dispatch(setSocketConnected(false));
    });
    
    socket.on('error', (error) => {
      dispatch(setCommunicationError(error.message));
    });
    
    return true;
  }
);

// Disconnect socket
export const disconnectSocket = createAsyncThunk(
  'communication/disconnectSocket',
  async () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return true;
  }
);

// Send private message via socket
export const sendPrivateMessage = createAsyncThunk(
  'communication/sendPrivateMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      if (!socket || !socket.connected) {
        throw new Error('Socket not connected');
      }
      
      return new Promise((resolve, reject) => {
        socket.emit('private-message', messageData, (response) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'Failed to send message'));
          }
        });
        
        // Add timeout in case socket doesn't respond
        setTimeout(() => {
          reject(new Error('Socket response timeout'));
        }, 5000);
      });
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

// Get messages (inbox)
export const getInboxMessages = createAsyncThunk(
  'communication/getInboxMessages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/communications/messages/inbox`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch inbox messages');
    }
  }
);

// Get sent messages (outbox)
export const getOutboxMessages = createAsyncThunk(
  'communication/getOutboxMessages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/communications/messages/outbox`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch outbox messages');
    }
  }
);

// Get message by ID
export const getMessageById = createAsyncThunk(
  'communication/getMessageById',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/communications/messages/${messageId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch message');
    }
  }
);

// Send message via HTTP
export const sendMessage = createAsyncThunk(
  'communication/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/communications/messages`, messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Delete message
export const deleteMessage = createAsyncThunk(
  'communication/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/communications/messages/${messageId}`);
      return messageId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

// Get announcements
export const getAnnouncements = createAsyncThunk(
  'communication/getAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/communications/announcements`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

// Get announcement by ID
export const getAnnouncementById = createAsyncThunk(
  'communication/getAnnouncementById',
  async (announcementId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/communications/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcement');
    }
  }
);

// Create announcement
export const createAnnouncement = createAsyncThunk(
  'communication/createAnnouncement',
  async (announcementData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/communications/announcements`, announcementData);
      return response.data.announcement;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create announcement');
    }
  }
);

// Update announcement
export const updateAnnouncement = createAsyncThunk(
  'communication/updateAnnouncement',
  async ({ announcementId, announcementData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/communications/announcements/${announcementId}`, announcementData);
      return response.data.announcement;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update announcement');
    }
  }
);

// Delete announcement
export const deleteAnnouncement = createAsyncThunk(
  'communication/deleteAnnouncement',
  async (announcementId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/communications/announcements/${announcementId}`);
      return announcementId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete announcement');
    }
  }
);

// Get notifications
export const getNotifications = createAsyncThunk(
  'communication/getNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/communications/notifications`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'communication/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/communications/notifications/${notificationId}/read`);
      return response.data.notification;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'communication/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.put(`${API_URL}/communications/notifications/read-all`);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'communication/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/communications/notifications/${notificationId}`);
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

// Initial state
const initialState = {
  socketConnected: false,
  inboxMessages: [],
  outboxMessages: [],
  currentMessage: null,
  announcements: [],
  currentAnnouncement: null,
  notifications: [],
  unreadNotificationsCount: 0,
  loading: false,
  error: null
};

// Communication slice
const communicationSlice = createSlice({
  name: 'communication',
  initialState,
  reducers: {
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    addMessage: (state, action) => {
      state.inboxMessages.unshift(action.payload);
    },
    addAnnouncement: (state, action) => {
      state.announcements.unshift(action.payload);
    },
    updateAnnouncementInState: (state, action) => {
      state.announcements = state.announcements.map(announcement => 
        announcement._id === action.payload._id ? action.payload : announcement
      );
      if (state.currentAnnouncement && state.currentAnnouncement._id === action.payload._id) {
        state.currentAnnouncement = action.payload;
      }
    },
    removeAnnouncement: (state, action) => {
      state.announcements = state.announcements.filter(announcement => announcement._id !== action.payload);
      if (state.currentAnnouncement && state.currentAnnouncement._id === action.payload) {
        state.currentAnnouncement = null;
      }
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadNotificationsCount += 1;
    },
    setCommunicationError: (state, action) => {
      state.error = action.payload;
    },
    clearCommunicationError: (state) => {
      state.error = null;
    },
    clearCurrentMessage: (state) => {
      state.currentMessage = null;
    },
    clearCurrentAnnouncement: (state) => {
      state.currentAnnouncement = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize socket
      .addCase(initializeSocket.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeSocket.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeSocket.rejected, (state, action) => {
        state.loading = false;
        state.socketConnected = false;
        state.error = action.payload || 'Failed to connect to socket';
      })
      
      // Disconnect socket
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.socketConnected = false;
      })
      
      // Get inbox messages
      .addCase(getInboxMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getInboxMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.inboxMessages = action.payload;
        state.error = null;
      })
      .addCase(getInboxMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get outbox messages
      .addCase(getOutboxMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOutboxMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.outboxMessages = action.payload;
        state.error = null;
      })
      .addCase(getOutboxMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get message by ID
      .addCase(getMessageById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessageById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMessage = action.payload;
        state.error = null;
      })
      .addCase(getMessageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Add to outbox if it's a new message
        if (action.payload.messageId) {
          state.outboxMessages.unshift({
            _id: action.payload.messageId,
            ...action.meta.arg
          });
        }
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete message
      .addCase(deleteMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.inboxMessages = state.inboxMessages.filter(message => message._id !== action.payload);
        state.outboxMessages = state.outboxMessages.filter(message => message._id !== action.payload);
        if (state.currentMessage && state.currentMessage._id === action.payload) {
          state.currentMessage = null;
        }
        state.error = null;
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get announcements
      .addCase(getAnnouncements.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = action.payload;
        state.error = null;
      })
      .addCase(getAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get announcement by ID
      .addCase(getAnnouncementById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAnnouncementById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnnouncement = action.payload;
        state.error = null;
      })
      .addCase(getAnnouncementById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create announcement
      .addCase(createAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update announcement
      .addCase(updateAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = state.announcements.map(announcement => 
          announcement._id === action.payload._id ? action.payload : announcement
        );
        if (state.currentAnnouncement && state.currentAnnouncement._id === action.payload._id) {
          state.currentAnnouncement = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete announcement
      .addCase(deleteAnnouncement.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = state.announcements.filter(announcement => announcement._id !== action.payload);
        if (state.currentAnnouncement && state.currentAnnouncement._id === action.payload) {
          state.currentAnnouncement = null;
        }
        state.error = null;
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get notifications
      .addCase(getNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadNotificationsCount = action.payload.filter(notification => !notification.read).length;
        state.error = null;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark notification as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = state.notifications.map(notification => 
          notification._id === action.payload._id ? action.payload : notification
        );
        state.unreadNotificationsCount = state.notifications.filter(notification => !notification.read).length;
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Mark all notifications as read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.loading = false;
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString()
        }));
        state.unreadNotificationsCount = 0;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false;
        const deletedNotification = state.notifications.find(notification => notification._id === action.payload);
        state.notifications = state.notifications.filter(notification => notification._id !== action.payload);
        if (deletedNotification && !deletedNotification.read) {
          state.unreadNotificationsCount -= 1;
        }
        state.error = null;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setSocketConnected,
  addMessage,
  addAnnouncement,
  updateAnnouncementInState,
  removeAnnouncement,
  addNotification,
  setCommunicationError,
  clearCommunicationError,
  clearCurrentMessage,
  clearCurrentAnnouncement
} = communicationSlice.actions;

export default communicationSlice.reducer;
