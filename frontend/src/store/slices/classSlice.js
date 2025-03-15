import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Get all classes
export const getClasses = createAsyncThunk(
  'classes/getClasses',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await axios.get(`${API_URL}/classes?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch classes');
    }
  }
);

// Get class by ID
export const getClassById = createAsyncThunk(
  'classes/getClassById',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/classes/${classId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch class');
    }
  }
);

// Create class
export const createClass = createAsyncThunk(
  'classes/createClass',
  async (classData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/classes`, classData);
      return response.data.class;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create class');
    }
  }
);

// Update class
export const updateClass = createAsyncThunk(
  'classes/updateClass',
  async ({ classId, classData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/classes/${classId}`, classData);
      return response.data.class;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update class');
    }
  }
);

// Delete class
export const deleteClass = createAsyncThunk(
  'classes/deleteClass',
  async (classId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/classes/${classId}`);
      return classId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete class');
    }
  }
);

// Enroll in class
export const enrollInClass = createAsyncThunk(
  'classes/enrollInClass',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/enrollments`, { classId });
      return response.data.enrollment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to enroll in class');
    }
  }
);

// Get student enrollments
export const getStudentEnrollments = createAsyncThunk(
  'classes/getStudentEnrollments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/enrollments/student`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch enrollments');
    }
  }
);

// Get class enrollments
export const getClassEnrollments = createAsyncThunk(
  'classes/getClassEnrollments',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/enrollments/class/${classId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch class enrollments');
    }
  }
);

// Update enrollment status
export const updateEnrollmentStatus = createAsyncThunk(
  'classes/updateEnrollmentStatus',
  async ({ enrollmentId, status }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/enrollments/${enrollmentId}`, { status });
      return response.data.enrollment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update enrollment status');
    }
  }
);

// Record attendance
export const recordAttendance = createAsyncThunk(
  'classes/recordAttendance',
  async ({ enrollmentId, attendanceData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/enrollments/${enrollmentId}/attendance`, attendanceData);
      return response.data.enrollment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record attendance');
    }
  }
);

// Initial state
const initialState = {
  classes: [],
  currentClass: null,
  enrollments: [],
  classEnrollments: [],
  loading: false,
  error: null
};

// Class slice
const classSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    clearClassError: (state) => {
      state.error = null;
    },
    clearCurrentClass: (state) => {
      state.currentClass = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get classes
      .addCase(getClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(getClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
        state.error = null;
      })
      .addCase(getClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get class by ID
      .addCase(getClassById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getClassById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentClass = action.payload;
        state.error = null;
      })
      .addCase(getClassById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create class
      .addCase(createClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes.push(action.payload);
        state.error = null;
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update class
      .addCase(updateClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = state.classes.map(cls => 
          cls._id === action.payload._id ? action.payload : cls
        );
        if (state.currentClass && state.currentClass._id === action.payload._id) {
          state.currentClass = action.payload;
        }
        state.error = null;
      })
      .addCase(updateClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete class
      .addCase(deleteClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = state.classes.filter(cls => cls._id !== action.payload);
        if (state.currentClass && state.currentClass._id === action.payload) {
          state.currentClass = null;
        }
        state.error = null;
      })
      .addCase(deleteClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Enroll in class
      .addCase(enrollInClass.pending, (state) => {
        state.loading = true;
      })
      .addCase(enrollInClass.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments.push(action.payload);
        state.error = null;
      })
      .addCase(enrollInClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get student enrollments
      .addCase(getStudentEnrollments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getStudentEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = action.payload;
        state.error = null;
      })
      .addCase(getStudentEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get class enrollments
      .addCase(getClassEnrollments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getClassEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.classEnrollments = action.payload;
        state.error = null;
      })
      .addCase(getClassEnrollments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update enrollment status
      .addCase(updateEnrollmentStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateEnrollmentStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = state.enrollments.map(enrollment => 
          enrollment._id === action.payload._id ? action.payload : enrollment
        );
        state.classEnrollments = state.classEnrollments.map(item => 
          item.enrollment._id === action.payload._id 
            ? { ...item, enrollment: action.payload } 
            : item
        );
        state.error = null;
      })
      .addCase(updateEnrollmentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Record attendance
      .addCase(recordAttendance.pending, (state) => {
        state.loading = true;
      })
      .addCase(recordAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.classEnrollments = state.classEnrollments.map(item => 
          item.enrollment._id === action.payload._id 
            ? { ...item, enrollment: action.payload } 
            : item
        );
        state.error = null;
      })
      .addCase(recordAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearClassError, clearCurrentClass } = classSlice.actions;

export default classSlice.reducer;
