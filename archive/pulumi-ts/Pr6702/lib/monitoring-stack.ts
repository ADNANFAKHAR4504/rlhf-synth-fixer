import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  kmsKeyArn: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const { environmentSuffix, vpcId, kmsKeyArn, tags } = args;

    // Get current AWS account
    const current = aws.getCallerIdentity({});

    // S3 bucket for VPC Flow Logs with KMS encryption
    const flowLogsBucket = new aws.s3.Bucket(
      `flow-logs-bucket-${environmentSuffix}`,
      {
        bucket: pulumi
          .output(current)
          .apply(c => `flow-logs-${environmentSuffix}-${c.accountId}`),
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: {
              days: 90,
            },
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `flow-logs-bucket-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Block public access to flow logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `flow-logs-bucket-pab-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Bucket policy for VPC Flow Logs
    new aws.s3.BucketPolicy(
      `flow-logs-bucket-policy-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        policy: pulumi
          .all([flowLogsBucket.arn, current])
          .apply(([arn, _account]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSLogDeliveryWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Sid: 'AWSLogDeliveryAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: arn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // VPC Flow Log
    new aws.ec2.FlowLog(
      `vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: vpcId,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.arn,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `vpc-flow-log-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Log Group for application logs
    const logGroup = new aws.cloudwatch.LogGroup(
      `app-log-group-${environmentSuffix}`,
      {
        name: `/aws/application/${environmentSuffix}`,
        retentionInDays: 90,
        kmsKeyId: kmsKeyArn,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `app-log-group-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // CloudWatch Metric Filter for failed authentication attempts
    const metricFilter = new aws.cloudwatch.LogMetricFilter(
      `auth-failure-filter-${environmentSuffix}`,
      {
        logGroupName: logGroup.name,
        name: `AuthenticationFailures-${environmentSuffix}`,
        pattern:
          '[timestamp, request_id, event_type = "AuthenticationFailure", ...]',
        metricTransformation: {
          name: `AuthenticationFailures-${environmentSuffix}`,
          namespace: 'SecurityMetrics',
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for authentication failures
    new aws.cloudwatch.MetricAlarm(
      `auth-failure-alarm-${environmentSuffix}`,
      {
        name: `auth-failures-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: metricFilter.metricTransformation.name,
        namespace: metricFilter.metricTransformation.namespace,
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert on multiple failed authentication attempts',
        treatMissingData: 'notBreaching',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `auth-failure-alarm-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Export outputs
    this.flowLogsBucketName = flowLogsBucket.bucket;
    this.logGroupName = logGroup.name;

    this.registerOutputs({
      flowLogsBucketName: this.flowLogsBucketName,
      logGroupName: this.logGroupName,
    });
  }
}
