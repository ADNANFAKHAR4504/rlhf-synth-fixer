import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environment = environmentSuffix === 'prod' ? 'production' : 'staging';
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      environment,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      // Should have 2 public and 2 private subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Check public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          },
        ]),
      });

      // Check private subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          },
        ]),
      });
    });

    test('creates Internet Gateway and attaches to VPC', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('creates NAT Gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for web servers'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'SSH access',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            Description: 'HTTP access',
          }),
        ]),
      });
    });

    test('creates RDS security group with MySQL access from web servers', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for RDS database'),
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '255.255.255.255/32',
            IpProtocol: 'icmp',
          }),
        ]),
      });

      // Check for ingress rule from web security group
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 3306,
        ToPort: 3306,
        IpProtocol: 'tcp',
        Description: 'MySQL access from web servers',
      });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('creates EC2 instance with t2.micro type', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
      });
    });

    test('EC2 instance has encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
              VolumeSize: 8,
              VolumeType: 'gp3',
            }),
          }),
        ]),
      });
    });

    test('EC2 instance uses IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: Match.objectLike({
            HttpTokens: 'required',
          }),
        }),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 role with SSM managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([Match.stringLikeRegexp('AmazonSSMManagedInstanceCore')]),
            ]),
          }),
        ]),
      });
    });

    test('creates Lambda role with EC2 shutdown permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'EC2Shutdown',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith(['ec2:DescribeInstances', 'ec2:StopInstances']),
                  Resource: '*',
                }),
              ]),
            }),
          }),
        ]),
      });
    });

    test('creates IAM user with MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::User', {
        UserName: Match.stringLikeRegexp('app-user-'),
      });

      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyName: Match.stringLikeRegexp('RequireMFA-'),
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: '*',
              Resource: '*',
              Condition: Match.objectLike({
                BoolIfExists: Match.objectLike({
                  'aws:MultiFactorAuthPresent': 'false',
                }),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([Match.stringLikeRegexp('app-bucket-')]),
          ]),
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'AES256',
              }),
            }),
          ]),
        }),
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled',
        }),
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }),
      });
    });

    test('S3 bucket has auto-delete enabled', () => {
      // Check for custom resource for auto-delete
      template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
        ServiceToken: Match.anyValue(),
        BucketName: Match.objectLike({
          Ref: Match.stringLikeRegexp('AppBucket'),
        }),
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('creates RDS MySQL database instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        DBName: 'webapp',
        MasterUsername: 'admin',
        StorageEncrypted: true,
        MultiAZ: false,
        BackupRetentionPeriod: 1,
        DeletionProtection: false,
      });
    });

    test('RDS uses KMS encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        KmsKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('KMSKey'), 'Arn']),
        }),
      });
    });

    test('RDS has subnet group in private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp('Database subnet group'),
      });
    });
  });

  describe('KMS Key Configuration', () => {
    test('creates KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('KMS key for encryption'),
        EnableKeyRotation: true,
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('creates Lambda function for EC2 shutdown', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.12',
        Handler: 'index.handler',
        Timeout: 300,
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            SNS_TOPIC_ARN: Match.anyValue(),
            ENVIRONMENT: Match.anyValue(),
          }),
        }),
      });
    });

    test('Lambda code contains shutdown logic', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Code: Match.objectLike({
          ZipFile: Match.stringLikeRegexp('ec2.stop_instances'),
        }),
      });
    });
  });

  describe('EventBridge Scheduler Configuration', () => {
    test('creates EventBridge schedule for daily shutdown at 8 PM', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: Match.stringLikeRegexp('ec2-shutdown-'),
        Description: Match.stringLikeRegexp('Daily EC2 shutdown at 8 PM'),
        ScheduleExpression: 'cron(0 20 * * ? *)',
        ScheduleExpressionTimezone: 'America/New_York',
        FlexibleTimeWindow: Match.objectLike({
          Mode: 'OFF',
        }),
      });
    });

    test('EventBridge scheduler has role to invoke Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'scheduler.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'InvokeLambda',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: 'lambda:InvokeFunction',
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('SNS Topic Configuration', () => {
    test('creates SNS topic for notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('webapp-notifications-'),
        DisplayName: Match.stringLikeRegexp('Web Application Notifications'),
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources are tagged with Project: X', () => {
      // Check VPC tagging
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'X',
          }),
        ]),
      });

      // Check EC2 instance tagging
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'X',
          }),
        ]),
      });

      // Check S3 bucket tagging
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'X',
          }),
        ]),
      });
    });

    test('resources are tagged with Environment', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: Match.anyValue(),
          }),
        ]),
      });
    });

    test('resources are tagged with ManagedBy: CDK', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'ManagedBy',
            Value: 'CDK',
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('stack has VPC ID output', () => {
      template.hasOutput(`VPCId${environmentSuffix}`, {
        Description: Match.stringLikeRegexp('VPC ID for'),
      });
    });

    test('stack has Web Server Instance ID output', () => {
      template.hasOutput(`WebServerInstanceId${environmentSuffix}`, {
        Description: Match.stringLikeRegexp('Web Server Instance ID for'),
      });
    });

    test('stack has Database Endpoint output', () => {
      template.hasOutput(`DatabaseEndpoint${environmentSuffix}`, {
        Description: Match.stringLikeRegexp('Database endpoint for'),
      });
    });

    test('stack has S3 Bucket Name output', () => {
      template.hasOutput(`S3BucketName${environmentSuffix}`, {
        Description: Match.stringLikeRegexp('S3 bucket name for'),
      });
    });

    test('stack has SNS Topic ARN output', () => {
      template.hasOutput(`SNSTopicArn${environmentSuffix}`, {
        Description: Match.stringLikeRegexp('SNS topic ARN for'),
      });
    });
  });

  describe('Removal Policies', () => {
    test('resources have DESTROY removal policy for testing', () => {
      // S3 bucket should be destroyable
      template.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });

      // RDS should be destroyable
      template.hasResource('AWS::RDS::DBInstance', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });

      // KMS key should be destroyable
      template.hasResource('AWS::KMS::Key', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });
  });
});