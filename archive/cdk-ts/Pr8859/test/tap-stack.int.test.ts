// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK === 'true';

// AWS SDK client configuration
const clientConfig: any = { region: awsRegion };
if (process.env.AWS_ENDPOINT_URL) {
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
}

// AWS SDK clients
const ec2Client = new EC2Client(clientConfig);
const autoScalingClient = new AutoScalingClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs[0].State).toBe('available');
    });

    test('VPC has correct availability zones', async () => {
      const azs = outputs.AvailabilityZones.split(',');
      expect(azs.length).toBe(2);
      // Match either us-east-1 or us-west-2 format
      expect(azs[0]).toMatch(/^us-(east|west)-[12][a-z]$/);
      expect(azs[1]).toMatch(/^us-(east|west)-[12][a-z]$/);
      expect(azs[0]).not.toBe(azs[1]);
    });

    test('Public subnets are correctly configured', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',').filter(Boolean);
      expect(publicSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets.length).toBe(2);
      response.Subnets.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VpcId);
        // LocalStack may not set MapPublicIpOnLaunch correctly, skip this check
        if (!isLocalStack) {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        }
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(0);
        // Check CIDR blocks are in the expected range (public subnets)
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[0-1]\.0\/24$/);
      });

      // Verify they are in different AZs
      const azs = response.Subnets.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    // Skip private subnet tests when running on LocalStack with PRIVATE_ISOLATED
    const conditionalPrivateTest = isLocalStack && !outputs.PrivateSubnetIds ? test.skip : test;
    conditionalPrivateTest('Private subnets are correctly configured', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',').filter(Boolean);
      if (privateSubnetIds.length === 0) {
        console.log('Skipping: No private subnet IDs in outputs (LocalStack mode)');
        return;
      }
      expect(privateSubnetIds.length).toBe(2);

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets.length).toBe(2);
      response.Subnets.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(0);
        // Check CIDR blocks are in the expected range
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[2-3]\.0\/24$/);
      });

      // Verify they are in different AZs
      const azs = response.Subnets.map((s) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });
  });

  describe('NAT Gateway Configuration', () => {
    // NAT Gateway is not created in LocalStack mode (uses PRIVATE_ISOLATED)
    const conditionalNatTest = isLocalStack ? test.skip : test;

    conditionalNatTest('NAT Gateway is active and properly configured', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways.length).toBeGreaterThanOrEqual(1);

      const natGateway = response.NatGateways[0];
      expect(natGateway.State).toBe('available');
      expect(natGateway.VpcId).toBe(outputs.VpcId);
      expect(publicSubnetIds).toContain(natGateway.SubnetId);

      // NAT Gateway should have a public IP
      expect(natGateway.NatGatewayAddresses).toBeDefined();
      expect(natGateway.NatGatewayAddresses.length).toBeGreaterThan(0);
      expect(natGateway.NatGatewayAddresses[0].PublicIp).toBeDefined();
    });

    conditionalNatTest('Private subnets have routes to NAT Gateway', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',').filter(Boolean);
      if (privateSubnetIds.length === 0) {
        console.log('Skipping: No private subnet IDs in outputs');
        return;
      }

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
          {
            Name: 'association.subnet-id',
            Values: privateSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables.length).toBeGreaterThan(0);

      response.RouteTables.forEach((routeTable) => {
        const defaultRoute = routeTable.Routes.find(
          (route) => route.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute.NatGatewayId).toBeDefined();
        expect(defaultRoute.State).toBe('active');
      });
    });
  });

  describe('Security Group Configuration', () => {
    test('Security group exists with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups.length).toBe(1);

      const sg = response.SecurityGroups[0];
      expect(sg.VpcId).toBe(outputs.VpcId);
      expect(sg.GroupName).toContain('web-sg');
      expect(sg.Description).toContain('Security group for web instances');
    });

    // Security group rule tests - LocalStack may not fully support IpPermissions
    const conditionalSgRuleTest = isLocalStack ? test.skip : test;

    conditionalSgRuleTest('SSH access is restricted to specific IP range', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups[0];
      const sshRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.IpRanges).toBeDefined();
      expect(sshRule.IpRanges.length).toBe(1);
      expect(sshRule.IpRanges[0].CidrIp).toBe('203.0.113.0/24');
      // Description may vary, just check SSH rule exists
    });

    conditionalSgRuleTest('HTTP access is allowed from anywhere', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups[0];
      const httpRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.IpRanges).toBeDefined();
      expect(httpRule.IpRanges.length).toBe(1);
      expect(httpRule.IpRanges[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    // AutoScaling API is not available in LocalStack Community
    const conditionalAsgTest = isLocalStack ? test.skip : test;

    conditionalAsgTest('Auto Scaling Group exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const response = await autoScalingClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups.length).toBe(1);

      const asg = response.AutoScalingGroups[0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(4);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('EC2');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    conditionalAsgTest('Auto Scaling Group has exactly 2 healthy instances running', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const response = await autoScalingClient.send(command);

      const asg = response.AutoScalingGroups[0];
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances.length).toBe(2);

      asg.Instances.forEach((instance) => {
        expect(instance.HealthStatus).toBe('Healthy');
        expect(instance.LifecycleState).toBe('InService');
      });
    });

    conditionalAsgTest('Instances are deployed in public subnets', async () => {
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);

      const instanceIds = asgResponse.AutoScalingGroups[0].Instances.map(
        (i) => i.InstanceId
      );

      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const ec2Response = await ec2Client.send(ec2Command);

      const publicSubnetIds = outputs.PublicSubnetIds.split(',');

      ec2Response.Reservations.forEach((reservation) => {
        reservation.Instances.forEach((instance) => {
          expect(instance.State.Name).toBe('running');
          expect(instance.VpcId).toBe(outputs.VpcId);
          expect(publicSubnetIds).toContain(instance.SubnetId);
          expect(instance.PublicIpAddress).toBeDefined();
          expect(instance.SecurityGroups.some(sg => sg.GroupId === outputs.SecurityGroupId)).toBe(true);
        });
      });
    });

    conditionalAsgTest('Instances are distributed across availability zones', async () => {
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups[0];
      const azs = asg.Instances.map((i) => i.AvailabilityZone);

      // With 2 instances and 2 AZs, they should be distributed
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(2);
    });

    conditionalAsgTest('CPU scaling policy is configured correctly', async () => {
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: outputs.AutoScalingGroupName,
      });
      const response = await autoScalingClient.send(command);

      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies.length).toBeGreaterThan(0);

      const cpuPolicy = response.ScalingPolicies.find((policy) =>
        policy.PolicyName.includes('CpuScaleUp')
      );

      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy.PolicyType).toBe('TargetTrackingScaling');
      expect(cpuPolicy.TargetTrackingConfiguration).toBeDefined();
      expect(
        cpuPolicy.TargetTrackingConfiguration.PredefinedMetricSpecification
      ).toBeDefined();
      expect(
        cpuPolicy.TargetTrackingConfiguration.PredefinedMetricSpecification
          .PredefinedMetricType
      ).toBe('ASGAverageCPUUtilization');
      expect(cpuPolicy.TargetTrackingConfiguration.TargetValue).toBe(70);
    });
  });

  describe('IAM Role Configuration', () => {
    test('EC2 instance role exists with correct permissions', async () => {
      const roleName = outputs.InstanceRoleArn.split('/').pop();

      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
      expect(response.Role.AssumeRolePolicyDocument).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role.AssumeRolePolicyDocument)
      );
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement.length).toBeGreaterThan(0);

      const ec2AssumeRole = assumeRolePolicy.Statement.find(
        (s: any) => s.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2AssumeRole).toBeDefined();
      expect(ec2AssumeRole.Effect).toBe('Allow');
      expect(ec2AssumeRole.Action).toBe('sts:AssumeRole');
    });
  });

  describe('Network Connectivity', () => {
    test('Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways.length).toBe(1);

      const igw = response.InternetGateways[0];
      expect(igw.InternetGatewayId).toMatch(/^igw-/);
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments.length).toBe(1);
      expect(igw.Attachments[0].VpcId).toBe(outputs.VpcId);
      expect(igw.Attachments[0].State).toBe('available');
    });

    test('Public subnets have internet gateway routes', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',').filter(Boolean);

      // Get route tables associated with public subnets
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables.length).toBeGreaterThan(0);

      // For LocalStack, route tables may have 0.0.0.0/0 destination without GatewayId populated
      // Find route tables with default routes (0.0.0.0/0)
      const publicRouteTables = response.RouteTables.filter(routeTable => {
        const hasDefaultRoute = routeTable.Routes?.some(
          route => route.DestinationCidrBlock === '0.0.0.0/0'
        );
        return hasDefaultRoute;
      });

      // For LocalStack, just verify route tables exist with default routes
      // For real AWS, also verify IGW association
      if (isLocalStack) {
        // LocalStack: just verify route tables with default routes exist
        expect(publicRouteTables.length).toBeGreaterThan(0);
      } else {
        // Real AWS: verify IGW routes
        const igwRouteTables = publicRouteTables.filter(routeTable => {
          const hasIgwRoute = routeTable.Routes?.some(
            route => route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId?.startsWith('igw-')
          );
          return hasIgwRoute;
        });
        expect(igwRouteTables.length).toBeGreaterThan(0);

        igwRouteTables.forEach((routeTable) => {
          const defaultRoute = routeTable.Routes.find(
            (route) => route.DestinationCidrBlock === '0.0.0.0/0'
          );
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute.GatewayId).toBeDefined();
          expect(defaultRoute.GatewayId).toMatch(/^igw-/);
          expect(defaultRoute.State).toBe('active');
        });
      }
    });

    test('All public subnets belong to the correct VPC', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',').filter(Boolean);

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets.length).toBe(2);
      response.Subnets.forEach((subnet) => {
        expect(subnet.VpcId).toBe(outputs.VpcId);
        expect(subnet.State).toBe('available');
      });
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has proper tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs[0];
      const tags = vpc.Tags || [];

      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain('vpc');

      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag).toBeDefined();

      const projectTag = tags.find((t) => t.Key === 'Project');
      expect(projectTag).toBeDefined();
    });

    // AutoScaling tags test skipped for LocalStack
    const conditionalTagTest = isLocalStack ? test.skip : test;
    conditionalTagTest('Auto Scaling Group instances have proper tags', async () => {
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups[0];
      const tags = asg.Tags || [];

      const nameTag = tags.find((t) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain('asg');
      expect(nameTag.PropagateAtLaunch).toBe(true);

      const envTag = tags.find((t) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.PropagateAtLaunch).toBe(true);

      const projectTag = tags.find((t) => t.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag.Value).toBe('TapInfrastructure');
      expect(projectTag.PropagateAtLaunch).toBe(true);
    });
  });
});
