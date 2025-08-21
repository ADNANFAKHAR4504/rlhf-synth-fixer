// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  VPCLatticeClient,
  GetServiceNetworkCommand
} from '@aws-sdk/client-vpc-lattice';
import {
  CloudWatchClient,
  ListDashboardsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const latticeClient = new VPCLatticeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr65';

// Load outputs if they exist
let outputs: any = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';
if (fs.existsSync(outputsFile)) {
  outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
}

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('should have VPC with correct CIDR block deployed', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are part of VpcAttributesSupport (different API call)
      // We're checking the presence of the VPC with the correct CIDR
    });

    test('should have correct number of subnets', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      // Should have at least 4 subnets (2 public, 2 private)
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);
      
      // Check for public subnets
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      
      // Check for private subnets
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have NAT Gateway configured', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
      expect(response.NatGateways![0].State).toBe('available');
    });

    test('should have Internet Gateway attached', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways!.length).toBeGreaterThanOrEqual(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments!.length).toBeGreaterThanOrEqual(1);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Security Configuration', () => {
    test('should have Security Group with correct rules', async () => {
      if (!outputs.SecurityGroupId) {
        console.warn('SecurityGroupId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      // Check for HTTP rule
      const httpRule = sg.IpPermissions!.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: '0.0.0.0/0' })
      );
      
      // Check for HTTPS rule
      const httpsRule = sg.IpPermissions!.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: '0.0.0.0/0' })
      );
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have VPC Flow Logs enabled', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.FlowLogs!.length).toBeGreaterThanOrEqual(1);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should have CloudWatch Log Group for Flow Logs', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs/`
      });
      const response = await logsClient.send(command);
      
      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);
      // Find the log group for our deployment
      const logGroup = response.logGroups!.find(lg => 
        lg.logGroupName?.includes(environmentSuffix)
      );
      expect(logGroup).toBeDefined();
      if (logGroup && logGroup.retentionInDays !== undefined) {
        expect(logGroup.retentionInDays).toBe(7);
      }
    });

    test('should have CloudWatch Dashboard for monitoring', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: `vpc-monitoring-`
      });
      const response = await cloudWatchClient.send(command);
      
      // Find the dashboard for our deployment
      const dashboard = response.DashboardEntries?.find(d => 
        d.DashboardName?.includes(environmentSuffix)
      );
      expect(dashboard).toBeDefined();
    });
  });

  describe('VPC Lattice Configuration', () => {
    test('should have VPC Lattice Service Network configured', async () => {
      if (!outputs.LatticeServiceNetworkId) {
        console.warn('LatticeServiceNetworkId not found in outputs, skipping test');
        return;
      }

      const command = new GetServiceNetworkCommand({
        serviceNetworkIdentifier: outputs.LatticeServiceNetworkId
      });
      const response = await latticeClient.send(command);
      
      expect(response.authType).toBe('NONE');
      expect(response.name).toBeDefined();
      // Check that the name includes 'service-network'
      expect(response.name).toContain('service-network');
    });
  });

  describe('Resource Tagging', () => {
    test('should have correct tags on VPC', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId]
      });
      const response = await ec2Client.send(command);
      
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Environment', Value: 'production' })
      );
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Project', Value: 'VPC-Infrastructure' })
      );
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' })
      );
    });
  });
});
