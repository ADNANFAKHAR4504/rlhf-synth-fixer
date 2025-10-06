import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test',
      env: { account: '123456789012', region: 'us-east-1' }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: 'TestTapStack/AIplatformVPC' }
        ])
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('TestTapStack/AIplatformVPC/Public') }
        ])
      }));

      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp('TestTapStack/AIplatformVPC/Private') }
        ])
      }));
    });

    test('should create security groups with correct rules', () => {
      // Check Lambda security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Fulfillment Lambda'
      });

      // Check Redis security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ElastiCache Redis'
      });

      // Check security group ingress rule for Redis
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'Allow Lambda to connect to Redis',
        FromPort: 6379,
        ToPort: 6379,
        IpProtocol: 'tcp'
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          { AttributeName: 'conversationId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'N' }
        ],
        KeySchema: [
          { AttributeName: 'conversationId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: { SSEEnabled: true },
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true
        }
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('ElastiCache Redis', () => {
    test('should create Redis subnet group', () => {
      template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
        Description: 'Subnet group for Redis cluster'
      });
    });

    test('should create Redis cluster with correct configuration', () => {
      template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
        CacheNodeType: 'cache.r6g.large',
        Engine: 'redis',
        EngineVersion: '7.0',
        NumCacheNodes: 1,
        PreferredMaintenanceWindow: 'sun:05:00-sun:06:00'
      });
    });
  });

  describe('S3 Data Lake Bucket', () => {
    test('should create S3 bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        VersioningConfiguration: { Status: 'Enabled' },
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'archive-old-data',
              Status: 'Enabled',
              Transitions: [
                { StorageClass: 'STANDARD_IA', TransitionInDays: 30 },
                { StorageClass: 'GLACIER', TransitionInDays: 90 }
              ]
            }
          ]
        }
      });
    });

    test('should have DESTROY removal policy and auto-delete objects', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });

      // Check for auto-delete objects custom resource
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });

    test('should have correct bucket name format', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              'ai-platform-data-lake-',
              { Ref: 'AWS::AccountId' },
              '-test'
            ]
          ]
        }
      });
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should create Kinesis stream with correct configuration', () => {
      template.hasResourceProperties('AWS::Kinesis::Stream', {
        RetentionPeriodHours: 168, // 7 days
        StreamEncryption: {
          EncryptionType: 'KMS',
          KeyId: 'alias/aws/kinesis'
        },
        StreamModeDetails: {
          StreamMode: 'ON_DEMAND'
        }
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::Kinesis::Stream', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('Kinesis Firehose', () => {
    test('should create Firehose delivery role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'firehose.amazonaws.com' }
            }
          ]
        }
      });
    });

    test('should create Firehose delivery stream', () => {
      template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        DeliveryStreamType: 'KinesisStreamAsSource',
        S3DestinationConfiguration: {
          BufferingHints: {
            IntervalInSeconds: 60,
            SizeInMBs: 128
          },
          CompressionFormat: 'GZIP',
          ErrorOutputPrefix: 'errors/',
          Prefix: 'conversations/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/'
        }
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
        TracingConfig: { Mode: 'Active' },
        Environment: {
          Variables: {
            CONTEXT_TABLE_NAME: { Ref: Match.stringLikeRegexp('ConversationContextTable') },
            REDIS_ENDPOINT: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('RedisSessionCluster'),
                'RedisEndpoint.Address'
              ]
            },
            REDIS_PORT: {
              'Fn::GetAtt': [
                Match.stringLikeRegexp('RedisSessionCluster'),
                'RedisEndpoint.Port'
              ]
            },
            EVENT_STREAM_NAME: { Ref: Match.stringLikeRegexp('ConversationEventStream') }
          }
        }
      });
    });

    test('should have VPC configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SecurityGroupIds: Match.arrayWith([
            { 'Fn::GetAtt': [Match.stringLikeRegexp('LambdaSecurityGroup'), 'GroupId'] }
          ]),
          SubnetIds: Match.arrayWith([
            { Ref: Match.stringLikeRegexp('AIplatformVPCPrivateSubnet') }
          ])
        }
      });
    });

    test('should have correct IAM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: [
                'comprehend:DetectSentiment',
                'comprehend:DetectEntities',
                'comprehend:DetectKeyPhrases'
              ],
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: 'translate:TranslateText',
              Resource: '*'
            },
            {
              Effect: 'Allow',
              Action: 'polly:SynthesizeSpeech',
              Resource: '*'
            }
          ])
        }
      });
    });
  });

  describe('Lex V2 Bot', () => {
    test('should create Lex bot role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'lexv2.amazonaws.com' }
            }
          ]
        },
        ManagedPolicyArns: [
          { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/AmazonLexRunBotsOnly']] }
        ]
      });
    });

    test('should create Lex bot with correct configuration', () => {
      template.hasResourceProperties('AWS::Lex::Bot', {
        name: 'OmnichannelAIBot-test',
        dataPrivacy: { childDirected: false },
        idleSessionTtlInSeconds: 300,
        botLocales: Match.arrayWith([
          {
            localeId: 'en_US',
            nluConfidenceThreshold: 0.7,
            description: 'English US locale',
            voiceSettings: {
              voiceId: 'Joanna',
              engine: 'neural'
            },
            intents: Match.anyValue(),
            slotTypes: Match.anyValue()
          },
          {
            localeId: 'es_ES',
            nluConfidenceThreshold: 0.7,
            description: 'Spanish Spain locale',
            voiceSettings: {
              voiceId: 'Lucia',
              engine: 'neural'
            },
            intents: Match.anyValue(),
            slotTypes: Match.anyValue()
          }
        ])
      });
    });

    test('should create bot alias with Lambda integration', () => {
      template.hasResourceProperties('AWS::Lex::BotAlias', {
        botAliasName: 'Production',
        botAliasLocaleSettings: Match.arrayWith([
          {
            botAliasLocaleSettingsId: 'en_US',
            enabled: true,
            codeHookSpecification: {
              lambdaCodeHook: {
                codeHookInterfaceVersion: '1.0',
                lambdaArn: Match.anyValue()
              }
            }
          },
          {
            botAliasLocaleSettingsId: 'es_ES',
            enabled: true,
            codeHookSpecification: {
              lambdaCodeHook: {
                codeHookInterfaceVersion: '1.0',
                lambdaArn: Match.anyValue()
              }
            }
          }
        ])
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create intent accuracy alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Intent recognition accuracy has fallen below 75%',
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 2,
        MetricName: 'IntentRecognitionAccuracy',
        Namespace: 'AIplatform/Conversational',
        Period: 300,
        Statistic: 'Average',
        Threshold: 0.75,
        TreatMissingData: 'notBreaching',
        Dimensions: Match.arrayWith([
          { Name: 'Environment', Value: 'test' }
        ])
      });
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Fulfillment Lambda has excessive errors',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 2,
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Period: 300,
        Statistic: 'Sum',
        Threshold: 10
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export all required outputs', () => {
      template.hasOutput('BotId', {
        Description: 'Lex V2 Bot ID'
      });

      template.hasOutput('BotAliasId', {
        Description: 'Lex V2 Bot Alias ID'
      });

      template.hasOutput('FulfillmentLambdaArn', {
        Description: 'Fulfillment Lambda ARN'
      });

      template.hasOutput('DataLakeBucketName', {
        Description: 'Data Lake S3 Bucket Name'
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      
      defaultTemplate.hasResourceProperties('AWS::Lex::Bot', {
        name: 'OmnichannelAIBot-dev'
      });
    });

    test('should use context environment suffix when provided', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'prod');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      
      contextTemplate.hasResourceProperties('AWS::Lex::Bot', {
        name: 'OmnichannelAIBot-prod'
      });
    });
  });

  describe('Resource Counts', () => {
    test('should create correct number of resources', () => {
      // VPC and networking
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      template.resourceCountIs('AWS::EC2::SecurityGroupIngress', 1);
      
      // Storage
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
      template.resourceCountIs('AWS::ElastiCache::CacheCluster', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      
      // Analytics
      template.resourceCountIs('AWS::Kinesis::Stream', 1);
      template.resourceCountIs('AWS::KinesisFirehose::DeliveryStream', 1);
      
      // Compute
      template.resourceCountIs('AWS::Lambda::Function', 3); // Main function + log retention + auto-delete
      
      // AI Services
      template.resourceCountIs('AWS::Lex::Bot', 1);
      template.resourceCountIs('AWS::Lex::BotAlias', 1);
      
      // Monitoring
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      
      // IAM
      template.resourceCountIs('AWS::IAM::Role', 5); // Lambda, Lex, Firehose, Log retention, Auto-delete
      template.resourceCountIs('AWS::IAM::Policy', 4);
    });
  });

  describe('Lambda Code', () => {
    test('should contain inline Lambda code with required functionality', () => {
      const lambdaFunction = template.findResources('AWS::Lambda::Function', {
        Properties: { Runtime: 'nodejs18.x' }
      });
      
      const functionCode = Object.values(lambdaFunction)[0].Properties.Code.ZipFile;
      
      // Check for key functionality in the Lambda code
      expect(functionCode).toContain('const AWS = require(\'aws-sdk\')');
      expect(functionCode).toContain('const redis = require(\'redis\')');
      expect(functionCode).toContain('const { v4: uuidv4 } = require(\'uuid\')');
      expect(functionCode).toContain('exports.handler = async (event) =>');
      expect(functionCode).toContain('comprehend.detectSentiment');
      expect(functionCode).toContain('translate.translateText');
      expect(functionCode).toContain('dynamodb.put');
      expect(functionCode).toContain('kinesis.putRecord');
      expect(functionCode).toContain('cloudwatch.putMetricData');
    });
  });
});
