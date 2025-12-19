import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'workoutTimestamp',
            KeyType: 'RANGE'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'userId',
            AttributeType: 'S'
          },
          {
            AttributeName: 'workoutTimestamp',
            AttributeType: 'S'
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      });
    });

    test('should have auto-scaling for read capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MaxCapacity: 100,
        MinCapacity: 5,
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        ServiceNamespace: 'dynamodb'
      });
    });

    test('should have auto-scaling for write capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MaxCapacity: 100,
        MinCapacity: 5,
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
        ServiceNamespace: 'dynamodb'
      });
    });

    test('should have scaling policy for read capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBReadCapacityUtilization'
          }
        }
      });
    });

    test('should have scaling policy for write capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBWriteCapacityUtilization'
          }
        }
      });
    });
  });

  describe('SSM Parameter', () => {
    test('should create SSM parameter for API rate limit', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: '1000',
        Tier: 'Standard',
        Name: `/fitness-tracking/api-rate-limit-${environmentSuffix}`
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
        TracingConfig: {
          Mode: 'Active'
        }
      });
    });

    test('should have environment variables configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue(),
            API_RATE_LIMIT_PARAM: Match.anyValue()
          })
        }
      });
    });

    test('should have IAM role with DynamoDB permissions', () => {
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
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable'
              ]),
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('should have IAM role with SSM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'ssm:DescribeParameters',
                'ssm:GetParameters',
                'ssm:GetParameter',
                'ssm:GetParameterHistory'
              ]),
              Effect: 'Allow'
            })
          ])
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `Fitness-Tracking-API-${environmentSuffix}`
      });
    });

    test('should have deployment with correct stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
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

    test('should create API key', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: `fitness-api-key-${environmentSuffix}`,
        Enabled: true
      });
    });

    test('should create usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: `fitness-usage-plan-${environmentSuffix}`,
        Quota: {
          Limit: 10000,
          Period: 'DAY'
        },
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000
        }
      });
    });

    test('should create workouts resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'workouts'
      });
    });

    test('should create workoutId resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{workoutId}'
      });
    });

    test('should create POST method on workouts', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
        Integration: {
          Type: 'AWS_PROXY'
        }
      });
    });

    test('should create GET method on workouts', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true
      });
    });

    test('should create PUT method on workoutId', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'PUT',
        ApiKeyRequired: true
      });
    });

    test('should create DELETE method on workoutId', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        ApiKeyRequired: true
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create API errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        Threshold: 5,
        TreatMissingData: 'notBreaching',
        Statistic: 'Sum'
      });
    });

    test('should create Lambda errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
        Threshold: 5,
        TreatMissingData: 'notBreaching'
      });
    });

    test('should have at least 4 alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('should create dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `FitnessTracking-Monitoring-${environmentSuffix}`
      });
    });

    test('should have dashboard with widgets', () => {
      const dashboardResource = template.findResources('AWS::CloudWatch::Dashboard');
      expect(Object.keys(dashboardResource).length).toBeGreaterThan(0);
      const dashboardProps = Object.values(dashboardResource)[0].Properties;
      expect(dashboardProps.DashboardBody).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should export API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Export: {
          Name: `FitnessApiEndpoint-${environmentSuffix}`
        }
      });
    });

    test('should export API key ID', () => {
      template.hasOutput('ApiKeyId', {
        Export: {
          Name: `FitnessApiKeyId-${environmentSuffix}`
        }
      });
    });

    test('should export table name', () => {
      template.hasOutput('TableName', {
        Export: {
          Name: `WorkoutTableName-${environmentSuffix}`
        }
      });
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resources = template.toJSON().Resources;
      expect(Object.keys(resources).length).toBeGreaterThan(20);
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use context when props not provided', () => {
      const testApp = new cdk.App({ context: { environmentSuffix: 'test' } });
      const testStack = new TapStack(testApp, 'TestContextStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/fitness-tracking/api-rate-limit-test'
      });
    });

    test('should default to dev when neither props nor context provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultStack', {});
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/fitness-tracking/api-rate-limit-dev'
      });
    });
  });
});