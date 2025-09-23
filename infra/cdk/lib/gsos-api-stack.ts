import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HttpApi, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'node:path';
import { DataStack } from './gsos-data-stack.js';
import { AuthStack } from './gsos-auth-stack.js';

interface ApiProps extends StackProps {
  data: DataStack;
  auth: AuthStack;
}

export class ApiStack extends Stack {
  readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, { data, auth, ...props }: ApiProps) {
    super(scope, id, props);

    const healthFn = new NodejsFunction(this, 'HealthFn', {
      runtime: Runtime.NODEJS_20_X,
      entry: join(process.cwd(), 'services/api/src/handlers/health.ts'),
      handler: 'handler',
      timeout: Duration.seconds(5),
      environment: {
        TABLE_NAME: data.schoolsTable.tableName,
        USER_POOL_ID: auth.userPool.userPoolId
      }
    });

    data.schoolsTable.grantReadData(healthFn);

    this.httpApi = new HttpApi(this, 'GSOSHttpApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST, CorsHttpMethod.PUT, CorsHttpMethod.DELETE]
      }
    });

    this.httpApi.addRoutes({
      path: '/health',
      methods: [ /* GET only for now */ ],
      integration: new HttpLambdaIntegration('HealthIntegration', healthFn)
    });
  }
}
