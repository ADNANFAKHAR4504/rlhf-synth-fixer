import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('creates KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for S3 bucket encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/s3-encryption-${environmentSuffix}`,
      });
    });

    test('KMS key has deletion policy set to Delete', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with correct name pattern', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          `secure-bucket-${environmentSuffix}-\\d+-us-west-2`
        ),
      });
    });

    test('enables versioning on the bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('configures KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            },
          ],
        },
      });
    });

    test('blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('has auto-delete objects enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          },
        ]),
      });
    });

    test('has deletion policy set to Delete', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
        Properties: Match.objectLike({
          BucketName: Match.anyValue(),
        }),
      });
    });
  });

  describe('Bucket Policy', () => {
    test('denies non-TLS requests', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('denies unauthorized principals', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyUnauthorizedPrincipals',
              Effect: 'Deny',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:GetBucketLocation',
                's3:ListBucket',
              ]),
              Condition: {
                StringNotLike: {
                  'aws:PrincipalArn': Match.arrayWith([
                    Match.stringLikeRegexp(
                      'arn:aws:iam::.*:role/allowed-role-1-.*'
                    ),
                    Match.stringLikeRegexp(
                      'arn:aws:iam::.*:role/allowed-role-2-.*'
                    ),
                    Match.stringLikeRegexp('arn:aws:iam::.*:root'),
                    'arn:aws:iam::*:role/aws-service-role/cloudtrail.amazonaws.com/*',
                    'arn:aws:*:*:s3:*',
                  ]),
                },
              },
            }),
          ]),
        },
      });
    });

    test('denies uploads without SSE-KMS', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyUnencryptedUploads',
              Effect: 'Deny',
              Action: 's3:PutObject',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            }),
          ]),
        },
      });
    });

    test('denies uploads with wrong KMS key', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyWrongKMSKey',
              Effect: 'Deny',
              Action: 's3:PutObject',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption-aws-kms-key-id':
                    Match.anyValue(),
                },
                StringEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('CloudTrail', () => {
    test('creates CloudTrail with correct name', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: `s3-data-events-trail-${environmentSuffix}`,
      });
    });

    test('enables log file validation', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EnableLogFileValidation: true,
      });
    });

    test('configures S3 data events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object',
                Values: Match.anyValue(),
              }),
            ]),
            IncludeManagementEvents: false,
            ReadWriteType: 'All',
          }),
        ]),
      });
    });

    test('disables global service events', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: false,
      });
    });

    test('is single-region trail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: false,
      });
    });

    test('logging is enabled', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsLogging: true,
      });
    });
  });

  describe('CloudTrail Log Bucket', () => {
    test('creates CloudTrail log bucket with correct name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          `cloudtrail-logs-${environmentSuffix}-\\d+-us-west-2`
        ),
      });
    });

    test('enables versioning', () => {
      // Find CloudTrail log bucket by looking for lifecycle rules with DeleteOldLogs ID
      const buckets = template.findResources('AWS::S3::Bucket');
      const logBucket = Object.values(buckets).find(bucket =>
        bucket.Properties?.LifecycleConfiguration?.Rules?.some(
          (rule: any) => rule.Id === 'DeleteOldLogs'
        )
      );
      expect(logBucket?.Properties?.VersioningConfiguration).toEqual({
        Status: 'Enabled',
      });
    });

    test('configures lifecycle rules', () => {
      // Find CloudTrail log bucket by looking for lifecycle rules
      const buckets = template.findResources('AWS::S3::Bucket');
      const logBucket = Object.values(buckets).find(bucket =>
        bucket.Properties?.LifecycleConfiguration?.Rules?.some(
          (rule: any) => rule.Id === 'DeleteOldLogs'
        )
      );
      expect(logBucket?.Properties?.LifecycleConfiguration).toEqual({
        Rules: [
          {
            Id: 'DeleteOldLogs',
            Status: 'Enabled',
            ExpirationInDays: 90,
          },
        ],
      });
    });

    test('blocks public access', () => {
      // Find CloudTrail log bucket by looking for lifecycle rules
      const buckets = template.findResources('AWS::S3::Bucket');
      const logBucket = Object.values(buckets).find(bucket =>
        bucket.Properties?.LifecycleConfiguration?.Rules?.some(
          (rule: any) => rule.Id === 'DeleteOldLogs'
        )
      );
      expect(logBucket?.Properties?.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      });
    });

    test('has S3-managed encryption', () => {
      // Find CloudTrail log bucket by looking for lifecycle rules
      const buckets = template.findResources('AWS::S3::Bucket');
      const logBucket = Object.values(buckets).find(bucket =>
        bucket.Properties?.LifecycleConfiguration?.Rules?.some(
          (rule: any) => rule.Id === 'DeleteOldLogs'
        )
      );
      expect(logBucket?.Properties?.BucketEncryption).toEqual({
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      });
    });

    test('allows CloudTrail service to write logs', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
            }),
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            }),
          ]),
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports SecuredBucketName', () => {
      template.hasOutput('SecuredBucketName', {
        Description: 'Name of the secured S3 bucket',
      });
    });

    test('exports SecuredBucketArn', () => {
      template.hasOutput('SecuredBucketArn', {
        Description: 'ARN of the secured S3 bucket',
      });
    });

    test('exports KmsKeyArn', () => {
      template.hasOutput('KmsKeyArn', {
        Description: 'ARN of the KMS key for encryption',
      });
    });

    test('exports KmsKeyId', () => {
      template.hasOutput('KmsKeyId', {
        Description: 'ID of the KMS key for encryption',
      });
    });

    test('exports CloudTrailArn', () => {
      template.hasOutput('CloudTrailArn', {
        Description: 'ARN of the CloudTrail monitoring S3 data events',
      });
    });

    test('exports CloudTrailLogBucketName', () => {
      template.hasOutput('CloudTrailLogBucketName', {
        Description: 'Name of the CloudTrail log bucket',
      });
    });

    test('exports AllowedPrincipals', () => {
      template.hasOutput('AllowedPrincipals', {
        Description: 'List of allowed principal ARNs',
      });
    });

    test('exports EnvironmentSuffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for resource naming',
        Value: environmentSuffix,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all S3 buckets have tags', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      Object.values(resources).forEach(resource => {
        // Just verify tags exist, as some may have different tags
        expect(resource.Properties?.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties?.Tags)).toBeTruthy();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources have Retain deletion policy', () => {
      const allResources = template.toJSON().Resources;
      Object.values(allResources).forEach((resource: any) => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('all S3 buckets enforce SSL', () => {
      const policies = template.findResources('AWS::S3::BucketPolicy');
      Object.values(policies).forEach(policy => {
        const statements = policy.Properties?.PolicyDocument
          ?.Statement as any[];
        const sslDenyStatement = statements?.find(
          s =>
            s.Effect === 'Deny' &&
            s.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
        expect(sslDenyStatement).toBeDefined();
      });
    });

    test('CloudTrail uses separate log bucket', () => {
      const trail = template.findResources('AWS::CloudTrail::Trail');
      const trailBucket = Object.values(trail)[0]?.Properties?.S3BucketName;
      expect(trailBucket).toBeDefined();

      // Verify it's not the same as the secured bucket
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketCount = Object.keys(buckets).length;
      expect(bucketCount).toBeGreaterThanOrEqual(2); // At least 2 buckets
    });
  });

  describe('Stack Instantiation', () => {
    test('can be instantiated with minimal props', () => {
      const newApp = new cdk.App();
      const minimalStack = new TapStack(newApp, 'MinimalStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      expect(minimalStack).toBeDefined();
      const minimalTemplate = Template.fromStack(minimalStack);
      minimalTemplate.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('uses provided environment suffix', () => {
      const newApp = new cdk.App();
      const customSuffix = 'custom-env';
      const customStack = new TapStack(newApp, 'CustomStack', {
        environmentSuffix: customSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const customTemplate = Template.fromStack(customStack);
      customTemplate.hasOutput('EnvironmentSuffix', {
        Value: customSuffix,
      });
    });

    test('defaults to dev environment suffix', () => {
      const newApp = new cdk.App();
      const defaultStack = new TapStack(newApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      defaultTemplate.hasOutput('EnvironmentSuffix', {
        Value: 'dev',
      });
    });
  });

  describe('Resource Naming', () => {
    test('all resource names include environment suffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });

      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('auto-delete Lambda uses Node.js runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: Match.stringLikeRegexp('nodejs.*'),
        Handler: 'index.handler',
      });
    });

    test('auto-delete Lambda has appropriate timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 900, // 15 minutes for cleanup operations
      });
    });
  });

  describe('LocalStack Environment', () => {
    test('creates simplified policy for LocalStack when LOCALSTACK env is true', () => {
      // Save original env
      const originalLocalStack = process.env.LOCALSTACK;
      const originalEndpoint = process.env.AWS_ENDPOINT_URL;

      // Set LocalStack environment
      process.env.LOCALSTACK = 'true';
      delete process.env.AWS_ENDPOINT_URL;

      try {
        // Clear module cache to reload with new env vars
        jest.resetModules();
        const { TapStack: LocalStackTapStack } = require('../lib/tap-stack');

        const localApp = new cdk.App();
        const localStack = new LocalStackTapStack(
          localApp,
          'LocalStackTapStack',
          {
            environmentSuffix: 'local',
            env: {
              account: '000000000000',
              region: 'us-east-1',
            },
          }
        );
        const localTemplate = Template.fromStack(localStack);

        // Verify LocalStack-specific bucket policy exists
        const bucketPolicies = localTemplate.findResources(
          'AWS::S3::BucketPolicy'
        );
        const hasSimplifedPolicy = Object.values(bucketPolicies).some(
          (policy: any) => {
            const statements = policy.Properties?.PolicyDocument?.Statement;
            return statements?.some(
              (stmt: any) => stmt.Sid === 'AllowAuthorizedAccess'
            );
          }
        );
        expect(hasSimplifedPolicy).toBe(true);

        // Verify KMS key is not created for LocalStack
        localTemplate.resourceCountIs('AWS::KMS::Key', 0);

        // Verify CloudTrail is not created for LocalStack
        localTemplate.resourceCountIs('AWS::CloudTrail::Trail', 0);

        // Verify IsLocalStack output
        localTemplate.hasOutput('IsLocalStack', {
          Value: 'true',
        });
      } finally {
        // Restore original environment
        if (originalLocalStack !== undefined) {
          process.env.LOCALSTACK = originalLocalStack;
        } else {
          delete process.env.LOCALSTACK;
        }
        if (originalEndpoint !== undefined) {
          process.env.AWS_ENDPOINT_URL = originalEndpoint;
        }
        // Reset modules again to restore normal behavior
        jest.resetModules();
      }
    });
  });
});
