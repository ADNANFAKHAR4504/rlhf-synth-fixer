import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get region from stack or use default
    const region = this.region;

    // Determine removal policy based on environment
    const removalPolicy =
      environmentSuffix === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY;

    // ==========================================
    // S3 Bucket - Secure, Lambda-only access
    // ==========================================
    const dataBucket = new s3.Bucket(this, `DataBucket-${environmentSuffix}`, {
      bucketName:
        `tap-data-bucket-${environmentSuffix}-${region}-${this.account}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      removalPolicy,
      autoDeleteObjects: environmentSuffix !== 'prod', // Auto-delete objects in non-prod
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // ==========================================
    // DynamoDB Table - On-demand billing
    // ==========================================
    const dataTable = new dynamodb.Table(
      this,
      `DataTable-${environmentSuffix}`,
      {
        tableName: `tap-data-table-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: environmentSuffix === 'prod',
        },
        removalPolicy,
        contributorInsightsEnabled: true,
      }
    );

    // ==========================================
    // SNS Topic for Error Alerts
    // ==========================================
    const errorTopic = new sns.Topic(this, `ErrorTopic-${environmentSuffix}`, {
      topicName: `tap-error-alerts-${environmentSuffix}`,
      displayName: `TAP Error Alerts (${environmentSuffix})`,
    });

    // Optional: Add an email subscription (you can change this email)
    // Uncomment and update the email address if needed
    // errorTopic.addSubscription(
    //   new snsSubscriptions.EmailSubscription('your-email@example.com')
    // );

    // ==========================================
    // CloudWatch Log Groups
    // ==========================================
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/tap-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy,
      }
    );

    const apiLogGroup = new logs.LogGroup(
      this,
      `ApiLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/apigateway/tap-api-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy,
      }
    );

    // ==========================================
    // IAM Role for Lambda with AWS Managed Policies
    // ==========================================
    const lambdaRole = new iam.Role(this, `LambdaRole-${environmentSuffix}`, {
      roleName: `tap-lambda-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for TAP Lambda function',
      managedPolicies: [
        // AWS Managed Policy for basic Lambda execution (CloudWatch Logs)
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant S3 read permissions to Lambda role
    dataBucket.grantRead(lambdaRole);

    // Grant DynamoDB read/write permissions to Lambda role
    dataTable.grantReadWriteData(lambdaRole);

    // Grant SNS publish permissions to Lambda role
    errorTopic.grantPublish(lambdaRole);

    // ==========================================
    // Lambda Function
    // ==========================================
    const apiFunction = new lambda.Function(
      this,
      `ApiFunction-${environmentSuffix}`,
      {
        functionName: `tap-function-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
        environment: {
          S3_BUCKET_NAME: dataBucket.bucketName,
          DYNAMODB_TABLE_NAME: dataTable.tableName,
          ERROR_TOPIC_ARN: errorTopic.topicArn,
          ENVIRONMENT: environmentSuffix,
        },
        role: lambdaRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        logGroup: lambdaLogGroup,
        tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
        retryAttempts: 2,
      }
    );

    // ==========================================
    // API Gateway HTTP API with CORS
    // ==========================================
    const httpApi = new apigatewayv2.HttpApi(
      this,
      `HttpApi-${environmentSuffix}`,
      {
        apiName: `tap-api-${environmentSuffix}`,
        description: `TAP HTTP API (${environmentSuffix})`,
        corsPreflight: {
          allowOrigins: ['https://example.com'],
          allowMethods: [
            apigatewayv2.CorsHttpMethod.GET,
            apigatewayv2.CorsHttpMethod.POST,
            apigatewayv2.CorsHttpMethod.PUT,
            apigatewayv2.CorsHttpMethod.DELETE,
            apigatewayv2.CorsHttpMethod.OPTIONS,
          ],
          allowHeaders: ['Content-Type', 'Authorization'],
          maxAge: cdk.Duration.hours(24),
        },
      }
    );

    // Lambda integration for API Gateway
    const lambdaIntegration =
      new apigatewayv2Integrations.HttpLambdaIntegration(
        `LambdaIntegration-${environmentSuffix}`,
        apiFunction
      );

    // Add routes to the API
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Add a default route
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // ==========================================
    // API Gateway Logging
    // ==========================================
    const apiLogRole = new iam.Role(this, `ApiLogRole-${environmentSuffix}`, {
      roleName: `tap-api-log-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // Configure API Gateway stage with logging
    const defaultStage = httpApi.defaultStage?.node
      .defaultChild as apigatewayv2.CfnStage;
    if (defaultStage) {
      defaultStage.accessLogSettings = {
        destinationArn: apiLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
          error: '$context.error.message',
          integrationError: '$context.integrationErrorMessage',
        }),
      };
    }

    // Grant API Gateway permission to write to CloudWatch Logs
    apiLogGroup.grantWrite(apiLogRole);

    // ==========================================
    // Stack Outputs
    // ==========================================
    new cdk.CfnOutput(this, `ApiUrl-${environmentSuffix}`, {
      value: httpApi.apiEndpoint,
      description: `HTTP API endpoint URL (${environmentSuffix})`,
      exportName: `tap-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `BucketName-${environmentSuffix}`, {
      value: dataBucket.bucketName,
      description: `S3 bucket name (${environmentSuffix})`,
      exportName: `tap-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `TableName-${environmentSuffix}`, {
      value: dataTable.tableName,
      description: `DynamoDB table name (${environmentSuffix})`,
      exportName: `tap-table-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ErrorTopicArn-${environmentSuffix}`, {
      value: errorTopic.topicArn,
      description: `SNS error topic ARN (${environmentSuffix})`,
      exportName: `tap-error-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `LambdaFunctionName-${environmentSuffix}`, {
      value: apiFunction.functionName,
      description: `Lambda function name (${environmentSuffix})`,
      exportName: `tap-lambda-name-${environmentSuffix}`,
    });

    // ==========================================
    // Tags for all resources
    // ==========================================
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'iac-rlhf-amazon');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', region);
  }
}
