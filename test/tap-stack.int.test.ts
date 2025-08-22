import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// AWS SDK clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const iamClient = new IAMClient({ region });
const cloudFormationClient = new CloudFormationClient({ region });
const autoScalingClient = new AutoScalingClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const kmsClient = new KMSClient({ region });
const rdsClient = new RDSClient({ region });

jest.setTimeout(90000);

const hasAwsCreds = () =>
  Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
      process.env.AWS_PROFILE ||
      process.env.AWS_WEB_IDENTITY_TOKEN_FILE
  );

const loadStackOutputs = async (): Promise<Record<string, string>> => {
  const envPath = process.env.CFN_OUTPUTS_PATH;
  const candidates: string[] = [];

  if (envPath) candidates.push(path.resolve(envPath));

  // Resolve relative to test file location
  candidates.push(path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json'));
  candidates.push(path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json.backup'));

  // Resolve relative to repo root (cwd when running Jest)
  candidates.push(path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json'));
  candidates.push(path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json.backup'));

  let chosenPath = '';
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      chosenPath = candidate;
      break;
    }
  }

  if (!chosenPath) {
    throw new Error(
      `Could not find CloudFormation outputs file. Tried: ${candidates.join(', ')}. ` +
        'Set CFN_OUTPUTS_PATH to override, or ensure cfn-outputs/flat-outputs.json exists.'
    );
  }

  try {
    const fileContent = fs.readFileSync(chosenPath, 'utf8');
    const outputs = JSON.parse(fileContent) as Record<string, string>;
    return outputs;
  } catch (error) {
    throw new Error(`Failed to read/parse outputs file at ${chosenPath}: ${String(error)}`);
  }
};

// Integration tests using live AWS resources
describe('TapStack Integration Tests (live AWS resources)', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    // Ensure shared config is loaded when using AWS_PROFILE
    if (process.env.AWS_PROFILE && !process.env.AWS_SDK_LOAD_CONFIG) {
      process.env.AWS_SDK_LOAD_CONFIG = '1';
    }

    // Load stack outputs from file
    outputs = await loadStackOutputs();
    
    if (Object.keys(outputs).length === 0) {
      throw new Error(
        `No stack outputs found. Ensure the stack ${stackName} is deployed and outputs are saved to cfn-outputs/flat-outputs.json`
      );
    }

    console.log(`Loaded outputs from cfn-outputs/flat-outputs.json`);
    console.log(`Available output keys: ${Object.keys(outputs).join(', ')}`);
  });

  // Only live AWS resource tests remain below

  // Live AWS resource tests using SDK (skip when no credentials)
  const describeLive = hasAwsCreds() ? describe : describe.skip;
  describeLive('Live AWS Resource Validation', () => {

    test('21 - VPC exists and is available', async () => {
      if (!outputs.VPCId) {
        throw new Error('VPCId not found in outputs');
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].VpcId).toBe(outputs.VPCId);
    });

    test('22 - S3 bucket exists and is accessible', async () => {
      if (!outputs.S3BucketName) {
        throw new Error('S3BucketName not found in outputs');
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName
      });

      // This will throw an error if bucket doesn't exist or is not accessible
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('23 - IAM role exists and has correct ARN format', async () => {
      if (!outputs.ALBLogDeliveryRoleArn) {
        throw new Error('ALBLogDeliveryRoleArn not found in outputs');
      }

      // Extract role name from ARN
      const arnParts = outputs.ALBLogDeliveryRoleArn.split('/');
      const roleName = arnParts[arnParts.length - 1];

      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.Arn).toBe(outputs.ALBLogDeliveryRoleArn);
      expect(response.Role!.RoleName).toBe(roleName);
    });

    test('24 - Auto Scaling Group exists', async () => {
      if (!outputs.AutoScalingGroupName) {
        throw new Error('AutoScalingGroupName not found in outputs');
      }

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      });

      const response = await autoScalingClient.send(command);
      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups![0].AutoScalingGroupName).toBe(outputs.AutoScalingGroupName);
    });

    test('25 - Application Load Balancer exists and is active', async () => {
      if (!outputs.ApplicationLoadBalancerDNS) {
        throw new Error('ApplicationLoadBalancerDNS not found in outputs');
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const loadBalancer = response.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      expect(loadBalancer).toBeDefined();
      expect(loadBalancer!.State?.Code).toBe('active');
      expect(loadBalancer!.Type).toBe('application');
    });

    test('26 - KMS Key exists and is enabled', async () => {
      if (!outputs.DatabaseKMSKeyId) {
        throw new Error('DatabaseKMSKeyId not found in outputs');
      }

      const command = new DescribeKeyCommand({
        KeyId: outputs.DatabaseKMSKeyId
      });

      const response = await kmsClient.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(outputs.DatabaseKMSKeyId);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('27 - Database instance is available', async () => {
      if (!outputs.DatabaseEndpoint) {
        throw new Error('DatabaseEndpoint not found in outputs');
      }

      // Extract DB instance identifier from endpoint
      const dbIdentifier = outputs.DatabaseEndpoint.split('.')[0];

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances).toHaveLength(1);
      expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
      expect(response.DBInstances![0].Endpoint?.Address).toBe(outputs.DatabaseEndpoint);
    });

    test('28 - Stack outputs match CloudFormation stack outputs', async () => {
      // Use the actual environment suffix from the outputs file instead of the environment variable
      const actualStackName = `TapStack${outputs.EnvironmentSuffix}`;
      
      const command = new DescribeStacksCommand({
        StackName: actualStackName
      });

      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];
      
      expect(stack).toBeDefined();
      expect(stack!.StackStatus).toMatch(/(CREATE_COMPLETE|UPDATE_COMPLETE)/);

      // Convert CloudFormation outputs to flat structure for comparison
      const cfnOutputs = (stack!.Outputs || []).reduce((acc: Record<string, string>, output) => {
        if (output.OutputKey && output.OutputValue) {
          acc[output.OutputKey] = output.OutputValue;
        }
        return acc;
      }, {});

      // Verify key outputs match
      expect(cfnOutputs.EnvironmentSuffix).toBe(outputs.EnvironmentSuffix);
      if (cfnOutputs.VPCId) expect(cfnOutputs.VPCId).toBe(outputs.VPCId);
      if (cfnOutputs.S3BucketName) expect(cfnOutputs.S3BucketName).toBe(outputs.S3BucketName);
    });
  });
});
