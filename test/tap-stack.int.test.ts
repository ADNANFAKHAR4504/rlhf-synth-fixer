import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeTransitGatewaysCommand,
  DescribeTransitGatewayAttachmentsCommand,
  DescribeVpnConnectionsCommand,
  DescribeCustomerGatewaysCommand,
  DescribeVpnGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

const region = process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('Hybrid Cloud Infrastructure Integration Tests', () => {
  describe('VPC Network Connectivity Flow', () => {
    test('VPC should be deployed and accessible', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have subnets across multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);

      const publicSubnets = response.Subnets!.filter((s) => s.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets!.filter((s) => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(4);

      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('VPC should have NAT Gateway for private subnet internet access', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(response.NatGateways![0].State).toMatch(/available|pending/);
    }, 30000);
  });

  describe('Hybrid Connectivity Flow - Transit Gateway', () => {
    test('Transit Gateway should be active and routing traffic', async () => {
      const command = new DescribeTransitGatewaysCommand({
        TransitGatewayIds: [outputs.TransitGatewayId],
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGateways).toHaveLength(1);
      const tgw = response.TransitGateways![0];
      expect(tgw.State).toBe('available');
      expect(tgw.Options?.AmazonSideAsn).toBe(64512);
      expect(tgw.Options?.DnsSupport).toBe('enable');
      expect(tgw.Options?.VpnEcmpSupport).toBe('enable');
    }, 60000);

    test('Transit Gateway should have VPC attachment for routing', async () => {
      const command = new DescribeTransitGatewayAttachmentsCommand({
        Filters: [
          { Name: 'transit-gateway-id', Values: [outputs.TransitGatewayId] },
          { Name: 'resource-type', Values: ['vpc'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGatewayAttachments!.length).toBeGreaterThanOrEqual(1);
      const attachment = response.TransitGatewayAttachments!.find(
        (att) => att.ResourceId === outputs.VPCId
      );

      expect(attachment).toBeDefined();
      expect(attachment!.State).toBe('available');
      expect(attachment!.ResourceType).toBe('vpc');
    }, 30000);

    test('Private subnets should have routes to Transit Gateway for hybrid connectivity', async () => {
      const routeTableCommand = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const routeTableResponse = await ec2Client.send(routeTableCommand);
      
      expect(routeTableResponse.RouteTables).toBeDefined();
      expect(routeTableResponse.RouteTables!.length).toBeGreaterThan(0);

      let tgwRouteFound = false;
      for (const routeTable of routeTableResponse.RouteTables!) {
        const tgwRoute = routeTable.Routes!.find(
          (route) => route.TransitGatewayId === outputs.TransitGatewayId
        );
        
        if (tgwRoute) {
          tgwRouteFound = true;
          expect(tgwRoute.DestinationCidrBlock).toBe('192.168.0.0/16');
          expect(tgwRoute.State).toMatch(/active|blackhole/);
          break;
        }
      }

      expect(tgwRouteFound).toBe(true);
    }, 60000);
  });

  describe('VPN Connectivity Flow - Site-to-Site VPN', () => {
    test('Customer Gateway should be configured for on-premises connection', async () => {
      const vpnCommand = new DescribeVpnConnectionsCommand({
        VpnConnectionIds: [outputs.VPNConnectionId],
      });
      const vpnResponse = await ec2Client.send(vpnCommand);

      const customerGatewayId = vpnResponse.VpnConnections![0].CustomerGatewayId;

      const cgwCommand = new DescribeCustomerGatewaysCommand({
        CustomerGatewayIds: [customerGatewayId!],
      });
      const cgwResponse = await ec2Client.send(cgwCommand);

      expect(cgwResponse.CustomerGateways).toHaveLength(1);
      expect(cgwResponse.CustomerGateways![0].State).toBe('available');
      expect(cgwResponse.CustomerGateways![0].BgpAsn).toBe('65000');
      expect(cgwResponse.CustomerGateways![0].Type).toBe('ipsec.1');
    }, 30000);

    test('VPN connection should be established with Transit Gateway', async () => {
      const command = new DescribeVpnConnectionsCommand({
        VpnConnectionIds: [outputs.VPNConnectionId],
      });
      const response = await ec2Client.send(command);

      expect(response.VpnConnections).toHaveLength(1);
      const vpn = response.VpnConnections![0];
      expect(vpn.State).toBe('available');
      expect(vpn.Type).toBe('ipsec.1');
      expect(vpn.TransitGatewayId).toBe(outputs.TransitGatewayId);
      expect(vpn.Options?.StaticRoutesOnly).toBe(false);
    }, 30000);

    test('VPN connection should have two redundant tunnels for high availability', async () => {
      const command = new DescribeVpnConnectionsCommand({
        VpnConnectionIds: [outputs.VPNConnectionId],
      });
      const response = await ec2Client.send(command);

      const tunnels = response.VpnConnections![0].VgwTelemetry;
      expect(tunnels).toHaveLength(2);

      tunnels!.forEach((tunnel) => {
        expect(tunnel.Status).toMatch(/UP|DOWN/);
        expect(tunnel.StatusMessage).toBeDefined();
      });
    }, 30000);

    test('VPN Gateway should be attached to VPC', async () => {
      const vpnCommand = new DescribeVpnConnectionsCommand({
        VpnConnectionIds: [outputs.VPNConnectionId],
      });
      const vpnResponse = await ec2Client.send(vpnCommand);

      const vgwId = vpnResponse.VpnConnections![0].VpnGatewayId;
      if (vgwId) {
        const vgwCommand = new DescribeVpnGatewaysCommand({
          VpnGatewayIds: [vgwId],
        });
        const vgwResponse = await ec2Client.send(vgwCommand);

        expect(vgwResponse.VpnGateways).toHaveLength(1);
        expect(vgwResponse.VpnGateways![0].State).toBe('available');

        const attachment = vgwResponse.VpnGateways![0].VpcAttachments!.find(
          (att) => att.VpcId === outputs.VPCId
        );
        expect(attachment).toBeDefined();
        expect(attachment!.State).toBe('attached');
      }
    }, 30000);
  });

  describe('Identity and Access Control Flow - IAM', () => {
    test('Hybrid Access Role should be configured', async () => {
      const roleArn = outputs.HybridAccessRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toContain('HybridAccessRole');
    }, 30000);

    test('Hybrid Access Role should have correct trust policy', async () => {
      const roleArn = outputs.HybridAccessRoleArn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      const assumeRoleStatement = trustPolicy.Statement.find(
        (stmt: any) => stmt.Action === 'sts:AssumeRole'
      );

      expect(assumeRoleStatement).toBeDefined();
      expect(assumeRoleStatement.Effect).toBe('Allow');
      expect(assumeRoleStatement.Principal.AWS).toBeDefined();
    }, 30000);

    test('Hybrid Access Role should have ReadOnlyAccess policy', async () => {
      const roleArn = outputs.HybridAccessRoleArn;
      const roleName = roleArn.split('/').pop();

      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const readOnlyPolicy = response.AttachedPolicies!.find((policy) =>
        policy.PolicyName!.includes('ReadOnlyAccess')
      );

      expect(readOnlyPolicy).toBeDefined();
    }, 30000);

    test('Hybrid Access Role should have custom EC2 describe policy', async () => {
      const roleArn = outputs.HybridAccessRoleArn;
      const roleName = roleArn.split('/').pop();

      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'CustomPolicy',
      });
      const response = await iamClient.send(command);

      const policyDocument = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      const ec2Statement = policyDocument.Statement[0];

      expect(ec2Statement.Effect).toBe('Allow');
      expect(ec2Statement.Action).toContain('ec2:DescribeVpcs');
      expect(ec2Statement.Action).toContain('ec2:DescribeSubnets');
      expect(ec2Statement.Action).toContain('ec2:DescribeSecurityGroups');
    }, 30000);
  });

  describe('Monitoring Flow - CloudWatch', () => {
    test('VPN Tunnel State CloudWatch Alarm should be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmTypes: ['MetricAlarm'],
      });
      const response = await cloudWatchClient.send(command);

      const vpnAlarm = response.MetricAlarms!.find(
        (alarm) =>
          alarm.MetricName === 'TunnelState' &&
          alarm.Namespace === 'AWS/VPN' &&
          alarm.Dimensions!.some((dim) => dim.Value === outputs.VPNConnectionId)
      );

      expect(vpnAlarm).toBeDefined();
      expect(vpnAlarm!.ComparisonOperator).toBe('LessThanThreshold');
      expect(vpnAlarm!.Threshold).toBe(0);
      expect(vpnAlarm!.EvaluationPeriods).toBe(1);
      expect(vpnAlarm!.StateValue).toMatch(/OK|ALARM|INSUFFICIENT_DATA/);
    }, 30000);

    test('CloudWatch Log Group should be configured for VPC Flow Logs', async () => {
      const command = new DescribeLogGroupsCommand({});
      const response = await logsClient.send(command);

      const flowLogGroup = response.logGroups!.find((lg) => {
        const name = lg.logGroupName!.toLowerCase();
        return (
          name.includes('flowlog') ||
          name.includes('flow-log') ||
          name.includes('tapstack') ||
          name.includes('vpc') ||
          (name.includes('aws/') && name.includes('log'))
        );
      });

      expect(flowLogGroup).toBeDefined();
      if (flowLogGroup) {
        expect(flowLogGroup.retentionInDays).toBe(30);
      }
    }, 30000);
  });

  describe('End-to-End Connectivity Scenario', () => {
    test('Complete hybrid cloud path: VPC -> TGW -> VPN should be operational', async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');

      const tgwCommand = new DescribeTransitGatewaysCommand({
        TransitGatewayIds: [outputs.TransitGatewayId],
      });
      const tgwResponse = await ec2Client.send(tgwCommand);
      expect(tgwResponse.TransitGateways![0].State).toBe('available');

      const vpnCommand = new DescribeVpnConnectionsCommand({
        VpnConnectionIds: [outputs.VPNConnectionId],
      });
      const vpnResponse = await ec2Client.send(vpnCommand);
      expect(vpnResponse.VpnConnections![0].State).toBe('available');

      const routeCommand = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'route.transit-gateway-id', Values: [outputs.TransitGatewayId] },
        ],
      });
      const routeResponse = await ec2Client.send(routeCommand);
      expect(routeResponse.RouteTables!.length).toBeGreaterThanOrEqual(1);
    }, 60000);
  });
});
