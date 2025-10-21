exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Get the authorization token from the header
  const authorizationToken = event.authorizationToken;

  // This is a simplified example. In a real-world scenario, you would:
  // 1. Verify the JWT signature using a public key or secret
  // 2. Check if the token has expired
  // 3. Validate any required claims

  // For demo purposes, we'll just check if the token starts with "Allow"
  const effect =
    authorizationToken && authorizationToken.startsWith('Allow')
      ? 'Allow'
      : 'Deny';

  // Create a policy document for API Gateway
  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: event.methodArn,
      },
    ],
  };

  // Return the policy document
  return {
    principalId: 'user',
    policyDocument,
    context: {
      region: process.env.REGION,
    },
  };
};
