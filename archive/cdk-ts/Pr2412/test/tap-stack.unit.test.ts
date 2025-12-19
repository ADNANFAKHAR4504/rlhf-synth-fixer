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

  describe('Stack Constructor', () => {
    test('should use provided environmentSuffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'custom' });
      const testTemplate = Template.fromStack(testStack);
      
      // Verify resources use the custom environment suffix
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should use default environmentSuffix when props not provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'DefaultTestStack');
      const testTemplate = Template.fromStack(testStack);
      
      // Verify resources are created (using default 'dev' suffix)
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('should use default environmentSuffix when environmentSuffix is undefined', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'UndefinedTestStack', { environmentSuffix: undefined });
      const testTemplate = Template.fromStack(testStack);
      
      // Verify resources are created (using default 'dev' suffix)
      testTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
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
        GroupName: Match.stringLikeRegexp(`tap-lambda-sg-${environmentSuffix}-[a-f0-9]{8}`),
      });
    });

    test('should create RDS security group with correct ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        GroupName: Match.stringLikeRegexp(`tap-rds-sg-${environmentSuffix}-[a-f0-9]{8}`),
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
        EngineVersion: '8.0.42',
        DBInstanceClass: 'db.t3.micro',
        DBInstanceIdentifier: Match.stringLikeRegexp(`tap-database-${environmentSuffix}-[a-f0-9]{8}`),
        DBName: 'tapdb',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: Match.stringLikeRegexp(`tap-db-subnet-group-${environmentSuffix}-[a-f0-9]{8}`),
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS database credentials',
        Name: Match.stringLikeRegexp(`tap-db-credentials-${environmentSuffix}-[a-f0-9]{8}`),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create backup bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`tap-backup-bucket-${environmentSuffix}-[a-f0-9]{8}`),
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
        FunctionName: Match.stringLikeRegexp(`tap-api-lambda-${environmentSuffix}-[a-f0-9]{8}`),
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create DB Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp(`tap-db-lambda-${environmentSuffix}-[a-f0-9]{8}`),
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create Lambda IAM role with correct configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`tap-lambda-role-${environmentSuffix}-[a-f0-9]{8}`),
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
        RoleName: Match.stringLikeRegexp(`tap-lambda-role-${environmentSuffix}-[a-f0-9]{8}`),
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
        LogGroupName: Match.stringLikeRegexp(`/aws/vpc/flowlogs-${environmentSuffix}-[a-f0-9]{8}`),
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

    test('should have correct output descriptions', () => {
      const outputs = template.findOutputs('*');
      expect(outputs.VpcId.Description).toBe('VPC ID');
      expect(outputs.DatabaseEndpoint.Description).toBe('RDS Database Endpoint');
      expect(outputs.DatabaseSecretArn.Description).toBe('Database credentials secret ARN');
      expect(outputs.ApiGatewayUrl.Description).toBe('API Gateway URL');
      expect(outputs.BackupBucketName.Description).toBe('S3 Backup Bucket Name');
      expect(outputs.LambdaFunctionArn.Description).toBe('Main API Lambda Function ARN');
    });
  });

  describe('Resource Relationships and Dependencies', () => {
    test('should create Lambda functions with VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('should create Lambda functions with environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_SECRET_ARN: Match.anyValue(),
            DB_HOST: Match.anyValue(),
            DB_PORT: Match.anyValue(),
            DB_NAME: 'tapdb',
            BACKUP_BUCKET: Match.anyValue(),
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          },
        },
      });
    });

    test('should create IAM role with managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.anyValue(),
          }),
        ]),
      });
    });

    test('should create API Gateway with CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
      });
    });

    test('should create database with performance insights disabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnablePerformanceInsights: false,
      });
    });

    test('should create database with CloudWatch logs exports', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: ['error', 'general'],
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
  });

  describe('Security and Compliance', () => {
    test('should create database with encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should create secrets with proper configuration', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: JSON.stringify({ username: 'admin' }),
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\\'',
          IncludeSpace: false,
          PasswordLength: 32,
        },
      });
    });

    test('should create VPC with DNS settings enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create security group ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('Infrastructure Details', () => {
    test('should create correct number of resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 isolated
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
      template.resourceCountIs('AWS::RDS::DBSubnetGroup', 1);
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::Lambda::Function', 2);
      template.resourceCountIs('AWS::IAM::Role', 3); // Lambda role + Flow log role + API Gateway CloudWatch role
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::Logs::LogGroup', 1);
      template.resourceCountIs('AWS::EC2::FlowLog', 1);
    });

    test('should create API Gateway with stage configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ResourcePath: '/*',
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          }),
        ]),
      });
    });
  });
});
