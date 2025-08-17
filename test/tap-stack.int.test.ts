// tests/integration/tap-stack.int.test.ts
import AWS from 'aws-sdk';
import fs from 'fs';

// Load CFN outputs produced by your deployment pipeline
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));

// Ensure SDK has a region (env wins; fallback parses from a known ARN)
const parsedRegion =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  (outputs.CloudTrailLogGroupArn ? outputs.CloudTrailLogGroupArn.split(':')[3] : undefined) ||
  'us-east-1';

AWS.config.update({ region: parsedRegion });

// AWS SDK v2 clients
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const cloudtrail = new AWS.CloudTrail();
const logs = new AWS.CloudWatchLogs();
const sns = new AWS.SNS();

// Helper: fetch exact log group by name
async function getLogGroupByName(name: string) {
  const resp = await logs.describeLogGroups({ logGroupNamePrefix: name }).promise();
  return resp.logGroups?.find((g) => g.logGroupName === name);
}

// Helper: find SG by Name tag containing a needle
function findSgByNameTag(securityGroups: AWS.EC2.SecurityGroupList, needle: string) {
  return securityGroups.find((sg) =>
    (sg.Tags || []).some((t) => t.Key === 'Name' && typeof t.Value === 'string' && t.Value.includes(needle))
  );
}

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and have correct configuration', async () => {
      expect(outputs.VpcId).toBeDefined();

      const vpc = await ec2.describeVpcs({ VpcIds: [outputs.VpcId] }).promise();
      expect(vpc.Vpcs).toHaveLength(1);
      expect(vpc.Vpcs![0].State).toBe('available');

      // DNS attributes (via DescribeVpcAttribute)
      const [dnsHostnames, dnsSupport] = await Promise.all([
        ec2.describeVpcAttribute({ VpcId: outputs.VpcId, Attribute: 'enableDnsHostnames' }).promise(),
        ec2.describeVpcAttribute({ VpcId: outputs.VpcId, Attribute: 'enableDnsSupport' }).promise(),
      ]);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });

    test('Public subnets should exist in different AZs and auto-assign public IPs', async () => {
      expect(outputs.PublicSubnetIds).toBeDefined();
      const publicSubnetIds: string[] = outputs.PublicSubnetIds.split(',');
      expect(publicSubnetIds).toHaveLength(2);

      const subnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
      expect(subnets.Subnets).toHaveLength(2);

      const azs = subnets.Subnets!.map((s) => s.AvailabilityZone!);
      expect(new Set(azs).size).toBe(2);

      // Check MapPublicIpOnLaunch directly from DescribeSubnets payload
      subnets.Subnets!.forEach((s) => {
        expect(s.State).toBe('available');
        expect(s.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Private subnets should exist in different AZs and not auto-assign public IPs', async () => {
      expect(outputs.PrivateSubnetIds).toBeDefined();
      const privateSubnetIds: string[] = outputs.PrivateSubnetIds.split(',');
      expect(privateSubnetIds).toHaveLength(2);

      const subnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
      expect(subnets.Subnets).toHaveLength(2);

      const azs = subnets.Subnets!.map((s) => s.AvailabilityZone!);
      expect(new Set(azs).size).toBe(2);

      subnets.Subnets!.forEach((s) => {
        expect(s.State).toBe('available');
        expect(s.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('EC2 Instances', () => {
    test('Bastion instance should be running in public subnet', async () => {
      expect(outputs.BastionInstanceId).toBeDefined();

      const instances = await ec2.describeInstances({ InstanceIds: [outputs.BastionInstanceId] }).promise();
      expect(instances.Reservations).toHaveLength(1);
      expect(instances.Reservations![0].Instances).toHaveLength(1);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.State!.Name).toBe('running');

      // Public IP expected in public subnet
      expect(instance.PublicIpAddress).toBeDefined();

      const publicSubnetIds: string[] = outputs.PublicSubnetIds.split(',');
      expect(publicSubnetIds).toContain(instance.SubnetId!);
    });

    test('Application instance should be running in private subnet (no public IP)', async () => {
      expect(outputs.AppInstanceId).toBeDefined();

      const instances = await ec2.describeInstances({ InstanceIds: [outputs.AppInstanceId] }).promise();
      expect(instances.Reservations).toHaveLength(1);
      expect(instances.Reservations![0].Instances).toHaveLength(1);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.State!.Name).toBe('running');
      expect(instance.PublicIpAddress).toBeUndefined();

      const privateSubnetIds: string[] = outputs.PrivateSubnetIds.split(',');
      expect(privateSubnetIds).toContain(instance.SubnetId!);
    });

    test('Both instances should have encrypted EBS volumes', async () => {
      const instanceIds = [outputs.BastionInstanceId, outputs.AppInstanceId];

      for (const instanceId of instanceIds) {
        const resp = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
        const inst = resp.Reservations![0].Instances![0];

        expect(inst.BlockDeviceMappings!.length).toBeGreaterThanOrEqual(1);
        const volumeIds = inst.BlockDeviceMappings!.map((m) => m.Ebs!.VolumeId!);

        const volumes = await ec2.describeVolumes({ VolumeIds: volumeIds }).promise();
        volumes.Volumes!.forEach((v) => {
          expect(v.Encrypted).toBe(true);
          expect(v.KmsKeyId).toBeDefined();
        });
      }
    });
  });

  describe('S3 Buckets', () => {
    test('Application data bucket should exist with proper encryption, public access block, and versioning', async () => {
      expect(outputs.AppDataBucketName).toBeDefined();

      const buckets = await s3.listBuckets().promise();
      const bucketExists = (buckets.Buckets || []).some((b) => b.Name === outputs.AppDataBucketName);
      expect(bucketExists).toBe(true);

      const encryption = await s3.getBucketEncryption({ Bucket: outputs.AppDataBucketName }).promise();
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!;
      expect(rule.SSEAlgorithm).toBe('aws:kms');
      expect(rule.KMSMasterKeyID).toBeDefined();

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: outputs.AppDataBucketName }).promise();
      const pab = publicAccess.PublicAccessBlockConfiguration!;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const versioning = await s3.getBucketVersioning({ Bucket: outputs.AppDataBucketName }).promise();
      expect(versioning.Status).toBe('Enabled');
    });

    test('CloudTrail logs bucket should exist with proper encryption, public access block, and versioning', async () => {
      expect(outputs.TrailLogsBucketName).toBeDefined();

      const buckets = await s3.listBuckets().promise();
      const bucketExists = (buckets.Buckets || []).some((b) => b.Name === outputs.TrailLogsBucketName);
      expect(bucketExists).toBe(true);

      const encryption = await s3.getBucketEncryption({ Bucket: outputs.TrailLogsBucketName }).promise();
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!;
      expect(rule.SSEAlgorithm).toBe('aws:kms');
      expect(rule.KMSMasterKeyID).toBeDefined();

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: outputs.TrailLogsBucketName }).promise();
      const pab = publicAccess.PublicAccessBlockConfiguration!;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const versioning = await s3.getBucketVersioning({ Bucket: outputs.TrailLogsBucketName }).promise();
      expect(versioning.Status).toBe('Enabled');
    });
  });

  describe('KMS Keys', () => {
    test('Data KMS key should exist with rotation enabled', async () => {
      expect(outputs.DataKmsKeyArn).toBeDefined();

      const keyId = outputs.DataKmsKeyArn.split('/')[1];
      const key = await kms.describeKey({ KeyId: keyId }).promise();

      expect(key.KeyMetadata!.KeyState).toBe('Enabled');
      expect(key.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeyMetadata!.KeySpec).toBe('SYMMETRIC_DEFAULT');

      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });

    test('Logs KMS key should exist with rotation enabled', async () => {
      expect(outputs.LogsKmsKeyArn).toBeDefined();

      const keyId = outputs.LogsKmsKeyArn.split('/')[1];
      const key = await kms.describeKey({ KeyId: keyId }).promise();

      expect(key.KeyMetadata!.KeyState).toBe('Enabled');
      expect(key.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeyMetadata!.KeySpec).toBe('SYMMETRIC_DEFAULT');

      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyId }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('CloudTrail should be active and logging', async () => {
      expect(outputs.CloudTrailName).toBeDefined();

      const trails = await cloudtrail.describeTrails({ trailNameList: [outputs.CloudTrailName] }).promise();
      expect(trails.trailList).toHaveLength(1);

      const trail = trails.trailList![0];
      expect(trail.S3BucketName).toBe(outputs.TrailLogsBucketName);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(false);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.KmsKeyId).toBeDefined(); // use typed property

      const status = await cloudtrail.getTrailStatus({ Name: outputs.CloudTrailName }).promise();
      expect(status.IsLogging).toBe(true);
    });

    test('CloudWatch log group should exist with KMS encryption and retention', async () => {
      expect(outputs.CloudTrailLogGroupArn).toBeDefined();

      const logGroupName = outputs.CloudTrailLogGroupArn.split(':log-group:')[1];
      const lg = await getLogGroupByName(logGroupName);
      expect(lg).toBeDefined();
      expect(lg!.logGroupName).toBe(logGroupName);
      expect(lg!.kmsKeyId).toBeDefined();
      expect(lg!.retentionInDays).toBe(90);
    });

    test('SNS alert topic should exist with KMS encryption (subscription optional)', async () => {
      expect(outputs.AlertTopicArn).toBeDefined();

      const topicAttributes = await sns.getTopicAttributes({ TopicArn: outputs.AlertTopicArn }).promise();
      expect(topicAttributes.Attributes!.KmsMasterKeyId).toBeDefined();

      if (process.env.REQUIRE_SNS_SUBSCRIPTION === 'true') {
        const subs = await sns.listSubscriptionsByTopic({ TopicArn: outputs.AlertTopicArn }).promise();
        expect(subs.Subscriptions!.some((s) => s.Protocol === 'email')).toBe(true);
      }
    });
  });

  describe('Security Compliance', () => {
    test('All resources should have consistent tagging (spot-check VPC + EC2s)', async () => {
      const vpc = await ec2.describeVpcs({ VpcIds: [outputs.VpcId] }).promise();
      const vpcTags = vpc.Vpcs![0].Tags || [];

      expect(vpcTags.find((t) => t.Key === 'Project')).toBeDefined();
      expect(vpcTags.find((t) => t.Key === 'Environment')).toBeDefined();
      expect(vpcTags.find((t) => t.Key === 'Region')).toBeDefined();
      expect(vpcTags.find((t) => t.Key === 'Owner')?.Value).toBe('Security');

      const instances = await ec2
        .describeInstances({ InstanceIds: [outputs.BastionInstanceId, outputs.AppInstanceId] })
        .promise();

      instances.Reservations!.forEach((r) =>
        r.Instances!.forEach((inst) => {
          const tags = inst.Tags || [];
          expect(tags.find((t) => t.Key === 'Project')).toBeDefined();
          expect(tags.find((t) => t.Key === 'Environment')).toBeDefined();
          expect(tags.find((t) => t.Key === 'Region')).toBeDefined();
          expect(tags.find((t) => t.Key === 'Owner')?.Value).toBe('Security');
          expect(tags.find((t) => t.Key === 'DataClassification')?.Value).toBe('Confidential');
        })
      );
    });

    test('Security groups should have minimal required access', async () => {
      const securityGroups = await ec2
        .describeSecurityGroups({ Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }] })
        .promise();

      const bastionSG = findSgByNameTag(securityGroups.SecurityGroups!, 'bastion-sg');
      const appSG = findSgByNameTag(securityGroups.SecurityGroups!, 'app-sg');

      expect(bastionSG).toBeDefined();
      expect(appSG).toBeDefined();

      // Bastion: SSH from CIDR only
      expect(bastionSG!.IpPermissions!.length).toBe(1);
      expect(bastionSG!.IpPermissions![0].IpProtocol).toBe('tcp');
      expect(bastionSG!.IpPermissions![0].FromPort).toBe(22);
      expect(bastionSG!.IpPermissions![0].ToPort).toBe(22);

      // App: SSH only from Bastion SG
      expect(appSG!.IpPermissions!.length).toBe(1);
      expect(appSG!.IpPermissions![0].IpProtocol).toBe('tcp');
      expect(appSG!.IpPermissions![0].FromPort).toBe(22);
      expect(appSG!.IpPermissions![0].ToPort).toBe(22);
      expect(appSG!.IpPermissions![0].UserIdGroupPairs![0].GroupId).toBe(bastionSG!.GroupId);
    });
  });

  describe('Network Connectivity', () => {
    test('Private route table should send 0.0.0.0/0 to a NAT Gateway', async () => {
      const routeTables = await ec2
        .describeRouteTables({ Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }] })
        .promise();

      const privateRt = routeTables.RouteTables!.find((rt) =>
        (rt.Tags || []).some((t) => t.Key === 'Name' && (t.Value || '').includes('private-rt'))
      );
      expect(privateRt).toBeDefined();

      const natRoute = privateRt!.Routes!.find(
        (r) => r.DestinationCidrBlock === '0.0.0.0/0' && !!r.NatGatewayId
      );
      expect(natRoute).toBeDefined();
    });

    test('Public route table should send 0.0.0.0/0 to the Internet Gateway', async () => {
      const routeTables = await ec2
        .describeRouteTables({ Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }] })
        .promise();

      const publicRt = routeTables.RouteTables!.find((rt) =>
        (rt.Tags || []).some((t) => t.Key === 'Name' && (t.Value || '').includes('public-rt'))
      );
      expect(publicRt).toBeDefined();

      const igwRoute = publicRt!.Routes!.find(
        (r) => r.DestinationCidrBlock === '0.0.0.0/0' && (r.GatewayId || '').startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();
    });
  });
});
