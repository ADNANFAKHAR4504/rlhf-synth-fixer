import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
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
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
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

    // AWS Config Delivery Channel
    const deliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: `prod-config-delivery-${envSuffix}`,
      s3BucketName: configBucket.bucketName,
      s3KeyPrefix: 'config/',
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'Daily',
      },
    });

    // AWS Config Rules for Lambda compliance
    new config.CfnConfigRule(this, 'LambdaRuntimeRule', {
      configRuleName: `prod-lambda-runtime-check-${envSuffix}`,
      description: 'Checks if Lambda functions use supported runtimes',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_FUNCTION_SUPPORTED_RUNTIME_CHECK',
      },
      inputParameters: {
        desiredRuntime1: 'nodejs20.x',
        desiredRuntime2: 'python3.12',
      },
      dependsOn: [configRecorder],
    });

    new config.CfnConfigRule(this, 'LambdaEnvironmentVariablesRule', {
      configRuleName: `prod-lambda-env-vars-encrypted-${envSuffix}`,
      description: 'Checks if Lambda functions have encrypted environment variables',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_FUNCTION_SETTINGS_CHECK',
      },
      inputParameters: {
        runtime: 'nodejs20.x',
        memorySize: '512',
        timeout: '30',
      },
      dependsOn: [configRecorder],
    });

    new config.CfnConfigRule(this, 'LambdaDeadLetterQueueRule', {
      configRuleName: `prod-lambda-dlq-check-${envSuffix}`,
      description: 'Checks if Lambda functions have dead letter queue configured',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'LAMBDA_DLQ_CHECK',
      },
      dependsOn: [configRecorder],
    });

    // CloudWatch Application Insights Application
    const applicationInsights = new applicationSignals.CfnApplication(this, 'ServerlessApplication', {
      resourceGroupName: `prod-serverless-app-${envSuffix}`,
      autoConfigurationEnabled: true,
      autoCreate: true,
      logPatterns: [
        {
          patternName: 'LambdaErrorPattern',
          pattern: '[timestamp, request_id, level="ERROR", ...]',
          rank: 1,
        },
        {
          patternName: 'APIGatewayErrorPattern',
          pattern: '[timestamp, request_id, level="WARN", ...]',
          rank: 2,
        },
      ],
    });

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

    new cdk.CfnOutput(this, 'ApplicationInsightsArn', {
      value: applicationInsights.attrApplicationArn,
      description: 'CloudWatch Application Insights Application ARN',
    });
  }
}