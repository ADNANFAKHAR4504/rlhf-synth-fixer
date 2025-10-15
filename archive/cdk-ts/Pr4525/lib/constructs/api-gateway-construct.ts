import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { KmsConstruct } from './kms-construct';

export interface ApiGatewayConstructProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
  corsOrigin: string;
  removalPolicy: cdk.RemovalPolicy;
  kmsKey: KmsConstruct;
}

export class ApiGatewayConstruct extends Construct {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create CloudWatch Log Group for API Gateway with KMS encryption
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/apigateway/serverless-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: props.removalPolicy,
      encryptionKey: props.kmsKey.key,
    });

    // Create REST API
    this.restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'Serverless REST API',
      deployOptions: {
        stageName: props.environmentSuffix,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
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
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: [props.corsOrigin],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      cloudWatchRole: true,
    });

    // Create request model for validation
    const requestModel = new apigateway.Model(this, 'RequestModel', {
      restApi: this.restApi,
      contentType: 'application/json',
      modelName: `UserRequestModel${props.environmentSuffix}`,
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          UserId: { type: apigateway.JsonSchemaType.STRING },
          name: { type: apigateway.JsonSchemaType.STRING },
          email: {
            type: apigateway.JsonSchemaType.STRING,
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          },
        },
        required: ['UserId'],
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.lambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '',
            },
          },
          {
            statusCode: '400',
            selectionPattern: '.*[Bad Request].*',
            responseTemplates: {
              'application/json': '{"error": "Bad Request"}',
            },
          },
          {
            statusCode: '500',
            selectionPattern: '.*[Error].*',
            responseTemplates: {
              'application/json': '{"error": "Internal Server Error"}',
            },
          },
        ],
      }
    );

    // Create users resource
    const users = this.restApi.root.addResource('users');

    // Create separate request validators for GET and POST methods
    const getValidator = new apigateway.RequestValidator(this, 'GetValidator', {
      restApi: this.restApi,
      requestValidatorName: `ValidatorGet${props.environmentSuffix}`,
      validateRequestBody: false, // GET requests don't have request body
      validateRequestParameters: true,
    });

    const postValidator = new apigateway.RequestValidator(
      this,
      'PostValidator',
      {
        restApi: this.restApi,
        requestValidatorName: `ValidatorPost${props.environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Add GET method (no request body validation for GET requests)
    users.addMethod('GET', lambdaIntegration, {
      requestValidator: getValidator,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // Add POST method with request validation
    users.addMethod('POST', lambdaIntegration, {
      requestValidator: postValidator,
      requestModels: {
        'application/json': requestModel,
      },
      methodResponses: [
        {
          statusCode: '201',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
        {
          statusCode: '400',
        },
        {
          statusCode: '500',
        },
      ],
    });

    // Add tags
    cdk.Tags.of(this.restApi).add('Project', 'ServerlessInfra');
  }
}
