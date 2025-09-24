import { Duration, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { 
  UserPool, 
  AccountRecovery, 
  Mfa, 
  UserPoolClient, 
  CfnUserPoolGroup,
  UserPoolOperation,
  PasswordPolicy,
  SignInAliases,
  StandardAttribute,
  StringAttribute,
  UserPoolClientIdentityProvider,
  ClientAttributes
} from 'aws-cdk-lib/aws-cognito';
import { NodejsFunction, BundlingOptions, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'node:path';

export class AuthStack extends Stack {
  readonly userPool: UserPool;
  readonly userPoolClient: UserPoolClient;
  readonly postConfirmationTrigger: NodejsFunction;
  readonly preTokenGenerationTrigger: NodejsFunction;
  readonly userGroups: { [key: string]: CfnUserPoolGroup };

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Common bundling options for Lambda functions
    const bundling: BundlingOptions = {
      forceDockerBundling: false,
      externalModules: ['aws-sdk', '@aws-sdk/*'],
      minify: true,
      sourceMap: false,
      target: 'node20',
      format: OutputFormat.CJS,
    };

    // Post-confirmation Lambda trigger for user setup
    this.postConfirmationTrigger = new NodejsFunction(this, 'PostConfirmationTrigger', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/auth/src/post-confirm.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        USER_POOL_ID: '', // Will be set after user pool creation
      }
    });

    // Pre-token generation Lambda trigger for custom claims
    this.preTokenGenerationTrigger = new NodejsFunction(this, 'PreTokenGenerationTrigger', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(__dirname, '../../../services/auth/src/pre-token-generation.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      bundling,
      environment: {
        USER_POOL_ID: '', // Will be set after user pool creation
      }
    });

    // Enhanced User Pool with comprehensive configuration
    this.userPool = new UserPool(this, 'GSOSUserPool', {
      userPoolName: 'GSOS-UserPool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
        phone: false
      },
      signInCaseSensitive: false,
      mfa: Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7)
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        },
        givenName: {
          required: true,
          mutable: true
        },
        familyName: {
          required: true,
          mutable: true
        }
      },
      customAttributes: {
        'role': new StringAttribute({ minLen: 1, maxLen: 20, mutable: true }),
        'school_id': new StringAttribute({ minLen: 1, maxLen: 50, mutable: true }),
        'student_id': new StringAttribute({ minLen: 0, maxLen: 50, mutable: true }),
        'parent_of': new StringAttribute({ minLen: 0, maxLen: 500, mutable: true }) // JSON array of student IDs
      },
      lambdaTriggers: {
        postConfirmation: this.postConfirmationTrigger,
        preTokenGeneration: this.preTokenGenerationTrigger
      },
      deletionProtection: true
    });

    // Update Lambda environment with User Pool ID
    this.postConfirmationTrigger.addEnvironment('USER_POOL_ID', this.userPool.userPoolId);
    this.preTokenGenerationTrigger.addEnvironment('USER_POOL_ID', this.userPool.userPoolId);

    // Grant Lambda permissions to manage user pool
    this.userPool.grant(this.postConfirmationTrigger, 'cognito-idp:AdminAddUserToGroup', 'cognito-idp:AdminUpdateUserAttributes');
    this.userPool.grant(this.preTokenGenerationTrigger, 'cognito-idp:AdminGetUser');

    // Create user groups for role-based access control
    this.userGroups = {
      admin: new CfnUserPoolGroup(this, 'AdminGroup', {
        userPoolId: this.userPool.userPoolId,
        groupName: 'admin',
        description: 'School administrators with full system access',
        precedence: 1
      }),
      teacher: new CfnUserPoolGroup(this, 'TeacherGroup', {
        userPoolId: this.userPool.userPoolId,
        groupName: 'teacher',
        description: 'Teachers with access to class management and student data',
        precedence: 2
      }),
      parent: new CfnUserPoolGroup(this, 'ParentGroup', {
        userPoolId: this.userPool.userPoolId,
        groupName: 'parent',
        description: 'Parents with access to their children\'s information',
        precedence: 3
      }),
      student: new CfnUserPoolGroup(this, 'StudentGroup', {
        userPoolId: this.userPool.userPoolId,
        groupName: 'student',
        description: 'Students with access to their own information',
        precedence: 4
      })
    };

    // Enhanced Web Client with better security
    this.userPoolClient = new UserPoolClient(this, 'GSOSWebClient', {
      userPool: this.userPool,
      userPoolClientName: 'GSOS-WebClient',
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
        adminUserPassword: false
      },
      generateSecret: false, // For web apps, don't generate secret
      preventUserExistenceErrors: true,
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      enableTokenRevocation: true,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO]
    });

    // Stack outputs
    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'GSOS Cognito User Pool ID',
      exportName: 'GSOS-UserPoolId'
    });
  }
}
