import fs from 'fs';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';

// Load deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-southeast-1';

describe('EKS Infrastructure Integration Tests', () => {
  // AWS SDK Clients
  const eksClient = new EKSClient({ region });
  const ec2Client = new EC2Client({ region });
  const cwLogsClient = new CloudWatchLogsClient({ region });
  const kmsClient = new KMSClient({ region });

  describe('VPC Infrastructure', () => {
    test('VPC should exist and be properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];

      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('VPC should have name tag with environment suffix', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];

      const nameTag = vpc.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);
    });

    test('subnets should exist and be in different availability zones', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);

      // Check that subnets are in multiple AZs
      const azs = new Set(response.Subnets!.map((subnet) => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('public subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
      });

      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map((subnet) => subnet.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
    });

    test('private subnets should have correct CIDR blocks', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });

      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map((subnet) => subnet.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.10.0/24');
      expect(cidrBlocks).toContain('10.0.11.0/24');
    });

    test('public subnets should have kubernetes elb tag', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id],
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        const elbTag = subnet.Tags?.find((tag) => tag.Key === 'kubernetes.io/role/elb');
        expect(elbTag).toBeDefined();
        expect(elbTag!.Value).toBe('1');
      });
    });

    test('private subnets should have kubernetes internal-elb tag', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id],
      });

      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet) => {
        const elbTag = subnet.Tags?.find(
          (tag) => tag.Key === 'kubernetes.io/role/internal-elb'
        );
        expect(elbTag).toBeDefined();
        expect(elbTag!.Value).toBe('1');
      });
    });
  });

  describe('EKS Cluster', () => {
    test('EKS cluster should exist and be active', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster).toBeDefined();
      expect(response.cluster!.name).toBe(outputs.ClusterName);
      expect(response.cluster!.status).toBe('ACTIVE');
      expect(response.cluster!.arn).toBe(outputs.ClusterArn);
    });

    test('cluster name should include environment suffix', () => {
      expect(outputs.ClusterName).toContain(environmentSuffix);
    });

    test('cluster should have correct endpoint', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster!.endpoint).toBe(outputs.ClusterEndpoint);
      expect(outputs.ClusterEndpoint).toMatch(/^https:\/\//);
    });

    test('cluster should have encryption enabled', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster!.encryptionConfig).toBeDefined();
      expect(response.cluster!.encryptionConfig!.length).toBeGreaterThan(0);
      expect(response.cluster!.encryptionConfig![0].resources).toContain('secrets');
    });

    test('cluster should have logging enabled', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      expect(response.cluster!.logging).toBeDefined();
      expect(response.cluster!.logging!.clusterLogging).toBeDefined();

      const enabledTypes = response.cluster!.logging!.clusterLogging!.filter(
        (log) => log.enabled
      );
      expect(enabledTypes.length).toBeGreaterThan(0);

      const logTypes = enabledTypes.flatMap((log) => log.types || []);
      expect(logTypes).toContain('api');
      expect(logTypes).toContain('audit');
    });

    test('cluster should have both public and private endpoint access', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig!.endpointPublicAccess).toBe(true);
      expect(vpcConfig!.endpointPrivateAccess).toBe(true);
    });

    test('cluster should be in correct VPC and subnets', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig!.vpcId).toBe(outputs.VPCId);
      expect(vpcConfig!.subnetIds).toContain(outputs.PublicSubnet1Id);
      expect(vpcConfig!.subnetIds).toContain(outputs.PublicSubnet2Id);
      expect(vpcConfig!.subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(vpcConfig!.subnetIds).toContain(outputs.PrivateSubnet2Id);
    });

    test('cluster should have security group attached', async () => {
      const command = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const response = await eksClient.send(command);

      const vpcConfig = response.cluster!.resourcesVpcConfig;
      expect(vpcConfig!.securityGroupIds).toBeDefined();
      expect(vpcConfig!.securityGroupIds!.length).toBeGreaterThan(0);
    });
  });

  describe('EKS Node Group', () => {
    test('node group should exist and be active', async () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      expect(response.nodegroup).toBeDefined();
      expect(response.nodegroup!.status).toBe('ACTIVE');
      expect(response.nodegroup!.nodegroupName).toContain(environmentSuffix);
    });

    test('node group should be in private subnets', async () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      const subnets = response.nodegroup!.subnets!;
      expect(subnets).toContain(outputs.PrivateSubnet1Id);
      expect(subnets).toContain(outputs.PrivateSubnet2Id);
      expect(subnets).not.toContain(outputs.PublicSubnet1Id);
      expect(subnets).not.toContain(outputs.PublicSubnet2Id);
    });

    test('node group should have auto-scaling configuration', async () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      const scalingConfig = response.nodegroup!.scalingConfig;
      expect(scalingConfig).toBeDefined();
      expect(scalingConfig!.minSize).toBeGreaterThan(0);
      expect(scalingConfig!.maxSize).toBeGreaterThanOrEqual(scalingConfig!.minSize!);
      expect(scalingConfig!.desiredSize).toBeGreaterThanOrEqual(scalingConfig!.minSize!);
      expect(scalingConfig!.desiredSize).toBeLessThanOrEqual(scalingConfig!.maxSize!);
    });

    test('node group should use AL2 AMI type', async () => {
      const [clusterName, nodegroupName] = outputs.NodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName,
        nodegroupName,
      });

      const response = await eksClient.send(command);

      expect(response.nodegroup!.amiType).toBe('AL2_x86_64');
    });
  });

  describe('Security Group', () => {
    test('cluster security group should exist', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.GroupId).toBe(outputs.ClusterSecurityGroupId);
    });

    test('security group should be in correct VPC', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      const securityGroup = response.SecurityGroups![0];
      expect(securityGroup.VpcId).toBe(outputs.VPCId);
    });

    test('security group should have name with environment suffix', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      const securityGroup = response.SecurityGroups![0];
      const nameTag = securityGroup.Tags?.find((tag) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain(environmentSuffix);
    });

    test('security group should allow all outbound traffic', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ClusterSecurityGroupId],
      });

      const response = await ec2Client.send(command);

      const securityGroup = response.SecurityGroups![0];
      const egressRules = securityGroup.IpPermissionsEgress;

      expect(egressRules).toBeDefined();
      expect(egressRules!.length).toBeGreaterThan(0);

      // Check for allow all outbound rule
      const allowAllRule = egressRules!.find(
        (rule) => rule.IpProtocol === '-1' && rule.IpRanges?.some((range) => range.CidrIp === '0.0.0.0/0')
      );
      expect(allowAllRule).toBeDefined();
    });
  });

  describe('CloudWatch Logging', () => {
    test('log group should exist', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ClusterLogGroupName,
      });

      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.ClusterLogGroupName
      );
      expect(logGroup).toBeDefined();
    });

    test('log group name should include environment suffix', () => {
      expect(outputs.ClusterLogGroupName).toContain(environmentSuffix);
    });

    test('log group should have retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.ClusterLogGroupName,
      });

      const response = await cwLogsClient.send(command);

      const logGroup = response.logGroups!.find(
        (lg) => lg.logGroupName === outputs.ClusterLogGroupName
      );

      expect(logGroup!.retentionInDays).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(7);
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(outputs.KMSKeyId);
      expect(response.KeyMetadata!.Enabled).toBe(true);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });

    test('KMS key should be used for EKS encryption', async () => {
      const clusterCommand = new DescribeClusterCommand({
        name: outputs.ClusterName,
      });

      const clusterResponse = await eksClient.send(clusterCommand);

      const encryptionConfig = clusterResponse.cluster!.encryptionConfig![0];
      expect(encryptionConfig.provider?.keyArn).toContain(outputs.KMSKeyId);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all output values should be non-empty', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBe('');
        expect(typeof value).toBe('string');
      });
    });

    test('cluster name should follow naming convention', () => {
      expect(outputs.ClusterName).toMatch(/^eks-cluster-/);
      expect(outputs.ClusterName).toContain(environmentSuffix);
    });

    test('log group name should follow naming convention', () => {
      expect(outputs.ClusterLogGroupName).toMatch(/^\/aws\/eks\//);
      expect(outputs.ClusterLogGroupName).toContain(environmentSuffix);
    });
  });

  describe('Multi-AZ High Availability', () => {
    test('resources should be deployed across multiple availability zones', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);

      const azs = new Set(response.Subnets!.map((subnet) => subnet.AvailabilityZone));

      // Verify we have at least 2 different AZs for high availability
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify each AZ has both public and private subnets
      const azSubnets = new Map<string, string[]>();
      response.Subnets!.forEach((subnet) => {
        const az = subnet.AvailabilityZone!;
        if (!azSubnets.has(az)) {
          azSubnets.set(az, []);
        }
        azSubnets.get(az)!.push(subnet.SubnetId!);
      });

      // Each AZ should have multiple subnets
      azSubnets.forEach((subnets, az) => {
        expect(subnets.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
