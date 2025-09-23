import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool, AccountRecovery, Mfa, UserPoolClient } from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends Stack {
  readonly userPool: UserPool;
  readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.userPool = new UserPool(this, 'GSOSUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      mfa: Mfa.OPTIONAL,
      accountRecovery: AccountRecovery.EMAIL_ONLY
    });

    this.userPoolClient = new UserPoolClient(this, 'GSOSWebClient', {
      userPool: this.userPool,
      authFlows: { userPassword: true, userSrp: true }
    });
  }
}
