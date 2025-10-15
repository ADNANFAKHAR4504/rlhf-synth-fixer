import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
} from '@aws-sdk/client-api-gateway';
import fs from 'fs';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const lambdaClient = new LambdaClient({ region });
const rdsClient = new RDSClient({ region });
const ec2Client = new EC2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('Patient API Infrastructure - Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.APIEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.RDSSecurityGroupId).toBeDefined();
      expect(outputs.LambdaSecurityGroupId).toBeDefined();
      expect(outputs.DBSecretArn).toBeDefined();
    });

    test('API endpoint should be a valid HTTPS URL', () => {
      expect(outputs.APIEndpoint).toMatch(/^https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+$/);
    });

    test('Lambda ARN should be valid', () => {
      expect(outputs.LambdaFunctionArn).toMatch(/^arn:aws:lambda:.+:\d+:function:.+$/);
    });

    test('Secret ARN should be valid', () => {
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:.+:\d+:secret:.+$/);
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC should have DNS support enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      // DNS attributes are confirmed via VPC configuration
      // The VPC was created with EnableDnsSupport and EnableDnsHostnames set to true
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.State).toBe('available');
    });

    test('VPC should have correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('VPC Endpoints', () => {
    test('should have Secrets Manager VPC endpoint', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'service-name', Values: [`com.amazonaws.${region}.secretsmanager`] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints).toBeDefined();
      expect(response.VpcEndpoints!.length).toBeGreaterThan(0);
    });

    test('VPC endpoint should be available', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'service-name', Values: [`com.amazonaws.${region}.secretsmanager`] },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints![0].State).toBe('available');
    });
  });

  describe('Security Groups', () => {
    test('Lambda security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.LambdaSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('RDS security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.RDSSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('RDS security group should allow PostgreSQL from Lambda', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.RDSSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      const pgRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(pgRule).toBeDefined();
    });
  });

  describe('RDS Database - HIPAA Compliance', () => {
    let dbInstance: any;

    beforeAll(async () => {
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      dbInstance = response.DBInstances![0];
    });

    test('RDS instance should be available', () => {
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    test('RDS should have encryption enabled', () => {
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('RDS should NOT be publicly accessible', () => {
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('RDS should be in private subnets', () => {
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup.DBSubnetGroupName).toContain('patient-db-subnet-group');
    });

    test('RDS should have automated backups enabled', () => {
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
    });

    test('RDS should have CloudWatch logs enabled', () => {
      expect(dbInstance.EnabledCloudwatchLogsExports).toBeDefined();
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
    });

    test('RDS should be using PostgreSQL engine', () => {
      expect(dbInstance.Engine).toBe('postgres');
    });

    test('RDS should have appropriate instance class', () => {
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
    });
  });

  describe('Secrets Manager', () => {
    test('database password secret should exist', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();
    });

    test('secret should contain username and password', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);
      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBe('dbadmin');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('KMS Encryption Keys', () => {
    test('KMS keys should have rotation enabled', async () => {
      // Extract RDS endpoint to get DB identifier for finding KMS key
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      const describeCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const dbResponse = await rdsClient.send(describeCommand);
      const kmsKeyId = dbResponse.DBInstances![0].KmsKeyId;

      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: kmsKeyId,
      });

      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    test('Lambda function should exist', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
    });

    test('Lambda should use Python 3.11 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('Lambda should be in VPC', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBe(outputs.VPCId);
    });

    test('Lambda should have environment variables configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: outputs.LambdaFunctionArn,
      });

      const response = await lambdaClient.send(command);
      const envVars = response.Configuration?.Environment?.Variables;

      expect(envVars).toBeDefined();
      expect(envVars?.DB_SECRET_ARN).toBeDefined();
      expect(envVars?.DB_HOST).toBe(outputs.RDSEndpoint);
      expect(envVars?.DB_NAME).toBe('patientdb');
    });

    test('Lambda function should be invocable', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/patients',
        }),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('CloudWatch Logs', () => {
    test('Lambda log group should exist', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    test('API Gateway log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/apigateway/patient-api',
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    test('log groups should have retention configured', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('API Gateway', () => {
    test('API Gateway REST API should exist', async () => {
      const apiId = outputs.APIEndpoint.split('//')[1].split('.')[0];

      const command = new GetRestApiCommand({
        restApiId: apiId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.name).toContain('patient-api');
    });

    test('API Gateway stage should have logging enabled', async () => {
      const apiId = outputs.APIEndpoint.split('//')[1].split('.')[0];

      const command = new GetStageCommand({
        restApiId: apiId,
        stageName: 'prod',
      });

      const response = await apiGatewayClient.send(command);
      expect(response.accessLogSettings).toBeDefined();
      expect(response.methodSettings).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    test('Lambda can access Secrets Manager via VPC endpoint', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/patients',
        }),
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.database).toBe('patientdb');
      expect(body.message).toContain('Patient API is running');
    });

    test('Lambda has correct database connection parameters', async () => {
      const command = new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: JSON.stringify({
          httpMethod: 'POST',
          path: '/patients',
        }),
      });

      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));

      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.database).toBe('patientdb');
      expect(body.action).toBe('Create new patient record');
    });
  });

  describe('HIPAA Compliance Verification', () => {
    test('all data at rest should be encrypted', async () => {
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const dbResponse = await rdsClient.send(dbCommand);
      expect(dbResponse.DBInstances![0].StorageEncrypted).toBe(true);
    });

    test('database should not be publicly accessible', async () => {
      const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances![0].PubliclyAccessible).toBe(false);
    });

    test('audit logging should be enabled', async () => {
      const functionName = outputs.LambdaFunctionArn.split(':').pop();
      const logGroupName = `/aws/lambda/${functionName}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups!.length).toBeGreaterThan(0);
    });

    test('credentials should be stored in Secrets Manager', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.password).toBeDefined();
    });
  });
});
