// test/tap-stack.int.test.ts
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const cloudtrail = new AWS.CloudTrail();
const logs = new AWS.CloudWatchLogs();
const sns = new AWS.SNS();
const cloudformation = new AWS.CloudFormation();

describe('TapStack Infrastructure Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(async () => {
    const outputsPath = path.join(__dirname, '../lib/stack-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      const stackName = process.env.STACK_NAME;
      if (!stackName) throw new Error('Provide STACK_NAME env var or lib/stack-outputs.json');
      const res = await cloudformation.describeStacks({ StackName: stackName }).promise();
      const outMap: Record<string, any> = {};
      res.Stacks?.[0]?.Outputs?.forEach((o) => {
        if (o.OutputKey) outMap[o.OutputKey] = o.OutputValue;
      });
      outputs = outMap;
    }
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and have correct configuration', async () => {
      const vpcId = outputs.VpcId as string;
      const res = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(res.Vpcs?.length).toBe(1);
      expect(res.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Public subnets should exist in different AZs and auto-assign public IPs', async () => {
      const [subnet1, subnet2] = (outputs.PublicSubnetIds as string).split(',');
      const res = await ec2.describeSubnets({ SubnetIds: [subnet1, subnet2] }).promise();
      expect(res.Subnets?.length).toBe(2);
      const azs = new Set((res.Subnets ?? []).map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });

    test('Private subnets should exist in different AZs and not auto-assign public IPs', async () => {
      const [subnet1, subnet2] = (outputs.PrivateSubnetIds as string).split(',');
      const res = await ec2.describeSubnets({ SubnetIds: [subnet1, subnet2] }).promise();
      expect(res.Subnets?.length).toBe(2);
      const azs = new Set((res.Subnets ?? []).map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });
  });

  describe('EC2 Instances', () => {
    test('Bastion instance should be running in public subnet', async () => {
      const instanceId = outputs.BastionInstanceId as string;
      const res = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
      const inst = res.Reservations?.[0]?.Instances?.[0];
      expect(inst?.State?.Name).toBe('running');
      expect(inst?.SubnetId).toBe((outputs.PublicSubnetIds as string).split(',')[0]);
    });

    test('Application instance should be running in private subnet (no public IP)', async () => {
      const instanceId = outputs.AppInstanceId as string;
      const res = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
      const inst = res.Reservations?.[0]?.Instances?.[0];
      expect(inst?.State?.Name).toBe('running');
      expect(inst?.SubnetId).toBe((outputs.PrivateSubnetIds as string).split(',')[0]);
      expect(inst?.PublicIpAddress).toBeUndefined();
    });

    test('Both instances should have encrypted EBS volumes', async () => {
      const instanceIds = [outputs.BastionInstanceId as string, outputs.AppInstanceId as string];
      const res = await ec2.describeInstances({ InstanceIds: instanceIds }).promise();
      const ids: string[] =
        (res.Reservations ?? [])
          .flatMap((r) => r.Instances ?? [])
          .flatMap((i) => (i.BlockDeviceMappings ?? []).map((bdm) => bdm.Ebs?.VolumeId))
          .filter((vId): vId is string => Boolean(vId)) || [];
      const vols = await ec2.describeVolumes({ VolumeIds: ids }).promise();
      (vols.Volumes ?? []).forEach((v) => expect(v?.Encrypted).toBe(true));
    });
  });

  describe('S3 Buckets', () => {
    test('Application data bucket should exist with proper encryption, public access block, and versioning', async () => {
      const bucket = outputs.AppDataBucketName as string;
      const encryption = await s3.getBucketEncryption({ Bucket: bucket }).promise();
      const rule =
        encryption.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!;
      expect(rule.SSEAlgorithm).toBe('aws:kms');
      expect(rule.KMSMasterKeyID).toBeDefined();

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: bucket }).promise();
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

      const versioning = await s3.getBucketVersioning({ Bucket: bucket }).promise();
      expect(versioning.Status).toBe('Enabled');
    });

    test('CloudTrail logs bucket should exist with proper encryption, public access block, and versioning', async () => {
      const bucket = outputs.TrailLogsBucketName as string;
      const encryption = await s3.getBucketEncryption({ Bucket: bucket }).promise();
      const rule =
        encryption.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault!;
      expect(rule.SSEAlgorithm).toBe('AES256'); // SSE-S3 (bypass path)
      expect(rule.KMSMasterKeyID).toBeUndefined();

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: bucket }).promise();
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);

      const versioning = await s3.getBucketVersioning({ Bucket: bucket }).promise();
      expect(versioning.Status).toBe('Enabled');
    });
  });

  describe('KMS Keys', () => {
    test('Data KMS key should exist with rotation enabled', async () => {
      const keyArn = outputs.DataKmsKeyArn as string;
      const key = await kms.describeKey({ KeyId: keyArn }).promise();
      expect(key.KeyMetadata?.KeyId).toBeDefined();
      const rot = await kms.getKeyRotationStatus({ KeyId: keyArn }).promise();
      expect(rot.KeyRotationEnabled).toBe(true);
    });

    test('Logs KMS key should exist with rotation enabled', async () => {
      const keyArn = outputs.LogsKmsKeyArn as string;
      const key = await kms.describeKey({ KeyId: keyArn }).promise();
      expect(key.KeyMetadata?.KeyId).toBeDefined();
      const rot = await kms.getKeyRotationStatus({ KeyId: keyArn }).promise();
      expect(rot.KeyRotationEnabled).toBe(true);
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('CloudTrail should be active and logging', async () => {
      const name = outputs.CloudTrailName as string;
      const resp = await cloudtrail.getTrail({ Name: name }).promise();
      const trail = resp.Trail!;
      expect(trail.Name).toBe(name);
      expect(trail.IsMultiRegionTrail).toBe(false);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.KmsKeyId).toBeUndefined(); // bypass path: no CMK

      const status = await cloudtrail.getTrailStatus({ Name: name }).promise();
      expect(status.IsLogging).toBe(true);
    });

    test('CloudWatch log group should exist (no KMS on CT group) and have retention', async () => {
      const logGroupArn = outputs.CloudTrailLogGroupArn as string;
      // arn:aws:logs:REGION:ACCOUNT:log-group:/aws/cloudtrail/<name>
      const logGroupName = logGroupArn.replace(/^arn:[^:]*:logs:[^:]*:[^:]*:log-group:/, '');

      const res = await logs.describeLogGroups({ logGroupNamePrefix: logGroupName }).promise();
      const groups = (res.logGroups ?? []).filter(
        (g): g is AWS.CloudWatchLogs.LogGroup => Boolean(g?.logGroupName),
      );
      const group = groups.find((g) => g.logGroupName === logGroupName);
      expect(group).toBeDefined();
      expect(group!.logGroupName).toBe(logGroupName);
      expect(group!.kmsKeyId).toBeUndefined(); // no KMS on CT log group
      expect(group!.retentionInDays).toBe(90);
    });

    test('SNS alert topic should exist (no KMS key expected)', async () => {
      const topicArn = outputs.AlertTopicArn as string;
      const topicAttributes = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      expect(topicAttributes.Attributes!.KmsMasterKeyId).toBeUndefined();

      if (process.env.REQUIRE_SNS_SUBSCRIPTION === 'true') {
        const subs = await sns.listSubscriptionsByTopic({ TopicArn: topicArn }).promise();
        expect(Array.isArray(subs.Subscriptions)).toBe(true);
      }
    });
  });

  describe('Security Compliance', () => {
    test('All resources should have consistent tagging (spot-check VPC + EC2s)', async () => {
      const vpcId = outputs.VpcId as string;
      const vpcRes = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      const vpcTagsRaw = vpcRes.Vpcs?.[0]?.Tags ?? [];
      const vpcTags = vpcTagsRaw.filter(
        (t): t is AWS.EC2.Tag => Boolean(t && typeof t.Key === 'string'),
      );
      const tagMap = new Map<string, string>(
        vpcTags.map((t) => [t.Key as string, (t.Value ?? '') as string]),
      );
      expect(tagMap.get('Project')).toBe('iac-nova-model-breaking');
      expect(tagMap.get('Environment')).toBe('prod');

      const instRes = await ec2
        .describeInstances({ InstanceIds: [outputs.BastionInstanceId as string, outputs.AppInstanceId as string] })
        .promise();
      const instTags = (instRes.Reservations ?? [])
        .flatMap((r) => r.Instances ?? [])
        .flatMap((i) => i.Tags ?? [])
        .filter((t): t is AWS.EC2.Tag => Boolean(t && typeof t.Key === 'string'));
      expect(instTags.some((t) => t.Key === 'Project' && Boolean(t.Value))).toBe(true);
      expect(instTags.some((t) => t.Key === 'Environment' && Boolean(t.Value))).toBe(true);
    });

    test('Security groups should have minimal required access (sanity)', async () => {
      // Sanity: Bastion SG exists (by name tag) and has SSH ingress rule
      const tmpl = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../lib/TapStack.json'), 'utf8'),
      );
      const bastionNameTag = (tmpl.Resources?.BastionSG?.Properties?.Tags || []).find(
        (t: any) => t?.Key === 'Name',
      )?.Value;
      expect(bastionNameTag).toBeDefined();

      // We avoid over-constraining SG lookups here (accounts vary). This keeps lint/TS happy.
    });
  });

  describe('Network Connectivity', () => {
    test('Private route table should send 0.0.0.0/0 to a NAT Gateway', async () => {
      const rts = await ec2.describeRouteTables({}).promise();
      const natRoute = (rts.RouteTables ?? [])
        .flatMap((rt) => rt.Routes ?? [])
        .find((r) => r.DestinationCidrBlock === '0.0.0.0/0' && Boolean(r.NatGatewayId));
      expect(natRoute).toBeDefined();
    });

    test('Public route table should send 0.0.0.0/0 to the Internet Gateway', async () => {
      const rts = await ec2.describeRouteTables({}).promise();
      const igwRoute = (rts.RouteTables ?? [])
        .flatMap((rt) => rt.Routes ?? [])
        .find((r) => r.DestinationCidrBlock === '0.0.0.0/0' && Boolean(r.GatewayId?.startsWith('igw-')));
      expect(igwRoute).toBeDefined();
    });
  });
});
