/**
 * Integration tests for VPC Peering Infrastructure
 * Tests deployed AWS resources using flat-outputs.json
 */
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeFlowLogsCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { SNSClient } from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

// Load outputs from flat-outputs.json
const outputsPath = path.join(
  __dirname,
  '../cfn-outputs/flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Parse JSON strings in outputs
const paymentRouteTableIds = JSON.parse(outputs.paymentRouteTableIds);
const auditRouteTableIds = JSON.parse(outputs.auditRouteTableIds);
const securityGroupIds = JSON.parse(outputs.securityGroupIds);

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

describe('VPC Peering Connection Integration Tests', () => {
  describe('VPC Peering Connection', () => {
    test('should exist and be in active state', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.peeringConnectionId],
      });

      const response = await ec2Client.send(command);
      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections?.length).toBe(1);

      const peering = response.VpcPeeringConnections![0];
      expect(peering.Status?.Code).toBe('active');
      expect(peering.RequesterVpcInfo?.VpcId).toBe(outputs.paymentVpcId);
      expect(peering.AccepterVpcInfo?.VpcId).toBe(outputs.auditVpcId);
    }, 30000);

    test('should have DNS resolution enabled', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.peeringConnectionId],
      });

      const response = await ec2Client.send(command);
      const peering = response.VpcPeeringConnections![0];

      expect(
        peering.RequesterVpcInfo?.PeeringOptions?.AllowDnsResolutionFromRemoteVpc
      ).toBe(true);
      expect(
        peering.AccepterVpcInfo?.PeeringOptions?.AllowDnsResolutionFromRemoteVpc
      ).toBe(true);
    }, 30000);
  });

  describe('VPCs', () => {
    test('should verify payment VPC exists', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.paymentVpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.paymentVpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.100\./);
    }, 30000);

    test('should verify audit VPC exists', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.auditVpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.auditVpcId);
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.200\./);
    }, 30000);
  });

  describe('Route Tables', () => {
    test('should verify payment route tables have peering routes', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: paymentRouteTableIds,
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables?.length).toBeGreaterThan(0);

      response.RouteTables?.forEach((routeTable) => {
        const peeringRoute = routeTable.Routes?.find(
          (route) =>
            route.VpcPeeringConnectionId === outputs.peeringConnectionId
        );
        expect(peeringRoute).toBeDefined();
        expect(peeringRoute?.DestinationCidrBlock).toMatch(/^10\.200\./);
      });
    }, 30000);

    test('should verify audit route tables have peering routes', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: auditRouteTableIds,
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables?.length).toBeGreaterThan(0);

      response.RouteTables?.forEach((routeTable) => {
        const peeringRoute = routeTable.Routes?.find(
          (route) =>
            route.VpcPeeringConnectionId === outputs.peeringConnectionId
        );
        expect(peeringRoute).toBeDefined();
        expect(peeringRoute?.DestinationCidrBlock).toMatch(/^10\.100\./);
      });
    }, 30000);
  });

  describe('Security Groups', () => {
    test('should verify payment security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupIds.paymentSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.paymentVpcId);
      expect(sg.GroupName).toContain('payment-vpc-peering-sg');
    }, 30000);

    test('should verify audit security group exists', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupIds.auditSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.auditVpcId);
      expect(sg.GroupName).toContain('audit-vpc-peering-sg');
    }, 30000);

    test('should verify payment security group has correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupIds.paymentSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      // Check for HTTPS ingress from audit VPC
      const httpsIngress = sg.IpPermissions?.find(
        (perm) => perm.FromPort === 443 && perm.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress?.IpRanges?.[0]?.CidrIp).toMatch(/^10\.200\./);

      // Check for PostgreSQL ingress from audit VPC
      const postgresIngress = sg.IpPermissions?.find(
        (perm) => perm.FromPort === 5432 && perm.ToPort === 5432
      );
      expect(postgresIngress).toBeDefined();
      expect(postgresIngress?.IpRanges?.[0]?.CidrIp).toMatch(/^10\.200\./);
    }, 30000);

    test('should verify audit security group has correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupIds.auditSecurityGroupId],
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      // Check for HTTPS ingress from payment VPC
      const httpsIngress = sg.IpPermissions?.find(
        (perm) => perm.FromPort === 443 && perm.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress?.IpRanges?.[0]?.CidrIp).toMatch(/^10\.100\./);

      // Check for PostgreSQL ingress from payment VPC
      const postgresIngress = sg.IpPermissions?.find(
        (perm) => perm.FromPort === 5432 && perm.ToPort === 5432
      );
      expect(postgresIngress).toBeDefined();
      expect(postgresIngress?.IpRanges?.[0]?.CidrIp).toMatch(/^10\.100\./);
    }, 30000);
  });

  describe('Network ACLs', () => {
    test('should verify payment VPC has network ACL rules for peering', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.paymentVpcId],
          },
          {
            Name: 'default',
            Values: ['true'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NetworkAcls).toBeDefined();
      expect(response.NetworkAcls?.length).toBeGreaterThan(0);

      const nacl = response.NetworkAcls![0];

      // Check for inbound HTTPS rule
      const inboundHttps = nacl.Entries?.find(
        (entry) =>
          !entry.Egress &&
          entry.RuleNumber === 200 &&
          entry.Protocol === '6' &&
          entry.PortRange?.From === 443
      );
      expect(inboundHttps).toBeDefined();

      // Check for outbound HTTPS rule
      const outboundHttps = nacl.Entries?.find(
        (entry) =>
          entry.Egress &&
          entry.RuleNumber === 200 &&
          entry.Protocol === '6' &&
          entry.PortRange?.From === 443
      );
      expect(outboundHttps).toBeDefined();
    }, 30000);

    test('should verify audit VPC has network ACL rules for peering', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.auditVpcId],
          },
          {
            Name: 'default',
            Values: ['true'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NetworkAcls).toBeDefined();
      expect(response.NetworkAcls?.length).toBeGreaterThan(0);

      const nacl = response.NetworkAcls![0];

      // Check for inbound HTTPS rule
      const inboundHttps = nacl.Entries?.find(
        (entry) =>
          !entry.Egress &&
          entry.RuleNumber === 200 &&
          entry.Protocol === '6' &&
          entry.PortRange?.From === 443
      );
      expect(inboundHttps).toBeDefined();
    }, 30000);
  });

  describe('VPC Flow Logs', () => {
    test('should verify S3 bucket exists for flow logs', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 30000);

    test('should verify bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('should verify bucket has lifecycle policy', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);

      const rule = response.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration?.Days).toBeGreaterThan(0);
    }, 30000);

    test('should verify bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    }, 30000);

    test('should verify bucket has encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBeDefined();
    }, 30000);

    test('should verify flow logs are configured for payment VPC', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.paymentVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs?.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.LogDestination).toContain(outputs.flowLogsBucketName);
    }, 30000);

    test('should verify flow logs are configured for audit VPC', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.auditVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs?.length).toBeGreaterThan(0);

      const flowLog = response.FlowLogs![0];
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.LogDestination).toContain(outputs.flowLogsBucketName);
    }, 30000);
  });

  describe('CloudWatch Monitoring', () => {
    test('should verify CloudWatch alarm exists', async () => {
      // Extract alarm name from ARN
      const alarmName = outputs.peeringStatusAlarmArn.split(':').pop();

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.Namespace).toBe('AWS/VPCPeering');
      expect(alarm.MetricName).toBe('StatusCheckFailed');
    }, 30000);

    test('should verify alarm is configured correctly', async () => {
      const alarmName = outputs.peeringStatusAlarmArn.split(':').pop();

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms![0];

      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(1);
      expect(alarm.Threshold).toBe(1);
      expect(alarm.Period).toBe(300);
    }, 30000);

    test('should verify alarm has SNS topic configured', async () => {
      const alarmName = outputs.peeringStatusAlarmArn.split(':').pop();

      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudwatchClient.send(command);
      const alarm = response.MetricAlarms![0];

      expect(alarm.AlarmActions).toBeDefined();
      expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
      expect(alarm.AlarmActions![0]).toContain('sns');
    }, 30000);
  });

  describe('Tags and Compliance', () => {
    test('should verify all VPCs have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.paymentVpcId, outputs.auditVpcId],
      });

      const response = await ec2Client.send(command);

      response.Vpcs?.forEach((vpc) => {
        const tags = vpc.Tags || [];
        const tagKeys = tags.map((tag) => tag.Key);

        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('ManagedBy');
      });
    }, 30000);

    test('should verify peering connection has required tags', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.peeringConnectionId],
      });

      const response = await ec2Client.send(command);
      const peering = response.VpcPeeringConnections![0];

      const tags = peering.Tags || [];
      const tagKeys = tags.map((tag) => tag.Key);

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('ManagedBy');
    }, 30000);
  });
});
