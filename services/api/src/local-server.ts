import http from 'node:http';
import { URL } from 'node:url';
import { handler as health } from './handlers/health.js';
import { handler as trayWebhook } from './handlers/tray-webhook.js';
import { listStudents, getStudent, createStudent, updateStudent, deleteStudent } from './handlers/students-simple.js';
import { handler as attendance } from './handlers/attendance.js';
import { 
  listAdmissions, 
  getAdmission, 
  createAdmission, 
  updateAdmission, 
  deleteAdmission,
  generatePresignedUrl,
  addDocument,
  convertToStudent
} from './handlers/admissions-simple.js';

// Set environment variables for local development
process.env.TRAY_WEBHOOK_SECRET = process.env.TRAY_WEBHOOK_SECRET || 'dev-secret-for-local-testing';
process.env.TABLE_NAME = process.env.TABLE_NAME || 'gsos-dev-table';
process.env.USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_example';
process.env.STUDENTS_TABLE = process.env.STUDENTS_TABLE || 'gsos-dev-students';
process.env.GUARDIANS_TABLE = process.env.GUARDIANS_TABLE || 'gsos-dev-guardians';
process.env.ATTENDANCE_TABLE = process.env.ATTENDANCE_TABLE || 'gsos-dev-attendance';
process.env.BEHAVIOUR_TABLE = process.env.BEHAVIOUR_TABLE || 'gsos-dev-behaviour';
process.env.ADMISSIONS_TABLE = process.env.ADMISSIONS_TABLE || 'gsos-dev-admissions';
process.env.INVOICES_TABLE = process.env.INVOICES_TABLE || 'gsos-dev-invoices';
process.env.PAYMENTS_TABLE = process.env.PAYMENTS_TABLE || 'gsos-dev-payments';
process.env.DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || 'gsos-dev-docs';

