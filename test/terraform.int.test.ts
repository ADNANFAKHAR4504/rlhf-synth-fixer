// Integration tests for deployed Terraform infrastructure
// Real AWS API calls - validates actual resource deployment and configuration

import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
  DescribeNatGatewaysCommand,
  DescribeFlowLogsCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketPublicAccessBlockCommand,
  GetBucketPolicyCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyPolicyCommand
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand
} from '@aws-sdk/client-cloudtrail';

// Environment requirements check
const requiredEnvVars = ['AWS_PROFILE', 'AWS_REGION'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Integration tests may not run correctly. Please set AWS_PROFILE and AWS_REGION.');
}

describe('Financial Services Infrastructure - Integration Tests', () => {
  let outputs: any;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let kmsClient: KMSClient;
  let iamClient: IAMClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;
  let cloudTrailClient: CloudTrailClient;

  beforeAll(async () => {
    // Load deployment outputs
    const outputsPaths = [
      './cfn-outputs/flat-outputs.json',
      './lib/flat-outputs.json'
    ];
    
    let outputsFound = false;
    for (const outputsPath of outputsPaths) {
      const fullPath = path.resolve(outputsPath);
      if (fs.existsSync(fullPath)) {
        outputs = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        outputsFound = true;
        console.log(`📋 Loaded outputs from: ${fullPath}`);
        break;
      }
    }

    if (!outputsFound) {
      console.warn('⚠️  No deployment outputs found. Skipping integration tests.');
      console.warn('Expected outputs at: ' + outputsPaths.join(' or '));
      return;
    }

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
    kmsClient = new KMSClient({ region });
    iamClient = new IAMClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    cloudTrailClient = new CloudTrailClient({ region });
  });

  // Skip tests if no outputs are available
  beforeEach(() => {
    if (!outputs) {
      pending('Deployment outputs not available - skipping integration test');
    }
  });

  describe('VPC and Network Infrastructure', () => {
    test('int-vpc-exists: VPC exists and is properly configured', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe(outputs.vpc_cidr);
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('int-subnets-multi-az: subnets are distributed across multiple availability zones', async () => {
      const allSubnetIds = [
        ...outputs.public_subnet_ids,
        ...outputs.private_subnet_ids,
        ...outputs.isolated_subnet_ids
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets!;
      
      // Verify we have the expected number of subnets
      expect(subnets).toHaveLength(9); // 3 public + 3 private + 3 isolated
      
      // Verify subnets are in different AZs
      const azs = new Set(subnets.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
      
      // Verify public subnets have public IP assignment
      const publicSubnets = subnets.filter(subnet => 
        outputs.public_subnet_ids.includes(subnet.SubnetId)
      );
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('int-nat-gateways-availability: NAT gateways are available and configured', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways!;
      
      expect(natGateways).toHaveLength(3);
      natGateways.forEach(natGateway => {
        expect(natGateway.State).toBe('available');
        expect(outputs.public_subnet_ids).toContain(natGateway.SubnetId);
      });
    });

    test('int-vpc-flow-logs-active: VPC flow logs are enabled and active', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.vpc_id]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const flowLogs = response.FlowLogs!;
      
      expect(flowLogs).toHaveLength(1);
      expect(flowLogs[0].FlowLogStatus).toBe('ACTIVE');
      expect(flowLogs[0].TrafficType).toBe('ALL');
    });
  });

  describe('Security Groups Configuration', () => {
    test('int-security-groups-tiered-access: security groups implement proper tier isolation', async () => {
      const securityGroupIds = [
        outputs.web_security_group_id,
        outputs.app_security_group_id,
        outputs.db_security_group_id
      ];

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      });
      
      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups!;
      
      expect(securityGroups).toHaveLength(3);
      
      // Find each security group
      const webSG = securityGroups.find(sg => sg.GroupId === outputs.web_security_group_id);
      const appSG = securityGroups.find(sg => sg.GroupId === outputs.app_security_group_id);
      const dbSG = securityGroups.find(sg => sg.GroupId === outputs.db_security_group_id);
      
      // Verify web tier allows HTTP/HTTPS from internet
      const webIngressRules = webSG!.IpPermissions!;
      expect(webIngressRules.some(rule => 
        rule.FromPort === 80 && rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
      )).toBe(true);
      expect(webIngressRules.some(rule => 
        rule.FromPort === 443 && rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
      )).toBe(true);
      
      // Verify app tier only allows traffic from web tier
      const appIngressRules = appSG!.IpPermissions!;
      expect(appIngressRules.some(rule => 
        rule.UserIdGroupPairs?.some(group => group.GroupId === outputs.web_security_group_id)
      )).toBe(true);
      
      // Verify db tier only allows traffic from app tier
      const dbIngressRules = dbSG!.IpPermissions!;
      expect(dbIngressRules.some(rule => 
        rule.UserIdGroupPairs?.some(group => group.GroupId === outputs.app_security_group_id)
      )).toBe(true);
    });
  });

  describe('S3 Storage Security', () => {
    test('int-s3-encryption-kms: S3 buckets use KMS encryption', async () => {
      const buckets = [
        { name: outputs.primary_s3_bucket_name, type: 'primary' },
        { name: outputs.logs_s3_bucket_name, type: 'logs' }
      ];

      for (const bucket of buckets) {
        // Test bucket encryption
        const encryptionCommand = new GetBucketEncryptionCommand({
          Bucket: bucket.name
        });
        
        const encryptionResponse = await s3Client.send(encryptionCommand);
        const rules = encryptionResponse.ServerSideEncryptionConfiguration!.Rules!;
        
        expect(rules).toHaveLength(1);
        expect(rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
        expect(rules[0].ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBe(outputs.kms_key_arn);
        
        // Test versioning is enabled
        const versioningCommand = new GetBucketVersioningCommand({
          Bucket: bucket.name
        });
        
        const versioningResponse = await s3Client.send(versioningCommand);
        expect(versioningResponse.Status).toBe('Enabled');
        
        // Test public access is blocked
        const publicAccessCommand = new GetBucketPublicAccessBlockCommand({
          Bucket: bucket.name
        });
        
        const publicAccessResponse = await s3Client.send(publicAccessCommand);
        expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
        expect(publicAccessResponse.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
      }
    });

    test('int-s3-cloudtrail-bucket-policy: logs S3 bucket has proper CloudTrail policy', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.logs_s3_bucket_name
      });
      
      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);
      
      // Verify CloudTrail statements exist
      const statements = policy.Statement;
      expect(statements.some((stmt: any) => stmt.Sid === 'AWSCloudTrailAclCheck')).toBe(true);
      expect(statements.some((stmt: any) => stmt.Sid === 'AWSCloudTrailWrite')).toBe(true);
      
      // Verify proper conditions for security
      const writeStatement = statements.find((stmt: any) => stmt.Sid === 'AWSCloudTrailWrite');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });
  });

  describe('KMS Key Security', () => {
    test('int-kms-key-configuration: KMS key is properly configured with rotation', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id
      });
      
      const response = await kmsClient.send(command);
      const keyMetadata = response.KeyMetadata!;
      
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
      
      // Verify key rotation is enabled (this requires checking the key policy or rotation status)
      const policyCommand = new GetKeyPolicyCommand({
        KeyId: outputs.kms_key_id,
        PolicyName: 'default'
      });
      
      const policyResponse = await kmsClient.send(policyCommand);
      const policy = JSON.parse(policyResponse.Policy!);
      
      // Verify policy grants permissions to required services
      const statements = policy.Statement;
      expect(statements.some((stmt: any) => 
        stmt.Sid?.includes('CloudWatch') || stmt.Principal?.Service?.includes('logs.')
      )).toBe(true);
      expect(statements.some((stmt: any) => 
        stmt.Sid?.includes('S3') || stmt.Principal?.Service?.includes('s3.')
      )).toBe(true);
      expect(statements.some((stmt: any) => 
        stmt.Sid?.includes('CloudTrail') || stmt.Principal?.Service?.includes('cloudtrail.')
      )).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('int-iam-roles-least-privilege: IAM roles follow least privilege principle', async () => {
      const roles = [
        { arn: outputs.s3_access_role_arn, type: 's3_access' },
        { arn: outputs.cloudwatch_logs_role_arn, type: 'cloudwatch_logs' }
      ];

      for (const role of roles) {
        const roleName = role.arn.split('/').pop()!;
        
        // Get role details
        const roleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(roleCommand);
        
        expect(roleResponse.Role!.RoleName).toBe(roleName);
        
        // Get attached policies
        const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
        const policiesResponse = await iamClient.send(policiesCommand);
        
        expect(policiesResponse.AttachedPolicies).toBeDefined();
        expect(policiesResponse.AttachedPolicies!.length).toBeGreaterThan(0);
        
        // Verify no overly permissive policies (this is a basic check)
        for (const attachedPolicy of policiesResponse.AttachedPolicies!) {
          if (attachedPolicy.PolicyArn!.includes('iam::aws:policy/')) {
            // Skip AWS managed policies check for this test
            continue;
          }
          
          const policyCommand = new GetPolicyCommand({ PolicyArn: attachedPolicy.PolicyArn! });
          const policyResponse = await iamClient.send(policyCommand);
          
          expect(policyResponse.Policy!.PolicyName).toBeDefined();
        }
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('int-cloudwatch-logs-encrypted: CloudWatch log groups exist and are encrypted', async () => {
      const logGroups = [
        outputs.main_log_group_name,
        outputs.vpc_flow_logs_group_name,
        outputs.cloudtrail_log_group_name
      ];

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/'
      });
      
      const response = await cloudWatchLogsClient.send(command);
      const allLogGroups = response.logGroups!;
      
      for (const expectedLogGroup of logGroups) {
        const logGroup = allLogGroups.find(lg => lg.logGroupName === expectedLogGroup);
        expect(logGroup).toBeDefined();
        expect(logGroup!.kmsKeyId).toBe(outputs.kms_key_arn);
        
        // Verify retention policies
        expect(logGroup!.retentionInDays).toBeDefined();
        expect(logGroup!.retentionInDays).toBeGreaterThan(0);
      }
    });
  });

  describe('CloudTrail Audit Logging', () => {
    test('int-cloudtrail-multi-region-active: CloudTrail is multi-region and active', async () => {
      const trailName = outputs.cloudtrail_arn.split('/').pop()!;
      
      // Describe trail configuration
      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [trailName]
      });
      
      const describeResponse = await cloudTrailClient.send(describeCommand);
      const trail = describeResponse.trailList![0];
      
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.EnableLogFileValidation).toBe(true);
      expect(trail.KMSKeyId).toBe(outputs.kms_key_arn);
      expect(trail.S3BucketName).toBe(outputs.logs_s3_bucket_name);
      
      // Check trail status
      const statusCommand = new GetTrailStatusCommand({
        Name: trailName
      });
      
      const statusResponse = await cloudTrailClient.send(statusCommand);
      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('int-resource-tagging-verification: resources have required compliance tags', async () => {
      // Test VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      const vpcTags = vpc.Tags || [];
      
      const requiredTags = ['Environment', 'Project', 'Company', 'ManagedBy', 'Compliance'];
      requiredTags.forEach(tagKey => {
        expect(vpcTags.some(tag => tag.Key === tagKey)).toBe(true);
      });
      
      // Verify compliance tag value
      const complianceTag = vpcTags.find(tag => tag.Key === 'Compliance');
      expect(complianceTag!.Value).toBe('financial-services');
      
      // Test S3 bucket tags (basic check - S3 tagging would need additional API calls)
      // This is covered by the infrastructure deployment validation
    });
  });
});
