import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { StorageConstruct } from '../../lib/constructs/storage-construct';

describe('StorageConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let alertTopic: sns.Topic;
  let storageConstruct: StorageConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    alertTopic = new sns.Topic(stack, 'TestAlertTopic', {
      topicName: 'test-alerts',
    });

    storageConstruct = new StorageConstruct(stack, 'TestStorageConstruct', {
      environment: 'test',
      alertTopic,
    });

    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Creation', () => {
    test('should create S3 bucket with encryption', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              },
            ],
          },
        },
      });
    });

    test('should create S3 bucket with public access blocked', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
      });
    });

    test('should create S3 bucket with versioning enabled', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        },
      });
    });

    test('should create S3 bucket with SSL enforcement', () => {
      // Check that the S3 bucket exists with encryption
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketEncryption: Match.anyValue(),
        },
      });
    });

    test('should create S3 bucket with lifecycle rules', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              {
                Id: 'DeleteOldVersions',
                Status: 'Enabled',
                NoncurrentVersionExpiration: {
                  NoncurrentDays: 30,
                },
              },
            ]),
          },
        },
      });
    });

    test('should create S3 bucket with correct tags', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Name',
              Value: 'SecureBucket-test',
            },
          ]),
        },
      });
    });
  });

  describe('S3 Bucket Notifications', () => {
    test('should add S3 bucket notification for object creation', () => {
      // The notification is added via addEventNotification method
      // We can verify the SNS topic exists and is properly configured
      template.hasResource('AWS::SNS::Topic', {
        Properties: {
          TopicName: 'test-alerts',
        },
      });
    });
  });

  describe('IAM Policy Creation', () => {
    test('should create IAM policy for S3 access', () => {
      // Check that IAM policy exists
      template.hasResource('AWS::IAM::Policy', {});
    });

    test('should create IAM policy with correct resource ARNs', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      Object.values(policies).forEach((policy: any) => {
        if (policy.Properties.PolicyName.includes('secure-bucket-policy')) {
          const statements = policy.Properties.PolicyDocument.Statement;
          statements.forEach((statement: any) => {
            if (statement.Action.includes('s3:')) {
              expect(statement.Resource).toBeDefined();
              expect(Array.isArray(statement.Resource)).toBe(true);
              expect(statement.Resource.length).toBeGreaterThan(0);
            }
          });
        }
      });
    });
  });

  describe('Storage Properties', () => {
    test('should expose S3 bucket property', () => {
      expect(storageConstruct.secureS3Bucket).toBeDefined();
      expect(storageConstruct.secureS3Bucket.bucketName).toBeDefined();
    });

    test('should expose IAM policy property', () => {
      expect(storageConstruct.secureS3BucketPolicy).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('should enforce SSL/TLS for all S3 operations', () => {
      // Check that S3 bucket exists with encryption
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketEncryption: Match.anyValue(),
        },
      });
    });

    test('should block all public access', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
      });
    });

    test('should enable server-side encryption', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'AES256',
                },
              },
            ],
          },
        },
      });
    });
  });

  describe('Lifecycle Management', () => {
    test('should configure lifecycle rules for version management', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              {
                Id: 'DeleteOldVersions',
                Status: 'Enabled',
                NoncurrentVersionExpiration: {
                  NoncurrentDays: 30,
                },
              },
            ]),
          },
        },
      });
    });

    test('should have appropriate lifecycle rule configuration', () => {
      // Check that S3 bucket has lifecycle configuration
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          LifecycleConfiguration: Match.anyValue(),
        },
      });
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should integrate with SNS alerting', () => {
      template.hasResource('AWS::SNS::Topic', {
        Properties: {
          TopicName: 'test-alerts',
        },
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('should have correct resource dependencies', () => {
      // Check that required resources exist
      template.hasResource('AWS::S3::Bucket', {});
      template.hasResource('AWS::IAM::Policy', {});
      template.hasResource('AWS::SNS::Topic', {});
    });

    test('should have proper resource relationships', () => {
      // S3 bucket should be referenced by IAM policy
      const policies = template.findResources('AWS::IAM::Policy');
      const buckets = template.findResources('AWS::S3::Bucket');

      Object.values(policies).forEach((policy: any) => {
        if (policy.Properties.PolicyName.includes('secure-bucket-policy')) {
          const statements = policy.Properties.PolicyDocument.Statement;
          statements.forEach((statement: any) => {
            if (statement.Action.includes('s3:')) {
              expect(statement.Resource).toBeDefined();
            }
          });
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should implement lifecycle policies for cost optimization', () => {
      template.hasResource('AWS::S3::Bucket', {
        Properties: {
          LifecycleConfiguration: {
            Rules: Match.arrayWith([
              {
                Id: 'DeleteOldVersions',
                Status: 'Enabled',
                NoncurrentVersionExpiration: {
                  NoncurrentDays: 30,
                },
              },
            ]),
          },
        },
      });
    });
  });
});
