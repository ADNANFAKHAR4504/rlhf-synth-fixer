import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';

// Read outputs from deployment
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// AWS Clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('CloudFormation Stack Integration Tests', () => {
  
  describe('VPC Resources', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId]
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
    });
  });

  describe('Subnet Resources', () => {
    test('Public subnets should exist and be configured correctly', async () => {
      const subnetIds = outputs.PublicSubnetIds.split(',');
      expect(subnetIds).toHaveLength(2);

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(0);
      });

      // Check they're in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('Private subnets should exist and be configured correctly', async () => {
      const subnetIds = outputs.PrivateSubnetIds.split(',');
      expect(subnetIds).toHaveLength(2);

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.MapPublicIpOnLaunch).toBeFalsy();
        expect(subnet.AvailableIpAddressCount).toBeGreaterThan(0);
      });

      // Check they're in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });
  });

  describe('Route Tables', () => {
    test('Public subnets should have route to Internet Gateway', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: publicSubnetIds
          }
        ]
      });
      const response = await ec2Client.send(command);
      
      expect(response.RouteTables!.length).toBeGreaterThan(0);
      
      response.RouteTables!.forEach(routeTable => {
        const hasInternetRoute = routeTable.Routes!.some(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && 
          route.GatewayId?.startsWith('igw-')
        );
        expect(hasInternetRoute).toBe(true);
      });
    });
  });

  describe('Security Groups', () => {
    test('Web server security group should exist with correct rules', async () => {
      const sgId = outputs.WebServerSecurityGroupId;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-[a-f0-9]+$/);

      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      expect(sg.VpcId).toBe(outputs.VPCId);
      expect(sg.GroupName).toContain('web-sg');
      
      // Check ingress rules
      const ingressRules = sg.IpPermissions || [];
      
      // HTTPS rule
      const httpsRule = ingressRules.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpProtocol).toBe('tcp');
      expect(httpsRule!.IpRanges?.length).toBeGreaterThan(0);
      expect(httpsRule!.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      
      // HTTP rule
      const httpRule = ingressRules.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpProtocol).toBe('tcp');
      expect(httpRule!.IpRanges?.length).toBeGreaterThan(0);
      expect(httpRule!.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('S3 Buckets', () => {
    test('Logging bucket should exist and be accessible', async () => {
      const bucketName = outputs.LoggingBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('logs');

      const command = new HeadBucketCommand({ Bucket: bucketName });
      
      // This will throw if bucket doesn't exist or we don't have access
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('Logging bucket should have encryption enabled', async () => {
      const bucketName = outputs.LoggingBucketName;
      
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault).toBeDefined();
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });

    test('Logging bucket should block public access', async () => {
      const bucketName = outputs.LoggingBucketName;
      
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Network Connectivity', () => {
    test('All subnets should belong to the same VPC', async () => {
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      
      const command = new DescribeSubnetsCommand({ SubnetIds: allSubnetIds });
      const response = await ec2Client.send(command);
      
      const vpcIds = response.Subnets!.map(subnet => subnet.VpcId);
      const uniqueVpcIds = new Set(vpcIds);
      
      expect(uniqueVpcIds.size).toBe(1);
      expect(Array.from(uniqueVpcIds)[0]).toBe(outputs.VPCId);
    });

    test('VPC should have correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have required tags', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      const tags = response.Vpcs![0].Tags || [];
      const tagMap = new Map(tags.map(tag => [tag.Key!, tag.Value!]));
      
      expect(tagMap.has('Environment')).toBe(true);
      expect(tagMap.has('Project')).toBe(true);
      expect(tagMap.has('Owner')).toBe(true);
      expect(tagMap.has('Name')).toBe(true);
    });

    test('Security group should have required tags', async () => {
      const sgId = outputs.WebServerSecurityGroupId;
      
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);
      
      const tags = response.SecurityGroups![0].Tags || [];
      const tagMap = new Map(tags.map(tag => [tag.Key!, tag.Value!]));
      
      expect(tagMap.has('Environment')).toBe(true);
      expect(tagMap.has('Project')).toBe(true);
      expect(tagMap.has('Owner')).toBe(true);
      expect(tagMap.has('Name')).toBe(true);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All expected outputs should be present', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'WebServerSecurityGroupId',
        'LoggingBucketName'
      ];
      
      expectedOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('Output values should have correct format', () => {
      // VPC ID format
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      
      // Security Group ID format
      expect(outputs.WebServerSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      
      // Subnet IDs format
      const publicSubnetIds = outputs.PublicSubnetIds.split(',');
      publicSubnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
      
      const privateSubnetIds = outputs.PrivateSubnetIds.split(',');
      privateSubnetIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });
      
      // S3 bucket name format
      expect(outputs.LoggingBucketName).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
    });
  });
});