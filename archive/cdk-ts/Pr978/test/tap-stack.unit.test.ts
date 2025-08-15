import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: testEnvironmentSuffix,
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack with default environment suffix', () => {
    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Check that resources use 'dev' as the default suffix
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('.*dev.*'),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create a VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Public' },
        ]),
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          { Key: 'aws-cdk:subnet-type', Value: 'Private' },
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('should create VPC endpoints for S3 and DynamoDB', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 2);
      
      // S3 endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.s3']],
        },
        VpcEndpointType: 'Gateway',
      });

      // DynamoDB endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: {
          'Fn::Join': ['', ['com.amazonaws.', { Ref: 'AWS::Region' }, '.dynamodb']],
        },
        VpcEndpointType: 'Gateway',
      });
    });
  });

  describe('S3 Bucket Security', () => {
    test('should create S3 bucket with encryption', () => {
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

    test('should enable versioning on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have bucket policy enforcing HTTPS', () => {
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

    test('should have bucket policy restricting to VPC and role', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'RestrictToVPCAndRole',
              Effect: 'Allow',
              Condition: Match.objectLike({
                StringEquals: Match.objectLike({
                  'aws:SourceVpc': Match.anyValue(),
                }),
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              }),
            }),
          ]),
        },
      });
    });

    test('should set removal policy to DESTROY with auto-delete', () => {
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('DynamoDB Table Security', () => {
    test('should create DynamoDB table with KMS encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
          SSEType: 'KMS',
          KMSMasterKeyId: Match.anyValue(),
        },
      });
    });

    test('should enable point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should have correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
      });
    });

    test('should set removal policy to DESTROY', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('KMS Key Configuration', () => {
    test('should create KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: 'KMS key for DynamoDB table encryption',
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/dynamodb-key-trainr640-${testEnvironmentSuffix}`,
      });
    });

    test('should set KMS key removal policy to DESTROY', () => {
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });

  describe('IAM Role and Policies', () => {
    test('should create IAM role for EC2', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
        RoleName: `SecurityAccessRole-trainr640-${testEnvironmentSuffix}`,
      });
    });

    test('should create DynamoDB policy with secure transport condition', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: `DynamoSecurityPolicy-trainr640-${testEnvironmentSuffix}`,
        PolicyDocument: {
          Statement: [
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
          ],
        },
      });
    });

    test('should grant DynamoDB permissions to role', () => {
      // Check that the SecurityAccessRole has a policy with DynamoDB permissions
      const policies = template.findResources('AWS::IAM::Policy');
      const dynamoPermissionsPolicies = Object.values(policies).filter(
        (policy: any) => 
          policy.Properties?.PolicyDocument?.Statement?.some(
            (statement: any) => 
              statement.Action?.some?.((action: string) => action.startsWith('dynamodb:'))
          )
      );
      expect(dynamoPermissionsPolicies.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should create CloudTrail with correct configuration', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsLogging: true,
        EnableLogFileValidation: true,
        IsMultiRegionTrail: true,
        IncludeGlobalServiceEvents: true,
        TrailName: `SecurityAuditTrail-trainr640-${testEnvironmentSuffix}`,
      });
    });

    test('should create CloudTrail S3 bucket', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const cloudTrailBucket = Object.values(buckets).find(
        bucket => bucket.Properties?.BucketName?.includes('cloudtrail-logs')
      );
      expect(cloudTrailBucket).toBeDefined();
    });

    test('should enable CloudWatch Logs for CloudTrail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        CloudWatchLogsLogGroupArn: Match.anyValue(),
        CloudWatchLogsRoleArn: Match.anyValue(),
      });
    });

    test('should add S3 event selector', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.arrayWith([
          Match.objectLike({
            DataResources: Match.arrayWith([
              Match.objectLike({
                Type: 'AWS::S3::Object',
              }),
            ]),
          }),
        ]),
      });
    });
  });

  describe('GuardDuty Configuration', () => {
    test('should enable GuardDuty detector', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
      });
    });

    test('should enable S3 logs in GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        DataSources: {
          S3Logs: {
            Enable: true,
          },
        },
      });
    });

    test('should enable malware protection', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        DataSources: {
          MalwareProtection: {
            ScanEc2InstanceWithFindings: {
              EbsVolumes: true,
            },
          },
        },
      });
    });
  });

  describe('Macie Configuration', () => {
    test('should enable Macie session', () => {
      template.hasResourceProperties('AWS::Macie::Session', {
        Status: 'ENABLED',
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should tag all resources with Environment=Production', () => {
      // Check VPC
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });

      // Check S3 buckets
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
          ])
        );
      });

      // Check DynamoDB table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });

      // Check KMS key
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });

      // Check IAM role
      template.hasResourceProperties('AWS::IAM::Role', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'Production' },
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Name of the secure S3 bucket',
        Export: {
          Name: `S3BucketName-trainr640-${testEnvironmentSuffix}`,
        },
      });
    });

    test('should output DynamoDB table ARN', () => {
      template.hasOutput('DynamoDBTableArn', {
        Description: 'ARN of the secure DynamoDB table',
        Export: {
          Name: `DynamoDBTableArn-trainr640-${testEnvironmentSuffix}`,
        },
      });
    });

    test('should output Security Role ARN', () => {
      template.hasOutput('SecurityRoleArn', {
        Description: 'ARN of the security access role',
        Export: {
          Name: `SecurityRoleArn-trainr640-${testEnvironmentSuffix}`,
        },
      });
    });

    test('should output CloudTrail ARN', () => {
      template.hasOutput('CloudTrailArn', {
        Description: 'ARN of the CloudTrail for audit logging',
        Export: {
          Name: `CloudTrailArn-trainr640-${testEnvironmentSuffix}`,
        },
      });
    });

    test('should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID for secure network access',
        Export: {
          Name: `VPCId-trainr640-${testEnvironmentSuffix}`,
        },
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any resources with Retain deletion policy', () => {
      const allResources = template.toJSON().Resources;
      const retainResources: string[] = [];
      
      Object.entries(allResources).forEach(([key, resource]: [string, any]) => {
        // Skip Lambda functions, custom resources, and CloudWatch log groups (which use Retain by default)
        if (resource.Type && 
            !resource.Type.startsWith('AWS::Lambda::Function') && 
            !resource.Type.startsWith('Custom::') &&
            !resource.Type.startsWith('AWS::Logs::LogGroup') &&
            !resource.Type.startsWith('AWS::IAM::Role')) {
          if (resource.DeletionPolicy === 'Retain') {
            retainResources.push(key);
          }
        }
      });
      
      expect(retainResources).toEqual([]);
    });

    test('should have environment suffix in all resource names', () => {
      // Check S3 bucket names
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        if (bucket.Properties?.BucketName) {
          expect(bucket.Properties.BucketName).toMatch(testEnvironmentSuffix);
        }
      });

      // Check DynamoDB table name
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`),
      });

      // Check CloudTrail name
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        TrailName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`),
      });
    });

    test('should enforce SSL/TLS on all services', () => {
      // S3 bucket policy should deny non-HTTPS
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
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
        },
      });

      // DynamoDB policy should require secure transport
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
          ]),
        },
      });
    });
  });
});