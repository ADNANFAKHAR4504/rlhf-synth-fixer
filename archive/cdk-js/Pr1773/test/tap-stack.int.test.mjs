import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand } from '@aws-sdk/client-ec2';
import { S3Client, GetBucketEncryptionCommand, GetBucketVersioningCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { SecurityHubClient, GetEnabledStandardsCommand, GetInsightsCommand } from '@aws-sdk/client-securityhub';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { SSMClient, GetDocumentCommand } from '@aws-sdk/client-ssm';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read deployment outputs
const outputs = JSON.parse(readFileSync(join(process.cwd(), 'cfn-outputs/flat-outputs.json'), 'utf8'));

// Initialize AWS clients
const region = process.env.AWS_REGION || 'us-east-1';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });
const securityHubClient = new SecurityHubClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const ssmClient = new SSMClient({ region });

describe('Security Infrastructure Integration Tests', () => {
  describe('KMS Encryption', () => {
    test('KMS key should exist and have rotation enabled', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      // Describe the key
      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyResponse = await kmsClient.send(describeCommand);
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata.KeyState).toBe('Enabled');

      // Check rotation status
      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('S3 Bucket Security', () => {
    test('Data bucket should exist with encryption and versioning', async () => {
      const bucketName = outputs.DataBucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('Session logs bucket should exist with encryption and versioning', async () => {
      const sessionLogsBucketName = outputs.SessionLogsBucketName;
      expect(sessionLogsBucketName).toBeDefined();

      // Check bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: sessionLogsBucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      // Check encryption
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: sessionLogsBucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(encryptionResponse.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // Check versioning
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: sessionLogsBucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('EC2 Instance Security', () => {
    test('EC2 instance should exist with encrypted EBS volume', async () => {
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      // Describe instance
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      const instanceResponse = await ec2Client.send(describeCommand);
      
      expect(instanceResponse.Reservations).toHaveLength(1);
      expect(instanceResponse.Reservations[0].Instances).toHaveLength(1);
      
      const instance = instanceResponse.Reservations[0].Instances[0];
      expect(instance.State.Name).toBe('running');

      // Check EBS volume encryption
      const volumeIds = instance.BlockDeviceMappings.map(mapping => mapping.Ebs.VolumeId);
      expect(volumeIds.length).toBeGreaterThan(0);

      const volumesCommand = new DescribeVolumesCommand({
        VolumeIds: volumeIds
      });
      const volumesResponse = await ec2Client.send(volumesCommand);
      
      volumesResponse.Volumes.forEach(volume => {
        expect(volume.Encrypted).toBe(true);
        expect(volume.VolumeType).toBe('gp3');
      });
    });

    test('EC2 instance should be in private subnet', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      const instanceResponse = await ec2Client.send(describeCommand);
      const instance = instanceResponse.Reservations[0].Instances[0];
      
      // Instance in private subnet should not have public IP
      expect(instance.PublicIpAddress).toBeUndefined();
      expect(instance.PrivateIpAddress).toBeDefined();
    });
  });

  describe('IAM Security', () => {
    test('EC2 role should exist with proper permissions', async () => {
      const roleArn = outputs.EC2RoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role.AssumeRolePolicyDocument).toBeDefined();

      // Parse and check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role.AssumeRolePolicyDocument));
      const ec2Statement = assumeRolePolicy.Statement.find(stmt => 
        stmt.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');
      expect(ec2Statement.Action).toBe('sts:AssumeRole');
    });
  });

  describe('VPC Security', () => {
    test('VPC should exist with proper configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const { DescribeVpcsCommand } = await import('@aws-sdk/client-ec2');
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);

      expect(vpcResponse.Vpcs).toHaveLength(1);
      const vpc = vpcResponse.Vpcs[0];
      expect(vpc.State).toBe('available');
      
      // Check DNS settings using DescribeVpcAttribute if needed
      const { DescribeVpcAttributeCommand } = await import('@aws-sdk/client-ec2');
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });

    test('VPC should have public and private subnets', async () => {
      const vpcId = outputs.VPCId;

      const { DescribeSubnetsCommand } = await import('@aws-sdk/client-ec2');
      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);

      expect(subnetsResponse.Subnets.length).toBeGreaterThan(0);
      
      const publicSubnets = subnetsResponse.Subnets.filter(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnetsResponse.Subnets.filter(subnet => 
        subnet.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });
  });

  describe('Security Best Practices', () => {
    test('All resources should be properly tagged', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      const instanceResponse = await ec2Client.send(describeCommand);
      const instance = instanceResponse.Reservations[0].Instances[0];
      
      const tags = instance.Tags || [];
      const tagMap = tags.reduce((acc, tag) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {});

      expect(tagMap.Environment).toBe('production');
      expect(tagMap.Project).toBe('SecurityInfra');
      expect(tagMap.Owner).toBe('SecurityTeam');
      expect(tagMap.Compliance).toBe('SOC2');
    });

    test('Security groups should have restrictive rules', async () => {
      const instanceId = outputs.EC2InstanceId;
      
      const describeCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      });
      const instanceResponse = await ec2Client.send(describeCommand);
      const instance = instanceResponse.Reservations[0].Instances[0];
      
      const securityGroupIds = instance.SecurityGroups.map(sg => sg.GroupId);
      expect(securityGroupIds.length).toBeGreaterThan(0);

      const { DescribeSecurityGroupsCommand } = await import('@aws-sdk/client-ec2');
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      });
      const sgResponse = await ec2Client.send(sgCommand);

      sgResponse.SecurityGroups.forEach(sg => {
        // Check ingress rules - should only allow HTTPS (443)
        const nonDefaultIngress = sg.IpPermissions.filter(rule => 
          rule.FromPort !== undefined
        );
        
        nonDefaultIngress.forEach(rule => {
          if (rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')) {
            // If open to internet, should only be HTTPS
            expect(rule.FromPort).toBe(443);
            expect(rule.ToPort).toBe(443);
          }
        });
      });
    });
  });

  describe('Security Hub Integration', () => {
    test('Security Hub custom insight should exist', async () => {
      const securityInsightName = outputs.SecurityInsightName;
      expect(securityInsightName).toBeDefined();

      // Check for custom insights
      const insightsCommand = new GetInsightsCommand({});
      const insightsResponse = await securityHubClient.send(insightsCommand);
      
      expect(insightsResponse.Insights).toBeDefined();
      const ec2Insight = insightsResponse.Insights.find(insight => 
        insight.Name === securityInsightName
      );
      expect(ec2Insight).toBeDefined();
      expect(ec2Insight.Filters.ResourceType).toBeDefined();
      expect(ec2Insight.GroupByAttribute).toBe('ResourceId');
    });

    test('Security Hub should be enabled in the account', async () => {
      // Since Security Hub is managed at organization level, we just check it's enabled
      const standardsCommand = new GetEnabledStandardsCommand({});
      const standardsResponse = await securityHubClient.send(standardsCommand);
      
      expect(standardsResponse.StandardsSubscriptions).toBeDefined();
      // At least one standard should be enabled
      expect(standardsResponse.StandardsSubscriptions.length).toBeGreaterThan(0);
    });
  });

  describe('Session Manager Integration', () => {
    test('Session Manager log group should exist', async () => {
      const sessionLogGroupName = outputs.SessionLogGroupName;
      expect(sessionLogGroupName).toBeDefined();

      const logGroupCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: sessionLogGroupName,
      });
      const logGroupResponse = await logsClient.send(logGroupCommand);
      
      expect(logGroupResponse.logGroups).toHaveLength(1);
      expect(logGroupResponse.logGroups[0].logGroupName).toBe(sessionLogGroupName);
      expect(logGroupResponse.logGroups[0].retentionInDays).toBe(365);
      // KMS encryption removed for CloudWatch logs due to Session Manager limitations
    });

    test('Session Manager documents should exist with proper configuration', async () => {
      const environmentSuffix = outputs.EnvironmentSuffix;
      const documentName = `SSM-SessionManagerRunShell-${environmentSuffix}`;

      const documentCommand = new GetDocumentCommand({
        Name: documentName,
      });
      const documentResponse = await ssmClient.send(documentCommand);
      
      expect(documentResponse.Name).toBe(documentName);
      expect(documentResponse.DocumentType).toBe('Session');
      expect(documentResponse.Status).toBe('Active');
      
      const content = JSON.parse(documentResponse.Content);
      expect(content.inputs.s3EncryptionEnabled).toBe(true);
      expect(content.inputs.cloudWatchEncryptionEnabled).toBe(false);
      expect(content.inputs.idleSessionTimeout).toBe('20');
      expect(content.inputs.maxSessionDuration).toBe('60');
    });
  });
});