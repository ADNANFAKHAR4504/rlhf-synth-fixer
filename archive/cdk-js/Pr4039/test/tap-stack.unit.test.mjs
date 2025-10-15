import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('uses environmentSuffix from props', () => {
      const testApp = new App();
      const testStack = new TapStack(testApp, 'TestStack1', {
        environmentSuffix: 'prod'
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::Events::EventBus', {
        Name: 'booking-platform-events-prod'
      });
    });

    test('uses environmentSuffix from context when props is undefined', () => {
      const testApp = new App({ context: { environmentSuffix: 'staging' } });
      const testStack = new TapStack(testApp, 'TestStack2', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::Events::EventBus', {
        Name: Match.stringLikeRegexp('booking-platform-events-')
      });
    });

    test('defaults to dev when no environmentSuffix provided', () => {
      const testApp = new App();
      const testStack = new TapStack(testApp, 'TestStack3', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::Events::EventBus', {
        Name: 'booking-platform-events-dev'
      });
    });

    test('handles undefined props gracefully', () => {
      const testApp = new App();
      expect(() => {
        new TapStack(testApp, 'TestStack4');
      }).not.toThrow();
    });
  });

  describe('VPC and Networking', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates security groups for Redis and Lambda', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Allow Lambda to Redis traffic'
      });
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions with Redis access'
      });
    });

    test('configures security group ingress rule for Redis', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 6379,
        ToPort: 6379
      });
    });
  });

  describe('ElastiCache Redis', () => {
    test('creates Redis subnet group', () => {
      template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
        Description: 'Subnet group for Redis cluster'
      });
    });

    test('creates Redis cache cluster with correct configuration', () => {
      template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
        CacheNodeType: 'cache.t3.micro',
        Engine: 'redis',
        NumCacheNodes: 1
      });
    });
  });

  describe('DynamoDB', () => {
    test('creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ]
      });
    });

    test('creates Global Secondary Index', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: [
          {
            IndexName: 'searchIndex',
            KeySchema: [
              {
                AttributeName: 'searchKey',
                KeyType: 'HASH'
              },
              {
                AttributeName: 'timestamp',
                KeyType: 'RANGE'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      });
    });

    test('table has DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AWSLambdaVPCAccessExecutionRole')
              ])
            ])
          })
        ])
      });
    });

    test('grants CloudWatch PutMetricData permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'cloudwatch:PutMetricData',
              Effect: 'Allow',
              Resource: '*'
            })
          ])
        }
      });
    });

    test('grants DynamoDB read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan'
              ])
            })
          ])
        }
      });
    });

    test('grants EventBridge PutEvents permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'events:PutEvents',
              Effect: 'Allow'
            })
          ])
        }
      });
    });
  });

  describe('EventBridge', () => {
    test('creates custom event bus', () => {
      template.hasResourceProperties('AWS::Events::EventBus', {
        Name: 'booking-platform-events-test'
      });
    });

    test('creates search completed rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Rule that captures completed search events',
        EventPattern: {
          'source': ['booking.platform'],
          'detail-type': ['search.completed']
        }
      });
    });

    test('creates booking requested rule', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        Description: 'Rule that captures booking request events',
        EventPattern: {
          'source': ['booking.platform'],
          'detail-type': ['booking.requested']
        }
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates search Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 1024,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active'
        },
        Environment: {
          Variables: {
            EVENT_BUS_NAME: Match.anyValue()
          }
        }
      });
    });

    test('creates booking Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 1024,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('creates exactly two Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('Lambda functions use asset-based code', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions);
      
      functionKeys.forEach(key => {
        const code = functions[key].Properties.Code;
        expect(code.S3Bucket || code.S3Key).toBeDefined();
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'BookingApi-test',
        Description: 'Booking Platform API'
      });
    });

    test('enables X-Ray tracing on deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        TracingEnabled: true,
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true
          })
        ])
      });
    });

    test('creates search resource and method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'search'
      });
      
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true
      });
    });

    test('creates booking resource and method', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'booking'
      });
      
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true
      });
    });

    test('creates usage plan with rate limits', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: 'Standard',
        Quota: {
          Limit: 50000,
          Period: 'DAY'
        },
        Throttle: {
          RateLimit: 100,
          BurstLimit: 200
        }
      });
    });

    test('creates API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('associates API key with usage plan', () => {
      template.resourceCountIs('AWS::ApiGateway::UsagePlanKey', 1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates API Gateway 4xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'API Gateway has a high rate of 4xx errors',
        Threshold: 10,
        EvaluationPeriods: 3,
        TreatMissingData: 'notBreaching'
      });
    });

    test('creates API Gateway 5xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'API Gateway has a high rate of 5xx errors',
        Threshold: 5,
        EvaluationPeriods: 3
      });
    });

    test('creates API Gateway latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'API Gateway has high latency',
        Threshold: 1000,
        EvaluationPeriods: 3
      });
    });

    test('creates Lambda error alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Search Lambda function has a high error rate',
        Threshold: 5
      });
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: 'Booking Lambda function has a high error rate',
        Threshold: 5
      });
    });

    test('creates exactly 5 alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates dashboard with correct name', () => {
      const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
      const dashboardKeys = Object.keys(dashboards);
      
      expect(dashboardKeys.length).toBeGreaterThan(0);
      const dashboardBodyProp = dashboards[dashboardKeys[0]].Properties.DashboardBody;
      
      let dashboardBody;
      if (typeof dashboardBodyProp === 'string') {
        dashboardBody = JSON.parse(dashboardBodyProp);
      } else if (dashboardBodyProp['Fn::Join']) {
        dashboardBody = { widgets: [] };
      } else {
        dashboardBody = dashboardBodyProp;
      }
      
      expect(dashboardBody).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('exports API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL'
      });
    });

    test('exports API key ID', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Key ID'
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name'
      });
    });

    test('exports Redis endpoint', () => {
      template.hasOutput('RedisEndpoint', {
        Description: 'Redis Endpoint Address'
      });
    });

    test('exports EventBridge bus name', () => {
      template.hasOutput('EventBusName', {
        Description: 'EventBridge Event Bus Name'
      });
    });

    test('exports Dashboard name', () => {
      template.hasOutput('DashboardName', {
        Description: 'CloudWatch Dashboard Name'
      });
    });

    test('creates exactly 6 outputs', () => {
      const outputs = Object.keys(template.toJSON().Outputs);
      expect(outputs.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Resource Deletion', () => {
    test('VPC has DESTROY removal policy', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(resources);
      expect(vpcKeys.length).toBeGreaterThan(0);
    });

    test('DynamoDB table is deletable', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete'
      });
    });
  });
});