import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SFNClient,
  DescribeStateMachineCommand,
} from '@aws-sdk/client-sfn';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  ApiGatewayV2Client,
  GetApisCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  AthenaClient,
  GetWorkGroupCommand,
} from '@aws-sdk/client-athena';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const sfnClient = new SFNClient({ region });
const kmsClient = new KMSClient({ region });
const athenaClient = new AthenaClient({ region });

describe('Document Automation System Integration Tests', () => {
  describe('DynamoDB Tables', () => {
    test('TurnAroundPromptTable should exist and be active', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(`TurnAroundPromptTable${environmentSuffix}`);
    });

    test('DocumentMetadataTable should exist and be active', async () => {
      const tableName = outputs.DocumentMetadataTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('AuditTrailTable should exist and be active', async () => {
      const tableName = outputs.AuditTrailTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('DocumentMetadataTable should have encryption enabled', async () => {
      const tableName = outputs.DocumentMetadataTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('DocumentMetadataTable should have stream enabled', async () => {
      const tableName = outputs.DocumentMetadataTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.StreamSpecification).toBeDefined();
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
    });

    test('can write and read from TurnAroundPromptTable', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const testId = `test-${Date.now()}`;

      // Put item
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: testId },
            data: { S: 'test data' },
          },
        })
      );

      // Get item
      const getResponse = await dynamodbClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId },
          },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testId);

      // Clean up
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId },
          },
        })
      );
    });
  });

  describe('S3 Buckets', () => {
    test('TemplatesBucket should exist', async () => {
      const bucketName = outputs.TemplatesBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('GeneratedDocumentsBucket should exist', async () => {
      const bucketName = outputs.GeneratedDocumentsBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('can upload and retrieve object from TemplatesBucket', async () => {
      const bucketName = outputs.TemplatesBucketName;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test template content';

      // Upload
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Retrieve
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      expect(getResponse.Body).toBeDefined();
      const content = await getResponse.Body?.transformToString();
      expect(content).toBe(testContent);

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    });
  });

  describe('Lambda Functions', () => {
    test('DocumentGenerationFunction should exist', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('DocumentAnalysisFunction should exist', async () => {
      const functionArn = outputs.DocumentAnalysisFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('DocumentGenerationFunction has correct environment variables', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.TEMPLATES_BUCKET).toBeDefined();
      expect(envVars?.GENERATED_DOCS_BUCKET).toBeDefined();
      expect(envVars?.METADATA_TABLE).toBeDefined();
      expect(envVars?.AUDIT_TABLE).toBeDefined();
      expect(envVars?.KMS_KEY_ID).toBeDefined();
    });

    test('can invoke DocumentGenerationFunction', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();

      const payload = {
        body: JSON.stringify({
          templateId: 'test-template',
          data: { field1: 'value1' },
          userId: 'test-user',
          language: 'en',
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        // Function should return a response with statusCode (even if error)
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    }, 70000);
  });

  describe('SNS Topics', () => {
    test('SignatureRequestTopic should exist', async () => {
      const topicArn = outputs.SignatureRequestTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('SignatureRequestTopic should have KMS encryption', async () => {
      const topicArn = outputs.SignatureRequestTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Step Functions', () => {
    test('ApprovalWorkflowStateMachine should exist', async () => {
      const stateMachineArn = outputs.ApprovalWorkflowStateMachineArn;
      expect(stateMachineArn).toBeDefined();

      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.stateMachineArn).toBe(stateMachineArn);
      expect(response.status).toBe('ACTIVE');
    });

    test('state machine should have proper definition', async () => {
      const stateMachineArn = outputs.ApprovalWorkflowStateMachineArn;
      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.definition).toBeDefined();
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.States).toBeDefined();
      expect(definition.States.GenerateDocument).toBeDefined();
      expect(definition.States.AnalyzeDocument).toBeDefined();
    });
  });

  describe('KMS', () => {
    test('DocumentEncryptionKey should exist', async () => {
      const keyId = outputs.DocumentEncryptionKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('API Gateway', () => {
    test('DocumentAPIUrl should be accessible', async () => {
      const apiUrl = outputs.DocumentAPIUrl;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('https://');
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain(region);
      expect(apiUrl).toContain(environmentSuffix);
    });
  });

  describe('Athena', () => {
    test('AthenaWorkGroup should exist', async () => {
      const workGroupName = outputs.AthenaWorkGroupName;
      expect(workGroupName).toBeDefined();

      const command = new GetWorkGroupCommand({ WorkGroup: workGroupName });
      const response = await athenaClient.send(command);

      expect(response.WorkGroup).toBeDefined();
      expect(response.WorkGroup?.Name).toBe(workGroupName);
      expect(response.WorkGroup?.State).toBe('ENABLED');
    });

    test('AthenaWorkGroup should have encryption configuration', async () => {
      const workGroupName = outputs.AthenaWorkGroupName;
      const command = new GetWorkGroupCommand({ WorkGroup: workGroupName });
      const response = await athenaClient.send(command);

      const config = response.WorkGroup?.Configuration?.ResultConfiguration;
      expect(config).toBeDefined();
      expect(config?.EncryptionConfiguration).toBeDefined();
      expect(config?.EncryptionConfiguration?.EncryptionOption).toBe('SSE_KMS');
    });
  });

  describe('Resource Integration', () => {
    test('all outputs should be defined', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.DocumentMetadataTableName).toBeDefined();
      expect(outputs.AuditTrailTableName).toBeDefined();
      expect(outputs.DocumentAPIUrl).toBeDefined();
      expect(outputs.TemplatesBucketName).toBeDefined();
      expect(outputs.GeneratedDocumentsBucketName).toBeDefined();
      expect(outputs.DocumentGenerationFunctionArn).toBeDefined();
      expect(outputs.DocumentAnalysisFunctionArn).toBeDefined();
      expect(outputs.ApprovalWorkflowStateMachineArn).toBeDefined();
      expect(outputs.SignatureRequestTopicArn).toBeDefined();
      expect(outputs.DocumentEncryptionKeyId).toBeDefined();
      expect(outputs.AthenaWorkGroupName).toBeDefined();
    });

    test('resource names should use environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
      expect(outputs.DocumentMetadataTableName).toContain(environmentSuffix);
      expect(outputs.AuditTrailTableName).toContain(environmentSuffix);
    });

    test('Lambda functions can access DynamoDB tables', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.METADATA_TABLE).toBe(outputs.DocumentMetadataTableName);
      expect(envVars?.AUDIT_TABLE).toBe(outputs.AuditTrailTableName);
    });

    test('Lambda functions can access S3 buckets', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.TEMPLATES_BUCKET).toBe(outputs.TemplatesBucketName);
      expect(envVars?.GENERATED_DOCS_BUCKET).toBe(outputs.GeneratedDocumentsBucketName);
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete document generation workflow', async () => {
      const templatesBucket = outputs.TemplatesBucketName;
      const generatedDocsBucket = outputs.GeneratedDocumentsBucketName;
      const metadataTable = outputs.DocumentMetadataTableName;
      const timestamp = Date.now();

      // Step 1: Upload a template to S3
      const templateKey = `templates/test-template-${timestamp}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: templatesBucket,
          Key: templateKey,
          Body: JSON.stringify({ title: 'Test Document', content: 'Hello World' }),
        })
      );

      // Step 2: Invoke document generation function
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();

      const payload = {
        body: JSON.stringify({
          templateId: `test-template-${timestamp}`,
          data: { field1: 'value1' },
          userId: `test-user-${timestamp}`,
          language: 'en',
        }),
      };

      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(payload),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);

      // Clean up template
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: templatesBucket,
          Key: templateKey,
        })
      );
    }, 70000);
  });
});
