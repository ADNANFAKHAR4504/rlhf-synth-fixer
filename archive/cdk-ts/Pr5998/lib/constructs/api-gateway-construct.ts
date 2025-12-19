import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ApiGatewayConstructProps {
  environmentSuffix: string;
  paymentValidationFunction: lambda.Function;
  customDomain: string;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    const { environmentSuffix, paymentValidationFunction } = props;
    // Note: customDomain is in props for future use but not implemented in this synthetic task

    // Create CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/payment-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API
    this.api = new apigateway.RestApi(this, 'PaymentApi', {
      restApiName: `payment-api-${environmentSuffix}`,
      description: `Payment processing API - ${environmentSuffix}`,
      deployOptions: {
        stageName: environmentSuffix,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
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
      },
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create Lambda integration
    const paymentIntegration = new apigateway.LambdaIntegration(
      paymentValidationFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Create /payments resource
    const payments = this.api.root.addResource('payments');

    // Add request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: this.api,
        requestValidatorName: `payment-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // POST /payments - Create/validate payment
    payments.addMethod('POST', paymentIntegration, {
      requestValidator,
      requestModels: {
        'application/json': this.createPaymentRequestModel(),
      },
    });

    // GET /payments/{paymentId} - Get payment status
    const paymentById = payments.addResource('{paymentId}');
    paymentById.addMethod('GET', paymentIntegration);

    // Add usage plan
    const plan = this.api.addUsagePlan('UsagePlan', {
      name: `payment-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
    });

    plan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Tags
    cdk.Tags.of(this.api).add('Name', `payment-api-${environmentSuffix}`);
    cdk.Tags.of(this.api).add('Environment', environmentSuffix);
  }

  private createPaymentRequestModel(): apigateway.Model {
    return new apigateway.Model(this, 'PaymentRequestModel', {
      restApi: this.api,
      contentType: 'application/json',
      modelName: 'PaymentRequest',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['amount', 'currency', 'customerId'],
        properties: {
          amount: {
            type: apigateway.JsonSchemaType.NUMBER,
            minimum: 0.01,
          },
          currency: {
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[A-Z]{3}$',
          },
          customerId: {
            type: apigateway.JsonSchemaType.STRING,
            minLength: 1,
          },
          description: {
            type: apigateway.JsonSchemaType.STRING,
          },
        },
      },
    });
  }
}
