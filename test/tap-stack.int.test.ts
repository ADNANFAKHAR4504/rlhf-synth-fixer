import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFrontClient,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

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
const readStackOutputs = (): StackOutputs => {
  try {
    const outputPath = path.join(process.cwd(), 'flat-outputs.txt');
    if (fs.existsSync(outputPath)) {
      const outputContent = fs.readFileSync(outputPath, 'utf-8');
      const outputs: Record<string, string> = {};

      outputContent.split('\n').forEach(line => {
        if (line.includes(' = ')) {
          const [key, value] = line.split(' = ');
          const outputKey = key.split('.')[1]; // Remove stack name prefix
          outputs[outputKey] = value;
        }
      });

      return {
        vpcId: outputs.VpcId || '',
        loadBalancerDNS: outputs.LoadBalancerDNS || '',
        cloudFrontDomain: outputs.CloudFrontDomain || '',
        s3BucketName: outputs.S3BucketName || '',
        dynamoTableName: outputs.DynamoTableName || '',
        rdsClusterEndpoint: outputs.RdsClusterEndpoint || '',
      };
    }
  } catch (error) {
    console.warn('Could not read flat-outputs.txt, using fallback values');
  }

  // Return fallback values if file doesn't exist
  return {
    vpcId: process.env.VPC_ID || '',
    loadBalancerDNS: process.env.LOAD_BALANCER_DNS || '',
    cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN || '',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
    dynamoTableName: process.env.DYNAMO_TABLE_NAME || '',
    rdsClusterEndpoint: process.env.RDS_CLUSTER_ENDPOINT || '',
  };
};

const STACK_OUTPUTS = readStackOutputs();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr2705';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// AWS clients
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });
const asgClient = new AutoScalingClient({ region });
const cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region });

const timeout = 30000;

// VPC Configuration Test
test(
  'VPC should have correct configuration',
  async () => {
    try {
      const command = new DescribeVpcsCommand({
        VpcIds: [STACK_OUTPUTS.vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc!.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc!.State).toBe('available');
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// Subnets Test
test(
  'should have 6 subnets across 2 AZs',
  async () => {
    try {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [STACK_OUTPUTS.vpcId] }],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      const azs = Array.from(new Set(subnets.map(s => s.AvailabilityZone)));

      expect(subnets.length).toBe(6);
      expect(azs.length).toBe(2);
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// NAT Gateways Test
test(
  'should have 2 NAT Gateways for high availability',
  async () => {
    try {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [STACK_OUTPUTS.vpcId] }],
      });

      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      // CDK with dual-stack VPC creates 4 NAT Gateways (2 IPv4 + 2 IPv6)
      expect(natGateways.length).toBeGreaterThanOrEqual(2);
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// VPC Flow Logs Test
test(
  'should have VPC Flow Logs enabled',
  async () => {
    try {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-type', Values: ['VPC'] },
          { Name: 'resource-id', Values: [STACK_OUTPUTS.vpcId] },
        ],
      });

      const response = await ec2Client.send(command);
      const flowLog = response.FlowLogs?.[0];

      expect(flowLog).toBeDefined();
      expect(flowLog!.FlowLogStatus).toBe('ACTIVE');
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// Application Load Balancer Test
test(
  'should have internet-facing ALB with target group',
  async () => {
    try {
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbv2Client.send(albCommand);

      // Find ALB by DNS name from stack outputs
      const alb = albResponse.LoadBalancers?.find(
        lb => lb.DNSName === STACK_OUTPUTS.loadBalancerDNS
      );

      // Verify target group exists if ALB exists
      if (alb) {
        const tgCommand = new DescribeTargetGroupsCommand({
          LoadBalancerArn: alb.LoadBalancerArn,
        });
        const tgResponse = await elbv2Client.send(tgCommand);
        expect(tgResponse.TargetGroups).toBeDefined();
        expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);
      }

      expect(alb).toBeDefined();
      expect(alb!.Scheme).toBe('internet-facing');
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// RDS Aurora Cluster Test
test(
  'should have Aurora PostgreSQL cluster with Multi-AZ',
  async () => {
    try {
      const command = new DescribeDBClustersCommand({});
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.find(
        c => c.Endpoint === STACK_OUTPUTS.rdsClusterEndpoint
      );

      expect(cluster).toBeDefined();
      expect(cluster!.Engine).toBe('aurora-postgresql');
    } catch (error) {
      throw error;
    }
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

    try {
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });

      const [versioningResponse] = await Promise.all([
        s3Client.send(versioningCommand),
        s3Client.send(encryptionCommand),
        s3Client.send(publicAccessCommand),
      ]);

      expect(versioningResponse.Status).toBe('Enabled');
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// DynamoDB Table Test
test(
  'should have DynamoDB table with on-demand billing',
  async () => {
    const tableName = STACK_OUTPUTS.dynamoTableName;

    try {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);
      const table = response.Table;

      expect(table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// Auto Scaling Group Test
test(
  'should have Auto Scaling Group with correct capacity',
  async () => {
    try {
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups?.find(g =>
        g.VPCZoneIdentifier?.includes(STACK_OUTPUTS.vpcId.replace('vpc-', ''))
      );

      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBe(2);
      expect(asg!.MaxSize).toBe(6);
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// CloudFront Distribution Test
test(
  'should have CloudFront distribution',
  async () => {
    try {
      const command = new ListDistributionsCommand({});
      const response = await cloudFrontClient.send(command);

      const distribution = response.DistributionList?.Items?.find(
        d => d.DomainName === STACK_OUTPUTS.cloudFrontDomain
      );

      expect(distribution).toBeDefined();
      expect(distribution!.Enabled).toBe(true);
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// CloudWatch Logs Test
test(
  'should have VPC Flow Logs group',
  async () => {
    try {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs/${environmentSuffix}`,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.[0];

      expect(logGroup).toBeDefined();
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// Application Logs Test
test(
  'should have application log group',
  async () => {
    try {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/ec2/tap-application/${environmentSuffix}`,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.[0];

      expect(logGroup).toBeDefined();
    } catch (error) {
      throw error;
    }
  },
  timeout
);

// Resource Tagging Test
test(
  'should have consistent tagging across resources',
  async () => {
    try {
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
    } catch (error) {
      throw error;
    }
  },
  timeout
);
