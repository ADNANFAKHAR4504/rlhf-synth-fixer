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
    test('should create DynamoDB table with correct configuration', () => {
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
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      });
    });

    test('should create auto scaling target for read capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MaxCapacity: 20,
        MinCapacity: 5,
        ResourceId: {
          'Fn::Join': [
            '',
            [
              'table/',
              {
                Ref: 'DataTable',
              },
            ],
          ],
        },
        RoleARN: {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::',
              {
                Ref: 'AWS::AccountId',
              },
              ':role/aws-service-role/dynamodb.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_DynamoDBTable',
            ],
          ],
        },
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
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            STAGE: {
              Ref: 'Environment',
            },
            REGION: 'us-east-1',
            LOG_LEVEL: {
              Ref: 'LogLevel',
            },
            TABLE_NAME: {
              Ref: 'DataTable',
            },
          },
        },
      });
    });

    test('should create IAM role for Lambda with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        Policies: [
          {
            PolicyDocument: {
              Statement: [
                {
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Effect: 'Allow',
                  Resource: {
                    'Fn::GetAtt': ['LambdaLogGroup', 'Arn'],
                  },
                },
              ],
              Version: '2012-10-17',
            },
            PolicyName: 'CloudWatchLogsPolicy',
          },
          {
            PolicyDocument: {
              Statement: [
                {
                  Action: ['dynamodb:PutItem'],
                  Effect: 'Allow',
                  Resource: {
                    'Fn::GetAtt': ['DataTable', 'Arn'],
                  },
                },
              ],
              Version: '2012-10-17',
            },
            PolicyName: 'DynamoDBPolicy',
          },
        ],
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Description: 'API Gateway for data processing Lambda function',
      });
    });

    test('should create data resource under root', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'data',
        ParentId: {
          'Fn::GetAtt': ['DataProcessorApi', 'RootResourceId'],
        },
      });
    });

    test('should create POST method on data resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        Integration: {
          IntegrationHttpMethod: 'POST',
          Type: 'AWS_PROXY',
          Uri: {
            'Fn::Join': [
              '',
              [
                'arn:',
                {
                  Ref: 'AWS::Partition',
                },
                ':apigateway:',
                {
                  Ref: 'AWS::Region',
                },
                ':lambda:path/2015-03-31/functions/',
                {
                  'Fn::GetAtt': ['DataProcessorFunction', 'Arn'],
                },
                '/invocations',
              ],
            ],
          },
        },
      });
    });
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch Log Group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7,
      });
    });

    test('should create CloudWatch Alarm for error rate', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 5,
        Threshold: 5,
        TreatMissingData: 'notBreaching',
        Metrics: [
          {
            Expression: 'IF(invocations > 0, (errors / invocations) * 100, 0)',
            Id: 'expr_1',
            Label: 'Error Rate (%)',
          },
          {
            Id: 'errors',
            MetricStat: {
              Metric: {
                Dimensions: [
                  {
                    Name: 'FunctionName',
                    Value: {
                      Ref: 'DataProcessorFunction',
                    },
                  },
                ],
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
                Dimensions: [
                  {
                    Name: 'FunctionName',
                    Value: {
                      Ref: 'DataProcessorFunction',
                    },
                  },
                ],
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
    test('should create all required outputs', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
        Value: {
          'Fn::Join': [
            '',
            [
              'https://',
              {
                Ref: 'DataProcessorApi',
              },
              '.execute-api.',
              {
                Ref: 'AWS::Region',
              },
              '.',
              {
                Ref: 'AWS::URLSuffix',
              },
              '/prod/',
            ],
          ],
        },
      });

      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda Function Name',
        Value: {
          Ref: 'DataProcessorFunction',
        },
      });

      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name',
        Value: {
          Ref: 'DataTable',
        },
      });

      template.hasOutput('CloudWatchAlarmName', {
        Description: 'CloudWatch Alarm Name',
        Value: {
          Ref: 'LambdaErrorRateAlarm',
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
      expect(resourceTypes.filter(type => type === 'AWS::IAM::Role')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::Logs::LogGroup')).toHaveLength(1);
      expect(resourceTypes.filter(type => type === 'AWS::CloudWatch::Alarm')).toHaveLength(1);
    });
  });
});
