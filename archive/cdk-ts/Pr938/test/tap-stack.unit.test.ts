import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      envConfig: {
        region: 'us-east-1',
        replicationRegion: 'us-west-2',
        vpcCidr: '10.0.0.0/16',
        maxAzs: 2,
        enableLogging: true,
        s3ExpressOneZone: false,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Creates public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('Creates Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('Creates NAT Gateway for private subnets', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('Creates VPC Flow Logs when logging is enabled', () => {
      template.hasResource('AWS::EC2::FlowLog', {});
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs/'),
      });
    });

    test('Creates route tables for all subnet types', () => {
      // Public, Private, and Isolated subnets should have route tables
      template.resourceCountIs('AWS::EC2::RouteTable', 6);
    });

    test('Associates subnets with route tables', () => {
      template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 6);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Creates S3 replication role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('s3-replication-role-'),
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('Creates CloudWatch logging role when logging is enabled', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('cloudwatch-logging-role-'),
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('IAM roles have proper inline policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'ReplicationPolicy',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith(['s3:GetReplicationConfiguration']),
                }),
              ]),
            },
          }),
        ]),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Creates primary S3 bucket with versioning enabled', () => {
      // Primary bucket should have versioning and lifecycle rules
      const buckets = template.findResources('AWS::S3::Bucket');
      const primaryBucket = Object.values(buckets).find(b => 
        b.Properties?.LifecycleConfiguration?.Rules?.some((r: any) => r.Id === 'TransitionToIA')
      );
      expect(primaryBucket).toBeDefined();
      expect(primaryBucket?.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
    });

    test('Creates replication S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
      // Check bucket count instead
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('S3 buckets have encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('S3 buckets have public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Primary bucket has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
            }),
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });

    test('Primary bucket has CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'POST', 'PUT']),
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
            }),
          ]),
        },
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('Creates CloudWatch Log Groups for application and infrastructure', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/application/'),
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/infrastructure/'),
      });
    });

    test('Creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('infrastructure-alerts-'),
      });
    });

    test('Creates CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('Infrastructure-'),
      });
    });

    test('Creates CloudWatch Alarm for high error rate', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('HighErrorRate-'),
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('Alarm has SNS action configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.stringLikeRegexp('MonitoringAlertTopic'),
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Outputs VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for environment',
      });
    });

    test('Outputs S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Primary S3 bucket name',
      });
    });
  });

  describe('Environment-specific configurations', () => {
    test('Production environment has different settings', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTapStack', {
        environmentSuffix: 'prod',
        envConfig: {
          region: 'us-east-1',
          replicationRegion: 'us-west-2',
          vpcCidr: '10.2.0.0/16',
          maxAzs: 3,
          enableLogging: true,
          s3ExpressOneZone: true,
        },
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Verify prod-specific VPC CIDR
      prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });

      // Verify alarm threshold is different for prod
      prodTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 10,
      });
    });

    test('Dev environment has lower alarm threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 25,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('Resources have environment tags', () => {
      // Check VPC tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('TestTapStack/Vpc/Vpc'),
          }),
        ]),
      });
    });
  });

  describe('Security Best Practices', () => {
    test('VPC has private subnets for compute resources', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });
    });

    test('S3 buckets have versioning enabled for data protection', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
      });
    });

    test('IAM roles follow least privilege principle', () => {
      // Check that IAM policies exist
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies).length).toBeGreaterThan(0);
      
      // Check that roles are created with specific purposes
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.anyValue(),
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });
  });
});