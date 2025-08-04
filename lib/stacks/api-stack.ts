import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ApiStackProps {
  environmentSuffix: string;
  authorizerFunction: lambda.Function;
  apiHandlerFunction: lambda.Function;
}

export class ApiStack extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly apiKey: apigateway.IApiKey;
  public readonly usagePlan: apigateway.UsagePlan;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // API Gateway with Lambda Authorizer
    this.api = new apigateway.RestApi(this, 'ProdDocumentApi', {
      description: 'Serverless document processing API with Lambda authorizer',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
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

    // Lambda Authorizer for API Gateway
    const authorizer = new apigateway.RequestAuthorizer(
      this,
      'ProdApiAuthorizer',
      {
        handler: props.authorizerFunction,
        identitySources: [apigateway.IdentitySource.header('X-Api-Key')],
        resultsCacheTtl: cdk.Duration.seconds(0),
      }
    );

    // API Gateway Integration
    const apiIntegration = new apigateway.LambdaIntegration(
      props.apiHandlerFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    // API Routes
    const documentsResource = this.api.root.addResource('documents');
    documentsResource.addMethod('POST', apiIntegration, {
      authorizer,
      apiKeyRequired: false,
    });
    documentsResource.addMethod('GET', apiIntegration, {
      authorizer,
      apiKeyRequired: false,
    });

    const documentResource = documentsResource.addResource('{documentId}');
    documentResource.addMethod('GET', apiIntegration, {
      authorizer,
      apiKeyRequired: false,
    });

    // API Key and Usage Plan
    this.apiKey = this.api.addApiKey('ProdApiKey', {
      description: 'API key for document processing system',
    });

    this.usagePlan = this.api.addUsagePlan('ProdUsagePlan', {
      description: 'Usage plan for document processing API',
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    this.usagePlan.addApiKey(this.apiKey);
    this.usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });
  }
}
