import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsDestinations from 'aws-cdk-lib/aws-logs-destinations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';

export class LogProcessingConstruct extends Construct {
  public readonly logProcessor: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Lambda function for log processing
    this.logProcessor = new lambda.Function(this, 'LogProcessor', {
      functionName: 'payment-log-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/log-processor')),
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      environment: {
        METRICS_NAMESPACE: 'PaymentPlatform',
      },
    });

    // Grant permissions for CloudWatch metrics
    this.logProcessor.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*'],
    }));

    // Application Log Group
    const appLogGroup = new logs.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/aws/application/payment-platform',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // Subscribe Lambda to log group
    new logs.SubscriptionFilter(this, 'LogSubscription', {
      logGroup: appLogGroup,
      destination: new logsDestinations.LambdaDestination(this.logProcessor),
      filterPattern: logs.FilterPattern.allEvents(),
    });

    // Metric filters for error patterns
    new logs.MetricFilter(this, 'PaymentErrorFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.literal('[ERROR] Payment processing failed'),
      metricNamespace: 'PaymentPlatform',
      metricName: 'PaymentProcessingErrors',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'SecurityEventFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.literal('[SECURITY] Authentication failed'),
      metricNamespace: 'PaymentPlatform/Security',
      metricName: 'AuthenticationFailures',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'DatabaseErrorFilter', {
      logGroup: appLogGroup,
      filterPattern: logs.FilterPattern.anyTerm('database', 'connection', 'timeout'),
      metricNamespace: 'PaymentPlatform',
      metricName: 'DatabaseErrors',
      defaultValue: 0,
    });

    // API Gateway access logs
    const apiLogGroup = new logs.LogGroup(this, 'APIGatewayLogs', {
      logGroupName: '/aws/apigateway/payment-api',
      retention: logs.RetentionDays.ONE_MONTH,
    });

    // Metric filter for API 4xx/5xx errors
    new logs.MetricFilter(this, 'API4xxFilter', {
      logGroup: apiLogGroup,
      filterPattern: logs.FilterPattern.literal('[4**]'),
      metricNamespace: 'PaymentPlatform/API',
      metricName: 'ClientErrors',
      defaultValue: 0,
    });

    new logs.MetricFilter(this, 'API5xxFilter', {
      logGroup: apiLogGroup,
      filterPattern: logs.FilterPattern.literal('[5**]'),
      metricNamespace: 'PaymentPlatform/API',
      metricName: 'ServerErrors',
      defaultValue: 0,
    });
  }
}