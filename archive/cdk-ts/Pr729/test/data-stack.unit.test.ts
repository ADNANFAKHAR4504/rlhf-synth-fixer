import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { DataStack } from '../lib/data-stack';

describe('DataStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let vpc: ec2.Vpc;
  let kmsKey: kms.Key;
  let cloudTrailBucket: s3.Bucket;
  let stack: DataStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    
    vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    kmsKey = new kms.Key(parentStack, 'TestKey');
    
    cloudTrailBucket = new s3.Bucket(parentStack, 'TestBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
    });

    stack = new DataStack(parentStack, 'TestDataStack', {
      environmentSuffix,
      vpc,
      kmsKey,
      cloudTrailBucket,
    });
    
    template = Template.fromStack(stack);
  });

  describe('RDS Database', () => {
    test('creates RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: Match.stringLikeRegexp(`${environmentSuffix}-subnet-group`),
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('creates RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: Match.stringLikeRegexp(`${environmentSuffix}-database`),
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('RDS uses MySQL engine', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: Match.stringLikeRegexp('8\\.0.*'),
      });
    });

    test('RDS has proper backup configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: true,
        DeletionProtection: false,
      });
    });

    test('RDS uses isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
      });
    });

    test('RDS has deletion policy set to destroy', () => {
      const resources = template.findResources('AWS::RDS::DBInstance');
      Object.values(resources).forEach(resource => {
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('S3 Application Bucket', () => {
    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`${environmentSuffix}-app-bucket`),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              }),
            }),
          ]),
        }),
      });
    });

    test('S3 bucket blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('S3 bucket has lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'IntelligentTiering',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: 1,
                }),
              ]),
            }),
          ]),
        }),
      });
    });

    test('S3 bucket has auto-delete enabled', () => {
      // Check for custom resource that handles bucket deletion
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
        BucketName: Match.anyValue(),
      });
    });

    test('S3 bucket policy denies public PUT operations', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyPublicPutObject',
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: Match.arrayWith([
                's3:PutObject',
                's3:PutObjectAcl',
                's3:DeleteObject',
              ]),
            }),
          ]),
        }),
      });
    });

    test('S3 bucket policy has condition for AWS services', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: Match.objectLike({
                StringNotEquals: {
                  'aws:PrincipalServiceName': Match.arrayWith([
                    'ec2.amazonaws.com',
                    'lambda.amazonaws.com',
                  ]),
                },
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Data Protection', () => {
    test('all data resources use KMS encryption', () => {
      // Check RDS
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });

      // Check S3
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
      });
    });
  });
});