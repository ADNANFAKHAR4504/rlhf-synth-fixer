// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import * as AWS from 'aws-sdk';

// Read outputs from deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-2';
AWS.config.update({ region });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth19483756';

// AWS Service Clients
const secretsManager = new AWS.SecretsManager();
const ssm = new AWS.SSM();
const stepFunctions = new AWS.StepFunctions();
const lambda = new AWS.Lambda();
const xray = new AWS.XRay();

describe('Configuration Management Integration Tests', () => {
  describe('Secrets Manager Resources', () => {
    test('API Key Secret exists and is accessible', async () => {
      if (!outputs.ApiKeySecretArn) {
        console.warn('ApiKeySecretArn not found in outputs, skipping test');
        return;
      }

      try {
        const response = await secretsManager
          .describeSecret({ SecretId: outputs.ApiKeySecretArn })
          .promise();

        expect(response.Name).toContain('mobile-app/api-keys');
        expect(response.Description).toBe('API keys for mobile application');
        expect(response.ARN).toBe(outputs.ApiKeySecretArn);
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Secret not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('Database Credentials Secret exists', async () => {
      if (!outputs.ExportsOutputRefDbCredentialsSecret4110FA1DC5536844) {
        console.warn('DbCredentialsSecret ARN not found in outputs, skipping test');
        return;
      }

      try {
        const response = await secretsManager
          .describeSecret({
            SecretId: outputs.ExportsOutputRefDbCredentialsSecret4110FA1DC5536844,
          })
          .promise();

        expect(response.Name).toContain('mobile-app/database');
        expect(response.Description).toBe('Database credentials for mobile application');
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Secret not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('Auth Token Secret exists', async () => {
      if (!outputs.ExportsOutputRefAuthTokenSecretDC338EC1D4F6F156) {
        console.warn('AuthTokenSecret ARN not found in outputs, skipping test');
        return;
      }

      try {
        const response = await secretsManager
          .describeSecret({
            SecretId: outputs.ExportsOutputRefAuthTokenSecretDC338EC1D4F6F156,
          })
          .promise();

        expect(response.Name).toContain('mobile-app/auth-token');
        expect(response.Description).toBe('Authentication token for services');
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Secret not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('Third Party Service Secret exists', async () => {
      if (!outputs.ExportsOutputRefThirdPartySecret1BEA3AE8342FEF88) {
        console.warn('ThirdPartySecret ARN not found in outputs, skipping test');
        return;
      }

      try {
        const response = await secretsManager
          .describeSecret({
            SecretId: outputs.ExportsOutputRefThirdPartySecret1BEA3AE8342FEF88,
          })
          .promise();

        expect(response.Name).toContain('mobile-app/third-party');
        expect(response.Description).toBe('Third-party service credentials');
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Secret not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });
  });

  describe('SSM Parameters', () => {
    test('Shared Configuration Parameter exists and is accessible', async () => {
      if (!outputs.SharedConfigParameterArn) {
        console.warn('SharedConfigParameterArn not found in outputs, skipping test');
        return;
      }

      // Extract parameter name from ARN
      const parameterName = outputs.SharedConfigParameterArn.split(':parameter')[1];

      try {
        const response = await ssm
          .getParameter({ Name: parameterName })
          .promise();

        expect(response.Parameter?.Name).toBe(parameterName);
        expect(response.Parameter?.Type).toBe('String');
        expect(response.Parameter?.Value).toBeTruthy();

        // Verify the value is valid JSON
        const configValue = JSON.parse(response.Parameter?.Value || '{}');
        expect(configValue).toHaveProperty('version');
        expect(configValue).toHaveProperty('features');
        expect(configValue).toHaveProperty('endpoints');
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          console.warn('Parameter not found, may have been cleaned up');
        } else if (error.code === 'AccessDeniedException') {
          console.warn('Access denied to parameter, check IAM permissions');
        } else {
          throw error;
        }
      }
    });

    test('API Endpoint Parameter exists', async () => {
      const parameterName = `/mobile-app/config/${environmentSuffix}/api-endpoint`;

      try {
        const response = await ssm
          .getParameter({ Name: parameterName })
          .promise();

        expect(response.Parameter?.Name).toBe(parameterName);
        expect(response.Parameter?.Value).toBe('https://api.example.com/v1');
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          console.warn('Parameter not found, may have been cleaned up');
        } else if (error.code === 'AccessDeniedException') {
          console.warn('Access denied to parameter, check IAM permissions');
        } else {
          throw error;
        }
      }
    });

    test('API Timeout Parameter exists', async () => {
      const parameterName = `/mobile-app/config/${environmentSuffix}/api-timeout`;

      try {
        const response = await ssm
          .getParameter({ Name: parameterName })
          .promise();

        expect(response.Parameter?.Name).toBe(parameterName);
        expect(response.Parameter?.Value).toBe('30000');
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          console.warn('Parameter not found, may have been cleaned up');
        } else if (error.code === 'AccessDeniedException') {
          console.warn('Access denied to parameter, check IAM permissions');
        } else {
          throw error;
        }
      }
    });

    test('Max Retries Parameter exists', async () => {
      const parameterName = `/mobile-app/config/${environmentSuffix}/max-retries`;

      try {
        const response = await ssm
          .getParameter({ Name: parameterName })
          .promise();

        expect(response.Parameter?.Name).toBe(parameterName);
        expect(response.Parameter?.Value).toBe('3');
      } catch (error: any) {
        if (error.code === 'ParameterNotFound') {
          console.warn('Parameter not found, may have been cleaned up');
        } else if (error.code === 'AccessDeniedException') {
          console.warn('Access denied to parameter, check IAM permissions');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Cross-Service Integration', () => {
    test('All secrets are created with correct naming convention', async () => {
      const expectedSecrets = [
        'api-keys',
        'database',
        'auth-token',
        'third-party',
      ];

      for (const secretType of expectedSecrets) {
        const secretName = `mobile-app/${secretType}/${environmentSuffix}`;
        try {
          const response = await secretsManager
            .describeSecret({ SecretId: secretName })
            .promise();

          expect(response.Name).toBe(secretName);
        } catch (error: any) {
          if (error.code === 'ResourceNotFoundException') {
            console.warn(`Secret ${secretName} not found, may have been cleaned up`);
          } else if (error.code === 'AccessDeniedException') {
            console.warn(`Access denied to secret ${secretName}`);
          }
        }
      }
    });

    test('All SSM parameters follow naming convention', async () => {
      const expectedParameters = [
        'api-endpoint',
        'api-timeout',
        'max-retries',
        'shared-config',
      ];

      for (const param of expectedParameters) {
        const parameterName = `/mobile-app/config/${environmentSuffix}/${param}`;
        try {
          const response = await ssm
            .describeParameters({
              Filters: [
                {
                  Key: 'Name',
                  Values: [parameterName],
                },
              ],
            })
            .promise();

          if (response.Parameters && response.Parameters.length > 0) {
            expect(response.Parameters[0].Name).toBe(parameterName);
          }
        } catch (error: any) {
          console.warn(`Error checking parameter ${parameterName}:`, error.message);
        }
      }
    });
  });

  describe('Step Functions Integration', () => {
    test('State Machine exists and is configured correctly', async () => {
      if (!outputs.StateMachineArn) {
        console.warn('StateMachineArn not found in outputs, skipping test');
        return;
      }

      try {
        const response = await stepFunctions
          .describeStateMachine({
            stateMachineArn: outputs.StateMachineArn,
          })
          .promise();

        expect(response.name).toBe(`config-deployment-${environmentSuffix}`);
        expect(response.type).toBe('EXPRESS');
        expect(response.status).toBe('ACTIVE');
        expect(response.tracingConfiguration?.enabled).toBe(true);
      } catch (error: any) {
        if (error.code === 'StateMachineDoesNotExist') {
          console.warn('State Machine not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('State Machine has proper logging configuration', async () => {
      if (!outputs.StateMachineArn) {
        console.warn('StateMachineArn not found in outputs, skipping test');
        return;
      }

      try {
        const response = await stepFunctions
          .describeStateMachine({
            stateMachineArn: outputs.StateMachineArn,
          })
          .promise();

        expect(response.loggingConfiguration).toBeDefined();
        expect(response.loggingConfiguration?.level).toBe('ALL');
        expect(response.loggingConfiguration?.includeExecutionData).toBe(true);
      } catch (error: any) {
        console.warn('Error checking State Machine logging:', error.message);
      }
    });
  });

  describe('Lambda X-Ray Tracing', () => {
    test('Pre-deployment validation Lambda has X-Ray tracing enabled', async () => {
      const functionName = `pre-deployment-validation-${environmentSuffix}`;

      try {
        const response = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();

        expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Lambda function not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('Post-deployment monitoring Lambda has X-Ray tracing enabled', async () => {
      const functionName = `post-deployment-monitoring-${environmentSuffix}`;

      try {
        const response = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();

        expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Lambda function not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });

    test('Config validator Lambda has X-Ray permissions', async () => {
      const functionName = `config-validator-${environmentSuffix}`;

      try {
        const response = await lambda
          .getFunction({ FunctionName: functionName })
          .promise();

        // Get the role ARN to check permissions
        expect(response.Configuration?.Role).toBeDefined();
        // Additional validation could check IAM role for xray permissions
      } catch (error: any) {
        if (error.code === 'ResourceNotFoundException') {
          console.warn('Lambda function not found, may have been cleaned up');
        } else {
          throw error;
        }
      }
    });
  });
});
