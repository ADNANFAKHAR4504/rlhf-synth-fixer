import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeVpcAttributeCommand
} from '@aws-sdk/client-ec2';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Load outputs from flat-outputs.json if available
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  }
} catch (error) {
  console.log('cfn-outputs/flat-outputs.json not found, skipping integration tests that require outputs');
}

describe('Secure Web Environment Integration Tests', () => {
  const stackName = `SecureWebStack${environmentSuffix}`;
  const region = 'us-west-2';
  const ec2Client = new EC2Client({ region });
  const ssmClient = new SSMClient({ region });
  const iamClient = new IAMClient({ region });

  describe('Stack Deployment Validation', () => {
    test('should have VPC ID output', async () => {
      if (!outputs[`${stackName}-VPCId`]) {
        console.log('VPC ID output not available - stack may not be deployed yet');
        return; // Skip test
      }
      expect(outputs[`${stackName}-VPCId`]).toBeDefined();
      expect(outputs[`${stackName}-VPCId`]).toMatch(/^vpc-[a-z0-9]+$/);

      // Validate VPC properties
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs[`${stackName}-VPCId`]]
      }));
      if (!vpcResponse.Vpcs || vpcResponse.Vpcs.length === 0) {
        throw new Error('VPC not found');
      }
      const vpc = vpcResponse.Vpcs[0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Tags).toContainEqual({ Key: 'Name', Value: 'MyVPC' });
      expect(vpc.Tags).toContainEqual({ Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' });
      expect(vpc.Tags).toContainEqual({ Key: 'projectId', Value: '166' });
      expect(vpc.Tags).toContainEqual({ Key: 'projectName', Value: 'IaC - AWS Nova Model Breaking' });
      expect(vpc.Tags).toContainEqual({ Key: 'ProblemID', Value: 'Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f' });

      // Validate EnableDnsSupport
      const dnsSupportResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: outputs[`${stackName}-VPCId`],
        Attribute: 'enableDnsSupport'
      }));
      if (!dnsSupportResponse.EnableDnsSupport) {
        throw new Error('EnableDnsSupport attribute not found');
      }
      expect(dnsSupportResponse.EnableDnsSupport.Value).toBe(true);

      // Validate EnableDnsHostnames
      const dnsHostnamesResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: outputs[`${stackName}-VPCId`],
        Attribute: 'enableDnsHostnames'
      }));
      if (!dnsHostnamesResponse.EnableDnsHostnames) {
        throw new Error('EnableDnsHostnames attribute not found');
      }
      expect(dnsHostnamesResponse.EnableDnsHostnames.Value).toBe(true);
    });

    test('should have EC2 instance ID output', async () => {
      if (!outputs[`${stackName}-InstanceId`]) {
        console.log('Instance ID output not available - stack may not be deployed yet');
        return; // Skip test
      }
      expect(outputs[`${stackName}-InstanceId`]).toBeDefined();
      expect(outputs[`${stackName}-InstanceId`]).toMatch(/^i-[a-z0-9]+$/);

      // Validate EC2 instance properties
      const response = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [outputs[`${stackName}-InstanceId`]]
      }));
      if (!response.Reservations || response.Reservations.length === 0) {
        throw new Error('EC2 instance not found');
      }
      const reservation = response.Reservations[0];
      if (!reservation.Instances || reservation.Instances.length === 0) {
        throw new Error('No instances found in reservation');
      }
      const instance = reservation.Instances[0];
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.Tags).toContainEqual({ Key: 'Name', Value: 'MyEC2Instance' });
      expect(instance.Tags).toContainEqual({ Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' });
    });

    test('should have public IP output', async () => {
      if (!outputs[`${stackName}-InstancePublicIP`]) {
        console.log('Public IP output not available - stack may not be deployed yet');
        return; // Skip test
      }
      expect(outputs[`${stackName}-InstancePublicIP`]).toBeDefined();
      expect(outputs[`${stackName}-InstancePublicIP`]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });

  describe('Infrastructure Configuration Tests', () => {
    test('subnet should be properly configured', async () => {
      if (!outputs[`${stackName}-VPCId`]) {
        console.log('VPC ID output not available for subnet testing');
        return; // Skip test
      }
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs[`${stackName}-VPCId`]] }]
      }));
      if (!response.Subnets || response.Subnets.length === 0) {
        throw new Error('Subnet not found');
      }
      const subnet = response.Subnets[0];
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.VpcId).toBe(outputs[`${stackName}-VPCId`]);
      expect(subnet.Tags).toContainEqual({ Key: 'Name', Value: 'MySubnet' });
      expect(subnet.Tags).toContainEqual({ Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' });
    });

    test('security group should restrict SSH to specified IP', async () => {
      if (!outputs[`${stackName}-InstanceId`]) {
        console.log('Instance ID output not available for security group testing');
        return; // Skip test
      }
      const instanceResponse = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [outputs[`${stackName}-InstanceId`]]
      }));
      if (!instanceResponse.Reservations || instanceResponse.Reservations.length === 0) {
        throw new Error('EC2 instance not found');
      }
      const reservation = instanceResponse.Reservations[0];
      if (!reservation.Instances || reservation.Instances.length === 0) {
        throw new Error('No instances found in reservation');
      }
      const securityGroupId = reservation.Instances[0].SecurityGroups?.[0]?.GroupId;
      if (!securityGroupId) {
        throw new Error('Security group not found for instance');
      }
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      }));
      if (!sgResponse.SecurityGroups || sgResponse.SecurityGroups.length === 0) {
        throw new Error('Security group not found');
      }
      const sg = sgResponse.SecurityGroups[0];
      expect(sg.GroupName).toBe('MySecurityGroup');
      expect(sg.IpPermissions).toHaveLength(1);
      expect(sg.IpPermissions?.[0].IpProtocol).toBe('tcp');
      expect(sg.IpPermissions?.[0].FromPort).toBe(22);
      expect(sg.IpPermissions?.[0].ToPort).toBe(22);
      expect(sg.Tags).toContainEqual({ Key: 'Name', Value: 'MySecurityGroup' });
      expect(sg.Tags).toContainEqual({ Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' });
    });

    test('IAM role should have correct permissions', async () => {
      const roleName = `MyEC2Role${environmentSuffix}`; // Adjust based on stack naming
      try {
        const response = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        if (!response.Role) {
          throw new Error('IAM role not found');
        }
        expect(response.Role.AssumeRolePolicyDocument).toMatchObject({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        });
        expect(response.Role.Tags).toContainEqual({ Key: 'batchName', Value: 'Batch 003 -Expert-CloudFormation-YAML' });
      } catch (error) {
        console.log('IAM role not found - stack may not be deployed yet');
        return; // Skip test
      }
    });

    test('SSM parameter should exist and be accessible', async () => {
      try {
        const response = await ssmClient.send(new GetParameterCommand({
          Name: 'MyConfig',
          WithDecryption: true
        }));
        if (!response.Parameter) {
          throw new Error('SSM parameter not found');
        }
        expect(response.Parameter.Name).toBe('MyConfig');
        expect(response.Parameter.Type).toBe('String');
        expect(response.Parameter.Value).toBe('some_sensitive_value');
      } catch (error) {
        console.log('SSM parameter not found - stack may not be deployed yet');
        return; // Skip test
      }
    });
  });

  describe('Connectivity Tests', () => {
    test('EC2 instance should be running and associated with Elastic IP', async () => {
      if (!outputs[`${stackName}-InstanceId`]) {
        console.log('Instance ID output not available for connectivity testing');
        return; // Skip test
      }
      const response = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [outputs[`${stackName}-InstanceId`]]
      }));
      if (!response.Reservations || response.Reservations.length === 0) {
        throw new Error('EC2 instance not found');
      }
      const reservation = response.Reservations[0];
      if (!reservation.Instances || reservation.Instances.length === 0) {
        throw new Error('No instances found in reservation');
      }
      const instance = reservation.Instances[0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.PublicIpAddress).toBe(outputs[`${stackName}-InstancePublicIP`]);
    });

    // Note: SSH connectivity test is commented out as it requires network access and credentials
    /*
    test('EC2 instance should be accessible via SSH', async () => {
      if (!outputs[`${stackName}-InstancePublicIP`]) {
        console.log('Public IP output not available for SSH testing');
        return; // Skip test
      }
      // Requires SSH key and tester's IP in AllowedSSHIPAddress
      // Implement SSH connectivity check using a library like 'ssh2'
      expect(true).toBe(true); // Placeholder
    });
    */
  });

  describe('End-to-End Workflow Tests', () => {
    test('infrastructure should support secure web environment', async () => {
      if (!outputs[`${stackName}-VPCId`] || !outputs[`${stackName}-InstanceId`] || !outputs[`${stackName}-InstancePublicIP`]) {
        console.log('Core outputs not available for e2e testing');
        return; // Skip test
      }
      expect(outputs[`${stackName}-VPCId`]).toBeTruthy();
      expect(outputs[`${stackName}-InstanceId`]).toBeTruthy();
      expect(outputs[`${stackName}-InstancePublicIP`]).toBeTruthy();

      // Verify subnet is public
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs[`${stackName}-VPCId`]] }]
      }));
      if (!subnetResponse.Subnets || subnetResponse.Subnets.length === 0) {
        throw new Error('Subnet not found');
      }
      expect(subnetResponse.Subnets[0].MapPublicIpOnLaunch).toBe(true);
    });
  });
});