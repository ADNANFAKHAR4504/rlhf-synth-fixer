import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export interface ApiGatewayStackProps extends BaseStackProps {
  orderProcessingFunction: lambda.IFunction;
}

export class ApiGatewayStack extends BaseStack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create CloudWatch Log Group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${this.getResourceName('trading-api')}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API with environment-specific configuration
    this.api = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: this.getResourceName('trading-api'),
      description: `Trading Platform API for ${this.environmentSuffix} environment`,
      deployOptions: {
        stageName: this.environmentSuffix,
        throttlingRateLimit:
          this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        throttlingBurstLimit:
          this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create Lambda integration
    const integration = new apigateway.LambdaIntegration(
      props.orderProcessingFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        proxy: true,
      }
    );

    // Create /orders resource
    const orders = this.api.root.addResource('orders');

    // POST /orders endpoint
    orders.addMethod('POST', integration, {
      apiKeyRequired: false,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
        {
          statusCode: '500',
          responseModels: {
            'application/json': apigateway.Model.ERROR_MODEL,
          },
        },
      ],
    });

    // GET /orders endpoint
    orders.addMethod('GET', integration, {
      apiKeyRequired: false,
    });

    // Create usage plan for rate limiting
    const plan = this.api.addUsagePlan('UsagePlan', {
      name: this.getResourceName('usage-plan'),
      throttle: {
        rateLimit: this.environmentConfig.apiGatewayConfig.throttleRateLimit,
        burstLimit: this.environmentConfig.apiGatewayConfig.throttleBurstLimit,
      },
      quota: {
        limit:
          this.environmentConfig.apiGatewayConfig.throttleRateLimit * 86400, // Daily quota
        period: apigateway.Period.DAY,
      },
    });

    plan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Export API endpoint
    this.exportToParameterStore('api-endpoint', this.api.url);
    this.exportToParameterStore('api-id', this.api.restApiId);
  }
}
