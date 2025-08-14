import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeFlowLogsCommand,
  DescribeVolumesCommand,
  DescribeVpcAttributeCommand,
  Vpc,
  Subnet,
  SecurityGroup,
  Instance,
  FlowLog,
  Volume
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import {
  IAMClient,
  GetPolicyCommand,
  GetRoleCommand,
  ListAttachedGroupPoliciesCommand
} from "@aws-sdk/client-iam";
import {
  KMSClient,
  DescribeKeyCommand
} from "@aws-sdk/client-kms";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";

// --- Configuration ---
// Read deployed resource IDs from the cfn-outputs file
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });
const iamClient = new IAMClient({ region: "us-east-1" });
const kmsClient = new KMSClient({ region: "us-east-1" });
const logsClient = new CloudWatchLogsClient({ region: "us-east-1" });

// --- Test Suite ---
describe('Secure Baseline AWS Infrastructure Integration Tests', () => {
  
  // Set a longer timeout for AWS API calls
  jest.setTimeout(60000);

  describe('VPC and Networking', () => {
    test('VPC should exist and be configured correctly', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const { Vpcs } = await ec2Client.send(command);

      expect(Vpcs).toBeDefined();
      expect(Vpcs).toHaveLength(1);
      const vpc: Vpc = Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Check DNS support attributes separately
      const dnsSupportCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResult = await ec2Client.send(dnsSupportCmd);
      expect(dnsSupportResult.EnableDnsSupport?.Value).toBe(true);

      const dnsHostnamesCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.VPCId,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResult = await ec2Client.send(dnsHostnamesCmd);
      expect(dnsHostnamesResult.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Public subnets should exist and be configured correctly', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      });
      const { Subnets } = await ec2Client.send(command);

      expect(Subnets).toBeDefined();
      expect(Subnets!.length).toBe(2);

      const publicSubnets: Subnet[] = Subnets!.filter((s: Subnet) => s.MapPublicIpOnLaunch);
      expect(publicSubnets).toHaveLength(2);

      const cidrBlocks = publicSubnets.map((s: Subnet) => s.CidrBlock);
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');

      // Should be in different AZs
      const azs = publicSubnets.map((s: Subnet) => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('VPC Flow Logs should be enabled', async () => {
      const command = new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [outputs.VPCId] },
          { Name: 'resource-type', Values: ['VPC'] }
        ]
      });
      const { FlowLogs } = await ec2Client.send(command);

      expect(FlowLogs).toBeDefined();
      expect(FlowLogs!.length).toBeGreaterThan(0);

      const flowLog: FlowLog = FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  describe('Security Groups', () => {
    test('ALB Security Group should have correct HTTPS rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: ['*alb*'] }
        ]
      });
      const { SecurityGroups } = await ec2Client.send(command);

      expect(SecurityGroups).toBeDefined();
      const albSG: SecurityGroup | undefined = SecurityGroups!.find((sg: SecurityGroup) => 
        sg.Description?.toLowerCase().includes('alb') ||
        sg.GroupName?.toLowerCase().includes('alb')
      );
      expect(albSG).toBeDefined();

      const ingressRules = albSG!.IpPermissions || [];
      const httpsRules = ingressRules.filter((rule: any) => rule.FromPort === 443);
      expect(httpsRules.length).toBe(2); // Two CIDR blocks

      httpsRules.forEach((rule: any) => {
        expect(rule.IpProtocol).toBe('tcp');
        expect(rule.ToPort).toBe(443);
        
        // Should not allow from 0.0.0.0/0
        const hasOpenAccess = rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0');
        expect(hasOpenAccess).toBe(false);
      });
    });

    test('Instance Security Group should have correct access controls', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: ['*instance*'] }
        ]
      });
      const { SecurityGroups } = await ec2Client.send(command);

      expect(SecurityGroups).toBeDefined();
      const instanceSG: SecurityGroup | undefined = SecurityGroups!.find((sg: SecurityGroup) => 
        sg.Description?.toLowerCase().includes('ec2') ||
        sg.Description?.toLowerCase().includes('instance')
      );
      expect(instanceSG).toBeDefined();

      const ingressRules = instanceSG!.IpPermissions || [];
      
      // Should have HTTP rule from ALB
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.UserIdGroupPairs).toBeDefined();
      expect(httpRule!.UserIdGroupPairs!.length).toBe(1);

      // Should have SSH rules but not from 0.0.0.0/0
      const sshRules = ingressRules.filter((rule: any) => rule.FromPort === 22);
      expect(sshRules.length).toBe(2);
      
      sshRules.forEach((rule: any) => {
        const hasOpenSSH = rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0');
        expect(hasOpenSSH).toBe(false);
      });
    });
  });

  describe('KMS Encryption', () => {
    test('KMS encryption key should exist and be enabled', async () => {
      const command = new DescribeKeyCommand({ KeyId: outputs.KMSKeyId });
      const { KeyMetadata } = await kmsClient.send(command);

      expect(KeyMetadata).toBeDefined();
      expect(KeyMetadata!.KeyState).toBe('Enabled');
      expect(KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(KeyMetadata!.Enabled).toBe(true);
    });
  });

  describe('S3 Bucket Security', () => {
    const bucketOutputKeys = ['AccessLogsBucket', 'ApplicationBucket', 'ConfigBucket'];

    test.each(bucketOutputKeys)('%s should exist and be properly secured', async (bucketKey) => {
      // Skip if bucket output doesn't exist
      if (!outputs[bucketKey]) {
        console.log(`Skipping ${bucketKey} - not found in outputs`);
        return;
      }

      const bucketName = outputs[bucketKey];

      // Test bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();

      // Test public access block
      const pabCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const { PublicAccessBlockConfiguration } = await s3Client.send(pabCommand);

      expect(PublicAccessBlockConfiguration).toBeDefined();
      expect(PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

      // Test encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const { ServerSideEncryptionConfiguration } = await s3Client.send(encryptionCommand);

      expect(ServerSideEncryptionConfiguration).toBeDefined();
      const rules = ServerSideEncryptionConfiguration!.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      const rule = rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
      expect(rule.BucketKeyEnabled).toBe(true);
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance should be running with proper configuration', async () => {
      // Find the instance by VPC
      const command = new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      });
      const { Reservations } = await ec2Client.send(command);

      expect(Reservations).toBeDefined();
      expect(Reservations!.length).toBeGreaterThan(0);

      const instance: Instance = Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.PublicIpAddress).toBeDefined();

      // Test EBS encryption
      const blockDeviceMappings = instance.BlockDeviceMappings || [];
      for (const blockDevice of blockDeviceMappings) {
        if (blockDevice.Ebs?.VolumeId) {
          const volumeCommand = new DescribeVolumesCommand({
            VolumeIds: [blockDevice.Ebs.VolumeId]
          });
          const { Volumes } = await ec2Client.send(volumeCommand);
          
          const volume: Volume = Volumes![0];
          expect(volume.Encrypted).toBe(true);
          expect(volume.KmsKeyId).toBeDefined();
        }
      }
    });
  });

  describe('IAM and MFA Configuration', () => {
    test('MFA enforcement policy should exist and be properly configured', async () => {
      // Find MFA policy ARN from outputs or by name
      const policyArn = outputs.MFAEnforcementPolicy || 
        `arn:aws:iam::${outputs.AccountId}:policy/MFAEnforcementPolicy`;

      const command = new GetPolicyCommand({ PolicyArn: policyArn });
      const { Policy } = await iamClient.send(command);

      expect(Policy).toBeDefined();
      expect(Policy!.PolicyName).toContain('MFA');
    });

    test('Users group should have MFA policy attached', async () => {
      const groupName = outputs.MFAGroupToUse;
      expect(groupName).toBeDefined();

      const command = new ListAttachedGroupPoliciesCommand({ GroupName: groupName });
      const { AttachedPolicies } = await iamClient.send(command);

      expect(AttachedPolicies).toBeDefined();
      expect(AttachedPolicies!.length).toBeGreaterThan(0);
      
      const hasMFAPolicy = AttachedPolicies!.some((policy: any) => 
        policy.PolicyName?.includes('MFA') || policy.PolicyArn?.includes('MFA')
      );
      expect(hasMFAPolicy).toBe(true);
    });

    test('EC2 role should exist with proper permissions', async () => {
      // Find EC2 role by searching for roles with EC2 trust policy
      const instancesCommand = new DescribeInstancesCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }]
      });
      const { Reservations } = await ec2Client.send(instancesCommand);
      
      const instance: Instance = Reservations![0].Instances![0];
      const instanceProfileArn = instance.IamInstanceProfile?.Arn;
      expect(instanceProfileArn).toBeDefined();

      // Extract role name from instance profile
      const roleName = instanceProfileArn!.split('/').pop()?.replace('InstanceProfile', 'Role') || 'EC2Role';
      
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const { Role } = await iamClient.send(roleCommand);

      expect(Role).toBeDefined();
      expect(Role!.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('CloudWatch Logging', () => {
    test('Log groups should exist and be encrypted', async () => {
      const command = new DescribeLogGroupsCommand({});
      const { logGroups } = await logsClient.send(command);

      expect(logGroups).toBeDefined();

      // Find our stack's log groups
      const stackLogGroups = logGroups!.filter((lg: any) => 
        lg.logGroupName?.includes('application') || 
        lg.logGroupName?.includes('vpcflowlogs')
      );

      expect(stackLogGroups.length).toBeGreaterThanOrEqual(1);

      stackLogGroups.forEach((logGroup: any) => {
        expect(logGroup.retentionInDays).toBe(30);
        expect(logGroup.kmsKeyId).toBeDefined(); // Should be encrypted
      });
    });
  });

  describe('Basic Connectivity Tests', () => {
    test('ALB DNS name should be available in outputs', async () => {
      const albDns = outputs.ALBDNSName;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/.*\.elb\.amazonaws\.com$/);
    });

    test('Stack outputs should contain all required values', async () => {
      const requiredOutputs = [
        'VPCId',
        'ALBDNSName',
        'KMSKeyId',
        'MFAGroupToUse'
      ];

      requiredOutputs.forEach((outputKey: string) => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });
  });
});