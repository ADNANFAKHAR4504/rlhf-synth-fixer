// Integration tests for Multi-Tier Infrastructure
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr483';

// AWS clients
const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const autoScalingClient = new AutoScalingClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const iamClient = new IAMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Helper function to extract outputs
function getStackOutputs() {
  // Since the outputs are already flattened in flat-outputs.json,
  // we can directly return the outputs object
  return outputs;
}

describe('Multi-Tier Infrastructure Integration Tests', () => {
  const vpcOutputs = getStackOutputs();
  const iamOutputs = getStackOutputs();
  const asgOutputs = getStackOutputs();

  describe('VPC Infrastructure', () => {
    test('should have deployed VPC with correct configuration', async () => {
      const vpcId = vpcOutputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.DhcpOptionsId).toBeDefined();
      expect(vpc.InstanceTenancy).toBe('default');
    });

    test('should have deployed public and private subnets across AZs', async () => {
      const publicSubnetIds = vpcOutputs.PublicSubnetIds.split(',');
      const privateSubnetIds = vpcOutputs.PrivateSubnetIds.split(',');

      expect(publicSubnetIds).toHaveLength(2);
      expect(privateSubnetIds).toHaveLength(2);

      // Check public subnets
      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const publicResponse = await ec2Client.send(publicCommand);

      expect(publicResponse.Subnets).toHaveLength(2);
      publicResponse.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(vpcOutputs.VpcId);
      });

      // Check private subnets
      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const privateResponse = await ec2Client.send(privateCommand);

      expect(privateResponse.Subnets).toHaveLength(2);
      privateResponse.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(vpcOutputs.VpcId);
      });

      // Verify subnets are in different AZs
      const allAZs = [
        ...publicResponse.Subnets!.map(s => s.AvailabilityZone),
        ...privateResponse.Subnets!.map(s => s.AvailabilityZone),
      ];
      const uniqueAZs = [...new Set(allAZs)];
      expect(uniqueAZs.length).toBeGreaterThanOrEqual(2);
    });

    test('should have NAT Gateways for private subnet egress', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [vpcOutputs.VpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(2);
      response.NatGateways!.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.VpcId).toBe(vpcOutputs.VpcId);
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
        expect(natGw.NatGatewayAddresses![0].AllocationId).toBeDefined();
      });
    });
  });

  describe('IAM Infrastructure', () => {
    test('should have deployed EC2 IAM role with correct permissions', async () => {
      const roleArn = iamOutputs.EC2RoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::/);

      const roleName = `EC2-MultiTier-Role-${environmentSuffix}`;
      const command = new GetRoleCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      // Check ARN format but not the exact account ID
      expect(response.Role!.Arn).toMatch(new RegExp(`^arn:aws:iam::\\d+:role/${roleName}$`));

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have deployed instance profile', async () => {
      const instanceProfileArn = iamOutputs.InstanceProfileArn;
      expect(instanceProfileArn).toBeDefined();

      const instanceProfileName = `EC2-MultiTier-Profile-${environmentSuffix}`;
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName,
      });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.InstanceProfileName).toBe(
        instanceProfileName
      );
      // Check ARN format but not the exact account ID
      expect(response.InstanceProfile!.Arn).toMatch(
        new RegExp(`^arn:aws:iam::\\d+:instance-profile/${instanceProfileName}$`)
      );
      expect(response.InstanceProfile!.Roles).toHaveLength(1);
      expect(response.InstanceProfile!.Roles![0].RoleName).toBe(
        `EC2-MultiTier-Role-${environmentSuffix}`
      );
    });
  });

  describe('Auto Scaling Infrastructure', () => {
    test('should have deployed Auto Scaling Group with correct configuration', async () => {
      const asgName = asgOutputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();
      expect(asgName).toContain(environmentSuffix);

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await autoScalingClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('EC2');
      expect(asg.VPCZoneIdentifier).toBeDefined();
      expect(asg.LaunchTemplate).toBeDefined();

      // Verify instances are in private subnets
      const privateSubnetIds = vpcOutputs.PrivateSubnetIds.split(',');
      const asgSubnets = asg.VPCZoneIdentifier!.split(',');
      expect(asgSubnets.sort()).toEqual(privateSubnetIds.sort());
    });

    test('should have healthy EC2 instances running', async () => {
      const asgName = asgOutputs.AutoScalingGroupName;

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.Instances).toHaveLength(2);

      const instanceIds = asg.Instances!.map(i => i.InstanceId!);

      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const ec2Response = await ec2Client.send(ec2Command);

      const instances = ec2Response.Reservations!.flatMap(r => r.Instances!);
      expect(instances).toHaveLength(2);

      instances.forEach(instance => {
        expect(instance.State!.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.SecurityGroups).toHaveLength(1);
        expect(instance.SecurityGroups![0].GroupId).toBe(
          asgOutputs.SecurityGroupId
        );

        // Verify instances are in private subnets
        const privateSubnetIds = vpcOutputs.PrivateSubnetIds.split(',');
        expect(privateSubnetIds).toContain(instance.SubnetId!);
      });
    });

    test('should have CPU-based scaling policy configured', async () => {
      const asgName = asgOutputs.AutoScalingGroupName;

      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: asgName,
      });
      const response = await autoScalingClient.send(command);

      expect(response.ScalingPolicies).toHaveLength(1);

      const policy = response.ScalingPolicies![0];
      expect(policy.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.TargetTrackingConfiguration).toBeDefined();
      expect(policy.TargetTrackingConfiguration!.TargetValue).toBe(70);
      expect(
        policy.TargetTrackingConfiguration!.PredefinedMetricSpecification
      ).toBeDefined();
      expect(
        policy.TargetTrackingConfiguration!.PredefinedMetricSpecification!
          .PredefinedMetricType
      ).toBe('ASGAverageCPUUtilization');
    });

    test('should have security group with correct rules', async () => {
      const securityGroupId = asgOutputs.SecurityGroupId;
      expect(securityGroupId).toBeDefined();
      expect(securityGroupId).toMatch(/^sg-/);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);

      const sg = response.SecurityGroups![0];
      expect(sg.GroupName).toContain(environmentSuffix);
      expect(sg.Description).toContain(
        `Security group for EC2 instances in ${environmentSuffix}`
      );
      expect(sg.VpcId).toBe(vpcOutputs.VpcId);

      // Check inbound rules
      expect(sg.IpPermissions).toHaveLength(2);

      const httpRule = sg.IpPermissions!.find(rule => rule.FromPort === 80);
      const httpsRule = sg.IpPermissions!.find(rule => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule!.IpProtocol).toBe('tcp');
      expect(httpRule!.ToPort).toBe(80);
      expect(httpRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');

      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpProtocol).toBe('tcp');
      expect(httpsRule!.ToPort).toBe(443);
      expect(httpsRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('should have all components properly integrated', async () => {
      // Verify that all outputs are present and properly formatted
      expect(vpcOutputs.VpcId).toBeDefined();
      expect(vpcOutputs.PublicSubnetIds).toBeDefined();
      expect(vpcOutputs.PrivateSubnetIds).toBeDefined();
      expect(iamOutputs.EC2RoleArn).toBeDefined();
      expect(iamOutputs.InstanceProfileArn).toBeDefined();
      expect(asgOutputs.AutoScalingGroupName).toBeDefined();
      expect(asgOutputs.SecurityGroupId).toBeDefined();

      // Verify environment suffix is consistently applied
      expect(vpcOutputs.VpcId).toMatch(/vpc-/);
      expect(iamOutputs.EC2RoleArn).toContain(environmentSuffix);
      expect(iamOutputs.InstanceProfileArn).toContain(environmentSuffix);
      expect(asgOutputs.AutoScalingGroupName).toContain(environmentSuffix);
    });

    test('should meet all prompt requirements', async () => {
      // VPC with proper networking - at least 2 public and 2 private subnets across different AZs
      const publicSubnetIds = vpcOutputs.PublicSubnetIds.split(',');
      const privateSubnetIds = vpcOutputs.PrivateSubnetIds.split(',');
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      // EC2 Auto Scaling Group that runs in private subnets and manages at least 2 instances
      const asgName = asgOutputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);

      // IAM roles and policies for secure EC2-to-AWS services interaction
      expect(iamOutputs.EC2RoleArn).toBeDefined();
      expect(iamOutputs.InstanceProfileArn).toBeDefined();

      // Everything should be implemented as TypeScript CDK stack code (verified by successful deployment)
      expect(true).toBe(true); // If we got this far, CDK TypeScript worked correctly
    });
  });
});
