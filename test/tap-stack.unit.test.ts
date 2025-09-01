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

  describe('CDK Stack Parameters', () => {
    test('should create Environment parameter with correct values', () => {
      template.hasParameter('Environment', {
        Type: 'String',
        AllowedValues: ['dev', 'stage', 'prod'],
        Default: 'dev',
        Description: 'Environment for the application',
      });
    });

    test('should create LogLevel parameter with correct values', () => {
      template.hasParameter('LogLevel', {
        Type: 'String',
        AllowedValues: ['INFO', 'WARN', 'ERROR'],
        Default: 'INFO',
        Description: 'Log level for the application',
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration including environmentSuffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
        TableName: {
          'Fn::Join': [
            '',
            [
              'data-table-',
              {
                Ref: 'Environment',
              },
              `-${environmentSuffix}`,
            ],
          ],
        },
      });
    });

    test('should create auto scaling target for read capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MaxCapacity: 20,
        MinCapacity: 5,
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        ServiceNamespace: 'dynamodb',
      });
    });

    test('should create auto scaling target for write capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MaxCapacity: 20,
        MinCapacity: 5,
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
        ServiceNamespace: 'dynamodb',
      });
    });

    test('should create scaling policy with 70% utilization target', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'DynamoDBReadCapacityUtilization',
          },
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration including environmentSuffix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        FunctionName: {
          'Fn::Join': [
            '',
            [
              'data-processor-',
              {
                Ref: 'Environment',
              },
              `-${environmentSuffix}`,
            ],
          ],
        },
        Environment: {
          Variables: {
            STAGE: {
              Ref: 'Environment',
            },
            REGION: 'us-east-1',
            LOG_LEVEL: {
              Ref: 'LogLevel',
            },
            // TABLE_NAME will reference the DynamoDB table with environmentSuffix
          },
        },
      });
    });

  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration including environmentSuffix', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Description: 'API Gateway for data processing Lambda function',
        Name: {
          'Fn::Join': [
            '',
            [
              'data-processor-api-',
              {
                Ref: 'Environment',
              },
              `-${environmentSuffix}`,
            ],
          ],
        },
      });
    });

    test('should create data resource under root', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'data',
        // Don't test specific resource IDs since CDK generates them
      });
    });

    test('should create POST method on data resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          IntegrationHttpMethod: 'POST',
          Type: 'AWS_PROXY',
        },
        MethodResponses: [
          {
            StatusCode: '200',
            ResponseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            StatusCode: '500',
            ResponseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch Log Group with correct configuration including environmentSuffix', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
        LogGroupName: {
          'Fn::Join': [
            '',
            [
              '/aws/lambda/data-processor-',
              {
                Ref: 'Environment',
              },
              `-${environmentSuffix}`,
            ],
          ],
        },
      });
    });

    test('should create CloudWatch Alarm for error rate with correct configuration including environmentSuffix', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 5,
        Threshold: 5,
        TreatMissingData: 'notBreaching',
        AlarmName: {
          'Fn::Join': [
            '',
            [
              'lambda-error-rate-',
              {
                Ref: 'Environment',
              },
              `-${environmentSuffix}`,
            ],
          ],
        },
        AlarmDescription: 'Alarm when Lambda function error rate exceeds 5% for 5 consecutive minutes',
        Metrics: [
          {
            Expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
            Id: 'expr_1',
            Label: 'Error Rate (%)',
            ReturnData: true, // CDK sets this to true for the main expression
          },
          {
            Id: 'errors',
            MetricStat: {
              Metric: {
                MetricName: 'Errors',
                Namespace: 'AWS/Lambda',
              },
              Period: 60,
              Stat: 'Sum',
            },
            ReturnData: false,
          },
          {
            Id: 'invocations',
            MetricStat: {
              Metric: {
                MetricName: 'Invocations',
                Namespace: 'AWS/Lambda',
              },
              Period: 60,
              Stat: 'Sum',
            },
            ReturnData: false,
          },
        ],
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create all required outputs with environmentSuffix', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: {
            'Fn::Join': [
              '',
              [
                'api-gateway-url-',
                {
                  Ref: 'Environment',
                },
                `-${environmentSuffix}`,
              ],
            ],
          },
        },
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
        Export: {
          Name: {
            'Fn::Join': [
              '',
              [
                'lambda-function-name-',
                {
                  Ref: 'Environment',
                },
                `-${environmentSuffix}`,
              ],
            ],
          },
        },
      });

      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name',
        Export: {
          Name: {
            'Fn::Join': [
              '',
              [
                'dynamodb-table-name-',
                {
                  Ref: 'Environment',
                },
                `-${environmentSuffix}`,
              ],
            ],
          },
        },
      });

      template.hasOutput('CloudWatchAlarmName', {
        Description: 'CloudWatch Alarm Name',
        Export: {
          Name: {
            'Fn::Join': [
              '',
              [
                'cloudwatch-alarm-name-',
                {
                  Ref: 'Environment',
                },
                `-${environmentSuffix}`,
              ],
            ],
          },
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((resource: any) => resource.Type);

      expect(resourceTypes.filter(type => type === 'AWS::DynamoDB::Table')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::Lambda::Function')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::ApiGateway::RestApi')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::IAM::Role')).toHaveLength(2); // Lambda + API Gateway roles
      expect(resourceTypes.filter(type => type === 'AWS::Logs::LogGroup')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::CloudWatch::Alarm')).toHaveLength(1);

      // Additional resources that are created by CDK
      expect(resourceTypes.filter(type => type === 'AWS::ApiGateway::Resource')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::ApiGateway::Method')).toHaveLength(3); // POST + 2 OPTIONS (CORS)
      expect(resourceTypes.filter(type => type === 'AWS::Lambda::Permission')).toHaveLength(2);
      expect(resourceTypes.filter(type => type === 'AWS::ApplicationAutoScaling::ScalableTarget')).toHaveLength(2); // Read and Write
      expect(resourceTypes.filter(type => type === 'AWS::ApplicationAutoScaling::ScalingPolicy')).toHaveLength(2); // Read and Write
    });
  });

  // Coverage test to ensure all branches of environmentSuffix logic are tested
  describe('Coverage Enhancement', () => {
    test('should handle different environment suffix scenarios', () => {
      // Test with different environment suffix - use a separate app
      const stageApp = new cdk.App();
      const stackWithStageEnv = new TapStack(stageApp, 'TestTapStackStage', {
        environmentSuffix: 'stage'
      });
      const stageTemplate = Template.fromStack(stackWithStageEnv);

      // Verify the stack was created successfully
      expect(stageTemplate).toBeDefined();

      // Verify that the stage environmentSuffix is used in resource names
      stageTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            [
              'data-table-',
              {
                Ref: 'Environment',
              },
              '-stage',
            ],
          ],
        },
      });

      // Test with context-based environment suffix - use another separate app
      const prodApp = new cdk.App({
        context: {
          environmentSuffix: 'prod'
        }
      });
      const stackWithContext = new TapStack(prodApp, 'TestTapStackProd');
      const contextTemplate = Template.fromStack(stackWithContext);

      // Verify the stack was created successfully  
      expect(contextTemplate).toBeDefined();

      // Verify that the context environmentSuffix is used in resource names
      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            [
              'data-table-',
              {
                Ref: 'Environment',
              },
              '-prod',
            ],
          ],
        },
      });

      // Test the default case by creating a stack with no environmentSuffix
      const defaultApp = new cdk.App();
      const stackWithDefaults = new TapStack(defaultApp, 'TestTapStackDefault', {});
      const defaultTemplate = Template.fromStack(stackWithDefaults);

      // Verify the stack was created successfully
      expect(defaultTemplate).toBeDefined();

      // Verify that the default environmentSuffix 'dev' is used in resource names
      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: {
          'Fn::Join': [
            '',
            [
              'data-table-',
              {
                Ref: 'Environment',
              },
              '-dev',
            ],
          ],
        },
      });
    });
  });
});