const server = http.createServer(async (req, res) => {
  const url = req.url || '';
  const method = req.method || 'GET';
  const parsedUrl = new URL(url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const pathSegments = pathname.split('/').filter(Boolean);



  // Helper function to handle response
  const handleResponse = (out: any) => {
    if (out && typeof out === 'object' && 'statusCode' in out) {
      res.writeHead(out.statusCode || 200, out.headers as any);
      res.end(out.body);
    } else {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Handler error' }));
    }
  };

  // Helper function to get request body
  const getBody = (): Promise<string> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        resolve(body);
      });
    });
  };

  try {
    // Health endpoint (V2 handler - 1 argument)
      if (pathname === '/health' && method === 'GET') {
        const mockEventV2 = {
          requestContext: { http: { method } },
          rawPath: pathname,
          body: null,
          queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
          pathParameters: {}
        };
        const out = await health(mockEventV2 as any, {} as any, () => {});
        handleResponse(out);
        return;
      }

      // Tray webhook endpoint (V2 handler - 1 argument)
      if (pathname === '/tray-webhook' && method === 'POST') {
        const body = await getBody();
        const mockEventV2 = {
          requestContext: { http: { method } },
          rawPath: pathname,
          body: body,
          queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
          pathParameters: {}
        };
        const out = await trayWebhook(mockEventV2 as any, {} as any, () => {});
      handleResponse(out);
      return;
    }

    // Students endpoints (V2 handler - 1 argument)
    if (pathname === '/students' && (method === 'GET' || method === 'POST')) {
      const body = method === 'POST' ? await getBody() : '';
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = method === 'POST' 
        ? await createStudent(mockEventV2 as any)
        : await listStudents(mockEventV2 as any);
      handleResponse(out);
      return;
    }

    if (pathSegments[0] === 'students' && pathSegments[1] && (method === 'GET' || method === 'PATCH' || method === 'DELETE')) {
      const body = method === 'PATCH' ? await getBody() : '';
      const pathParameters = { id: pathSegments[1] };
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      let out;
      if (method === 'GET') {
        out = await getStudent(mockEventV2 as any);
      } else if (method === 'PATCH') {
        out = await updateStudent(mockEventV2 as any);
      } else if (method === 'DELETE') {
        out = await deleteStudent(mockEventV2 as any);
      }
      handleResponse(out);
      return;
    }

    // Attendance endpoints (V2 handler - 1 argument)
    if (pathname === '/attendance' && (method === 'GET' || method === 'POST')) {
      const body = method === 'POST' ? await getBody() : '';
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await attendance(mockEventV2 as any, {} as any, () => {});
      handleResponse(out);
      return;
    }

    if (pathSegments[0] === 'attendance' && pathSegments[1] && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
      const body = method === 'PUT' ? await getBody() : '';
      const pathParameters = { id: pathSegments[1] };
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      const out = await attendance(mockEventV2 as any, {} as any, () => {});
      handleResponse(out);
      return;
    }

    // Attendance student endpoint (V2 handler - 1 argument)
    if (pathSegments[0] === 'attendance' && pathSegments[1] === 'student' && pathSegments[2] && method === 'GET') {
      const pathParameters = { studentId: pathSegments[2] };
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      const out = await attendance(mockEventV2 as any, {} as any, () => {});
      handleResponse(out);
      return;
    }

    // Attendance class endpoint (V2 handler - 1 argument)
    if (pathSegments[0] === 'attendance' && pathSegments[1] === 'class' && pathSegments[2] && method === 'GET') {
      const pathParameters = { classId: pathSegments[2] };
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      const out = await attendance(mockEventV2 as any, {} as any, () => {});
      handleResponse(out);
      return;
    }

    // Attendance bulk endpoint (V2 handler - 1 argument)
    if (pathname === '/attendance/bulk' && method === 'POST') {
      const body = await getBody();
      const mockEventV2 = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await attendance(mockEventV2 as any, {} as any, () => {});
      handleResponse(out);
      return;
    }

    // Admissions endpoints
    if (pathname === '/admissions' && (method === 'GET' || method === 'POST')) {
      const body = method === 'POST' ? await getBody() : '';
      const mockEvent = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      let out;
      if (method === 'GET') {
        out = await listAdmissions(mockEvent);
      } else {
        out = await createAdmission(mockEvent);
      }
      handleResponse(out);
      return;
    }

    if (pathSegments[0] === 'admissions' && pathSegments[1] && (method === 'GET' || method === 'PATCH' || method === 'DELETE')) {
      const body = method === 'PATCH' ? await getBody() : '';
      const pathParameters = { id: pathSegments[1] };
      const mockEvent = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      let out;
      if (method === 'GET') {
        out = await getAdmission(mockEvent);
      } else if (method === 'PATCH') {
        out = await updateAdmission(mockEvent);
      } else if (method === 'DELETE') {
        out = await deleteAdmission(mockEvent);
      }
      handleResponse(out);
      return;
    }

    // Admissions document upload pre-signed URL
    if (pathname === '/admissions/upload-url' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await generatePresignedUrl(mockEvent);
      handleResponse(out);
      return;
    }

    // Admissions document addition
    if (pathSegments[0] === 'admissions' && pathSegments[1] && pathSegments[2] === 'documents' && method === 'POST') {
      const body = await getBody();
      const pathParameters = { id: pathSegments[1] };
      const mockEvent = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: body,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      const out = await addDocument(mockEvent);
      handleResponse(out);
      return;
    }

    // Admissions conversion to student
    if (pathSegments[0] === 'admissions' && pathSegments[1] && pathSegments[2] === 'convert' && method === 'POST') {
      const pathParameters = { id: pathSegments[1] };
      const mockEvent = {
        requestContext: { http: { method } },
        rawPath: pathname,
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      const out = await convertToStudent(mockEvent);
      handleResponse(out);
      return;
    }

    // 404 for all other routes
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(7071, () => {
  console.log('Local API listening on http://localhost:7071');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /tray/webhook');
  console.log('  GET  /students');
  console.log('  POST /students');
  console.log('  GET  /students/{id}');
  console.log('  PATCH /students/{id}');
  console.log('  DELETE /students/{id}');
  console.log('  GET  /attendance');
  console.log('  POST /attendance');
  console.log('  GET  /attendance/{id}');
  console.log('  PUT  /attendance/{id}');
  console.log('  DELETE /attendance/{id}');
  console.log('  GET  /attendance/student/{studentId}');
  console.log('  GET  /attendance/class/{classId}');
  console.log('  POST /attendance/bulk');
  console.log(`Using TRAY_WEBHOOK_SECRET: ${process.env.TRAY_WEBHOOK_SECRET}`);
});
