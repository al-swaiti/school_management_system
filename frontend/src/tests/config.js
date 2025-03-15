// Test configuration file for the School Management System
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  testUser: {
    admin: {
      email: 'admin@test.com',
      password: 'password123'
    },
    teacher: {
      email: 'teacher@test.com',
      password: 'password123'
    },
    student: {
      email: 'student@test.com',
      password: 'password123'
    }
  }
};

export default config;
