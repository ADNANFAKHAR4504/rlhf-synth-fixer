import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { CiCdPipelineStack } from '../lib/cicd-pipeline-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('CiCdPipelineStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: CiCdPipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'TestParentStack');
    stack = new CiCdPipelineStack(parentStack, 'TestCiCdPipelineStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should create S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('should create S3 bucket with public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'cleanup-old-versions',
              Status: 'Enabled',
              ExpirationInDays: 90,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp(`CI/CD encryption key for ${environmentSuffix}`),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('should create database connection parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/cicd/${environmentSuffix}/db-connection`,
        Type: 'String',
      });
    });

    test('should create application composer config parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/cicd/${environmentSuffix}/app-composer-config`,
        Type: 'String',
      });
    });
  });

  describe('CloudWatch', () => {
    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `cicd-dashboard-${environmentSuffix}`,
      });
    });
  });

  describe('CloudWatch Log Group', () => {
    test('should create CloudWatch log group with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/cicd/secure-pipeline-${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('IAM Role', () => {
    test('should create deployment role with service principals', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `CiCdSecureDeploymentRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codebuild.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ]),
        },
      });
    });

    test('should create CodeCatalyst integration role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `CodeCatalyst-Integration-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                Service: 'codecatalyst.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ]),
        },
      });
    });
  });
});
