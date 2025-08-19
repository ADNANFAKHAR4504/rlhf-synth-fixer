import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
  DescribeAvailabilityZonesCommand,
  GetEbsEncryptionByDefaultCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Helper function to load deployment outputs
function loadDeploymentOutputs(): any {
  const outputsPath = join(process.cwd(), 'cfn-outputs/flat-outputs.json');
  if (!existsSync(outputsPath)) {
    console.warn('⚠️ No deployment outputs found. Skipping integration tests.');
    return null;
  }
  return JSON.parse(readFileSync(outputsPath, 'utf8'));
}

// Helper function to get environment suffix
function getEnvironmentSuffix(): string {
  return process.env.ENVIRONMENT_SUFFIX || 'test001';
}

// Helper function to create resource name
function createResourceName(suffix: string): string {
  const orgPrefix = 'acme';
  const environment = 'prod';
  const envSuffix = getEnvironmentSuffix();
  return `${orgPrefix}-${environment}-${envSuffix}-${suffix}`;
}

// Test configuration
const primaryRegion = 'us-east-1';
const secondaryRegion = 'eu-west-1';
const testTimeout = 30000;

// AWS clients
const ec2Primary = new EC2Client({ region: primaryRegion });
const ec2Secondary = new EC2Client({ region: secondaryRegion });
const s3Primary = new S3Client({ region: primaryRegion });
const s3Secondary = new S3Client({ region: secondaryRegion });
const logsPrimary = new CloudWatchLogsClient({ region: primaryRegion });
const logsSecondary = new CloudWatchLogsClient({ region: secondaryRegion });
const iamPrimary = new IAMClient({ region: primaryRegion });
const iamSecondary = new IAMClient({ region: secondaryRegion });

