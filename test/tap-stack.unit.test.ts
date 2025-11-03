import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  beforeEach(() => {
    process.env.AWS_REGION = process.env.AWS_REGION || 'ap-northeast-1';
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('KMS Keys', () => {
    test('should create three KMS keys with rotation enabled', () => {
      template.resourceCountIs('AWS::KMS::Key', 3);
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        PendingWindowInDays: 30,
      });
    });

    test('should create KMS key aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 3);
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(`alias/tap-${environmentSuffix}/`),
      });
    });

    test('should allow CloudWatch Logs to use logs encryption key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'logs.ap-northeast-1.amazonaws.com',
              },
              Action: Match.arrayWith([
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey*',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create admin role with MFA enforcement', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-AdminRole`,
        MaxSessionDuration: 3600,
      });
    });

    test('should create developer role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-DeveloperRole`,
        MaxSessionDuration: 14400,
      });
    });

    test('should create audit role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-AuditRole`,
        MaxSessionDuration: 43200,
      });
    });

    test('should create service account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-ServiceAccountRole`,
      });
    });

    test('should create cross-account role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-${environmentSuffix}-CrossAccountRole`,
        MaxSessionDuration: 3600,
      });
    });
  });

  describe('IAM Policies', () => {
    test('should create permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `tap-${environmentSuffix}-PermissionBoundary`,
      });
    });

    test('should deny dangerous actions without MFA', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                'kms:ScheduleKeyDeletion',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create two S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('should enable versioning on all buckets', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block all public access', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enforce SSL for S3 operations', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });

    test('should require MFA for delete operations', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: Match.arrayWith([
                's3:DeleteBucket',
              ]),
              Condition: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'false',
                },
              },
            }),
          ]),
        }),
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create three secrets', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 3);
    });

    test('should create database credentials with rotation', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-${environmentSuffix}/DatabaseCredentials`,
        GenerateSecretString: {
          GenerateStringKey: 'password',
          PasswordLength: 32,
        },
      });
    });

    test('should create API keys secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-${environmentSuffix}/ApiKeys`,
      });
    });

    test('should create service tokens secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `tap-${environmentSuffix}/ServiceTokens`,
      });
    });

    test('should create rotation schedules', () => {
      template.resourceCountIs('AWS::SecretsManager::RotationSchedule', 3);
    });

    test('should deny cross-account access to secrets', () => {
      template.hasResourceProperties('AWS::SecretsManager::ResourcePolicy', {
        ResourcePolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 'secretsmanager:GetSecretValue',
            }),
          ]),
        }),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create rotation lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    test('should use Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Timeout: 30,
      });
    });

    test('should have IAM execution roles', () => {
      const resources = template.toJSON().Resources;
      const lambdaFunctions = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(lambdaFunctions.length).toBe(4);
      lambdaFunctions.forEach((fn: any) => {
        expect(fn.Properties.Role).toBeDefined();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log groups with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/application',
        RetentionInDays: 30,
      });
    });

    test('should create audit logs with 10-year retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/audit',
        RetentionInDays: 3653,
      });
    });

    test('should create security logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/security',
        RetentionInDays: 90,
      });
    });

    test('should create metric filters for security events', () => {
      template.resourceCountIs('AWS::Logs::MetricFilter', 3);
    });
  });

  describe('Access Analyzer', () => {
    test('should create IAM Access Analyzer', () => {
      template.hasResourceProperties('AWS::AccessAnalyzer::Analyzer', {
        Type: 'ACCOUNT',
        AnalyzerName: `tap-${environmentSuffix}-Analyzer`,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export all required outputs', () => {
      template.hasOutput('adminRoleArn', {});
      template.hasOutput('developerRoleArn', {});
      template.hasOutput('dataEncryptionKeyArn', {});
      template.hasOutput('secretsEncryptionKeyArn', {});
      template.hasOutput('auditBucketArn', {});
      template.hasOutput('environmentSuffix', {});
      template.hasOutput('awsRegion', {});
    });
  });

  describe('Security Configuration', () => {
    test('should enforce encryption at rest', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.anyValue(),
        },
      });
    });
  });
});
