import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand
} from "@aws-sdk/client-ec2";
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from "@aws-sdk/client-auto-scaling";

// --- Configuration ---
// Read deployed resource IDs from the cfn-outputs file.
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS SDK clients. Ensure your environment has AWS credentials.
const ec2Client = new EC2Client({ region: "us-east-1" });
const autoScalingClient = new AutoScalingClient({ region: "us-east-1" });

// --- Test Suite ---
describe('AWS Infrastructure Integration Tests', () => {

  // Set a longer timeout for AWS API calls
  jest.setTimeout(30000); 

  describe('Development Environment', () => {
    test('Development VPC should exist and be configured correctly', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.DevelopmentVPCID] });
      const { Vpcs } = await ec2Client.send(command);
      
      expect(Vpcs).toBeDefined();
      expect(Vpcs).toHaveLength(1);
      const vpc = Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Tags).toContainEqual({ Key: 'Name', Value: 'DevVPC' });
    });

    test('Development Subnets should exist and be associated with the Dev VPC', async () => {
        const command = new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.DevelopmentVPCID] }] });
        const { Subnets } = await ec2Client.send(command);

        expect(Subnets).toBeDefined();
        const publicSubnet = Subnets!.find(s => s.Tags && s.Tags.some(t => t.Value === 'DevPublicSubnet'));
        const privateSubnet = Subnets!.find(s => s.Tags && s.Tags.some(t => t.Value === 'DevPrivateSubnet'));

        expect(publicSubnet).toBeDefined();
        expect(publicSubnet!.CidrBlock).toBe('10.0.1.0/24');
        expect(publicSubnet!.MapPublicIpOnLaunch).toBe(true);
        
        expect(privateSubnet).toBeDefined();
        expect(privateSubnet!.CidrBlock).toBe('10.0.2.0/24');
    });

    test('Development Security Group should exist and have correct SSH rule', async () => {
        const command = new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.DevelopmentVPCID] }, { Name: 'group-name', Values: ['Dev SSH Access'] }] });
        const { SecurityGroups } = await ec2Client.send(command);

        expect(SecurityGroups).toBeDefined();
        expect(SecurityGroups).toHaveLength(1);
        const sg = SecurityGroups![0];
        expect(sg.IpPermissions).toBeDefined();
        const sshRule = sg.IpPermissions!.find(p => p.FromPort === 22 && p.ToPort === 22);
        
        expect(sshRule).toBeDefined();
        expect(sshRule!.IpRanges).toContainEqual({ CidrIp: '10.0.0.5/32' });
    });
  });

  describe('Production Environment', () => {
    test('Production VPC should exist and be configured correctly', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.ProductionVPCID] });
      const { Vpcs } = await ec2Client.send(command);
      
      expect(Vpcs).toBeDefined();
      expect(Vpcs).toHaveLength(1);
      const vpc = Vpcs![0];
      expect(vpc.CidrBlock).toBe('192.168.0.0/16');
      expect(vpc.Tags).toContainEqual({ Key: 'Name', Value: 'ProdVPC' });
    });

    test('Production NAT Gateway should exist in the public subnet', async () => {
        const command = new DescribeNatGatewaysCommand({ Filter: [{ Name: 'vpc-id', Values: [outputs.ProductionVPCID] }] });
        const { NatGateways } = await ec2Client.send(command);

        expect(NatGateways).toBeDefined();
        expect(NatGateways).toHaveLength(1);
        const natGateway = NatGateways![0];
        expect(natGateway.State).toBe('available');
        expect(natGateway.SubnetId).toBe(outputs.ProductionPublicSubnetIDs);
    });

    test('Production Security Group should exist and have correct web traffic rules', async () => {
        const command = new DescribeSecurityGroupsCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.ProductionVPCID] }, { Name: 'group-name', Values: ['Prod Web Access'] }] });
        const { SecurityGroups } = await ec2Client.send(command);

        expect(SecurityGroups).toBeDefined();
        expect(SecurityGroups).toHaveLength(1);
        const sg = SecurityGroups![0];
        expect(sg.IpPermissions).toBeDefined();
        const httpRule = sg.IpPermissions!.find(p => p.FromPort === 80);
        const httpsRule = sg.IpPermissions!.find(p => p.FromPort === 443);

        expect(httpRule).toBeDefined();
        expect(httpRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });

        expect(httpsRule).toBeDefined();
        expect(httpsRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    });
  });

  describe('Production Auto Scaling Group', () => {
    test('Auto Scaling Group should exist and be configured correctly', async () => {
        const command = new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [outputs.ProductionAutoScalingGroupName] });
        const { AutoScalingGroups } = await autoScalingClient.send(command);

        expect(AutoScalingGroups).toBeDefined();
        expect(AutoScalingGroups).toHaveLength(1);
        const asg = AutoScalingGroups![0];

        expect(asg.MinSize).toBe(1);
        expect(asg.MaxSize).toBe(3);
        expect(asg.DesiredCapacity).toBe(1);
        expect(asg.VPCZoneIdentifier).toContain(outputs.ProductionPrivateSubnetIDs);
        expect(asg.LaunchConfigurationName).toBe('ProdWebServersLaunchConfig');
    });
  });
});
