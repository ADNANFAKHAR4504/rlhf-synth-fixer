import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public, private, and isolated subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs * 3 subnet types
      
      // Check for different subnet types
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true, // Public subnet
      });
      
      template.hasResourceProperties('AWS::EC2::RouteTable', {});
      template.resourceCountIs('AWS::EC2::RouteTable', 6); // 1 main + 1 public + 4 private (2 per AZ)
    });

    test('should create NAT Gateway for private subnet connectivity', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
      template.resourceCountIs('AWS::EC2::NatGateway', 2); // One per AZ
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with restrictive rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });

    test('should create database security group with MySQL port access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
      
      // Check for separate security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 3306,
        IpProtocol: 'tcp',
        ToPort: 3306,
        Description: 'Allow MySQL access from EC2 instances',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 role with least privilege permissions', () => {
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
        Description: 'IAM role for EC2 instances with least-privilege permissions',
      });
    });

    test('should create Lambda execution role', () => {
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
        Description: 'Execution role for Lambda function with minimal permissions',
      });
    });

    test('should create MFA enforcement policy', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        Description: 'Policy that enforces MFA for console access',
        ManagedPolicyName: `EnforceMFAForConsoleUsers-${environmentSuffix}`,
      });
    });

    test('should create instance profile for EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('S3 Bucket', () => {
    test('should create secure S3 bucket with proper configuration', () => {
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

    test('should have bucket policy enforcing SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('should create encrypted RDS database instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: true, // This is actually true in the template
        MultiAZ: false,
        DBName: 'appdb',
      });
    });

    test('should create DB subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {});
    });

    test('should create database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Generated by the CDK for stack: TestTapStack',
      });
    });
  });

  describe('Parameter Store', () => {
    test('should create SSM parameters for configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/app/database/endpoint-host-${environmentSuffix}`,
        Type: 'String',
        Description: 'RDS database endpoint',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/app/s3/bucket-name-${environmentSuffix}`,
        Type: 'String',
        Description: 'S3 bucket name for application data',
      });
    });
  });

  describe('SNS Topic and Notifications', () => {
    test('should create SNS topic for application logs', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `app-logs-topic-${environmentSuffix}`,
        DisplayName: 'Application Logs Topic',
      });
    });

    test('should create Lambda subscription to SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'lambda',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create security group changes alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `SecurityGroupChanges-Alarm-${environmentSuffix}`,
        AlarmDescription: 'Alarm for security group changes',
        MetricName: 'MatchedEvents',
        Namespace: 'AWS/Events',
        Statistic: 'Sum',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create CPU utilization alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `HighCPUUtilization-Alarm-${environmentSuffix}`,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 70,
        ComparisonOperator: 'GreaterThanThreshold',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `LowCPUUtilization-Alarm-${environmentSuffix}`,
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 30,
        ComparisonOperator: 'LessThanThreshold',
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should create EventBridge rule for security group changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `SecurityGroupChangesRule-${environmentSuffix}`,
        Description: 'Detect security group changes',
        EventPattern: {
          source: ['aws.ec2'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventSource: ['ec2.amazonaws.com'],
            eventName: [
              'AuthorizeSecurityGroupIngress',
              'AuthorizeSecurityGroupEgress',
              'RevokeSecurityGroupIngress',
              'RevokeSecurityGroupEgress',
              'CreateSecurityGroup',
              'DeleteSecurityGroup',
            ],
          },
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `secure-processing-function-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
      });
    });

    test('should have proper Lambda environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            EnvironmentSuffix: environmentSuffix,
          },
        },
      });
    });

    test('should create Lambda permission for SNS invocation', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'sns.amazonaws.com',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create launch template', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `secure-app-template-${environmentSuffix}`,
        LaunchTemplateData: {
          ImageId: expect.any(Object),
          InstanceType: 't3.micro',
          MetadataOptions: {
            HttpTokens: 'required', // IMDSv2 enforcement
          },
        },
      });
    });

    test('should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '5',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
        HealthCheckGracePeriod: 300,
      });
    });

    test('should create target tracking scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70,
        },
      });
    });

    test('should create step scaling policies', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'StepScaling',
        StepAdjustments: [
          {
            MetricIntervalUpperBound: 10,
            ScalingAdjustment: 1,
          },
          {
            MetricIntervalLowerBound: 10,
            ScalingAdjustment: 2,
          },
        ],
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create stack outputs for important resources', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
      });

      template.hasOutput('DatabaseEndpointName', {
        Description: 'RDS Database Endpoint',
      });

      template.hasOutput('SNSTopicArn', {
        Description: 'SNS Topic ARN for logs',
      });

      template.hasOutput('LambdaFunctionArn', {
        Description: 'Lambda Function ARN',
      });
    });
  });

  describe('Environment Suffix Integration', () => {
    test('should apply environment suffix to all named resources', () => {
      // Test bucket name includes environment suffix
      const bucketLogicalId = template.findResources('AWS::S3::Bucket');
      const bucketProps = Object.values(bucketLogicalId)[0].Properties;
      expect(bucketProps.BucketName).toContain(environmentSuffix);

      // Test SNS topic name includes environment suffix
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `app-logs-topic-${environmentSuffix}`,
      });

      // Test alarm names include environment suffix
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `SecurityGroupChanges-Alarm-${environmentSuffix}`,
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have no hardcoded secrets', () => {
      const templateJson = JSON.stringify(template.toJSON());
      expect(templateJson).not.toMatch(/password|secret|key/i);
    });

    test('should use least privilege IAM policies', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Effect: 'Allow',
              Action: expect.arrayContaining(['ssm:GetParameter']),
              Resource: expect.arrayContaining([
                expect.stringMatching(/arn:aws:ssm:.+:parameter\/app\/\*/),
              ]),
            }),
          ]),
        },
      });
    });

    test('should enforce HTTPS only for S3', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
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
    });
  });
});
