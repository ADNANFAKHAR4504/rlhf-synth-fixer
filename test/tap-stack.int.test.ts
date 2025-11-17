/**
 * Integration tests for TapStack
 *
 * Tests the deployed VPC Peering infrastructure using real AWS resources
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNetworkAclsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { SNSClient, ListTopicsCommand } from '@aws-sdk/client-sns';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any;

try {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} catch (error) {
  console.error('Failed to load deployment outputs:', error);
  throw error;
}

// AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cwClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('Deployment Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.peeringConnectionId).toBeDefined();
      expect(outputs.paymentVpcId).toBeDefined();
      expect(outputs.auditVpcId).toBeDefined();
      expect(outputs.flowLogsBucketName).toBeDefined();
      expect(outputs.peeringStatusAlarmArn).toBeDefined();
      expect(outputs.securityGroupIds).toBeDefined();
      expect(outputs.paymentRouteTableIds).toBeDefined();
      expect(outputs.auditRouteTableIds).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should have created payment VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.paymentVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.paymentVpcId);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.100.0.0/16');
    });

    it('should have created audit VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.auditVpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.auditVpcId);
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.200.0.0/16');
    });
  });

  describe('VPC Peering Connection', () => {
    it('should have created VPC peering connection', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.peeringConnectionId],
      });
      const response = await ec2Client.send(command);

      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections?.length).toBe(1);

      const peering = response.VpcPeeringConnections?.[0];
      expect(peering?.VpcPeeringConnectionId).toBe(outputs.peeringConnectionId);
    });

    it('should have peering connection in active state', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.peeringConnectionId],
      });
      const response = await ec2Client.send(command);

      const peering = response.VpcPeeringConnections?.[0];
      expect(peering?.Status?.Code).toBe('active');
    });

    it('should connect payment and audit VPCs', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.peeringConnectionId],
      });
      const response = await ec2Client.send(command);

      const peering = response.VpcPeeringConnections?.[0];
      const requesterVpcId = peering?.RequesterVpcInfo?.VpcId;
      const accepterVpcId = peering?.AccepterVpcInfo?.VpcId;

      expect([requesterVpcId, accepterVpcId]).toContain(outputs.paymentVpcId);
      expect([requesterVpcId, accepterVpcId]).toContain(outputs.auditVpcId);
    });
  });

  describe('Route Tables', () => {
    it('should have configured routes in payment VPC', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: outputs.paymentRouteTableIds,
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables?.length).toBeGreaterThan(0);

      // Check that at least one route table has a route to audit VPC through peering
      const hasRouteToAudit = response.RouteTables?.some(table =>
        table.Routes?.some(route =>
          route.VpcPeeringConnectionId === outputs.peeringConnectionId &&
          route.DestinationCidrBlock === '10.200.0.0/16'
        )
      );

      expect(hasRouteToAudit).toBe(true);
    });

    it('should have configured routes in audit VPC', async () => {
      const command = new DescribeRouteTablesCommand({
        RouteTableIds: outputs.auditRouteTableIds,
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables?.length).toBeGreaterThan(0);

      // Check that at least one route table has a route to payment VPC through peering
      const hasRouteToPayment = response.RouteTables?.some(table =>
        table.Routes?.some(route =>
          route.VpcPeeringConnectionId === outputs.peeringConnectionId &&
          route.DestinationCidrBlock === '10.100.0.0/16'
        )
      );

      expect(hasRouteToPayment).toBe(true);
    });
  });

  describe('Security Groups', () => {
    it('should have created payment security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.securityGroupIds.paymentSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].VpcId).toBe(outputs.paymentVpcId);
    });

    it('should have created audit security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.securityGroupIds.auditSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);
      expect(response.SecurityGroups?.[0].VpcId).toBe(outputs.auditVpcId);
    });

    it('should have HTTPS ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.securityGroupIds.paymentSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups?.[0];
      const hasHttpsIngress = sg?.IpPermissions?.some(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );

      expect(hasHttpsIngress).toBe(true);
    });

    it('should have PostgreSQL ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.securityGroupIds.paymentSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups?.[0];
      const hasPostgresIngress = sg?.IpPermissions?.some(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432 && rule.IpProtocol === 'tcp'
      );

      expect(hasPostgresIngress).toBe(true);
    });
  });

  describe('Network ACLs', () => {
    it('should have configured network ACL rules for payment VPC', async () => {
      // Get default network ACL for payment VPC
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

      const acl = response.NetworkAcls?.[0];
      const hasHttpsRule = acl?.Entries?.some(entry =>
        entry.PortRange?.From === 443 && entry.PortRange?.To === 443
      );

      expect(hasHttpsRule).toBe(true);
    });

    it('should have configured network ACL rules for audit VPC', async () => {
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

      const acl = response.NetworkAcls?.[0];
      const hasHttpsRule = acl?.Entries?.some(entry =>
        entry.PortRange?.From === 443 && entry.PortRange?.To === 443
      );

      expect(hasHttpsRule).toBe(true);
    });
  });

  describe('VPC Flow Logs', () => {
    it('should have created S3 bucket for flow logs', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.flowLogsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    it('should have enabled versioning on flow logs bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.flowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    it('should have configured lifecycle policy on flow logs bucket', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.flowLogsBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
    });

    it('should have created flow logs for payment VPC', async () => {
      const command = new DescribeFlowLogsCommand({
        Filters: [
          {
            Name: 'resource-id',
            Values: [outputs.paymentVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs?.length).toBeGreaterThan(0);
      expect(response.FlowLogs?.[0].LogDestinationType).toBe('s3');
    });

    it('should have created flow logs for audit VPC', async () => {
      const command = new DescribeFlowLogsCommand({
        Filters: [
          {
            Name: 'resource-id',
            Values: [outputs.auditVpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs?.length).toBeGreaterThan(0);
      expect(response.FlowLogs?.[0].LogDestinationType).toBe('s3');
    });
  });

  describe('CloudWatch Monitoring', () => {
    it('should have created CloudWatch alarm for peering status', async () => {
      const alarmName = outputs.peeringStatusAlarmArn.split(':').pop();
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBe(1);
      expect(response.MetricAlarms?.[0].AlarmArn).toBe(outputs.peeringStatusAlarmArn);
    });

    it('should have configured alarm actions', async () => {
      const alarmName = outputs.peeringStatusAlarmArn.split(':').pop();
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });
      const response = await cwClient.send(command);

      const alarm = response.MetricAlarms?.[0];
      expect(alarm?.AlarmActions).toBeDefined();
      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    it('should have tagged VPCs with environment suffix', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.paymentVpcId, outputs.auditVpcId],
      });
      const response = await ec2Client.send(command);

      response.Vpcs?.forEach(vpc => {
        const nameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('synthw19bp2');
      });
    });

    it('should have tagged security groups with environment suffix', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.securityGroupIds.paymentSecurityGroupId,
          outputs.securityGroupIds.auditSecurityGroupId,
        ],
      });
      const response = await ec2Client.send(command);

      response.SecurityGroups?.forEach(sg => {
        const nameTag = sg.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('synthw19bp2');
      });
    });
  });

  describe('End-to-End Validation', () => {
    it('should have complete VPC peering infrastructure deployed', async () => {
      // Verify all major components are present
      const [vpcResponse, peeringResponse, routeResponse, sgResponse] = await Promise.all([
        ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.paymentVpcId, outputs.auditVpcId] })),
        ec2Client.send(new DescribeVpcPeeringConnectionsCommand({ VpcPeeringConnectionIds: [outputs.peeringConnectionId] })),
        ec2Client.send(new DescribeRouteTablesCommand({ RouteTableIds: outputs.paymentRouteTableIds })),
        ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [outputs.securityGroupIds.paymentSecurityGroupId] })),
      ]);

      expect(vpcResponse.Vpcs?.length).toBe(2);
      expect(peeringResponse.VpcPeeringConnections?.length).toBe(1);
      expect(routeResponse.RouteTables).toBeDefined();
      expect(sgResponse.SecurityGroups?.length).toBe(1);
    });
  });
});
