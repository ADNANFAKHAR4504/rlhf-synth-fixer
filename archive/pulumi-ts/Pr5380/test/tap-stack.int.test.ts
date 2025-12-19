/**
 * Integration tests for TapStack - Payment Processing Cloud Environment
 *
 * These tests validate the deployed infrastructure against actual AWS resources.
 * They use the deployment outputs from cfn-outputs/flat-outputs.json.
 */
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const REGION = 'ap-southeast-2';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'synth10n9ys';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '../cfn-outputs/flat-outputs.json'
);
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  outputs = {};
}

describe('Payment Processing Cloud Environment - Integration Tests', () => {
  const ec2Client = new EC2Client({ region: REGION });
  const s3Client = new S3Client({ region: REGION });
  const logsClient = new CloudWatchLogsClient({ region: REGION });
  const iamClient = new IAMClient({ region: REGION });

  describe('VPC Infrastructure', () => {
    it('should have deployed VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    it('should have deployed 3 public subnets across different AZs', async () => {
      const subnetIds = [
        outputs.publicSubnetId1,
        outputs.publicSubnetId2,
        outputs.publicSubnetId3,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

    });

    it('should have Internet Gateway attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpcId);
    });

    it('should have 3 NAT Gateways in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(3);

      const activeNatGateways = response.NatGateways!.filter(
        nat => nat.State === 'available'
      );
      expect(activeNatGateways.length).toBe(3);

      activeNatGateways.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });

    it('should have correct route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(4); // 1 public + 3 private

      // Check for public route table with IGW route
      const publicRouteTables = response.RouteTables!.filter(rt =>
        rt.Routes!.some(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.GatewayId?.startsWith('igw-')
        )
      );
      expect(publicRouteTables.length).toBeGreaterThanOrEqual(1);

      // Check for private route tables with NAT Gateway routes
      const privateRouteTables = response.RouteTables!.filter(rt =>
        rt.Routes!.some(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.NatGatewayId?.startsWith('nat-')
        )
      );
      expect(privateRouteTables.length).toBe(3);
    });
  });

  describe('S3 Storage', () => {
    it('should have created S3 bucket', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.s3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled on S3 bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have correct tags on S3 bucket', async () => {
      const command = new GetBucketTaggingCommand({
        Bucket: outputs.s3BucketName,
      });

      const response = await s3Client.send(command);
      const tags = response.TagSet || [];

      const projectTag = tags.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('payment-processing');

      const managedByTag = tags.find(t => t.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('pulumi');
    });
  });

  describe('VPC Flow Logs', () => {
    it('should have CloudWatch Log Group for VPC Flow Logs', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/payment-flowlogs-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toHaveLength(1);

      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toContain('payment-flowlogs');
      expect(logGroup.retentionInDays).toBe(7);
    });

    it('should have VPC Flow Logs enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toHaveLength(1);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    });

    it('should have IAM role for VPC Flow Logs', async () => {
      const command = new GetRoleCommand({
        RoleName: `payment-flowlogs-role-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toContain('payment-flowlogs-role');
    });

    it('should have correct IAM policy attached', async () => {
      const command = new GetRolePolicyCommand({
        RoleName: `payment-flowlogs-role-${ENVIRONMENT_SUFFIX}`,
        PolicyName: `payment-flowlogs-policy-${ENVIRONMENT_SUFFIX}`,
      });

      const response = await iamClient.send(command);
      expect(response.PolicyDocument).toBeDefined();

      const policyDoc = JSON.parse(
        decodeURIComponent(response.PolicyDocument!)
      );
      expect(policyDoc.Statement).toBeDefined();

      const statement = policyDoc.Statement.find(
        (s: any) => s.Effect === 'Allow'
      );
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });
  });

  describe('Resource Tagging', () => {
    it('should have Environment tag on all resources', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      const envTag = vpcTags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBe(ENVIRONMENT_SUFFIX);
    });

    it('should have Project tag set to payment-processing', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      const projectTag = vpcTags.find(t => t.Key === 'Project');
      expect(projectTag?.Value).toBe('payment-processing');
    });

    it('should have ManagedBy tag set to pulumi', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      const managedByTag = vpcTags.find(t => t.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('pulumi');
    });
  });

  describe('Naming Conventions', () => {
    it('should follow payment-{resource-type}-{suffix} naming pattern', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      const nameTag = vpcTags.find(t => t.Key === 'Name');
      expect(nameTag?.Value).toMatch(/^payment-vpc-/);
      expect(nameTag?.Value).toContain(ENVIRONMENT_SUFFIX);
    });

    it('should use consistent environment suffix in all resource names', async () => {
      expect(outputs.s3BucketName).toContain(ENVIRONMENT_SUFFIX);

      // Check VPC name
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const vpcName = vpcTags.find(t => t.Key === 'Name')?.Value;

      expect(vpcName).toContain(ENVIRONMENT_SUFFIX);
    });
  });
});
