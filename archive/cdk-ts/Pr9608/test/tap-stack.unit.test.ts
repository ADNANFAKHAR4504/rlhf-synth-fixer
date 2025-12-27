import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key Configuration', () => {
    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: Match.stringLikeRegexp('.*encryption.*'),
      });
    });

    test('creates KMS alias with environmentSuffix', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/analytics-key-${environmentSuffix}`,
      });
    });

    test('KMS key has CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowCloudWatchLogs',
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.stringLikeRegexp('logs.*amazonaws.com'),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct name', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `analytics-vpc-${environmentSuffix}`,
          }),
        ]),
      });
    });

    test('creates three private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 3);
    });

    test('creates S3 gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              'com.amazonaws.',
              Match.objectLike({ Ref: 'AWS::Region' }),
              '.s3',
            ]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('creates DynamoDB gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([
              'com.amazonaws.',
              Match.objectLike({ Ref: 'AWS::Region' }),
              '.dynamodb',
            ]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('creates Lambda interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.stringLikeRegexp('.*lambda'),
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates audit logs bucket with environmentSuffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `audit-logs-${environmentSuffix}`,
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates raw data bucket with logging', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `raw-data-${environmentSuffix}`,
        LoggingConfiguration: Match.objectLike({
          LogFilePrefix: 'raw-data-logs/',
        }),
      });
    });

    test('creates processed data bucket with logging', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `processed-data-${environmentSuffix}`,
        LoggingConfiguration: Match.objectLike({
          LogFilePrefix: 'processed-data-logs/',
        }),
      });
    });

    test('all buckets have KMS encryption', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketCount = Object.keys(buckets).length;
      expect(bucketCount).toBe(3);

      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('raw data bucket has deny policy for unencrypted uploads', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:PutObject',
              Condition: {
                StringNotEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
            }),
          ]),
        }),
      });
    });
  });

  describe('Security Groups', () => {
    test('creates endpoint security group with HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for VPC interface endpoints',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('creates Lambda security group with restricted egress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda data processing functions',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates permission boundary with EC2 permissions', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        ManagedPolicyName: `lambda-permission-boundary-${environmentSuffix}`,
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'AllowedServices',
              Effect: 'Allow',
              Action: Match.arrayWith([
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
              ]),
            }),
          ]),
        }),
      });
    });

    test('creates permission boundary with deny destructive actions', () => {
      template.hasResourceProperties('AWS::IAM::ManagedPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'DenyDestructiveActions',
              Effect: 'Deny',
              Action: Match.arrayWith([
                's3:DeleteBucket',
                'kms:ScheduleKeyDeletion',
              ]),
            }),
          ]),
        }),
      });
    });

    test('creates Lambda role with permission boundary', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `data-processor-role-${environmentSuffix}`,
        PermissionsBoundary: Match.objectLike({
          Ref: Match.stringLikeRegexp('PermissionBoundary.*'),
        }),
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('creates Lambda log group with KMS encryption and 90-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/data-processor-${environmentSuffix}`,
        RetentionInDays: 90,
        KmsKeyId: Match.objectLike({
          'Fn::GetAtt': Match.arrayWith([Match.stringLikeRegexp('.*Key.*')]),
        }),
      });
    });

    test('creates API Gateway log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/analytics-api-${environmentSuffix}`,
        RetentionInDays: 90,
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with environmentSuffix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `data-processor-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Timeout: 300,
        MemorySize: 512,
      });
    });

    test('Lambda function runs in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SecurityGroupIds: Match.anyValue(),
          SubnetIds: Match.anyValue(),
        }),
      });
    });

    test('Lambda function has environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `data-processor-${environmentSuffix}`,
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            RAW_DATA_BUCKET: Match.anyValue(),
            PROCESSED_DATA_BUCKET: Match.anyValue(),
            KMS_KEY_ID: Match.anyValue(),
          }),
        }),
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates EventBridge rule for S3 events', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Name: `s3-object-created-${environmentSuffix}`,
        EventPattern: Match.objectLike({
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
        }),
      });
    });

    test('EventBridge rule targets Lambda function', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.objectLike({
              'Fn::GetAtt': Match.arrayWith([
                Match.stringLikeRegexp('.*Function.*'),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with environmentSuffix', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `analytics-api-${environmentSuffix}`,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('creates API key with environmentSuffix', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `analytics-api-key-${environmentSuffix}`,
      });
    });

    test('creates usage plan', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `analytics-usage-plan-${environmentSuffix}`,
        Throttle: {
          RateLimit: 100,
          BurstLimit: 200,
        },
      });
    });

    test('creates GET method with API key required', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true,
      });
    });

    test('creates POST method with API key required', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF WebACL with rate limiting', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: `analytics-waf-${environmentSuffix}`,
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: Match.objectLike({
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            }),
          }),
        ]),
      });
    });

    test('WAF has SQL injection protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'SQLInjectionProtection',
            Statement: Match.objectLike({
              SqliMatchStatement: Match.anyValue(),
            }),
          }),
        ]),
      });
    });

    test('WAF has XSS protection', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'XSSProtection',
            Statement: Match.objectLike({
              XssMatchStatement: Match.anyValue(),
            }),
          }),
        ]),
      });
    });

    test('WAF is associated with API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
        WebACLArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `security-alarms-${environmentSuffix}`,
      });
    });

    test('creates API error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-4xx-errors-${environmentSuffix}`,
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('creates Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-errors-${environmentSuffix}`,
        Threshold: 5,
      });
    });

    test('creates WAF blocked requests alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `waf-blocked-requests-${environmentSuffix}`,
        Threshold: 100,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Export: {
          Name: `api-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('exports API Key ID', () => {
      template.hasOutput('ApiKeyId', {
        Export: {
          Name: `api-key-id-${environmentSuffix}`,
        },
      });
    });

    test('exports all S3 bucket names', () => {
      template.hasOutput('RawDataBucketName', {
        Export: {
          Name: `raw-data-bucket-${environmentSuffix}`,
        },
      });
      template.hasOutput('ProcessedDataBucketName', {
        Export: {
          Name: `processed-data-bucket-${environmentSuffix}`,
        },
      });
      template.hasOutput('AuditLogsBucketName', {
        Export: {
          Name: `audit-logs-bucket-${environmentSuffix}`,
        },
      });
    });

    test('exports KMS key ARN', () => {
      template.hasOutput('KmsKeyArn', {
        Export: {
          Name: `kms-key-arn-${environmentSuffix}`,
        },
      });
    });

    test('exports Lambda function name', () => {
      template.hasOutput('DataProcessorFunctionName', {
        Export: {
          Name: `data-processor-function-${environmentSuffix}`,
        },
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Export: {
          Name: `vpc-id-${environmentSuffix}`,
        },
      });
    });

    test('exports security group IDs', () => {
      template.hasOutput('LambdaSecurityGroupId', {
        Export: {
          Name: `lambda-sg-${environmentSuffix}`,
        },
      });
      template.hasOutput('EndpointSecurityGroupId', {
        Export: {
          Name: `endpoint-sg-${environmentSuffix}`,
        },
      });
    });

    test('exports IAM role and policy ARNs', () => {
      template.hasOutput('DataProcessorRoleArn', {
        Export: {
          Name: `data-processor-role-${environmentSuffix}`,
        },
      });
      template.hasOutput('PermissionBoundaryArn', {
        Export: {
          Name: `permission-boundary-${environmentSuffix}`,
        },
      });
    });

    test('exports CloudWatch log group names', () => {
      template.hasOutput('DataProcessorLogGroupName', {
        Export: {
          Name: `data-processor-logs-${environmentSuffix}`,
        },
      });
      template.hasOutput('ApiGatewayLogGroupName', {
        Export: {
          Name: `api-gateway-logs-${environmentSuffix}`,
        },
      });
    });

    test('exports WAF WebACL ARN', () => {
      template.hasOutput('WebAclArn', {
        Export: {
          Name: `waf-webacl-${environmentSuffix}`,
        },
      });
    });

    test('exports SNS topic ARN', () => {
      template.hasOutput('SecurityAlarmTopicArn', {
        Export: {
          Name: `security-alarm-topic-${environmentSuffix}`,
        },
      });
    });

    test('exports EventBridge rule name', () => {
      template.hasOutput('S3EventRuleName', {
        Export: {
          Name: `s3-event-rule-${environmentSuffix}`,
        },
      });
    });

    test('exports CloudWatch alarm names', () => {
      template.hasOutput('ApiErrorAlarmName', {
        Export: {
          Name: `api-error-alarm-${environmentSuffix}`,
        },
      });
      template.hasOutput('LambdaErrorAlarmName', {
        Export: {
          Name: `lambda-error-alarm-${environmentSuffix}`,
        },
      });
      template.hasOutput('WafBlockedRequestsAlarmName', {
        Export: {
          Name: `waf-blocked-alarm-${environmentSuffix}`,
        },
      });
    });

    test('has exactly 21 outputs', () => {
      const outputs = Object.keys(template.findOutputs('*'));
      expect(outputs.length).toBe(21);
    });
  });

  describe('Resource Counts', () => {
    test('has correct number of core resources', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::KMS::Key', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('has data processor Lambda function', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          FunctionName: `data-processor-${environmentSuffix}`,
        },
      });
      expect(Object.keys(functions).length).toBe(1);
    });
  });
});
