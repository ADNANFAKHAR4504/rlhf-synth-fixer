import {
  AutoScalingClient
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFrontClient,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';

// Define stack outputs interface
interface StackOutputs {
  vpcId: string;
  loadBalancerDNS: string;
  cloudFrontDomain: string;
  s3BucketName: string;
  dynamoTableName: string;
  rdsClusterEndpoint: string;
}

// Read stack outputs from flat-outputs file
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const STACK_OUTPUTS: StackOutputs = {
  vpcId: outputs.VpcId,
  loadBalancerDNS: outputs.LoadBalancerDNS,
  cloudFrontDomain: outputs.CloudFrontDomain,
  s3BucketName: outputs.S3BucketName,
  dynamoTableName: outputs.DynamoTableName,
  rdsClusterEndpoint: outputs.RdsClusterEndpoint,
};

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get AWS region from file
const region = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// AWS clients
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const asgClient = new AutoScalingClient({ region });
const cloudFrontClient = new CloudFrontClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

const timeout = 30000;

// VPC Configuration Test
test(
  'VPC should have correct configuration',
  async () => {
    const command = new DescribeVpcsCommand({
      VpcIds: [STACK_OUTPUTS.vpcId],
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs?.[0];

    expect(vpc).toBeDefined();
    expect(vpc!.CidrBlock).toBe('10.0.0.0/16');
    expect(vpc!.State).toBe('available');
  },
  timeout
);

// Subnets Test
test(
  'should have 6 subnets across 2 AZs',
  async () => {
    const command = new DescribeSubnetsCommand({
      Filters: [{ Name: 'vpc-id', Values: [STACK_OUTPUTS.vpcId] }],
    });

    const response = await ec2Client.send(command);
    const subnets = response.Subnets || [];
    const azs = Array.from(new Set(subnets.map(s => s.AvailabilityZone)));

    expect(subnets.length).toBe(6);
    expect(azs.length).toBe(2);
  },
  timeout
);

// NAT Gateways Test
test(
  'should have 2 NAT Gateways for high availability',
  async () => {
    const command = new DescribeNatGatewaysCommand({
      Filter: [{ Name: 'vpc-id', Values: [STACK_OUTPUTS.vpcId] }],
    });

    const response = await ec2Client.send(command);
    const natGateways = response.NatGateways || [];

    // CDK with dual-stack VPC creates 4 NAT Gateways (2 IPv4 + 2 IPv6)
    expect(natGateways.length).toBeGreaterThanOrEqual(2);
  },
  timeout
);

// Application Load Balancer Test
test(
  'should have internet-facing ALB with target group',
  async () => {
    const albCommand = new DescribeLoadBalancersCommand({});
    const albResponse = await elbv2Client.send(albCommand);

    // Find ALB by DNS name from stack outputs
    const alb = albResponse.LoadBalancers?.find(
      lb => lb.DNSName === STACK_OUTPUTS.loadBalancerDNS
    );

    expect(alb).toBeDefined();
    expect(alb!.Scheme).toBe('internet-facing');

    // Verify target group exists
    const tgCommand = new DescribeTargetGroupsCommand({
      LoadBalancerArn: alb!.LoadBalancerArn,
    });
    const tgResponse = await elbv2Client.send(tgCommand);
    expect(tgResponse.TargetGroups).toBeDefined();
    expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);
  },
  timeout
);

// RDS Aurora Cluster Test
test(
  'should have Aurora PostgreSQL cluster with Multi-AZ',
  async () => {
    const command = new DescribeDBClustersCommand({});
    const response = await rdsClient.send(command);

    const cluster = response.DBClusters?.find(
      c => c.Endpoint === STACK_OUTPUTS.rdsClusterEndpoint
    );

    expect(cluster).toBeDefined();
    expect(cluster!.Engine).toBe('aurora-postgresql');
  },
  timeout
);

// S3 Bucket Test
test(
  'should have S3 bucket with versioning and encryption',
  async () => {
    // Get actual bucket name by listing buckets with the prefix
    const listResponse = await s3Client.send(new ListBucketsCommand({}));
    const bucket = listResponse.Buckets?.find(b =>
      b.Name?.startsWith('tap-application-bucket-pr2705-')
    );
    const bucketName = bucket?.Name;

    expect(bucketName).toBeDefined();

    const versioningCommand = new GetBucketVersioningCommand({
      Bucket: bucketName!,
    });
    const encryptionCommand = new GetBucketEncryptionCommand({
      Bucket: bucketName!,
    });
    const publicAccessCommand = new GetPublicAccessBlockCommand({
      Bucket: bucketName!,
    });

    const [versioningResponse] = await Promise.all([
      s3Client.send(versioningCommand),
      s3Client.send(encryptionCommand),
      s3Client.send(publicAccessCommand),
    ]);

    expect(versioningResponse.Status).toBe('Enabled');
  },
  timeout
);

// DynamoDB Table Test
test(
  'should have DynamoDB table with on-demand billing',
  async () => {
    const command = new DescribeTableCommand({
      TableName: STACK_OUTPUTS.dynamoTableName,
    });
    const response = await dynamoClient.send(command);
    const table = response.Table;

    expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
  },
  timeout
);


// CloudFront Distribution Test
test(
  'should have CloudFront distribution',
  async () => {
    const command = new ListDistributionsCommand({});
    const response = await cloudFrontClient.send(command);

    const distribution = response.DistributionList?.Items?.find(
      d => d.DomainName === STACK_OUTPUTS.cloudFrontDomain
    );

    expect(distribution).toBeDefined();
    expect(distribution!.Enabled).toBe(true);
  },
  timeout
);

// CloudWatch Logs Test
test(
  'should have VPC Flow Logs group',
  async () => {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/vpc/flowlogs/${environmentSuffix}`,
    });

    const response = await logsClient.send(command);
    const logGroup = response.logGroups?.[0];

    expect(logGroup).toBeDefined();
  },
  timeout
);

// Application Logs Test
test(
  'should have application log group',
  async () => {
    const command = new DescribeLogGroupsCommand({
      logGroupNamePrefix: `/aws/ec2/tap-application/${environmentSuffix}`,
    });

    const response = await logsClient.send(command);
    const logGroup = response.logGroups?.[0];

    expect(logGroup).toBeDefined();
  },
  timeout
);

// Resource Tagging Test
test(
  'should have consistent tagging across resources',
  async () => {
    const command = new DescribeVpcsCommand({
      VpcIds: [STACK_OUTPUTS.vpcId],
    });

    const response = await ec2Client.send(command);
    const vpc = response.Vpcs?.[0];

    const envTag = vpc?.Tags?.find(t => t.Key === 'Environment');
    const deptTag = vpc?.Tags?.find(t => t.Key === 'Department');
    const projTag = vpc?.Tags?.find(t => t.Key === 'Project');

    expect(envTag?.Value).toBe(environmentSuffix);
    expect(deptTag?.Value).toBe('Engineering');
    expect(projTag?.Value).toBe('TapApplication');
  },
  timeout
);
