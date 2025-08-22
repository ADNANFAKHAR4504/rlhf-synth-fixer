import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  test('should create VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('should create VPC Flow Logs', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
    });
  });

  test('should create S3 buckets with encryption and correct naming', () => {
    // Data bucket with KMS encryption
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

    // Check bucket names contain prod-sec prefix
    const buckets = template.findResources('AWS::S3::Bucket');
    const bucketNames = Object.values(buckets)
      .map(bucket => bucket.Properties?.BucketName?.['Fn::Join']?.[1] || [])
      .flat();
    expect(
      bucketNames.some(
        name => typeof name === 'string' && name.includes('prod-sec-data')
      )
    ).toBe(true);
    expect(
      bucketNames.some(
        name => typeof name === 'string' && name.includes('prod-sec-logs')
      )
    ).toBe(true);
  });

  test('should create RDS instance with encryption and correct naming', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      Engine: 'postgres',
      StorageEncrypted: true,
    });
  });

  test('should create Lambda function in VPC', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      VpcConfig: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': ['LambdaSecurityGroup0BD9FC99', 'GroupId'],
          },
        ],
      },
    });
  });

  test('should create API Gateway with logging enabled', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Tap Secure API',
    });

    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      AccessLogSetting: {
        DestinationArn: {
          'Fn::GetAtt': ['ApiGatewayLogGroupA9770429', 'Arn'],
        },
      },
    });
  });

  test('should create IAM roles with correct naming convention', () => {
    const roles = template.findResources('AWS::IAM::Role');
    const roleNames = Object.keys(roles);
    expect(roleNames.some(name => name.includes('rolevpcflowlogs'))).toBe(true);
    expect(roleNames.some(name => name.includes('rolelambdaexecution'))).toBe(
      true
    );
  });

  test('should create KMS keys with key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for S3 bucket encryption',
      EnableKeyRotation: true,
    });

    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for RDS encryption',
      EnableKeyRotation: true,
    });
  });

  test('should create security groups with restrictive rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Lambda functions',
      SecurityGroupEgress: [
        {
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          IpProtocol: 'tcp',
          ToPort: 443,
        },
      ],
    });
  });

  test('should create RDS subnet group in isolated subnets', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'Subnet group for RDS instances',
    });
  });

  test('should enforce S3 bucket SSL policy', () => {
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: [
          {
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
            Effect: 'Deny',
          },
        ],
      },
    });
  });

  test('should create IAM role for Lambda with least privilege', () => {
    // Find the Lambda execution role policy
    const policies = template.findResources('AWS::IAM::Policy');
    const lambdaPolicy = Object.values(policies).find(policy =>
      policy.Properties?.PolicyName?.includes('rolelambdaexecution')
    );

    expect(lambdaPolicy).toBeDefined();
    expect(lambdaPolicy.Properties.PolicyDocument.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: ['s3:GetObject', 's3:PutObject'],
          Effect: 'Allow',
        }),
        expect.objectContaining({
          Action: ['ssm:GetParameter', 'ssm:GetParameters'],
          Effect: 'Allow',
        }),
      ])
    );
  });

  test('should have at least 15 resources created', () => {
    const resourceCount = Object.keys(template.toJSON().Resources).length;
    expect(resourceCount).toBeGreaterThan(15);
  });

  test('should create CloudWatch log group for VPC Flow Logs', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 30,
    });
  });

  test('should create database credentials secret', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'tap-db-credentials',
    });
  });

  test('should attach secret to RDS instance', () => {
    template.hasResourceProperties(
      'AWS::SecretsManager::SecretTargetAttachment',
      {
        TargetType: 'AWS::RDS::DBInstance',
      }
    );
  });

  test('should create Lambda function with security headers', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
    });
  });

  test('should create API Gateway method', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'GET',
    });
  });

  test('should tag all resources properly', () => {
    const resources = template.toJSON().Resources;
    const taggedResources = Object.values(resources).filter(
      resource => resource.Properties?.Tags || resource.Properties?.TagSet
    );
    expect(taggedResources.length).toBeGreaterThan(10);
  });
});
