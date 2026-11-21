// API Client for Student Management System
const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // for cookies
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication API
export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (data) => apiRequest('/auth/update-profile', { method: 'PUT', body: data }),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'PUT', body: data }),
};

// Staff Management API (Admin only)
export const staffApi = {
  getAll: () => apiRequest('/users/staff'),
  create: (data) => apiRequest('/users/staff', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/users/staff/${id}`, { method: 'PUT', body: data }),
  resetPassword: (id, newPassword) => apiRequest(`/users/staff/${id}/reset-password`, { method: 'POST', body: { newPassword } }),
  delete: (id) => apiRequest(`/users/staff/${id}`, { method: 'DELETE' }),
};

// Students API
export const studentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    return apiRequest(`/students?${query.toString()}`);
  },
  getOne: (id) => apiRequest(`/students/${id}`),
  getMyProfile: () => apiRequest('/students/profile/me'),
  create: (data) => apiRequest('/students', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/students/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/students/${id}`, { method: 'DELETE' }),
};

// Courses API (with Modules & Live Zoom Sessions)
export const coursesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    return apiRequest(`/courses?${query.toString()}`);
  },
  getOne: (id) => apiRequest(`/courses/${id}`),
  create: (data) => apiRequest('/courses', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/courses/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/courses/${id}`, { method: 'DELETE' }),

  // Course Modules & Zoom Sessions
  addModule: (courseId, moduleData) => 
    apiRequest(`/courses/${courseId}/modules`, { method: 'POST', body: moduleData }),
  updateModule: (courseId, moduleId, moduleData) => 
    apiRequest(`/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: moduleData }),
  deleteModule: (courseId, moduleId) => 
    apiRequest(`/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' }),
};

// Enrollments API
export const enrollmentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.course) query.set('course', params.course);
    if (params.student) query.set('student', params.student);
    if (params.status) query.set('status', params.status);
    return apiRequest(`/enrollments?${query.toString()}`);
  },
  getMy: () => apiRequest('/enrollments/my'),
  getOne: (id) => apiRequest(`/enrollments/${id}`),
  create: (data) => apiRequest('/enrollments', { method: 'POST', body: data }),
  enrollInCourse: (courseId, batch = '2026-Cohort') => 
    apiRequest('/enrollments', { method: 'POST', body: { course: courseId, batch } }),
  update: (id, data) => apiRequest(`/enrollments/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/enrollments/${id}`, { method: 'DELETE' }),
};

// Attendance API (General & Per-Module Live Session)
export const attendanceApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.course) query.set('course', params.course);
    if (params.student) query.set('student', params.student);
    if (params.date) query.set('date', params.date);
    if (params.status) query.set('status', params.status);
    if (params.moduleTitle) query.set('moduleTitle', params.moduleTitle);
    return apiRequest(`/attendance?${query.toString()}`);
  },
  getMy: () => apiRequest('/attendance/my'),
  getOne: (id) => apiRequest(`/attendance/${id}`),
  create: (data) => apiRequest('/attendance', { method: 'POST', body: data }),
  markModuleAttendance: (courseId, moduleTitle, sessionPin = '', remarks = '') => 
    apiRequest('/attendance', { 
      method: 'POST', 
      body: { 
        course: courseId, 
        moduleTitle, 
        sessionPin: sessionPin || undefined,
        status: 'Present',
        remarks: remarks || `Attended live session / completed: ${moduleTitle}`
      } 
    }),
  update: (id, data) => apiRequest(`/attendance/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/attendance/${id}`, { method: 'DELETE' }),
};

// Announcements API (Notice Board)
export const announcementsApi = {
  getAll: () => apiRequest('/announcements'),
  create: (data) => apiRequest('/announcements', { method: 'POST', body: data }),
  delete: (id) => apiRequest(`/announcements/${id}`, { method: 'DELETE' }),
};
