import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface RestAPIStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  processBugLambda: lambda.Function;
}

export class RestAPIStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: RestAPIStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // API Gateway REST API
    this.api = new apigateway.RestApi(this, 'BugTrackingAPI', {
      restApiName: `bug-tracking-api-${environmentSuffix}`,
      description: 'API for bug tracking system',
      deployOptions: {
        stageName: environmentSuffix,
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Gateway integration with Lambda
    const bugIntegration = new apigateway.LambdaIntegration(
      props.processBugLambda,
      {
        proxy: true,
      }
    );

    const bugsResource = this.api.root.addResource('bugs');
    bugsResource.addMethod('POST', bugIntegration);
    bugsResource.addMethod('GET', bugIntegration);

    const bugResource = bugsResource.addResource('{bugId}');
    bugResource.addMethod('GET', bugIntegration);
    bugResource.addMethod('PUT', bugIntegration);
  }
}
