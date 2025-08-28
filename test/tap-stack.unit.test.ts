import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('should create Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
        GroupName: `tap-lambda-sg-${environmentSuffix}`,
      });
    });

    test('should create RDS security group with correct ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        GroupName: `tap-rds-sg-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 3306,
        ToPort: 3306,
        IpProtocol: 'tcp',
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.35',
        DBInstanceClass: 'db.t3.micro',
        DBInstanceIdentifier: `tap-database-${environmentSuffix}`,
        DBName: 'tapdb',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: `tap-db-subnet-group-${environmentSuffix}`,
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database credentials',
        Name: `tap-db-credentials-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create backup bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `tap-backup-bucket-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should have lifecycle configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'backup-lifecycle',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
              },
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                },
              ]),
            },
          ],
        },
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create API Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-api-lambda-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create DB Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `tap-db-lambda-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create Lambda IAM role with correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-lambda-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });

      // Check that the Lambda role has the expected policies
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-lambda-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SecretsManagerPolicy',
          }),
          Match.objectLike({
            PolicyName: 'S3BackupPolicy',
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `Tap Application API ${environmentSuffix}`,
        Description: 'API Gateway for Tap application backend',
      });
    });

    test('should create deployment stage', () => {
      template.hasResourceProperties(
        'AWS::ApiGateway::Deployment',
        Match.anyValue()
      );
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should create API resources and methods', () => {
      // Check for resources
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'api',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'v1',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'db',
      });
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users',
      });

      // Check for methods
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create VPC flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('should create flow log with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('VpcId');
      expect(Object.keys(outputs)).toContain('DatabaseEndpoint');
      expect(Object.keys(outputs)).toContain('DatabaseSecretArn');
      expect(Object.keys(outputs)).toContain('ApiGatewayUrl');
      expect(Object.keys(outputs)).toContain('BackupBucketName');
      expect(Object.keys(outputs)).toContain('LambdaFunctionArn');
    });
  });
});
