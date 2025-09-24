import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Table, AttributeType, BillingMode, ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, BlockPublicAccess, BucketEncryption } from 'aws-cdk-lib/aws-s3';

export class DataStack extends Stack {
  readonly studentsTable: Table;
  readonly guardiansTable: Table;
  readonly attendanceTable: Table;
  readonly behaviourTable: Table;
  readonly admissionsTable: Table;
  readonly invoicesTable: Table;
  readonly paymentsTable: Table;
  readonly documentsS3Bucket: Bucket;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Students Table: pk: schoolId#studentId, sk: type#ts
    this.studentsTable = new Table(this, 'StudentsTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#studentId
      sortKey: { name: 'sk', type: AttributeType.STRING }, // type#timestamp
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for school lookups: GSI1PK = schoolId, GSI1SK = grade#yearGroup
    this.studentsTable.addGlobalSecondaryIndex({
      indexName: 'SchoolIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for guardian lookups: GSI2PK = guardianId, GSI2SK = schoolId#studentId
    this.studentsTable.addGlobalSecondaryIndex({
      indexName: 'GuardianIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Guardians Table: pk: schoolId#guardianId, sk: type#ts
    this.guardiansTable = new Table(this, 'GuardiansTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#guardianId
      sortKey: { name: 'sk', type: AttributeType.STRING }, // type#timestamp
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for school lookups: GSI1PK = schoolId, GSI1SK = lastName#firstName
    this.guardiansTable.addGlobalSecondaryIndex({
      indexName: 'SchoolIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for student lookups: GSI2PK = studentId, GSI2SK = schoolId#guardianId
    this.guardiansTable.addGlobalSecondaryIndex({
      indexName: 'StudentIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Attendance Table: pk: schoolId#date, sk: studentId
    this.attendanceTable = new Table(this, 'AttendanceTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#date (YYYY-MM-DD)
      sortKey: { name: 'sk', type: AttributeType.STRING }, // studentId
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for student attendance history: GSI1PK = schoolId#studentId, GSI1SK = date
    this.attendanceTable.addGlobalSecondaryIndex({
      indexName: 'StudentAttendanceIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for class attendance: GSI2PK = schoolId#classId#date, GSI2SK = studentId
    this.attendanceTable.addGlobalSecondaryIndex({
      indexName: 'ClassAttendanceIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Behaviour Table: pk: schoolId#studentId, sk: timestamp
    this.behaviourTable = new Table(this, 'BehaviourTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#studentId
      sortKey: { name: 'sk', type: AttributeType.STRING }, // timestamp (ISO string)
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for school behaviour overview: GSI1PK = schoolId, GSI1SK = timestamp
    this.behaviourTable.addGlobalSecondaryIndex({
      indexName: 'SchoolBehaviourIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for safeguarding incidents: GSI2PK = schoolId#safeguarding, GSI2SK = timestamp
    this.behaviourTable.addGlobalSecondaryIndex({
      indexName: 'SafeguardingIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for teacher behaviour reports: GSI3PK = schoolId#teacherId, GSI3SK = timestamp
    this.behaviourTable.addGlobalSecondaryIndex({
      indexName: 'TeacherBehaviourIndex',
      partitionKey: { name: 'GSI3PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Admissions Table: pk: schoolId#applicationId, sk: timestamp
    this.admissionsTable = new Table(this, 'AdmissionsTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#applicationId
      sortKey: { name: 'sk', type: AttributeType.STRING }, // timestamp
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for school admissions by status: GSI1PK = schoolId#status, GSI1SK = timestamp
    this.admissionsTable.addGlobalSecondaryIndex({
      indexName: 'SchoolStatusIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for admissions by grade: GSI2PK = schoolId#appliedGrade, GSI2SK = timestamp
    this.admissionsTable.addGlobalSecondaryIndex({
      indexName: 'GradeIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for guardian applications: GSI3PK = guardianEmail, GSI3SK = timestamp
    this.admissionsTable.addGlobalSecondaryIndex({
      indexName: 'GuardianApplicationIndex',
      partitionKey: { name: 'GSI3PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Invoices Table: pk: schoolId#invoiceId, sk: studentId
    this.invoicesTable = new Table(this, 'InvoicesTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#invoiceId
      sortKey: { name: 'sk', type: AttributeType.STRING }, // studentId
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for student invoices: GSI1PK = schoolId#studentId, GSI1SK = dueDate
    this.invoicesTable.addGlobalSecondaryIndex({
      indexName: 'StudentInvoicesIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for school invoices by status: GSI2PK = schoolId#status, GSI2SK = dueDate
    this.invoicesTable.addGlobalSecondaryIndex({
      indexName: 'SchoolInvoiceStatusIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for overdue invoices: GSI3PK = schoolId#overdue, GSI3SK = dueDate
    this.invoicesTable.addGlobalSecondaryIndex({
      indexName: 'OverdueInvoicesIndex',
      partitionKey: { name: 'GSI3PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // Payments Table: pk: schoolId#paymentId, sk: invoiceId
    this.paymentsTable = new Table(this, 'PaymentsTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING }, // schoolId#paymentId
      sortKey: { name: 'sk', type: AttributeType.STRING }, // invoiceId
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // GSI for invoice payments: GSI1PK = schoolId#invoiceId, GSI1SK = processedAt
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'InvoicePaymentsIndex',
      partitionKey: { name: 'GSI1PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI1SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for student payments: GSI2PK = schoolId#studentId, GSI2SK = processedAt
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'StudentPaymentsIndex',
      partitionKey: { name: 'GSI2PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI2SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // GSI for payment status tracking: GSI3PK = schoolId#status, GSI3SK = processedAt
    this.paymentsTable.addGlobalSecondaryIndex({
      indexName: 'PaymentStatusIndex',
      partitionKey: { name: 'GSI3PK', type: AttributeType.STRING },
      sortKey: { name: 'GSI3SK', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL
    });

    // S3 Bucket for Documents (gsos-docs)
    this.documentsS3Bucket = new Bucket(this, 'DocumentsS3Bucket', {
      bucketName: 'gsos-docs',
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN
    });

    // TODO: Add basic AV scan placeholder (Lambda trigger for S3 uploads)
    // This would typically integrate with AWS GuardDuty Malware Protection
    // or a third-party antivirus solution
  }
}
