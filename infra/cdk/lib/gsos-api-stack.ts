import { Duration, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction, BundlingOptions, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'node:path';
import { DataStack } from './gsos-data-stack';
import { AuthStack } from './gsos-auth-stack';

interface ApiProps extends StackProps {
  data: DataStack;
  auth: AuthStack;
}

export class ApiStack extends Stack {
  readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, { data, auth, ...props }: ApiProps) {
    super(scope, id, props);

    // Common bundling options for Lambda functions
    const bundling: BundlingOptions = {
      forceDockerBundling: false,
      externalModules: ['aws-sdk', '@aws-sdk/*', '@gsos/types', '@gsos/types/*'],
      minify: true,
      sourceMap: false,
      target: 'node20',
      format: OutputFormat.CJS,
    };

    const healthFn = new NodejsFunction(this, 'HealthFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/health.ts'),
      handler: 'handler',
      timeout: Duration.seconds(5),
      bundling,
      environment: {
        STUDENTS_TABLE: data.studentsTable.tableName,
        GUARDIANS_TABLE: data.guardiansTable.tableName,
        ATTENDANCE_TABLE: data.attendanceTable.tableName,
        BEHAVIOUR_TABLE: data.behaviourTable.tableName,
        ADMISSIONS_TABLE: data.admissionsTable.tableName,
        INVOICES_TABLE: data.invoicesTable.tableName,
        PAYMENTS_TABLE: data.paymentsTable.tableName,
        DOCUMENTS_BUCKET: data.documentsS3Bucket.bucketName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    // Grant read access to all tables for health checks
    data.studentsTable.grantReadData(healthFn);
    data.guardiansTable.grantReadData(healthFn);
    data.attendanceTable.grantReadData(healthFn);
    data.behaviourTable.grantReadData(healthFn);
    data.admissionsTable.grantReadData(healthFn);
    data.invoicesTable.grantReadData(healthFn);
    data.paymentsTable.grantReadData(healthFn);

    // Tray webhook Lambda function
    const trayWebhookFn = new NodejsFunction(this, 'TrayWebhookFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/tray-webhook.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        STUDENTS_TABLE: data.studentsTable.tableName,
        ATTENDANCE_TABLE: data.attendanceTable.tableName,
        USER_POOL_ID: auth.userPool.userPoolId,
        TRAY_WEBHOOK_SECRET: process.env.TRAY_WEBHOOK_SECRET || 'dev-secret-change-in-production'
      }
    });

    // Students CRUD Lambda function
    const studentsFn = new NodejsFunction(this, 'StudentsFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/students.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        STUDENTS_TABLE: data.studentsTable.tableName,
        GUARDIANS_TABLE: data.guardiansTable.tableName,
        DOCUMENTS_BUCKET: data.documentsS3Bucket.bucketName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    // Grant DynamoDB permissions
    data.studentsTable.grantReadWriteData(studentsFn);
    data.guardiansTable.grantReadWriteData(studentsFn);
    data.documentsS3Bucket.grantReadWrite(studentsFn);

    // Attendance CRUD Lambda function
    const attendanceFn = new NodejsFunction(this, 'AttendanceFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/attendance.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        ATTENDANCE_TABLE: data.attendanceTable.tableName,
        STUDENTS_TABLE: data.studentsTable.tableName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    // Grant DynamoDB permissions
    data.attendanceTable.grantReadWriteData(attendanceFn);
    data.studentsTable.grantReadData(attendanceFn);

    // Behavior & Safeguarding CRUD Lambda function
    const behaviorFn = new NodejsFunction(this, 'BehaviorFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/behavior.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        BEHAVIOUR_TABLE: data.behaviourTable.tableName,
        STUDENTS_TABLE: data.studentsTable.tableName,
        DOCUMENTS_BUCKET: data.documentsS3Bucket.bucketName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    // Grant DynamoDB permissions
    data.behaviourTable.grantReadWriteData(behaviorFn);
    data.studentsTable.grantReadData(behaviorFn);
    data.documentsS3Bucket.grantReadWrite(behaviorFn);

    // Admissions CRUD Lambda function
    const admissionsFn = new NodejsFunction(this, 'AdmissionsFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/admissions.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        ADMISSIONS_TABLE: data.admissionsTable.tableName,
        DOCUMENTS_BUCKET: data.documentsS3Bucket.bucketName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    // Grant DynamoDB permissions
    data.admissionsTable.grantReadWriteData(admissionsFn);
    data.documentsS3Bucket.grantReadWrite(admissionsFn);

    // Invoices CRUD Lambda function
    const invoicesFn = new NodejsFunction(this, 'InvoicesFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/invoices.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        INVOICES_TABLE: data.invoicesTable.tableName,
        STUDENTS_TABLE: data.studentsTable.tableName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    // Grant DynamoDB permissions
    data.invoicesTable.grantReadWriteData(invoicesFn);
    data.studentsTable.grantReadData(invoicesFn);

    // Payments CRUD Lambda function
    const paymentsFn = new NodejsFunction(this, 'PaymentsFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/api/src/handlers/payments.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        PAYMENTS_TABLE: data.paymentsTable.tableName,
        INVOICES_TABLE: data.invoicesTable.tableName,
        USER_POOL_ID: auth.userPool.userPoolId,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
      }
    });

    // Grant DynamoDB permissions
    data.paymentsTable.grantReadWriteData(paymentsFn);
    data.invoicesTable.grantReadWriteData(paymentsFn);

    this.httpApi = new HttpApi(this, 'GSOSHttpApi', {
      corsPreflight: {
        allowOrigins: [
          'https://*.vercel.app',
          'https://gsos-web.vercel.app',
          'https://gsos-admin.vercel.app',
          'http://localhost:3000',
          'http://localhost:3002'
        ],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.PUT, CorsHttpMethod.PATCH, CorsHttpMethod.DELETE],
        allowHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-student-id', 'x-school-id'],
        allowCredentials: true
      }
    });

    this.httpApi.addRoutes({
      path: '/health',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthIntegration', healthFn)
    });

    this.httpApi.addRoutes({
      path: '/tray/webhook',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('TrayWebhookIntegration', trayWebhookFn)
    });

    this.httpApi.addRoutes({
      path: '/students',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration('StudentsIntegration', studentsFn)
    });

    this.httpApi.addRoutes({
      path: '/students/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('StudentsDetailIntegration', studentsFn)
    });

    // Attendance routes
    this.httpApi.addRoutes({
      path: '/attendance',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration('AttendanceIntegration', attendanceFn)
    });

    this.httpApi.addRoutes({
      path: '/attendance/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('AttendanceDetailIntegration', attendanceFn)
    });

    this.httpApi.addRoutes({
      path: '/attendance/student/{studentId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('StudentAttendanceIntegration', attendanceFn)
    });

    this.httpApi.addRoutes({
      path: '/attendance/class/{classId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('ClassAttendanceIntegration', attendanceFn)
    });

    this.httpApi.addRoutes({
      path: '/attendance/bulk',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('BulkAttendanceIntegration', attendanceFn)
    });

    // Behavior & Safeguarding routes
    this.httpApi.addRoutes({
      path: '/behavior',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration('BehaviorIntegration', behaviorFn)
    });

    this.httpApi.addRoutes({
      path: '/behavior/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('BehaviorDetailIntegration', behaviorFn)
    });

    this.httpApi.addRoutes({
      path: '/behavior/student/{studentId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('StudentBehaviorIntegration', behaviorFn)
    });

    this.httpApi.addRoutes({
      path: '/behavior/teacher/{teacherId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('TeacherBehaviorIntegration', behaviorFn)
    });

    this.httpApi.addRoutes({
      path: '/behavior/class/{classId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('ClassBehaviorIntegration', behaviorFn)
    });

    // Admissions routes
    this.httpApi.addRoutes({
      path: '/admissions',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration('AdmissionsIntegration', admissionsFn)
    });

    this.httpApi.addRoutes({
      path: '/admissions/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('AdmissionsDetailIntegration', admissionsFn)
    });

    this.httpApi.addRoutes({
      path: '/admissions/{id}/documents',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('AdmissionDocumentsIntegration', admissionsFn)
    });

    this.httpApi.addRoutes({
      path: '/admissions/{id}/assessment',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('AdmissionAssessmentIntegration', admissionsFn)
    });

    this.httpApi.addRoutes({
      path: '/admissions/{id}/decision',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('AdmissionDecisionIntegration', admissionsFn)
    });

    this.httpApi.addRoutes({
      path: '/admissions/{id}/convert',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('AdmissionConvertIntegration', admissionsFn)
    });

    this.httpApi.addRoutes({
      path: '/admissions/school/{schoolId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('SchoolAdmissionsIntegration', admissionsFn)
    });

    // Invoices routes
    this.httpApi.addRoutes({
      path: '/invoices',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration('InvoicesIntegration', invoicesFn)
    });

    this.httpApi.addRoutes({
      path: '/invoices/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('InvoicesDetailIntegration', invoicesFn)
    });

    this.httpApi.addRoutes({
      path: '/invoices/student/{studentId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('StudentInvoicesIntegration', invoicesFn)
    });

    this.httpApi.addRoutes({
      path: '/invoices/school/{schoolId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('SchoolInvoicesIntegration', invoicesFn)
    });

    this.httpApi.addRoutes({
      path: '/invoices/{id}/send',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('SendInvoiceIntegration', invoicesFn)
    });

    this.httpApi.addRoutes({
      path: '/invoices/{id}/paid',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('MarkInvoicePaidIntegration', invoicesFn)
    });

    this.httpApi.addRoutes({
      path: '/invoices/{id}/cancel',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('CancelInvoiceIntegration', invoicesFn)
    });

    // Payments routes
    this.httpApi.addRoutes({
      path: '/payments',
      methods: [HttpMethod.GET, HttpMethod.POST],
      integration: new HttpLambdaIntegration('PaymentsIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/{id}',
      methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.DELETE],
      integration: new HttpLambdaIntegration('PaymentsDetailIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/student/{studentId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('StudentPaymentsIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/school/{schoolId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('SchoolPaymentsIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/invoice/{invoiceId}',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('InvoicePaymentsIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/{id}/refund',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('RefundPaymentIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/stripe/intent',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('StripeIntentIntegration', paymentsFn)
    });

    this.httpApi.addRoutes({
      path: '/payments/stripe/webhook',
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration('StripeWebhookIntegration', paymentsFn)
    });

    // Stack outputs
    new CfnOutput(this, 'ApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'GSOS API Gateway URL',
      exportName: 'GSOS-ApiUrl'
    });
  }
}
