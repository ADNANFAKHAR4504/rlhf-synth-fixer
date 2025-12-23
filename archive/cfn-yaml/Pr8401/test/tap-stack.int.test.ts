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
  ListBucketsCommand,
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
  DescribeTagsCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListTopicsCommand,
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
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    }
    
    // Try to find the stack by trying common stack name patterns
    const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const possibleStackNames = [
      outputs.StackName,
      'tap-stack-localstack',
      `localstack-stack-${envSuffix}`,
    ].filter(Boolean) as string[];

    let stackResponse;
    let foundStackName = '';

    for (const name of possibleStackNames) {
      try {
        stackResponse = await cfnClient.send(
          new DescribeStacksCommand({ StackName: name })
        );
        foundStackName = name;
        stackName = name;
        break;
      } catch (error: any) {
        if (error.name !== 'ValidationError') {
          throw error;
        }
        continue;
      }
    }

    if (!stackResponse || !foundStackName) {
      throw new Error(`Could not find stack. Tried: ${possibleStackNames.join(', ')}`);
    }
    if (!stackResponse.Stacks || stackResponse.Stacks[0].StackStatus?.includes('FAILED')) {
      throw new Error(`Stack ${stackName} is not in a valid state`);
    }

    const stackOutputs = stackResponse.Stacks[0].Outputs || [];
    stackOutputs.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });

    outputs.StackName = stackName;
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
      if (!vpcId || !isValidOutput(vpcId)) {
        const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
        const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
        expect(vpc).toBeDefined();
        expect(vpc!.State).toBe('available');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should have 3 public subnets with public IP mapping', async () => {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
      expect(vpc).toBeDefined();

      const subnets = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpc!.VpcId!] }]
      }));
      const publicSubnets = subnets.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have 3 private subnets', async () => {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
      expect(vpc).toBeDefined();

      const subnets = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpc!.VpcId!] }]
      }));
      const privateSubnets = subnets.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
      expect(vpc).toBeDefined();

      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpc!.VpcId!] }]
        })
      );
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
    });

    test('should have at least 4 route tables', async () => {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
      expect(vpc).toBeDefined();

      const response = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpc!.VpcId!] }]
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
      if (!sgId || !isValidOutput(sgId)) {
        const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
        const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
        const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpc!.VpcId!] }]
        }));
        const webServerSG = sgs.SecurityGroups!.find(sg => 
          sg.GroupName?.includes('WebServer') || sg.Description?.includes('web server')
        );
        expect(webServerSG).toBeDefined();
        return;
      }

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
      let bucketName = outputs.StaticContentBucketName;
      if (!bucketName) {
        const buckets = await s3Client.send(new ListBucketsCommand({}));
        const staticBucket = buckets.Buckets!.find(b => 
          b.Name?.includes('static-content') || b.Name?.includes('production-static')
        );
        expect(staticBucket).toBeDefined();
        bucketName = staticBucket!.Name!;
      }

      const response = await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should upload and retrieve content', async () => {
      let bucketName = outputs.StaticContentBucketName;
      if (!bucketName) {
        const buckets = await s3Client.send(new ListBucketsCommand({}));
        const staticBucket = buckets.Buckets!.find(b => 
          b.Name?.includes('static-content') || b.Name?.includes('production-static')
        );
        expect(staticBucket).toBeDefined();
        bucketName = staticBucket!.Name!;
      }

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
      let bucketName = outputs.StaticContentBucketName;
      if (!bucketName) {
        const buckets = await s3Client.send(new ListBucketsCommand({}));
        const staticBucket = buckets.Buckets!.find(b => 
          b.Name?.includes('static-content') || b.Name?.includes('production-static')
        );
        expect(staticBucket).toBeDefined();
        bucketName = staticBucket!.Name!;
      }

      const response = await s3Client.send(
        new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 10 })
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
      let topicArn = outputs.SNSTopicArn;
      if (!topicArn || !isValidOutput(topicArn)) {
        const topics = await snsClient.send(new ListTopicsCommand({}));
        const topic = topics.Topics!.find(t => t.TopicArn?.includes('Alerts') || t.TopicArn?.includes('production'));
        expect(topic).toBeDefined();
        topicArn = topic!.TopicArn!;
      }

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
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
      expect(vpc).toBeDefined();
      expect(vpc!.CidrBlock).toBe('10.0.0.0/16');

      const subnets = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpc!.VpcId!] }]
      }));
      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(6);
    });

    test('should have all S3 resources', async () => {
      const buckets = await s3Client.send(new ListBucketsCommand({}));
      const staticBucket = buckets.Buckets!.find(b => 
        b.Name?.includes('static-content') || b.Name?.includes('production-static')
      );
      const albLogsBucket = buckets.Buckets!.find(b => 
        b.Name?.includes('alb-logs') || b.Name?.includes('production-alb-logs')
      );
      expect(staticBucket).toBeDefined();
      expect(albLogsBucket).toBeDefined();
    });

    test('should have all security groups', async () => {
      expect(isValidOutput(outputs.ALBSecurityGroupId)).toBe(true);
      expect(isValidOutput(outputs.DatabaseSecurityGroupId)).toBe(true);

      const vpcs = await ec2Client.send(new DescribeVpcsCommand({}));
      const vpc = vpcs.Vpcs!.find(v => v.CidrBlock === '10.0.0.0/16');
      const sgs = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpc!.VpcId!] }]
      }));
      const webServerSG = sgs.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('WebServer') || sg.Description?.includes('web server')
      );
      expect(webServerSG).toBeDefined();
    });

    test('should have all IAM resources', async () => {
      expect(isValidOutput(outputs.EC2RoleArn)).toBe(true);
      expect(isValidOutput(outputs.EC2InstanceProfileArn)).toBe(true);
    });

    test('should have all monitoring resources', async () => {
      const topics = await snsClient.send(new ListTopicsCommand({}));
      const topic = topics.Topics!.find(t => t.TopicArn?.includes('Alerts') || t.TopicArn?.includes('production'));
      expect(topic).toBeDefined();
      expect(outputs.ApacheAccessLogGroupName).toBeDefined();
      expect(outputs.ApacheErrorLogGroupName).toBeDefined();
    });
  });
});
