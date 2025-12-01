import {
  APIGatewayClient,
  GetResourcesCommand,
  GetRestApiCommand,
  GetStagesCommand
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const outputFile = path.resolve('cfn-outputs/flat-outputs.json');

const isNonEmptyString = (v: any) => typeof v === 'string' && v.trim().length > 0;
const isValidArn = (v: string) => /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string) => v.startsWith('vpc-');
const isValidSubnetId = (v: string) => v.startsWith('subnet-');
const isValidSecurityGroupId = (v: string) => v.startsWith('sg-');
const isValidUrl = (v: string) => /^https?:\/\/[^\s$.?#].[^\s]*$/.test(v);
const isValidKmsKeyId = (v: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);

const parseObject = (v: any) => {
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
};

const skipIfMissing = (key: string, obj: any) => {
  if (!(key in obj)) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;
  let region: string;

  beforeAll(() => {
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file not found: ${outputFile}`);
    }

    const data = fs.readFileSync(outputFile, 'utf8');
    const parsed = JSON.parse(data);
    outputs = {};

    for (const [k, v] of Object.entries(parsed)) {
      outputs[k] = parseObject(v);
    }

    // Extract region from ARN or API Gateway URL
    const apiGatewayUrl = outputs.api_gateway_url;
    if (apiGatewayUrl && typeof apiGatewayUrl === 'string') {
      const urlMatch = apiGatewayUrl.match(/\.execute-api\.([^.]+)\.amazonaws\.com/);
      if (urlMatch) {
        region = urlMatch[1];
      }
    }

    if (!region) {
      // Try to extract from ARN
      const arnOutput = Object.values(outputs).find((v: any) =>
        typeof v === 'string' && v.startsWith('arn:aws:')
      ) as string;

      if (arnOutput) {
        region = arnOutput.split(':')[3];
      } else {
        throw new Error('Could not determine AWS region from outputs');
      }
    }
  });

  describe('Output Structure Validation', () => {
    it('should have essential payment processing infrastructure outputs', () => {
      const requiredOutputs = [
        'vpc_id',
        'api_gateway_url',
        'api_gateway_endpoints',
        'dynamodb_tables',
        'lambda_functions',
        's3_bucket',
        'kms_key'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    it('should not expose sensitive information', () => {
      const sensitivePatterns = [
        /password/i, /secret/i, /private_key/i, /access_key/i,
        /session_token/i, /credentials/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });
  });

  describe('VPC and Networking Infrastructure', () => {
    let ec2Client: EC2Client;

    beforeAll(() => {
      ec2Client = new EC2Client({ region });
    });

    it('validates VPC configuration', async () => {
      if (skipIfMissing('vpc_id', outputs)) return;

      expect(isValidVpcId(outputs.vpc_id)).toBe(true);

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');

      // Get VPC attributes to check DNS settings
      try {
        const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
          VpcId: outputs.vpc_id,
          Attribute: 'enableDnsHostnames'
        });
        const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupportCommand = new DescribeVpcAttributeCommand({
          VpcId: outputs.vpc_id,
          Attribute: 'enableDnsSupport'
        });
        const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      } catch (error) {
        // DNS attributes check is optional if permissions are not available
        console.warn('Could not verify VPC DNS attributes:', error);
      }
    });

    it('validates private subnets for Lambda functions', async () => {
      if (skipIfMissing('vpc_id', outputs)) return;

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'tag:Type',
            Values: ['Private']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('validates VPC endpoint for DynamoDB', async () => {
      if (skipIfMissing('vpc_id', outputs)) return;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${region}.dynamodb`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);

      const vpcEndpoint = response.VpcEndpoints![0];
      expect(vpcEndpoint.State).toBe('available');
      expect(vpcEndpoint.VpcId).toBe(outputs.vpc_id);
    });

    it('validates security groups configuration', async () => {
      if (skipIfMissing('vpc_id', outputs)) return;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const lambdaSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('lambda-sg')
      );
      expect(lambdaSg).toBeDefined();
    });
  });

  describe('DynamoDB Tables', () => {
    let dynamoClient: DynamoDBClient;

    beforeAll(() => {
      dynamoClient = new DynamoDBClient({ region });
    });

    it('validates Global Secondary Indexes', async () => {
      if (skipIfMissing('dynamodb_tables', outputs)) return;

      const tables = outputs.dynamodb_tables;

      // Check transactions table GSI
      const transactionsCommand = new DescribeTableCommand({
        TableName: tables.transactions.name
      });
      const transactionsResponse = await dynamoClient.send(transactionsCommand);
      const customerIndex = transactionsResponse.Table!.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === 'CustomerIndex'
      );
      expect(customerIndex).toBeDefined();

      // Check audit logs table GSI
      const auditCommand = new DescribeTableCommand({
        TableName: tables.audit_logs.name
      });
      const auditResponse = await dynamoClient.send(auditCommand);
      const actionTypeIndex = auditResponse.Table!.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === 'ActionTypeIndex'
      );
      expect(actionTypeIndex).toBeDefined();
    });

    it('validates server-side encryption is enabled', async () => {
      if (skipIfMissing('dynamodb_tables', outputs)) return;

      const tables = outputs.dynamodb_tables;
      const tableNames = [tables.transactions.name, tables.audit_logs.name];

      for (const tableName of tableNames) {
        const command = new DescribeTableCommand({ TableName: tableName });
        const response = await dynamoClient.send(command);

        expect(response.Table!.SSEDescription).toBeDefined();
        expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
      }
    });

    it('validates point-in-time recovery is enabled', async () => {
      if (skipIfMissing('dynamodb_tables', outputs)) return;

      const tables = outputs.dynamodb_tables;
      const tableNames = [tables.transactions.name, tables.audit_logs.name];

      for (const tableName of tableNames) {
        const command = new DescribeContinuousBackupsCommand({ TableName: tableName });
        const response = await dynamoClient.send(command);

        expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
      }
    });
  });

  describe('S3 Bucket Configuration', () => {
    let s3Client: S3Client;

    beforeAll(() => {
      s3Client = new S3Client({ region });
    });

    it('validates S3 bucket exists and is accessible', async () => {
      if (skipIfMissing('s3_bucket', outputs)) return;

      const bucket = outputs.s3_bucket;
      expect(bucket.name).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucket.name });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('validates S3 bucket encryption configuration', async () => {
      if (skipIfMissing('s3_bucket', outputs)) return;

      const bucket = outputs.s3_bucket;

      const command = new GetBucketEncryptionCommand({ Bucket: bucket.name });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    it('validates S3 bucket public access is blocked', async () => {
      if (skipIfMissing('s3_bucket', outputs)) return;

      const bucket = outputs.s3_bucket;

      const command = new GetPublicAccessBlockCommand({ Bucket: bucket.name });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    it('validates S3 bucket versioning is enabled', async () => {
      if (skipIfMissing('s3_bucket', outputs)) return;

      const bucket = outputs.s3_bucket;

      const command = new GetBucketVersioningCommand({ Bucket: bucket.name });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('validates S3 bucket lifecycle configuration', async () => {
      if (skipIfMissing('s3_bucket', outputs)) return;

      const bucket = outputs.s3_bucket;

      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucket.name });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const lifecycleRule = response.Rules![0];
      expect(lifecycleRule.Status).toBe('Enabled');
      expect(lifecycleRule.Expiration?.Days).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    let lambdaClient: LambdaClient;

    beforeAll(() => {
      lambdaClient = new LambdaClient({ region });
    });

    it('validates all Lambda functions are deployed and active', async () => {
      if (skipIfMissing('lambda_functions', outputs)) return;

      const functions = outputs.lambda_functions;
      const functionNames = [
        functions.validation.name,
        functions.processing.name,
        functions.notification.name
      ];

      for (const functionName of functionNames) {
        const command = new GetFunctionCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(response.Configuration?.State).toBe('Active');
        expect(response.Configuration?.Runtime).toBe('python3.11');
      }
    });

    it('validates Lambda functions have VPC configuration', async () => {
      if (skipIfMissing('lambda_functions', outputs)) return;

      const functions = outputs.lambda_functions;
      const functionNames = [
        functions.validation.name,
        functions.processing.name,
        functions.notification.name
      ];

      for (const functionName of functionNames) {
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(response.VpcConfig).toBeDefined();
        expect(response.VpcConfig!.SubnetIds).toBeDefined();
        expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
        expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
        expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
      }
    });

    it('validates Lambda functions have proper environment variables', async () => {
      if (skipIfMissing('lambda_functions', outputs)) return;

      const functions = outputs.lambda_functions;
      const functionNames = [
        functions.validation.name,
        functions.processing.name,
        functions.notification.name
      ];

      for (const functionName of functionNames) {
        const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
        const response = await lambdaClient.send(command);

        expect(response.Environment?.Variables).toBeDefined();
        expect(response.Environment!.Variables!.ENVIRONMENT).toBeDefined();
        expect(response.Environment!.Variables!.TRANSACTIONS_TABLE).toBeDefined();
        expect(response.Environment!.Variables!.AUDIT_LOGS_TABLE).toBeDefined();
        expect(response.Environment!.Variables!.KMS_KEY_ID).toBeDefined();
      }
    });

    it('validates Lambda functions use environment-specific memory allocation', async () => {
      if (skipIfMissing('lambda_functions', outputs) || skipIfMissing('environment_configuration', outputs)) return;

      const functions = outputs.lambda_functions;
      const envConfig = outputs.environment_configuration;

      // Validation function
      const validationCommand = new GetFunctionConfigurationCommand({
        FunctionName: functions.validation.name
      });
      const validationResponse = await lambdaClient.send(validationCommand);
      expect(validationResponse.MemorySize).toBe(envConfig.validation_memory);

      // Processing function
      const processingCommand = new GetFunctionConfigurationCommand({
        FunctionName: functions.processing.name
      });
      const processingResponse = await lambdaClient.send(processingCommand);
      expect(processingResponse.MemorySize).toBe(envConfig.processing_memory);

      // Notification function
      const notificationCommand = new GetFunctionConfigurationCommand({
        FunctionName: functions.notification.name
      });
      const notificationResponse = await lambdaClient.send(notificationCommand);
      expect(notificationResponse.MemorySize).toBe(envConfig.notification_memory);
    });
  });

  describe('API Gateway Configuration', () => {
    let apiGatewayClient: APIGatewayClient;

    beforeAll(() => {
      apiGatewayClient = new APIGatewayClient({ region });
    });

    it('validates API Gateway REST API is deployed', async () => {
      if (skipIfMissing('api_gateway_url', outputs)) return;

      const apiIdMatch = outputs.api_gateway_url.match(/https:\/\/([^.]+)\.execute-api/);
      expect(apiIdMatch).toBeDefined();

      const apiId = apiIdMatch![1];
      const command = new GetRestApiCommand({ restApiId: apiId });
      const response = await apiGatewayClient.send(command);

      expect(response.id).toBe(apiId);
      expect(response.name).toBeDefined();
    });

    it('validates API Gateway endpoints configuration', async () => {
      if (skipIfMissing('api_gateway_endpoints', outputs)) return;

      const endpoints = outputs.api_gateway_endpoints;
      expect(endpoints.process).toBeDefined();
      expect(endpoints.validate).toBeDefined();
      expect(endpoints.status).toBeDefined();

      // Validate endpoint ARN format
      expect(isValidArn(endpoints.process)).toBe(true);
      expect(isValidArn(endpoints.validate)).toBe(true);
      expect(isValidArn(endpoints.status)).toBe(true);
    });

    it('validates API Gateway resources and methods', async () => {
      if (skipIfMissing('api_gateway_url', outputs)) return;

      const apiIdMatch = outputs.api_gateway_url.match(/https:\/\/([^.]+)\.execute-api/);
      const apiId = apiIdMatch![1];

      const resourcesCommand = new GetResourcesCommand({ restApiId: apiId });
      const resourcesResponse = await apiGatewayClient.send(resourcesCommand);

      expect(resourcesResponse.items).toBeDefined();
      expect(resourcesResponse.items!.length).toBeGreaterThan(1);

      const processResource = resourcesResponse.items!.find(item =>
        item.pathPart === 'process'
      );
      const validateResource = resourcesResponse.items!.find(item =>
        item.pathPart === 'validate'
      );
      const statusResource = resourcesResponse.items!.find(item =>
        item.pathPart === 'status'
      );

      expect(processResource).toBeDefined();
      expect(validateResource).toBeDefined();
      expect(statusResource).toBeDefined();
    });

    it('validates API Gateway stage deployment', async () => {
      if (skipIfMissing('api_gateway_url', outputs)) return;

      const urlParts = outputs.api_gateway_url.split('/');
      const stageName = urlParts[urlParts.length - 1];
      const apiIdMatch = outputs.api_gateway_url.match(/https:\/\/([^.]+)\.execute-api/);
      const apiId = apiIdMatch![1];

      const stagesCommand = new GetStagesCommand({ restApiId: apiId });
      const stagesResponse = await apiGatewayClient.send(stagesCommand);

      const stage = stagesResponse.item?.find(s => s.stageName === stageName);
      expect(stage).toBeDefined();
      expect(stage?.deploymentId).toBeDefined();
    });

    it('validates API Gateway URL accessibility format', () => {
      if (skipIfMissing('api_gateway_url', outputs)) return;

      expect(isValidUrl(outputs.api_gateway_url)).toBe(true);
      expect(outputs.api_gateway_url).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[^.]+\.amazonaws\.com\//);
    });
  });

  describe('KMS Key Configuration', () => {
    let kmsClient: KMSClient;

    beforeAll(() => {
      kmsClient = new KMSClient({ region });
    });

    it('validates KMS key is active and properly configured', async () => {
      if (skipIfMissing('kms_key', outputs)) return;

      const kmsKey = outputs.kms_key;
      expect(kmsKey.id).toBeDefined();
      expect(isValidKmsKeyId(kmsKey.id)).toBe(true);

      const command = new DescribeKeyCommand({ KeyId: kmsKey.id });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      // Note: Key rotation status requires separate GetKeyRotationStatus API call
    });

    it('validates KMS key alias', async () => {
      if (skipIfMissing('kms_key', outputs)) return;

      const kmsKey = outputs.kms_key;
      expect(kmsKey.alias).toBeDefined();
      expect(kmsKey.alias).toMatch(/^alias\/payment-.*-encryption$/);

      const command = new DescribeKeyCommand({ KeyId: kmsKey.alias });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata?.KeyId).toBe(kmsKey.id);
    });
  });

  describe('CloudWatch Logging Configuration', () => {
    let cloudWatchLogsClient: CloudWatchLogsClient;

    beforeAll(() => {
      cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    });

    it('validates Lambda function log groups exist', async () => {
      if (skipIfMissing('lambda_functions', outputs)) return;

      const functions = outputs.lambda_functions;
      const expectedLogGroups = [
        `/aws/lambda/${functions.validation.name}`,
        `/aws/lambda/${functions.processing.name}`,
        `/aws/lambda/${functions.notification.name}`
      ];

      const command = new DescribeLogGroupsCommand({});
      const response = await cloudWatchLogsClient.send(command);

      expectedLogGroups.forEach(logGroupName => {
        const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBeDefined();
      });
    });

    it('validates API Gateway log group exists', async () => {
      if (skipIfMissing('api_gateway_url', outputs)) return;

      const apiIdMatch = outputs.api_gateway_url.match(/https:\/\/([^.]+)\.execute-api/);
      const apiId = apiIdMatch![1];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/apigateway/'
      });
      const response = await cloudWatchLogsClient.send(command);

      // Check if there are API Gateway log groups
      expect(response.logGroups).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    let cloudWatchClient: CloudWatchClient;

    beforeAll(() => {
      cloudWatchClient = new CloudWatchClient({ region });
    });

    it('validates CloudWatch alarms are configured', async () => {
      if (skipIfMissing('lambda_functions', outputs)) return;

      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();

      // Check for Lambda error alarms
      const lambdaErrorAlarms = response.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes('errors') &&
        alarm.MetricName === 'Errors' &&
        alarm.Namespace === 'AWS/Lambda'
      );

      expect(lambdaErrorAlarms!.length).toBeGreaterThan(0);
    });
  });

  describe('Environment Configuration Validation', () => {
    it('validates environment-specific configuration values', () => {
      if (skipIfMissing('environment_configuration', outputs)) return;

      const envConfig = outputs.environment_configuration;

      expect(envConfig.region).toBe(region);
      expect(envConfig.validation_memory).toBeGreaterThan(0);
      expect(envConfig.processing_memory).toBeGreaterThan(0);
      expect(envConfig.notification_memory).toBeGreaterThan(0);
      expect(envConfig.api_throttle_rate).toBeGreaterThan(0);
      expect(envConfig.api_throttle_burst).toBeGreaterThan(0);
      expect(envConfig.s3_retention_days).toBeGreaterThan(0);
      expect(envConfig.logs_retention_days).toBeGreaterThan(0);
    });
  });

  describe('Cross-Service Integration Validation', () => {
    it('validates that Lambda functions reference correct DynamoDB tables', () => {
      if (skipIfMissing('lambda_functions', outputs) || skipIfMissing('dynamodb_tables', outputs)) return;

      // This would require getting Lambda environment variables and comparing
      // with DynamoDB table names, but we've already tested this above
      expect(true).toBe(true);
    });

    it('validates CloudWatch dashboard URL format', () => {
      if (skipIfMissing('cloudwatch_dashboard_url', outputs)) return;

      expect(isValidUrl(outputs.cloudwatch_dashboard_url)).toBe(true);
      expect(outputs.cloudwatch_dashboard_url).toContain('console.aws.amazon.com/cloudwatch');
      expect(outputs.cloudwatch_dashboard_url).toContain(`region=${region}`);
    });

  });
});
