import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { GlobalDatabase } from './global-database';

export interface RegionalApiProps {
  region: string;
  isPrimary: boolean;
  certificateArn?: string;
  globalDatabase: GlobalDatabase;
  domainName?: string;
  environmentSuffix?: string;
}

export class RegionalApi extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiGatewayDomainName?: apigateway.DomainName;
  public latencyMetric!: cloudwatch.Metric;
  public errorMetric!: cloudwatch.Metric;
  public requestCountMetric!: cloudwatch.Metric;
  public readonly sessionTable: dynamodb.ITable;
  public readonly transactionProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props: RegionalApiProps) {
    super(scope, id);

    // Create DynamoDB Table for sessions
    // Note: For production multi-region deployment, use Global Tables with replicationRegions
    // For LocalStack/single-region testing, we create separate tables per region
    this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: `financial-app-sessions-${props.region}`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
      // replicationRegions: For production, enable global tables across regions
    });

    // Create log group for transaction processor with deletion policy
    const transactionLogGroup = new logs.LogGroup(
      this,
      'TransactionProcessorLogGroup',
      {
        logGroupName: `/aws/lambda/financial-transaction-processor-${props.region}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Determine reserved concurrency based on environment
    const envSuffix = props.environmentSuffix || 'dev';
    const reservedConcurrency = envSuffix === 'prod' ? 1000 : undefined; // Only reserve for production

    // Create transaction processing Lambda
    this.transactionProcessor = new lambda.Function(
      this,
      'TransactionProcessor',
      {
        functionName: `financial-transaction-processor-${props.region}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/transaction-processor'),
        architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
        memorySize: 3008,
        timeout: cdk.Duration.seconds(30),
        reservedConcurrentExecutions: reservedConcurrency,
        environment: {
          DB_CONNECTION_STRING: props.globalDatabase.getConnectionString(
            props.region
          ),
          DB_SECRET_ARN: props.globalDatabase.credentials.secretArn,
          SESSION_TABLE_NAME: this.sessionTable.tableName,
          REGION: props.region,
          IS_PRIMARY: props.isPrimary.toString(),
        },
        tracing: lambda.Tracing.ACTIVE,
        logGroup: transactionLogGroup,
      }
    );

    // Grant permissions
    props.globalDatabase.credentials.grantRead(this.transactionProcessor);
    this.sessionTable.grantReadWriteData(this.transactionProcessor);

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'FinancialApi', {
      restApiName: `financial-api-${props.region}`,
      description: `Financial API - ${props.region}`,
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        throttlingRateLimit: 10000,
        throttlingBurstLimit: 5000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Setup custom domain (only for prod environments with certificate)
    if (props.domainName && props.certificateArn) {
      this.apiGatewayDomainName = new apigateway.DomainName(this, 'ApiDomain', {
        domainName: props.domainName,
        certificate: certificatemanager.Certificate.fromCertificateArn(
          this,
          'Certificate',
          props.certificateArn
        ),
        endpointType: apigateway.EndpointType.REGIONAL,
      });

      new apigateway.BasePathMapping(this, 'BasePathMapping', {
        domainName: this.apiGatewayDomainName,
        restApi: this.api,
      });
    }

    // Create API resources
    this.createApiResources();

    // Setup custom metrics
    this.setupMetrics();
  }

  private createApiResources() {
    const transactionResource = this.api.root.addResource('transactions');
    const healthResource = this.api.root.addResource('health');

    // Transaction endpoints
    transactionResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.transactionProcessor),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
        requestValidator: new apigateway.RequestValidator(
          this,
          'TransactionValidator',
          {
            restApi: this.api,
            requestValidatorName: 'transaction-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
          }
        ),
      }
    );

    transactionResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.transactionProcessor)
    );

    // Health check endpoint
    const healthLambda = new lambda.Function(this, 'HealthCheckHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              region: process.env.AWS_REGION
            })
          };
        };
      `),
    });

    healthResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(healthLambda)
    );
  }

  private setupMetrics() {
    this.latencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: this.api.restApiName,
        Stage: 'prod',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    this.errorMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: this.api.restApiName,
        Stage: 'prod',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    this.requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiName: this.api.restApiName,
        Stage: 'prod',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(1),
    });

    // Create alarms
    new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: this.latencyMetric,
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      alarmDescription: 'API latency is too high',
    });

    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: new cloudwatch.MathExpression({
        expression: 'errors / requests * 100',
        usingMetrics: {
          errors: this.errorMetric,
          requests: this.requestCountMetric,
        },
      }),
      threshold: 1, // 1% error rate
      evaluationPeriods: 2,
      alarmDescription: 'API error rate is too high',
    });
  }
}
