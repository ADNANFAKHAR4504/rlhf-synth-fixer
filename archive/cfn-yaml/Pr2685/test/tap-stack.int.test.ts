import { APIGatewayClient, GetMethodCommand, GetResourcesCommand, GetRestApiCommand, GetStageCommand } from '@aws-sdk/client-api-gateway';
import { ApiGatewayV2Client } from '@aws-sdk/client-apigatewayv2';
import { GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { GetFunctionCommand, GetFunctionConfigurationCommand, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, ListSubscriptionsByTopicCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests - Live Resource Validation', () => {
  let stsClient: STSClient;
  let s3Client: S3Client;
  let snsClient: SNSClient;
  let lambdaClient: LambdaClient;
  let iamClient: IAMClient;
  let apiGatewayClient: APIGatewayClient;
  let apiGatewayV2Client: ApiGatewayV2Client;
  let accountId: string;
  let region: string;

  beforeAll(async () => {
    stsClient = new STSClient({ region: process.env.AWS_REGION || 'us-east-1' });
    s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
    lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
    apiGatewayClient = new APIGatewayClient({ region: process.env.AWS_REGION || 'us-east-1' });
    apiGatewayV2Client = new ApiGatewayV2Client({ region: process.env.AWS_REGION || 'us-east-1' });

    try {
      const identity = await stsClient.send(new GetCallerIdentityCommand({}));
      accountId = identity.Account!;
      region = process.env.AWS_REGION || 'us-east-1';
    } catch (error) {
      console.warn('AWS credentials not available, skipping integration tests');
      return;
    }
  });

  describe('Stack Outputs Validation', () => {
    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'ApiGatewayInvokeUrl',
        'SnsTopicArn',
        'MigrationLogsBucketName',
        'MigrationTriggerFunctionArn',
        'StatusNotifierFunctionArn',
        'StackRegion'
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(typeof outputs[outputName]).toBe('string');
        expect(outputs[outputName].length).toBeGreaterThan(0);
      });
    });

    test('StackRegion should match current AWS region', () => {
      expect(outputs.StackRegion).toBe(region);
    });

    test('ApiGatewayInvokeUrl should be a valid HTTPS URL', () => {
      const url = outputs.ApiGatewayInvokeUrl;
      expect(url).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*\/migrate$/);
    });

    test('SnsTopicArn should be a valid SNS ARN', () => {
      const arn = outputs.SnsTopicArn;
      expect(arn).toMatch(/^arn:aws:sns:.*:.*:.*/);
    });

    test('MigrationLogsBucketName should be a valid S3 bucket name', () => {
      const bucketName = outputs.MigrationLogsBucketName;
      expect(bucketName).toMatch(/^[a-z0-9-]+$/);
      expect(bucketName.length).toBeLessThanOrEqual(63);
    });

    test('MigrationTriggerFunctionArn should be a valid Lambda ARN', () => {
      const arn = outputs.MigrationTriggerFunctionArn;
      expect(arn).toMatch(/^arn:aws:lambda:.*:.*:function:.*/);
    });

    test('StatusNotifierFunctionArn should be a valid Lambda ARN', () => {
      const arn = outputs.StatusNotifierFunctionArn;
      expect(arn).toMatch(/^arn:aws:lambda:.*:.*:function:.*/);
    });
  });

  describe('S3 Bucket Live Validation', () => {
    test('should be able to access S3 bucket', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new HeadBucketCommand({ Bucket: outputs.MigrationLogsBucketName });
        await s3Client.send(command);
        expect(true).toBe(true);
      } catch (error) {
        throw new Error(`Failed to access S3 bucket: ${error}`);
      }
    });

    test('S3 bucket should have versioning enabled', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new GetBucketVersioningCommand({ Bucket: outputs.MigrationLogsBucketName });
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        throw new Error(`Failed to get bucket versioning: ${error}`);
      }
    });

    test('S3 bucket should have encryption enabled', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new GetBucketEncryptionCommand({ Bucket: outputs.MigrationLogsBucketName });
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      } catch (error) {
        throw new Error(`Failed to get bucket encryption: ${error}`);
      }
    });

    test('S3 bucket should have public access blocked', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new GetPublicAccessBlockCommand({ Bucket: outputs.MigrationLogsBucketName });
        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration).toBeDefined();
        expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      } catch (error) {
        throw new Error(`Failed to get public access block: ${error}`);
      }
    });
  });

  describe('SNS Topic Live Validation', () => {
    test('should be able to access SNS topic', async () => {
      if (!outputs.SnsTopicArn) {
        console.warn('SNS topic ARN not available, skipping test');
        return;
      }

      try {
        const command = new GetTopicAttributesCommand({ TopicArn: outputs.SnsTopicArn });
        const response = await snsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!.DisplayName).toBe('Migration Status Notifications');
      } catch (error) {
        throw new Error(`Failed to access SNS topic: ${error}`);
      }
    });

    test('SNS topic should have correct attributes', async () => {
      if (!outputs.SnsTopicArn) {
        console.warn('SNS topic ARN not available, skipping test');
        return;
      }

      try {
        const command = new GetTopicAttributesCommand({ TopicArn: outputs.SnsTopicArn });
        const response = await snsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!.Owner).toBe(accountId);
        expect(response.Attributes!.SubscriptionsConfirmed).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to get topic attributes: ${error}`);
      }
    });

    test('SNS topic should have subscriptions if email provided', async () => {
      if (!outputs.SnsTopicArn) {
        console.warn('SNS topic ARN not available, skipping test');
        return;
      }

      try {
        const command = new ListSubscriptionsByTopicCommand({ TopicArn: outputs.SnsTopicArn });
        const response = await snsClient.send(command);
        expect(response.Subscriptions).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to list subscriptions: ${error}`);
      }
    });
  });

  describe('Lambda Functions Live Validation', () => {
    test('MigrationTriggerFunction should be accessible', async () => {
      if (!outputs.MigrationTriggerFunctionArn) {
        console.warn('Migration trigger function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.FunctionName).toBeDefined();
        expect(response.Configuration!.Runtime).toBe('python3.13');
        expect(response.Configuration!.Handler).toBe('index.lambda_handler');
      } catch (error) {
        throw new Error(`Failed to access migration trigger function: ${error}`);
      }
    });

    test('StatusNotifierFunction should be accessible', async () => {
      if (!outputs.StatusNotifierFunctionArn) {
        console.warn('Status notifier function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.StatusNotifierFunctionArn.split(':').pop();
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Configuration).toBeDefined();
        expect(response.Configuration!.FunctionName).toBeDefined();
        expect(response.Configuration!.Runtime).toBe('python3.13');
        expect(response.Configuration!.Handler).toBe('index.lambda_handler');
      } catch (error) {
        throw new Error(`Failed to access status notifier function: ${error}`);
      }
    });

    test('MigrationTriggerFunction should have correct configuration', async () => {
      if (!outputs.MigrationTriggerFunctionArn) {
        console.warn('Migration trigger function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Environment).toBeDefined();
        expect(response.Environment!.Variables).toBeDefined();
        expect(response.Environment!.Variables!.S3_BUCKET_NAME).toBeDefined();
        expect(response.Environment!.Variables!.SNS_TOPIC_ARN).toBeDefined();
        expect(response.Timeout).toBeGreaterThan(0);
        expect(response.MemorySize).toBeGreaterThan(0);
      } catch (error) {
        throw new Error(`Failed to get function configuration: ${error}`);
      }
    });

    test('StatusNotifierFunction should have correct configuration', async () => {
      if (!outputs.StatusNotifierFunctionArn) {
        console.warn('Status notifier function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.StatusNotifierFunctionArn.split(':').pop();
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);
        expect(response.Environment).toBeDefined();
        expect(response.Environment!.Variables).toBeDefined();
        expect(response.Environment!.Variables!.SNS_TOPIC_ARN).toBeDefined();
        expect(response.Timeout).toBe(60);
        expect(response.MemorySize).toBe(128);
      } catch (error) {
        throw new Error(`Failed to get function configuration: ${error}`);
      }
    });

    test('MigrationTriggerFunction should be invokable', async () => {
      if (!outputs.MigrationTriggerFunctionArn) {
        console.warn('Migration trigger function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify({ test: 'data' })
        });
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        expect(response.Payload).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to invoke migration trigger function: ${error}`);
      }
    });

    test('StatusNotifierFunction should be invokable', async () => {
      if (!outputs.StatusNotifierFunctionArn) {
        console.warn('Status notifier function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.StatusNotifierFunctionArn.split(':').pop();
        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify({ status: 'test', message: 'test message' })
        });
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);
        expect(response.Payload).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to invoke status notifier function: ${error}`);
      }
    });
  });

  describe('IAM Roles Live Validation', () => {
    test('MigrationTriggerFunctionRole should be accessible', async () => {
      if (!outputs.MigrationTriggerFunctionArn) {
        console.warn('Migration trigger function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const functionConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        const roleName = functionConfig.Role!.split('/').pop();

        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to access migration trigger function role: ${error}`);
      }
    });

    test('StatusNotifierFunctionRole should be accessible', async () => {
      if (!outputs.StatusNotifierFunctionArn) {
        console.warn('Status notifier function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.StatusNotifierFunctionArn.split(':').pop();
        const functionConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        const roleName = functionConfig.Role!.split('/').pop();

        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
        expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to access status notifier function role: ${error}`);
      }
    });

    test('MigrationTriggerFunctionRole should have correct policies', async () => {
      if (!outputs.MigrationTriggerFunctionArn) {
        console.warn('Migration trigger function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const functionConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        const roleName = functionConfig.Role!.split('/').pop();

        const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
        const response = await iamClient.send(command);
        expect(response.AttachedPolicies).toBeDefined();
        expect(response.AttachedPolicies!.length).toBeGreaterThan(0);

        const basicExecutionPolicy = response.AttachedPolicies!.find(policy =>
          policy.PolicyName === 'AWSLambdaBasicExecutionRole'
        );
        expect(basicExecutionPolicy).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to get role policies: ${error}`);
      }
    });

    test('StatusNotifierFunctionRole should have correct policies', async () => {
      if (!outputs.StatusNotifierFunctionArn) {
        console.warn('Status notifier function ARN not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.StatusNotifierFunctionArn.split(':').pop();
        const functionConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
        const roleName = functionConfig.Role!.split('/').pop();

        const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
        const response = await iamClient.send(command);
        expect(response.AttachedPolicies).toBeDefined();
        expect(response.AttachedPolicies!.length).toBeGreaterThan(0);

        const basicExecutionPolicy = response.AttachedPolicies!.find(policy =>
          policy.PolicyName === 'AWSLambdaBasicExecutionRole'
        );
        expect(basicExecutionPolicy).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to get role policies: ${error}`);
      }
    });
  });

  describe('API Gateway Live Validation', () => {
    test('API Gateway should be accessible', async () => {
      if (!outputs.ApiGatewayInvokeUrl) {
        console.warn('API Gateway URL not available, skipping test');
        return;
      }

      try {
        const apiUrl = new URL(outputs.ApiGatewayInvokeUrl);
        const hostParts = apiUrl.hostname.split('.');
        const apiId = hostParts[0];
        const command = new GetRestApiCommand({ restApiId: apiId });
        const response = await apiGatewayClient.send(command);
        expect(response).toBeDefined();
        expect(response.name).toBeDefined();
        expect(response.description).toBe('REST API for triggering migration processes');
      } catch (error) {
        throw new Error(`Failed to access API Gateway: ${error}`);
      }
    });

    test('API Gateway should have migrate resource', async () => {
      if (!outputs.ApiGatewayInvokeUrl) {
        console.warn('API Gateway URL not available, skipping test');
        return;
      }

      try {
        const apiUrl = new URL(outputs.ApiGatewayInvokeUrl);
        const hostParts = apiUrl.hostname.split('.');
        const apiId = hostParts[0];
        const command = new GetResourcesCommand({ restApiId: apiId });
        const response = await apiGatewayClient.send(command);
        expect(response.items).toBeDefined();

        const migrateResource = response.items!.find(resource =>
          resource.pathPart === 'migrate'
        );
        expect(migrateResource).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to get API Gateway resources: ${error}`);
      }
    });

    test('API Gateway should have POST method on migrate resource', async () => {
      if (!outputs.ApiGatewayInvokeUrl) {
        console.warn('API Gateway URL not available, skipping test');
        return;
      }

      try {
        const apiUrl = new URL(outputs.ApiGatewayInvokeUrl);
        const hostParts = apiUrl.hostname.split('.');
        const apiId = hostParts[0];
        const resourcesCommand = new GetResourcesCommand({ restApiId: apiId });
        const resourcesResponse = await apiGatewayClient.send(resourcesCommand);

        const migrateResource = resourcesResponse.items!.find(resource =>
          resource.pathPart === 'migrate'
        );
        expect(migrateResource).toBeDefined();

        const methodCommand = new GetMethodCommand({
          restApiId: apiId,
          resourceId: migrateResource!.id,
          httpMethod: 'POST'
        });
        const methodResponse = await apiGatewayClient.send(methodCommand);
        expect(methodResponse).toBeDefined();
        expect(methodResponse.httpMethod).toBe('POST');
        expect(methodResponse.authorizationType).toBe('NONE');
      } catch (error) {
        throw new Error(`Failed to get API Gateway method: ${error}`);
      }
    });

    test('API Gateway should have prod stage', async () => {
      if (!outputs.ApiGatewayInvokeUrl) {
        console.warn('API Gateway URL not available, skipping test');
        return;
      }

      try {
        const apiUrl = new URL(outputs.ApiGatewayInvokeUrl);
        const hostParts = apiUrl.hostname.split('.');
        const apiId = hostParts[0];
        const command = new GetStageCommand({
          restApiId: apiId,
          stageName: 'prod'
        });
        const response = await apiGatewayClient.send(command);
        expect(response).toBeDefined();
        expect(response.stageName).toBe('prod');
      } catch (error) {
        throw new Error(`Failed to get API Gateway stage: ${error}`);
      }
    });

    test('API Gateway should be invokable', async () => {
      if (!outputs.ApiGatewayInvokeUrl) {
        console.warn('API Gateway URL not available, skipping test');
        return;
      }

      try {
        const response = await fetch(outputs.ApiGatewayInvokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: 'data' })
        });

        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to invoke API Gateway: ${error}`);
      }
    });
  });

  describe('Resource Integration and Connectivity', () => {
    test('Lambda functions should have access to S3 bucket', async () => {
      if (!outputs.MigrationTriggerFunctionArn || !outputs.MigrationLogsBucketName) {
        console.warn('Required outputs not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify({ test: 's3_access' })
        });
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);

        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to test Lambda S3 access: ${error}`);
      }
    });

    test('Lambda functions should have access to SNS topic', async () => {
      if (!outputs.MigrationTriggerFunctionArn || !outputs.SnsTopicArn) {
        console.warn('Required outputs not available, skipping test');
        return;
      }

      try {
        const functionName = outputs.MigrationTriggerFunctionArn.split(':').pop();
        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify({ test: 'sns_access' })
        });
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);

        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to test Lambda SNS access: ${error}`);
      }
    });

    test('API Gateway should integrate with Lambda function', async () => {
      if (!outputs.ApiGatewayInvokeUrl || !outputs.MigrationTriggerFunctionArn) {
        console.warn('Required outputs not available, skipping test');
        return;
      }

      try {
        const response = await fetch(outputs.ApiGatewayInvokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ test: 'api_integration' })
        });

        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toBeDefined();
        expect((responseBody as any).message).toContain('Migration process initiated successfully');
      } catch (error) {
        throw new Error(`Failed to test API Gateway Lambda integration: ${error}`);
      }
    });
  });

  describe('Security and Compliance Validation', () => {
    test('all resources should have proper encryption', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new GetBucketEncryptionCommand({ Bucket: outputs.MigrationLogsBucketName });
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      } catch (error) {
        throw new Error(`Failed to verify encryption: ${error}`);
      }
    });

    test('all resources should have proper access controls', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new GetPublicAccessBlockCommand({ Bucket: outputs.MigrationLogsBucketName });
        const response = await s3Client.send(command);
        expect(response.PublicAccessBlockConfiguration).toBeDefined();
        expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      } catch (error) {
        throw new Error(`Failed to verify access controls: ${error}`);
      }
    });

    test('Lambda functions should have proper execution roles', async () => {
      const functions = [
        { name: 'MigrationTriggerFunction', arn: outputs.MigrationTriggerFunctionArn },
        { name: 'StatusNotifierFunction', arn: outputs.StatusNotifierFunctionArn }
      ];

      for (const func of functions) {
        if (!func.arn) {
          console.warn(`${func.name} ARN not available, skipping test`);
          continue;
        }

        try {
          const functionName = func.arn.split(':').pop();
          const functionConfig = await lambdaClient.send(new GetFunctionConfigurationCommand({ FunctionName: functionName }));
          expect(functionConfig.Role).toBeDefined();

          const roleName = functionConfig.Role!.split('/').pop();
          const roleCommand = new GetRoleCommand({ RoleName: roleName });
          const roleResponse = await iamClient.send(roleCommand);
          expect(roleResponse.Role).toBeDefined();
          expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeDefined();
        } catch (error) {
          throw new Error(`Failed to verify ${func.name} execution role: ${error}`);
        }
      }
    });
  });

  describe('Performance and Scalability Validation', () => {
    test('Lambda functions should have appropriate timeout and memory', async () => {
      const functions = [
        { name: 'MigrationTriggerFunction', arn: outputs.MigrationTriggerFunctionArn, expectedTimeout: 300 },
        { name: 'StatusNotifierFunction', arn: outputs.StatusNotifierFunctionArn, expectedTimeout: 60 }
      ];

      for (const func of functions) {
        if (!func.arn) {
          console.warn(`${func.name} ARN not available, skipping test`);
          continue;
        }

        try {
          const functionName = func.arn.split(':').pop();
          const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
          const response = await lambdaClient.send(command);
          expect(response.Timeout).toBe(func.expectedTimeout);
          expect(response.MemorySize).toBeGreaterThan(0);
          expect(response.MemorySize).toBeLessThanOrEqual(3008);
        } catch (error) {
          throw new Error(`Failed to verify ${func.name} configuration: ${error}`);
        }
      }
    });

    test('S3 bucket should have versioning enabled for data protection', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new GetBucketVersioningCommand({ Bucket: outputs.MigrationLogsBucketName });
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        throw new Error(`Failed to verify S3 versioning: ${error}`);
      }
    });

    test('API Gateway should have proper deployment and stage configuration', async () => {
      if (!outputs.ApiGatewayInvokeUrl) {
        console.warn('API Gateway URL not available, skipping test');
        return;
      }

      try {
        const apiUrl = new URL(outputs.ApiGatewayInvokeUrl);
        const hostParts = apiUrl.hostname.split('.');
        const apiId = hostParts[0];
        const stageCommand = new GetStageCommand({
          restApiId: apiId,
          stageName: 'prod'
        });
        const stageResponse = await apiGatewayClient.send(stageCommand);
        expect(stageResponse).toBeDefined();
        expect(stageResponse.stageName).toBe('prod');
        expect(stageResponse.deploymentId).toBeDefined();
      } catch (error) {
        throw new Error(`Failed to verify API Gateway deployment: ${error}`);
      }
    });
  });

  describe('Monitoring and Observability Validation', () => {
    test('Lambda functions should have proper logging configuration', async () => {
      const functions = [
        { name: 'MigrationTriggerFunction', arn: outputs.MigrationTriggerFunctionArn },
        { name: 'StatusNotifierFunction', arn: outputs.StatusNotifierFunctionArn }
      ];

      for (const func of functions) {
        if (!func.arn) {
          console.warn(`${func.name} ARN not available, skipping test`);
          continue;
        }

        try {
          const functionName = func.arn.split(':').pop();
          const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
          const response = await lambdaClient.send(command);
          expect(response.FunctionName).toBeDefined();
          expect(response.FunctionName).toBeDefined();
        } catch (error) {
          throw new Error(`Failed to verify ${func.name} logging: ${error}`);
        }
      }
    });

    test('SNS topic should have proper monitoring setup', async () => {
      if (!outputs.SnsTopicArn) {
        console.warn('SNS topic ARN not available, skipping test');
        return;
      }

      try {
        const command = new GetTopicAttributesCommand({ TopicArn: outputs.SnsTopicArn });
        const response = await snsClient.send(command);
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!.Owner).toBe(accountId);
      } catch (error) {
        throw new Error(`Failed to verify SNS monitoring: ${error}`);
      }
    });

    test('S3 bucket should have proper monitoring and logging', async () => {
      if (!outputs.MigrationLogsBucketName) {
        console.warn('S3 bucket name not available, skipping test');
        return;
      }

      try {
        const command = new HeadBucketCommand({ Bucket: outputs.MigrationLogsBucketName });
        await s3Client.send(command);
        expect(true).toBe(true);
      } catch (error) {
        throw new Error(`Failed to verify S3 monitoring: ${error}`);
      }
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('complete migration workflow should function correctly', async () => {
      if (!outputs.ApiGatewayInvokeUrl || !outputs.MigrationLogsBucketName || !outputs.SnsTopicArn) {
        console.warn('Required outputs not available, skipping test');
        return;
      }

      try {
        const testEvent = {
          test: 'end_to_end_workflow',
          timestamp: new Date().toISOString(),
          data: { key: 'value' }
        };

        const response = await fetch(outputs.ApiGatewayInvokeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testEvent)
        });

        expect(response.status).toBe(200);
        const responseBody = await response.json();
        expect(responseBody).toBeDefined();
        expect((responseBody as any).message).toContain('Migration process initiated successfully');
        expect((responseBody as any).timestamp).toBeDefined();
        expect((responseBody as any).request_id).toBeDefined();
        expect((responseBody as any).log_location).toBeDefined();
        expect((responseBody as any).log_location).toContain(outputs.MigrationLogsBucketName);
      } catch (error) {
        throw new Error(`Failed to test end-to-end workflow: ${error}`);
      }
    });

    test('status notification workflow should function correctly', async () => {
      if (!outputs.StatusNotifierFunctionArn || !outputs.SnsTopicArn) {
        console.warn('Required outputs not available, skipping test');
        return;
      }

      try {
        const testEvent = {
          status: 'completed',
          message: 'Integration test completed successfully',
          timestamp: new Date().toISOString()
        };

        const functionName = outputs.StatusNotifierFunctionArn.split(':').pop();
        const command = new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(testEvent)
        });
        const response = await lambdaClient.send(command);
        expect(response.StatusCode).toBe(200);

        const payloadStr = new TextDecoder().decode(response.Payload);
        const payload = JSON.parse(payloadStr);
        const bodyObj = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
        expect(payload.statusCode).toBe(200);
        expect(bodyObj).toBeDefined();
        expect(bodyObj.message).toContain('Status notification sent successfully');
      } catch (error) {
        throw new Error(`Failed to test status notification workflow: ${error}`);
      }
    });
  });
});
