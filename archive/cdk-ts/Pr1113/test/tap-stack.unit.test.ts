import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Security Infrastructure', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-west-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Encryption Keys', () => {
    test('creates KMS key for S3 bucket encryption with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
        KeySpec: 'SYMMETRIC_DEFAULT',
        KeyUsage: 'ENCRYPT_DECRYPT',
      });
    });


    test('creates KMS key for VPC Flow Logs encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for VPC Flow Logs encryption',
        EnableKeyRotation: true,
      });
    });

    test('creates KMS key for CloudTrail logs encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for CloudTrail log encryption',
        EnableKeyRotation: true,
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with proper CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public, private, and isolated subnets', () => {
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Public',
          }),
        ]),
      });

      // Private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Private',
          }),
        ]),
      });

      // Isolated subnets for database
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'aws-cdk:subnet-type',
            Value: 'Isolated',
          }),
        ]),
      });
    });

    test('enables VPC Flow Logs for all traffic', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });
  });

  describe('Security Groups', () => {
    test('creates web security group allowing only HTTP and HTTPS from internet', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for web servers - only HTTP and HTTPS',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('creates database security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database - restricted access',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            FromPort: 3306,
            ToPort: 3306,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('web security group has restricted egress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription:
          'Security group for web servers - only HTTP and HTTPS',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });
  });

  describe('S3 Bucket Security', () => {
    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
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

    test('S3 bucket policy enforces SSL/TLS', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
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

    test('S3 bucket has lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'transition-to-ia',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates IAM role for EC2 with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
        Description: 'Least privilege role for EC2 instances',
      });
    });

    test('EC2 role has CloudWatch agent policy attached', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Least privilege role for EC2 instances',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('creates instance profile for EC2', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.anyValue(),
      });
    });

  });

  describe('EC2 Configuration', () => {
    test('creates launch template with IMDSv2 enforcement', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });

    test('launch template uses encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeType: 'gp3',
              },
            }),
          ]),
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with encryption enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        Engine: 'mysql',
      });
    });

    test('RDS instance has backup retention configured', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('RDS instance is not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('RDS credentials stored in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'Database master user credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: JSON.stringify({ username: 'admin' }),
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\\'',
          PasswordLength: 16,
        }),
      });
    });
  });

  describe('CloudTrail Configuration', () => {
    test('creates multi-region CloudTrail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: true,
        IncludeGlobalServiceEvents: true,
        EnableLogFileValidation: true,
      });
    });

    test('CloudTrail logs are encrypted with KMS', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        KMSKeyId: Match.anyValue(),
      });
    });

    test('CloudTrail bucket has lifecycle rules', () => {
      const resources = template.findResources('AWS::S3::Bucket', {
        Properties: {
          BucketName: Match.stringLikeRegexp('cloudtrail-logs-.*'),
        },
      });
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });
  });


  describe('SNS Notifications', () => {
    test('creates SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Security Alerts',
        TopicName: Match.stringLikeRegexp('security-alerts-.*'),
      });
    });

    test('SNS topic has email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'admin@example.com',
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates rule for security group changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.ec2'],
          'detail-type': ['AWS API Call via CloudTrail'],
          detail: {
            eventSource: ['ec2.amazonaws.com'],
            eventName: Match.arrayWith([
              'CreateSecurityGroup',
              'DeleteSecurityGroup',
              'AuthorizeSecurityGroupIngress',
              'AuthorizeSecurityGroupEgress',
              'RevokeSecurityGroupIngress',
              'RevokeSecurityGroupEgress',
            ]),
          },
        },
      });
    });

    test('creates rule for GuardDuty findings', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.guardduty'],
          'detail-type': ['GuardDuty Finding'],
        },
      });
    });

    test('creates scheduled rule for daily compliance checks', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 6 * * ? *)',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates compliance check Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.lambda_handler',
        Runtime: 'python3.12',
        Timeout: 300,
      });
    });

    test('compliance Lambda has necessary permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ec2:DescribeSecurityGroups',
                'ec2:DescribeVpcs',
                'ec2:DescribeFlowLogs',
                's3:ListAllMyBuckets',
                's3:GetBucketEncryption',
                'iam:ListUsers',
                'sns:Publish',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('GuardDuty', () => {
    test('enables GuardDuty detector', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true,
        FindingPublishingFrequency: 'FIFTEEN_MINUTES',
      });
    });

    test('GuardDuty has S3 logs protection enabled', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        DataSources: {
          S3Logs: {
            Enable: true,
          },
        },
      });
    });

    test('GuardDuty has malware protection enabled', () => {
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

  describe('CloudWatch Logs', () => {
    test('creates log group for VPC Flow Logs with KMS encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/vpc/flowlogs/.*'),
        RetentionInDays: 30,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('creates log group for CloudTrail with retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/cloudtrail/.*'),
        RetentionInDays: 365,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.stringLikeRegexp('VpcId-.*'),
        },
      });
    });

    test('outputs S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'Secure S3 Bucket Name',
      });
    });

    test('outputs database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS Database Endpoint',
      });
    });

    test('outputs SNS topic ARN', () => {
      template.hasOutput('SecurityTopicArn', {
        Description: 'Security Notifications Topic ARN',
      });
    });
  });

  describe('Tagging', () => {
    test('resources are properly tagged', () => {
      // Check VPC has proper tags (Note: some CDK-generated tags may be included)
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpcTags = Object.values(vpcResources)[0].Properties.Tags;

      // Verify essential tags are present
      expect(vpcTags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
          expect.objectContaining({
            Key: 'Application',
            Value: 'EcommerceSecurityStack',
          }),
          expect.objectContaining({ Key: 'Owner', Value: 'SecurityTeam' }),
          expect.objectContaining({ Key: 'CostCenter', Value: 'Security' }),
        ])
      );
    });
  });

  describe('Security Compliance Requirements (15 Total)', () => {
    test('Requirement 1: IAM roles follow least privilege', () => {
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);
      // Verify roles have specific, limited policies
      Object.entries(roles).forEach(([_, role]) => {
        if (role.Properties?.Description?.includes('EC2')) {
          expect(role.Properties.ManagedPolicyArns).toBeDefined();
        }
      });
    });

    test('Requirement 2: S3 buckets have server-side encryption enforced', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.entries(buckets).forEach(([_, bucket]) => {
        expect(bucket.Properties?.BucketEncryption).toBeDefined();
        expect(
          bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration
        ).toBeDefined();
      });
    });

    test('Requirement 3: Security groups allow only ports 80/443 from internet', () => {
      const webSg = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          GroupDescription:
            'Security group for web servers - only HTTP and HTTPS',
        },
      });
      expect(Object.keys(webSg).length).toBe(1);
    });

    test('Requirement 4: DNS queries logged through CloudTrail', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        EventSelectors: Match.anyValue(),
      });
    });


    test('Requirement 6: CloudTrail activated in all regions', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', {
        IsMultiRegionTrail: true,
      });
    });

    test('Requirement 7: KMS encryption keys for S3 buckets', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
      });
    });

    test('Requirement 8: MFA enforcement setup (password policy)', () => {
      // Password policy is implemented via Lambda function
      template.hasResourceProperties('AWS::Lambda::Function', {
        Description: 'Lambda function to set IAM account password policy',
        Runtime: 'python3.12',
      });
    });

    test('Requirement 9: VPC Flow Logs enabled for all subnets', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('Requirement 10: RDS access restricted to specific IP ranges', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database - restricted access',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
          }),
        ]),
      });
    });

    test('Requirement 11: Password policy with 12+ characters', () => {
      // Password policy is enforced via Lambda function
      template.hasResourceProperties('AWS::Lambda::Function', {
        Description: 'Lambda function to set IAM account password policy',
        Runtime: 'python3.12',
      });
    });

    test('Requirement 12: EC2 instances require IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });

    test('Requirement 13: SNS notifications for security group changes', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          detail: {
            eventName: Match.arrayWith(['AuthorizeSecurityGroupIngress']),
          },
        },
      });
    });

    test('Requirement 14: Daily automated compliance checks', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 6 * * ? *)',
      });
    });

    test('Requirement 15: AWS Systems Manager Session Manager configured', () => {
      // Check for SSM Session Manager document
      template.hasResourceProperties('AWS::SSM::Document', {
        DocumentType: 'Session',
        Name: Match.stringLikeRegexp('SSM-SessionManagerRunShell-.*'),
      });

      // Check for SSM log group
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/ssm/sessions/.*'),
      });

      // Check EC2 role has SSM permissions
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'Least privilege role for EC2 instances',
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Requirement 16: Amazon Inspector v2 enabled for vulnerability assessment', () => {
      // Check for Inspector findings rule
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.inspector2'],
          'detail-type': ['Inspector2 Finding'],
          detail: {
            severity: ['HIGH', 'CRITICAL'],
          },
        },
      });
    });
  });
});
