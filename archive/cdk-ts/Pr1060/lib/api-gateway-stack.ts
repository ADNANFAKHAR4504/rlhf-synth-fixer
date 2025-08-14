import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface ApiGatewayStackProps extends cdk.StackProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix: string;
  apiFunction: lambda.Function;
  processingFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const {
      environmentConfig,
      environmentSuffix,
      apiFunction,
      processingFunction,
    } = props;

    // Create CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/tap-${environmentSuffix}-api`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'MultiEnvApi', {
      restApiName: `tap-${environmentSuffix}-api`,
      description: `Multi-environment API for ${environmentSuffix}`,
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: environmentConfig.apiGatewayStageName,
        loggingLevel: environmentConfig.enableLogging
          ? apigateway.MethodLoggingLevel.INFO
          : apigateway.MethodLoggingLevel.ERROR,
        dataTraceEnabled: environmentConfig.enableTracing,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      policy: new cdk.aws_iam.PolicyDocument({
        statements: [
          new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Lambda integrations
    const apiIntegration = new apigateway.LambdaIntegration(apiFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const processingIntegration = new apigateway.LambdaIntegration(
      processingFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // API resources and methods
    const apiResource = this.api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    // Health check endpoint
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', apiIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.X-Environment': true,
          },
        },
      ],
    });

    // Processing endpoint
    const processResource = v1Resource.addResource('process');
    processResource.addMethod('POST', processingIntegration, {
      requestValidatorOptions: {
        requestValidatorName: 'Validate body',
        validateRequestBody: true,
        validateRequestParameters: false,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });

    // Environment-specific routing using custom domain (simulation)
    if (environmentConfig.environmentName !== 'dev') {
      // Add CORS for non-dev environments
      this.api.root.addCorsPreflight({
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: `API Gateway URL for ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: `API Gateway ID for ${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environmentName);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'APIGateway');
  }
}