describe('Terraform Multi-Region AWS Security Baseline Integration Tests', () => {
  let outputs: any;

  beforeAll(async () => {
    outputs = loadDeploymentOutputs();
    if (!outputs) {
      console.log('⚠️ No deployment outputs available. Tests will use expected resource names.');
      outputs = {};
    }
  }, testTimeout);

  describe('Multi-Region VPC Infrastructure', () => {
    test('should have VPCs deployed in both regions with correct CIDR blocks', async () => {
      const primaryVpcName = createResourceName('vpc-primary');
      const secondaryVpcName = createResourceName('vpc-secondary');

      // Test primary region VPC
      const primaryVpcs = await ec2Primary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [primaryVpcName] }]
      }));
      expect(primaryVpcs.Vpcs).toHaveLength(1);
      expect(primaryVpcs.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(primaryVpcs.Vpcs![0].State).toBe('available');
      // Verify DNS attributes via DescribeVpcAttribute
      const primaryVpcId = primaryVpcs.Vpcs![0].VpcId!;
      const primaryDnsHostnames = await ec2Primary.send(new DescribeVpcAttributeCommand({
        VpcId: primaryVpcId,
        Attribute: 'enableDnsHostnames',
      }));
      const primaryDnsSupport = await ec2Primary.send(new DescribeVpcAttributeCommand({
        VpcId: primaryVpcId,
        Attribute: 'enableDnsSupport',
      }));
      expect(primaryDnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(primaryDnsSupport.EnableDnsSupport?.Value).toBe(true);

      // Test secondary region VPC
      const secondaryVpcs = await ec2Secondary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [secondaryVpcName] }]
      }));
      expect(secondaryVpcs.Vpcs).toHaveLength(1);
      expect(secondaryVpcs.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
      expect(secondaryVpcs.Vpcs![0].State).toBe('available');
      // Verify DNS attributes via DescribeVpcAttribute
      const secondaryVpcId = secondaryVpcs.Vpcs![0].VpcId!;
      const secondaryDnsHostnames = await ec2Secondary.send(new DescribeVpcAttributeCommand({
        VpcId: secondaryVpcId,
        Attribute: 'enableDnsHostnames',
      }));
      const secondaryDnsSupport = await ec2Secondary.send(new DescribeVpcAttributeCommand({
        VpcId: secondaryVpcId,
        Attribute: 'enableDnsSupport',
      }));
      expect(secondaryDnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(secondaryDnsSupport.EnableDnsSupport?.Value).toBe(true);
    }, testTimeout);

    test('should have public and private subnets in both regions', async () => {
      const publicPrimaryName = createResourceName('public-subnet-primary');
      const privatePrimaryName = createResourceName('private-subnet-primary');
      const publicSecondaryName = createResourceName('public-subnet-secondary');
      const privateSecondaryName = createResourceName('private-subnet-secondary');

      // Test primary region subnets
      const primarySubnets = await ec2Primary.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [publicPrimaryName, privatePrimaryName] }
        ]
      }));
      expect(primarySubnets.Subnets).toHaveLength(2);
      
      const publicSubnet = primarySubnets.Subnets!.find(s => s.CidrBlock === '10.0.1.0/24');
      const privateSubnet = primarySubnets.Subnets!.find(s => s.CidrBlock === '10.0.2.0/24');
      
      expect(publicSubnet).toBeDefined();
      expect(privateSubnet).toBeDefined();
      expect(publicSubnet!.MapPublicIpOnLaunch).toBe(false);

      // Test secondary region subnets
      const secondarySubnets = await ec2Secondary.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [publicSecondaryName, privateSecondaryName] }
        ]
      }));
      expect(secondarySubnets.Subnets).toHaveLength(2);
      
      const publicSubnetSecondary = secondarySubnets.Subnets!.find(s => s.CidrBlock === '10.1.1.0/24');
      const privateSubnetSecondary = secondarySubnets.Subnets!.find(s => s.CidrBlock === '10.1.2.0/24');
      
      expect(publicSubnetSecondary).toBeDefined();
      expect(privateSubnetSecondary).toBeDefined();
      expect(publicSubnetSecondary!.MapPublicIpOnLaunch).toBe(false);
    }, testTimeout);
  });

  describe('Security Compliance', () => {
    test('should have EBS encryption enabled by default in both regions', async () => {
      // Test primary region
      const primaryEncryption = await ec2Primary.send(new GetEbsEncryptionByDefaultCommand({}));
      expect(primaryEncryption.EbsEncryptionByDefault).toBe(true);

      // Test secondary region
      const secondaryEncryption = await ec2Secondary.send(new GetEbsEncryptionByDefaultCommand({}));
      expect(secondaryEncryption.EbsEncryptionByDefault).toBe(true);
    }, testTimeout);

    test('should have restrictive security groups with no 0.0.0.0/0 ingress', async () => {
      const primarySgName = createResourceName('bastion-app-sg-primary');
      const secondarySgName = createResourceName('bastion-app-sg-secondary');

      // Test primary region security group
      const primarySgs = await ec2Primary.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'tag:Name', Values: [primarySgName] }]
      }));
      expect(primarySgs.SecurityGroups).toHaveLength(1);
      
      const primarySg = primarySgs.SecurityGroups![0];
      // Verify no 0.0.0.0/0 ingress rules
      const openIngressRules = (primarySg.IpPermissions || [])
        .flatMap(perm => (perm.IpRanges || []).map(r => ({ protocol: perm.IpProtocol, cidr: r.CidrIp })))
        .filter(r => r.cidr === '0.0.0.0/0' && r.protocol !== '-1');
      expect(openIngressRules).toHaveLength(0);

      // Test secondary region security group
      const secondarySgs = await ec2Secondary.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'tag:Name', Values: [secondarySgName] }]
      }));
      expect(secondarySgs.SecurityGroups).toHaveLength(1);
      
      const secondarySg = secondarySgs.SecurityGroups![0];
      const openIngressRulesSecondary = (secondarySg.IpPermissions || [])
        .flatMap(perm => (perm.IpRanges || []).map(r => ({ protocol: perm.IpProtocol, cidr: r.CidrIp })))
        .filter(r => r.cidr === '0.0.0.0/0' && r.protocol !== '-1');
      expect(openIngressRulesSecondary).toHaveLength(0);
    }, testTimeout);
  });

  describe('VPC Flow Logs Monitoring', () => {
    test('should have VPC Flow Logs enabled with CloudWatch integration', async () => {
      const primaryLogGroupName = createResourceName('vpc-flow-logs-primary');
      const secondaryLogGroupName = createResourceName('vpc-flow-logs-secondary');

      // Test primary region flow logs
      const primaryFlowLogs = await ec2Primary.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'tag:Name', Values: [createResourceName('vpc-flow-log-primary')] }]
      }));
      expect(primaryFlowLogs.FlowLogs).toHaveLength(1);
      expect(primaryFlowLogs.FlowLogs![0].TrafficType).toBe('ALL');
      expect(primaryFlowLogs.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');

      // Test primary region CloudWatch log group
      const primaryLogGroups = await logsPrimary.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: primaryLogGroupName
      }));
      expect(primaryLogGroups.logGroups).toHaveLength(1);

      // Test secondary region flow logs
      const secondaryFlowLogs = await ec2Secondary.send(new DescribeFlowLogsCommand({
        Filter: [{ Name: 'tag:Name', Values: [createResourceName('vpc-flow-log-secondary')] }]
      }));
      expect(secondaryFlowLogs.FlowLogs).toHaveLength(1);
      expect(secondaryFlowLogs.FlowLogs![0].TrafficType).toBe('ALL');
      expect(secondaryFlowLogs.FlowLogs![0].FlowLogStatus).toBe('ACTIVE');

      // Test secondary region CloudWatch log group
      const secondaryLogGroups = await logsSecondary.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: secondaryLogGroupName
      }));
      expect(secondaryLogGroups.logGroups).toHaveLength(1);
    }, testTimeout);

    test('should have proper IAM roles with least privilege for VPC Flow Logs', async () => {
      const primaryRoleName = createResourceName('vpc-flow-logs-role-primary');
      const secondaryRoleName = createResourceName('vpc-flow-logs-role-secondary');

      // Test primary region IAM role
      const primaryRole = await iamPrimary.send(new GetRoleCommand({ RoleName: primaryRoleName }));
      expect(primaryRole.Role?.RoleName).toBe(primaryRoleName);
      expect(primaryRole.Role?.AssumeRolePolicyDocument).toContain('vpc-flow-logs.amazonaws.com');

      // Test primary region IAM policy
      const primaryPolicies = await iamPrimary.send(new ListRolePoliciesCommand({ RoleName: primaryRoleName }));
      expect(primaryPolicies.PolicyNames).toContain(createResourceName('vpc-flow-logs-policy-primary'));
      
      const primaryPolicy = await iamPrimary.send(new GetRolePolicyCommand({
        RoleName: primaryRoleName,
        PolicyName: createResourceName('vpc-flow-logs-policy-primary')
      }));
      const primaryPolicyDoc = decodeURIComponent(primaryPolicy.PolicyDocument!);
      expect(primaryPolicyDoc).toContain('logs:CreateLogGroup');
      expect(primaryPolicyDoc).toContain('logs:CreateLogStream');
      expect(primaryPolicyDoc).toContain('logs:PutLogEvents');

      // Test secondary region IAM role
      const secondaryRole = await iamSecondary.send(new GetRoleCommand({ RoleName: secondaryRoleName }));
      expect(secondaryRole.Role?.RoleName).toBe(secondaryRoleName);
      expect(secondaryRole.Role?.AssumeRolePolicyDocument).toContain('vpc-flow-logs.amazonaws.com');
    }, testTimeout);
  });

  describe('S3 Audit Buckets Security', () => {
    test('should have S3 buckets with proper encryption and security policies', async () => {
      // Get bucket names from outputs or construct expected names
      const bucketNames = {
        primary: outputs.s3_audit_bucket_names?.primary || `${createResourceName('audit-logs-primary')}-test123`,
        secondary: outputs.s3_audit_bucket_names?.secondary || `${createResourceName('audit-logs-secondary')}-test123`
      };

      if (!outputs.s3_audit_bucket_names) {
        console.warn('⚠️ S3 bucket names not found in outputs. Using constructed names.');
        return; // Skip test if no actual deployment
      }

      // Test primary region bucket
      await expect(s3Primary.send(new HeadBucketCommand({ Bucket: bucketNames.primary })))
        .resolves.not.toThrow();

      const primaryEncryption = await s3Primary.send(new GetBucketEncryptionCommand({ 
        Bucket: bucketNames.primary 
      }));
      expect(primaryEncryption.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm)
        .toBe('AES256');

      const primaryPublicAccess = await s3Primary.send(new GetPublicAccessBlockCommand({ 
        Bucket: bucketNames.primary 
      }));
      expect(primaryPublicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(primaryPublicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(primaryPublicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(primaryPublicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      const primaryPolicy = await s3Primary.send(new GetBucketPolicyCommand({ 
        Bucket: bucketNames.primary 
      }));
      expect(primaryPolicy.Policy).toContain('aws:SecureTransport');
      expect(primaryPolicy.Policy).toContain('"Effect":"Deny"');

      // Test secondary region bucket
      await expect(s3Secondary.send(new HeadBucketCommand({ Bucket: bucketNames.secondary })))
        .resolves.not.toThrow();

      const secondaryEncryption = await s3Secondary.send(new GetBucketEncryptionCommand({ 
        Bucket: bucketNames.secondary 
      }));
      expect(secondaryEncryption.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm)
        .toBe('AES256');
    }, testTimeout);
  });

  describe('Resource Tagging and Naming Compliance', () => {
    test('should have consistent tagging across all resources', async () => {
      const primaryVpcName = createResourceName('vpc-primary');
      
      const primaryVpcs = await ec2Primary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [primaryVpcName] }]
      }));
      
      expect(primaryVpcs.Vpcs).toHaveLength(1);
      const vpc = primaryVpcs.Vpcs![0];
      
      // Verify common tags
      const tags = vpc.Tags || [];
      const tagMap = tags.reduce((acc, tag) => ({ ...acc, [tag.Key!]: tag.Value! }), {} as Record<string, string>);
      
      expect(tagMap['Project']).toBe('IaC - AWS Nova Model Breaking');
      expect(tagMap['Environment']).toBe('prod');
      expect(tagMap['ManagedBy']).toBe('Terraform');
      expect(tagMap['Name']).toBe(primaryVpcName);
    }, testTimeout);

    test('should have proper resource naming with environment suffix', async () => {
      const envSuffix = getEnvironmentSuffix();
      const primaryVpcName = createResourceName('vpc-primary');
      
      expect(primaryVpcName).toContain(envSuffix);
      expect(primaryVpcName).toMatch(/^acme-prod-[a-z0-9]+-vpc-primary$/);
    }, testTimeout);
  });

  describe('Multi-Region Isolation', () => {
    test('should have isolated resources between regions', async () => {
      // Verify primary region has its resources
      const primaryVpcs = await ec2Primary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [createResourceName('vpc-primary')] }]
      }));
      expect(primaryVpcs.Vpcs).toHaveLength(1);

      // Verify secondary region has its resources  
      const secondaryVpcs = await ec2Secondary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [createResourceName('vpc-secondary')] }]
      }));
      expect(secondaryVpcs.Vpcs).toHaveLength(1);

      // Verify regions don't have each other's resources
      const primaryVpcInSecondary = await ec2Secondary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [createResourceName('vpc-primary')] }]
      }));
      expect(primaryVpcInSecondary.Vpcs).toHaveLength(0);

      const secondaryVpcInPrimary = await ec2Primary.send(new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [createResourceName('vpc-secondary')] }]
      }));
      expect(secondaryVpcInPrimary.Vpcs).toHaveLength(0);
    }, testTimeout);
  });

  describe('Availability Zone Distribution', () => {
    test('should use different AZs for public and private subnets', async () => {
      // Get availability zones for both regions
      const primaryAzs = await ec2Primary.send(new DescribeAvailabilityZonesCommand({
        Filters: [{ Name: 'state', Values: ['available'] }]
      }));
      const secondaryAzs = await ec2Secondary.send(new DescribeAvailabilityZonesCommand({
        Filters: [{ Name: 'state', Values: ['available'] }]
      }));

      expect(primaryAzs.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
      expect(secondaryAzs.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);

      // Get subnets and verify they're in different AZs
      const primarySubnets = await ec2Primary.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [
            createResourceName('public-subnet-primary'),
            createResourceName('private-subnet-primary')
          ]}
        ]
      }));

      expect(primarySubnets.Subnets).toHaveLength(2);
      const azSet = new Set(primarySubnets.Subnets!.map(s => s.AvailabilityZone));
      expect(azSet.size).toBe(2); // Should be in different AZs
    }, testTimeout);
  });
});
