import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  primaryDbClusterId: pulumi.Output<string>;
  drDbClusterId: pulumi.Output<string>;
  dynamoTableName: pulumi.Output<string>;
  primaryAlbArn: pulumi.Output<string>;
  drAlbArn: pulumi.Output<string>;
  primaryProvider: aws.Provider;
  drProvider: aws.Provider;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly primarySnsTopicArn: pulumi.Output<string>;
  public readonly drSnsTopicArn: pulumi.Output<string>;
  public readonly failoverLambdaArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      primaryDbClusterId,
      drDbClusterId: _drDbClusterId,
      dynamoTableName: _dynamoTableName,
      primaryAlbArn,
      drAlbArn,
      primaryProvider,
      drProvider,
    } = args;
    void _drDbClusterId;
    void _dynamoTableName;

    // Generate random suffix to avoid resource name conflicts
    const randomSuffix = new random.RandomString(
      `random-suffix-${environmentSuffix}`,
      {
        length: 8,
        special: false,
        upper: false,
        lower: true,
        numeric: true,
      },
      { parent: this }
    );

    // SNS topics for alerting
    const primarySnsTopic = new aws.sns.Topic(
      `primary-alerts-${environmentSuffix}`,
      {
        name: pulumi.interpolate`primary-alerts-${environmentSuffix}-${randomSuffix.result}`,
        displayName: 'Primary Region Alerts',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-alerts-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    const drSnsTopic = new aws.sns.Topic(
      `dr-alerts-${environmentSuffix}`,
      {
        name: pulumi.interpolate`dr-alerts-${environmentSuffix}-${randomSuffix.result}`,
        displayName: 'DR Region Alerts',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-alerts-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // CloudWatch Metric Streams - Kinesis Firehose for primary region
    const primaryMetricStreamBucket = new aws.s3.Bucket(
      `primary-metrics-${environmentSuffix}`,
      {
        bucket: `primary-metrics-${environmentSuffix}`,
        forceDestroy: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-metrics-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    const drMetricStreamBucket = new aws.s3.Bucket(
      `dr-metrics-${environmentSuffix}`,
      {
        bucket: `dr-metrics-${environmentSuffix}`,
        forceDestroy: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-metrics-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // IAM role for Firehose
    const firehoseRole = new aws.iam.Role(
      `firehose-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`firehose-role-${environmentSuffix}-${randomSuffix.result}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'firehose.amazonaws.com',
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `firehose-role-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    const firehosePolicy = new aws.iam.RolePolicy(
      `firehose-policy-${environmentSuffix}`,
      {
        role: firehoseRole.id,
        policy: pulumi
          .all([primaryMetricStreamBucket.arn, drMetricStreamBucket.arn])
          .apply(([primaryArn, drArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
                  Resource: [
                    `${primaryArn}/*`,
                    `${drArn}/*`,
                    primaryArn,
                    drArn,
                  ],
                },
              ],
            })
          ),
      },
      { provider: primaryProvider, parent: this }
    );

    // Kinesis Firehose delivery stream for primary metrics
    const primaryFirehose = new aws.kinesis.FirehoseDeliveryStream(
      `primary-metrics-stream-${environmentSuffix}`,
      {
        name: pulumi.interpolate`primary-metrics-stream-${environmentSuffix}-${randomSuffix.result}`,
        destination: 'extended_s3',
        extendedS3Configuration: {
          roleArn: firehoseRole.arn,
          bucketArn: primaryMetricStreamBucket.arn,
          bufferingSize: 5,
          bufferingInterval: 300,
          compressionFormat: 'GZIP',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-metrics-stream-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this, dependsOn: [firehosePolicy] }
    );

    // Kinesis Firehose delivery stream for DR metrics
    const drFirehose = new aws.kinesis.FirehoseDeliveryStream(
      `dr-metrics-stream-${environmentSuffix}`,
      {
        name: pulumi.interpolate`dr-metrics-stream-${environmentSuffix}-${randomSuffix.result}`,
        destination: 'extended_s3',
        extendedS3Configuration: {
          roleArn: firehoseRole.arn,
          bucketArn: drMetricStreamBucket.arn,
          bufferingSize: 5,
          bufferingInterval: 300,
          compressionFormat: 'GZIP',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-metrics-stream-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this, dependsOn: [firehosePolicy] }
    );

    // IAM role for CloudWatch Metric Streams
    const metricStreamRole = new aws.iam.Role(
      `metric-stream-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`metric-stream-role-${environmentSuffix}-${randomSuffix.result}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'streams.metrics.cloudwatch.amazonaws.com',
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `metric-stream-role-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    const metricStreamPolicy = new aws.iam.RolePolicy(
      `metric-stream-policy-${environmentSuffix}`,
      {
        role: metricStreamRole.id,
        policy: pulumi
          .all([primaryFirehose.arn, drFirehose.arn])
          .apply(([primaryArn, drArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
                  Resource: [primaryArn, drArn],
                },
              ],
            })
          ),
      },
      { provider: primaryProvider, parent: this }
    );

    // CloudWatch Metric Stream for primary region
    const primaryMetricStream = new aws.cloudwatch.MetricStream(
      `primary-metric-stream-${environmentSuffix}`,
      {
        name: `primary-metric-stream-${environmentSuffix}`,
        roleArn: metricStreamRole.arn,
        firehoseArn: primaryFirehose.arn,
        outputFormat: 'json',
        includeFilters: [
          {
            namespace: 'AWS/RDS',
          },
          {
            namespace: 'AWS/DynamoDB',
          },
          {
            namespace: 'AWS/ApplicationELB',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-metric-stream-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [metricStreamPolicy],
      }
    );

    // CloudWatch Metric Stream for DR region
    const drMetricStream = new aws.cloudwatch.MetricStream(
      `dr-metric-stream-${environmentSuffix}`,
      {
        name: `dr-metric-stream-${environmentSuffix}`,
        roleArn: metricStreamRole.arn,
        firehoseArn: drFirehose.arn,
        outputFormat: 'json',
        includeFilters: [
          {
            namespace: 'AWS/RDS',
          },
          {
            namespace: 'AWS/DynamoDB',
          },
          {
            namespace: 'AWS/ApplicationELB',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-metric-stream-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this, dependsOn: [metricStreamPolicy] }
    );

    // CloudWatch alarm for database replication lag
    const _replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
      `replication-lag-alarm-${environmentSuffix}`,
      {
        name: `replication-lag-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'AuroraGlobalDBReplicationLag',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Average',
        threshold: 1000,
        alarmDescription: 'Alert when replication lag exceeds 1 second',
        dimensions: {
          DBClusterIdentifier: primaryDbClusterId,
        },
        alarmActions: [primarySnsTopic.arn],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `replication-lag-alarm-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );
    void _replicationLagAlarm;

    // Extract ALB name from ARN for CloudWatch dimensions
    const primaryAlbName = primaryAlbArn.apply(arn => {
      const parts = arn.split(':');
      return parts[parts.length - 1];
    });

    const drAlbName = drAlbArn.apply(arn => {
      const parts = arn.split(':');
      return parts[parts.length - 1];
    });

    // CloudWatch alarm for primary ALB unhealthy targets
    const _primaryUnhealthyAlarm = new aws.cloudwatch.MetricAlarm(
      `primary-unhealthy-alarm-${environmentSuffix}`,
      {
        name: `primary-unhealthy-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when primary ALB has unhealthy targets',
        dimensions: {
          LoadBalancer: primaryAlbName,
        },
        alarmActions: [primarySnsTopic.arn],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-unhealthy-alarm-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );
    void _primaryUnhealthyAlarm;

    // CloudWatch alarm for DR ALB unhealthy targets
    const _drUnhealthyAlarm = new aws.cloudwatch.MetricAlarm(
      `dr-unhealthy-alarm-${environmentSuffix}`,
      {
        name: `dr-unhealthy-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when DR ALB has unhealthy targets',
        dimensions: {
          LoadBalancer: drAlbName,
        },
        alarmActions: [drSnsTopic.arn],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-unhealthy-alarm-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );
    void _drUnhealthyAlarm;

    // IAM role for Lambda failover function
    const lambdaRole = new aws.iam.Role(
      `failover-lambda-role-${environmentSuffix}`,
      {
        name: pulumi.interpolate`failover-lambda-role-${environmentSuffix}-${randomSuffix.result}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `failover-lambda-role-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Lambda IAM policy with full permissions
    const lambdaPolicy = new aws.iam.RolePolicy(
      `failover-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([primarySnsTopic.arn, drSnsTopic.arn])
          .apply(([primaryArn, drArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: 'arn:aws:logs:*:*:*',
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: [primaryArn, drArn],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'rds:DescribeGlobalClusters',
                    'rds:FailoverGlobalCluster',
                    'route53:GetHealthCheckStatus',
                    'route53:UpdateHealthCheck',
                    'cloudwatch:DescribeAlarms',
                    'cloudwatch:GetMetricStatistics',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { provider: primaryProvider, parent: this }
    );

    // Lambda function for failover orchestration
    const failoverLambda = new aws.lambda.Function(
      `failover-lambda-${environmentSuffix}`,
      {
        name: pulumi.interpolate`failover-lambda-${environmentSuffix}-${randomSuffix.result}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'us-east-1' });
const rds = new AWS.RDS({ region: 'us-east-1' });

exports.handler = async (event) => {
  console.log('Failover event received:', JSON.stringify(event, null, 2));

  const alarmName = event.detail?.alarmName || 'Unknown';
  const newState = event.detail?.state?.value || 'Unknown';
  const reason = event.detail?.state?.reason || 'No reason provided';

  // Only trigger on ALARM state
  if (newState !== 'ALARM') {
    console.log('Not in ALARM state, skipping failover');
    return { statusCode: 200, body: 'No action needed' };
  }

  console.log(\`Alarm \${alarmName} triggered: \${reason}\`);

  // Send notification
  const message = \`DR Failover Alert

Alarm: \${alarmName}
State: \${newState}
Reason: \${reason}
Time: \${new Date().toISOString()}

Failover procedures initiated. Monitor Route53 health checks for automatic DNS failover.
Review CloudWatch dashboards for system status.\`;

  try {
    await sns.publish({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'DR Failover Alert - Action Required',
      Message: message,
    }).promise();

    console.log('Notification sent successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Failover notification sent', alarm: alarmName }),
    };
  } catch (error) {
    console.error('Error during failover:', error);
    throw error;
  }
};
        `),
        }),
        timeout: 300,
        environment: {
          variables: {
            PRIMARY_REGION: 'us-east-1',
            DR_REGION: 'us-east-2',
            SNS_TOPIC_ARN: primarySnsTopic.arn,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `failover-lambda-${environmentSuffix}`,
        })),
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [lambdaRole, lambdaPolicy],
      }
    );

    // EventBridge rule for triggering failover on CloudWatch alarms
    const failoverRule = new aws.cloudwatch.EventRule(
      `failover-rule-${environmentSuffix}`,
      {
        name: `failover-rule-${environmentSuffix}`,
        description:
          'Trigger failover Lambda on CloudWatch alarm state changes',
        eventPattern: JSON.stringify({
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [
              {
                prefix: `replication-lag-alarm-${environmentSuffix}`,
              },
              {
                prefix: `primary-unhealthy-alarm-${environmentSuffix}`,
              },
            ],
          },
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `failover-rule-${environmentSuffix}`,
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // EventBridge target to invoke Lambda
    const _failoverTarget = new aws.cloudwatch.EventTarget(
      `failover-target-${environmentSuffix}`,
      {
        rule: failoverRule.name,
        arn: failoverLambda.arn,
      },
      { provider: primaryProvider, parent: this }
    );
    void _failoverTarget;

    // Lambda permission for EventBridge to invoke
    const _lambdaPermission = new aws.lambda.Permission(
      `failover-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: failoverLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: failoverRule.arn,
      },
      { provider: primaryProvider, parent: this }
    );
    void _lambdaPermission;

    this.primarySnsTopicArn = primarySnsTopic.arn;
    this.drSnsTopicArn = drSnsTopic.arn;
    this.failoverLambdaArn = failoverLambda.arn;

    this.registerOutputs({
      primarySnsTopicArn: this.primarySnsTopicArn,
      drSnsTopicArn: this.drSnsTopicArn,
      failoverLambdaArn: this.failoverLambdaArn,
      primaryMetricStreamName: primaryMetricStream.name,
      drMetricStreamName: drMetricStream.name,
    });
  }
}
