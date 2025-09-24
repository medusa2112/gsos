import { Amplify } from 'aws-amplify';

// This configuration will be populated with actual values from CDK outputs
// For now, using environment variables that should be set during deployment
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
        username: false,
        phone: false
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true
      },
      userAttributes: {
        email: {
          required: true
        },
        given_name: {
          required: true
        },
        family_name: {
          required: true
        },
        'custom:role': {
          required: false
        }
      }
    }
  }
};

// Configure Amplify
export function configureAmplify() {
  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

export default amplifyConfig;