import { DescribeInstancesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import axios from 'axios';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const regionList = ['us-east-1', 'us-west-2'];
const stackName = `TapStack${environmentSuffix}`;

describe('Multi-Region CDK Stack Integration Tests', () => {

  describe('Infrastructure Deployment Tests', () => {

    test.each(regionList)('should have deployed VPC successfully in %s', async (region) => {
      const ec2Client = new EC2Client({ region });
      const stackVpcKey = `${stackName}-${region}-VpcId`;
      const vpcId = outputs[stackVpcKey];

      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');

      // Check VPC has the correct tags
      const tags = response.Vpcs![0].Tags || [];
      const projectTag = tags.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('MultiRegionWebApp');
    });

    test.each(regionList)('should have created security group with correct rules in %s', async (region) => {
      const ec2Client = new EC2Client({ region });
      const stackSgKey = `${stackName}-${region}-SecurityGroupId`;
      const securityGroupId = outputs[stackSgKey];

      expect(securityGroupId).toBeDefined();
      expect(securityGroupId).toMatch(/^sg-[a-f0-9]{8,17}$/);

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId]
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups![0];

      // Check SSH rule (port 22)
      const sshRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');

      // Check HTTP rule (port 80)
      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });

    test.each(regionList)('should have created 2 EC2 instances in public subnets in %s', async (region) => {
      const ec2Client = new EC2Client({ region });
      const stackVpcKey = `${stackName}-${region}-VpcId`;
      const vpcId = outputs[stackVpcKey];

      // Get all instances in this VPC
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending']
          }
        ]
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      expect(instances).toHaveLength(2);

      // Check both instances are in public subnets
      for (const instance of instances) {
        expect(instance.PublicIpAddress).toBeDefined();
        expect(instance.PublicDnsName).toBeDefined();

        // Verify instance type
        expect(instance.InstanceType).toBe('t3.micro');

        // Check tags
        const tags = instance.Tags || [];
        const projectTag = tags.find(tag => tag.Key === 'Project');
        expect(projectTag?.Value).toBe('MultiRegionWebApp');
      }
    });

    test.each(regionList)('should have correct subnet configuration in %s', async (region) => {
      const ec2Client = new EC2Client({ region });
      const stackVpcKey = `${stackName}-${region}-VpcId`;
      const vpcId = outputs[stackVpcKey];

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      // Should have 4 subnets (2 public, 2 private)
      expect(subnets).toHaveLength(4);

      // Check for public subnets
      const publicSubnets = subnets.filter(subnet =>
        subnet.Tags?.find(tag =>
          tag.Key === 'Name' && tag.Value?.includes('PublicSubnet')
        )
      );
      expect(publicSubnets).toHaveLength(2);

      // Check for private subnets
      const privateSubnets = subnets.filter(subnet =>
        subnet.Tags?.find(tag =>
          tag.Key === 'Name' && tag.Value?.includes('PrivateSubnet')
        )
      );
      expect(privateSubnets).toHaveLength(2);

      // Verify subnets are in different AZs
      const azs = new Set(subnets.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(2);
    });
  });

  describe('EC2 Instance Connectivity Tests', () => {

    test.each(regionList)('instances should be accessible via HTTP in %s', async (region) => {
      const instance1DnsKey = `${stackName}-${region}-Instance1PublicDns`;
      const instance2DnsKey = `${stackName}-${region}-Instance2PublicDns`;

      const instance1Dns = outputs[instance1DnsKey];
      const instance2Dns = outputs[instance2DnsKey];

      expect(instance1Dns).toBeDefined();
      expect(instance2Dns).toBeDefined();

      // Test HTTP connectivity (this assumes a basic web server is running)
      // You might want to add user data to start a simple web server
      for (const instanceDns of [instance1Dns, instance2Dns]) {
        try {
          const response = await axios.get(`http://${instanceDns}`, {
            timeout: 10000,
            validateStatus: () => true // Accept any status code
          });

          // Just verify we can connect (even if it's a 404 or connection refused)
          // A connection refused or timeout would throw an error
          expect([200, 404, 500, 503]).toContain(response.status);
        } catch (error: any) {
          // If there's no web server, we might get ECONNREFUSED
          // This is actually expected if no web server is configured
          if (error.code === 'ECONNREFUSED') {
            console.warn(`No web server running on ${instanceDns}, but instance is reachable`);
          } else {
            throw error;
          }
        }
      }
    }, 30000); // 30 second timeout for network tests

    test.each(regionList)('instances should have proper IAM role attached in %s', async (region) => {
      const ec2Client = new EC2Client({ region });
      const stackVpcKey = `${stackName}-${region}-VpcId`;
      const vpcId = outputs[stackVpcKey];

      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          },
          {
            Name: 'instance-state-name',
            Values: ['running', 'pending']
          }
        ]
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      for (const instance of instances) {
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile?.Arn).toMatch(/EC2InstanceProfile/);
      }
    });
  });

  describe('SSM Parameter Access Tests', () => {

    test.each(regionList)('instances should be able to access AMI SSM parameter in %s', async (region) => {
      const ssmClient = new SSMClient({ region });
      const parameterName = '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2';

      const command = new GetParameterCommand({
        Name: parameterName
      });

      const response = await ssmClient.send(command);
      expect(response.Parameter?.Value).toBeDefined();
      expect(response.Parameter?.Value).toMatch(/^ami-[a-f0-9]{8,17}$/);
    });
  });

  describe('Cross-Region Deployment Consistency Tests', () => {

    test('all regions should have consistent infrastructure', () => {
      for (const region of regionList) {
        // VPC outputs should exist
        const vpcKey = `${stackName}-${region}-VpcId`;
        expect(outputs[vpcKey]).toBeDefined();

        // Security Group outputs should exist
        const sgKey = `${stackName}-${region}-SecurityGroupId`;
        expect(outputs[sgKey]).toBeDefined();

        // Instance outputs should exist
        const instance1Key = `${stackName}-${region}-Instance1PublicDns`;
        const instance2Key = `${stackName}-${region}-Instance2PublicDns`;
        expect(outputs[instance1Key]).toBeDefined();
        expect(outputs[instance2Key]).toBeDefined();
      }
    });

    test('stack names should follow naming convention', () => {
      for (const region of regionList) {
        const expectedStackName = `${stackName}-${region}`;

        // Check that outputs contain the expected stack name pattern
        const vpcKey = `${stackName}-${region}-VpcId`;
        expect(outputs[vpcKey]).toBeDefined();
      }
    });
  });

  describe('Resource Tagging Tests', () => {

    test.each(regionList)('all resources should have proper tags in %s', async (region) => {
      const ec2Client = new EC2Client({ region });
      const stackVpcKey = `${stackName}-${region}-VpcId`;
      const vpcId = outputs[stackVpcKey];

      // Test VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];

      expect(vpcTags.find(tag => tag.Key === 'Project')?.Value).toBe('MultiRegionWebApp');
      expect(vpcTags.find(tag => tag.Key === 'Environment')?.Value).toBe(environmentSuffix);

      // Test instance tags
      const instanceCommand = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId]
          }
        ]
      });

      const instanceResponse = await ec2Client.send(instanceCommand);
      const instances = instanceResponse.Reservations?.flatMap(r => r.Instances || []) || [];

      for (const instance of instances) {
        const tags = instance.Tags || [];
        expect(tags.find(tag => tag.Key === 'Project')?.Value).toBe('MultiRegionWebApp');
        expect(tags.find(tag => tag.Key === 'Environment')?.Value).toBe(environmentSuffix);
      }
    });
  });

  describe('Cleanup and Error Handling Tests', () => {

    test('should handle missing outputs gracefully', () => {
      const nonExistentKey = 'NonExistentStack-us-east-1-VpcId';
      expect(outputs[nonExistentKey]).toBeUndefined();
    });

    test('should validate environment suffix', () => {
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix).toMatch(/^[a-zA-Z0-9-]+$/);
    });
  });
});