const { IAMClient, PutUserPolicyCommand } = require('@aws-sdk/client-iam');

// Initialize AWS SDK v3 client
const iam = new IAMClient({});

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
    const command = new PutUserPolicyCommand({
      UserName: userId,
      PolicyName: policyName,
      PolicyDocument: JSON.stringify(policyDocument),
    });

    await iam.send(command);

    // Structured logging for remediation action
    console.log(JSON.stringify({
      level: 'WARN',
      message: 'REMEDIATION COMPLETED',
      userId,
      action: 'USER_LOCKOUT',
      policyName,
      objectKey,
      originalTimestamp: timestamp,
      remediationTimestamp: new Date().toISOString()
    }));

    return {
      success: true,
      userId,
      action: 'USER_LOCKOUT',
      policyName,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: 'ERROR',
      message: 'Remediation failed',
      error: error.message,
      stack: error.stack,
      userId,
      objectKey
    }));
    throw error;
  }
};
