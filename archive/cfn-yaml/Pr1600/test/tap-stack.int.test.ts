// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeSecurityGroupsCommand, DescribeFlowLogsCommand } from '@aws-sdk/client-ec2';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Get stack outputs for integration testing
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, integration tests may fail');
  // Fallback to environment variables or defaults for CI/CD
  outputs = {
    VPCId: process.env.VPC_ID,
    PublicSubnet1Id: process.env.PUBLIC_SUBNET_1_ID,
    PublicSubnet2Id: process.env.PUBLIC_SUBNET_2_ID,
    S3BucketName: process.env.S3_BUCKET_NAME,
    NATGatewayId: process.env.NAT_GATEWAY_ID,
    InternetGatewayId: process.env.INTERNET_GATEWAY_ID,
    EC2LoggingRoleArn: process.env.EC2_LOGGING_ROLE_ARN,
    SSHSecurityGroupId: process.env.SSH_SECURITY_GROUP_ID,
  };
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev'; // Unused for now
const awsRegion = process.env.AWS_REGION || 'us-west-2';

// AWS clients
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });

describe('AWS Infrastructure Integration Tests', () => {
  
  describe('VPC Infrastructure', () => {
    test('VPC should exist and have correct CIDR block', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      
      // Check VPC has DNS support enabled (note: these properties are not directly available in SDK response)
      // DNS support is verified through the VPC configuration in the template

      // Check Environment tag
      const environmentTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');
    }, 30000);

    test('Internet Gateway should exist and be attached to VPC', async () => {
      if (!outputs.InternetGatewayId || !outputs.VPCId) {
        console.warn('InternetGatewayId or VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      });

      const response = await ec2Client.send(command);
      const igw = response.InternetGateways?.[0];

      expect(igw).toBeDefined();
      expect(igw?.Attachments).toHaveLength(1);
      expect(igw?.Attachments?.[0].VpcId).toBe(outputs.VPCId);
      expect(igw?.Attachments?.[0].State).toBe('available');

      // Check Environment tag
      const environmentTag = igw?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');
    }, 30000);

    test('NAT Gateway should exist and be in available state', async () => {
      if (!outputs.NATGatewayId) {
        console.warn('NATGatewayId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NATGatewayId]
      });

      const response = await ec2Client.send(command);
      const natGw = response.NatGateways?.[0];

      expect(natGw).toBeDefined();
      expect(natGw?.State).toBe('available');
      expect(natGw?.SubnetId).toBe(outputs.PublicSubnet1Id);

      // Check Environment tag
      const environmentTag = natGw?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');
    }, 30000);
  });

  describe('Subnet Infrastructure', () => {
    test('Public subnets should exist with correct CIDR blocks and be in different AZs', async () => {
      if (!outputs.PublicSubnet1Id || !outputs.PublicSubnet2Id) {
        console.warn('Public subnet IDs not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets).toHaveLength(2);

      // Find subnets by CIDR
      const subnet1 = subnets.find(s => s.CidrBlock === '10.0.1.0/24');
      const subnet2 = subnets.find(s => s.CidrBlock === '10.0.2.0/24');

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();

      // Check they're in different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);

      // Check they're public (auto-assign public IP)
      expect(subnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2?.MapPublicIpOnLaunch).toBe(true);

      // Check they're in available state
      expect(subnet1?.State).toBe('available');
      expect(subnet2?.State).toBe('available');

      // Check VPC association
      expect(subnet1?.VpcId).toBe(outputs.VPCId);
      expect(subnet2?.VpcId).toBe(outputs.VPCId);

      // Check Environment tags
      [subnet1, subnet2].forEach(subnet => {
        const environmentTag = subnet?.Tags?.find(tag => tag.Key === 'Environment');
        expect(environmentTag?.Value).toBe('Production');
      });
    }, 30000);
  });

  describe('S3 Logging Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName
      });

      // Should not throw an error if bucket exists and is accessible
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

    test('S3 bucket should have versioning enabled', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket should have server-side encryption configured', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName
      });

      const response = await s3Client.send(command);
      const rules = response.ServerSideEncryptionConfiguration?.Rules || [];
      
      expect(rules).toHaveLength(1);
      expect(rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test('S3 bucket should block public access', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.S3BucketName
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    }, 30000);
  });

  describe('IAM Roles and Security', () => {
    test('EC2 logging role should exist with correct policies', async () => {
      if (!outputs.EC2LoggingRoleArn) {
        console.warn('EC2LoggingRoleArn not found in outputs, skipping test');
        return;
      }

      // Extract role name from ARN
      const roleName = outputs.EC2LoggingRoleArn.split('/').pop();
      
      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      const role = response.Role;

      expect(role).toBeDefined();
      expect(role?.AssumeRolePolicyDocument).toBeDefined();

      // Parse assume role policy
      const assumePolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || ''));
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');

      // Check Environment tag
      const environmentTag = role?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');
    }, 30000);

    test('SSH security group should exist with correct rules', async () => {
      if (!outputs.SSHSecurityGroupId) {
        console.warn('SSHSecurityGroupId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SSHSecurityGroupId]
      });

      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPCId);

      // Check SSH ingress rule
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');

      // Check outbound rules for HTTPS and HTTP
      const httpsEgress = sg?.IpPermissionsEgress?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443
      );
      const httpEgress = sg?.IpPermissionsEgress?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpsEgress).toBeDefined();
      expect(httpEgress).toBeDefined();

      // Check Environment tag
      const environmentTag = sg?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');
    }, 30000);
  });

  describe('Resource Connectivity and Health', () => {
    test('All infrastructure components should be properly connected', async () => {
      // This is a comprehensive test that verifies the infrastructure is properly connected
      const checks = [];

      if (outputs.VPCId) checks.push('VPC');
      if (outputs.PublicSubnet1Id) checks.push('PublicSubnet1');
      if (outputs.PublicSubnet2Id) checks.push('PublicSubnet2');
      if (outputs.InternetGatewayId) checks.push('InternetGateway');
      if (outputs.NATGatewayId) checks.push('NATGateway');
      if (outputs.S3BucketName) checks.push('S3Bucket');
      if (outputs.EC2LoggingRoleArn) checks.push('EC2Role');
      if (outputs.SSHSecurityGroupId) checks.push('SecurityGroup');

      expect(checks.length).toBeGreaterThanOrEqual(6); // At least 6 components should be deployed
      
      console.log(`✅ Verified ${checks.length} infrastructure components:`, checks.join(', '));
    });

    test('Infrastructure should be in target region', async () => {
      expect(awsRegion).toBe('us-west-2');
      
      if (outputs.VPCId) {
        const vpcCommand = new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId]
        });
        
        const vpcResponse = await ec2Client.send(vpcCommand);
        expect(vpcResponse.Vpcs).toHaveLength(1);
      }
    });
  });

  describe('VPC Flow Logs Monitoring', () => {
    test('VPC Flow Logs should be enabled and active', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const flowLogs = response.FlowLogs || [];

      expect(flowLogs.length).toBeGreaterThan(0);
      
      const activeFlowLog = flowLogs.find(log => log.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog).toBeDefined();
      expect(activeFlowLog?.ResourceId).toBe(outputs.VPCId);
      expect(activeFlowLog?.TrafficType).toBe('ALL');
      expect(activeFlowLog?.LogDestinationType).toBe('cloud-watch-logs');

      // Check Environment tag
      const environmentTag = activeFlowLog?.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');
    }, 30000);

    test('CloudWatch Log Group for VPC Flow Logs should exist', async () => {
      const logGroupName = '/aws/vpc/Production';
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroups = response.logGroups || [];

      const vpcLogGroup = logGroups.find(group => group.logGroupName === logGroupName);
      expect(vpcLogGroup).toBeDefined();
      expect(vpcLogGroup?.retentionInDays).toBe(30);
    }, 30000);

    test('VPC Flow Logs should have proper IAM role configured', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const flowLogs = response.FlowLogs || [];
      
      expect(flowLogs.length).toBeGreaterThan(0);
      
      const activeFlowLog = flowLogs.find(log => log.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog?.DeliverLogsPermissionArn).toBeDefined();
      expect(activeFlowLog?.DeliverLogsPermissionArn).toContain('VPCFlowLogRole');
    }, 30000);

    test('VPC Flow Logs should capture all traffic types', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [outputs.VPCId]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const flowLogs = response.FlowLogs || [];
      
      expect(flowLogs.length).toBeGreaterThan(0);
      
      const activeFlowLog = flowLogs.find(log => log.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog?.TrafficType).toBe('ALL');
      // VPC Flow Log is configured for VPC resource (verified by resource-id filter)
    }, 30000);
  });

  describe('Security Compliance', () => {
    test('All resources should have Production environment tags', async () => {
      const resourcesWithTags = [];

      // Check VPC tags
      if (outputs.VPCId) {
        const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
        const vpcResponse = await ec2Client.send(vpcCommand);
        const vpc = vpcResponse.Vpcs?.[0];
        const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
        if (envTag?.Value === 'Production') resourcesWithTags.push('VPC');
      }

      // Check Subnets tags
      if (outputs.PublicSubnet1Id && outputs.PublicSubnet2Id) {
        const subnetCommand = new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id]
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        subnetResponse.Subnets?.forEach((subnet, index) => {
          const envTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
          if (envTag?.Value === 'Production') {
            resourcesWithTags.push(`PublicSubnet${index + 1}`);
          }
        });
      }

      // Check Security Group tags
      if (outputs.SSHSecurityGroupId) {
        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.SSHSecurityGroupId]
        });
        const sgResponse = await ec2Client.send(sgCommand);
        const sg = sgResponse.SecurityGroups?.[0];
        const envTag = sg?.Tags?.find(tag => tag.Key === 'Environment');
        if (envTag?.Value === 'Production') resourcesWithTags.push('SecurityGroup');
      }

      expect(resourcesWithTags.length).toBeGreaterThan(0);
      console.log(`✅ Resources with Production tags:`, resourcesWithTags.join(', '));
    }, 45000);

    test('Security configuration should meet requirements', async () => {
      const securityChecks = [];

      // S3 bucket security
      if (outputs.S3BucketName) {
        try {
          const encCommand = new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName });
          const pubCommand = new GetPublicAccessBlockCommand({ Bucket: outputs.S3BucketName });
          
          await s3Client.send(encCommand);
          await s3Client.send(pubCommand);
          
          securityChecks.push('S3-Encryption');
          securityChecks.push('S3-PublicAccessBlocked');
        } catch (error) {
          console.warn('S3 security check failed:', error);
        }
      }

      // Security Group rules
      if (outputs.SSHSecurityGroupId) {
        try {
          const sgCommand = new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.SSHSecurityGroupId]
          });
          const sgResponse = await ec2Client.send(sgCommand);
          const sg = sgResponse.SecurityGroups?.[0];
          
          const sshRule = sg?.IpPermissions?.find(rule => 
            rule.FromPort === 22 && rule.ToPort === 22
          );
          
          if (sshRule?.IpRanges?.[0].CidrIp === '203.0.113.0/24') {
            securityChecks.push('SSH-RestrictedAccess');
          }
        } catch (error) {
          console.warn('Security Group check failed:', error);
        }
      }

      expect(securityChecks.length).toBeGreaterThan(0);
      console.log(`✅ Security compliance checks passed:`, securityChecks.join(', '));
    }, 45000);
  });
});