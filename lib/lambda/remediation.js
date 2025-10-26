const AWS = require('aws-sdk');
const iam = new AWS.IAM();

exports.handler = async event => {
  const { userId, objectKey, timestamp } = event;

  try {
    // Create a deny-all policy
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Deny',
          Action: '*',
          Resource: '*',
        },
      ],
    };

    const policyName = `EmergencyLockout-${Date.now()}`;

    // Attach the deny policy to the user
    await iam
      .putUserPolicy({
        UserName: userId,
        PolicyName: policyName,
        PolicyDocument: JSON.stringify(policyDocument),
      })
      .promise();

    // Log the remediation action
    console.log(
      `REMEDIATION COMPLETED: User ${userId} locked out at ${new Date().toISOString()}`
    );

    return {
      success: true,
      userId,
      action: 'USER_LOCKOUT',
      policyName,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Remediation failed:', error);
    throw error;
  }
};
