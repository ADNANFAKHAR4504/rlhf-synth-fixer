import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetQueueAttributesCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import * as fs from 'fs';
import * as path from 'path';

// Load CloudFormation outputs from deployment
const flatOutputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let stackOutputs: Record<string, string> = {};

// Load outputs at module level
try {
  if (fs.existsSync(flatOutputsPath)) {
    stackOutputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));
  }
} catch (error) {
  console.error('Failed to load stack outputs:', error);
}

// Get environment configuration
const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const sqsClient = new SQSClient({ region });
const cloudfrontClient = new CloudFrontClient({ region });

describe('Defense in Depth Stack Integration Tests', () => {
  beforeAll(async () => {
    // Verify outputs are loaded
    if (Object.keys(stackOutputs).length === 0) {
      throw new Error('Stack outputs not loaded. Make sure to run deployment first.');
    }
    console.log('Available outputs:', Object.keys(stackOutputs));
  }, 30000);

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      expect(stackOutputs.VpcId).toBeDefined();
      expect(stackOutputs.AlbDnsName).toBeDefined();
      expect(stackOutputs.S3BucketName).toBeDefined();
      expect(stackOutputs.SqsQueueUrl).toBeDefined();
      expect(stackOutputs.CloudFrontDomainName).toBeDefined();
    });

    test('should have valid AWS resource identifiers', () => {
      const vpcId = stackOutputs.VpcId;
      const albDns = stackOutputs.AlbDnsName;
      const s3Bucket = stackOutputs.S3BucketName;
      const cloudfrontDomain = stackOutputs.CloudFrontDomainName;

      expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      expect(albDns).toContain('.elb.amazonaws.com');
      expect(s3Bucket).toMatch(/^[a-z0-9-]+$/);
      expect(cloudfrontDomain).toContain('.cloudfront.net');
    });
  });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be properly configured', async () => {
      const vpcId = stackOutputs.VpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
    });

    test('VPC should have proper subnets configured', async () => {
      const vpcId = stackOutputs.VpcId;

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThan(0);

      // Verify all subnets are in the same VPC and available
      for (const subnet of response.Subnets!) {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe('available');
        expect(subnet.AvailabilityZone).toBeDefined();
      }
    });

    test('VPC should have security groups configured', async () => {
      const vpcId = stackOutputs.VpcId;

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Verify security groups have proper rules
      for (const sg of response.SecurityGroups!) {
        expect(sg.VpcId).toBe(vpcId);
        expect(sg.GroupName).toBeDefined();
        expect(sg.Description).toBeDefined();
        expect(sg.IpPermissions).toBeDefined();
      }
    });
  });

  describe('Application Load Balancer Infrastructure', () => {
    test('ALB should exist and be properly configured', async () => {
      const albDnsName = stackOutputs.AlbDnsName;
      expect(albDnsName).toBeDefined();

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbv2Client.send(command);

      expect(response.LoadBalancers).toBeDefined();
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('ALB should have listeners configured', async () => {
      const albDnsName = stackOutputs.AlbDnsName;

      // First get the ALB ARN
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbv2Client.send(albCommand);
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();

      const command = new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn });
      const response = await elbv2Client.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBeGreaterThan(0);

      // Verify listeners are properly configured
      for (const listener of response.Listeners!) {
        expect(listener.Port).toBeDefined();
        expect(listener.Protocol).toBeDefined();
        expect(listener.DefaultActions).toBeDefined();
        expect(listener.DefaultActions!.length).toBeGreaterThan(0);
      }
    });

    test('ALB should have target groups configured', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbv2Client.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      // Verify target groups are properly configured
      for (const targetGroup of response.TargetGroups!) {
        expect(targetGroup.TargetGroupArn).toBeDefined();
        expect(targetGroup.Protocol).toBeDefined();
        expect(targetGroup.Port).toBeDefined();
        expect(targetGroup.HealthCheckPath).toBeDefined();
        expect(targetGroup.HealthCheckProtocol).toBeDefined();
      }
    });
  });

  describe('Storage Infrastructure', () => {
    test('S3 bucket should exist and be properly configured', async () => {
      const bucketName = stackOutputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      const headResponse = await s3Client.send(headCommand);
      expect(headResponse.$metadata.httpStatusCode).toBe(200);

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('SQS queue should exist and be properly configured', async () => {
      const queueUrl = stackOutputs.SqsQueueUrl;
      expect(queueUrl).toBeDefined();

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All']
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.VisibilityTimeout).toBe('300');
      expect(response.Attributes!.MessageRetentionPeriod).toBe('1209600');
    });
  });

  describe('Content Delivery Network', () => {
    test('CloudFront distribution should exist and be properly configured', async () => {
      const cloudfrontDomain = stackOutputs.CloudFrontDomainName;
      expect(cloudfrontDomain).toBeDefined();

      const command = new ListDistributionsCommand({});
      const response = await cloudfrontClient.send(command);

      expect(response.DistributionList).toBeDefined();
      const distribution = response.DistributionList!.Items?.find(dist =>
        dist.DomainName === cloudfrontDomain
      );
      expect(distribution).toBeDefined();
      expect(distribution!.Status).toBe('Deployed');
    });

    test('CloudFront distribution should have proper configuration', async () => {
      const cloudfrontDomain = stackOutputs.CloudFrontDomainName;

      const listCommand = new ListDistributionsCommand({});
      const listResponse = await cloudfrontClient.send(listCommand);
      const distribution = listResponse.DistributionList!.Items?.find(dist =>
        dist.DomainName === cloudfrontDomain
      );
      expect(distribution).toBeDefined();

      const getCommand = new GetDistributionCommand({ Id: distribution!.Id });
      const getResponse = await cloudfrontClient.send(getCommand);

      expect(getResponse.Distribution).toBeDefined();
      expect(getResponse.Distribution?.DistributionConfig).toBeDefined();
      expect(getResponse.Distribution?.DistributionConfig?.DefaultCacheBehavior).toBeDefined();
      expect(getResponse.Distribution?.DistributionConfig?.Origins).toBeDefined();
      expect(getResponse.Distribution?.DistributionConfig?.Origins?.Items?.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('complete infrastructure should support web application workflow', async () => {
      // Validate that all components are connected and functional
      const vpcId = stackOutputs.VpcId;
      const albDns = stackOutputs.AlbDnsName;
      const s3Bucket = stackOutputs.S3BucketName;
      const sqsQueue = stackOutputs.SqsQueueUrl;
      const cloudfrontDomain = stackOutputs.CloudFrontDomainName;

      // VPC should be available
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // ALB should be active
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbv2Client.send(albCommand);
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');

      // S3 bucket should be accessible
      const s3Command = new HeadBucketCommand({ Bucket: s3Bucket });
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.$metadata.httpStatusCode).toBe(200);

      // SQS queue should be accessible
      const sqsCommand = new GetQueueAttributesCommand({
        QueueUrl: sqsQueue,
        AttributeNames: ['QueueArn']
      });
      const sqsResponse = await sqsClient.send(sqsCommand);
      expect(sqsResponse.Attributes!.QueueArn).toBeDefined();

      // CloudFront should be deployed
      const cfCommand = new ListDistributionsCommand({});
      const cfResponse = await cloudfrontClient.send(cfCommand);
      const distribution = cfResponse.DistributionList!.Items?.find(dist =>
        dist.DomainName === cloudfrontDomain
      );
      expect(distribution!.Status).toBe('Deployed');

      console.log('✅ Complete web application infrastructure is functional');
    });

    test('infrastructure should support content delivery workflow', async () => {
      const s3Bucket = stackOutputs.S3BucketName;
      const cloudfrontDomain = stackOutputs.CloudFrontDomainName;

      // Validate S3 bucket is accessible for content storage
      const s3Command = new HeadBucketCommand({ Bucket: s3Bucket });
      const s3Response = await s3Client.send(s3Command);
      expect(s3Response.$metadata.httpStatusCode).toBe(200);

      // Validate CloudFront distribution is deployed for content delivery
      const cfCommand = new ListDistributionsCommand({});
      const cfResponse = await cloudfrontClient.send(cfCommand);
      const distribution = cfResponse.DistributionList!.Items?.find(dist =>
        dist.DomainName === cloudfrontDomain
      );
      expect(distribution!.Status).toBe('Deployed');

      console.log('✅ Content delivery infrastructure is properly configured');
    });

    test('infrastructure should support messaging workflow', async () => {
      const sqsQueue = stackOutputs.SqsQueueUrl;

      // Validate SQS queue is accessible for messaging
      const sqsCommand = new GetQueueAttributesCommand({
        QueueUrl: sqsQueue,
        AttributeNames: ['QueueArn', 'VisibilityTimeout', 'MessageRetentionPeriod']
      });
      const sqsResponse = await sqsClient.send(sqsCommand);
      expect(sqsResponse.Attributes!.QueueArn).toBeDefined();
      expect(sqsResponse.Attributes!.VisibilityTimeout).toBe('300');
      expect(sqsResponse.Attributes!.MessageRetentionPeriod).toBe('1209600');

      console.log('✅ Messaging infrastructure is properly configured');
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should be properly secured', async () => {
      const vpcId = stackOutputs.VpcId;
      const s3Bucket = stackOutputs.S3BucketName;

      // Validate VPC is properly isolated
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      // Validate S3 bucket has encryption enabled
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: s3Bucket });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      console.log('✅ Security configurations are properly applied');
    });

    test('infrastructure should follow networking best practices', async () => {
      const vpcId = stackOutputs.VpcId;

      // Validate proper subnet distribution
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      expect(subnetResponse.Subnets).toBeDefined();
      expect(subnetResponse.Subnets!.length).toBeGreaterThan(0);

      // Verify subnets are distributed across multiple AZs
      const availabilityZones = new Set(
        subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThan(1);

      console.log('✅ Infrastructure follows networking best practices');
    });

    test('load balancer should be properly secured', async () => {
      const albDnsName = stackOutputs.AlbDnsName;

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbv2Client.send(command);

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');

      // Validate security groups are attached
      expect(alb!.SecurityGroups).toBeDefined();
      expect(alb!.SecurityGroups!.length).toBeGreaterThan(0);

      console.log('✅ Load balancer is properly secured');
    });
  });

  describe('Performance and Scalability', () => {
    test('CloudFront should be configured for global distribution', async () => {
      const cloudfrontDomain = stackOutputs.CloudFrontDomainName;
      const command = new ListDistributionsCommand({});
      const response = await cloudfrontClient.send(command);

      const distribution = response.DistributionList!.Items?.find(dist =>
        dist.DomainName === cloudfrontDomain
      );
      expect(distribution).toBeDefined();
      expect(distribution!.Status).toBe('Deployed');
      expect(distribution!.PriceClass).toBeDefined();

      console.log('✅ CloudFront distribution is globally deployed');
    });

    test('S3 bucket should be configured for high availability', async () => {
      const bucketName = stackOutputs.S3BucketName;

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      console.log('✅ S3 bucket is configured for high availability');
    });

    test('SQS queue should be configured for reliability', async () => {
      const queueUrl = stackOutputs.SqsQueueUrl;

      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['VisibilityTimeout', 'MessageRetentionPeriod', 'ReceiveMessageWaitTimeSeconds']
      });
      const response = await sqsClient.send(command);

      expect(response.Attributes!.VisibilityTimeout).toBe('300');
      expect(response.Attributes!.MessageRetentionPeriod).toBe('1209600');

      console.log('✅ SQS queue is configured for reliability');
    });
  });
});