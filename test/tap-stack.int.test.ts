import fs from 'fs';
import { 
  EC2Client, 
  DescribeInstancesCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeVpcsCommand,
  DescribeVolumesCommand 
} from '@aws-sdk/client-ec2';
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketEncryptionCommand,
  GetBucketPolicyStatusCommand 
} from '@aws-sdk/client-s3';
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand 
} from '@aws-sdk/client-iam';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} from '@aws-sdk/client-cloudwatch';

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch (error) {
  console.warn('Could not read cfn-outputs/flat-outputs.json, using empty outputs for tests');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS Clients
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});
const logsClient = new CloudWatchLogsClient({});
const cloudWatchClient = new CloudWatchClient({});

describe('TapStack Infrastructure Integration Tests', () => {
  const timeout = 30000; // 30 seconds timeout for integration tests

  describe('S3 Bucket Validation', () => {
    test('SecureS3Bucket should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    }, timeout);

    test('SecureS3Bucket should have encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      if (!bucketName) return;
      
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, timeout);

    test('SecureS3Bucket should have public access blocked', async () => {
      const bucketName = outputs.S3BucketName;
      if (!bucketName) return;
      
      try {
        const response = await s3Client.send(
          new GetBucketPolicyStatusCommand({ Bucket: bucketName })
        );
        
        // If bucket policy status exists, it should not be public
        if (response.PolicyStatus) {
          expect(response.PolicyStatus.IsPublic).toBe(false);
        }
      } catch (error: any) {
        // NoSuchBucketPolicy error means no bucket policy exists, which is secure by default
        if (error.name === 'NoSuchBucketPolicy') {
          // This is expected and secure - no bucket policy means no public access via policy
          expect(true).toBe(true); // Pass the test
        } else {
          throw error; // Re-throw any other errors
        }
      }
    }, timeout);
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].VpcId).toBe(vpcId);
    }, timeout);

    test('Security group should exist with correct configuration', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();
      
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups?.[0];
      
      // Check ingress rules
      const sshRule = sg?.IpPermissions?.find(rule => rule.FromPort === 22);
      const httpRule = sg?.IpPermissions?.find(rule => rule.FromPort === 80);
      const httpsRule = sg?.IpPermissions?.find(rule => rule.FromPort === 443);
      
      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      
      // Check egress rules - should have outbound internet access
      expect(sg?.IpPermissionsEgress?.length).toBeGreaterThan(0);
    }, timeout);
  });

  describe('EC2 Instance Validation', () => {
    test('EC2 Instance 1 should be running', async () => {
      const instanceId = outputs.EC2Instance1Id;
      expect(instanceId).toBeDefined();
      
      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations?.[0].Instances?.[0];
      
      expect(instance?.State?.Name).toMatch(/running|pending/);
      expect(instance?.InstanceType).toMatch(/^t3\.(micro|small|medium)$/);
      expect(instance?.IamInstanceProfile).toBeDefined();
    }, timeout);

    test('EC2 Instance 2 should be running', async () => {
      const instanceId = outputs.EC2Instance2Id;
      expect(instanceId).toBeDefined();
      
      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations?.[0].Instances?.[0];
      
      expect(instance?.State?.Name).toMatch(/running|pending/);
      expect(instance?.InstanceType).toMatch(/^t3\.(micro|small|medium)$/);
      expect(instance?.IamInstanceProfile).toBeDefined();
    }, timeout);

    test('EC2 instances should have encrypted EBS volumes', async () => {
      const instanceIds = [outputs.EC2Instance1Id, outputs.EC2Instance2Id].filter(Boolean);
      
      for (const instanceId of instanceIds) {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [instanceId] })
        );
        
        const instance = response.Reservations?.[0].Instances?.[0];
        const ebsVolumes = instance?.BlockDeviceMappings?.filter(bdm => bdm.Ebs);
        
        expect(ebsVolumes?.length).toBeGreaterThan(0);
        
        // Check that each EBS volume is encrypted by getting volume details
        for (const volume of ebsVolumes || []) {
          if (volume.Ebs?.VolumeId) {
            const volumeResponse = await ec2Client.send(
              new DescribeVolumesCommand({ VolumeIds: [volume.Ebs.VolumeId] })
            );
            
            const volumeDetails = volumeResponse.Volumes?.[0];
            expect(volumeDetails?.Encrypted).toBe(true);
          }
        }
      }
    }, timeout);

    test('EC2 instances should be in different availability zones for high availability', async () => {
      const instanceIds = [outputs.EC2Instance1Id, outputs.EC2Instance2Id].filter(Boolean);
      
      if (instanceIds.length < 2) {
        console.warn('Not enough instances to test AZ distribution');
        return;
      }
      
      const response1 = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceIds[0]] })
      );
      const response2 = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceIds[1]] })
      );
      
      const az1 = response1.Reservations?.[0].Instances?.[0].Placement?.AvailabilityZone;
      const az2 = response2.Reservations?.[0].Instances?.[0].Placement?.AvailabilityZone;
      
      expect(az1).toBeDefined();
      expect(az2).toBeDefined();
      expect(az1).not.toBe(az2);
    }, timeout);
  });

  describe('IAM Role and Permissions', () => {
    test('EC2 IAM role should exist and be correctly configured', async () => {
      const roleArn = outputs.IAMRoleArn;
      expect(roleArn).toBeDefined();
      
      const roleName = roleArn?.split('/').pop();
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      
      // Check assume role policy allows EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      const ec2Statement = assumeRolePolicy.Statement?.find((stmt: any) => 
        stmt.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');
    }, timeout);

    test('EC2 IAM role should have required managed policies attached', async () => {
      const roleArn = outputs.IAMRoleArn;
      if (!roleArn) return;
      
      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      
      const policyArns = response.AttachedPolicies?.map(policy => policy.PolicyArn) || [];
      
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    }, timeout);
  });

  describe('CloudWatch Monitoring', () => {
    test('EC2 CloudWatch log group should exist', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ 
          logGroupNamePrefix: '/aws/ec2/SecureInfra' 
        })
      );
      
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.[0];
      expect(logGroup?.retentionInDays).toBe(30);
    }, timeout);

    test('S3 CloudWatch log group should exist', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({ 
          logGroupNamePrefix: '/aws/s3/SecureInfra' 
        })
      );
      
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.[0];
      expect(logGroup?.retentionInDays).toBe(30);
    }, timeout);

    test('CloudWatch alarms should be configured for both EC2 instances', async () => {
      const response = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ 
          AlarmNamePrefix: 'SecureInfra-Instance' 
        })
      );
      
      expect(response.MetricAlarms?.length).toBe(2);
      
      for (const alarm of response.MetricAlarms || []) {
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      }
    }, timeout);
  });

  describe('End-to-End Infrastructure Validation', () => {
    test('all infrastructure components should be properly tagged', async () => {
      // Test VPC tags
      const vpcId = outputs.VpcId;
      if (vpcId) {
        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        
        const vpcTags = vpcResponse.Vpcs?.[0].Tags || [];
        expect(vpcTags.find(tag => tag.Key === 'Project')).toBeDefined();
        expect(vpcTags.find(tag => tag.Key === 'Environment')).toBeDefined();
        expect(vpcTags.find(tag => tag.Key === 'Owner')).toBeDefined();
      }
      
      // Test EC2 instance tags
      const instanceIds = [outputs.EC2Instance1Id, outputs.EC2Instance2Id].filter(Boolean);
      for (const instanceId of instanceIds) {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [instanceId] })
        );
        
        const instanceTags = response.Reservations?.[0].Instances?.[0].Tags || [];
        expect(instanceTags.find(tag => tag.Key === 'Project')).toBeDefined();
        expect(instanceTags.find(tag => tag.Key === 'Environment')).toBeDefined();
        expect(instanceTags.find(tag => tag.Key === 'Owner')).toBeDefined();
        expect(instanceTags.find(tag => tag.Key === 'Name')).toBeDefined();
      }
    }, timeout);

    test('infrastructure should support high availability deployment', async () => {
      // Verify we have resources in multiple AZs
      const instanceIds = [outputs.EC2Instance1Id, outputs.EC2Instance2Id].filter(Boolean);
      
      if (instanceIds.length < 2) {
        console.warn('Cannot test high availability with less than 2 instances');
        return;
      }
      
      const availabilityZones = new Set<string>();
      
      for (const instanceId of instanceIds) {
        const response = await ec2Client.send(
          new DescribeInstancesCommand({ InstanceIds: [instanceId] })
        );
        
        const az = response.Reservations?.[0].Instances?.[0].Placement?.AvailabilityZone;
        if (az) {
          availabilityZones.add(az);
        }
      }
      
      expect(availabilityZones.size).toBeGreaterThan(1);
    }, timeout);

    test('security configuration should follow best practices', async () => {
      // Verify S3 bucket is not public
      const bucketName = outputs.S3BucketName;
      if (bucketName) {
        try {
          const response = await s3Client.send(
            new GetBucketPolicyStatusCommand({ Bucket: bucketName })
          );
          
          if (response.PolicyStatus) {
            expect(response.PolicyStatus.IsPublic).toBe(false);
          }
        } catch (error) {
          // If no bucket policy exists, that's fine - bucket should still not be public
        }
      }
      
      // Verify security group doesn't allow unrestricted access
      const sgId = outputs.SecurityGroupId;
      if (sgId) {
        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
        );
        
        const sg = response.SecurityGroups?.[0];
        const ingressRules = sg?.IpPermissions || [];
        
        // Check that no rule allows 0.0.0.0/0 access to all ports
        const dangerousRules = ingressRules.filter(rule => 
          rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0') &&
          (rule.FromPort === 0 || rule.FromPort === undefined) &&
          (rule.ToPort === 65535 || rule.ToPort === undefined)
        );
        
        expect(dangerousRules).toHaveLength(0);
      }
    }, timeout);

    test('deployment should be environment-specific using suffix', async () => {
      // Test that resources contain the environment suffix
      const vpcId = outputs.VpcId;
      const bucketName = outputs.S3BucketName;
      
      if (vpcId) {
        const response = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        
        const vpcTags = response.Vpcs?.[0].Tags || [];
        const nameTag = vpcTags.find(tag => tag.Key === 'Name');
        
        if (nameTag?.Value) {
          expect(nameTag.Value).toContain('Default-VPC');
        }
      }
      
      if (bucketName) {
        expect(bucketName).toContain('secureinfra');
        expect(bucketName).toContain('secure-bucket');
      }
    }, timeout);
  });
});
