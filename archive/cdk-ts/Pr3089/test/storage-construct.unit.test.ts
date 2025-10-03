import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { StorageConstruct } from '../lib/stacks/storage-stack';

describe('StorageConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
  });

  describe('with default props', () => {
    beforeEach(() => {
      new StorageConstruct(stack, 'TestStorage', {
        prefix: 'test-app',
        environment: 'dev'
      });
      template = Template.fromStack(stack);
    });

    test('creates a KMS key with correct properties', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Encryption key for test-app dev environment',
        EnableKeyRotation: true
      });
    });

    test('creates a KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/test-app-dev-key'
      });
    });

    test('creates an S3 bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms'
            }
          }]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('creates S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              }
            }),
            Match.objectLike({
              Id: 'transition-to-ia',
              Status: 'Enabled',
              Transitions: [{
                StorageClass: 'STANDARD_IA',
                TransitionInDays: 60
              }]
            })
          ])
        }
      });
    });

    test('creates a DynamoDB table with encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-app-metadata-dev',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'N'
          },
          {
            AttributeName: 'status',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });

    test('creates DynamoDB table with GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [{
          IndexName: 'status-index',
          KeySchema: [
            {
              AttributeName: 'status',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }]
      });
    });
  });

  describe('with production environment', () => {
    beforeEach(() => {
      new StorageConstruct(stack, 'TestStorage', {
        prefix: 'prod-app',
        environment: 'production'
      });
      template = Template.fromStack(stack);
    });

    test('creates resources with production naming', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'prod-app-metadata-production'
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/prod-app-production-key'
      });
    });
  });

  describe('construct exports', () => {
    test('exposes public readonly properties', () => {
      const construct = new StorageConstruct(stack, 'TestStorage', {
        prefix: 'test-app',
        environment: 'dev'
      });

      expect(construct.dataBucket).toBeInstanceOf(s3.Bucket);
      expect(construct.metadataTable).toBeInstanceOf(dynamodb.Table);
      expect(construct.encryptionKey).toBeInstanceOf(kms.Key);
    });
  });

  describe('resource count', () => {
    test('creates expected number of resources', () => {
      new StorageConstruct(stack, 'TestStorage', {
        prefix: 'test-app',
        environment: 'dev'
      });
      template = Template.fromStack(stack);

      // Should create: KMS Key, KMS Alias, S3 Bucket, S3 Bucket Policy, DynamoDB Table
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::KMS::Alias', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });
  });
});