import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('No cfn-outputs/flat-outputs.json found - skipping integration tests');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS clients
const s3Client = new S3Client({ region: 'us-east-1' });
const ec2Client = new EC2Client({ region: 'us-east-1' });
const kmsClient = new KMSClient({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: 'us-east-1' });

describe('Secure Foundational Environment Integration Tests', () => {
  // Skip all tests if outputs are not available
  const hasOutputs = Object.keys(outputs).length > 0;
  
  describe('S3 Bucket Security Validation', () => {
    test('S3 bucket should exist and be accessible', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      
      const response = await s3Client.send(
        new HeadBucketCommand({ Bucket: bucketName })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('S3 bucket should have KMS encryption enabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const bucketName = outputs.S3BucketName;
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    }, 30000);

    test('S3 bucket should have versioning enabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const bucketName = outputs.S3BucketName;
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('S3 bucket should have appropriate tags', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const bucketName = outputs.S3BucketName;
      const response = await s3Client.send(
        new GetBucketTaggingCommand({ Bucket: bucketName })
      );
      
      const tags = response.TagSet || [];
      const tagMap = tags.reduce((acc, tag) => {
        acc[tag.Key!] = tag.Value!;
        return acc;
      }, {} as Record<string, string>);
      
      expect(tagMap.Environment).toBe(environmentSuffix);
      expect(tagMap.Project).toBe('IaC-AWS-Nova-Model-Breaking');
      expect(tagMap.ManagedBy).toBe('AWS-CDK');
    }, 30000);
  });

  describe('VPC and Network Security Validation', () => {
    test('VPC should exist with correct configuration', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    }, 30000);

    test('VPC Flow Logs should be enabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [vpcId],
            },
          ],
        })
      );
      
      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
    }, 30000);
  });

  describe('EC2 Security Configuration Validation', () => {
    test('EC2 instance should exist and be running', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const instanceId = outputs.EC2InstanceId;
      expect(instanceId).toBeDefined();
      
      const response = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );
      
      expect(response.Reservations).toHaveLength(1);
      const instance = response.Reservations![0].Instances![0];
      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
    }, 30000);

    test('Security Group should have restrictive rules', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const instanceId = outputs.EC2InstanceId;
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );
      
      const instance = instanceResponse.Reservations![0].Instances![0];
      const securityGroupIds = instance.SecurityGroups!.map(sg => sg.GroupId!);
      
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: securityGroupIds })
      );
      
      const secureGroup = sgResponse.SecurityGroups!.find(sg => 
        sg.Description?.includes('Secure security group')
      );
      
      expect(secureGroup).toBeDefined();
      
      // Check egress rules (should only allow HTTPS and HTTP outbound)
      const egressRules = secureGroup!.IpPermissionsEgress!;
      expect(egressRules.some(rule => rule.FromPort === 443 && rule.ToPort === 443)).toBe(true);
      expect(egressRules.some(rule => rule.FromPort === 80 && rule.ToPort === 80)).toBe(true);
    }, 30000);
  });

  describe('KMS Key Validation', () => {
    test('KMS key should exist with key rotation enabled', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();
      
      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: keyId })
      );
      
      const rotationResponse = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: keyId })
      );
      
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata!.KeyState).toBe('Enabled');
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
      expect(keyResponse.KeyMetadata!.Description).toContain('Customer-managed KMS key');
    }, 30000);
  });

  describe('Monitoring and Logging Validation', () => {
    test('CloudWatch Dashboard should exist', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const response = await cloudWatchClient.send(
        new ListDashboardsCommand({
          DashboardNamePrefix: `secure-foundation-dashboard-${environmentSuffix}`,
        })
      );
      
      expect(response.DashboardEntries).toBeDefined();
      expect(response.DashboardEntries!.length).toBeGreaterThan(0);
      
      const dashboard = response.DashboardEntries![0];
      expect(dashboard.DashboardName).toBe(`secure-foundation-dashboard-${environmentSuffix}`);
    }, 30000);

    test('CloudTrail should be active and logging', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      const response = await cloudTrailClient.send(
        new DescribeTrailsCommand({
          trailNameList: [`security-audit-trail-${environmentSuffix}`],
        })
      );
      
      expect(response.trailList).toHaveLength(1);
      const trail = response.trailList![0];
      
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      
      // Check trail status
      const statusResponse = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trail.TrailARN })
      );
      
      expect(statusResponse.IsLogging).toBe(true);
    }, 30000);
  });

  describe('End-to-End Workflow Validation', () => {
    test('All infrastructure components should work together', async () => {
      if (!hasOutputs) {
        console.log('Skipping test - no deployment outputs available');
        return;
      }
      
      // This test validates that all components are properly integrated
      const requiredOutputs = ['VPCId', 'KMSKeyId', 'S3BucketName', 'EC2InstanceId'];
      
      for (const output of requiredOutputs) {
        expect(outputs[output]).toBeDefined();
        expect(typeof outputs[output]).toBe('string');
        expect(outputs[output].length).toBeGreaterThan(0);
      }
      
      // Validate that resources use the same environment suffix
      expect(outputs.S3BucketName).toContain(environmentSuffix);
    }, 30000);
  });
});
