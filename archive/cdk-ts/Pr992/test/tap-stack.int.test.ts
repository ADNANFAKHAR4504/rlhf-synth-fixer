import { DescribeInstancesCommand, DescribeSecurityGroupsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetInstanceProfileCommand, GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

beforeAll(() => {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  }
});

// AWS Clients
const ec2Client = new EC2Client({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_DEFAULT_REGION || 'us-east-1' });

describe('TapStack Integration Tests - End-to-End Infrastructure Validation', () => {
  describe('EC2 Instance Validation', () => {
    test('should have deployed EC2 instance with correct configuration', async () => {
      expect(outputs.InstanceId).toBeDefined();
      expect(outputs.InstanceId).toMatch(/^i-[a-f0-9]{8,17}$/);

      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.InstanceId]
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.InstanceType).toBe('t3.micro');
      expect(instance?.ImageId).toMatch(/^ami-[a-f0-9]{8,17}$/);
    }, 30000);

    test('should be launched in a public subnet', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.InstanceId]
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      expect(instance?.SubnetId).toBeDefined();
      expect(instance?.PublicIpAddress).toBeDefined();
      expect(instance?.PublicDnsName).toBeDefined();
    }, 30000);

    test('should not have SSH key pair configured', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.InstanceId]
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      expect(instance?.KeyName).toBeUndefined();
    }, 30000);
  });

  describe('Security Group Validation', () => {
    test('should have security group with correct HTTPS-only ingress rules', async () => {
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.SecurityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      expect(securityGroup).toBeDefined();
      
      // Check ingress rules - should only allow HTTPS (port 443)
      const ingressRules = securityGroup?.IpPermissions || [];
      expect(ingressRules).toHaveLength(1);
      
      const httpsRule = ingressRules[0];
      expect(httpsRule?.FromPort).toBe(443);
      expect(httpsRule?.ToPort).toBe(443);
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.[0]).toEqual(
        expect.objectContaining({ CidrIp: '0.0.0.0/0' })
      );      
    }, 30000);

    test('should have unrestricted egress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      // Check egress rules - should be unrestricted
      const egressRules = securityGroup?.IpPermissionsEgress || [];
      expect(egressRules.length).toBeGreaterThan(0);
      
      // Should have unrestricted egress rule
      const unrestrictedRule = egressRules.find(rule => 
        rule.IpProtocol === '-1' && 
        rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(unrestrictedRule).toBeDefined();
    }, 30000);

    test('should not allow SSH access on port 22', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });

      const response = await ec2Client.send(command);
      const securityGroup = response.SecurityGroups?.[0];

      const ingressRules = securityGroup?.IpPermissions || [];
      const sshRule = ingressRules.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeUndefined();
    }, 30000);
  });

  describe('IAM Instance Profile Validation', () => {
    test('should have instance profile with correct configuration', async () => {
      expect(outputs.InstanceProfileArn).toBeDefined();
      expect(outputs.InstanceProfileArn).toMatch(/^arn:aws:iam::\d{12}:instance-profile\/.+$/);

      const instanceProfileName = outputs.InstanceProfileArn.split('/').pop();
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName
      });

      const response = await iamClient.send(command);
      const instanceProfile = response.InstanceProfile;

      expect(instanceProfile).toBeDefined();
      expect(instanceProfile?.Roles).toHaveLength(1);
      expect(instanceProfile?.Roles?.[0]?.RoleName).toContain('myapp-ec2role');
    }, 30000);

    test('should have IAM role with S3 read-only permissions only', async () => {
      const instanceProfileName = outputs.InstanceProfileArn.split('/').pop();
      const instanceProfileResponse = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName })
      );
      
      const roleName = instanceProfileResponse.InstanceProfile?.Roles?.[0]?.RoleName;
      expect(roleName).toBeDefined();

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName! })
      );
      
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain('ec2.amazonaws.com');

      // Check attached policies
      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );

      // Should not have any AWS managed policies attached
      expect(policiesResponse.AttachedPolicies || []).toHaveLength(0);
    }, 30000);
  });

  describe('Infrastructure Integration Validation', () => {
    test('should have EC2 instance associated with correct security group', async () => {
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.InstanceId]
      });

      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];

      const instanceSecurityGroups = instance?.SecurityGroups || [];
      const hasCorrectSecurityGroup = instanceSecurityGroups.some(
        sg => sg.GroupId === outputs.SecurityGroupId
      );
      
      expect(hasCorrectSecurityGroup).toBe(true);
    }, 30000);

    test('should have EC2 instance with correct IAM instance profile', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.InstanceId]
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      expect(instance?.IamInstanceProfile?.Arn).toBeDefined();
    }, 30000);

    test('should validate complete infrastructure deployment consistency', async () => {
      // This test validates that all infrastructure components work together
      expect(outputs.InstanceId).toBeDefined();
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.InstanceProfileArn).toBeDefined();

      // Validate that all resources are in the same VPC
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.InstanceId]
      });
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });

      const [instanceResponse, sgResponse] = await Promise.all([
        ec2Client.send(instanceCommand),
        ec2Client.send(sgCommand)
      ]);

      const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];
      const securityGroup = sgResponse.SecurityGroups?.[0];

      expect(instance?.VpcId).toBe(securityGroup?.VpcId);
    }, 30000);
  });
});
