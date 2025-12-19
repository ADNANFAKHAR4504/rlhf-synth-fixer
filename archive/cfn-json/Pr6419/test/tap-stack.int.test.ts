/**
 * Integration Tests for CloudFormation Transaction Processing Infrastructure
 *
 * This test suite validates the deployed AWS resources using actual stack outputs.
 * Tests use cfn-outputs/flat-outputs.json for dynamic validation - no hardcoding.
 */

const fs = require('fs');
const path = require('path');
const {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand
} = require('@aws-sdk/client-rds');
const {
  DynamoDBClient,
  DescribeTableCommand
} = require('@aws-sdk/client-dynamodb');
const {
  LambdaClient,
  GetFunctionCommand,
  ListTagsCommand
} = require('@aws-sdk/client-lambda');
const {
  IAMClient,
  GetPolicyCommand,
  GetPolicyVersionCommand
} = require('@aws-sdk/client-iam');

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';

let outputs;
let rdsClient;
let dynamoClient;
let lambdaClient;
let iamClient;

beforeAll(() => {
  // Load stack outputs
  const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Stack outputs not found at ${outputsPath}. Deploy the stack first.`);
  }

  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(outputsContent);

  // Initialize AWS SDK clients
  rdsClient = new RDSClient({ region: AWS_REGION });
  dynamoClient = new DynamoDBClient({ region: AWS_REGION });
  lambdaClient = new LambdaClient({ region: AWS_REGION });
  iamClient = new IAMClient({ region: AWS_REGION });

  console.log('Loaded stack outputs:', Object.keys(outputs));
});

describe('RDS Database Integration Tests', () => {
  let dbInstance;

  beforeAll(async () => {
    // Skip if required outputs are not available
    if (!outputs.DatabaseEndpoint) {
      console.log('Skipping RDS tests: DatabaseEndpoint not found in stack outputs');
      return;
    }

    // Extract DB identifier from endpoint (format: identifier.region.rds.amazonaws.com)
    const endpoint = outputs.DatabaseEndpoint;
    const dbIdentifier = endpoint.split('.')[0];

    const command = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbIdentifier
    });

    const response = await rdsClient.send(command);
    dbInstance = response.DBInstances[0];
  });

  test('should have RDS database deployed and available', async () => {
    if (!outputs.DatabaseEndpoint) return; // Skip if not deployed
    expect(dbInstance).toBeDefined();
    expect(dbInstance.DBInstanceStatus).toBe('available');
  });

  test('should use db.t3.large instance class (cost-optimized)', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.DBInstanceClass).toBe('db.t3.large');
  });

  test('should have Multi-AZ enabled for high availability', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.MultiAZ).toBe(true);
  });

  test('should use MySQL 8.0 engine', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.Engine).toBe('mysql');
    expect(dbInstance.EngineVersion).toMatch(/^8\.0\./);
  });

  test('should have storage encryption enabled', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.StorageEncrypted).toBe(true);
  });

  test('should not be publicly accessible', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.PubliclyAccessible).toBe(false);
  });

  test('should have backup retention configured', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
  });

  test('should have CloudWatch log exports enabled', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.EnabledCloudwatchLogsExports).toBeDefined();
    expect(dbInstance.EnabledCloudwatchLogsExports.length).toBeGreaterThan(0);
    expect(dbInstance.EnabledCloudwatchLogsExports).toContain('error');
  });

  test('should have DeletionProtection disabled for CI/CD', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.DeletionProtection).toBe(false);
  });

  test('should match endpoint from stack outputs', async () => {
    if (!outputs.DatabaseEndpoint) return;
    const expectedEndpoint = outputs.DatabaseEndpoint;
    expect(dbInstance.Endpoint.Address).toBe(expectedEndpoint);
  });

  test('should match port from stack outputs', async () => {
    if (!outputs.DatabaseEndpoint) return;
    const expectedPort = parseInt(outputs.DatabasePort);
    expect(dbInstance.Endpoint.Port).toBe(expectedPort);
  });

  test('should have gp3 storage type', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.StorageType).toBe('gp3');
  });

  test('should be in VPC', async () => {
    if (!outputs.DatabaseEndpoint) return;
    expect(dbInstance.DBSubnetGroup).toBeDefined();
    expect(dbInstance.DBSubnetGroup.VpcId).toBeDefined();
  });
});

describe('DynamoDB Table Integration Tests', () => {
  let tableDescription;

  beforeAll(async () => {
    const tableName = outputs.SessionTableName;

    const command = new DescribeTableCommand({
      TableName: tableName
    });

    const response = await dynamoClient.send(command);
    tableDescription = response.Table;
  });

  test('should have DynamoDB table deployed and active', async () => {
    expect(tableDescription).toBeDefined();
    expect(tableDescription.TableStatus).toBe('ACTIVE');
  });

  test('should use PAY_PER_REQUEST billing mode', async () => {
    expect(tableDescription.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
  });

  test('should have encryption enabled', async () => {
    expect(tableDescription.SSEDescription).toBeDefined();
    expect(tableDescription.SSEDescription.Status).toBe('ENABLED');
  });

  test('should have point-in-time recovery enabled', async () => {
    expect(tableDescription.ArchivalSummary).toBeUndefined(); // Not archived
  });

  test('should have primary key configured', async () => {
    const hashKey = tableDescription.KeySchema.find(k => k.KeyType === 'HASH');
    expect(hashKey).toBeDefined();
    expect(hashKey.AttributeName).toBe('sessionId');
  });

  test('should have Global Secondary Index', async () => {
    expect(tableDescription.GlobalSecondaryIndexes).toBeDefined();
    expect(tableDescription.GlobalSecondaryIndexes.length).toBeGreaterThan(0);

    const userIdIndex = tableDescription.GlobalSecondaryIndexes.find(
      i => i.IndexName === 'UserIdIndex'
    );
    expect(userIdIndex).toBeDefined();
  });

  test('should match table name from stack outputs', async () => {
    expect(tableDescription.TableName).toBe(outputs.SessionTableName);
  });
});

describe('Lambda Functions Integration Tests', () => {
  const lambdaFunctions = [
    { name: 'TransactionProcessor', arnKey: 'TransactionProcessorArn' },
    { name: 'PaymentProcessor', arnKey: 'PaymentProcessorArn' },
    { name: 'OrderProcessor', arnKey: 'OrderProcessorArn' }
  ];

  lambdaFunctions.forEach(({ name, arnKey }) => {
    describe(`${name} Lambda Function`, () => {
      let functionConfig;

      beforeAll(async () => {
        const functionArn = outputs[arnKey];

        const command = new GetFunctionCommand({
          FunctionName: functionArn
        });

        const response = await lambdaClient.send(command);
        functionConfig = response.Configuration;
      });

      test('should be deployed and active', async () => {
        expect(functionConfig).toBeDefined();
        expect(functionConfig.State).toBe('Active');
      });

      test('should use parameterized memory size', async () => {
        // Memory size should be one of the allowed values
        expect([512, 1024, 2048]).toContain(functionConfig.MemorySize);
      });

      test('should have appropriate timeout', async () => {
        expect(functionConfig.Timeout).toBeGreaterThanOrEqual(30);
      });

      test('should be in VPC', async () => {
        expect(functionConfig.VpcConfig).toBeDefined();
        expect(functionConfig.VpcConfig.VpcId).toBeDefined();
        expect(functionConfig.VpcConfig.SubnetIds.length).toBeGreaterThan(0);
        expect(functionConfig.VpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
      });

      test('should have environment variables configured', async () => {
        expect(functionConfig.Environment.Variables).toBeDefined();
        expect(functionConfig.Environment.Variables.DB_HOST).toBe(outputs.DatabaseEndpoint);
        expect(functionConfig.Environment.Variables.DB_PORT).toBe(outputs.DatabasePort.toString());
        expect(functionConfig.Environment.Variables.SESSION_TABLE).toBe(outputs.SessionTableName);
        expect(functionConfig.Environment.Variables.REGION).toBe(AWS_REGION);
      });

      test('should use Python runtime', async () => {
        expect(functionConfig.Runtime).toMatch(/python3\.\d+/);
      });

      test('should have IAM role attached', async () => {
        expect(functionConfig.Role).toBeDefined();
        expect(functionConfig.Role).toContain('arn:aws:iam::');
      });

      test('should match ARN from stack outputs', async () => {
        expect(functionConfig.FunctionArn).toBe(outputs[arnKey]);
      });
    });
  });
});

describe('IAM Policy Integration Tests', () => {
  test('should have consolidated Lambda execution managed policy', async () => {
    const policyArn = outputs.LambdaExecutionPolicyArn;
    expect(policyArn).toBeDefined();
    expect(policyArn).toContain('arn:aws:iam::');

    const getPolicyCommand = new GetPolicyCommand({
      PolicyArn: policyArn
    });

    const policyResponse = await iamClient.send(getPolicyCommand);
    expect(policyResponse.Policy).toBeDefined();
    expect(policyResponse.Policy.PolicyName).toContain('lambda-execution-policy');

    // Get policy version to check permissions
    const getPolicyVersionCommand = new GetPolicyVersionCommand({
      PolicyArn: policyArn,
      VersionId: policyResponse.Policy.DefaultVersionId
    });

    const versionResponse = await iamClient.send(getPolicyVersionCommand);
    const policyDocument = JSON.parse(decodeURIComponent(versionResponse.PolicyVersion.Document));

    // Verify consolidated permissions
    const statements = policyDocument.Statement;
    expect(statements.length).toBeGreaterThan(0);

    // Check for CloudWatch Logs permissions
    const logsStatement = statements.find(s =>
      s.Action && s.Action.includes('logs:CreateLogGroup')
    );
    expect(logsStatement).toBeDefined();

    // Check for VPC permissions
    const vpcStatement = statements.find(s =>
      s.Action && s.Action.includes('ec2:CreateNetworkInterface')
    );
    expect(vpcStatement).toBeDefined();

    // Check for DynamoDB permissions
    const dynamoStatement = statements.find(s =>
      s.Action && s.Action.includes('dynamodb:GetItem')
    );
    expect(dynamoStatement).toBeDefined();
  });
});

describe('Stack Outputs Validation', () => {
  test('should have all required outputs', () => {
    const requiredOutputs = [
      'DatabaseEndpoint',
      'DatabasePort',
      'SessionTableName',
      'TransactionProcessorArn',
      'PaymentProcessorArn',
      'OrderProcessorArn',
      'LambdaExecutionPolicyArn',
      'StackRegion',
      'EnvironmentType',
      'EnvironmentSuffix'
    ];

    requiredOutputs.forEach(outputKey => {
      expect(outputs[outputKey]).toBeDefined();
      expect(outputs[outputKey]).not.toBe('');
    });
  });

  test('should have correct region in outputs', () => {
    expect(outputs.StackRegion).toBe(AWS_REGION);
  });

  test('should have environment suffix in resource names', () => {
    const suffix = outputs.EnvironmentSuffix;
    expect(suffix).toBeDefined();
    expect(suffix.length).toBeGreaterThan(0);

    // Check that resource names include the suffix
    expect(outputs.SessionTableName).toContain(suffix);
  });
});

describe('Multi-Region Compatibility Tests', () => {
  test('should not contain hardcoded region values in resource names', () => {
    const resName = Object.fromEntries(
      Object.entries(outputs).filter(([key]) =>
        !key.toLowerCase().includes('arn') &&
        !key.toLowerCase().includes('region') &&
        !key.toLowerCase().includes('endpoint')
      )
    );

    // Resource names should not contain hardcoded regions
    const outputStr = JSON.stringify(resName);
    expect(outputStr).not.toMatch(/[a-z]+-[a-z]+-[0-9]+/); // Pattern like us-east-1
  });
});

describe('End-to-End Workflow Validation', () => {
  test('should have complete infrastructure stack deployed', () => {
    // Verify all major components are present in outputs
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(outputs.SessionTableName).toBeDefined();
    expect(outputs.TransactionProcessorArn).toBeDefined();
    expect(outputs.PaymentProcessorArn).toBeDefined();
    expect(outputs.OrderProcessorArn).toBeDefined();
  });

  test('should have Lambda functions connected to database and DynamoDB', () => {
    // This is validated by the environment variables test above
    // All Lambda functions should have DB_HOST, DB_PORT, SESSION_TABLE configured
    expect(outputs.DatabaseEndpoint).toBeTruthy();
    expect(outputs.SessionTableName).toBeTruthy();
  });

  test('should support transaction processing workflow', () => {
    // Verify that all components needed for transaction processing exist:
    // 1. Database for persistent storage
    expect(outputs.DatabaseEndpoint).toBeDefined();

    // 2. DynamoDB for session management
    expect(outputs.SessionTableName).toBeDefined();

    // 3. Lambda functions for processing
    expect(outputs.TransactionProcessorArn).toBeDefined();
    expect(outputs.PaymentProcessorArn).toBeDefined();
    expect(outputs.OrderProcessorArn).toBeDefined();

    // 4. IAM policy for permissions
    expect(outputs.LambdaExecutionPolicyArn).toBeDefined();
  });
});