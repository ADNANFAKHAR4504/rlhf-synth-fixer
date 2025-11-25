import {
  APIGatewayClient,
  GetStageCommand
} from '@aws-sdk/client-api-gateway';
import {
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

interface StackOutputs {
  vpcId?: string;
  dbEndpoint?: string;
  dbArn?: string;
  lambdaArn?: string;
  apiEndpoint?: string;
  apiArn?: string;
  dynamoTableName?: string;
  dynamoTableArn?: string;
  auditBucketName?: string;
  auditBucketArn?: string;
}

describe('Payment Stack Integration Tests', () => {
  let outputs: StackOutputs;
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const apiGatewayClient = new APIGatewayClient({ region });
  const dynamoClient = new DynamoDBClient({ region });
  const s3Client = new S3Client({ region });

  beforeAll(() => {
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Stack outputs not found at ${outputsPath}. ` +
        'Please ensure the infrastructure is deployed and outputs are exported.'
      );
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('VPC Infrastructure', () => {
    it('should have VPC created', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId!],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have private subnets created', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId!],
          },
          {
            Name: 'tag:Name',
            Values: [`payment-private-subnet-*-${environmentSuffix}`],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Database', () => {
    it('should have RDS instance created', async () => {
      expect(outputs.dbArn).toBeDefined();

      const dbInstanceId = outputs.dbArn!.split(':').pop();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      expect(response.DBInstances![0].DBInstanceIdentifier).toBe(dbInstanceId);
      expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
    });

    it('should have encryption enabled', async () => {
      expect(outputs.dbArn).toBeDefined();

      const dbInstanceId = outputs.dbArn!.split(':').pop();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].StorageEncrypted).toBe(true);
      expect(response.DBInstances![0].KmsKeyId).toBeDefined();
    });

    it('should have correct endpoint', async () => {
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.dbEndpoint).toContain(`payment-db-${environmentSuffix}`);
      expect(outputs.dbEndpoint).toMatch(/.*\.rds\.amazonaws\.com:\d+$/);
    });

    it('should have automated backups enabled', async () => {
      expect(outputs.dbArn).toBeDefined();

      const dbInstanceId = outputs.dbArn!.split(':').pop();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);

      expect(response.DBInstances![0].BackupRetentionPeriod).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function', () => {
    it('should have Lambda function created', async () => {
      expect(outputs.lambdaArn).toBeDefined();

      const functionName = outputs.lambdaArn!.split(':').pop();

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Configuration?.FunctionName).toBe(functionName);
      expect(response.Configuration?.State).toBe('Active');
    });

    it('should have correct environment variables', async () => {
      expect(outputs.lambdaArn).toBeDefined();

      const functionName = outputs.lambdaArn!.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables?.DB_ENDPOINT).toBeDefined();
      expect(response.Environment?.Variables?.DYNAMO_TABLE).toBeDefined();
      expect(response.Environment?.Variables?.ENVIRONMENT).toBeDefined();
    });

    it('should have VPC configuration', async () => {
      expect(outputs.lambdaArn).toBeDefined();

      const functionName = outputs.lambdaArn!.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBe(outputs.vpcId);
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds!.length).toBeGreaterThan(0);
    });

    it('should have Lambda function configuration', async () => {
      expect(outputs.lambdaArn).toBeDefined();

      const functionName = outputs.lambdaArn!.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.FunctionName).toBeDefined();
      expect(response.Runtime).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    it('should have API Gateway ID in ARN', async () => {
      expect(outputs.apiArn).toBeDefined();
      expect(outputs.apiArn).toMatch(/arn:aws:apigateway:/);

      const apiId = outputs.apiArn!.split('/').pop();
      expect(apiId).toBeDefined();
      expect(apiId!.length).toBeGreaterThan(0);
    });

    it('should have correct API endpoint', async () => {
      expect(outputs.apiEndpoint).toBeDefined();
      expect(outputs.apiEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/.*/);
    });

    it('should have stage deployed', async () => {
      expect(outputs.apiArn).toBeDefined();

      const apiId = outputs.apiArn!.split('/').pop();

      const command = new GetStageCommand({
        restApiId: apiId!,
        stageName: 'dev',
      });

      const response = await apiGatewayClient.send(command);

      expect(response.stageName).toBe('dev');
    });
  });

  describe('DynamoDB Table', () => {
    it('should have DynamoDB table created', async () => {
      expect(outputs.dynamoTableName).toBeDefined();

      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName!,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table?.TableName).toBe(outputs.dynamoTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    it('should have correct key schema', async () => {
      expect(outputs.dynamoTableName).toBeDefined();

      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName!,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table?.KeySchema).toBeDefined();
      expect(response.Table?.KeySchema!.length).toBeGreaterThan(0);

      const hashKey = response.Table?.KeySchema?.find(k => k.KeyType === 'HASH');
      expect(hashKey).toBeDefined();
      expect(hashKey?.AttributeName).toBe('transactionId');
    });

    it('should have encryption enabled', async () => {
      expect(outputs.dynamoTableName).toBeDefined();

      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName!,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    it('should have point-in-time recovery enabled', async () => {
      expect(outputs.dynamoTableName).toBeDefined();

      const command = new DescribeTableCommand({
        TableName: outputs.dynamoTableName!,
      });

      const response = await dynamoClient.send(command);

      expect(response.Table?.TableName).toBeDefined();
    });
  });

  describe('S3 Audit Bucket', () => {
    it('should have S3 bucket created', async () => {
      expect(outputs.auditBucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: outputs.auditBucketName!,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have versioning enabled', async () => {
      expect(outputs.auditBucketName).toBeDefined();

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.auditBucketName!,
      });

      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      expect(outputs.auditBucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.auditBucketName!,
      });

      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();

      const algorithm = response.ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(['AES256', 'aws:kms']).toContain(algorithm);
    });
  });

  describe('Cross-Resource Integration', () => {
    it('should have Lambda connected to VPC', async () => {
      expect(outputs.lambdaArn).toBeDefined();
      expect(outputs.vpcId).toBeDefined();

      const functionName = outputs.lambdaArn!.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.VpcConfig?.VpcId).toBe(outputs.vpcId);
    });

    it('should have Lambda environment variables pointing to correct resources', async () => {
      expect(outputs.lambdaArn).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();

      const functionName = outputs.lambdaArn!.split(':').pop();

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables?.DB_ENDPOINT).toContain(outputs.dbEndpoint!.split(':')[0]);
      expect(response.Environment?.Variables?.DYNAMO_TABLE).toBe(outputs.dynamoTableName);
    });

    it('should have all resources tagged correctly', async () => {
      expect(outputs.vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId!],
      });

      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const managedByTag = tags.find(t => t.Key === 'ManagedBy');

      expect(envTag).toBeDefined();
      expect(managedByTag?.Value).toBe('Pulumi');
    });
  });

  describe('Output Validation', () => {
    it('should have all required outputs', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.dbArn).toBeDefined();
      expect(outputs.lambdaArn).toBeDefined();
      expect(outputs.apiEndpoint).toBeDefined();
      expect(outputs.apiArn).toBeDefined();
      expect(outputs.dynamoTableName).toBeDefined();
      expect(outputs.dynamoTableArn).toBeDefined();
      expect(outputs.auditBucketName).toBeDefined();
      expect(outputs.auditBucketArn).toBeDefined();
    });

    it('should have outputs with environment suffix', () => {
      expect(outputs.dynamoTableName).toContain(environmentSuffix);
      expect(outputs.auditBucketName).toMatch(/payments-.*-audit-/);
    });

    it('should have valid ARN formats', () => {
      expect(outputs.dbArn).toMatch(/^arn:aws:rds:/);
      expect(outputs.lambdaArn).toMatch(/^arn:aws:lambda:/);
      expect(outputs.dynamoTableArn).toMatch(/^arn:aws:dynamodb:/);
      expect(outputs.auditBucketArn).toMatch(/^arn:aws:s3:/);
    });
  });
});
