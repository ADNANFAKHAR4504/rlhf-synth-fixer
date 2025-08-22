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

const loadStackOutputs = async () => {
  const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  if (!fs.existsSync(outputsFilePath)) {
    console.warn(`Outputs file not found: ${outputsFilePath}`);
    return {} as Record<string, string>;
  }

  try {
    const fileContent = fs.readFileSync(outputsFilePath, 'utf8');
    const outputs = JSON.parse(fileContent);
    return outputs as Record<string, string>;
  } catch (error) {
    console.error('Error reading outputs file:', error);
    return {} as Record<string, string>;
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

  // Basic output validation tests
  test('01 - has ApplicationLoadBalancerDNS', () => {
    expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
    expect(typeof outputs.ApplicationLoadBalancerDNS).toBe('string');
    expect(outputs.ApplicationLoadBalancerDNS.length).toBeGreaterThan(10);
  });

  test('02 - has ApplicationLoadBalancerURL', () => {
    expect(outputs.ApplicationLoadBalancerURL).toBeDefined();
    expect(typeof outputs.ApplicationLoadBalancerURL).toBe('string');
    expect(outputs.ApplicationLoadBalancerURL.length).toBeGreaterThan(10);
  });

  test('03 - has VPCId', () => {
    expect(outputs.VPCId).toBeDefined();
    expect(typeof outputs.VPCId).toBe('string');
    expect(outputs.VPCId.startsWith('vpc-')).toBe(true);
  });

  test('04 - has DatabaseEndpoint', () => {
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(typeof outputs.DatabaseEndpoint).toBe('string');
    expect(outputs.DatabaseEndpoint.length).toBeGreaterThan(20);
  });

  test('05 - has S3BucketName', () => {
    expect(outputs.S3BucketName).toBeDefined();
    expect(typeof outputs.S3BucketName).toBe('string');
    expect(outputs.S3BucketName.length).toBeGreaterThan(10);
  });

  test('06 - has AutoScalingGroupName', () => {
    expect(outputs.AutoScalingGroupName).toBeDefined();
    expect(typeof outputs.AutoScalingGroupName).toBe('string');
    expect(outputs.AutoScalingGroupName.length).toBeGreaterThan(5);
  });

  test('07 - has EnvironmentSuffix', () => {
    expect(outputs.EnvironmentSuffix).toBeDefined();
    expect(typeof outputs.EnvironmentSuffix).toBe('string');
    expect(outputs.EnvironmentSuffix.length).toBeGreaterThan(0);
  });

  test('08 - has ALBLogDeliveryRoleArn', () => {
    expect(outputs.ALBLogDeliveryRoleArn).toBeDefined();
    expect(typeof outputs.ALBLogDeliveryRoleArn).toBe('string');
    expect(outputs.ALBLogDeliveryRoleArn.startsWith('arn:aws:iam::')).toBe(true);
  });

  test('09 - has DatabaseKMSKeyId', () => {
    expect(outputs.DatabaseKMSKeyId).toBeDefined();
    expect(typeof outputs.DatabaseKMSKeyId).toBe('string');
    expect(outputs.DatabaseKMSKeyId.length).toBeGreaterThan(30);
  });

  test('10 - has DatabaseKMSKeyArn', () => {
    expect(outputs.DatabaseKMSKeyArn).toBeDefined();
    expect(typeof outputs.DatabaseKMSKeyArn).toBe('string');
    expect(outputs.DatabaseKMSKeyArn.startsWith('arn:aws:kms:')).toBe(true);
  });

  // Structure checks for required output keys
  const requiredKeys = [
    'ApplicationLoadBalancerDNS',
    'ApplicationLoadBalancerURL',
    'VPCId',
    'DatabaseEndpoint',
    'S3BucketName',
    'AutoScalingGroupName',
    'StackRegion',
    'ALBLogDeliveryRoleArn',
    'DatabaseKMSKeyId',
    'DatabaseKMSKeyArn',
    'EnvironmentSuffix',
  ];

  requiredKeys.forEach((key, index) => {
    test(`11.${index + 1} - output key present: ${key}`, () => {
      expect(outputs[key]).toBeDefined();
    });
  });

  test('12 - ApplicationLoadBalancerURL is valid HTTP URL', () => {
    expect(outputs.ApplicationLoadBalancerURL).toBeDefined();
    expect(outputs.ApplicationLoadBalancerURL.startsWith('http://')).toBe(true);
  });

  test('13 - S3BucketName contains environment suffix', () => {
    expect(outputs.S3BucketName).toBeDefined();
    expect(outputs.EnvironmentSuffix).toBeDefined();
    expect(outputs.S3BucketName.includes(outputs.EnvironmentSuffix)).toBe(true);
  });

  test('14 - DatabaseEndpoint contains expected domain', () => {
    expect(outputs.DatabaseEndpoint).toBeDefined();
    expect(outputs.DatabaseEndpoint.includes('.rds.amazonaws.com')).toBe(true);
  });

  test('15 - outputs shape is an object', () => {
    expect(typeof outputs).toBe('object');
    expect(Array.isArray(outputs)).toBe(false);
  });

  test('16 - No unexpected empty values', () => {
    Object.values(outputs).forEach(v => {
      expect(v).toBeTruthy();
    });
  });

  test('17 - EnvironmentSuffix is valid', () => {
    expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
  });

  test('18 - ALBLogDeliveryRoleArn contains correct format', () => {
    expect(outputs.ALBLogDeliveryRoleArn).toBeDefined();
    expect(outputs.ALBLogDeliveryRoleArn.includes(':role/')).toBe(true);
  });

  test('19 - DatabaseKMSKeyArn contains correct region', () => {
    expect(outputs.DatabaseKMSKeyArn).toBeDefined();
    expect(outputs.DatabaseKMSKeyArn.includes(region)).toBe(true);
  });

  test('20 - All required output keys are present', () => {
    const missingKeys = requiredKeys.filter(key => !outputs[key]);
    expect(missingKeys).toEqual([]);
  });

  // Live AWS resource tests using SDK
  describe('Live AWS Resource Validation', () => {
    beforeAll(() => {
      // Check AWS credentials only for live resource tests
      if (!hasAwsCreds()) {
        throw new Error(
          'AWS credentials are not configured. Set AWS_PROFILE (and AWS_SDK_LOAD_CONFIG=1) or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY before running live AWS resource tests.'
        );
      }
    });

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
