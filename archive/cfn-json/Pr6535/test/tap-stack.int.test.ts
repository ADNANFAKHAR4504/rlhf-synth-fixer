import fs from 'fs';
import {
  EKSClient,
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  ListClustersCommand,
} from '@aws-sdk/client-eks';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

// Load outputs from deployed stack
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Extract environment suffix from deployed cluster name
const extractEnvironmentSuffix = (clusterName: string): string => {
  // Extract suffix from pattern like "eks-cluster-{suffix}"
  const match = clusterName.match(/eks-cluster-(.+)$/);
  return match ? match[1] : process.env.ENVIRONMENT_SUFFIX || 'dev';
};

const environmentSuffix = extractEnvironmentSuffix(
  JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')).EKSClusterName
);
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const eksClient = new EKSClient({ region });
const ec2Client = new EC2Client({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('EKS Cluster Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.EKSClusterName).toBeDefined();
      expect(outputs.EKSClusterEndpoint).toBeDefined();
      expect(outputs.EKSClusterArn).toBeDefined();
      expect(outputs.EKSClusterSecurityGroupId).toBeDefined();
      expect(outputs.EKSNodeGroupName).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });

    test('cluster name should include environment suffix', () => {
      expect(outputs.EKSClusterName).toContain(environmentSuffix);
    });

    test('cluster endpoint should be a valid HTTPS URL', () => {
      expect(outputs.EKSClusterEndpoint).toMatch(/^https:\/\//);
      expect(outputs.EKSClusterEndpoint).toContain('.eks.amazonaws.com');
    });
  });

  describe('EKS Cluster Validation', () => {
    let clusterDetails: any;

    beforeAll(async () => {
      const command = new DescribeClusterCommand({
        name: outputs.EKSClusterName,
      });
      const response = await eksClient.send(command);
      clusterDetails = response.cluster;
    });

    test('cluster should be in ACTIVE status', () => {
      expect(clusterDetails.status).toBe('ACTIVE');
    });

    test('cluster should have correct name', () => {
      expect(clusterDetails.name).toBe(outputs.EKSClusterName);
    });

    test('cluster should be using Kubernetes 1.28 or later', () => {
      const version = parseFloat(clusterDetails.version);
      expect(version).toBeGreaterThanOrEqual(1.28);
    });

    test('cluster should have encryption enabled', () => {
      expect(clusterDetails.encryptionConfig).toBeDefined();
      expect(clusterDetails.encryptionConfig).toHaveLength(1);
      expect(clusterDetails.encryptionConfig[0].resources).toContain('secrets');
    });

    test('cluster should have all logging enabled', () => {
      const logging = clusterDetails.logging.clusterLogging[0];
      expect(logging.enabled).toBe(true);

      const enabledTypes = logging.types;
      expect(enabledTypes).toContain('api');
      expect(enabledTypes).toContain('audit');
      expect(enabledTypes).toContain('authenticator');
      expect(enabledTypes).toContain('controllerManager');
      expect(enabledTypes).toContain('scheduler');
    });

    test('cluster should have both public and private endpoint access', () => {
      const vpcConfig = clusterDetails.resourcesVpcConfig;
      expect(vpcConfig.endpointPublicAccess).toBe(true);
      expect(vpcConfig.endpointPrivateAccess).toBe(true);
    });

    test('cluster should be deployed in the correct VPC', () => {
      expect(clusterDetails.resourcesVpcConfig.vpcId).toBe(outputs.VPCId);
    });

    test('cluster should use 4 subnets across 2 AZs', () => {
      const subnetIds = clusterDetails.resourcesVpcConfig.subnetIds;
      expect(subnetIds).toHaveLength(4);
      expect(subnetIds).toContain(outputs.PublicSubnet1Id);
      expect(subnetIds).toContain(outputs.PublicSubnet2Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
      expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
    });

    test('cluster endpoint should match output', () => {
      expect(clusterDetails.endpoint).toBe(outputs.EKSClusterEndpoint);
    });

    test('cluster ARN should match output', () => {
      expect(clusterDetails.arn).toBe(outputs.EKSClusterArn);
    });
  });

  describe('EKS Node Group Validation', () => {
    let nodeGroupDetails: any;

    beforeAll(async () => {
      // Parse node group name from output (format: clusterName/nodegroupName)
      const [clusterName, nodegroupName] = outputs.EKSNodeGroupName.split('/');

      const command = new DescribeNodegroupCommand({
        clusterName: clusterName,
        nodegroupName: nodegroupName,
      });
      const response = await eksClient.send(command);
      nodeGroupDetails = response.nodegroup;
    });

    test('node group should be in ACTIVE status', () => {
      expect(nodeGroupDetails.status).toBe('ACTIVE');
    });

    test('node group should have correct name', () => {
      const nodegroupName = outputs.EKSNodeGroupName.split('/')[1];
      expect(nodeGroupDetails.nodegroupName).toBe(nodegroupName);
    });

    test('node group should be in private subnets only', () => {
      const subnets = nodeGroupDetails.subnets;
      expect(subnets).toHaveLength(2);
      expect(subnets).toContain(outputs.PrivateSubnet1Id);
      expect(subnets).toContain(outputs.PrivateSubnet2Id);
    });

    test('node group should have auto-scaling configuration', () => {
      const scaling = nodeGroupDetails.scalingConfig;
      expect(scaling.minSize).toBeGreaterThanOrEqual(1);
      expect(scaling.maxSize).toBeGreaterThanOrEqual(scaling.minSize);
      expect(scaling.desiredSize).toBeGreaterThanOrEqual(scaling.minSize);
      expect(scaling.desiredSize).toBeLessThanOrEqual(scaling.maxSize);
    });

    test('node group should use t3.medium instances', () => {
      expect(nodeGroupDetails.instanceTypes).toContain('t3.medium');
    });

    test('node group should use Amazon Linux 2 AMI', () => {
      expect(nodeGroupDetails.amiType).toBe('AL2_x86_64');
    });

    test('nodes should have correct health status', () => {
      expect(nodeGroupDetails.health.issues).toHaveLength(0);
    });
  });

  describe('VPC Networking Validation', () => {
    let vpcDetails: any;
    let dnsSupportAttr: any;
    let dnsHostnamesAttr: any;

    beforeAll(async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);
      vpcDetails = response.Vpcs[0];

      // Get DNS support attribute
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsSupport',
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      dnsSupportAttr = dnsSupportResponse.EnableDnsSupport;

      // Get DNS hostnames attribute
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsHostnames',
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      dnsHostnamesAttr = dnsHostnamesResponse.EnableDnsHostnames;
    });

    test('VPC should exist and be available', () => {
      expect(vpcDetails.State).toBe('available');
    });

    test('VPC should have correct CIDR block', () => {
      expect(vpcDetails.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(dnsSupportAttr?.Value).toBe(true);
    });

    test('VPC should have DNS hostnames enabled', () => {
      expect(dnsHostnamesAttr?.Value).toBe(true);
    });
  });

  describe('Subnet Validation', () => {
    let subnets: any[];

    beforeAll(async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const response = await ec2Client.send(command);
      subnets = response.Subnets;
    });

    test('all subnets should exist and be available', () => {
      expect(subnets).toHaveLength(4);
      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
    });

    test('subnets should be in the correct VPC', () => {
      subnets.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('subnets should be in different availability zones', () => {
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('public subnets should have correct CIDR blocks', () => {
      const publicSubnet1 = subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id);
      const publicSubnet2 = subnets.find(s => s.SubnetId === outputs.PublicSubnet2Id);

      expect(publicSubnet1.CidrBlock).toBe('10.0.0.0/24');
      expect(publicSubnet2.CidrBlock).toBe('10.0.1.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      const privateSubnet1 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      const privateSubnet2 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet2Id);

      expect(privateSubnet1.CidrBlock).toBe('10.0.10.0/24');
      expect(privateSubnet2.CidrBlock).toBe('10.0.11.0/24');
    });

    test('public subnets should have kubernetes ELB tags', () => {
      const publicSubnet1 = subnets.find(s => s.SubnetId === outputs.PublicSubnet1Id);
      const elbTag = publicSubnet1.Tags.find(t => t.Key === 'kubernetes.io/role/elb');
      expect(elbTag).toBeDefined();
      expect(elbTag.Value).toBe('1');
    });

    test('private subnets should have kubernetes internal ELB tags', () => {
      const privateSubnet1 = subnets.find(s => s.SubnetId === outputs.PrivateSubnet1Id);
      const elbTag = privateSubnet1.Tags.find(t => t.Key === 'kubernetes.io/role/internal-elb');
      expect(elbTag).toBeDefined();
      expect(elbTag.Value).toBe('1');
    });
  });

  describe('NAT Gateway Validation', () => {
    let natGateways: any[];

    beforeAll(async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      natGateways = response.NatGateways;
    });

    test('should have at least one NAT gateway', () => {
      expect(natGateways.length).toBeGreaterThanOrEqual(1);
    });

    test('NAT gateway should be available', () => {
      const availableNats = natGateways.filter(nat => nat.State === 'available');
      expect(availableNats.length).toBeGreaterThanOrEqual(1);
    });

    test('NAT gateway should be in a public subnet', () => {
      const nat = natGateways.find(nat => nat.State === 'available');
      expect([outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]).toContain(nat.SubnetId);
    });

    test('NAT gateway should have an Elastic IP', () => {
      const nat = natGateways.find(nat => nat.State === 'available');
      expect(nat.NatGatewayAddresses).toHaveLength(1);
      expect(nat.NatGatewayAddresses[0].AllocationId).toBeDefined();
    });
  });

  describe('Internet Gateway Validation', () => {
    let internetGateways: any[];

    beforeAll(async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      internetGateways = response.InternetGateways;
    });

    test('should have one internet gateway', () => {
      expect(internetGateways).toHaveLength(1);
    });

    test('internet gateway should be attached to VPC', () => {
      const igw = internetGateways[0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments[0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments[0].State).toBe('available');
    });
  });

  describe('VPC Endpoint Validation', () => {
    let vpcEndpoints: any[];

    beforeAll(async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);
      vpcEndpoints = response.VpcEndpoints;
    });

    test('should have S3 VPC endpoint', () => {
      expect(vpcEndpoints.length).toBeGreaterThanOrEqual(1);
      const s3Endpoint = vpcEndpoints.find(ep => ep.ServiceName.includes('s3'));
      expect(s3Endpoint).toBeDefined();
    });

    test('S3 endpoint should be available', () => {
      const s3Endpoint = vpcEndpoints.find(ep => ep.ServiceName.includes('s3'));
      expect(s3Endpoint.State).toBe('available');
    });

    test('S3 endpoint should be gateway type', () => {
      const s3Endpoint = vpcEndpoints.find(ep => ep.ServiceName.includes('s3'));
      expect(s3Endpoint.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('Security Groups Validation', () => {
    let securityGroups: any[];

    beforeAll(async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.EKSClusterSecurityGroupId],
      });
      const response = await ec2Client.send(command);
      securityGroups = response.SecurityGroups;
    });

    test('cluster security group should exist', () => {
      expect(securityGroups).toHaveLength(1);
    });

    test('cluster security group should be in correct VPC', () => {
      expect(securityGroups[0].VpcId).toBe(outputs.VPCId);
    });

    test('cluster security group name should include environment suffix', () => {
      expect(securityGroups[0].GroupName).toContain(environmentSuffix);
    });
  });

  describe('KMS Key Validation', () => {
    let keyDetails: any;

    beforeAll(async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });
      const response = await kmsClient.send(command);
      keyDetails = response.KeyMetadata;
    });

    test('KMS key should exist', () => {
      expect(keyDetails).toBeDefined();
    });

    test('KMS key should be enabled', () => {
      expect(keyDetails.Enabled).toBe(true);
    });

    test('KMS key should have correct ID', () => {
      expect(keyDetails.KeyId).toBe(outputs.KMSKeyId);
    });

    test('KMS key should be customer managed', () => {
      expect(keyDetails.KeyManager).toBe('CUSTOMER');
    });

    test('KMS key alias should exist and include environment suffix', async () => {
      const command = new ListAliasesCommand({
        KeyId: outputs.KMSKeyId,
      });
      const response = await kmsClient.send(command);

      expect(response.Aliases.length).toBeGreaterThanOrEqual(1);
      const alias = response.Aliases.find(a => a.AliasName.includes(environmentSuffix));
      expect(alias).toBeDefined();
    });
  });

  describe('CloudWatch Logs Validation', () => {
    let logGroups: any[];

    beforeAll(async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/eks/${outputs.EKSClusterName}`,
      });
      const response = await logsClient.send(command);
      logGroups = response.logGroups;
    });

    test('EKS log group should exist', () => {
      expect(logGroups.length).toBeGreaterThanOrEqual(1);
    });

    test('log group name should include cluster name', () => {
      const logGroup = logGroups.find(lg =>
        lg.logGroupName.includes(outputs.EKSClusterName)
      );
      expect(logGroup).toBeDefined();
    });

    test('log group should have retention policy', () => {
      const logGroup = logGroups[0];
      expect(logGroup.retentionInDays).toBe(7);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('complete EKS infrastructure should be functional', async () => {
      // Verify cluster is reachable
      const listClustersCommand = new ListClustersCommand({});
      const clustersResponse = await eksClient.send(listClustersCommand);
      expect(clustersResponse.clusters).toContain(outputs.EKSClusterName);

      // Verify cluster can be described (API is functional)
      const describeClusterCommand = new DescribeClusterCommand({
        name: outputs.EKSClusterName,
      });
      const clusterResponse = await eksClient.send(describeClusterCommand);
      expect(clusterResponse.cluster.status).toBe('ACTIVE');

      // Verify node group can be described
      const [clusterName, nodegroupName] = outputs.EKSNodeGroupName.split('/');
      const describeNodeGroupCommand = new DescribeNodegroupCommand({
        clusterName: clusterName,
        nodegroupName: nodegroupName,
      });
      const nodeGroupResponse = await eksClient.send(describeNodeGroupCommand);
      expect(nodeGroupResponse.nodegroup.status).toBe('ACTIVE');
    });

    test('all infrastructure components should be interconnected correctly', () => {
      // Verify all outputs are from the same stack/environment
      expect(outputs.EKSClusterName).toContain(environmentSuffix);
      expect(outputs.EKSNodeGroupName).toContain(environmentSuffix);

      // Verify IDs are valid AWS resource IDs
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-f0-9]+$/);
      expect(outputs.EKSClusterSecurityGroupId).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]{36}$/);

      // Verify ARN format
      expect(outputs.EKSClusterArn).toMatch(/^arn:aws:eks:/);
    });
  });
});
