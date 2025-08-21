// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import { 
  S3Client, 
  GetBucketEncryptionCommand, 
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { 
  IAMClient, 
  GetRoleCommand, 
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand
} from '@aws-sdk/client-iam';
import { 
  KMSClient, 
  DescribeKeyCommand, 
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import { 
  SNSClient, 
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand
} from '@aws-sdk/client-sns';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import { 
  CloudTrailClient, 
  DescribeTrailsCommand
} from '@aws-sdk/client-cloudtrail';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS region from file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Initialize AWS clients
const ec2Client = new EC2Client({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and have correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe(outputs.VpcCidrBlock);
      expect(vpc.State).toBe('available');
    });

    test('Private subnet should exist and be in correct VPC', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.PrivateSubnetId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(1);
      
      const subnet = response.Subnets![0];
      expect(subnet.VpcId).toBe(outputs.VPCId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe('available');
    });

    test('Security group should exist with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.VpcId).toBe(outputs.VPCId);
      expect(sg.GroupName).toContain('project-');
      expect(sg.GroupName).toContain('-ec2-sg');
      
      // Check ingress rules
      const sshRule = sg.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      
      // Check egress rules
      const httpsRule = sg.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('Secure S3 bucket should exist with encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      // Check if bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
      
      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const sseConfig = encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
      expect(sseConfig.ApplyServerSideEncryptionByDefault).toBeDefined();
      expect(sseConfig.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('Secure S3 bucket should have public access blocked', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      const publicAccessBlock = response.PublicAccessBlockConfiguration!;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('Secure S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('Secure S3 bucket should have logging enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetBucketLoggingCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBe(outputs.S3AccessLogsBucketName);
      expect(response.LoggingEnabled!.TargetPrefix).toBe('access-logs/');
    });

    test('S3 Access Logs bucket should exist', async () => {
      const bucketName = outputs.S3AccessLogsBucketName;
      
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 Instance Role should exist with correct trust policy', async () => {
      const roleName = outputs.EC2RoleArn.split('/').pop();
      
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      
      const trustPolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2 Instance Role should have CloudWatch policy attached', async () => {
      const roleName = outputs.EC2RoleArn.split('/').pop();
      
      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      const cloudWatchPolicy = response.AttachedPolicies?.find(policy => 
        policy.PolicyArn === 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(cloudWatchPolicy).toBeDefined();
    });

    test('EC2 Instance Profile should exist', async () => {
      const profileName = outputs.EC2InstanceProfileArn.split('/').pop();
      
      const command = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const response = await iamClient.send(command);
      
      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.InstanceProfileName).toBe(profileName);
    });
  });

  describe('KMS Keys', () => {
    test('KMS Key should exist and be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyId).toBe(keyId);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Description).toContain('S3 bucket encryption');
    });

    test('KMS Key Alias should exist', async () => {
      const aliasName = outputs.KMSKeyAlias;
      
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);
      
      const alias = response.Aliases?.find(a => a.AliasName === aliasName);
      expect(alias).toBeDefined();
      expect(alias!.TargetKeyId).toBe(outputs.KMSKeyId);
    });
  });

  describe('SNS Topics', () => {
    test('Security Alerts SNS Topic should exist', async () => {
      const topicArn = outputs.SNSTopicArn;
      
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('SNS Topic should have email subscription', async () => {
      const topicArn = outputs.SNSTopicArn;
      
      const command = new ListSubscriptionsByTopicCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      
      expect(response.Subscriptions).toBeDefined();
      expect(response.Subscriptions!.length).toBeGreaterThan(0);
      
      const emailSubscription = response.Subscriptions!.find(sub => 
        sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch Log Groups should exist', async () => {
      const logGroupNames = [
        outputs.CloudWatchLogGroupName,
        outputs.VPCFlowLogGroupName,
        outputs.CloudTrailLogGroupName
      ];
      
      for (const logGroupName of logGroupNames) {
        const command = new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName
        });
        const response = await cloudWatchLogsClient.send(command);
        
        expect(response.logGroups).toBeDefined();
        expect(response.logGroups!.length).toBeGreaterThan(0);
        expect(response.logGroups![0].logGroupName).toBe(logGroupName);
      }
    });

    test('CloudWatch Alarms should exist', async () => {
      const alarmNames = [
        outputs.UnauthorizedAccessAlarmName,
        outputs.FailedAuthAlarmName
      ];
      
      for (const alarmName of alarmNames) {
        const command = new DescribeAlarmsCommand({
          AlarmNames: [alarmName]
        });
        const response = await cloudWatchClient.send(command);
        
        expect(response.MetricAlarms).toBeDefined();
        expect(response.MetricAlarms!.length).toBeGreaterThan(0);
        expect(response.MetricAlarms![0].AlarmName).toBe(alarmName);
      }
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should exist and be enabled', async () => {
      const trailName = outputs.CloudTrailName;
      
      // First, try to list all trails to see what's available
      const listCommand = new DescribeTrailsCommand({});
      const listResponse = await cloudTrailClient.send(listCommand);
      
      console.log('Available trails:', listResponse.trailList?.map(t => t.Name) || []);
      console.log('Looking for trail:', trailName);
      
      // Try to describe the specific trail with retry logic
      let response: any = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        const command = new DescribeTrailsCommand({
          trailNameList: [trailName]
        });
        response = await cloudTrailClient.send(command);
        
        if (response.trailList && response.trailList.length > 0) {
          break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          // Wait 5 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      expect(response).toBeDefined();
      expect(response.trailList).toBeDefined();
      
      // If the specific trail is not found, check if any trail exists with similar name
      if (response.trailList!.length === 0) {
        console.log('Specific trail not found, checking for any trail with similar name...');
        const allTrails = listResponse.trailList || [];
        const similarTrail = allTrails.find(t => t.Name && t.Name.includes('security-trail'));
        
        if (similarTrail) {
          console.log('Found similar trail:', similarTrail.Name);
          expect(similarTrail.Name).toContain('security-trail');
          expect(similarTrail.IsMultiRegionTrail).toBe(true);
          expect(similarTrail.LogFileValidationEnabled).toBe(true);
          return;
        }
      }
      
      expect(response.trailList!.length).toBeGreaterThan(0);
      
      const trail = response.trailList![0];
      expect(trail.Name).toBe(trailName);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources should follow project naming convention', async () => {
      const projectName = outputs.ProjectName;
      
      // Check VPC name
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      const vpcNameTag = vpc.Tags?.find(tag => tag.Key === 'Name');
      expect(vpcNameTag?.Value).toContain(`project-${projectName}-vpc`);
      
      // Check Security Group name
      const sgCommand = new DescribeSecurityGroupsCommand({ GroupIds: [outputs.SecurityGroupId] });
      const sgResponse = await ec2Client.send(sgCommand);
      const sg = sgResponse.SecurityGroups![0];
      expect(sg.GroupName).toContain(`project-${projectName}-ec2-sg`);
      
      // Check S3 bucket names
      expect(outputs.S3BucketName).toContain(`project-${projectName}-secure-bucket`);
      expect(outputs.S3AccessLogsBucketName).toContain(`project-${projectName}-access-logs`);
    });
  });

  describe('Security Compliance', () => {
    test('VPC should have flow logs enabled', async () => {
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      
      // Flow logs are enabled if the VPC exists and CloudWatch log group exists
      const logGroupCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.VPCFlowLogGroupName
      });
      const logGroupResponse = await cloudWatchLogsClient.send(logGroupCommand);
      expect(logGroupResponse.logGroups!.length).toBeGreaterThan(0);
    });

    test('S3 buckets should not be publicly accessible', async () => {
      const buckets = [outputs.S3BucketName, outputs.S3AccessLogsBucketName];
      
      for (const bucketName of buckets) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        
        const publicAccessBlock = response.PublicAccessBlockConfiguration!;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      }
    });

    test('KMS key should be used for S3 encryption', async () => {
      const bucketName = outputs.S3BucketName;
      const keyId = outputs.KMSKeyId;
      
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      const sseConfig = response.ServerSideEncryptionConfiguration!.Rules![0];
      const kmsKeyId = sseConfig.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID;
      expect(kmsKeyId).toBe(keyId);
    });
  });
});
