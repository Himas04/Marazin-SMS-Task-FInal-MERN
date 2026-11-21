const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        let token = null;
        for (const c of cookies) {
          const m = c.match(/token=([^;]+)/);
          if (m) token = m[1];
        }
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, token, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, token, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('--- 1. Login as Admin ---');
  const loginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@school.edu', password: 'admin123' }
  );

  if (loginRes.status !== 200 || !loginRes.token) {
    console.error('Admin login failed:', loginRes);
    process.exit(1);
  }
  const adminToken = loginRes.token;
  console.log('✓ Admin logged in successfully.');

  console.log('--- 2. Create Course as Admin ---');
  const code = 'TEST' + Math.floor(Math.random() * 899 + 100);
  const courseRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/courses',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Cookie: `token=${adminToken}`,
      },
    },
    {
      courseCode: code,
      courseName: 'Advanced Web Engineering & Cloud',
      description: 'Comprehensive engineering curriculum with live Zoom lectures.',
      duration: '4 Months',
      fee: 450,
      status: 'Active',
    }
  );

  if (courseRes.status !== 201) {
    console.error('Failed to create course:', courseRes);
    process.exit(1);
  }
  const courseId = courseRes.data.course._id;
  console.log(`✓ Created course "${code}" with ID: ${courseId}`);

  console.log('--- 3. Add Module with Live Zoom Session ---');
  const modRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${courseId}/modules`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Cookie: `token=${adminToken}`,
      },
    },
    {
      title: 'Module 1: Cloud Native Microservices Architecture',
      description: 'Foundations of event-driven and distributed systems.',
      content: 'Lecture notes: 1. Service decomposition. 2. API Gateways. 3. Observability.',
      duration: '2 Hours',
      zoomLink: 'https://zoom.us/j/9876543210?pwd=testpasscode',
      zoomMeetingId: '987 654 3210',
      zoomPasscode: 'cloud2026',
      liveSessionTime: 'Every Tuesday 10:00 AM',
    }
  );

  if (modRes.status !== 201) {
    console.error('Failed to add module:', modRes);
    process.exit(1);
  }
  console.log('✓ Added Module 1 with Live Zoom config.');

  console.log('--- 4. Create or Ensure Student Account ---');
  const studentEmail = `scholar_${Date.now()}@school.edu`;
  const studentStuRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        Cookie: `token=${adminToken}`,
      },
    },
    {
      studentId: 'STU' + Math.floor(Math.random() * 8999 + 1000),
      firstName: 'Samantha',
      lastName: 'Vance',
      email: studentEmail,
      phone: '+1 555-0199',
      dateOfBirth: '2002-05-14',
      gender: 'Female',
      address: '742 Evergreen Terrace',
      guardianName: 'Arthur Vance',
      guardianPhone: '+1 555-0198',
      password: 'studentpassword123',
    }
  );

  if (studentStuRes.status !== 201) {
    console.error('Failed to create student:', studentStuRes);
    process.exit(1);
  }
  console.log(`✓ Student created: ${studentEmail}`);

  console.log('--- 5. Student Login ---');
  const stuLoginRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: studentEmail, password: 'studentpassword123' }
  );

  if (stuLoginRes.status !== 200 || !stuLoginRes.token) {
    console.error('Student login failed:', stuLoginRes);
    process.exit(1);
  }
  const studentToken = stuLoginRes.token;
  console.log('✓ Student logged in successfully.');

  console.log('--- 6. Student Self-Enroll in Course ---');
  const enrollRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/enrollments/enroll',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
        Cookie: `token=${studentToken}`,
      },
    },
    { courseId }
  );

  if (enrollRes.status !== 201) {
    console.error('Student enrollment failed:', enrollRes);
    process.exit(1);
  }
  console.log('✓ Student successfully self-enrolled in the course.');

  console.log('--- 7. Student Reads Course & Modules ---');
  const getCrsRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${courseId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        Cookie: `token=${studentToken}`,
      },
    }
  );

  if (getCrsRes.status !== 200 || !getCrsRes.data.course.modules.length) {
    console.error('Failed to retrieve course modules for student:', getCrsRes);
    process.exit(1);
  }
  const loadedMod = getCrsRes.data.course.modules[0];
  console.log(`✓ Student accessed module: "${loadedMod.title}" with Zoom link: ${loadedMod.zoomLink}`);

  console.log('--- 8. Student Marks Attendance for Attending Module ---');
  const attRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/module',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
        Cookie: `token=${studentToken}`,
      },
    },
    {
      courseId,
      moduleTitle: loadedMod.title,
    }
  );

  if (attRes.status !== 201) {
    console.error('Failed to mark module attendance:', attRes);
    process.exit(1);
  }
  console.log(`✓ Module attendance logged successfully: ${attRes.data.attendance.moduleTitle}`);

  console.log('--- 9. Duplicate Attendance Prevention Test ---');
  const dupRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/module',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
        Cookie: `token=${studentToken}`,
      },
    },
    {
      courseId,
      moduleTitle: loadedMod.title,
    }
  );

  if (dupRes.status === 400) {
    console.log('✓ Duplicate attendance for the same module on the same day correctly prevented.');
  } else {
    console.error('Expected duplicate check error 400 but got:', dupRes.status);
    process.exit(1);
  }

  console.log('\n=============================================');
  console.log('ALL API & FEATURE CHECKS PASSED PERFECTLY! 🎓');
  console.log('=============================================');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
