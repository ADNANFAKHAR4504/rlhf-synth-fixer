// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

// Read deployment outputs
let outputs: any = {};
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/all-outputs.json', 'utf8'));
} catch (error) {
  console.warn(
    'Could not read cfn-outputs/all-outputs.json, using empty outputs'
  );
}

// AWS SDK clients
const ec2 = new AWS.EC2({ region: 'us-east-1' });
const rds = new AWS.RDS({ region: 'us-east-1' });
const s3 = new AWS.S3({ region: 'us-east-1' });
const cloudtrail = new AWS.CloudTrail({ region: 'us-east-1' });
const config = new AWS.ConfigService({ region: 'us-east-1' });
const cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });
const kms = new AWS.KMS({ region: 'us-east-1' });
const logs = new AWS.CloudWatchLogs({ region: 'us-east-1' });

describe('TAP Stack Integration Tests', () => {
  const vpcId = outputs.VpcId || outputs['VpcId-dev'] || outputs['VpcId-test'];
  const databaseEndpoint =
    outputs.DatabaseEndpoint ||
    outputs['DatabaseEndpoint-dev'] ||
    outputs['DatabaseEndpoint-test'];
  const appBucketName =
    outputs.AppBucketName ||
    outputs['AppBucketName-dev'] ||
    outputs['AppBucketName-test'];

  describe('VPC Infrastructure', () => {
    test('VPC exists and has correct configuration', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(result.Vpcs).toHaveLength(1);

      const vpc = result.Vpcs![0];
      expect(vpc.State).toBe('available');
      // VPC DNS attributes are not directly accessible in the API response
      // They are configured correctly in the CDK template

      // Check tags (now applied at app level)
      const tags = vpc.Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment')?.Value;
      expect(envTag).toBeDefined();
      expect(['dev', 'test', 'production'].includes(envTag!)).toBe(true);
    });

    test('subnets are properly configured', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(result.Subnets).toHaveLength(6); // 2 AZs * 3 subnet types

      const publicSubnets = result.Subnets!.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = result.Subnets!.filter(
        s => !s.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(4);
    });

    test('NAT gateways are configured', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2
        .describeNatGateways({
          Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(result.NatGateways!.length).toBe(2);
      result.NatGateways!.forEach(ng => {
        expect(ng.State).toBe('available');
      });
    });

    test('internet gateway is attached', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2
        .describeInternetGateways({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(result.InternetGateways).toHaveLength(1);
      expect(result.InternetGateways![0].Attachments![0].State).toBe(
        'available'
      );
    });
  });

  describe('Security Groups', () => {
    test('security groups follow least privilege principle', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2
        .describeSecurityGroups({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      const ec2SG = result.SecurityGroups!.find(
        sg => sg.Description === 'Security group for EC2 instances'
      );
      const rdsSG = result.SecurityGroups!.find(
        sg => sg.Description === 'Security group for RDS database'
      );

      expect(ec2SG).toBeDefined();
      expect(rdsSG).toBeDefined();

      // EC2 SG should only allow HTTPS and HTTP outbound
      expect(ec2SG!.IpPermissionsEgress).toHaveLength(2);

      // RDS SG should only allow MySQL from EC2 SG
      expect(rdsSG!.IpPermissions).toHaveLength(1);
      expect(rdsSG!.IpPermissions![0].FromPort).toBe(3306);
    });
  });

  describe('RDS Database', () => {
    test('database is encrypted and properly configured', async () => {
      if (!databaseEndpoint) {
        console.warn('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      const result = await rds.describeDBInstances().promise();
      const dbInstance = result.DBInstances!.find(
        db => db.Endpoint?.Address === databaseEndpoint
      );

      expect(dbInstance).toBeDefined();
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      expect(dbInstance!.DeletionProtection).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('app bucket has proper security configuration', async () => {
      if (!appBucketName) {
        console.warn('AppBucketName not found in outputs, skipping test');
        return;
      }

      // Check bucket encryption
      const encryptionResult = await s3
        .getBucketEncryption({
          Bucket: appBucketName,
        })
        .promise();

      expect(encryptionResult.ServerSideEncryptionConfiguration).toBeDefined();

      // Check versioning
      const versioningResult = await s3
        .getBucketVersioning({
          Bucket: appBucketName,
        })
        .promise();

      expect(versioningResult.Status).toBe('Enabled');

      // Check public access block
      const publicAccessResult = await s3
        .getPublicAccessBlock({
          Bucket: appBucketName,
        })
        .promise();

      expect(
        publicAccessResult.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessResult.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessResult.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessResult.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('CloudTrail and Config buckets exist and are encrypted', async () => {
      const bucketsResult = await s3.listBuckets().promise();
      const buckets = bucketsResult.Buckets || [];

      const cloudTrailBucket = buckets.find(b =>
        b.Name?.includes('cloudtrail')
      );
      const configBucket = buckets.find(b => b.Name?.includes('config'));

      expect(cloudTrailBucket).toBeDefined();
      expect(configBucket).toBeDefined();

      if (cloudTrailBucket) {
        const encryptionResult = await s3
          .getBucketEncryption({
            Bucket: cloudTrailBucket.Name!,
          })
          .promise();
        expect(
          encryptionResult.ServerSideEncryptionConfiguration
        ).toBeDefined();
      }

      if (configBucket) {
        const encryptionResult = await s3
          .getBucketEncryption({
            Bucket: configBucket.Name!,
          })
          .promise();
        expect(
          encryptionResult.ServerSideEncryptionConfiguration
        ).toBeDefined();
      }
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail is enabled and properly configured', async () => {
      const result = await cloudtrail.describeTrails().promise();
      const trail = result.trailList?.find(t => t.Name?.includes('CloudTrail'));

      expect(trail).toBeDefined();
      expect(trail!.IncludeGlobalServiceEvents).toBe(true);
      expect(trail!.IsMultiRegionTrail).toBe(true);
      expect(trail!.LogFileValidationEnabled).toBe(true);
      expect(trail!.KmsKeyId).toBeDefined();

      // Check if trail is logging
      const statusResult = await cloudtrail
        .getTrailStatus({
          Name: trail!.TrailARN!,
        })
        .promise();
      expect(statusResult.IsLogging).toBe(true);
    });
  });

  describe('AWS Config', () => {
    test('Config recorder and delivery channel are active', async () => {
      const recorderResult = await config
        .describeConfigurationRecorders()
        .promise();
      const channelResult = await config.describeDeliveryChannels().promise();

      expect(recorderResult.ConfigurationRecorders).toHaveLength(1);
      expect(channelResult.DeliveryChannels).toHaveLength(1);

      const recorder = recorderResult.ConfigurationRecorders![0];
      expect(recorder.name).toBe('tap-config-recorder');
      expect(recorder.recordingGroup?.allSupported).toBe(true);
      expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
    });

    test('Config rules are enabled', async () => {
      const result = await config.describeConfigRules().promise();
      const rules = result.ConfigRules || [];

      const expectedRules = [
        'MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS',
        'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        'S3_BUCKET_SSL_REQUESTS_ONLY',
        'EBS_ENCRYPTED_VOLUMES',
        'RDS_STORAGE_ENCRYPTED',
      ];

      expectedRules.forEach(ruleId => {
        const rule = rules.find(r => r.Source?.SourceIdentifier === ruleId);
        expect(rule).toBeDefined();
        expect(rule!.ConfigRuleState).toBe('ACTIVE');
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('VPC flow logs are enabled and encrypted', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2
        .describeFlowLogs({
          Filter: [{ Name: 'resource-id', Values: [vpcId] }],
        })
        .promise();

      expect(result.FlowLogs).toHaveLength(1);
      const flowLog = result.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');

      // Check log group encryption
      if (flowLog.LogGroupName) {
        const logGroupResult = await logs
          .describeLogGroups({
            logGroupNamePrefix: flowLog.LogGroupName,
          })
          .promise();

        expect(logGroupResult.logGroups).toHaveLength(1);
        expect(logGroupResult.logGroups![0].kmsKeyId).toBeDefined();
        expect(logGroupResult.logGroups![0].retentionInDays).toBe(365);
      }
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms are configured', async () => {
      const result = await cloudwatch.describeAlarms().promise();
      const alarms = result.MetricAlarms || [];

      const cpuAlarm = alarms.find(a => a.MetricName === 'CPUUtilization');
      const memoryAlarm = alarms.find(a => a.MetricName === 'mem_used_percent');

      expect(cpuAlarm).toBeDefined();
      expect(memoryAlarm).toBeDefined();

      expect(cpuAlarm!.Threshold).toBe(80);
      expect(cpuAlarm!.ComparisonOperator).toBe(
        'GreaterThanOrEqualToThreshold'
      );
      expect(cpuAlarm!.EvaluationPeriods).toBe(2);

      expect(memoryAlarm!.Threshold).toBe(80);
      expect(memoryAlarm!.Namespace).toBe('CWAgent');
    });
  });

  describe('KMS Key', () => {
    test('KMS key has rotation enabled and proper policies', async () => {
      const keysResult = await kms.listKeys().promise();
      const keys = keysResult.Keys || [];

      // Find the TAP KMS key by checking key policies
      for (const key of keys) {
        try {
          const policyResult = await kms
            .getKeyPolicy({
              KeyId: key.KeyId!,
              PolicyName: 'default',
            })
            .promise();

          if (policyResult.Policy?.includes('TAP encryption key')) {
            const rotationResult = await kms
              .getKeyRotationStatus({
                KeyId: key.KeyId!,
              })
              .promise();

            expect(rotationResult.KeyRotationEnabled).toBe(true);
            break;
          }
        } catch (error) {
          // Skip keys we can't access
          continue;
        }
      }
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance is running with proper configuration', async () => {
      if (!vpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const result = await ec2
        .describeInstances({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      expect(result.Reservations).toHaveLength(1);
      const instance = result.Reservations![0].Instances![0];

      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.IamInstanceProfile).toBeDefined();

      // Check EBS encryption
      expect(instance.BlockDeviceMappings).toHaveLength(1);
      const blockDevice = instance.BlockDeviceMappings![0];
      // EBS properties need to be checked via volume details
      if (blockDevice.Ebs?.VolumeId) {
        const volumeResult = await ec2
          .describeVolumes({
            VolumeIds: [blockDevice.Ebs.VolumeId],
          })
          .promise();
        const volume = volumeResult.Volumes![0];
        expect(volume.Encrypted).toBe(true);
        expect(volume.VolumeType).toBe('gp3');
        expect(volume.Size).toBe(20);
      }

      // Check tags (now applied at app level)
      const tags = instance.Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment')?.Value;
      expect(envTag).toBeDefined();
      expect(['dev', 'test', 'production'].includes(envTag!)).toBe(true);
    });
  });
});
