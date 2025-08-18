import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack (Unit)', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: { environmentSuffix },
    });
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('creates one VPC', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('creates KMS Key with key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('creates three S3 buckets with KMS encryption and block public access', () => {
    template.resourceCountIs('AWS::S3::Bucket', 3);
    const buckets = template.findResources('AWS::S3::Bucket');
    Object.values(buckets).forEach((b: any) => {
      expect(b.Properties).toEqual(
        expect.objectContaining({
          BucketEncryption: expect.objectContaining({
            ServerSideEncryptionConfiguration: expect.arrayContaining([
              expect.objectContaining({
                ServerSideEncryptionByDefault: expect.objectContaining({
                  SSEAlgorithm: 'aws:kms',
                }),
              }),
            ]),
          }),
          PublicAccessBlockConfiguration: expect.objectContaining({
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          }),
        })
      );
    });
  });

  test('creates Application Load Balancer (internet-facing) and HTTP listener', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Scheme: 'internet-facing',
        Type: 'application',
      }
    );
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('Target Group listens on 8080', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 8080,
      Protocol: 'HTTP',
      TargetType: 'instance',
    });
  });

  test('Auto Scaling Group with desired capacity and health check', () => {
    template.hasResourceProperties(
      'AWS::AutoScaling::AutoScalingGroup',
      Match.objectLike({
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      })
    );
  });

  test('RDS PostgreSQL Multi-AZ with encryption and backups', () => {
    template.hasResourceProperties(
      'AWS::RDS::DBInstance',
      Match.objectLike({
        Engine: 'postgres',
        MultiAZ: true,
        DeletionProtection: false,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
      })
    );
  });

  test('CloudWatch alarms for ASG CPU, ALB 5xx, and RDS CPU exist', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
  });

  test('CodePipeline with S3 Source and CodeBuild stages exists', () => {
    template.hasResourceProperties(
      'AWS::CodePipeline::Pipeline',
      Match.objectLike({
        Stages: Match.arrayWith([
          Match.objectLike({ Name: 'Source' }),
          Match.objectLike({ Name: 'Build' }),
        ]),
      })
    );
  });

  test('Route53 health check and failover record are created when domain context provided', () => {
    const app2 = new cdk.App({
      context: {
        environmentSuffix,
        domainName: 'app.example.com',
        hostedZoneId: 'Z123456EXAMPLE',
      },
    });
    const stack2 = new TapStack(app2, 'TestTapStackR53', {
      environmentSuffix,
      isPrimaryRegion: true,
    });
    const t2 = Template.fromStack(stack2);

    t2.resourceCountIs('AWS::Route53::HealthCheck', 1);
    t2.hasResourceProperties(
      'AWS::Route53::RecordSet',
      Match.objectLike({
        Failover: 'PRIMARY',
        Type: 'A',
      })
    );
  });
});
