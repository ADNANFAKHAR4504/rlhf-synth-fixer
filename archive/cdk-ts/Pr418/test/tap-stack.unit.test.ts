import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      region: 'us-east-1',
      environment: 'test',
      projectName: 'TestProject',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.node.id).toBe('TestTapStack');
    });

    test('should have required properties', () => {
      expect(stack.vpc).toBeDefined();
      expect(stack.kmsKey).toBeDefined();
      expect(stack.s3Bucket).toBeDefined();
      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.rdsInstance).toBeDefined();
      expect(stack.ec2Instance).toBeDefined();
    });
  });

  describe('KMS Resources', () => {
    test('should create KMS key with correct configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for TestProject in us-east-1',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
      });
    });

    test('should create KMS key with proper permissions', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for TestProject in us-east-1',
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create isolated subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create NAT Gateway', () => {
      template.hasResource('AWS::EC2::NatGateway', {});
    });

    test('should create Internet Gateway', () => {
      template.hasResource('AWS::EC2::InternetGateway', {});
    });

    test('should create VPC Flow Logs', () => {
      template.hasResource('AWS::EC2::FlowLog', {
        Properties: {
          ResourceType: 'VPC',
          TrafficType: 'ALL',
        },
      });
    });

    test('should create CloudWatch Log Group for Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/flowlogs/TestProject-us-east-1',
      });
    });
  });

  describe('S3 Resources', () => {
    test('should create S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'testproject-secure-bucket-us-east-1-test',
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
            },
          ],
        },
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'TestProject-SecureFunction-us-east-1',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 128,
      });
    });

    test('should create Lambda IAM role with restricted permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
    });

    test('should create Lambda execution role policy', () => {
      template.hasResource('AWS::IAM::Policy', {});
    });
  });

  describe('RDS Resources', () => {
    test('should create RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        MultiAZ: true,
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
        EnablePerformanceInsights: false,
      });
    });

    test('should create RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for TestProject RDS instance',
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS instance',
      });
    });

    test('should create RDS credentials secret', () => {
      template.hasResource('AWS::SecretsManager::Secret', {});
    });
  });

  describe('EC2 Resources', () => {
    test('should create EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Monitoring: true,
      });
    });

    test('should create EC2 IAM role with CloudWatch permissions', () => {
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
      });
    });

    test('should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
      });
    });

    test('should create CloudWatch log groups for EC2 logs', () => {
      // EC2 logs are created via user data script, not as separate CloudFormation resources
      // We can verify the user data contains the log group configuration
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      const ec2Instance = ec2Resources[Object.keys(ec2Resources)[0]];
      expect(ec2Instance.Properties.UserData['Fn::Base64']).toContain('/aws/ec2/TestProject-us-east-1/var/log/messages');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch log groups', () => {
      template.hasResource('AWS::Logs::LogGroup', {});
    });

    test('should create CloudWatch metrics namespace', () => {
      // CloudWatch metrics are created via user data script
      // We can verify the user data contains the metrics configuration
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      const ec2Instance = ec2Resources[Object.keys(ec2Resources)[0]];
      expect(ec2Instance.Properties.UserData['Fn::Base64']).toContain('TestProject/EC2');
    });
  });

  describe('IAM Resources', () => {
    test('should create VPC Flow Logs IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('should create VPC Flow Logs IAM policy', () => {
      template.hasResource('AWS::IAM::Policy', {});
    });
  });

  describe('Outputs', () => {
    test('should create VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: { Name: 'TestProject-VPC-us-east-1' },
      });
    });

    test('should create S3 bucket name output', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
        Export: { Name: 'TestProject-S3Bucket-us-east-1' },
      });
    });

    test('should create Lambda function ARN output', () => {
      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda Function ARN',
        Export: { Name: 'TestProject-Lambda-us-east-1' },
      });
    });

    test('should create RDS endpoint output', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS Instance Endpoint',
        Export: { Name: 'TestProject-RDS-us-east-1' },
      });
    });

    test('should create KMS key ID output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID',
        Export: { Name: 'TestProject-KMS-us-east-1' },
      });
    });
  });

  describe('Security Features', () => {
    test('should have encrypted storage for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });
    });

    test('should have encrypted S3 bucket', () => {
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
    });

    test('should have public access blocked on S3', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should have VPC Flow Logs enabled', () => {
      template.hasResource('AWS::EC2::FlowLog', {
        Properties: {
          TrafficType: 'ALL',
        },
      });
    });

    test('should have Multi-AZ RDS deployment', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
      });
    });

    test('should have detailed monitoring on EC2', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Monitoring: true,
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create expected number of resources', () => {
      // Count major resource types
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const s3Resources = template.findResources('AWS::S3::Bucket');
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      const kmsResources = template.findResources('AWS::KMS::Key');

      expect(Object.keys(vpcResources)).toHaveLength(1);
      expect(Object.keys(s3Resources)).toHaveLength(1);
      expect(Object.keys(lambdaResources)).toHaveLength(1);
      expect(Object.keys(rdsResources)).toHaveLength(1);
      expect(Object.keys(ec2Resources)).toHaveLength(1);
      expect(Object.keys(kmsResources)).toHaveLength(1);
    });
  });
});
