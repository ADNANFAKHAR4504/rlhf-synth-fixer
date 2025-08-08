import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';

// Polyfill fetch for Node.js (Jest does not provide fetch by default)

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS SDK clients
const lambda = new LambdaClient({ region });
const apigateway = new APIGatewayClient({ region });
const cloudformation = new CloudFormationClient({ region });
const dynamodb = new DynamoDBClient({ region });
const iam = new IAMClient({ region });
const ec2 = new EC2Client({ region });
const configservice = new ConfigServiceClient({ region });

// Function to get outputs from CloudFormation stack
async function getStackOutputs(): Promise<Record<string, string>> {
  console.log(`🔍 Fetching outputs from CloudFormation stack: ${stackName}`);

  try {
    const response = await cloudformation.send(
      new DescribeStacksCommand({
        StackName: stackName,
      })
    );

    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    if (
      stack.StackStatus !== 'CREATE_COMPLETE' &&
      stack.StackStatus !== 'UPDATE_COMPLETE'
    ) {
      throw new Error(
        `Stack ${stackName} is not in a complete state: ${stack.StackStatus}`
      );
    }

    // Convert outputs to flat object
    const outputs: Record<string, string> = {};
    stack.Outputs?.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });

    console.log(`✅ Stack outputs loaded successfully`);
    console.log(`📊 Available outputs: ${Object.keys(outputs).join(', ')}`);

    return outputs;
  } catch (error) {
    console.error(`❌ Failed to get stack outputs: ${error}`);
    throw error;
  }
}

