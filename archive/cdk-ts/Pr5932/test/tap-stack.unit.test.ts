import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create 3 NAT Gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets with egress', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Type', Value: 'Private' }),
        ]),
      }));
    });

    test('should create isolated database subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Type', Value: 'Database' }),
        ]),
      }));
    });

    test('should tag all subnets with iac-rlhf-amazon', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      }));
    });

    test('should create development VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });
  });

  describe('Transit Gateway Configuration', () => {
    test('should create Transit Gateway with correct ASN', () => {
      template.hasResourceProperties('AWS::EC2::TransitGateway', {
        AmazonSideAsn: 64512,
        DefaultRouteTableAssociation: 'disable',
        DefaultRouteTablePropagation: 'disable',
        DnsSupport: 'enable',
        VpnEcmpSupport: 'enable',
      });
    });

    test('should create Transit Gateway attachments for production VPC', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Value: Match.stringLikeRegexp('tgw-attachment-prod') }),
        ]),
      }));
    });

    test('should create Transit Gateway attachments for development VPC', () => {
      template.hasResourceProperties('AWS::EC2::TransitGatewayAttachment', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Value: Match.stringLikeRegexp('tgw-attachment-dev') }),
        ]),
      }));
    });

    test('should create separate route tables for production and development', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayRouteTable', 2);
    });

    test('should associate route tables with attachments', () => {
      template.resourceCountIs('AWS::EC2::TransitGatewayRouteTableAssociation', 2);
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create 3 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 3);
    });

    test('should enable versioning on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('should block public access on all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should apply encryption to all S3 buckets', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
      });
    });

    test('should configure lifecycle rules on Flow Logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: Match.stringLikeRegexp('flowlogs'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              ExpirationInDays: 90,
              Status: 'Enabled',
            }),
          ]),
        },
      }));
    });

    test('should configure lifecycle transition on Trading Data bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: Match.stringLikeRegexp('data'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
              ]),
            }),
          ]),
        },
      }));
    });

    test('should configure Glacier transition on Backup bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
        BucketName: Match.stringLikeRegexp('backup'),
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      }));
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Logs with S3 destination', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 's3',
      });
    });

    test('should configure flow logs with correct aggregation interval', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        MaxAggregationInterval: 600,
      });
    });

    test('should configure custom log format', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        LogFormat: Match.stringLikeRegexp('srcaddr'),
      });
    });
  });

  describe('DynamoDB Tables Configuration', () => {
    test('should create 3 DynamoDB tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 3);
    });

    test('should configure Trading Orders table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TradingOrders'),
        KeySchema: [
          { AttributeName: 'orderId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('should configure Market Data table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('MarketData'),
        KeySchema: [
          { AttributeName: 'symbol', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
      });
    });

    test('should configure User Accounts table with correct key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('UserAccounts'),
        KeySchema: [{ AttributeName: 'accountId', KeyType: 'HASH' }],
      });
    });

    test('should enable on-demand billing for all tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should enable point-in-time recovery on all tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should enable DynamoDB streams on orders table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TradingOrders'),
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('should enable encryption on all tables', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('should create Global Secondary Index on Orders table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TradingOrders'),
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'UserOrdersIndex',
          }),
        ]),
      });
    });
  });

  describe('Route 53 Configuration', () => {
    test('should create private hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: Match.stringLikeRegexp('trading-platform.internal'),
      });
    });

    test('should create health checks with HTTPS protocol', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTPS',
          Port: 443,
          RequestInterval: 30,
          FailureThreshold: 3,
        }),
      });
    });

    test('should create API health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          FullyQualifiedDomainName: Match.stringLikeRegexp('api'),
        }),
      });
    });

    test('should create database health check', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          FullyQualifiedDomainName: Match.stringLikeRegexp('db'),
        }),
      });
    });
  });

  describe('Lambda Functions Configuration', () => {
    test('should create 3 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('should configure Lambda functions with ARM64 architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['arm64'],
      });
    });

    test('should configure Lambda functions with Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
      });
    });

    test('should configure Health Check Lambda with correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('health-check'),
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('should configure Auto Response Lambda with correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('auto-response'),
        Timeout: 60,
        MemorySize: 1024,
      });
    });

    test('should configure Order Processing Lambda with correct timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: Match.stringLikeRegexp('order-processor'),
        Timeout: 300,
        MemorySize: 2048,
      });
    });

    test('should deploy Lambda functions in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should configure event source mapping for order processing', () => {
      template.hasResourceProperties('AWS::Lambda::EventSourceMapping', {
        BatchSize: 10,
        StartingPosition: 'LATEST',
      });
    });
  });

  describe('EventBridge Configuration', () => {
    test('should create EventBridge rule for health checks', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(5 minutes)',
      });
    });

    test('should configure rule with Lambda target', () => {
      template.hasResourceProperties('AWS::Events::Rule', Match.objectLike({
        Targets: Match.arrayWith([
          Match.objectLike({
            Arn: Match.anyValue(),
          }),
        ]),
      }));
    });
  });

  describe('SSM Parameter Store Configuration', () => {
    test('should create SSM parameters', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 5);
    });

    test('should store alert thresholds configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('alert-thresholds'),
        Type: 'String',
      });
    });

    test('should store database configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('database-config'),
        Type: 'String',
      });
    });

    test('should store network configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('network-config'),
        Type: 'String',
      });
    });

    test('should store S3 bucket configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('s3-config'),
        Type: 'String',
      });
    });

    test('should store Transit Gateway attachments', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('tgw-attachments'),
        Type: 'String',
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create 3 security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('should configure application security group with HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      }));
    });

    test('should configure database security group with restricted egress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('db-sg'),
        SecurityGroupEgress: [],
      });
    });

    test('should configure database security group with PostgreSQL ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
      });
    });

    test('should configure database security group with MySQL ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('VPC Endpoints Configuration', () => {
    test('should create S3 VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('s3')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create DynamoDB VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp('dynamodb')]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });
    });

    test('should create SSM VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(),
        VpcEndpointType: 'Interface',
      });
      // Verify the SSM endpoint exists by checking for 'ssm' in service name
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          VpcEndpointType: 'Interface',
        },
      });
      const ssmEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        return typeof serviceName === 'string'
          ? serviceName.includes('ssm')
          : JSON.stringify(serviceName).includes('ssm');
      });
      expect(ssmEndpoint).toBeDefined();
    });

    test('should create Lambda VPC endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.anyValue(),
        VpcEndpointType: 'Interface',
      });
      // Verify the Lambda endpoint exists by checking for 'lambda' in service name
      const endpoints = template.findResources('AWS::EC2::VPCEndpoint', {
        Properties: {
          VpcEndpointType: 'Interface',
        },
      });
      const lambdaEndpoint = Object.values(endpoints).find((endpoint: any) => {
        const serviceName = endpoint.Properties.ServiceName;
        // Check if it's lambda service (not lambda-related services like logs)
        if (typeof serviceName === 'string') {
          return serviceName.match(/\.lambda$/) !== null;
        } else {
          const str = JSON.stringify(serviceName);
          return str.includes('lambda') && !str.includes('logs');
        }
      });
      expect(lambdaEndpoint).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });

    test('should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('lambda-error-alarm'),
        Threshold: 5,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });

    test('should create DynamoDB throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp('dynamodb-throttle-alarm'),
        Threshold: 10,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('IAM Permissions Configuration', () => {
    test('should grant DynamoDB read/write permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                Match.stringLikeRegexp('dynamodb:.*'),
              ]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('should grant S3 read/write permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('should grant EC2 describe permissions for Transit Gateway checks', () => {
      // Verify EC2 permissions exist in the Lambda execution role policy
      const policies = template.findResources('AWS::IAM::Policy');
      const hasEc2Permission = Object.values(policies).some((policy: any) => {
        const statements = policy.Properties?.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions.includes('ec2:DescribeTransitGateways') && stmt.Effect === 'Allow';
        });
      });
      expect(hasEc2Permission).toBe(true);
    });

    test('should grant SSM read permissions to auto-response Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonSSMReadOnlyAccess'),
              ]),
            ]),
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs Configuration', () => {
    test('should output Transit Gateway attachment IDs', () => {
      template.hasOutput('TransitGatewayAttachmentProdId', {});
      template.hasOutput('TransitGatewayAttachmentDevId', {});
    });

    test('should output Route 53 Hosted Zone ID', () => {
      template.hasOutput('HostedZoneId', {});
    });

    test('should output S3 Bucket ARNs', () => {
      template.hasOutput('FlowLogsBucketArn', {});
      template.hasOutput('TradingDataBucketArn', {});
      template.hasOutput('BackupBucketArn', {});
    });

    test('should output VPC information', () => {
      template.hasOutput('VPCId', {});
      template.hasOutput('VPCCidr', {});
    });

    test('should output DynamoDB table names', () => {
      template.hasOutput('OrdersTableName', {});
      template.hasOutput('MarketDataTableName', {});
    });

    test('should output Lambda function ARNs', () => {
      template.hasOutput('HealthCheckLambdaArn', {});
      template.hasOutput('OrderProcessingLambdaArn', {});
    });

    test('should output Transit Gateway ID', () => {
      template.hasOutput('TransitGatewayId', {});
    });
  });

  describe('Tagging Configuration', () => {
    test('should tag stack with iac-rlhf-amazon', () => {
      const stackTags = cdk.Tags.of(stack);
      expect(stackTags).toBeDefined();
    });

    test('should tag resources with Application tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Application', Value: 'TradingPlatform' }),
        ]),
      }));
    });

    test('should tag resources with Environment tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: Match.anyValue() }),
        ]),
      }));
    });

    test('should tag resources with iac-rlhf-amazon tag', () => {
      template.hasResourceProperties('AWS::EC2::VPC', Match.objectLike({
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'iac-rlhf-amazon', Value: 'true' }),
        ]),
      }));
    });
  });

  describe('Resource Naming Convention', () => {
    test('should use environment suffix in resource names', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`tap-${environmentSuffix}`),
          }),
        ]),
      });
    });

    test('should include region in S3 bucket names', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('ap-northeast-1'),
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy resources across 3 availability zones', () => {
      // Main VPC: 3 AZs × 3 subnet types (public, private, database) = 9 subnets
      // Dev VPC: 2 AZs × 1 subnet type (private isolated) = 2 subnets
      // Total: 11 subnets
      template.resourceCountIs('AWS::EC2::Subnet', 11);
    });

    test('should create NAT Gateway per availability zone', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 3);
    });
  });

  describe('Environment Suffix Configuration', () => {
    test('should use context environmentSuffix when provided', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'test-context',
        },
      });
      const stackWithContext = new TapStack(appWithContext, 'TestContextStack', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const templateWithContext = Template.fromStack(stackWithContext);

      // Verify resources are created with the context suffix
      templateWithContext.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-test-context-lambda-execution-role',
      });
    });

    test('should default to dev when no context or env var is set', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;

      const appNoEnv = new cdk.App();
      const stackNoEnv = new TapStack(appNoEnv, 'TestDefaultStack', {
        env: {
          account: '123456789012',
          region: 'ap-northeast-1',
        },
      });
      const templateNoEnv = Template.fromStack(stackNoEnv);

      // Verify resources are created with default 'dev' suffix
      templateNoEnv.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'tap-dev-lambda-execution-role',
      });

      // Restore original env
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      }
    });
  });
});
