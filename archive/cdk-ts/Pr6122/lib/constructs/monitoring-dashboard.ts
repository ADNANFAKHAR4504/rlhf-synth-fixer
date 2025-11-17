import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';

export interface MonitoringDashboardProps {
  readonly dashboardName: string;
  readonly environmentSuffix: string;
  readonly lambdaFunctions?: lambda.Function[];
  readonly dynamoTables?: dynamodb.Table[];
  readonly s3Buckets?: s3.Bucket[];
  readonly snsTopics?: sns.Topic[];
  readonly sqsQueues?: sqs.Queue[];
  readonly apiGateways?: apigateway.RestApi[];
  readonly stepFunctions?: stepfunctions.StateMachine[];
  readonly drRegion?: string;
}

export class MonitoringDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarms: cloudwatch.Alarm[] = [];

  constructor(scope: Construct, id: string, props: MonitoringDashboardProps) {
    super(scope, id);

    // Create comprehensive CloudWatch dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: props.dashboardName,
    });

    // Lambda monitoring widgets
    if (props.lambdaFunctions && props.lambdaFunctions.length > 0) {
      this.addLambdaWidgets(props.lambdaFunctions);
      this.createLambdaAlarms(props.lambdaFunctions, props.environmentSuffix);
    }

    // DynamoDB monitoring widgets
    if (props.dynamoTables && props.dynamoTables.length > 0) {
      this.addDynamoDbWidgets(props.dynamoTables);
      this.createDynamoDbAlarms(props.dynamoTables, props.environmentSuffix);
    }

    // S3 monitoring widgets
    if (props.s3Buckets && props.s3Buckets.length > 0) {
      this.addS3Widgets(props.s3Buckets);
    }

    // API Gateway monitoring widgets
    if (props.apiGateways && props.apiGateways.length > 0) {
      this.addApiGatewayWidgets(props.apiGateways);
      this.createApiGatewayAlarms(props.apiGateways, props.environmentSuffix);
    }

    // SQS monitoring widgets
    if (props.sqsQueues && props.sqsQueues.length > 0) {
      this.addSqsWidgets(props.sqsQueues);
      this.createSqsAlarms(props.sqsQueues, props.environmentSuffix);
    }

    // Step Functions monitoring
    if (props.stepFunctions && props.stepFunctions.length > 0) {
      this.addStepFunctionsWidgets(props.stepFunctions);
    }

    // Cross-region replication monitoring
    if (props.drRegion) {
      this.addCrossRegionWidgets(props.drRegion);
    }

    // Add tags
    this.dashboard.node.addMetadata('aws:cdk:tagging', {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'CloudWatch',
    });
  }

  private addLambdaWidgets(functions: lambda.Function[]): void {
    const invocationMetrics = functions.map(fn => fn.metricInvocations());
    const errorMetrics = functions.map(fn => fn.metricErrors());
    const durationMetrics = functions.map(fn => fn.metricDuration());
    const throttleMetrics = functions.map(fn => fn.metricThrottles());

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: invocationMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: errorMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: durationMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Throttles',
        left: throttleMetrics,
        width: 12,
        height: 6,
      })
    );
  }

  private addDynamoDbWidgets(tables: dynamodb.Table[]): void {
    const readMetrics = tables.map(table =>
      table.metricConsumedReadCapacityUnits()
    );
    const writeMetrics = tables.map(table =>
      table.metricConsumedWriteCapacityUnits()
    );
    const throttleMetrics = tables.map(table => table.metricUserErrors());

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read Capacity',
        left: readMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Write Capacity',
        left: writeMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Throttles/Errors',
        left: throttleMetrics,
        width: 12,
        height: 6,
      })
    );
  }

  private addS3Widgets(buckets: s3.Bucket[]): void {
    // S3 metrics are more limited and require custom metrics
    const widgets: cloudwatch.IWidget[] = [];

    buckets.forEach((bucket, _index) => {
      widgets.push(
        new cloudwatch.SingleValueWidget({
          title: `S3 Bucket: ${bucket.bucketName}`,
          metrics: [
            new cloudwatch.Metric({
              namespace: 'AWS/S3',
              metricName: 'BucketSizeBytes',
              dimensionsMap: {
                BucketName: bucket.bucketName,
                StorageType: 'StandardStorage',
              },
              statistic: 'Average',
            }),
          ],
          width: 6,
          height: 3,
        })
      );
    });

    this.dashboard.addWidgets(...widgets);
  }

  private addApiGatewayWidgets(apis: apigateway.RestApi[]): void {
    const countMetrics = apis.map(api => api.metricCount());
    const latencyMetrics = apis.map(api => api.metricLatency());
    const errorMetrics = apis.map(api => api.metricClientError());
    const serverErrorMetrics = apis.map(api => api.metricServerError());

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: countMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: latencyMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway 4XX Errors',
        left: errorMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway 5XX Errors',
        left: serverErrorMetrics,
        width: 12,
        height: 6,
      })
    );
  }

  private addSqsWidgets(queues: sqs.Queue[]): void {
    const visibleMetrics = queues.map(queue =>
      queue.metricApproximateNumberOfMessagesVisible()
    );
    const inFlightMetrics = queues.map(queue =>
      queue.metricApproximateNumberOfMessagesNotVisible()
    );
    const sentMetrics = queues.map(queue => queue.metricNumberOfMessagesSent());

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'SQS Messages Visible',
        left: visibleMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Messages In Flight',
        left: inFlightMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Messages Sent',
        left: sentMetrics,
        width: 12,
        height: 6,
      })
    );
  }

  private addStepFunctionsWidgets(
    stateMachines: stepfunctions.StateMachine[]
  ): void {
    const executionMetrics = stateMachines.map(sm => sm.metricStarted());
    const successMetrics = stateMachines.map(sm => sm.metricSucceeded());
    const failedMetrics = stateMachines.map(sm => sm.metricFailed());

    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Step Functions Executions',
        left: executionMetrics,
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Step Functions Success/Failure',
        left: [...successMetrics, ...failedMetrics],
        width: 12,
        height: 6,
      })
    );
  }

  private addCrossRegionWidgets(drRegion: string): void {
    // Cross-region replication monitoring
    const replicationWidget = new cloudwatch.TextWidget({
      markdown: `# Cross-Region Replication Status
      
**DR Region:** ${drRegion}

Monitor the following manually in CloudWatch Logs:
- DynamoDB Global Tables replication status
- S3 Cross-Region Replication metrics  
- SNS cross-region message delivery
- Lambda function execution in both regions

**Key Metrics to Watch:**
- DynamoDB consumed capacity in both regions
- S3 replication time and failure rates
- Lambda error rates and duration
`,
      width: 24,
      height: 6,
    });

    this.dashboard.addWidgets(replicationWidget);
  }

  private createLambdaAlarms(
    functions: lambda.Function[],
    environmentSuffix: string
  ): void {
    functions.forEach((fn, index) => {
      // Error rate alarm
      const errorAlarm = new cloudwatch.Alarm(
        this,
        `LambdaErrorAlarm${index}`,
        {
          alarmName: `iac-rlhf-${environmentSuffix}-lambda-errors-${fn.functionName}`,
          metric: fn.metricErrors(),
          threshold: 5,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      // Duration alarm
      const durationAlarm = new cloudwatch.Alarm(
        this,
        `LambdaDurationAlarm${index}`,
        {
          alarmName: `iac-rlhf-${environmentSuffix}-lambda-duration-${fn.functionName}`,
          metric: fn.metricDuration(),
          threshold: 30000, // 30 seconds
          evaluationPeriods: 3,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      // Throttle alarm
      const throttleAlarm = new cloudwatch.Alarm(
        this,
        `LambdaThrottleAlarm${index}`,
        {
          alarmName: `iac-rlhf-${environmentSuffix}-lambda-throttles-${fn.functionName}`,
          metric: fn.metricThrottles(),
          threshold: 1,
          evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      this.alarms.push(errorAlarm, durationAlarm, throttleAlarm);
    });
  }

  private createDynamoDbAlarms(
    tables: dynamodb.Table[],
    environmentSuffix: string
  ): void {
    tables.forEach((table, index) => {
      // User errors alarm (throttling)
      const throttleAlarm = new cloudwatch.Alarm(
        this,
        `DynamoThrottleAlarm${index}`,
        {
          alarmName: `iac-rlhf-${environmentSuffix}-dynamo-throttles-${table.tableName}`,
          metric: table.metricUserErrors(),
          threshold: 1,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      this.alarms.push(throttleAlarm);
    });
  }

  private createApiGatewayAlarms(
    apis: apigateway.RestApi[],
    environmentSuffix: string
  ): void {
    apis.forEach((api, index) => {
      // 5XX error alarm
      const serverErrorAlarm = new cloudwatch.Alarm(
        this,
        `ApiServerErrorAlarm${index}`,
        {
          alarmName: `iac-rlhf-${environmentSuffix}-api-5xx-${api.restApiName}`,
          metric: api.metricServerError(),
          threshold: 10,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      // High latency alarm
      const latencyAlarm = new cloudwatch.Alarm(
        this,
        `ApiLatencyAlarm${index}`,
        {
          alarmName: `iac-rlhf-${environmentSuffix}-api-latency-${api.restApiName}`,
          metric: api.metricLatency(),
          threshold: 5000, // 5 seconds
          evaluationPeriods: 3,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      this.alarms.push(serverErrorAlarm, latencyAlarm);
    });
  }

  private createSqsAlarms(
    queues: sqs.Queue[],
    environmentSuffix: string
  ): void {
    queues.forEach((queue, index) => {
      // Dead letter queue alarm
      if (queue.queueName?.includes('dlq')) {
        const dlqAlarm = new cloudwatch.Alarm(this, `SqsDlqAlarm${index}`, {
          alarmName: `iac-rlhf-${environmentSuffix}-dlq-messages-${queue.queueName}`,
          metric: queue.metricApproximateNumberOfMessagesVisible(),
          threshold: 1,
          evaluationPeriods: 1,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });

        this.alarms.push(dlqAlarm);
      }

      // Queue age alarm
      const ageAlarm = new cloudwatch.Alarm(this, `SqsAgeAlarm${index}`, {
        alarmName: `iac-rlhf-${environmentSuffix}-sqs-age-${queue.queueName}`,
        metric: queue.metricApproximateAgeOfOldestMessage(),
        threshold: 300, // 5 minutes
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      this.alarms.push(ageAlarm);
    });
  }
}
