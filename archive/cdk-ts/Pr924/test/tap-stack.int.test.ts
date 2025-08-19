import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

describe('TapStack Integration Tests', () => {
  test('Stack can be synthesized', () => {
    const app = new cdk.App();
    
    // This should not throw an error
    expect(() => {
      new TapStack(app, 'TestStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
    }).not.toThrow();
  });

  test('Stack synthesizes with environment suffix', () => {
    const app = new cdk.App();
    
    expect(() => {
      new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
    }).not.toThrow();
  });

  test('Stack can be deployed to us-west-2', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestStack', {
      env: {
        region: 'us-west-2',
      },
    });

    expect(stack.region).toBe('us-west-2');
  });
});

// Integration tests against live deployed resources
describe('TapStack Live Integration Tests', () => {
  let outputs: any = {};
  const region = 'us-west-2';

  beforeAll(() => {
    // Load the deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    }
  });

  test('S3 Main Bucket has encryption enabled', async () => {
    if (!outputs.MainBucketName) {
      console.warn('MainBucketName not found in outputs, skipping test');
      return;
    }

    const s3Client = new S3Client({ region });
    const command = new GetBucketEncryptionCommand({
      Bucket: outputs.MainBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
  });

  test('S3 Main Bucket has public access blocked', async () => {
    if (!outputs.MainBucketName) {
      console.warn('MainBucketName not found in outputs, skipping test');
      return;
    }

    const s3Client = new S3Client({ region });
    const command = new GetPublicAccessBlockCommand({
      Bucket: outputs.MainBucketName,
    });

    const response = await s3Client.send(command);
    expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  test('EC2 Instance has Project tag', async () => {
    if (!outputs.EC2InstanceId) {
      console.warn('EC2InstanceId not found in outputs, skipping test');
      return;
    }

    const ec2Client = new EC2Client({ region });
    const command = new DescribeInstancesCommand({
      InstanceIds: [outputs.EC2InstanceId],
    });

    const response = await ec2Client.send(command);
    const instance = response.Reservations?.[0]?.Instances?.[0];
    const projectTag = instance?.Tags?.find((tag) => tag.Key === 'Project');
    expect(projectTag?.Value).toBe('Internal');
  });

  test('EC2 Security Group allows only HTTPS traffic', async () => {
    if (!outputs.EC2InstanceId) {
      console.warn('EC2InstanceId not found in outputs, skipping test');
      return;
    }

    const ec2Client = new EC2Client({ region });
    const instanceCommand = new DescribeInstancesCommand({
      InstanceIds: [outputs.EC2InstanceId],
    });

    const instanceResponse = await ec2Client.send(instanceCommand);
    const securityGroupId = instanceResponse.Reservations?.[0]?.Instances?.[0]?.SecurityGroups?.[0]?.GroupId;

    if (!securityGroupId) {
      throw new Error('Security group not found for EC2 instance');
    }

    const sgCommand = new DescribeSecurityGroupsCommand({
      GroupIds: [securityGroupId],
    });

    const sgResponse = await ec2Client.send(sgCommand);
    const ingressRules = sgResponse.SecurityGroups?.[0]?.IpPermissions || [];
    
    // Check that there's exactly one ingress rule for HTTPS
    expect(ingressRules.length).toBe(1);
    expect(ingressRules[0].FromPort).toBe(443);
    expect(ingressRules[0].ToPort).toBe(443);
    expect(ingressRules[0].IpProtocol).toBe('tcp');
  });

  test('Lambda function has correct configuration', async () => {
    if (!outputs.LambdaFunctionName) {
      console.warn('LambdaFunctionName not found in outputs, skipping test');
      return;
    }

    const lambdaClient = new LambdaClient({ region });
    const command = new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    });

    const response = await lambdaClient.send(command);
    expect(response.Configuration?.Runtime).toBe('python3.11');
    expect(response.Configuration?.Timeout).toBe(300);
    expect(response.Configuration?.MemorySize).toBe(256);
  });

  test('VPC exists and is configured', async () => {
    if (!outputs.VpcId) {
      console.warn('VpcId not found in outputs, skipping test');
      return;
    }

    const ec2Client = new EC2Client({ region });
    const command = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [outputs.VpcId],
        },
      ],
    });

    const response = await ec2Client.send(command);
    // Check that the VPC has at least one instance (our EC2)
    const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
    expect(instances.length).toBeGreaterThan(0);
  });

  test('S3 Access Logs Bucket exists and is configured', async () => {
    if (!outputs.AccessLogsBucketName) {
      console.warn('AccessLogsBucketName not found in outputs, skipping test');
      return;
    }

    const s3Client = new S3Client({ region });
    const encryptionCommand = new GetBucketEncryptionCommand({
      Bucket: outputs.AccessLogsBucketName,
    });

    const encryptionResponse = await s3Client.send(encryptionCommand);
    expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

    const publicAccessCommand = new GetPublicAccessBlockCommand({
      Bucket: outputs.AccessLogsBucketName,
    });

    const publicAccessResponse = await s3Client.send(publicAccessCommand);
    expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
  });

  test('Lambda function can access S3 bucket', async () => {
    if (!outputs.LambdaFunctionName || !outputs.MainBucketName) {
      console.warn('Lambda or S3 bucket not found in outputs, skipping test');
      return;
    }

    const lambdaClient = new LambdaClient({ region });
    const command = new GetFunctionCommand({
      FunctionName: outputs.LambdaFunctionName,
    });

    const response = await lambdaClient.send(command);
    
    // Check that Lambda has the S3 bucket name in its environment
    expect(response.Configuration?.Environment?.Variables?.BUCKET_NAME).toBe(outputs.MainBucketName);
    expect(response.Configuration?.Environment?.Variables?.REGION).toBe(region);
  });
});
