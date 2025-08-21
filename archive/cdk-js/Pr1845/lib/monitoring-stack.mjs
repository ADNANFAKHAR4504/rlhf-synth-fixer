import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as resourcegroups from 'aws-cdk-lib/aws-resourcegroups';
import * as applicationSignals from 'aws-cdk-lib/aws-applicationinsights';

export class MonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const { api, lambdaStack } = props;

    // SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `prod-serverless-alarms-${envSuffix}`,
      displayName: 'Serverless Infrastructure Alarms',
    });

    // S3 Bucket for AWS Config
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `prod-aws-config-${envSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM Role for AWS Config
    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `prod-config-service-role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
      ],
      inlinePolicies: {
        ConfigBucketPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketAcl',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              resources: [configBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject',
              ],
              resources: [configBucket.arnForObjects('*')],
              conditions: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            }),
          ],
        }),
      },
    });

    // AWS Config Configuration Recorder
    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigurationRecorder', {
      name: `prod-config-recorder-${envSuffix}`,
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
        recordingModeOverrides: [
          {
            description: 'Override for Lambda functions',
            resourceTypes: ['AWS::Lambda::Function'],
            recordingFrequency: 'CONTINUOUS',
          },
          {
            description: 'Override for API Gateway',
            resourceTypes: ['AWS::ApiGateway::RestApi', 'AWS::ApiGateway::Stage'],
            recordingFrequency: 'CONTINUOUS',
          },
        ],
      },
    });

    // Note: Skipping delivery channel creation - using existing one in account
    // AWS Config only allows 1 delivery channel per region per account

    // AWS Config Rules for compliance - using correct AWS managed rules
    const lambdaRuntimeRule = new config.CfnConfigRule(this, 'LambdaRuntimeRule', {
      configRuleName: `prod-lambda-runtime-check-${envSuffix}`,
      description: 'Checks if Lambda functions use supported runtimes (Node.js 20.x)',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_FUNCTION_SETTINGS_CHECK',
      },
      inputParameters: {
        runtime: 'nodejs20.x',
      },
    });
    lambdaRuntimeRule.addDependency(configRecorder);

    const lambdaTracingRule = new config.CfnConfigRule(this, 'LambdaTracingRule', {
      configRuleName: `prod-lambda-tracing-check-${envSuffix}`,
      description: 'Checks if Lambda functions have X-Ray tracing enabled',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_FUNCTION_XRAY_ENABLED',
      },
      // No inputParameters needed for this rule
    });
    lambdaTracingRule.addDependency(configRecorder);

    const lambdaDeadLetterRule = new config.CfnConfigRule(this, 'LambdaDeadLetterQueueRule', {
      configRuleName: `prod-lambda-dlq-check-${envSuffix}`,
      description: 'Checks if Lambda functions have dead letter queue configured',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_DLQ_CHECK',
      },
    });
    lambdaDeadLetterRule.addDependency(configRecorder);

    // Create Resource Group for Application Insights (using CDK escape hatch for proper serialization)
    const resourceGroup = new resourcegroups.CfnGroup(this, 'ServerlessResourceGroup', {
      name: `prod-serverless-app-${envSuffix}`,
      description: 'Resource group for serverless application monitoring',
      resourceQuery: {
        type: 'TAG_FILTERS_1_0'
      },
      tags: [
        {
          key: 'Environment',
          value: envSuffix,
        },
        {
          key: 'Application',
          value: 'ServerlessApp',
        }
      ]
    });

    // Use escape hatch to properly set the query with tag filters
    resourceGroup.addPropertyOverride('ResourceQuery.Query', {
      TagFilters: [
        {
          Key: 'Environment',
          Values: [envSuffix]
        },
        {
          Key: 'Application', 
          Values: ['ServerlessApp']
        }
      ]
    });

    // CloudWatch Application Insights Application (following AWS documentation)
    const applicationInsights = new applicationSignals.CfnApplication(this, 'ServerlessApplication', {
      resourceGroupName: resourceGroup.name,
      autoConfigurationEnabled: true,
      logPatternSets: [
        {
          patternSetName: 'ServerlessLogPatterns',
          logPatterns: [
            {
              patternName: 'LambdaErrorPattern',
              pattern: '.*[\\s\\[]ERROR[\\s\\]].*',
              rank: 1,
            },
            {
              patternName: 'APIGatewayErrorPattern', 
              pattern: '.*[\\s\\[]WARN[\\s\\]].*',
              rank: 2,
            },
          ],
        },
      ],
    });
    applicationInsights.addDependency(resourceGroup);

    // API Gateway Alarms
    const apiGateway4xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway4xxAlarm', {
      alarmName: `prod-api-4xx-errors-${envSuffix}`,
      alarmDescription: 'API Gateway 4xx error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: 'prod-MyAPI',
          Stage: envSuffix,
        },
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
    });

    const apiGateway5xxAlarm = new cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `prod-api-5xx-errors-${envSuffix}`,
      alarmDescription: 'API Gateway 5xx error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: 'prod-MyAPI',
          Stage: envSuffix,
        },
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 2,
    });

    // Lambda Function Alarms
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `prod-lambda-errors-${envSuffix}`,
      alarmDescription: 'Lambda function error rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Errors',
        dimensionsMap: {
          FunctionName: lambdaStack.userManagementFunction.functionName,
        },
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 3,
      evaluationPeriods: 2,
    });

    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, 'LambdaThrottleAlarm', {
      alarmName: `prod-lambda-throttles-${envSuffix}`,
      alarmDescription: 'Lambda function throttle rate is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Throttles',
        dimensionsMap: {
          FunctionName: lambdaStack.userManagementFunction.functionName,
        },
        statistic: cloudwatch.Statistic.SUM,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
    });

    const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `prod-lambda-duration-${envSuffix}`,
      alarmDescription: 'Lambda function duration is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensionsMap: {
          FunctionName: lambdaStack.userManagementFunction.functionName,
        },
        statistic: cloudwatch.Statistic.AVERAGE,
        period: cdk.Duration.minutes(5),
      }),
      threshold: 25000, // 25 seconds (threshold is in milliseconds)
      evaluationPeriods: 2,
    });

    // Add alarms to SNS topic
    apiGateway4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    apiGateway5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    lambdaThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
    lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Custom Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ServerlessDashboard', {
      dashboardName: `prod-serverless-dashboard-${envSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Count',
                dimensionsMap: {
                  ApiName: 'prod-MyAPI',
                  Stage: envSuffix,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Latency',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: 'Latency',
                dimensionsMap: {
                  ApiName: 'prod-MyAPI',
                  Stage: envSuffix,
                },
                statistic: cloudwatch.Statistic.AVERAGE,
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'API Gateway 4XX Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '4XXError',
                dimensionsMap: {
                  ApiName: 'prod-MyAPI',
                  Stage: envSuffix,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway 5XX Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: {
                  ApiName: 'prod-MyAPI',
                  Stage: envSuffix,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Invocations',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Invocations',
                dimensionsMap: {
                  FunctionName: lambdaStack.userManagementFunction.functionName,
                },
                label: 'User Management',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Invocations',
                dimensionsMap: {
                  FunctionName: lambdaStack.productCatalogFunction.functionName,
                },
                label: 'Product Catalog',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Invocations',
                dimensionsMap: {
                  FunctionName: lambdaStack.orderProcessingFunction.functionName,
                },
                label: 'Order Processing',
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Duration',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                  FunctionName: lambdaStack.userManagementFunction.functionName,
                },
                statistic: cloudwatch.Statistic.AVERAGE,
                label: 'User Management',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                  FunctionName: lambdaStack.productCatalogFunction.functionName,
                },
                statistic: cloudwatch.Statistic.AVERAGE,
                label: 'Product Catalog',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                  FunctionName: lambdaStack.orderProcessingFunction.functionName,
                },
                statistic: cloudwatch.Statistic.AVERAGE,
                label: 'Order Processing',
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                dimensionsMap: {
                  FunctionName: lambdaStack.userManagementFunction.functionName,
                },
                label: 'User Management',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                dimensionsMap: {
                  FunctionName: lambdaStack.productCatalogFunction.functionName,
                },
                label: 'Product Catalog',
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                dimensionsMap: {
                  FunctionName: lambdaStack.orderProcessingFunction.functionName,
                },
                label: 'Order Processing',
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'X-Ray Service Map',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/X-Ray',
                metricName: 'TracesReceived',
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN for alarms',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 bucket for AWS Config',
    });

    new cdk.CfnOutput(this, 'ConfigRecorderName', {
      value: configRecorder.name,
      description: 'AWS Config Configuration Recorder name',
    });

    new cdk.CfnOutput(this, 'ResourceGroupName', {
      value: resourceGroup.name,
      description: 'Resource Group name for serverless application',
    });

    new cdk.CfnOutput(this, 'ApplicationInsightsArn', {
      value: applicationInsights.attrApplicationArn,
      description: 'CloudWatch Application Insights Application ARN',
    });
  }
}