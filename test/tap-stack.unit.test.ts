import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const testEnvironmentSuffix = 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: testEnvironmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public, private, and database subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 9); // 3 AZs × 3 subnet types
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });
  });

  describe('KMS Keys', () => {
    test('should create S3 KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for S3 bucket encryption',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: { AWS: Match.anyValue() },
              Action: 'kms:*',
              Resource: '*'
            }),
            Match.objectLike({
              Sid: 'Allow CloudTrail to encrypt logs',
              Effect: 'Allow',
              Principal: { Service: 'cloudtrail.amazonaws.com' },
              Action: Match.arrayWith([
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:Encrypt'
              ])
            })
          ])
        })
      });
    });

    test('should create RDS KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for RDS encryption',
        EnableKeyRotation: true
      });
    });

    test('should create CloudWatch KMS key with service permissions', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for CloudWatch Logs encryption',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: { Service: Match.stringLikeRegexp('logs\\..*\\.amazonaws\\.com') }
            })
          ])
        })
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create application bucket with encryption and versioning', () => {
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

    test('should create logs bucket with CloudTrail permissions', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: { Service: 'cloudtrail.amazonaws.com' },
              Action: ['s3:GetBucketAcl', 's3:GetBucketLocation']
            }),
            Match.objectLike({
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: { Service: 'cloudtrail.amazonaws.com' },
              Action: 's3:PutObject',
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with encryption and backup', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.42',
        DBInstanceClass: 'db.t3.micro',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false
      });
    });

    test('should create DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database'
      });
    });

    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS Database credentials',
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\',
          PasswordLength: 32
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions'
      });
    });

    test('should create RDS security group with MySQL ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database'
      });
      
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create API Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        Environment: {
          Variables: Match.objectLike({
            S3_BUCKET: Match.anyValue(),
            DB_SECRET_ARN: Match.anyValue()
          })
        }
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create Lambda execution role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        }
      });

      // Check that the role has VPC access policy
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('.*service-role/AWSLambdaVPCAccessExecutionRole')
              ])
            ])
          })
        ])
      }));
    });

    test('should create IAM user with MFA requirements', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: Match.stringLikeRegexp(`secure-app-user-${testEnvironmentSuffix}-.*`)
      });

      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyAllExceptUnlessMFAAuthenticated',
              Effect: 'Deny',
              Condition: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false'
                }
              }
            })
          ])
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with SSL enforcement', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Secure Application API',
        Description: 'Secure API with SSL/TLS encryption',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });

      // Check API has SSL enforcement policy
      template.hasResourceProperties('AWS::ApiGateway::RestApi', Match.objectLike({
        Policy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { AWS: '*' },
              Action: 'execute-api:Invoke',
              Resource: '*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'true'
                }
              }
            })
          ])
        })
      }));
    });

    test('should create API methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET'
      });
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should create CloudWatch log groups with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/vpc/flowlogs-${testEnvironmentSuffix}-.*`),
        RetentionInDays: 30
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp(`/aws/lambda/secure-application-${testEnvironmentSuffix}-.*`),
        RetentionInDays: 30
      });
    });

    test('should create CloudWatch alarms for monitoring', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Lambda function errors',
        Threshold: 1,
        EvaluationPeriods: 2
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'API Gateway 4xx errors',
        Threshold: 10
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'API Gateway 5xx errors',
        Threshold: 1
      });
    });
  });

  describe('CloudTrail', () => {
    test('should create CloudTrail with encryption and validation', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
        S3KeyPrefix: 'cloudtrail-logs/'
      });
    });
  });

  describe('Route53', () => {
    test('should create private hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: Match.stringLikeRegexp(`internal\\.secure-app-.*\\.local\\.`),
        VPCs: Match.arrayWith([
          Match.objectLike({
            VPCRegion: 'us-east-1'
          })
        ])
      });
    });

    test('should create health check for API', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          RequestInterval: 30,
          FailureThreshold: 3,
          ResourcePath: '/prod/health'
        }
      });
    });

    test('should create DNS records', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: Match.stringLikeRegexp('api-primary\\.internal\\.secure-app-.*\\.local\\.')
      });

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: Match.stringLikeRegexp('api-failover\\.internal\\.secure-app-.*\\.local\\.')
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      const outputs = [
        'VPCId', 'DatabaseEndpoint', 'APIGatewayURL', 'S3BucketName',
        'PrivateHostedZoneId', 'CloudTrailArn', 'HealthCheckId', 
        'ApplicationUserId', 'ApplicationLogGroupArn', 'APIGatewayLogGroupArn',
        'LambdaErrorAlarmArn', 'APIGateway4xxAlarmArn', 'APIGateway5xxAlarmArn',
        'APIGatewaySecurityGroupId'
      ];
      
      outputs.forEach(outputName => {
        template.hasOutput(outputName, {});
      });
    });
  });

  describe('Resource Counting', () => {
    test('should have correct number of key resources', () => {
      template.resourceCountIs('AWS::KMS::Key', 3); // S3, RDS, CloudWatch
      template.resourceCountIs('AWS::S3::Bucket', 2); // Application, Logs
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::Lambda::Function', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::CloudTrail::Trail', 1);
      template.resourceCountIs('AWS::Route53::HostedZone', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });
  });

  describe('Stack Configuration Variations', () => {
    test('should handle undefined environment suffix', () => {
      const appNoSuffix = new cdk.App();
      const stackNoSuffix = new TapStack(appNoSuffix, 'TestTapStackNoSuffix', {});
      const templateNoSuffix = Template.fromStack(stackNoSuffix);
      
      // Should default to 'dev' environment suffix
      templateNoSuffix.hasResourceProperties('AWS::IAM::User', {
        UserName: Match.stringLikeRegexp('secure-app-user-dev-.*')
      });
    });

    test('should handle custom environment suffix', () => {
      const appCustom = new cdk.App();
      const stackCustom = new TapStack(appCustom, 'TestTapStackCustom', { 
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      const templateCustom = Template.fromStack(stackCustom);
      
      templateCustom.hasResourceProperties('AWS::IAM::User', {
        UserName: Match.stringLikeRegexp('secure-app-user-prod-.*')
      });
    });
  });
});
