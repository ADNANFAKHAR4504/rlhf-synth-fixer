import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiStackProps {
  dataProcessorFunction: lambda.Function;
  environmentSuffix: string;
}

export class ApiStack extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/trading-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // REST API Gateway
    this.restApi = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: `trading-api-${props.environmentSuffix}`,
      description: 'Trading Analytics Platform API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000, // 1000 RPS per API key
        throttlingBurstLimit: 2000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Key for authentication
    const apiKey = this.restApi.addApiKey('ApiKey', {
      apiKeyName: `trading-api-key-${props.environmentSuffix}`,
      description: 'API Key for trading analytics platform',
    });

    // Usage plan with throttling
    const usagePlan = this.restApi.addUsagePlan('UsagePlan', {
      name: `trading-usage-plan-${props.environmentSuffix}`,
      description: 'Usage plan with 1000 RPS throttling per API key',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.restApi.deploymentStage,
    });

    // Lambda integration
    const integration = new apigateway.LambdaIntegration(
      props.dataProcessorFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    // API endpoints
    const data = this.restApi.root.addResource('data');
    data.addMethod('POST', integration, {
      apiKeyRequired: true,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    const process = data.addResource('process');
    process.addMethod('POST', integration, {
      apiKeyRequired: true,
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // Health check endpoint (no auth required)
    const health = this.restApi.root.addResource('health');
    health.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '{"status": "healthy"}',
            },
          },
        ],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [{ statusCode: '200' }],
      }
    );
  }
}
