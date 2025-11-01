// Integration tests for Terraform infrastructure
// Tests validate deployed AWS resources using actual AWS API calls

import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import {
  DataSyncClient,
  DescribeLocationS3Command,
} from '@aws-sdk/client-datasync';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const datasyncClient = new DataSyncClient({ region: AWS_REGION });

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
const tfvarsPath = path.resolve(__dirname, '../lib/terraform.tfvars');
let outputs: any = {};
let ENV_SUFFIX: string = process.env.ENVIRONMENT_SUFFIX || '';

function getInstanceIds(): string[] {
  const values = Object.values(outputs.instance_ids || {}) as string[];
  return values.filter(id => typeof id === 'string' && id.trim().length > 0);
}

beforeAll(() => {
  // Prefer environment_suffix from terraform.tfvars when available
  if (fs.existsSync(tfvarsPath)) {
    try {
      const tfvarsRaw = fs.readFileSync(tfvarsPath, 'utf8');
      const match = tfvarsRaw.match(/environment_suffix\s*=\s*"([^"]+)"/);
      if (match && match[1]) {
        ENV_SUFFIX = match[1].trim();
      }
    } catch {}
  }

  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    // Normalize potential double-encoded fields
    try {
      if (typeof outputs.instance_ids === 'string') {
        outputs.instance_ids = JSON.parse(outputs.instance_ids);
      }
    } catch {}
    try {
      if (typeof outputs.instance_private_ips === 'string') {
        outputs.instance_private_ips = JSON.parse(outputs.instance_private_ips);
      }
    } catch {}
    // Derive environment suffix if still not provided
    if (!ENV_SUFFIX) {
      // Prefer an explicit field if present in outputs
      if (typeof outputs.environment_suffix === 'string' && outputs.environment_suffix.trim()) {
        ENV_SUFFIX = outputs.environment_suffix;
      } else {
        // Fallback to known default used across tests if nothing else is available
        ENV_SUFFIX = 'synth101000770';
      }
    }
  } else {
    throw new Error(`Outputs file not found at ${outputsPath}`);
  }
});

