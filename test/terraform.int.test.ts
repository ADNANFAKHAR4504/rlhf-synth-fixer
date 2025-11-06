import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcPeeringConnectionsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeFlowLogsCommand
} from '@aws-sdk/client-ec2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand
} from '@aws-sdk/client-iam';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';

describe('Terraform Infrastructure Integration Tests - Task 7ivau', () => {
  let outputs: any;
  const ec2ClientUsEast1 = new EC2Client({ region: 'us-east-1' });
  const ec2ClientUsEast2 = new EC2Client({ region: 'us-east-2' });
  const cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });
  const iamClient = new IAMClient({ region: 'us-east-1' });
  const snsClient = new SNSClient({ region: 'us-east-1' });
  const s3Client = new S3Client({ region: 'us-east-1' });

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}. Deploy infrastructure first.`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.vpc_peering_connection_id).toBeDefined();
      expect(outputs.production_vpc_id).toBeDefined();
      expect(outputs.partner_vpc_id).toBeDefined();
    });

    test('should have VPC peering connection ID', () => {
      expect(outputs.vpc_peering_connection_id).toBeTruthy();
      expect(outputs.vpc_peering_connection_id).toMatch(/^pcx-/);
    });

    test('should have DNS resolution outputs', () => {
      expect(outputs.dns_resolution_enabled_requester).toBeDefined();
      expect(outputs.dns_resolution_enabled_accepter).toBeDefined();
    });

    test('should have route count output', () => {
      expect(outputs.total_configured_routes).toBeDefined();
      expect(parseInt(outputs.total_configured_routes)).toBeGreaterThanOrEqual(18);
    });

    test('should have security group IDs', () => {
      expect(outputs.production_security_group_id).toBeDefined();
      expect(outputs.production_security_group_id).toMatch(/^sg-/);
      expect(outputs.partner_security_group_id).toBeDefined();
      expect(outputs.partner_security_group_id).toMatch(/^sg-/);
    });

    test('should have flow log IDs', () => {
      expect(outputs.production_flow_log_id).toBeDefined();
      expect(outputs.production_flow_log_id).toMatch(/^fl-/);
      expect(outputs.partner_flow_log_id).toBeDefined();
      expect(outputs.partner_flow_log_id).toMatch(/^fl-/);
    });

    test('should have SNS topic ARN', () => {
      expect(outputs.sns_topic_arn).toBeDefined();
      expect(outputs.sns_topic_arn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('VPC Peering Connection', () => {
    test('should have active VPC peering connection', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.VpcPeeringConnections).toHaveLength(1);
      const peering = response.VpcPeeringConnections![0];
      expect(peering.Status?.Code).toBe('active');
    });

    test('should have DNS resolution enabled for requester', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const peering = response.VpcPeeringConnections![0];
      expect(peering.RequesterVpcInfo?.PeeringOptions?.AllowDnsResolutionFromRemoteVpc).toBe(true);
    });

    test('should have DNS resolution enabled for accepter', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const peering = response.VpcPeeringConnections![0];
      expect(peering.AccepterVpcInfo?.PeeringOptions?.AllowDnsResolutionFromRemoteVpc).toBe(true);
    });

    test('should peer correct VPCs (production and partner)', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const peering = response.VpcPeeringConnections![0];
      expect(peering.RequesterVpcInfo?.VpcId).toBe(outputs.production_vpc_id);
      expect(peering.AccepterVpcInfo?.VpcId).toBe(outputs.partner_vpc_id);
    });

    test('should span correct regions (us-east-1 and us-east-2)', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const peering = response.VpcPeeringConnections![0];
      expect(peering.RequesterVpcInfo?.Region).toBe('us-east-1');
      expect(peering.AccepterVpcInfo?.Region).toBe('us-east-2');
    });
  });

  describe('VPCs Configuration', () => {
    test('production VPC should exist in us-east-1', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.production_vpc_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('partner VPC should exist in us-east-2', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.partner_vpc_id]
      });
      const response = await ec2ClientUsEast2.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('172.16.0.0/16');
    });

    test('production VPC should have 9 subnets (3 AZs x 3 tiers)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.production_vpc_id] }
        ]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.Subnets?.length).toBe(9);
    });

    test('partner VPC should have 9 subnets (3 AZs x 3 tiers)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.partner_vpc_id] }
        ]
      });
      const response = await ec2ClientUsEast2.send(command);

      expect(response.Subnets?.length).toBe(9);
    });
  });

  describe('Security Groups', () => {
    test('production security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.production_security_group_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups![0].VpcId).toBe(outputs.production_vpc_id);
    });

    test('partner security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.partner_security_group_id]
      });
      const response = await ec2ClientUsEast2.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups![0].VpcId).toBe(outputs.partner_vpc_id);
    });

    test('production security group should allow HTTPS (443) and custom API (8443)', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.production_security_group_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const sg = response.SecurityGroups![0];
      const ports = sg.IpPermissions?.flatMap(rule => rule.FromPort ? [rule.FromPort] : []) || [];
      expect(ports).toContain(443);
      expect(ports).toContain(8443);
    });

    test('partner security group should allow HTTPS (443) and custom API (8443)', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.partner_security_group_id]
      });
      const response = await ec2ClientUsEast2.send(command);

      const sg = response.SecurityGroups![0];
      const ports = sg.IpPermissions?.flatMap(rule => rule.FromPort ? [rule.FromPort] : []) || [];
      expect(ports).toContain(443);
      expect(ports).toContain(8443);
    });

    test('security groups should restrict traffic to specific CIDRs (not 0.0.0.0/0)', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.production_security_group_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const sg = response.SecurityGroups![0];
      const hasBroadAccess = sg.IpPermissions?.some(rule =>
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      ) || false;
      expect(hasBroadAccess).toBe(false);
    });
  });

  describe('VPC Flow Logs', () => {
    test('production VPC should have flow logs configured', async () => {
      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.production_flow_log_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.FlowLogs).toHaveLength(1);
      expect(response.FlowLogs![0].ResourceId).toBe(outputs.production_vpc_id);
    });

    test('partner VPC should have flow logs configured', async () => {
      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.partner_flow_log_id]
      });
      const response = await ec2ClientUsEast2.send(command);

      expect(response.FlowLogs).toHaveLength(1);
      expect(response.FlowLogs![0].ResourceId).toBe(outputs.partner_vpc_id);
    });

    test('flow logs should have 1-minute aggregation interval', async () => {
      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.production_flow_log_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.FlowLogs![0].MaxAggregationInterval).toBe(60);
    });

    test('flow logs should be stored in S3', async () => {
      const command = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.production_flow_log_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      expect(response.FlowLogs![0].LogDestinationType).toBe('s3');
      expect(response.FlowLogs![0].LogDestination).toContain('arn:aws:s3:::');
    });
  });

  describe('S3 Bucket for Flow Logs', () => {
    test('S3 bucket should have encryption enabled', async () => {
      const bucketName = outputs.flow_logs_bucket_name;
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have public access blocked', async () => {
      const bucketName = outputs.flow_logs_bucket_name;
      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudwatchClient.send(command);

      const alarmNames = response.MetricAlarms?.map(alarm => alarm.AlarmName) || [];
      const hasMonitoringAlarms = alarmNames.some(name =>
        name?.includes('peering') || name?.includes('traffic') || name?.includes('reject')
      );
      expect(hasMonitoringAlarms).toBe(true);
    });

    test('alarms should have SNS actions configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudwatchClient.send(command);

      const alarms = response.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes('peering') || alarm.AlarmName?.includes('traffic')
      ) || [];

      if (alarms.length > 0) {
        expect(alarms[0].AlarmActions).toBeDefined();
        expect(alarms[0].AlarmActions!.length).toBeGreaterThan(0);
        expect(alarms[0].AlarmActions![0]).toContain('arn:aws:sns:');
      }
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic should exist', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.sns_topic_arn
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.sns_topic_arn);
    });
  });

  describe('IAM Roles', () => {
    test('cross-account peering role should exist', async () => {
      const roleName = outputs.cross_account_peering_role_name;
      if (roleName) {
        const command = new GetRoleCommand({
          RoleName: roleName
        });

        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
      }
    });

    test('flow logs role should exist', async () => {
      const roleName = outputs.flow_logs_role_name;
      if (roleName) {
        const command = new GetRoleCommand({
          RoleName: roleName
        });

        const response = await iamClient.send(command);
        expect(response.Role).toBeDefined();
        expect(response.Role!.RoleName).toBe(roleName);
      }
    });
  });

  describe('Routing Configuration', () => {
    test('production VPC should have route tables with peering routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.production_vpc_id] }
        ]
      });
      const response = await ec2ClientUsEast1.send(command);

      const routeTables = response.RouteTables || [];
      const hasPeeringRoute = routeTables.some(rt =>
        rt.Routes?.some(route => route.VpcPeeringConnectionId === outputs.vpc_peering_connection_id)
      );
      expect(hasPeeringRoute).toBe(true);
    });

    test('partner VPC should have route tables with peering routes', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.partner_vpc_id] }
        ]
      });
      const response = await ec2ClientUsEast2.send(command);

      const routeTables = response.RouteTables || [];
      const hasPeeringRoute = routeTables.some(rt =>
        rt.Routes?.some(route => route.VpcPeeringConnectionId === outputs.vpc_peering_connection_id)
      );
      expect(hasPeeringRoute).toBe(true);
    });

    test('should have at least 18 total configured routes', () => {
      const routeCount = parseInt(outputs.total_configured_routes);
      expect(routeCount).toBeGreaterThanOrEqual(18);
    });
  });

  describe('Resource Tagging', () => {
    test('production VPC should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.production_vpc_id]
      });
      const response = await ec2ClientUsEast1.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
    });

    test('partner VPC should have required tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.partner_vpc_id]
      });
      const response = await ec2ClientUsEast2.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('complete cross-region VPC peering workflow should be operational', async () => {
      // 1. VPCs exist
      const vpcCommand1 = new DescribeVpcsCommand({ VpcIds: [outputs.production_vpc_id] });
      const vpcResponse1 = await ec2ClientUsEast1.send(vpcCommand1);
      expect(vpcResponse1.Vpcs).toHaveLength(1);

      const vpcCommand2 = new DescribeVpcsCommand({ VpcIds: [outputs.partner_vpc_id] });
      const vpcResponse2 = await ec2ClientUsEast2.send(vpcCommand2);
      expect(vpcResponse2.Vpcs).toHaveLength(1);

      // 2. Peering connection is active
      const peeringCommand = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpc_peering_connection_id]
      });
      const peeringResponse = await ec2ClientUsEast1.send(peeringCommand);
      expect(peeringResponse.VpcPeeringConnections![0].Status?.Code).toBe('active');

      // 3. DNS resolution enabled
      const peering = peeringResponse.VpcPeeringConnections![0];
      expect(peering.RequesterVpcInfo?.PeeringOptions?.AllowDnsResolutionFromRemoteVpc).toBe(true);
      expect(peering.AccepterVpcInfo?.PeeringOptions?.AllowDnsResolutionFromRemoteVpc).toBe(true);

      // 4. Security groups configured
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.production_security_group_id]
      });
      const sgResponse = await ec2ClientUsEast1.send(sgCommand);
      expect(sgResponse.SecurityGroups).toHaveLength(1);

      // 5. Flow logs active
      const flowLogCommand = new DescribeFlowLogsCommand({
        FlowLogIds: [outputs.production_flow_log_id]
      });
      const flowLogResponse = await ec2ClientUsEast1.send(flowLogCommand);
      expect(flowLogResponse.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');

      // Workflow complete
      expect(true).toBe(true);
    });
  });
});
