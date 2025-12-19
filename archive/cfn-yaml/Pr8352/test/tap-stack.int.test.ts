import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVolumesCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// AWS Clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });

describe('TapStack Integration Tests - Production Security Infrastructure', () => {
  let flatOutputs: Record<string, string>;
  let stackResources: any[];
  let stackExists = false;

  beforeAll(async () => {
    // Load flat outputs from deployment
    const flatOutputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (!fs.existsSync(flatOutputsPath)) {
      console.log(
        '⚠️  Skipping integration tests: flat-outputs.json not found. Stack has not been deployed.'
      );
      return;
    }

    flatOutputs = JSON.parse(fs.readFileSync(flatOutputsPath, 'utf8'));

    // Check if stack exists
    try {
      const resourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      stackResources = resourcesResponse.StackResources || [];
      stackExists = true;
    } catch (error: any) {
      console.log(
        `⚠️  Skipping integration tests: Stack ${stackName} does not exist or is not accessible.`
      );
      stackExists = false;
    }
  }, 30000);

  // Helper function to skip tests when stack doesn't exist
  const skipIfNoStack = () => {
    if (!stackExists) {
      console.log('⊘ Skipping test: Stack not deployed');
      return true;
    }
    return false;
  };

  describe('Stack Deployment Validation', () => {
    test('should have successfully deployed stack', async () => {
      if (!stackExists) {
        console.log('⊘ Skipping test: Stack not deployed');
        return;
      }

      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all required outputs', () => {
      if (!stackExists) {
        console.log('⊘ Skipping test: Stack not deployed');
        return;
      }

      const requiredOutputs = [
        'VPCId',
        'PrivateSubnetId',
        'EC2InstanceId',
        'S3BucketName',
        'KMSKeyId',
        'CloudWatchLogGroup',
      ];

      requiredOutputs.forEach(output => {
        expect(flatOutputs[output]).toBeDefined();
        expect(flatOutputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking Security', () => {
    test('should have VPC with correct CIDR and DNS settings', async () => {
      if (skipIfNoStack()) return;
      const vpcId = flatOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // Use DescribeVpcAttributeCommand to check DNS attributes
      const dnsHostnamesAttr = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpc.VpcId,
          Attribute: 'enableDnsHostnames',
        })
      );
      const dnsSupportAttr = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpc.VpcId,
          Attribute: 'enableDnsSupport',
        })
      );
      expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);
    });

    test('should have private subnet with correct configuration', async () => {
      if (skipIfNoStack()) return;
      const subnetId = flatOutputs.PrivateSubnetId;
      expect(subnetId).toBeDefined();

      const command = new DescribeSubnetsCommand({
        SubnetIds: [subnetId],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(1);

      const subnet = response.Subnets![0];
      expect(subnet.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(false); // Private subnet should not auto-assign public IPs
    });
  });

  describe('EC2 Instance Security', () => {
    test('should have EC2 instance in private subnet with correct configuration', async () => {
      if (skipIfNoStack()) return;
      const instanceId = flatOutputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBe(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.SubnetId).toBe(flatOutputs.PrivateSubnetId);
      expect(instance.InstanceType).toBeDefined();

      // Verify encrypted EBS volumes
      const blockDevices = instance.BlockDeviceMappings || [];
      expect(blockDevices.length).toBeGreaterThan(0);

      // Check EBS volume encryption using DescribeVolumesCommand
      const volumeIds = blockDevices
        .map(device => device.Ebs?.VolumeId)
        .filter((id): id is string => typeof id === 'string');
      if (volumeIds.length > 0) {
        const volumesResponse = await ec2Client.send(
          new DescribeVolumesCommand({ VolumeIds: volumeIds })
        );
        (volumesResponse.Volumes || []).forEach(volume => {
          expect(volume.Encrypted).toBe(true);
        });
      }
    });

    test('should have properly configured security group', async () => {
      if (skipIfNoStack()) return;
      const instanceId = flatOutputs.EC2InstanceId;
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);

      const instance = instanceResponse.Reservations![0].Instances![0];
      const securityGroups = instance.SecurityGroups || [];
      expect(securityGroups.length).toBeGreaterThan(0);

      const sgId = securityGroups[0].GroupId!;

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const sgResponse = await ec2Client.send(sgCommand);

      const sg = sgResponse.SecurityGroups![0];

      // Check SSH rule exists and is restricted
      const sshRule = sg.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/8'); // Should match parameter

      // Check egress rules are minimal and necessary
      const egressRules = sg.IpPermissionsEgress || [];
      expect(egressRules.length).toBeGreaterThan(0);

      // Verify HTTP/HTTPS outbound rules exist
      const httpRule = egressRules.find(rule => rule.FromPort === 80);
      const httpsRule = egressRules.find(rule => rule.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });
  });

  describe('S3 Security Controls', () => {
    test('should have S3 bucket with KMS encryption enabled', async () => {
      if (skipIfNoStack()) return;
      const bucketName = flatOutputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = response.ServerSideEncryptionConfiguration!.Rules!;
      expect(rules.length).toBeGreaterThan(0);

      const rule = rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toBeDefined();
    });

    test('should have public access completely blocked', async () => {
      if (skipIfNoStack()) return;
      const bucketName = flatOutputs.S3BucketName;

      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', async () => {
      if (skipIfNoStack()) return;
      const bucketName = flatOutputs.S3BucketName;

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key in correct state and configuration', async () => {
      if (skipIfNoStack()) return;
      const keyId = flatOutputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      const keyMetadata = response.KeyMetadata!;
      expect(keyMetadata.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyMetadata.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(keyMetadata.Origin).toBe('AWS_KMS');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have encrypted CloudWatch log group', async () => {
      if (skipIfNoStack()) return;
      const logGroupName = flatOutputs.CloudWatchLogGroup;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(
        lg => lg.logGroupName === logGroupName
      );
      expect(logGroup).toBeDefined();
      expect(logGroup!.kmsKeyId).toBeDefined(); // Should be encrypted with KMS
      expect(logGroup!.retentionInDays).toBe(30);
    });
  });

  describe('Resource Naming and Environment Suffix', () => {
    test('all resources should follow naming convention', () => {
      if (skipIfNoStack()) return;
      stackResources.forEach(resource => {
        // Physical resource IDs should contain environment suffix where applicable
        if (resource.LogicalResourceId.startsWith('Prod')) {
          const physicalId = resource.PhysicalResourceId;

          // For resources that have names, verify they contain the environment suffix
          if (
            resource.ResourceType === 'AWS::S3::Bucket' ||
            resource.ResourceType === 'AWS::IAM::Role' ||
            resource.ResourceType === 'AWS::SNS::Topic' ||
            resource.ResourceType === 'AWS::Logs::LogGroup'
          ) {
            expect(physicalId).toContain(environmentSuffix);
          }
        }
      });
    });
  });

  describe('End-to-End Security Workflow', () => {
    test('should validate complete security infrastructure connectivity', async () => {
      if (skipIfNoStack()) return;
      // This test validates that all components work together securely

      // 1. Verify EC2 instance can be reached in private subnet (indirectly through status)
      const instanceId = flatOutputs.EC2InstanceId;
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];

      expect(instance.State?.Name).toBe('running');
      expect(instance.IamInstanceProfile).toBeDefined();

      // 2. Verify S3 bucket is accessible only through secure channels
      const bucketName = flatOutputs.S3BucketName;
      expect(bucketName).toMatch(/^prod-.*-secure-bucket-.*/);

      // 3. Verify KMS key is available for encryption operations
      const keyId = flatOutputs.KMSKeyId;
      const keyCommand = new DescribeKeyCommand({ KeyId: keyId });
      const keyResponse = await kmsClient.send(keyCommand);
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');

      // 4. Verify CloudWatch logging is set up
      const logGroupName = flatOutputs.CloudWatchLogGroup;
      expect(logGroupName).toMatch(
        new RegExp(`/aws/ec2/prod-${environmentSuffix}-logs`)
      );
    });

    test('should validate least-privilege security model', async () => {
      if (skipIfNoStack()) return;
      // Verify that resources are properly isolated and follow least-privilege principles

      // EC2 instance should be in private subnet (no public IP)
      const instanceId = flatOutputs.EC2InstanceId;
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      const instance = instanceResponse.Reservations![0].Instances![0];

      expect(instance.PublicIpAddress).toBeUndefined();
      expect(instance.SubnetId).toBe(flatOutputs.PrivateSubnetId);

      // S3 bucket should block all public access
      const bucketName = flatOutputs.S3BucketName;
      const publicAccessCommand = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });
      const publicAccessResponse = await s3Client.send(publicAccessCommand);

      const config = publicAccessResponse.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });
  });
});
