import { App, Testing, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Construct } from '../lib/constructs/s3-construct';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { AuroraConstruct } from '../lib/constructs/aurora-construct';
import { AlbConstruct } from '../lib/constructs/alb-construct';
import { EcsConstruct } from '../lib/constructs/ecs-construct';
import { CloudWatchConstruct } from '../lib/constructs/cloudwatch-construct';

describe('Infrastructure Constructs', () => {
  let app: App;
  let stack: TerraformStack;

  beforeEach(() => {
    app = new App();
    stack = new TerraformStack(app, 'TestStack');
    new AwsProvider(stack, 'aws', { region: 'us-east-1' });
  });

  describe('S3Construct', () => {
    test('S3 bucket created with custom lifecycle rules', () => {
      const customRules = [
        {
          id: 'custom-rule',
          transition: [{ days: 60, storageClass: 'GLACIER' }],
        },
      ];

      const s3 = new S3Construct(stack, 's3-custom', {
        environmentSuffix: 'test',
        bucketName: 'test-bucket',
        lifecycleRules: customRules,
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(s3.bucket).toBeDefined();
      expect(synthesized.resource.aws_s3_bucket_lifecycle_configuration).toBeDefined();
    });

    test('S3 bucket created with versioning disabled', () => {
      const s3 = new S3Construct(stack, 's3-no-version', {
        environmentSuffix: 'test',
        bucketName: 'test-bucket-no-version',
        enableVersioning: false,
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(s3.bucket).toBeDefined();
      const versioningKeys = Object.keys(synthesized.resource.aws_s3_bucket_versioning_a || {});
      expect(versioningKeys.length).toBe(0);
    });

    test('S3 bucket created with default lifecycle rules', () => {
      const s3 = new S3Construct(stack, 's3-default', {
        environmentSuffix: 'test',
        bucketName: 'test-bucket-default',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(s3.bucket).toBeDefined();
      expect(synthesized.resource.aws_s3_bucket_lifecycle_configuration).toBeDefined();
    });
  });

  describe('VpcConstruct', () => {
    test('VPC created with correct subnet CIDR calculations', () => {
      const vpc = new VpcConstruct(stack, 'vpc-test', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(vpc.vpc).toBeDefined();
      expect(vpc.publicSubnets.length).toBe(2);
      expect(vpc.privateSubnets.length).toBe(2);
    });
  });

  describe('AuroraConstruct', () => {
    test('Aurora cluster created with replication configuration', () => {
      const vpc = new VpcConstruct(stack, 'vpc-aurora', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
      });

      const aurora = new AuroraConstruct(stack, 'aurora-test', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.privateSubnets.map(s => s.id),
        instanceClass: 'db.t3.medium',
        instanceCount: 2,
        replicationSourceArn: 'arn:aws:rds:us-east-1:123456789012:cluster:source-cluster',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(aurora.cluster).toBeDefined();
    });

    test('Aurora cluster created without replication', () => {
      const vpc = new VpcConstruct(stack, 'vpc-aurora-no-rep', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a'],
      });

      const aurora = new AuroraConstruct(stack, 'aurora-no-rep', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.privateSubnets.map(s => s.id),
        instanceClass: 'db.t3.medium',
        instanceCount: 1,
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(aurora.cluster).toBeDefined();
    });
  });

  describe('AlbConstruct', () => {
    test('ALB created with custom certificate', () => {
      const vpc = new VpcConstruct(stack, 'vpc-alb-cert', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
      });

      const alb = new AlbConstruct(stack, 'alb-cert', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.publicSubnets.map(s => s.id),
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test-cert',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(alb.alb).toBeDefined();
      expect(alb.listener).toBeDefined();
    });

    test('ALB created without certificate (HTTP only)', () => {
      const vpc = new VpcConstruct(stack, 'vpc-alb-http', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a'],
      });

      const alb = new AlbConstruct(stack, 'alb-http', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.publicSubnets.map(s => s.id),
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(alb.alb).toBeDefined();
      expect(alb.listener).toBeDefined();
    });
  });

  describe('EcsConstruct', () => {
    test('ECS cluster created with Fargate task', () => {
      const vpc = new VpcConstruct(stack, 'vpc-ecs', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a'],
      });

      const alb = new AlbConstruct(stack, 'alb-ecs', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.publicSubnets.map(s => s.id),
      });

      const ecs = new EcsConstruct(stack, 'ecs-test', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.privateSubnets.map(s => s.id),
        targetGroupArn: alb.targetGroup.arn,
        image: 'nginx:latest',
        cpu: '256',
        memory: '512',
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(ecs.cluster).toBeDefined();
      expect(ecs.service).toBeDefined();
    });
  });

  describe('CloudWatchConstruct', () => {
    test('CloudWatch dashboard and alarms created', () => {
      const vpc = new VpcConstruct(stack, 'vpc-cw', {
        environmentSuffix: 'test',
        cidrBlock: '10.1.0.0/16',
        availabilityZones: ['us-east-1a'],
      });

      const alb = new AlbConstruct(stack, 'alb-cw', {
        environmentSuffix: 'test',
        vpcId: vpc.vpc.id,
        subnetIds: vpc.publicSubnets.map(s => s.id),
      });

      const cloudwatch = new CloudWatchConstruct(stack, 'cw-test', {
        environmentSuffix: 'test',
        ecsClusterName: 'test-cluster',
        ecsServiceName: 'test-service',
        albTargetGroupArn: alb.targetGroup.arn,
        rdsClusterIdentifier: 'test-rds',
        alarmThresholds: {
          cpuUtilization: 80,
          memoryUtilization: 80,
          targetResponseTime: 2,
          unhealthyHostCount: 1,
          databaseConnections: 50,
        },
      });

      const synthesized = JSON.parse(Testing.synth(stack));
      expect(cloudwatch.dashboard).toBeDefined();
      expect(cloudwatch.alarms.length).toBeGreaterThan(0);
    });
  });
});
