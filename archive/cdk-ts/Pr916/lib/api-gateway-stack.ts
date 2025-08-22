import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  lambdaFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly restApi: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create API Gateway REST API
    this.restApi = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `serverless-api-${environmentSuffix}`,
      description: `Serverless API for ${environmentSuffix} environment`,
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
        maxAge: cdk.Duration.hours(1),
      },
      deployOptions: {
        stageName: environmentSuffix,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      cloudWatchRole: true,
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.lambdaFunction,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    // Add resource and methods
    const apiResource = this.restApi.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');

    // Add health check endpoint
    const healthResource = v1Resource.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    // Add main API endpoints
    const dataResource = v1Resource.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration);
    dataResource.addMethod('POST', lambdaIntegration);
    dataResource.addMethod('PUT', lambdaIntegration);
    dataResource.addMethod('DELETE', lambdaIntegration);

    // Add tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Service', 'ServerlessAPI');
    cdk.Tags.of(this).add('Component', 'ApiGateway');

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.restApi.url,
      description: 'API Gateway URL',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayRestApiId', {
      value: this.restApi.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `${this.stackName}-RestApiId`,
    });
  }
}