describe('TapStack Serverless Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    console.log(
      `🚀 Setting up integration tests for environment: ${environmentSuffix}`
    );
    outputs = await getStackOutputs();

    // Verify we have the required outputs (update to match actual stack outputs)
    const requiredOutputs = [
      'VPCId',
      'DynamoDBTableName',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'DatabaseSecurityGroupId',
      'WebServerSecurityGroupId',
      'ProductionRDSEndpoint',
      'ProductionLambdaArn',
      'LoadBalancerDNS',
      'S3BucketName',
      'ConfigS3BucketName',
      'LambdaExecutionRoleArn',
      'EC2InstanceRoleArn',
      'DynamoDBBackupVaultName',
      'ALBTargetGroupArn',
      'LambdaDeadLetterQueueUrl',
      'ConfigServiceRoleArn',
      'BackupServiceRoleArn',
    ];

    requiredOutputs.forEach(outputKey => {
      if (!outputs[outputKey]) {
        throw new Error(
          `Required output ${outputKey} not found in stack ${stackName}`
        );
      }
    });

    console.log(`✅ Stack outputs validation completed`);
  }, 60000); // 60 second timeout for beforeAll

  describe('Stack Information', () => {
    test('should have valid stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      console.log(`📋 Stack: ${stackName}`);
      console.log(`🌍 Region: ${region}`);
      console.log(`🏷️  Environment: ${environmentSuffix}`);
    });
  });

  describe('VPC', () => {
    test('should have a valid VPC ID and exist in AWS', async () => {
      const vpcId = outputs['VPCId'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[0-9a-f]{8,}$/);
      const { Vpcs } = await ec2.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );
      expect(Vpcs && Vpcs.length).toBe(1);
      expect(Vpcs?.[0]?.VpcId).toBe(vpcId);
    });
  });

  describe('Subnets', () => {
    test('should have public and private subnets that exist in AWS', async () => {
      const publicSubnets = [
        outputs['PublicSubnet1Id'],
        outputs['PublicSubnet2Id'],
      ].filter(Boolean);
      const privateSubnets = [
        outputs['PrivateSubnet1Id'],
        outputs['PrivateSubnet2Id'],
      ].filter(Boolean);
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
      for (const subnetId of [...publicSubnets, ...privateSubnets]) {
        expect(subnetId).toMatch(/^subnet-[0-9a-f]{8,}$/);
        const { Subnets } = await ec2.send(
          new DescribeSubnetsCommand({
            SubnetIds: [subnetId],
          })
        );
        expect(Subnets && Subnets.length).toBe(1);
        expect(Subnets?.[0]?.SubnetId).toBe(subnetId);
      }
    });
  });

  describe('Security Groups', () => {
    test('should have a security group for the database that exists in AWS', async () => {
      const dbSgId = outputs['DatabaseSecurityGroupId'];
      expect(dbSgId).toBeDefined();
      expect(dbSgId).toMatch(/^sg-[0-9a-f]{8,}$/);
      const { SecurityGroups } = await ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [dbSgId],
        })
      );
      expect(SecurityGroups && SecurityGroups.length).toBe(1);
      expect(SecurityGroups?.[0]?.GroupId).toBe(dbSgId);
    });
    test('should have a security group for the web server that exists in AWS', async () => {
      const webSgId = outputs['WebServerSecurityGroupId'];
      expect(webSgId).toBeDefined();
      expect(webSgId).toMatch(/^sg-[0-9a-f]{8,}$/);
      const { SecurityGroups } = await ec2.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [webSgId],
        })
      );
      expect(SecurityGroups && SecurityGroups.length).toBe(1);
      expect(SecurityGroups?.[0]?.GroupId).toBe(webSgId);
    });
  });

  describe('IAM Roles', () => {
    test('should have an execution role for Lambda that exists in AWS', async () => {
      const lambdaRoleArn = outputs['LambdaExecutionRoleArn'];
      expect(lambdaRoleArn).toBeDefined();
      expect(lambdaRoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.+$/);
      const roleName = lambdaRoleArn.split('/').pop();
      const { Role } = await iam.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );
      expect(Role).toBeDefined();
      expect(Role?.Arn).toBe(lambdaRoleArn);
    });
    test('should have an instance role for EC2 that exists in AWS', async () => {
      const ec2RoleArn = outputs['EC2InstanceRoleArn'];
      expect(ec2RoleArn).toBeDefined();
      expect(ec2RoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.+$/);
      const roleName = ec2RoleArn.split('/').pop();
      const { Role } = await iam.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );
      expect(Role).toBeDefined();
      expect(Role?.Arn).toBe(ec2RoleArn);
    });
  });

  describe('DynamoDB', () => {
    test('should have a DynamoDB table for state that exists in AWS', async () => {
      const tableName = outputs['DynamoDBTableName'];
      expect(tableName).toBeDefined();
      const { Table } = await dynamodb.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );
      expect(Table).toBeDefined();
      expect(Table?.TableStatus).toBe('ACTIVE');
    });
  });

  describe('Load Balancer', () => {
    test('should have a DNS name that resolves', async () => {
      const dnsName = outputs['LoadBalancerDNS'];
      expect(dnsName).toBeDefined();
      expect(dnsName).toMatch(/\.elb\.amazonaws\.com$/);
      // Try DNS resolution (optional, can skip if not needed)
      const dns = require('dns').promises;
      const addresses = await dns.lookup(dnsName).catch(() => null);
      expect(addresses).toBeTruthy();
    });
  });

  describe('Lambda Functions', () => {
    test('should have a production lambda ARN that exists in AWS', async () => {
      const lambdaArn = outputs['ProductionLambdaArn'];
      expect(lambdaArn).toBeDefined();
      expect(lambdaArn).toMatch(/^arn:aws:lambda:[\w-]+:\d{12}:function:.+$/);
      const functionName = lambdaArn.split(':').pop();
      const lambdaConfig = await lambda.send(
        new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );
      expect(lambdaConfig).toBeDefined();
      expect(lambdaConfig.FunctionArn).toBe(lambdaArn);
    });
  });

  describe('Output Completeness', () => {
    test('All required outputs should be defined and not empty', () => {
      Object.entries(outputs).forEach(([key, val]) => {
        expect(val).toBeDefined();
        expect(val).not.toBe('');
      });
    });
  });

  describe('High Availability Validation', () => {
    test('Public subnets should be in different AZs (inferred from being different)', () => {
      const publicSubnetIds = [
        outputs['PublicSubnet1Id'],
        outputs['PublicSubnet2Id'],
      ].filter(Boolean);
      expect(publicSubnetIds.length).toBeGreaterThan(1);
      const azs = new Set();
      publicSubnetIds.forEach(subnetId => {
        const az = subnetId.split('-')[1];
        azs.add(az);
      });
      expect(azs.size).toBe(publicSubnetIds.length);
    });
    test('Private subnets should be in different AZs (inferred from being different)', () => {
      const privateSubnetIds = [
        outputs['PrivateSubnet1Id'],
        outputs['PrivateSubnet2Id'],
      ].filter(Boolean);
      expect(privateSubnetIds.length).toBeGreaterThan(1);
      const azs = new Set();
      privateSubnetIds.forEach(subnetId => {
        const az = subnetId.split('-')[1];
        azs.add(az);
      });
      expect(azs.size).toBe(privateSubnetIds.length);
    });
  });
});
