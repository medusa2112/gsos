import { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * Post-confirmation trigger for Cognito User Pool
 * Automatically assigns users to appropriate groups and sets up initial attributes
 */
export const handler: PostConfirmationTriggerHandler = async (event: PostConfirmationTriggerEvent) => {
  console.log('Post-confirmation trigger event:', JSON.stringify(event, null, 2));

  const { userPoolId, userName } = event;
  const userAttributes = event.request.userAttributes;

  try {
    // Extract user information
    const email = userAttributes.email;
    const givenName = userAttributes.given_name;
    const familyName = userAttributes.family_name;
    const customRole = userAttributes['custom:role'];

    console.log(`Processing user: ${userName}, email: ${email}, role: ${customRole}`);

    // Determine user role and group assignment
    let groupName: string;
    let schoolId = 'default-school'; // Default school ID, can be customized
    
    if (customRole) {
      // Use the custom role if provided during registration
      groupName = customRole.toLowerCase();
    } else {
      // Default role assignment logic based on email domain or other criteria
      if (email.includes('@admin.') || email.includes('@school.')) {
        groupName = 'admin';
      } else if (email.includes('@teacher.') || email.includes('@staff.')) {
        groupName = 'teacher';
      } else if (email.includes('@parent.')) {
        groupName = 'parent';
      } else {
        groupName = 'student'; // Default to student
      }
    }

    // Validate group name
    const validGroups = ['admin', 'teacher', 'parent', 'student'];
    if (!validGroups.includes(groupName)) {
      console.warn(`Invalid group name: ${groupName}, defaulting to student`);
      groupName = 'student';
    }

    // Add user to the appropriate group
    const addToGroupCommand = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: userName,
      GroupName: groupName
    });

    await cognitoClient.send(addToGroupCommand);
    console.log(`Successfully added user ${userName} to group ${groupName}`);

    // Update user attributes with role and school information
    const updateAttributesCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: userName,
      UserAttributes: [
        {
          Name: 'custom:role',
          Value: groupName
        },
        {
          Name: 'custom:school_id',
          Value: schoolId
        }
      ]
    });

    await cognitoClient.send(updateAttributesCommand);
    console.log(`Successfully updated attributes for user ${userName}`);

    // Additional setup based on role
    switch (groupName) {
      case 'student':
        // For students, we might want to generate a student ID
        const studentId = `STU-${Date.now()}-${userName.slice(-4)}`;
        const updateStudentCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: userName,
          UserAttributes: [
            {
              Name: 'custom:student_id',
              Value: studentId
            }
          ]
        });
        await cognitoClient.send(updateStudentCommand);
        console.log(`Generated student ID ${studentId} for user ${userName}`);
        break;

      case 'parent':
        // For parents, initialize empty parent_of array
        const updateParentCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: userName,
          UserAttributes: [
            {
              Name: 'custom:parent_of',
              Value: '[]' // Empty JSON array, will be populated when linking to students
            }
          ]
        });
        await cognitoClient.send(updateParentCommand);
        console.log(`Initialized parent_of attribute for user ${userName}`);
        break;

      case 'teacher':
      case 'admin':
        // Teachers and admins don't need additional setup at this time
        console.log(`User ${userName} assigned to ${groupName} group - no additional setup required`);
        break;
    }

    return event;

  } catch (error) {
    console.error('Error in post-confirmation trigger:', error);
    
    // Don't throw the error as it would prevent user registration
    // Instead, log the error and continue
    console.error(`Failed to process post-confirmation for user ${userName}:`, error);
    
    return event;
  }
};