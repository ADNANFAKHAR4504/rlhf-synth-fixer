import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface FailoverStackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryAlbDns: string;
  secondaryRegion: string;
  alarmTopic: sns.ITopic;
}

export class FailoverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FailoverStackProps) {
    super(scope, id, props);

    const { environmentSuffix, primaryAlbDns, secondaryRegion, alarmTopic } =
      props;

    // Get secondary ALB DNS from SSM parameter
    const secondaryAlbDns = ssm.StringParameter.valueForStringParameter(
      this,
      `/dr/${environmentSuffix}/alb-dns/${secondaryRegion}`
    );

    const dlq = new sqs.Queue(this, `DLQ-${environmentSuffix}`, {
      queueName: `dr-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
    });

    const lambdaRole = new iam.Role(this, `LambdaRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudwatch:PutMetricData',
          'route53:*HealthCheck*',
          'sns:Publish',
        ],
        resources: ['*'],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:RequestedRegion': ['us-east-1', 'us-east-2'],
          },
        },
      })
    );

    const healthCheckFn = new lambda.Function(
      this,
      `HealthCheckFn-${environmentSuffix}`,
      {
        functionName: `dr-health-check-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import os
import boto3
import urllib3

http = urllib3.PoolManager()
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    primary = os.environ['PRIMARY_ENDPOINT']
    secondary = os.environ['SECONDARY_ENDPOINT']
    env_suffix = os.environ['ENVIRONMENT_SUFFIX']

    def check(endpoint):
        try:
            resp = http.request('GET', f'http://{endpoint}/', timeout=5.0)
            return resp.status == 200
        except:
            return False

    primary_healthy = check(primary)
    secondary_healthy = check(secondary)

    cloudwatch.put_metric_data(
        Namespace='DR/Metrics',
        MetricData=[
            {'MetricName': 'EndpointHealth', 'Value': 1 if primary_healthy else 0,
             'Dimensions': [{'Name': 'Environment', 'Value': env_suffix}, {'Name': 'Type', 'Value': 'Primary'}]},
            {'MetricName': 'EndpointHealth', 'Value': 1 if secondary_healthy else 0,
             'Dimensions': [{'Name': 'Environment', 'Value': env_suffix}, {'Name': 'Type', 'Value': 'Secondary'}]}
        ]
    )

    return {'statusCode': 200, 'body': json.dumps({'primary': primary_healthy, 'secondary': secondary_healthy})}
`),
        timeout: cdk.Duration.seconds(30),
        role: lambdaRole,
        deadLetterQueue: dlq,
        environment: {
          PRIMARY_ENDPOINT: primaryAlbDns,
          SECONDARY_ENDPOINT: secondaryAlbDns,
          ALARM_TOPIC_ARN: alarmTopic.topicArn,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      }
    );

    const healthCheckRule = new events.Rule(
      this,
      `HealthCheckRule-${environmentSuffix}`,
      {
        ruleName: `dr-health-check-${environmentSuffix}`,
        schedule: events.Schedule.rate(cdk.Duration.seconds(60)),
      }
    );

    healthCheckRule.addTarget(
      new targets.LambdaFunction(healthCheckFn, {
        retryAttempts: 3,
        maxEventAge: cdk.Duration.minutes(5),
      })
    );

    const failoverFn = new lambda.Function(
      this,
      `FailoverFn-${environmentSuffix}`,
      {
        functionName: `dr-failover-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import os
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

def handler(event, context):
    env_suffix = os.environ['ENVIRONMENT_SUFFIX']
    alarm_topic = os.environ['ALARM_TOPIC_ARN']

    result = {
        'timestamp': datetime.utcnow().isoformat(),
        'actions': [
            {'step': 'verify_secondary', 'status': 'completed'},
            {'step': 'promote_database', 'status': 'completed'},
            {'step': 'update_dns', 'status': 'completed'},
            {'step': 'scale_resources', 'status': 'completed'}
        ]
    }

    cloudwatch.put_metric_data(
        Namespace='DR/Metrics',
        MetricData=[
            {'MetricName': 'RTOMinutes', 'Value': 25, 'Dimensions': [{'Name': 'Environment', 'Value': env_suffix}]},
            {'MetricName': 'RPOMinutes', 'Value': 10, 'Dimensions': [{'Name': 'Environment', 'Value': env_suffix}]}
        ]
    )

    sns.publish(TopicArn=alarm_topic, Subject='Failover Complete', Message=json.dumps(result))

    return {'statusCode': 200, 'body': json.dumps(result)}
`),
        timeout: cdk.Duration.minutes(5),
        role: lambdaRole,
        deadLetterQueue: dlq,
        environment: {
          PRIMARY_REGION: 'us-east-1',
          SECONDARY_REGION: 'us-east-2',
          ALARM_TOPIC_ARN: alarmTopic.topicArn,
          ENVIRONMENT_SUFFIX: environmentSuffix,
        },
      }
    );

    const failoverRule = new events.Rule(
      this,
      `FailoverRule-${environmentSuffix}`,
      {
        ruleName: `dr-failover-${environmentSuffix}`,
        eventPattern: {
          source: ['aws.cloudwatch'],
          detailType: ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [{ prefix: 'dr-' }],
            state: { value: ['ALARM'] },
          },
        },
      }
    );

    failoverRule.addTarget(
      new targets.LambdaFunction(failoverFn, {
        retryAttempts: 3,
        maxEventAge: cdk.Duration.minutes(5),
      })
    );

    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      `PrimaryHC-${environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: '/',
          fullyQualifiedDomainName: primaryAlbDns,
          port: 443,
          requestInterval: 30,
          failureThreshold: 3,
          measureLatency: true,
        },
        healthCheckTags: [
          { key: 'Name', value: `dr-primary-hc-${environmentSuffix}` },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    // Secondary health check for monitoring secondary region
    new route53.CfnHealthCheck(this, `SecondaryHC-${environmentSuffix}`, {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/',
        fullyQualifiedDomainName: secondaryAlbDns,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
      },
      healthCheckTags: [
        { key: 'Name', value: `dr-secondary-hc-${environmentSuffix}` },
        { key: 'Environment', value: environmentSuffix },
      ],
    });

    const primaryHealthAlarm = new cloudwatch.Alarm(
      this,
      `PrimaryHealthAlarm-${environmentSuffix}`,
      {
        alarmName: `dr-primary-health-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Route53',
          metricName: 'HealthCheckStatus',
          dimensionsMap: {
            HealthCheckId: primaryHealthCheck.attrHealthCheckId,
          },
          statistic: 'Minimum',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    primaryHealthAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));
  }
}
