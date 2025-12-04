import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const environmentSuffix = 'test';
  const fixedTimestamp = 1700000000000;
  const accessLogsBucketName = `access-logs-bucket${environmentSuffix}-${fixedTimestamp}`;
  const secureBucketName = `secure-bucket${environmentSuffix}`;
  let template: Template;

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(fixedTimestamp);
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('creates encryption, secrets, and centralized logging resources', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for infrastructure encryption',
      EnableKeyRotation: true,
      Tags: Match.arrayWith([Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' })])
    });
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: `alias/infrastructure-key${environmentSuffix}`
    });
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: `app-secret${environmentSuffix}`,
      KmsKeyId: Match.anyValue(),
      GenerateSecretString: Match.objectLike({
        GenerateStringKey: 'password',
        PasswordLength: 32
      }),
      Tags: Match.arrayWith([Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' })])
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/infrastructure/central${environmentSuffix}`,
      RetentionInDays: 30,
      KmsKeyId: Match.anyValue()
    });
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/ec2/instances${environmentSuffix}`,
      RetentionInDays: 30,
      KmsKeyId: Match.anyValue()
    });
  });

  test('configures VPC networking and shared security controls', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
      Tags: Match.arrayWith([Match.objectLike({ Key: 'Name', Value: `main-vpc${environmentSuffix}` })])
    });
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `ec2-sg${environmentSuffix}`,
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '0.0.0.0/0',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp'
        })
      ])
    });
    template.resourceCountIs('AWS::EC2::Instance', 0);
    template.hasResourceProperties('AWS::EC2::EIP', {
      Domain: 'vpc',
      Tags: Match.arrayWith([Match.objectLike({ Key: 'Name', Value: `elastic-ip${environmentSuffix}` })])
    });
  });

  test('handles missing suffix input without relying on hardcoded defaults', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'DefaultSuffixStack');
    expect(() => Template.fromStack(stack)).not.toThrow();
  });

  test('prefers context-provided suffix when props omit it', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', 'ctx');
    const stack = new TapStack(app, 'ContextSuffixStack');
    const contextTemplate = Template.fromStack(stack);

    contextTemplate.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/infrastructure-keyctx'
    });
  });

  test('provisions encrypted, logged S3 buckets with HTTPS enforcement', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: accessLogsBucketName,
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({ SSEAlgorithm: 'aws:kms' })
          })
        ])
      }),
      VersioningConfiguration: { Status: 'Enabled' },
      PublicAccessBlockConfiguration: Match.objectLike({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      })
    });
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: secureBucketName,
      LoggingConfiguration: Match.objectLike({
        DestinationBucketName: { Ref: Match.stringLikeRegexp('AccessLogsBucket') },
        LogFilePrefix: 'access-logs/'
      }),
      LifecycleConfiguration: Match.objectLike({
        Rules: Match.arrayWith([
          Match.objectLike({
            Id: 'delete-old-versions',
            NoncurrentVersionExpiration: { NoncurrentDays: 90 },
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 7 },
            Status: 'Enabled'
          })
        ])
      }),
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({ SSEAlgorithm: 'aws:kms' })
          })
        ])
      }),
      VersioningConfiguration: { Status: 'Enabled' }
    });
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      Bucket: { Ref: Match.stringLikeRegexp('SecureS3Bucket') },
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Condition: { Bool: { 'aws:SecureTransport': 'false' } }
          })
        ])
      })
    });
  });

  test('attaches least-privilege IAM policies to the compute role', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: `ec2-instance-role${environmentSuffix}`,
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('arn:'),
              { Ref: 'AWS::Partition' },
              Match.stringLikeRegexp(':iam::aws:policy/AmazonSSMManagedInstanceCore')
            ])
          ])
        }),
        Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              Match.stringLikeRegexp('arn:'),
              { Ref: 'AWS::Partition' },
              Match.stringLikeRegexp(':iam::aws:policy/CloudWatchAgentServerPolicy')
            ])
          ])
        })
      ])
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: `secrets-read-policy${environmentSuffix}`,
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'ReadSpecificSecret',
            Action: Match.arrayWith(['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'])
          }),
          Match.objectLike({
            Sid: 'DecryptSecret',
            Condition: { StringEquals: { 'kms:ViaService': 'secretsmanager.us-east-1.amazonaws.com' } }
          })
        ])
      })
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: `s3-read-policy${environmentSuffix}`,
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({ Sid: 'ListBucket', Action: 's3:ListBucket' }),
          Match.objectLike({
            Sid: 'ReadObjects',
            Action: Match.arrayWith(['s3:GetObject', 's3:GetObjectVersion'])
          }),
          Match.objectLike({
            Sid: 'DecryptObjects',
            Condition: { StringEquals: { 'kms:ViaService': 's3.us-east-1.amazonaws.com' } }
          })
        ])
      })
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: `logs-write-policy${environmentSuffix}`,
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Sid: 'WriteToLogGroups',
            Action: Match.arrayWith([
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams'
            ])
          })
        ])
      })
    });
  });

  test('hardened launch templates drive the autoscaling group', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: `ec2-launch-template${environmentSuffix}`,
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.medium',
        MetadataOptions: { HttpTokens: 'required' },
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
              VolumeType: 'gp3',
              VolumeSize: 30
            })
          })
        ]),
        TagSpecifications: Match.arrayWith([
          Match.objectLike({ ResourceType: 'instance' }),
          Match.objectLike({ ResourceType: 'volume' })
        ])
      })
    });
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      AutoScalingGroupName: `asg${environmentSuffix}`,
      MinSize: '2',
      MaxSize: '6',
      DesiredCapacity: '2',
      TerminationPolicies: ['OldestInstance'],
      VPCZoneIdentifier: Match.arrayWith([
        { Ref: Match.stringLikeRegexp('MainVpcPrivateSubnet') },
        { Ref: Match.stringLikeRegexp('MainVpcPrivateSubnet') }
      ]),
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true', PropagateAtLaunch: true })
      ])
    });
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      TargetTrackingConfiguration: Match.objectLike({
        PredefinedMetricSpecification: { PredefinedMetricType: 'ASGAverageCPUUtilization' },
        TargetValue: 70
      }),
      EstimatedInstanceWarmup: 300
    });
  });

  test('alarms publish to encrypted SNS notifications', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: `infrastructure-alarms${environmentSuffix}`,
      DisplayName: 'Infrastructure Alarms',
      KmsMasterKeyId: Match.anyValue()
    });
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'admin@example.com',
      TopicArn: { Ref: Match.stringLikeRegexp('AlarmTopic') }
    });
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: `cpu-high${environmentSuffix}`,
      Threshold: 80,
      EvaluationPeriods: 2,
      TreatMissingData: 'breaching'
    });
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: `cpu-low${environmentSuffix}`,
      Threshold: 20,
      ComparisonOperator: 'LessThanThreshold'
    });
  });

  test('backup plan and configuration parameters capture resource metadata', () => {
    template.hasResourceProperties('AWS::Backup::BackupVault', {
      BackupVaultName: `infrastructure-vault${environmentSuffix}`,
      EncryptionKeyArn: Match.anyValue()
    });
    template.hasResourceProperties('AWS::Backup::BackupPlan', {
      BackupPlan: Match.objectLike({
        BackupPlanName: `infrastructure-backup-plan${environmentSuffix}`,
        BackupPlanRule: Match.arrayWith([
          Match.objectLike({
            RuleName: 'DailyBackup',
            ScheduleExpression: 'cron(0 3 * * ? *)',
            Lifecycle: Match.objectLike({ DeleteAfterDays: 7 })
          })
        ])
      })
    });
    template.hasResourceProperties('AWS::Backup::BackupSelection', {
      BackupSelection: Match.objectLike({
        SelectionName: `ec2-selection${environmentSuffix}`,
        ListOfTags: Match.arrayWith([
          Match.objectLike({
            ConditionKey: 'aws:autoscaling:groupName',
            ConditionType: 'STRINGEQUALS',
            ConditionValue: { Ref: Match.stringLikeRegexp('AutoScalingGroup') }
          })
        ])
      })
    });
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/infrastructure/config${environmentSuffix}`,
      Value: Match.objectLike({
        'Fn::Join': [
          '',
          Match.arrayWith([
            Match.stringLikeRegexp('{"vpcId"'),
            { Ref: Match.stringLikeRegexp('MainVpc') },
            Match.stringLikeRegexp(',"bucketName"'),
            { Ref: Match.stringLikeRegexp('SecureS3Bucket') },
            Match.stringLikeRegexp(',"region":"us-east-1"}')
          ])
        ]
      })
    });
  });

  test('exports identifiers for downstream stacks', () => {
    template.hasOutput('VPCId', {
      Export: { Name: `vpc-id${environmentSuffix}` },
      Value: { Ref: Match.stringLikeRegexp('MainVpc') }
    });
    template.hasOutput('S3BucketName', {
      Export: { Name: `s3-bucket-name${environmentSuffix}` },
      Value: { Ref: Match.stringLikeRegexp('SecureS3Bucket') }
    });
    template.hasOutput('ElasticIPAddress', {
      Export: { Name: `elastic-ip${environmentSuffix}` },
      Value: { Ref: 'ElasticIP' }
    });
    template.hasOutput('KMSKeyId', {
      Export: { Name: `kms-key-id${environmentSuffix}` },
      Value: { Ref: Match.stringLikeRegexp('MasterKmsKey') }
    });
  });
});
