import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      projectName: 'tap-financial-services',
      environmentSuffix: environmentSuffix,
      officeCidr: '10.0.0.0/8',
      devOpsEmail: 'devops@example.com',
      dbUsername: 'admin',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Resources', () => {
    test('should create VPC', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create CloudTrail S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-financial-services-${environmentSuffix}-cloudtrail-logs`,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create RDS database', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: `tap-financial-services-${environmentSuffix}-database`,
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        MultiAZ: true,
        DeletionProtection: false,
      });
    });

    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `tap-financial-services-${environmentSuffix}-alerts`,
        DisplayName: 'DevOps Alerts',
      });
    });

    test('should create EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
      });
    });

    test('should create CloudTrail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `tap-financial-services-${environmentSuffix}-cloudtrail`,
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      });
    });

    test('should create application data S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-financial-services-${environmentSuffix}-app-data`,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have VPC ID output', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });
    });

    test('should have database endpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('should have CloudTrail bucket name output', () => {
      template.hasOutput('CloudTrailBucketName', {
        Description: 'CloudTrail S3 Bucket Name',
      });
    });

    test('should have alerts topic ARN output', () => {
      template.hasOutput('AlertsTopicArn', {
        Description: 'SNS Topic ARN for Alerts',
      });
    });

    test('should have web instance IDs output', () => {
      template.hasOutput('WebInstanceIds', {
        Description: 'Web Server Instance IDs',
      });
    });

    test('should have CloudTrail ARN output', () => {
      template.hasOutput('CloudTrailArn', {
        Description: 'CloudTrail ARN',
      });
    });

    test('should have app data bucket name output', () => {
      template.hasOutput('AppDataBucketName', {
        Description: 'Application Data S3 Bucket Name',
      });
    });

    test('should have instance profile ARN output', () => {
      template.hasOutput('InstanceProfileArn', {
        Description: 'EC2 Instance Profile ARN',
      });
    });
  });
});