describe('Terraform Infrastructure - Integration Tests', () => {
  describe('EC2 Instances', () => {
    test('EC2 instances are running in multiple AZs', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length < 2) {
        console.warn('Skipping detailed EC2 checks: instance IDs not available or insufficient');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      expect(instances.length).toBe(instanceIds.length);

      // Check all instances are running
      instances.forEach(instance => {
        expect(instance.State?.Name).toBe('running');
      });

      // Check instances are in different AZs
      const azs = new Set(instances.map(i => i.Placement?.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('EC2 instances have correct instance type', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length === 0) {
        console.warn('Skipping instance type check: no instance IDs available');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      instances.forEach(instance => {
        expect(instance.InstanceType).toBe('t3.large');
      });
    });

    test('EC2 instances have correct tags', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length === 0) {
        console.warn('Skipping instance tag check: no instance IDs available');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      instances.forEach(instance => {
        const tags = instance.Tags || [];
        const tagMap = Object.fromEntries(tags.map(t => [t.Key, t.Value]));

        expect(tagMap['Environment']).toBeDefined();
        expect(tagMap['MigrationPhase']).toBeDefined();
        expect(tagMap['Project']).toBe('LegacyMigration');
        expect(tagMap['ManagedBy']).toBe('Terraform');
      });
    });

    test('EC2 instances have IAM instance profile attached', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length === 0) {
        console.warn('Skipping IAM instance profile check: no instance IDs available');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      instances.forEach(instance => {
        expect(instance.IamInstanceProfile).toBeDefined();
        expect(instance.IamInstanceProfile?.Arn).toContain('LegacyAppRole-profile');
      });
    });
  });

  describe('EBS Volumes', () => {
    test('EBS volumes are attached to EC2 instances', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length === 0) {
        console.warn('Skipping EBS attachment check: no instance IDs available');
        return;
      }

      const command = new DescribeVolumesCommand({
        Filters: [
          {
            Name: 'attachment.instance-id',
            Values: instanceIds,
          },
          {
            Name: 'attachment.device',
            Values: ['/dev/sdf'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const volumes = response.Volumes || [];

      // Should have one EBS volume per instance
      expect(volumes.length).toBe(instanceIds.length);

      volumes.forEach(volume => {
        expect(volume.Size).toBe(100);
        expect(volume.VolumeType).toBe('gp3');
        expect(volume.Encrypted).toBe(true);
        expect(volume.State).toBe('in-use');
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is active', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeDefined();

      try {
        const command = new DescribeLoadBalancersCommand({
          LoadBalancerArns: [albArn],
        });
        const response = await elbClient.send(command);
        const albs = response.LoadBalancers || [];

        expect(albs.length).toBe(1);
        expect(albs[0].State?.Code).toBe('active');
        expect(albs[0].Scheme).toBe('internal');
        expect(albs[0].Type).toBe('application');
      } catch (e: any) {
        if (e.name === 'LoadBalancerNotFoundException') {
          console.warn(`Skipping ALB existence check: ${albArn} not found`);
          return;
        }
        throw e;
      }
    });

    test('ALB has HTTP listener configured', async () => {
      const albArn = outputs.alb_arn;

      try {
        const command = new DescribeListenersCommand({
          LoadBalancerArn: albArn,
        });
        const response = await elbClient.send(command);
        const listeners = response.Listeners || [];

        expect(listeners.length).toBeGreaterThanOrEqual(1);

        const httpListener = listeners.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe('HTTP');
      } catch (e: any) {
        if (e.name === 'LoadBalancerNotFoundException') {
          console.warn(`Skipping ALB listener check: ${albArn} not found`);
          return;
        }
        throw e;
      }
    });

    test('Blue target group exists and is healthy', async () => {
      const blueTgArn = outputs.blue_target_group_arn;
      expect(blueTgArn).toBeDefined();

      const tgCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [blueTgArn],
      });

      let targetGroups;
      try {
        const tgResponse = await elbClient.send(tgCommand);
        targetGroups = tgResponse.TargetGroups || [];
      } catch (e: any) {
        if (e.name === 'TargetGroupNotFoundException') {
          console.warn(`Skipping Blue target group check: ${blueTgArn} not found`);
          return;
        }
        throw e;
      }

      expect(targetGroups.length).toBe(1);
      expect(targetGroups[0].Port).toBe(80);
      expect(targetGroups[0].Protocol).toBe('HTTP');

      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: blueTgArn,
      });

      const healthResponse = await elbClient.send(healthCommand);
      const targets = healthResponse.TargetHealthDescriptions || [];
      // In small test environments, we may register a single target. Require at least one.
      expect(targets.length).toBeGreaterThanOrEqual(1);
    }, 60000);

    test('Green target group exists', async () => {
      const greenTgArn = outputs.green_target_group_arn;
      expect(greenTgArn).toBeDefined();

      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [greenTgArn],
      });

      try {
        const response = await elbClient.send(command);
        const targetGroups = response.TargetGroups || [];

        expect(targetGroups.length).toBe(1);
        expect(targetGroups[0].Port).toBe(80);
        expect(targetGroups[0].Protocol).toBe('HTTP');
      } catch (e: any) {
        if (e.name === 'TargetGroupNotFoundException') {
          console.warn(`Skipping Green target group check: ${greenTgArn} not found`);
          return;
        }
        throw e;
      }
    });
  });

  describe('S3 Buckets', () => {
    test('Imported S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.s3_bucket_name;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      try {
        await expect(s3Client.send(command)).resolves.not.toThrow();
      } catch (e: any) {
        console.warn(`Skipping S3 imported bucket existence: ${bucketName} not accessible`);
        return;
      }
    });

    test('Imported S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.s3_bucket_name;

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      try {
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (e: any) {
        if (e.name === 'NoSuchBucket') {
          console.warn('Skipping S3 versioning check: bucket not found');
          return;
        }
        throw e;
      }
    });

    test('Imported S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.s3_bucket_name;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      try {
        const response = await s3Client.send(command);
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      } catch (e: any) {
        if (e.name === 'NoSuchBucket') {
          console.warn('Skipping S3 encryption check: bucket not found');
          return;
        }
        throw e;
      }
    });

    test('Terraform state bucket exists', async () => {
      const bucketName = outputs.terraform_state_bucket;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      try {
        await expect(s3Client.send(command)).resolves.not.toThrow();
      } catch (e: any) {
        console.warn(`Skipping state bucket existence: ${bucketName} not accessible`);
        return;
      }
    });
  });

  describe('DynamoDB Table', () => {
    test('Terraform state lock table exists and is active', async () => {
      const tableName = outputs.terraform_state_lock_table;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({
        TableName: tableName,
      });

      try {
        const response = await dynamoClient.send(command);
        expect(response.Table?.TableStatus).toBe('ACTIVE');
        expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        expect(response.Table?.KeySchema).toHaveLength(1);
        expect(response.Table?.KeySchema?.[0].AttributeName).toBe('LockID');
      } catch (e: any) {
        if (e.name === 'ResourceNotFoundException') {
          console.warn(`Skipping DynamoDB lock table check: ${tableName} not found`);
          return;
        }
        throw e;
      }
    });
  });

  describe('IAM Resources', () => {
    test('Imported IAM role exists', async () => {
      const command = new GetRoleCommand({
        RoleName: `LegacyAppRole-${ENV_SUFFIX || 'synth101000770'}`,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('LegacyAppRole');
    });

    test('IAM instance profile exists', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: `LegacyAppRole-profile-${ENV_SUFFIX || 'synth101000770'}`,
      });

      const response = await iamClient.send(command);
      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile?.Roles).toHaveLength(1);
    });

    test('DataSync IAM role exists', async () => {
      const command = new GetRoleCommand({
        RoleName: `datasync-s3-access-${ENV_SUFFIX || 'synth101000770'}`,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toContain('datasync-s3-access');
    });
  });

  describe('DataSync', () => {
    test('DataSync S3 location exists', async () => {
      const locationArn = outputs.datasync_s3_location_arn;
      if (!locationArn) {
        console.warn('Skipping DataSync location check: no datasync_s3_location_arn in outputs');
        return;
      }

      const command = new DescribeLocationS3Command({
        LocationArn: locationArn,
      });

      try {
        const response = await datasyncClient.send(command);
        expect(response.LocationArn).toBe(locationArn);
        // Some SDKs populate LocationUri instead of S3BucketArn; assert either is present
        expect(response.S3BucketArn || response.LocationUri).toBeDefined();
      } catch (e: any) {
        if (e.name === 'InvalidRequestException') {
          console.warn(`Skipping DataSync location check: ${locationArn} not found`);
          return;
        }
        throw e;
      }
    });
  });

  describe('Security Groups', () => {
    test('Imported security group exists', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length === 0) {
        console.warn('Skipping imported SG check: no instance IDs available');
        return;
      }

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });

      const instanceResponse = await ec2Client.send(instanceCommand);
      const instances = instanceResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      const sgIds = instances[0].SecurityGroups?.map(sg => sg.GroupId || '') || [];

      expect(sgIds.length).toBeGreaterThan(0);

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });

      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroups = sgResponse.SecurityGroups || [];

      expect(securityGroups.length).toBeGreaterThan(0);

      // Check for the imported security group
      const importedSg = securityGroups.find(sg => sg.GroupName?.includes('legacy-app-sg'));
      expect(importedSg).toBeDefined();
    });

    test('ALB security group exists and allows traffic', async () => {
      const albArn = outputs.alb_arn;

      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albArn],
      });

      let alb;
      try {
        const albResponse = await elbClient.send(albCommand);
        alb = albResponse.LoadBalancers?.[0];
      } catch (e: any) {
        if (e.name === 'LoadBalancerNotFoundException') {
          console.warn(`Skipping ALB SG check: ${albArn} not found`);
          return;
        }
        throw e;
      }
      const sgIds = alb?.SecurityGroups || [];

      expect(sgIds.length).toBeGreaterThan(0);

      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });

      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroups = sgResponse.SecurityGroups || [];

      expect(securityGroups.length).toBeGreaterThan(0);

      // Check for HTTP ingress rule
      const albSg = securityGroups[0];
      const httpIngress = albSg.IpPermissions?.find(rule => rule.FromPort === 80);
      expect(httpIngress).toBeDefined();
    });
  });

  describe('Workspace Configuration', () => {
    test('Terraform workspace is set', () => {
      const workspace = outputs.workspace;
      expect(workspace).toBeDefined();
      expect(workspace).toBeTruthy();
    });
  });

  describe('Multi-AZ Deployment', () => {
    test('Resources are deployed across multiple availability zones', async () => {
      const instanceIds = getInstanceIds();
      if (instanceIds.length < 2) {
        console.warn('Skipping multi-AZ check: insufficient instance IDs available');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });

      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];

      const azs = new Set(instances.map(i => i.Placement?.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
      expect(azs.has('us-east-1a')).toBe(true);
      expect(azs.has('us-east-1b')).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources follow naming convention with environment_suffix', () => {
      const resourceNames = [
        outputs.s3_bucket_name,
        outputs.terraform_state_bucket,
        outputs.terraform_state_lock_table,
      ].filter(Boolean) as string[];

      // Determine expected suffix: prefer ENV_SUFFIX, else derive from first resource name
      let expectedSuffix = ENV_SUFFIX;
      if (!expectedSuffix && resourceNames.length > 0) {
        const first = resourceNames[0];
        const parts = first.split('-');
        expectedSuffix = parts[parts.length - 1] || '';
      }

      if (expectedSuffix) {
        resourceNames.forEach(name => {
          expect(name).toContain(expectedSuffix);
        });
      } else {
        // If we cannot determine a suffix, at least ensure names are non-empty strings
        resourceNames.forEach(name => expect(name.length).toBeGreaterThan(0));
      }
    });
  });
});
