import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetIntegrationsCommand,
  GetRoutesCommand,
  GetStagesCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetQueueAttributesCommand,
  SQSClient
} from '@aws-sdk/client-sqs';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '../flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawData = fs.readFileSync(outputsPath, 'utf-8');
  outputs = JSON.parse(rawData);

  // Parse stringified arrays
  if (typeof outputs.privateSubnetIds === 'string') {
    outputs.privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
  }
  if (typeof outputs.publicSubnetIds === 'string') {
    outputs.publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
  }
}

const REGION = process.env.AWS_REGION || 'us-east-1';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'test';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const apiGatewayClient = new ApiGatewayV2Client({ region: REGION });
const iamClient = new IAMClient({ region: REGION });
const cloudWatchClient = new CloudWatchClient({ region: REGION });

describe('Payment Infrastructure Integration Tests', () => {
  // Skip all tests if outputs are not available
  const hasOutputs = Object.keys(outputs).length > 0;

  describe('VPC Infrastructure', () => {
    it('should verify VPC exists and is configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const vpcId = outputs.vpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsSupport?.Value).toBe(true);
      expect(vpc.EnableDnsHostnames?.Value).toBe(true);
    });

    it('should verify private subnets exist and are configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const privateSubnetIds = outputs.privateSubnetIds;
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBe(2);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: privateSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(2);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24']);

      // Verify subnets are in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      // Verify subnets are not public
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should verify public subnets exist and are configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const publicSubnetIds = outputs.publicSubnetIds;
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBe(2);

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: publicSubnetIds,
        })
      );

      expect(response.Subnets).toHaveLength(2);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24']);

      // Verify subnets are in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      // Verify subnets have public IP mapping enabled
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should verify NAT Gateway exists and is available', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const vpcId = outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);

      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.NatGatewayAddresses).toBeDefined();
    });

    it('should verify route tables are configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const vpcId = outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.RouteTables).toBeDefined();
      // Should have at least 2 route tables (public and private)
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(2);

      // Verify public route table has internet gateway route
      const publicRouteTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTable).toBeDefined();

      // Verify private route table has NAT gateway route
      const privateRouteTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTable).toBeDefined();
    });
  });

  describe('S3 Audit Logs Bucket', () => {
    it('should verify S3 bucket exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const bucketName = outputs.auditLogsBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('payment-audit-logs');

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    it('should verify S3 bucket versioning is enabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const bucketName = outputs.auditLogsBucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );

      expect(response.Status).toBe('Enabled');
    });

    it('should verify S3 bucket lifecycle policy exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const bucketName = outputs.auditLogsBucketName;
      const response = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThanOrEqual(1);

      // Verify intelligent tiering rule exists
      const intelligentTieringRule = response.Rules!.find(
        rule => rule.Status === 'Enabled' && rule.Transitions?.some(
          t => t.StorageClass === 'INTELLIGENT_TIERING'
        )
      );
      expect(intelligentTieringRule).toBeDefined();
    });
  });

  describe('SQS Payment Queue', () => {
    it('should verify SQS queue exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const queueUrl = outputs.paymentQueueUrl;
      expect(queueUrl).toBeDefined();
      expect(queueUrl).toContain('payment-notifications');

      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      expect(response.Attributes).toBeDefined();
    });

    it('should verify SQS queue has correct configuration', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const queueUrl = outputs.paymentQueueUrl;
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['All'],
        })
      );

      const attrs = response.Attributes!;

      // Verify visibility timeout
      expect(attrs.VisibilityTimeout).toBe('300');

      // Verify DLQ is configured
      expect(attrs.RedrivePolicy).toBeDefined();
      const redrivePolicy = JSON.parse(attrs.RedrivePolicy!);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
      expect(redrivePolicy.deadLetterTargetArn).toBeDefined();
    });

    it('should verify Dead Letter Queue exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const queueUrl = outputs.paymentQueueUrl;
      const response = await sqsClient.send(
        new GetQueueAttributesCommand({
          QueueUrl: queueUrl,
          AttributeNames: ['RedrivePolicy'],
        })
      );

      const redrivePolicy = JSON.parse(response.Attributes!.RedrivePolicy!);
      const dlqArn = redrivePolicy.deadLetterTargetArn;

      expect(dlqArn).toBeDefined();
      expect(dlqArn).toContain('payment-notifications-dlq');
    });
  });

  describe('RDS Database', () => {
    it('should verify RDS instance exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const rdsEndpoint = outputs.rdsEndpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toContain('rds.amazonaws.com');

      const dbInstanceId = rdsEndpoint.split('.')[0];
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
    });

    it('should verify RDS instance is configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const rdsEndpoint = outputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbInstance = response.DBInstances![0];

      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.MultiAZ).toBe(false);
      expect(dbInstance.StorageType).toBe('gp3');
      expect(dbInstance.AllocatedStorage).toBe(20);
    });

    it('should verify RDS backup retention is configured', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const rdsEndpoint = outputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(3);
    });

    it('should verify RDS is in private subnets', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const rdsEndpoint = outputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbInstance = response.DBInstances![0];
      const subnetGroupName = dbInstance.DBSubnetGroup?.DBSubnetGroupName;

      expect(subnetGroupName).toBeDefined();

      const subnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        })
      );

      const subnetGroup = subnetGroupResponse.DBSubnetGroups![0];
      const subnetIds = subnetGroup.Subnets!.map(s => s.SubnetIdentifier);

      // Verify subnets match private subnets
      outputs.privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetIds).toContain(subnetId);
      });
    });

    it('should verify RDS deletion protection is disabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const rdsEndpoint = outputs.rdsEndpoint;
      const dbInstanceId = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceId,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DeletionProtection).toBe(false);
    });
  });

  describe('Lambda Functions', () => {
    it('should verify process payment Lambda function exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.processPaymentLambdaArn;
      expect(lambdaArn).toBeDefined();
      expect(lambdaArn).toContain('process-payment');

      const functionName = lambdaArn.split(':').pop();
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration?.FunctionArn).toBe(lambdaArn);
    });

    it('should verify verify payment Lambda function exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.verifyPaymentLambdaArn;
      expect(lambdaArn).toBeDefined();
      expect(lambdaArn).toContain('verify-payment');

      const functionName = lambdaArn.split(':').pop();
      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration?.FunctionArn).toBe(lambdaArn);
    });

    it('should verify process Lambda is configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.processPaymentLambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(response.Runtime).toMatch(/nodejs/);
      expect(response.Handler).toBe('index.processPayment');
      expect(response.MemorySize).toBeGreaterThanOrEqual(128);
      expect(response.Timeout).toBeGreaterThanOrEqual(15);
      expect(response.Environment?.Variables).toBeDefined();
    });

    it('should verify verify Lambda is configured correctly', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.verifyPaymentLambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(response.Runtime).toMatch(/nodejs/);
      expect(response.Handler).toBe('index.verifyPayment');
      expect(response.MemorySize).toBeGreaterThanOrEqual(128);
      expect(response.Timeout).toBeGreaterThanOrEqual(15);
      expect(response.Environment?.Variables).toBeDefined();
    });

    it('should verify Lambda functions are in VPC', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const processArn = outputs.processPaymentLambdaArn;
      const processFunctionName = processArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: processFunctionName })
      );

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBe(outputs.vpcId);
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig?.SecurityGroupIds!.length).toBeGreaterThan(0);
    });

    it('should verify Lambda environment variables are set', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.processPaymentLambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const response = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      const envVars = response.Environment?.Variables!;
      expect(envVars.RDS_ENDPOINT).toBeDefined();
      expect(envVars.RDS_DB_NAME).toBe('paymentdb');
      expect(envVars.RDS_USERNAME).toBe('dbadmin');
      expect(envVars.RDS_PASSWORD).toBeDefined();
      expect(envVars.AUDIT_LOGS_BUCKET).toBe(outputs.auditLogsBucketName);
      expect(envVars.PAYMENT_QUEUE_URL).toBe(outputs.paymentQueueUrl);
    });

    it('should verify Lambda CloudWatch alarms exist', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'process-payment-errors',
        })
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('Errors');
      expect(alarm.Namespace).toBe('AWS/Lambda');
      expect(alarm.Statistic).toBe('Sum');
    });
  });

  describe('API Gateway', () => {
    it('should verify API Gateway exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const apiEndpoint = outputs.apiGatewayEndpoint;
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toMatch(/^https:\/\//);
      expect(apiEndpoint).toContain('execute-api');

      // Extract API ID from endpoint
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetApiCommand({ ApiId: apiId })
      );

      expect(response.ApiId).toBe(apiId);
      expect(response.ProtocolType).toBe('HTTP');
    });

    it('should verify API Gateway has default stage', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const apiEndpoint = outputs.apiGatewayEndpoint;
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetStagesCommand({ ApiId: apiId })
      );

      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThanOrEqual(1);

      const defaultStage = response.Items!.find(s => s.StageName === '$default');
      expect(defaultStage).toBeDefined();
      expect(defaultStage?.AutoDeploy).toBe(true);
    });

    it('should verify API Gateway routes are configured', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const apiEndpoint = outputs.apiGatewayEndpoint;
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetRoutesCommand({ ApiId: apiId })
      );

      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThanOrEqual(2);

      const routeKeys = response.Items!.map(r => r.RouteKey);
      expect(routeKeys).toContain('POST /process-payment');
      expect(routeKeys).toContain('POST /verify-payment');
    });

    it('should verify API Gateway integrations exist', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const apiEndpoint = outputs.apiGatewayEndpoint;
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetIntegrationsCommand({ ApiId: apiId })
      );

      expect(response.Items).toBeDefined();
      expect(response.Items!.length).toBeGreaterThanOrEqual(2);

      response.Items!.forEach(integration => {
        expect(integration.IntegrationType).toBe('AWS_PROXY');
        expect(integration.IntegrationUri).toContain('lambda');
      });
    });

    it('should verify API Gateway has CloudWatch logging', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const apiEndpoint = outputs.apiGatewayEndpoint;
      const apiId = apiEndpoint.split('//')[1].split('.')[0];

      const response = await apiGatewayClient.send(
        new GetStagesCommand({ ApiId: apiId })
      );

      const defaultStage = response.Items!.find(s => s.StageName === '$default');
      expect(defaultStage?.AccessLogSettings).toBeDefined();
      expect(defaultStage?.AccessLogSettings?.DestinationArn).toBeDefined();
    });
  });

  describe('IAM Roles and Permissions', () => {
    it('should verify Lambda execution role exists', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.processPaymentLambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      const roleArn = lambdaResponse.Role!;
      const roleName = roleArn.split('/').pop();

      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    it('should verify Lambda role has required policies attached', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaArn = outputs.processPaymentLambdaArn;
      const functionName = lambdaArn.split(':').pop();

      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      const roleArn = lambdaResponse.Role!;
      const roleName = roleArn.split('/').pop();

      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      const policyArns = response.AttachedPolicies!.map(p => p.PolicyArn);

      // Verify basic Lambda execution policy
      expect(policyArns.some(arn =>
        arn?.includes('AWSLambdaBasicExecutionRole')
      )).toBe(true);

      // Verify VPC execution policy
      expect(policyArns.some(arn =>
        arn?.includes('AWSLambdaVPCAccessExecutionRole')
      )).toBe(true);
    });
  });

  describe('Resource Naming and Tagging', () => {
    it('should verify all resources include environmentSuffix in names', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const suffix = ENVIRONMENT_SUFFIX;

      expect(outputs.auditLogsBucketName).toContain(suffix);
      expect(outputs.paymentQueueUrl).toContain(suffix);
      expect(outputs.processPaymentLambdaArn).toContain(suffix);
      expect(outputs.verifyPaymentLambdaArn).toContain(suffix);
      expect(outputs.rdsEndpoint).toContain(suffix);
    });

    it('should verify VPC has proper tags', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const vpcId = outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs![0];
      expect(vpc.Tags).toBeDefined();

      const nameTag = vpc.Tags!.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain('payment-vpc');
    });

    it('should verify subnets have proper tags', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const privateSubnetIds = outputs.privateSubnetIds;
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );

      response.Subnets!.forEach(subnet => {
        expect(subnet.Tags).toBeDefined();
        const nameTag = subnet.Tags!.find(t => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag?.Value).toContain('payment-private-subnet');
      });
    });
  });

  describe('Security Configuration', () => {
    it('should verify RDS security group allows PostgreSQL from VPC', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const vpcId = outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`payment-db-sg-*`] },
          ],
        })
      );

      const dbSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('payment-db-sg')
      );

      expect(dbSg).toBeDefined();

      const postgresRule = dbSg?.IpPermissions?.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(postgresRule).toBeDefined();
    });

    it('should verify Lambda security group allows outbound traffic', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const vpcId = outputs.vpcId;
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: [`payment-lambda-sg-*`] },
          ],
        })
      );

      const lambdaSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('payment-lambda-sg')
      );

      expect(lambdaSg).toBeDefined();
      expect(lambdaSg?.IpPermissionsEgress).toBeDefined();
      expect(lambdaSg?.IpPermissionsEgress!.length).toBeGreaterThan(0);
    });
  });
});
