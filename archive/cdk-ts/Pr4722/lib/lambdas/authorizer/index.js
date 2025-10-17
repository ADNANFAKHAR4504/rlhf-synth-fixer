const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({});

exports.handler = async (event) => {
  const token = event.authorizationToken;
  const methodArn = event.methodArn;

  try {
    // Extract provider from the path (e.g., /webhook/stripe or /webhook/paypal)
    const pathMatch = event.methodArn.match(/\/webhook\/(\w+)/);
    const provider = pathMatch ? pathMatch[1] : 'unknown';

    // Retrieve the API key from SSM Parameter Store
    const parameterName = `${process.env.PARAMETER_STORE_PREFIX}${provider}`;

    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    const expectedApiKey = response.Parameter.Value;

    // Validate the API key
    if (token === expectedApiKey) {
      return generatePolicy('user', 'Allow', methodArn);
    } else {
      return generatePolicy('user', 'Deny', methodArn);
    }
  } catch (error) {
    console.error('Error validating API key:', error);
    return generatePolicy('user', 'Deny', methodArn);
  }
};

function generatePolicy(principalId, effect, resource) {
  const authResponse = {
    principalId: principalId,
  };

  if (effect && resource) {
    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  return authResponse;
}
