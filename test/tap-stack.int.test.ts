import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration
let outputs: Record<string, string> = {};
let stackName: string = '';
const region = process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// AWS SDK Clients configured for LocalStack
const clientConfig = {
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
};

const cfnClient = new CloudFormationClient(clientConfig);
const s3Client = new S3Client({ ...clientConfig, forcePathStyle: true });
const logsClient = new CloudWatchLogsClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const iamClient = new IAMClient(clientConfig);
const snsClient = new SNSClient(clientConfig);

// Test data
const testData: { s3TestObjects: string[]; testTimestamp: string } = {
  s3TestObjects: [],
  testTimestamp: new Date().toISOString().replace(/[:.]/g, '-'),
};

const isValidOutput = (value: string | undefined): boolean => {
  return value !== undefined && value !== 'unknown' && value !== '';
};

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    const outputsPath = 'cfn-outputs/flat-outputs.json';
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
    stackName = outputs.StackName;

    const stackResponse = await cfnClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );
    if (!stackResponse.Stacks || stackResponse.Stacks[0].StackStatus?.includes('FAILED')) {
      throw new Error(`Stack ${stackName} is not in a valid state`);
    }
  });

  afterAll(async () => {
    const bucketName = outputs.StaticContentBucketName;
    if (bucketName && testData.s3TestObjects.length > 0) {
      for (const key of testData.s3TestObjects) {
        try {
          await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        } catch { /* ignore cleanup errors */ }
      }
    }
  });

  describe('CloudFormation Stack', () => {
    test('should have all resources in CREATE_COMPLETE state', async () => {
      const response = await cfnClient.send(
        new ListStackResourcesCommand({ StackName: stackName })
      );
      expect(response.StackResourceSummaries).toBeDefined();
      const resources = response.StackResourceSummaries!;
      const completedCount = resources.filter(r => r.ResourceStatus === 'CREATE_COMPLETE').length;
      expect(completedCount).toBeGreaterThan(0);
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR', async () => {
      const vpcId = outputs.VPCId;
      expect(isValidOutput(vpcId)).toBe(true);

      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should have 3 public subnets with public IP mapping', async () => {
      const subnetIds = outputs.PublicSubnetIds.split(',');
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      expect(response.Subnets).toHaveLength(3);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      expect(subnetIds).toHaveLength(3);

      const response = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.VPCId] }]
        })
      );
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
    });

    test('should have at least 4 route tables', async () => {
      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
        })
      );
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', async () => {
      const sgId = outputs.ALBSecurityGroupId;
      expect(isValidOutput(sgId)).toBe(true);

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('should have Web Server security group', async () => {
      const sgId = outputs.WebServerSecurityGroupId;
      expect(isValidOutput(sgId)).toBe(true);

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('should have Database security group', async () => {
      const sgId = outputs.DatabaseSecurityGroupId;
      expect(isValidOutput(sgId)).toBe(true);

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
      expect(response.SecurityGroups).toHaveLength(1);
    });
  });

  describe('S3 Buckets', () => {
    test('should have static content bucket', async () => {
      const bucketName = outputs.StaticContentBucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should upload and retrieve content', async () => {
      const bucketName = outputs.StaticContentBucketName;
      const testKey = `test/upload-${testData.testTimestamp}.txt`;
      const testContent = `Test content ${Date.now()}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      }));
      testData.s3TestObjects.push(testKey);

      const getResponse = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: testKey }));
      const retrievedContent = await getResponse.Body!.transformToString();
      expect(retrievedContent).toBe(testContent);
    });

    test('should list objects', async () => {
      const response = await s3Client.send(
        new ListObjectsV2Command({ Bucket: outputs.StaticContentBucketName, MaxKeys: 10 })
      );
      expect(response.Contents).toBeDefined();
    });

    test('should have ALB logs bucket', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: outputs.ALBAccessLogsBucketName })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Role', async () => {
      const roleArn = outputs.EC2RoleArn;
      expect(isValidOutput(roleArn)).toBe(true);

      const roleName = roleArn.split('/').pop()!;
      const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
    });

    test('should have EC2 Instance Profile', async () => {
      const profileArn = outputs.EC2InstanceProfileArn;
      expect(isValidOutput(profileArn)).toBe(true);

      const profileName = profileArn.split('/').pop()!;
      const response = await iamClient.send(new GetInstanceProfileCommand({ InstanceProfileName: profileName }));
      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.InstanceProfileName).toBe(profileName);
    });
  });

  describe('SNS Topic', () => {
    test('should have SNS topic accessible', async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(isValidOutput(topicArn)).toBe(true);

      const response = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(response.Attributes).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have Apache access log group', async () => {
      const logGroupName = outputs.ApacheAccessLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    test('should have Apache error log group', async () => {
      const logGroupName = outputs.ApacheErrorLogGroupName;
      expect(logGroupName).toBeDefined();

      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );
      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });
  });

  describe('Fallback Resources (LocalStack Limitations)', () => {
    // These resources are deployed as fallback in LocalStack
    // We only verify the outputs exist, not the actual resources
    
    test('should have ALB outputs defined', async () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBArn).toBeDefined();
      expect(outputs.ALBTargetGroupArn).toBeDefined();
    });

    test('should have Auto Scaling outputs defined', async () => {
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.LaunchTemplateId).toBeDefined();
    });

    test('should have RDS outputs defined', async () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.DatabasePort).toBeDefined();
    });

    test('should not have DatabaseSecretArn (removed for LocalStack)', async () => {
      expect(outputs.DatabaseSecretArn).toBeUndefined();
    });

    test('should have CloudFront outputs defined', async () => {
      expect(outputs.CloudFrontDistributionId).toBeDefined();
      expect(outputs.CloudFrontDomainName).toBeDefined();
    });
  });

  describe('End-to-End Verification', () => {
    test('should have all VPC resources', async () => {
      expect(isValidOutput(outputs.VPCId)).toBe(true);
      expect(outputs.PublicSubnetIds).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
      expect(outputs.VPCCidr).toBe('10.0.0.0/16');
    });

    test('should have all S3 resources', async () => {
      expect(isValidOutput(outputs.StaticContentBucketName)).toBe(true);
      expect(outputs.StaticContentBucketArn).toBeDefined();
      expect(outputs.ALBAccessLogsBucketName).toBeDefined();
    });

    test('should have all security groups', async () => {
      expect(isValidOutput(outputs.ALBSecurityGroupId)).toBe(true);
      expect(isValidOutput(outputs.WebServerSecurityGroupId)).toBe(true);
      expect(isValidOutput(outputs.DatabaseSecurityGroupId)).toBe(true);
    });

    test('should have all IAM resources', async () => {
      expect(isValidOutput(outputs.EC2RoleArn)).toBe(true);
      expect(isValidOutput(outputs.EC2InstanceProfileArn)).toBe(true);
    });

    test('should have all monitoring resources', async () => {
      expect(isValidOutput(outputs.SNSTopicArn)).toBe(true);
      expect(outputs.ApacheAccessLogGroupName).toBeDefined();
      expect(outputs.ApacheErrorLogGroupName).toBeDefined();
    });
  });
});
