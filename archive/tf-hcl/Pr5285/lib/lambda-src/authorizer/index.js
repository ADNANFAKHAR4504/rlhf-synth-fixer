const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const ssmClient = new SSMClient({});

exports.handler = async (event) => {
  console.log('Authorizer invoked', JSON.stringify(event));

  const token = event.authorizationToken;
  const methodArn = event.methodArn;

  try {
    // Get auth token from SSM Parameter Store
    const ssmParamName = process.env.SSM_AUTH_TOKEN_PATH;
    const command = new GetParameterCommand({
      Name: ssmParamName,
      WithDecryption: true
    });
    
    const response = await ssmClient.send(command);
    const validToken = response.Parameter.Value;

    // Validate token
    if (token === `Bearer ${validToken}`) {
      return generatePolicy('user', 'Allow', methodArn);
    } else {
      return generatePolicy('user', 'Deny', methodArn);
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return generatePolicy('user', 'Deny', methodArn);
  }
};

function generatePolicy(principalId, effect, resource) {
  const authResponse = {
    principalId: principalId
  };

  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    };
    authResponse.policyDocument = policyDocument;
  }

  // Add context data (optional)
  authResponse.context = {
    authorized: effect === 'Allow' ? 'true' : 'false',
    authTime: new Date().toISOString()
  };

  return authResponse;
}

