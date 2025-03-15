import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get all content items for a class
export const getContentItems = createAsyncThunk(
  'content/getContentItems',
  async ({ classId, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`${API_URL}/content/content-items/class/${classId}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content items');
    }
  }
);

// Get content item by ID
export const getContentItemById = createAsyncThunk(
  'content/getContentItemById',
  async (contentItemId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/content/content-items/${contentItemId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content item');
    }
  }
);

// Create content item
export const createContentItem = createAsyncThunk(
  'content/createContentItem',
  async (contentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/content/content-items`, contentData);
      return response.data.contentItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create content item');
    }
  }
);

// Update content item
export const updateContentItem = createAsyncThunk(
  'content/updateContentItem',
  async ({ contentItemId, contentData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/content/content-items/${contentItemId}`, contentData);
      return response.data.contentItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update content item');
    }
  }
);

// Delete content item
export const deleteContentItem = createAsyncThunk(
  'content/deleteContentItem',
  async (contentItemId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/content/content-items/${contentItemId}`);
      return contentItemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete content item');
    }
  }
);

// Upload attachment for content item
export const uploadContentAttachment = createAsyncThunk(
  'content/uploadContentAttachment',
  async ({ contentItemId, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_URL}/content/content-items/${contentItemId}/attachments`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.contentItem;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload attachment');
    }
  }
);

// Get all content modules for a class
export const getContentModules = createAsyncThunk(
  'content/getContentModules',
  async ({ classId, filters = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`${API_URL}/content/content-modules/class/${classId}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content modules');
    }
  }
);

// Get content module by ID
export const getContentModuleById = createAsyncThunk(
  'content/getContentModuleById',
  async (moduleId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/content/content-modules/${moduleId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch content module');
    }
  }
);

// Create content module
export const createContentModule = createAsyncThunk(
  'content/createContentModule',
  async (moduleData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/content/content-modules`, moduleData);
      return response.data.contentModule;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create content module');
    }
  }
);

// Update content module
export const updateContentModule = createAsyncThunk(
  'content/updateContentModule',
  async ({ moduleId, moduleData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/content/content-modules/${moduleId}`, moduleData);
      return response.data.contentModule;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update content module');
    }
  }
);

// Delete content module
export const deleteContentModule = createAsyncThunk(
  'content/deleteContentModule',
  async (moduleId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/content/content-modules/${moduleId}`);
      return moduleId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete content module');
    }
  }
);

// Initial state
const initialState = {
  contentItems: [],
  currentContentItem: null,
  contentModules: [],
  currentContentModule: null,
  loading: false,
  error: null
};

// Content slice
const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearContentError: (state) => {
      state.error = null;
    },
    clearCurrentContentItem: (state) => {
      state.currentContentItem = null;
    },
    clearCurrentContentModule: (state) => {
      state.currentContentModule = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get content items
      .addCase(getContentItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(getContentItems.fulfilled, (state, action) => {
        state.loading = false;
        state.contentItems = action.payload;
        state.error = null;
      })
      .addCase(getContentItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get content item by ID
      .addCase(getContentItemById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getContentItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContentItem = action.payload;
        state.error = null;
      })
      .addCase(getContentItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create content item
      .addCase(createContentItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContentItem.fulfilled, (state, action) => {
        state.loading = false;
        state.contentItems.push(action.payload);
        state.error = null;
      })
      .addCase(createContentItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update content item
      .addCase(updateContentItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateContentItem.fulfilled, (state, action) => {
        state.loading = false;
        state.contentItems = state.contentItems.map(item => 
          item._id === action.payload._id ? action.payload : item
        );
        if (state.currentContentItem && state.currentContentItem._id === action.payload._id) {
          state.currentContentItem = action.payload;
        }
        state.error = null;
      })
      .addCase(updateContentItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete content item
      .addCase(deleteContentItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContentItem.fulfilled, (state, action) => {
        state.loading = false;
        state.contentItems = state.contentItems.filter(item => item._id !== action.payload);
        if (state.currentContentItem && state.currentContentItem._id === action.payload) {
          state.currentContentItem = null;
        }
        state.error = null;
      })
      .addCase(deleteContentItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload attachment
      .addCase(uploadContentAttachment.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadContentAttachment.fulfilled, (state, action) => {
        state.loading = false;
        state.contentItems = state.contentItems.map(item => 
          item._id === action.payload._id ? action.payload : item
        );
        if (state.currentContentItem && state.currentContentItem._id === action.payload._id) {
          state.currentContentItem = action.payload;
        }
        state.error = null;
      })
      .addCase(uploadContentAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get content modules
      .addCase(getContentModules.pending, (state) => {
        state.loading = true;
      })
      .addCase(getContentModules.fulfilled, (state, action) => {
        state.loading = false;
        state.contentModules = action.payload;
        state.error = null;
      })
      .addCase(getContentModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get content module by ID
      .addCase(getContentModuleById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getContentModuleById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentContentModule = action.payload;
        state.error = null;
      })
      .addCase(getContentModuleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create content module
      .addCase(createContentModule.pending, (state) => {
        state.loading = true;
      })
      .addCase(createContentModule.fulfilled, (state, action) => {
        state.loading = false;
        state.contentModules.push(action.payload);
        state.error = null;
      })
      .addCase(createContentModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update content module
      .addCase(updateContentModule.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateContentModule.fulfilled, (state, action) => {
        state.loading = false;
        state.contentModules = state.contentModules.map(module => 
          module._id === action.payload._id ? action.payload : module
        );
        if (state.currentContentModule && state.currentContentModule._id === action.payload._id) {
          state.currentContentModule = action.payload;
        }
        state.error = null;
      })
      .addCase(updateContentModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete content module
      .addCase(deleteContentModule.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContentModule.fulfilled, (state, action) => {
        state.loading = false;
        state.contentModules = state.contentModules.filter(module => module._id !== action.payload);
        if (state.currentContentModule && state.currentContentModule._id === action.payload) {
          state.currentContentModule = null;
        }
        state.error = null;
      })
      .addCase(deleteContentModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearContentError, clearCurrentContentItem, clearCurrentContentModule } = contentSlice.actions;

export default contentSlice.reducer;
