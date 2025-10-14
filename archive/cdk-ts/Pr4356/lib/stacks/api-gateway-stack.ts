import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix: string;
  dataProcessorFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(
      this,
      `ApiLogGroup-${props.environmentSuffix}`,
      {
        logGroupName: `/aws/apigateway/serverless-api-${props.environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // REST API
    this.api = new apigateway.RestApi(this, `Api-${props.environmentSuffix}`, {
      restApiName: `serverless-api-${props.environmentSuffix}`,
      description: 'Serverless Data Processing API',
      deployOptions: {
        stageName: props.environmentSuffix,
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
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
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.days(1),
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    // Request Validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      `RequestValidator-${props.environmentSuffix}`,
      {
        restApi: this.api,
        requestValidatorName: 'validate-body',
        validateRequestBody: true,
        validateRequestParameters: false,
      }
    );

    // Request Model
    const dataModel = new apigateway.Model(
      this,
      `DataModel-${props.environmentSuffix}`,
      {
        restApi: this.api,
        contentType: 'application/json',
        modelName: 'DataModel',
        schema: {
          type: apigateway.JsonSchemaType.OBJECT,
          required: ['data'],
          properties: {
            data: {
              type: apigateway.JsonSchemaType.OBJECT,
            },
            metadata: {
              type: apigateway.JsonSchemaType.OBJECT,
            },
          },
        },
      }
    );

    // Lambda Integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.dataProcessorFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            selectionPattern: '.*Error.*',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }
    );

    // API Resources and Methods
    const dataResource = this.api.root.addResource('data');

    // POST /data
    dataResource.addMethod('POST', lambdaIntegration, {
      requestValidator,
      requestModels: {
        'application/json': dataModel,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // GET /data (for health check)
    dataResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    });

    // API Key and Usage Plan
    const apiKey = new apigateway.ApiKey(
      this,
      `ApiKey-${props.environmentSuffix}`,
      {
        apiKeyName: `serverless-api-key-${props.environmentSuffix}`,
        description: 'API Key for serverless application',
      }
    );

    const usagePlan = new apigateway.UsagePlan(
      this,
      `UsagePlan-${props.environmentSuffix}`,
      {
        name: `serverless-usage-plan-${props.environmentSuffix}`,
        throttle: {
          rateLimit: 100,
          burstLimit: 200,
        },
        quota: {
          limit: 10000,
          period: apigateway.Period.DAY,
        },
        apiStages: [
          {
            api: this.api,
            stage: this.api.deploymentStage,
          },
        ],
      }
    );

    usagePlan.addApiKey(apiKey);

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `ApiEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID',
      exportName: `ApiKeyId-${props.environmentSuffix}`,
    });
  }
}
