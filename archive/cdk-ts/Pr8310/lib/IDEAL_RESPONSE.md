
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

// Define a configuration interface for environment-specific overrides
interface EnvironmentConfig {
  lambdaMemory: number;
  dynamoDbReadCapacity: number;
  dynamoDbWriteCapacity: number; 
  enableFeatureX: boolean; // Example feature flag
}

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // --- Environment and Feature Flag Configuration Strategy ---
    // Define sensible defaults for a 'dev' environment
    const defaultConfig: EnvironmentConfig = {
        lambdaMemory: 128,
        dynamoDbReadCapacity: 5,
        dynamoDbWriteCapacity: 5,
        enableFeatureX: false,
    };

    // Read environment-specific configuration and merge with defaults
    // This allows for overriding only specific values per environment.
    const envConfig: EnvironmentConfig = {
        ...defaultConfig,
        ...this.node.tryGetContext(environmentSuffix),
    };

    // --- Comprehensive Tagging Strategy ---
    // Tags are applied to all resources within this stack for cost tracking and organization.
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'ServerlessMicroservices');
    cdk.Tags.of(this).add('Owner', 'DevTeam');
    cdk.Tags.of(this).add('CostCenter', '12345');

    // --- Account-Level Setup: API Gateway CloudWatch Logs Role ---
    // This part ensures that API Gateway has the necessary permissions to push logs to CloudWatch.
    const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchLogsRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
      description: 'IAM role for API Gateway to push logs to CloudWatch Logs',
    });

    new apigw.CfnAccount(this, 'ApiGatewayAccountSettings', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });

    new cdk.CfnOutput(this, 'ApiGatewayCloudWatchLogsRoleArn', {
      value: apiGatewayCloudWatchRole.roleArn,
      description: 'ARN of the IAM role used by API Gateway for CloudWatch Logs',
    });

    // --- Product Microservice Components ---

    // DynamoDB Table for Products
    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: envConfig.dynamoDbReadCapacity,
      writeCapacity: envConfig.dynamoDbWriteCapacity,
      removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      // FIX: Use pointInTimeRecoverySpecification instead of the deprecated pointInTimeRecovery
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });
    cdk.Tags.of(productsTable).add('Service', 'ProductService');

    // SNS Topic for Product Events
    const productEventsTopic = new sns.Topic(this, 'ProductEventsTopic', {
      displayName: 'Product Events Topic',
    });
    cdk.Tags.of(productEventsTopic).add('Service', 'ProductService');

    // SQS Queue for Asynchronous Processing
    const orderProcessingQueue = new sqs.Queue(this, 'OrderProcessingQueue', {
      visibilityTimeout: Duration.seconds(300),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });
    cdk.Tags.of(orderProcessingQueue).add('Service', 'OrderService');

    // Lambda Function Role
    const productLambdaRole = new iam.Role(this, 'ProductLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    productsTable.grantReadWriteData(productLambdaRole);
    productEventsTopic.grantPublish(productLambdaRole);

    // FIX: Explicitly create a LogGroup to manage retention, replacing the deprecated `logRetention` property.
    const productLambdaLogGroup = new logs.LogGroup(this, 'ProductLambdaLogGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
        // Ensure the log group is destroyed when the stack is destroyed for non-prod environments
        removalPolicy: environmentSuffix === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Function for Product API
    const productLambda = new lambda.Function(this, 'ProductLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));
          const response = {
            statusCode: 200,
            headers: { "Content-Type": "text/plain" },
            body: \`Hello from ProductLambda! (Feature X Enabled: ${envConfig.enableFeatureX})\`
          };
          return response;
        };
      `),
      memorySize: envConfig.lambdaMemory,
      timeout: Duration.seconds(10),
      environment: {
        TABLE_NAME: productsTable.tableName,
        SNS_TOPIC_ARN: productEventsTopic.topicArn,
        FEATURE_X_ENABLED: String(envConfig.enableFeatureX),
      },
      // FIX: Use the new logGroup property instead of the deprecated logRetention
      logGroup: productLambdaLogGroup,
      role: productLambdaRole,
    });
    cdk.Tags.of(productLambda).add('Service', 'ProductService');

    // API Gateway for Product Microservice
    const api = new apigw.RestApi(this, 'ProductApi', {
      restApiName: `${environmentSuffix}-ProductApi`,
      description: 'API for managing products',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      endpointTypes: [apigw.EndpointType.REGIONAL],
    });
    cdk.Tags.of(api).add('Service', 'ProductService');

    const productsResource = api.root.addResource('products');
    productsResource.addMethod('GET', new apigw.LambdaIntegration(productLambda));
    productsResource.addMethod('POST', new apigw.LambdaIntegration(productLambda));

    // --- Observability: CloudWatch Alarms ---
    // Alarm for Lambda errors
    productLambda.metricErrors().with({ statistic: 'Sum', period: Duration.minutes(1) })
      .createAlarm(this, 'ProductLambdaErrorsAlarm', {
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: 'Alarm if Product Lambda function has errors',
      });

    // Alarm for API Gateway 5xx errors
    api.metricServerError({ period: Duration.minutes(1), statistic: 'Sum' })
      .createAlarm(this, 'ProductApi5xxErrorsAlarm', {
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: 'Alarm if Product API Gateway has 5xx errors',
      });

    // Alarm for DynamoDB throttled requests
    const dynamoDbThrottleMetric = productsTable.metricThrottledRequestsForOperations({
      operations: [dynamodb.Operation.GET_ITEM, dynamodb.Operation.QUERY],
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'DynamoDbReadThrottleAlarm', {
      metric: dynamoDbThrottleMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alarm if DynamoDB read capacity is throttled',
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'ProductApiUrl', {
      value: api.url,
      description: 'The URL of the Product API Gateway',
    });
    new cdk.CfnOutput(this, 'ProductsTableName', {
      value: productsTable.tableName,
      description: 'The name of the DynamoDB Products table',
    });
    new cdk.CfnOutput(this, 'ProductEventsTopicArn', {
      value: productEventsTopic.topicArn,
      description: 'The ARN of the SNS topic for product events',
    });
    new cdk.CfnOutput(this, 'OrderProcessingQueueUrl', {
      value: orderProcessingQueue.queueUrl,
      description: 'The URL of the SQS queue for order processing',
    });
    new cdk.CfnOutput(this, 'ProductLambdaFunctionName', {
      value: productLambda.functionName,
      description: 'The name of the Product Lambda function',
});
  }
}

