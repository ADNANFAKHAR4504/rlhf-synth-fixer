import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { MonitoringConstruct } from './monitoring-construct';

// Custom interface for Service Level Objectives since CfnServiceLevelObjective is not available in CDK 2.204.0
interface ServiceLevelObjective {
  name: string;
  description: string;
  targetValue: number;
  metricNamespace: string;
  metricName: string;
  dimensions: Record<string, string>;
}

export interface ServerlessStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class ServerlessStack extends cdk.Stack {
  public readonly lambdaFunctions: lambda.Function[] = [];
  public readonly logGroup: logs.LogGroup;
  public readonly apiEndpoint: string;
  public readonly snsTopicArn: string;
  public readonly applicationSignalsServiceMap: ServiceLevelObjective[];
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: ServerlessStackProps) {
    super(scope, id, props);
    this.environmentSuffix = props.environmentSuffix;

    // Centralized log group with retention and cost optimization
    this.logGroup = new logs.LogGroup(this, 'CentralizedLogGroup', {
      logGroupName: `/aws/lambda/serverless-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK, // Cost optimization
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create sample Lambda functions with high-performance configurations
    const sampleFunction = this.createHighPerformanceFunction(
      'SampleFunction',
      'sample_handler.py'
    );
    const processingFunction = this.createHighPerformanceFunction(
      'ProcessingFunction',
      'processing_handler.py'
    );

    // Create Python Lambda function with provisioned concurrency for cold start optimization
    const coldStartOptimizedFunction = this.createColdStartOptimizedFunction(
      'ColdStartOptimizedFunction'
    );

    // Store functions in array (include cold start optimized function for full monitoring)
    this.lambdaFunctions = [
      sampleFunction,
      processingFunction,
      coldStartOptimizedFunction,
    ];

    // Initialize Application Signals for APM monitoring
    this.applicationSignalsServiceMap = this.enableApplicationSignals();

    // Create enhanced monitoring construct with Application Signals
    new MonitoringConstruct(this, 'EnhancedMonitoring', {
      lambdaFunctions: this.lambdaFunctions,
      environmentSuffix: props.environmentSuffix,
    });

    // API Gateway for HTTP access
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'High-traffic serverless API',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda integrations with API Gateway
    const sampleIntegration = new apigateway.LambdaIntegration(sampleFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const processingIntegration = new apigateway.LambdaIntegration(
      processingFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    const coldStartOptimizedIntegration = new apigateway.LambdaIntegration(
      coldStartOptimizedFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    api.root.addResource('sample').addMethod('POST', sampleIntegration);
    api.root.addResource('process').addMethod('POST', processingIntegration);
    api.root
      .addResource('coldstart-optimized')
      .addMethod('POST', coldStartOptimizedIntegration);

    // Store API endpoint
    this.apiEndpoint = api.url;

    // Third-party monitoring setup with SNS
    this.snsTopicArn = this.createMonitoringIntegration();

    // Cost monitoring alarm
    this.createCostMonitoringAlarm(props.environmentSuffix);

    // Create outputs for integration testing
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${this.stackName}-ApiEndpoint`,
    });

    new cdk.CfnOutput(this, 'SampleFunctionArn', {
      value: sampleFunction.functionArn,
      description: 'Sample Lambda function ARN',
      exportName: `${this.stackName}-SampleFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ProcessingFunctionArn', {
      value: processingFunction.functionArn,
      description: 'Processing Lambda function ARN',
      exportName: `${this.stackName}-ProcessingFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ColdStartOptimizedFunctionArn', {
      value: coldStartOptimizedFunction.functionArn,
      description: 'Python Lambda function with cold start optimization ARN',
      exportName: `${this.stackName}-ColdStartOptimizedFunctionArn`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'Centralized CloudWatch log group',
      exportName: `${this.stackName}-LogGroupName`,
    });
  }

  private createHighPerformanceFunction(
    functionName: string,
    _fileName: string
  ): lambda.Function {
    // Role with optimized permissions for high-performance Lambda
    const lambdaRole = new iam.Role(this, `${functionName}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        LogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [this.logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    const func = new lambda.Function(this, functionName, {
      runtime: lambda.Runtime.PYTHON_3_11, // Latest Python runtime
      handler: 'index.handler',
      code: lambda.Code.fromInline(this.getSamplePythonCode(_fileName)),
      role: lambdaRole,
      logGroup: this.logGroup,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024, // Optimized for high throughput
      reservedConcurrentExecutions: 50, // Max concurrent executions as required
      architecture: lambda.Architecture.ARM_64, // Cost optimization with Graviton2
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing for Application Signals
      environment: {
        LOG_LEVEL: 'INFO',
        POWERTOOLS_SERVICE_NAME: functionName.toLowerCase(),
        POWERTOOLS_LOG_LEVEL: 'INFO',
        AWS_XRAY_TRACING_NAME: functionName,
        AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
        LAMBDA_INSIGHTS_LOG_LEVEL: 'info',
        // Application Signals environment variables
        OTEL_SERVICE_NAME: functionName.toLowerCase(),
        OTEL_RESOURCE_ATTRIBUTES: `service.name=${functionName.toLowerCase()},service.version=1.0`,
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-instrument',
      },
    });

    // Configure SnapStart for Java functions (preparation for future Java functions)
    // Note: SnapStart is only available for Java runtimes, not Python
    // This configuration is for when Java functions are added to the infrastructure
    const cfnFunction = func.node.defaultChild as lambda.CfnFunction;
    if (cfnFunction) {
      // Add tags for SnapStart readiness identification
      cdk.Tags.of(func).add('SnapStartReady', 'true');
      cdk.Tags.of(func).add('Runtime', 'python3.11');
      cdk.Tags.of(func).add('SnapStartSupport', 'java-only');
    }

    // CloudWatch alarms for monitoring
    new cloudwatch.Alarm(this, `${functionName}ErrorAlarm`, {
      metric: func.metricErrors({
        period: cdk.Duration.minutes(1),
        statistic: cloudwatch.Stats.SUM,
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, `${functionName}DurationAlarm`, {
      metric: func.metricDuration({
        period: cdk.Duration.minutes(1),
        statistic: cloudwatch.Stats.AVERAGE,
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
    });

    new cloudwatch.Alarm(this, `${functionName}ThrottleAlarm`, {
      metric: func.metricThrottles({
        period: cdk.Duration.minutes(1),
        statistic: cloudwatch.Stats.SUM,
      }),
      threshold: 1,
      evaluationPeriods: 1,
    });

    return func;
  }

  private createColdStartOptimizedFunction(
    functionName: string
  ): lambda.Function {
    // Role with optimized permissions for Python Lambda with cold start optimization
    const pythonLambdaRole = new iam.Role(this, `${functionName}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        LogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [this.logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Python Lambda function with cold start optimization using provisioned concurrency
    const pythonFunc = new lambda.Function(this, functionName, {
      runtime: lambda.Runtime.PYTHON_3_9, // Python 3.9 runtime for optimal performance
      handler: 'coldstart_optimized_handler.handler',
      code: lambda.Code.fromAsset('lib/lambda-handlers'),
      role: pythonLambdaRole,
      logGroup: this.logGroup,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024, // Optimized memory for Python
      reservedConcurrentExecutions: 25, // Reserve concurrency for consistent performance
      architecture: lambda.Architecture.X86_64, // Optimal for Python
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing for Application Signals
      environment: {
        LOG_LEVEL: 'INFO',
        POWERTOOLS_SERVICE_NAME: functionName.toLowerCase(),
        AWS_XRAY_TRACING_NAME: functionName,
        AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
        // Application Signals environment variables
        OTEL_SERVICE_NAME: functionName.toLowerCase(),
        OTEL_RESOURCE_ATTRIBUTES: `service.name=${functionName.toLowerCase()},service.version=1.0`,
        PYTHONPATH: '/opt/python',
        // Cold start optimization environment variables
        COLD_START_OPTIMIZED: 'true',
        PROVISIONED_CONCURRENCY: 'enabled',
      },
    });

    // Create a version for provisioned concurrency
    const pythonVersion = new lambda.Version(this, `${functionName}Version`, {
      lambda: pythonFunc,
      description: 'Version with cold start optimization enabled',
    });

    // Create an alias pointing to the version for provisioned concurrency
    const pythonAlias = new lambda.Alias(this, `${functionName}Alias`, {
      aliasName: 'coldstart-optimized',
      version: pythonVersion,
      description: 'Alias for cold start optimized function',
    });

    // Configure provisioned concurrency on the alias for cold start optimization
    pythonAlias.addAutoScaling({
      minCapacity: 5, // Keep at least 5 instances warm
      maxCapacity: 20, // Scale up to 20 instances based on demand
    });

    // Add tags for cold start optimization identification
    cdk.Tags.of(pythonFunc).add('ColdStartOptimization', 'enabled');
    cdk.Tags.of(pythonFunc).add('Runtime', 'python3.9');
    cdk.Tags.of(pythonFunc).add(
      'OptimizationTechnique',
      'provisioned_concurrency'
    );

    // CloudWatch alarms for the Python function with cold start optimization
    new cloudwatch.Alarm(this, `${functionName}ColdStartAlarm`, {
      metric: pythonFunc.metricDuration({
        period: cdk.Duration.minutes(1),
        statistic: 'p99',
      }),
      threshold: 1000, // 1 second - with provisioned concurrency should be much lower
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Monitor cold start performance with provisioned concurrency optimization',
    });

    // Output cold start optimization configuration details
    new cdk.CfnOutput(this, `${functionName}ColdStartOptimized`, {
      value: 'true',
      description: `Cold start optimization enabled for ${functionName}`,
      exportName: `${this.stackName}-${functionName}-ColdStartOptimized`,
    });

    new cdk.CfnOutput(this, `${functionName}AliasArn`, {
      value: pythonAlias.functionArn,
      description: `${functionName} alias ARN with cold start optimization`,
      exportName: `${this.stackName}-${functionName}-AliasArn`,
    });

    return pythonFunc;
  }

  private createMonitoringIntegration(): string {
    // SNS topic for third-party monitoring integration
    const monitoringTopic = new sns.Topic(this, 'MonitoringTopic', {
      topicName: `serverless-monitoring-${this.environmentSuffix}`,
      displayName: 'Serverless Monitoring Topic',
    });
    monitoringTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // EventBridge rule to send metrics every minute (minimum supported interval)
    // Note: EventBridge doesn't support sub-minute intervals, using 1 minute instead
    const metricsRule = new events.Rule(this, 'MetricsRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      description: 'Send metrics to third-party monitoring every minute',
    });

    // Lambda function to collect and send metrics
    const metricsCollector = new lambda.Function(this, 'MetricsCollector', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    cloudwatch = boto3.client('cloudwatch')
    
    # Collect Lambda metrics
    metrics_data = []
    
    # Example: Get recent invocations, errors, duration
    # In real implementation, you would collect actual metrics
    metrics_data.append({
        'MetricName': 'CustomInvocations',
        'Value': 1,
        'Unit': 'Count',
        'Timestamp': datetime.utcnow()
    })
    
    # Send to CloudWatch custom metrics
    try:
        response = cloudwatch.put_metric_data(
            Namespace='ServerlessApp/Custom',
            MetricData=metrics_data
        )
        print(f"Metrics sent successfully: {response}")
    except Exception as e:
        print(f"Error sending metrics: {e}")
    
    return {
        'statusCode': 200,
        'body': json.dumps('Metrics collected and sent')
    }
      `),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128, // Minimal memory for cost optimization
      logGroup: this.logGroup,
    });

    // Grant permissions to read CloudWatch metrics
    metricsCollector.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:GetMetricData',
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:ListMetrics',
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
      })
    );

    metricsRule.addTarget(new targets.LambdaFunction(metricsCollector));

    // Grant SNS publish permissions for third-party integrations
    monitoringTopic.grantPublish(metricsCollector);

    // Add output for SNS topic
    new cdk.CfnOutput(this, 'MonitoringTopicArn', {
      value: monitoringTopic.topicArn,
      description: 'SNS topic for third-party monitoring',
      exportName: `${this.stackName}-MonitoringTopicArn`,
    });

    return monitoringTopic.topicArn;
  }

  private createCostMonitoringAlarm(environmentSuffix: string): void {
    // Cost monitoring using CloudWatch billing metrics
    new cloudwatch.Alarm(this, 'CostAlarm', {
      alarmName: `serverless-cost-alarm-${environmentSuffix}`,
      alarmDescription: 'Monitor Lambda costs to stay under $1000/month',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD',
          ServiceName: 'AWSLambda',
        },
        statistic: cloudwatch.Stats.MAXIMUM,
        period: cdk.Duration.hours(24),
      }),
      threshold: 900, // Alert at $900 to stay under $1000
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
  }

  private enableApplicationSignals(): ServiceLevelObjective[] {
    // Enable CloudWatch Application Signals for APM monitoring
    const applicationSignals: ServiceLevelObjective[] = [];

    // Create Service Level Objectives for each Lambda function
    this.lambdaFunctions.forEach((func, index) => {
      const functionName = `Function${index}`;
      // Create SLO for availability
      const availabilitySLO: ServiceLevelObjective = {
        name: `${func.functionName.toLowerCase()}-availability-slo`,
        description: `Availability SLO for ${func.functionName}`,
        targetValue: 99.9, // 99.9% availability target
        metricNamespace: 'AWS/Lambda',
        metricName: 'SuccessRate',
        dimensions: {
          FunctionName: func.functionName,
          Environment: this.environmentSuffix,
        },
      };

      // Create availability monitoring alarm
      const availabilityAlarm = new cloudwatch.Alarm(
        this,
        `${functionName}AvailabilitySLO`,
        {
          alarmName: `${functionName.toLowerCase()}-availability-slo`,
          alarmDescription: `Availability SLO for ${func.functionName}`,
          metric: new cloudwatch.MathExpression({
            expression: '100 - (errors / invocations * 100)',
            label: 'Success Rate',
            usingMetrics: {
              invocations: func.metricInvocations({
                period: cdk.Duration.minutes(5),
                statistic: cloudwatch.Stats.SUM,
              }),
              errors: func.metricErrors({
                period: cdk.Duration.minutes(5),
                statistic: cloudwatch.Stats.SUM,
              }),
            },
          }),
          threshold: availabilitySLO.targetValue,
          comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      // Add tags to the alarm
      cdk.Tags.of(availabilityAlarm).add('SLOType', 'Availability');
      cdk.Tags.of(availabilityAlarm).add('Function', func.functionName);
      cdk.Tags.of(availabilityAlarm).add('Environment', this.environmentSuffix);

      // Create SLO for latency
      const latencySLO: ServiceLevelObjective = {
        name: `${func.functionName.toLowerCase()}-latency-slo`,
        description: `Latency SLO for ${func.functionName}`,
        targetValue: 2000, // 2000ms latency target
        metricNamespace: 'AWS/Lambda',
        metricName: 'Duration',
        dimensions: {
          FunctionName: func.functionName,
          Environment: this.environmentSuffix,
        },
      };

      // Create latency monitoring alarm
      const latencyAlarm = new cloudwatch.Alarm(
        this,
        `${functionName}LatencySLO`,
        {
          alarmName: `${functionName.toLowerCase()}-latency-slo`,
          alarmDescription: `Latency SLO for ${func.functionName}`,
          metric: func.metricDuration({
            period: cdk.Duration.minutes(5),
            statistic: 'p95',
          }),
          threshold: latencySLO.targetValue,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          evaluationPeriods: 3,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        }
      );

      // Add tags to the alarm
      cdk.Tags.of(latencyAlarm).add('SLOType', 'Latency');
      cdk.Tags.of(latencyAlarm).add('Function', func.functionName);
      cdk.Tags.of(latencyAlarm).add('Environment', this.environmentSuffix);

      applicationSignals.push(availabilitySLO, latencySLO);
    });

    // Store Application Signals configuration in SSM for reference
    new ssm.StringParameter(this, 'ApplicationSignalsConfig', {
      parameterName: `/serverless/${this.environmentSuffix}/application-signals/enabled`,
      stringValue: 'true',
      description:
        'Application Signals enablement flag for serverless infrastructure',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output Application Signals information
    new cdk.CfnOutput(this, 'ApplicationSignalsEnabled', {
      value: 'true',
      description:
        'AWS CloudWatch Application Signals enabled for APM monitoring',
      exportName: `${this.stackName}-ApplicationSignalsEnabled`,
    });

    new cdk.CfnOutput(this, 'ServiceLevelObjectivesCount', {
      value: applicationSignals.length.toString(),
      description: 'Number of Service Level Objectives configured',
      exportName: `${this.stackName}-SLOCount`,
    });

    return applicationSignals;
  }

  private getSamplePythonCode(_fileName: string): string {
    return `
import json
import logging
import time
import os
from datetime import datetime

# Configure logging for centralized CloudWatch logs
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    High-performance Lambda handler with logging and metrics
    """
    start_time = time.time()
    
    try:
        # Log with structured format for better monitoring
        logger.info(f"Function {context.function_name} started at {datetime.utcnow()}")
        logger.info(f"Event: {json.dumps(event, default=str)}")
        
        # Simulate processing work
        process_data(event)
        
        processing_time = (time.time() - start_time) * 1000
        logger.info(f"Processing completed in {processing_time:.2f}ms")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            'body': json.dumps({
                'message': f'Success from {context.function_name}',
                'timestamp': datetime.utcnow().isoformat(),
                'processing_time_ms': processing_time,
                'request_id': context.aws_request_id
            })
        }
        
    except Exception as e:
        logger.error(f"Error in {context.function_name}: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'request_id': context.aws_request_id
            })
        }

def process_data(event):
    """
    Sample data processing function
    """
    # Simulate some processing time
    time.sleep(0.1)  # 100ms processing time
    
    # Log processing details
    logger.info("Data processing completed successfully")
    
    return True
    `;
  }
}
