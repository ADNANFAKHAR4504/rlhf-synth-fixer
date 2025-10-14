import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  dataTable: dynamodb.Table;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(
      this,
      `AlertTopic-${props.environmentSuffix}`,
      {
        topicName: `serverless-alerts-${props.environmentSuffix}`,
        displayName: 'Serverless Application Alerts',
      }
    );

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('your-email@example.com')
    );

    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-errors-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda function has errors',
        metric: props.lambdaFunction.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      `LambdaDurationAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-duration-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda execution time is high',
        metric: props.lambdaFunction.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 10000, // 10 seconds
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Lambda Throttles Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      `LambdaThrottleAlarm-${props.environmentSuffix}`,
      {
        alarmName: `lambda-throttles-${props.environmentSuffix}`,
        alarmDescription: 'Alert when Lambda is throttled',
        metric: props.lambdaFunction.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // API Gateway 4XX Errors Alarm
    const api4xxAlarm = new cloudwatch.Alarm(
      this,
      `Api4xxAlarm-${props.environmentSuffix}`,
      {
        alarmName: `api-4xx-errors-${props.environmentSuffix}`,
        alarmDescription: 'Alert when API has 4xx errors',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: props.apiGateway.restApiName,
            Stage: props.apiGateway.deploymentStage.stageName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    api4xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // API Gateway 5XX Errors Alarm
    const api5xxAlarm = new cloudwatch.Alarm(
      this,
      `Api5xxAlarm-${props.environmentSuffix}`,
      {
        alarmName: `api-5xx-errors-${props.environmentSuffix}`,
        alarmDescription: 'Alert when API has 5xx errors',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: props.apiGateway.restApiName,
            Stage: props.apiGateway.deploymentStage.stageName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    api5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // DynamoDB Throttles Alarm
    const dynamoThrottleAlarm = new cloudwatch.Alarm(
      this,
      `DynamoThrottleAlarm-${props.environmentSuffix}`,
      {
        alarmName: `dynamo-throttles-${props.environmentSuffix}`,
        alarmDescription: 'Alert when DynamoDB is throttled',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'UserErrors',
          dimensionsMap: {
            TableName: props.dataTable.tableName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    dynamoThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${props.environmentSuffix}`,
      {
        dashboardName: `serverless-dashboard-${props.environmentSuffix}`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'Lambda Metrics',
              left: [
                props.lambdaFunction.metricInvocations(),
                props.lambdaFunction.metricErrors(),
                props.lambdaFunction.metricThrottles(),
              ],
              right: [props.lambdaFunction.metricDuration()],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'API Gateway Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Count',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '4XXError',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: '5XXError',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'DynamoDB Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/DynamoDB',
                  metricName: 'ConsumedReadCapacityUnits',
                  dimensionsMap: {
                    TableName: props.dataTable.tableName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/DynamoDB',
                  metricName: 'ConsumedWriteCapacityUnits',
                  dimensionsMap: {
                    TableName: props.dataTable.tableName,
                  },
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/DynamoDB',
                  metricName: 'UserErrors',
                  dimensionsMap: {
                    TableName: props.dataTable.tableName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
            new cloudwatch.SingleValueWidget({
              title: 'Lambda Invocations',
              metrics: [props.lambdaFunction.metricInvocations()],
              width: 6,
              height: 6,
            }),
            new cloudwatch.SingleValueWidget({
              title: 'API Gateway Latency',
              metrics: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApiGateway',
                  metricName: 'Latency',
                  dimensionsMap: {
                    ApiName: props.apiGateway.restApiName,
                    Stage: props.apiGateway.deploymentStage.stageName,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 6,
              height: 6,
            }),
          ],
        ],
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `AlertTopicArn-${props.environmentSuffix}`,
    });
  }
}
