import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Pre-token generation Lambda trigger
 * Adds custom claims to ID tokens including user role and groups
 */
export const handler: PreTokenGenerationTriggerHandler = async (event) => {
  console.log('Pre-token generation event:', JSON.stringify(event, null, 2));

  try {
    const { userPoolId, userName } = event;
    
    // Get user details from Cognito
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: userName
    });

    const userResponse = await cognitoClient.send(getUserCommand);
    
    // Extract user attributes
    const userAttributes = userResponse.UserAttributes || [];
    const getAttributeValue = (name: string) => 
      userAttributes.find((attr: any) => attr.Name === name)?.Value;

    // Get user's role from custom attribute
    const userRole = getAttributeValue('custom:role') || 'student';
    
    // Get user's groups (these are set by the post-confirmation trigger)
    const userGroups = event.request.groupConfiguration?.groupsToOverride || [];
    
    // Add custom claims to ID token
    event.response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        // User role claim
        'custom:role': userRole,
        
        // Groups claim (standard Cognito claim)
        'cognito:groups': userGroups.join(','),
        
        // Additional user profile claims
        'custom:user_id': userName,
        'custom:full_name': `${getAttributeValue('given_name') || ''} ${getAttributeValue('family_name') || ''}`.trim(),
        
        // School context (if available)
        'custom:school_id': getAttributeValue('custom:school_id') || '',
        
        // Permissions based on role
        'custom:permissions': getPermissionsForRole(userRole).join(','),
        
        // Last login timestamp
        'custom:last_login': new Date().toISOString()
      },
      
      // Optionally suppress standard claims if needed
      claimsToSuppress: [],
      
      // Group configuration
      groupOverrideDetails: {
        groupsToOverride: userGroups,
        iamRolesToOverride: [],
        preferredRole: undefined
      }
    };

    console.log('Added custom claims:', event.response.claimsOverrideDetails.claimsToAddOrOverride);
    
    return event;
  } catch (error) {
    console.error('Error in pre-token generation:', error);
    
    // Don't fail the authentication flow, just log the error
    // Return the event without modifications
    return event;
  }
};

/**
 * Get permissions array based on user role
 */
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'users:read',
      'users:write',
      'users:delete',
      'students:read',
      'students:write',
      'students:delete',
      'teachers:read',
      'teachers:write',
      'teachers:delete',
      'classes:read',
      'classes:write',
      'classes:delete',
      'attendance:read',
      'attendance:write',
      'attendance:delete',
      'behavior:read',
      'behavior:write',
      'behavior:delete',
      'admissions:read',
      'admissions:write',
      'admissions:delete',
      'payments:read',
      'payments:write',
      'payments:delete',
      'reports:read',
      'reports:write',
      'settings:read',
      'settings:write'
    ],
    teacher: [
      'students:read',
      'classes:read',
      'classes:write',
      'attendance:read',
      'attendance:write',
      'behavior:read',
      'behavior:write',
      'reports:read'
    ],
    parent: [
      'students:read', // Only their own children
      'attendance:read', // Only their children's attendance
      'behavior:read', // Only their children's behavior
      'payments:read', // Only their own payments
      'reports:read' // Only their children's reports
    ],
    student: [
      'attendance:read', // Only their own attendance
      'behavior:read', // Only their own behavior
      'reports:read' // Only their own reports
    ]
  };

  return rolePermissions[role] || rolePermissions.student;
}