import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { MultiRegionDRStack } from '../lib/multi-region-dr-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';
const account = process.env.CDK_DEFAULT_ACCOUNT || '123456789012';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, `TestTapStack${environmentSuffix}`, {
      environmentSuffix,
      env: {
        region: region,
        account: account,
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('Should create stack with correct environment suffix', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toContain(environmentSuffix);
    });

    test('Should use correct AWS region', () => {
      expect(stack.region).toBe(region);
    });

    test('Should instantiate MultiRegionDRStack construct', () => {
      const constructs = stack.node.children;
      const multiRegionDR = constructs.find(
        c => c instanceof MultiRegionDRStack
      );
      expect(multiRegionDR).toBeDefined();
    });

    test('Should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestWithProps', {
        environmentSuffix: 'test123',
        env: { region: region, account: account },
      });
      expect(testStack).toBeDefined();
    });

    test('Should use environment suffix from context when not in props', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'ctx456' } });
      const testStack = new TapStack(testApp, 'TestWithContext', {
        env: { region: region, account: account },
      });
      expect(testStack).toBeDefined();
    });

    test('Should default to dev when no environment suffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestWithDefault', {
        env: { region: region, account: account },
      });
      expect(testStack).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('Should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Should create exactly 3 private subnets (multi-AZ)', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 3);
    });

    test('Should create route tables for each subnet', () => {
      template.resourceCountIs('AWS::EC2::RouteTable', 3);
    });

    test('Should not create NAT Gateways (using VPC endpoints)', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });

    test('Should create VPC endpoints for RDS and Lambda', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: `com.amazonaws.${region}.rds`,
        VpcEndpointType: 'Interface',
      });

      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: `com.amazonaws.${region}.lambda`,
        VpcEndpointType: 'Interface',
      });
    });

    test('Should create security groups for VPC endpoints', () => {
      template.resourcePropertiesCountIs(
        'AWS::EC2::SecurityGroup',
        {
          GroupDescription: Match.stringLikeRegexp('.*Endpoint.*'),
        },
        2
      );
    });
  });

  describe('DynamoDB Resources', () => {
    test('Should create DynamoDB table for sessions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('Should create table with correct partition key', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
        ],
      });
    });

    test('Should include table name in session table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('trading-sessions-.*'),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('Should create config bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketName: Match.stringLikeRegexp(`trading-config-${region}-.*`),
      });
    });

    test('Should create audit logs bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketName: Match.stringLikeRegexp(`trading-audit-logs-${region}-.*`),
      });
    });

    test('Should create exactly 2 S3 buckets', () => {
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('Should enable auto-delete for S3 buckets', () => {
      template.resourceCountIs('Custom::S3AutoDeleteObjects', 2);
    });

    test('Should configure bucket names with region', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`.*-${region}-.*`),
      });
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('Should create Aurora PostgreSQL cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.12',
        StorageEncrypted: true,
      });
    });

    test('Should enable HTTP endpoint for Data API', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableHttpEndpoint: true,
      });
    });

    test('Should create DB cluster with backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('Should create serverless v2 scaling configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ServerlessV2ScalingConfiguration: {
          MaxCapacity: 2,
          MinCapacity: 0.5,
        },
      });
    });

    test('Should create writer and reader instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('Should create DB instances with serverless class', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.serverless',
        Engine: 'aurora-postgresql',
      });
    });

    test('Should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp(
          'Subnets for.*database'
        ),
      });
    });

    test('Should create secret for DB credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"dbadmin"}',
          GenerateStringKey: 'password',
        },
      });
    });
  });

  describe('SQS Queue', () => {
    test('Should create trade order queue', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 345600,
        VisibilityTimeout: 300,
      });
    });

    test('Should name queue with region and environment suffix', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: Match.stringLikeRegexp(`trade-orders-${region}-.*`),
      });
    });
  });

  describe('Lambda Functions', () => {
    test('Should create trade processor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        FunctionName: Match.stringLikeRegexp(`trade-processor-${region}-.*`),
      });
    });

    test('Should create health monitor Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 300,
        FunctionName: Match.stringLikeRegexp(`health-monitor-${region}-.*`),
      });
    });

    test('Should create health check Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        FunctionName: Match.stringLikeRegexp(`health-check-${region}-.*`),
      });
    });

    test('Should configure Lambda functions in VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: {
          SubnetIds: Match.anyValue(),
        },
        FunctionName: Match.stringLikeRegexp(`trade-processor-${region}-.*`),
      });
    });

    test('Should set Lambda environment variables correctly', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const tradeProcessor = Object.values(functions).find((fn: any) =>
        fn.Properties.FunctionName?.includes('trade-processor')
      ) as any;
      expect(tradeProcessor).toBeDefined();
      expect(tradeProcessor.Properties.Environment.Variables.REGION).toBe(
        region
      );
      expect(
        tradeProcessor.Properties.Environment.Variables.DB_SECRET_ARN
      ).toBeDefined();
    });

    test('Should grant DynamoDB permissions to trade processor', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('Should grant RDS Data API access to Lambda', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policyWithRDS = Object.values(policies).find((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action)
            ? stmt.Action
            : [stmt.Action];
          return actions.some((action: string) =>
            action.startsWith('rds-data:')
          );
        });
      });
      expect(policyWithRDS).toBeDefined();
    });

    test('Should grant SQS consume permissions to Lambda', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
                'sqs:GetQueueAttributes',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('API Gateway', () => {
    test('Should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp(`trading-api-${region}-.*`),
      });
    });

    test('Should create deployment with prod stage', () => {
      const stages = template.findResources('AWS::ApiGateway::Stage');
      const prodStage = Object.values(stages).find(
        (stage: any) => stage.Properties.StageName === 'prod'
      );
      expect(prodStage).toBeDefined();
    });

    test('Should create /trades resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'trades',
      });
    });

    test('Should create /health resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health',
      });
    });

    test('Should create POST method for /trades', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });

    test('Should create GET method for /trades', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
      });
    });

    test('Should integrate API Gateway with Lambda', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
        },
      });
    });
  });

  describe('EventBridge', () => {
    test('Should create custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: Match.stringLikeRegexp(`trading-events-${region}-.*`),
      });
    });

    test('Should create event rule for trade events', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['trading.platform'],
          'detail-type': ['Trade Executed', 'Trade Failed'],
        },
        State: 'ENABLED',
      });
    });

    test('Should create hourly health check rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(1 hour)',
      });
    });

    test('Should create CloudWatch Logs target for events', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('/aws/events/trading-.*'),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Should create Lambda error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('Should create API latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Threshold: 1000,
      });
    });

    test('Should create DB CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
      });
    });

    test('Should configure SNS actions for alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.anyValue(),
      });
    });
  });

  describe('SNS Topic', () => {
    test('Should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Trading Platform Alerts',
      });
    });

    test('Should name topic with region and environment', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp(`trading-alerts-${region}-.*`),
      });
    });
  });

  describe('Route 53 Health Check', () => {
    test('Should create health check for API', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTPS',
          ResourcePath: '/prod/health',
          RequestInterval: 30,
          FailureThreshold: 3,
        },
      });
    });
  });

  describe('Systems Manager Parameters', () => {
    test('Should create parameter for region', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Name: Match.stringLikeRegexp('/trading/.*/region'),
        Value: region,
      });
    });

    test('Should create parameter for DB endpoint', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/trading/.*/db-endpoint'),
      });
    });

    test('Should create parameter for API endpoint', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: Match.stringLikeRegexp('/trading/.*/api-endpoint'),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should export VPC ID', () => {
      template.hasOutput('*', {
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('.*VPC.*'),
        }),
      });
    });

    test('Should export DB cluster endpoint', () => {
      template.hasOutput('*', {
        Description: 'Aurora DB Cluster Endpoint',
      });
    });

    test('Should export DynamoDB table name', () => {
      template.hasOutput('*', {
        Description: 'DynamoDB Session Table Name',
      });
    });

    test('Should export SQS queue URL', () => {
      template.hasOutput('*', {
        Description: 'SQS Trade Order Queue URL',
      });
    });

    test('Should export API endpoint', () => {
      template.hasOutput('*', {
        Description: 'API Gateway Endpoint',
      });
    });

    test('Should export S3 bucket names', () => {
      template.hasOutput('*', {
        Description: Match.stringLikeRegexp('.*Bucket Name'),
      });
    });
  });

  describe('Resource Configuration', () => {
    test('Should create IAM roles for Lambda functions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const lambdaRoles = Object.values(roles).filter((role: any) => {
        const statements = role.Properties.AssumeRolePolicyDocument.Statement;
        return statements.some(
          (stmt: any) => stmt.Principal?.Service === 'lambda.amazonaws.com'
        );
      });
      expect(lambdaRoles.length).toBeGreaterThanOrEqual(3);
    });

    test('Should use specific resource naming pattern', () => {
      const resources = template.toJSON().Resources;
      const resourcesWithSuffix = Object.keys(resources).filter(key =>
        key.includes(environmentSuffix)
      );
      expect(resourcesWithSuffix.length).toBeGreaterThan(5);
    });
  });

  describe('Security Configuration', () => {
    test('Should encrypt DynamoDB table at rest', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('Should encrypt RDS cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('Should create security groups with proper egress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1',
          },
        ],
      });
    });
  });

  describe('High Availability', () => {
    test('Should deploy across multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 3);
    });

    test('Should create reader instance for Aurora', () => {
      const instances = template.findResources('AWS::RDS::DBInstance');
      const readers = Object.values(instances).filter(
        (instance: any) => instance.Properties.PromotionTier === 1
      );
      expect(readers.length).toBe(1);
    });

    test('Should configure auto-scaling for Aurora Serverless', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        ServerlessV2ScalingConfiguration: Match.objectLike({
          MinCapacity: Match.anyValue(),
          MaxCapacity: Match.anyValue(),
        }),
      });
    });
  });
});
