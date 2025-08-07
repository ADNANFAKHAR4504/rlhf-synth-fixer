import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ProjectXApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaFunction: lambda.Function;
}

export class ProjectXApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: ProjectXApiGatewayStackProps
  ) {
    super(scope, id, props);

    // CloudWatch Log Group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ProjectXApiLogGroup', {
      logGroupName: `projectX-api-gateway-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // REST API Gateway with dynamic routing support
    this.api = new apigateway.RestApi(this, 'ProjectXApi', {
      restApiName: `projectX-api-${props.environmentSuffix}`,
      description: 'ProjectX Serverless Web Service API',
      deployOptions: {
        stageName: props.environmentSuffix,
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
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
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
    });

    // Lambda integration with response streaming support
    const lambdaIntegration = new apigateway.LambdaIntegration(
      props.lambdaFunction,
      {
        requestTemplates: {
          'application/json': '{ "statusCode": "200" }',
        },
        proxy: true,
      }
    );

    // Root resource methods
    this.api.root.addMethod('GET', lambdaIntegration);
    this.api.root.addMethod('POST', lambdaIntegration);

    // Dynamic routing with multiple paths
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration);

    const apiResource = this.api.root.addResource('api');
    const v1Resource = apiResource.addResource('v1');
    const dataResource = v1Resource.addResource('data');
    dataResource.addMethod('GET', lambdaIntegration);
    dataResource.addMethod('POST', lambdaIntegration);

    // Proxy resource for catch-all routing
    const proxyResource = this.api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', lambdaIntegration);

    // Note: Outputs are created at the main stack level
  }
}
