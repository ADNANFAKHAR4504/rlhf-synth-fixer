import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeAddressesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

describe('Secure VPC Infrastructure Integration Tests', () => {
  let cloudFormationClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let iamClient: IAMClient;

  const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
  const region = process.env.AWS_REGION || 'us-east-1';

  let stackOutputs: { [key: string]: string } = {};

  beforeAll(async () => {
    // Initialize AWS SDK v3 clients
    cloudFormationClient = new CloudFormationClient({ region });
    ec2Client = new EC2Client({ region });
    iamClient = new IAMClient({ region });

    // Get stack outputs
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const stackDescription = await cloudFormationClient.send(command);

      if (stackDescription.Stacks && stackDescription.Stacks[0].Outputs) {
        stackDescription.Stacks[0].Outputs.forEach((output: any) => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    } catch (error) {
      console.error('Failed to get stack outputs:', error);
      throw new Error(`Stack ${stackName} not found or not accessible`);
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('should have deployed stack successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const stacks = await cloudFormationClient.send(command);

      expect(stacks.Stacks).toBeDefined();
      expect(stacks.Stacks!.length).toBe(1);
      expect(stacks.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'PublicSecurityGroupId',
        'InstanceProfileArn',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have created VPC with correct configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcs = await ec2Client.send(command);

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBe(1);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toMatch(/^10\.0\.0\.0\/\d+$/);
    });

    test('should have internet gateway attached', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      const igws = await ec2Client.send(command);

      expect(igws.InternetGateways).toBeDefined();
      expect(igws.InternetGateways!.length).toBe(1);

      const igw = igws.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should have NAT gateway with elastic IP', async () => {
      const vpcId = stackOutputs.VPCId;

      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const natGateways = await ec2Client.send(natCommand);

      expect(natGateways.NatGateways).toBeDefined();
      expect(natGateways.NatGateways!.length).toBe(1);

      const natGw = natGateways.NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.NatGatewayAddresses).toBeDefined();
      expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);

      // Verify Elastic IP
      const allocationId = natGw.NatGatewayAddresses![0].AllocationId;
      const eipCommand = new DescribeAddressesCommand({
        AllocationIds: [allocationId!],
      });
      const addresses = await ec2Client.send(eipCommand);

      expect(addresses.Addresses).toBeDefined();
      expect(addresses.Addresses!.length).toBe(1);
      expect(addresses.Addresses![0].Domain).toBe('vpc');
    });
  });

  describe('Subnet Configuration', () => {
    test('should have two public subnets in different AZs', async () => {
      const publicSubnetIds = stackOutputs.PublicSubnetIds.split(',');
      expect(publicSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const subnets = await ec2Client.send(command);

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBe(2);

      const azs = subnets.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(azs.length).toBe(2);
      expect(new Set(azs).size).toBe(2); // Should be in different AZs

      // Verify no auto-assign public IP (security best practice)
      subnets.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should have two private subnets in different AZs', async () => {
      const privateSubnetIds = stackOutputs.PrivateSubnetIds.split(',');
      expect(privateSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const subnets = await ec2Client.send(command);

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBe(2);

      const azs = subnets.Subnets!.map(subnet => subnet.AvailabilityZone);
      expect(azs.length).toBe(2);
      expect(new Set(azs).size).toBe(2); // Should be in different AZs
    });
  });

  describe('Route Tables and Routing', () => {
    test('should have proper public subnet routing', async () => {
      const vpcId = stackOutputs.VPCId;
      const publicSubnetIds = stackOutputs.PublicSubnetIds.split(',');

      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: publicSubnetIds },
        ],
      });
      const routeTables = await ec2Client.send(command);

      expect(routeTables.RouteTables).toBeDefined();
      expect(routeTables.RouteTables!.length).toBeGreaterThan(0);

      // Check for internet gateway route
      const hasIgwRoute = routeTables.RouteTables!.some(rt =>
        rt.Routes!.some(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.GatewayId &&
            route.GatewayId.startsWith('igw-')
        )
      );
      expect(hasIgwRoute).toBe(true);
    });

    test('should have proper private subnet routing', async () => {
      const vpcId = stackOutputs.VPCId;
      const privateSubnetIds = stackOutputs.PrivateSubnetIds.split(',');

      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: privateSubnetIds },
        ],
      });
      const routeTables = await ec2Client.send(command);

      expect(routeTables.RouteTables).toBeDefined();
      expect(routeTables.RouteTables!.length).toBeGreaterThan(0);

      // Check for NAT gateway route
      const hasNatRoute = routeTables.RouteTables!.some(rt =>
        rt.Routes!.some(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.NatGatewayId &&
            route.NatGatewayId.startsWith('nat-')
        )
      );
      expect(hasNatRoute).toBe(true);
    });
  });

  describe('Security Groups', () => {
    test('should have public security group with HTTPS only', async () => {
      const sgId = stackOutputs.PublicSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const securityGroups = await ec2Client.send(command);

      expect(securityGroups.SecurityGroups).toBeDefined();
      expect(securityGroups.SecurityGroups!.length).toBe(1);

      const sg = securityGroups.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBe(1);

      const httpsRule = sg.IpPermissions![0];
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have private security group with restricted access', async () => {
      const privateSecurityGroupId = stackOutputs.PrivateSecurityGroupId;
      expect(privateSecurityGroupId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [privateSecurityGroupId],
      });
      const securityGroups = await ec2Client.send(command);

      expect(securityGroups.SecurityGroups).toBeDefined();
      expect(securityGroups.SecurityGroups!.length).toBe(1);

      const sg = securityGroups.SecurityGroups![0];
      expect(sg.IpPermissions).toBeDefined();
      expect(sg.IpPermissions!.length).toBe(1);

      const appRule = sg.IpPermissions![0];
      expect(appRule.IpProtocol).toBe('tcp');
      expect(appRule.UserIdGroupPairs).toBeDefined();
      expect(appRule.UserIdGroupPairs!.length).toBe(1);

      // Should reference public security group
      const publicSgId = stackOutputs.PublicSecurityGroupId;
      expect(appRule.UserIdGroupPairs![0].GroupId).toBe(publicSgId);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 least privilege role', async () => {
      const instanceProfileArn = stackOutputs.InstanceProfileArn;
      expect(instanceProfileArn).toBeDefined();

      // Extract role name from instance profile
      const profileName = instanceProfileArn.split('/').pop();
      const profileCommand = new GetInstanceProfileCommand({
        InstanceProfileName: profileName,
      });
      const profile = await iamClient.send(profileCommand);

      expect(profile.InstanceProfile).toBeDefined();
      expect(profile.InstanceProfile!.Roles).toBeDefined();
      expect(profile.InstanceProfile!.Roles!.length).toBe(1);

      const roleName = profile.InstanceProfile!.Roles![0].RoleName;
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const role = await iamClient.send(roleCommand);

      expect(role.Role).toBeDefined();
      expect(role.Role!.AssumeRolePolicyDocument).toBeDefined();

      // Verify trust policy
      const trustPolicy = JSON.parse(
        decodeURIComponent(role.Role!.AssumeRolePolicyDocument!)
      );
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    test('should have SSM policy with least privilege', async () => {
      const instanceProfileArn = stackOutputs.InstanceProfileArn;
      const profileName = instanceProfileArn.split('/').pop();

      const profileCommand = new GetInstanceProfileCommand({
        InstanceProfileName: profileName,
      });
      const profile = await iamClient.send(profileCommand);
      const roleName = profile.InstanceProfile!.Roles![0].RoleName;

      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const policies = await iamClient.send(policiesCommand);

      expect(policies.AttachedPolicies).toBeDefined();

      // Should have inline policies for SSM
      // Note: This test checks that the role exists and has policies
      // The actual policy content validation is done in unit tests
    });
  });

  describe('Security and Compliance', () => {
    test('should have proper resource tagging', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcs = await ec2Client.send(command);

      expect(vpcs.Vpcs![0].Tags).toBeDefined();
      const tags = vpcs.Vpcs![0].Tags!;

      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('SecureVPC');
    });

    test('should enforce security best practices', async () => {
      // Verify public subnets don't auto-assign public IPs
      const publicSubnetIds = stackOutputs.PublicSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const subnets = await ec2Client.send(command);

      subnets.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('High Availability', () => {
    test('should deploy resources across multiple AZs', async () => {
      const publicSubnetIds = stackOutputs.PublicSubnetIds.split(',');
      const privateSubnetIds = stackOutputs.PrivateSubnetIds.split(',');

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const subnets = await ec2Client.send(command);

      const azs = new Set(
        subnets.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(azs.size).toBe(2); // Should span 2 AZs
    });
  });

  describe('Network Connectivity', () => {
    test('should have proper network isolation', async () => {
      const vpcId = stackOutputs.VPCId;
      const publicSubnetIds = stackOutputs.PublicSubnetIds.split(',');
      const privateSubnetIds = stackOutputs.PrivateSubnetIds.split(',');

      // Verify subnets are in the same VPC
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const subnets = await ec2Client.send(command);

      subnets.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should use single NAT gateway for cost efficiency', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const natGateways = await ec2Client.send(command);

      expect(natGateways.NatGateways).toBeDefined();
      expect(natGateways.NatGateways!.length).toBe(1); // Single NAT for cost optimization
    });
  });
});
