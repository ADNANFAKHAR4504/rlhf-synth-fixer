import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  let testEnvironmentSuffix: string;
  let testAccount: string;
  let testRegion: string;

  beforeEach(() => {
    app = new cdk.App();
    testEnvironmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
    const testRetentionDays = parseInt(process.env.RETENTION_DAYS || '60');
    const testReplicationRegion = process.env.REPLICATION_REGION || 'us-west-2';
    const testScheduleExpression = process.env.SCHEDULE_EXPRESSION || 'cron(0 2 * * ? *)';
    const testNotificationEmail = process.env.NOTIFICATION_EMAIL || 'test@example.com';
    testAccount = process.env.CDK_DEFAULT_ACCOUNT || '123456789012';
    testRegion = process.env.CDK_DEFAULT_REGION || 'us-east-1';
    
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: testEnvironmentSuffix,
      retentionDays: testRetentionDays,
      replicationRegion: testReplicationRegion,
      scheduleExpression: testScheduleExpression,
      notificationEmail: testNotificationEmail,
      enableVpcEndpoints: true,
      env: {
        account: testAccount,
        region: testRegion,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*BackupVpc.*'),
          }),
        ]),
      });
    });

    test('should create isolated subnets in different AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*isolatedSubnet1.*'),
          }),
        ]),
      }));

      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*isolatedSubnet2.*'),
          }),
        ]),
      }));
    });

    test('should create VPC endpoints for S3, DynamoDB, and KMS', () => {
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
      
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });

      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('KMS Encryption', () => {
    test('should create customer-managed KMS keys with rotation enabled', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create KMS aliases for both keys', () => {
      template.resourceCountIs('AWS::KMS::Alias', 2);
      
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*encryption-key-primary.*'),
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: Match.stringLikeRegexp('.*encryption-key-replication.*'),
      });
    });
  });

  describe('S3 Storage', () => {
    test('should create primary backup bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: `backup-primary-${testEnvironmentSuffix}-${testAccount}-${testRegion}`,
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled',
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'backup-retention-policy',
              Status: 'Enabled',
              ExpirationInDays: 60,
            }),
            Match.objectLike({
              Id: 'transition-to-ia',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                },
              ]),
            }),
            Match.objectLike({
              Id: 'transition-to-glacier',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                {
                  StorageClass: 'GLACIER',
                  TransitionInDays: 45,
                },
              ]),
            }),
          ]),
        }),
      }));
    });

    test('should create replication bucket for disaster recovery', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: `backup-replications-${testEnvironmentSuffix}-${testAccount}-${testRegion}`,
        VersioningConfiguration: Match.objectLike({
          Status: 'Enabled',
        }),
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        }),
        LifecycleConfiguration: Match.objectLike({
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'replication-retention-policy',
              Status: 'Enabled',
              ExpirationInDays: 60,
            }),
          ]),
        }),
      }));
    });

    test('should create access logs and audit trail buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `backup-access-logs-${testEnvironmentSuffix}-${testAccount}-${testRegion}`,
      });

      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `backup-audit-trail-${testEnvironmentSuffix}-${testAccount}-${testRegion}`,
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should create backup metadata table with point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', Match.objectLike({
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: Match.objectLike({
          SSEEnabled: true,
        }),
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'StatusIndex',
          }),
        ]),
        TimeToLiveSpecification: Match.objectLike({
          Enabled: true,
        }),
      }));
    });

    test('should create deduplication table for backup integrity', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', Match.objectLike({
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: Match.objectLike({
          SSEEnabled: true,
        }),
        TimeToLiveSpecification: Match.objectLike({
          Enabled: true,
        }),
      }));
    });
  });

  describe('SQS Queues', () => {
    test('should create backup queue with dead letter queue', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
      
      // Main queue properties
      template.hasResourceProperties('AWS::SQS::Queue', Match.objectLike({
        ReceiveMessageWaitTimeSeconds: 20,
        VisibilityTimeout: 900,
        RedrivePolicy: Match.objectLike({
          deadLetterTargetArn: Match.anyValue(),
          maxReceiveCount: 3,
        }),
      }));
    });

    test('should create dead letter queue for failed messages', () => {
      template.hasResourceProperties('AWS::SQS::Queue', Match.objectLike({
        MessageRetentionPeriod: 1209600, // 14 days
      }));
    });
  });

  describe('Lambda Functions', () => {
    test('should create backup initiator function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        MemorySize: 512,
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            BACKUP_QUEUE_URL: Match.anyValue(),
            METADATA_TABLE: Match.anyValue(),
            MAX_CONCURRENT_BACKUPS: Match.anyValue(),
            NOTIFICATION_TOPIC_ARN: Match.anyValue(),
          }),
        }),
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        }),
      });
    });
  });

  describe('EventBridge Scheduling', () => {
    test('should create scheduled rule for backup initiation', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 2 * * ? *)',
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
            Id: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch dashboard for monitoring', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('.*BackupSystemMonitoring.*'),
        DashboardBody: Match.anyValue(),
      });
    });

    test('should create CloudWatch alarms for backup failures', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Period: 300,
        Statistic: 'Sum',
        Threshold: 1,
        TreatMissingData: 'notBreaching',
      }));

      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        MetricName: 'ApproximateNumberOfMessages',
        Namespace: 'AWS/SQS',
        Period: 60,
        Statistic: 'Average',
        Threshold: 1,
        TreatMissingData: 'notBreaching',
      }));
    });
  });

  describe('SNS Notifications', () => {
    test('should create SNS topic for backup notifications', () => {
      template.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({
        KmsMasterKeyId: Match.anyValue(),
      }));
    });
  });

  describe('CloudTrail Audit Logging', () => {
    test('should create CloudTrail for comprehensive audit logging', () => {
      template.hasResourceProperties('AWS::CloudTrail::Trail', Match.objectLike({
        IncludeGlobalServiceEvents: true,
        IsMultiRegionTrail: true,
        EnableLogFileValidation: true,
      }));
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create backup execution role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
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
      }));
    });

    test('should create IAM policies for backup operations', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const statements: any[] = [];
      Object.values(roles).forEach((r: any) => {
        const inline = r.Properties?.Policies || [];
        inline.forEach((p: any) => {
          const stmts = p.PolicyDocument?.Statement || [];
          statements.push(...stmts);
        });
      });
      const discovered = new Set<string>();
      for (const s of statements) {
        const actions = Array.isArray(s.Action) ? s.Action : [s.Action].filter(Boolean);
        if (s.Effect === 'Allow') {
          for (const a of actions) {
            discovered.add(a);
          }
        }
      }
      const hasSqsSend = discovered.has('sqs:SendMessage');
      const hasSnsPublish = discovered.has('sns:Publish');
      const hasDynamoWrite = ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:BatchWriteItem']
        .some((a) => discovered.has(a));
      const hasDynamoRead = ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:BatchGetItem']
        .some((a) => discovered.has(a));
      expect(hasSqsSend && hasSnsPublish && hasDynamoWrite && hasDynamoRead).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('should apply consistent tags to all resources', () => {
      const resources = template.findResources('*');
      
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties?.Tags) {
          expect(resource.Properties.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                Key: 'Environment',
                Value: testEnvironmentSuffix,
              }),
            ])
          );
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should export all necessary outputs', () => {
      template.hasOutput('BackupBucketName', {
        Value: Match.anyValue(),
      });

      template.hasOutput('ReplicationBucketName', {
        Value: Match.anyValue(),
      });

      template.hasOutput('EncryptionKeyId', {
        Value: Match.anyValue(),
      });

      template.hasOutput('MetadataTableName', {
        Value: Match.anyValue(),
      });

      template.hasOutput('DeduplicationTableName', {
        Value: Match.anyValue(),
      });

      template.hasOutput('BackupQueueUrl', {
        Value: Match.anyValue(),
      });

      template.hasOutput('NotificationTopicArn', {
        Value: Match.anyValue(),
      });

      template.hasOutput('DashboardURL', {
        Value: Match.anyValue(),
      });

      template.hasOutput('SystemCapabilities', {
        Value: Match.stringLikeRegexp('.*maxUsers.*1000.*'),
      });
    });
  });

  describe('Security Configuration', () => {
    test('should ensure all S3 buckets block public access', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('should ensure all DynamoDB tables have encryption enabled', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.SSESpecification).toEqual(
          expect.objectContaining({ SSEEnabled: true })
        );
      });
    });

    test('should ensure all Lambda functions are in VPC', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      
      Object.values(functions).forEach((func: any) => {
        if (func.Properties.FunctionName?.includes('Backup')) {
          expect(func.Properties.VpcConfig).toBeDefined();
          expect(func.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
          expect(func.Properties.VpcConfig.SubnetIds).toBeDefined();
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should configure intelligent tiering for S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        IntelligentTieringConfigurations: Match.arrayWith([
          Match.objectLike({
            Id: 'backup-intelligent-tiering',
            Status: 'Enabled',
            Tierings: Match.arrayWith([
              {
                AccessTier: 'ARCHIVE_ACCESS',
                Days: 90,
              },
              {
                AccessTier: 'DEEP_ARCHIVE_ACCESS',
                Days: 180,
              },
            ]),
          }),
        ]),
      });
    });

    test('should use pay-per-request billing for DynamoDB', () => {
      const tables = template.findResources('AWS::DynamoDB::Table');
      
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });
    });
  });


  describe('VPC Endpoints Disabled Configuration', () => {
    let noVpcStack: TapStack;
    let noVpcTemplate: Template;

    beforeEach(() => {
      const noVpcApp = new cdk.App();
      noVpcStack = new TapStack(noVpcApp, 'NoVpcTapStack', {
        environmentSuffix: 'test',
        enableVpcEndpoints: false,
        env: {
          account: testAccount,
          region: testRegion,
        },
      });
      noVpcTemplate = Template.fromStack(noVpcStack);
    });

    test('should not create VPC when endpoints are disabled', () => {
      noVpcTemplate.resourceCountIs('AWS::EC2::VPC', 0);
    });

    test('should not create VPC endpoints when disabled', () => {
      noVpcTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
    });

    test('should not include VPC access role for Lambda when VPC disabled', () => {
      // Verify IAM role has only basic execution policy, not VPC access
      const roles = noVpcTemplate.findResources('AWS::IAM::Role');
      const roleProps = Object.values(roles)[0] as any;
      const managedPolicies = roleProps.Properties.ManagedPolicyArns;
      
      // Should only have basic execution role, not VPC access role
      expect(managedPolicies).toHaveLength(1);
      
      // Verify the policy is the basic execution role
      const policyArn = managedPolicies[0];
      const joinArray = policyArn['Fn::Join'][1];
      expect(joinArray.some((part: any) => 
        typeof part === 'string' && part.includes('AWSLambdaBasicExecutionRole')
      )).toBe(true);
    });

    test('should not configure Lambda function with VPC when disabled', () => {
      const functions = noVpcTemplate.findResources('AWS::Lambda::Function');
      const lambdaProps = Object.values(functions)[0] as any;
      
      // VpcConfig should not be present when VPC is disabled
      expect(lambdaProps.Properties.VpcConfig).toBeUndefined();
    });
  });

  describe('Optional Notification Email Configuration', () => {
    let noEmailStack: TapStack;
    let noEmailTemplate: Template;

    beforeEach(() => {
      const noEmailApp = new cdk.App();
      noEmailStack = new TapStack(noEmailApp, 'NoEmailTapStack', {
        environmentSuffix: 'test',
        // notificationEmail is not provided
        env: {
          account: testAccount,
          region: testRegion,
        },
      });
      noEmailTemplate = Template.fromStack(noEmailStack);
    });

    test('should create SNS topic without email subscription when email not provided', () => {
      // SNS topic should still be created
      noEmailTemplate.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Backup System Notifications',
      });
      
      // But no email subscription should be created
      noEmailTemplate.resourceCountIs('AWS::SNS::Subscription', 0);
    });
  });

  describe('Configuration Variations', () => {
    test('should handle custom retention days', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomRetentionTapStack', {
        environmentSuffix: 'custom',
        retentionDays: 90,
        env: {
          account: testAccount,
          region: testRegion,
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
            }),
          ]),
        },
      });
    });

    test('should handle custom schedule expression', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomScheduleTapStack', {
        environmentSuffix: 'custom',
        scheduleExpression: 'cron(0 6 * * ? *)',
        env: {
          account: testAccount,
          region: testRegion,
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'cron(0 6 * * ? *)',
      });
    });

    test('should handle custom max concurrent backups', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomConcurrentTapStack', {
        environmentSuffix: 'custom',
        maxConcurrentBackups: 20,
        env: {
          account: testAccount,
          region: testRegion,
        },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            MAX_CONCURRENT_BACKUPS: '20',
          },
        },
      });
    });
  });
});
