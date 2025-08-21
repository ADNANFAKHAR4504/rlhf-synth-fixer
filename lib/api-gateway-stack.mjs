import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';

    // Create API Gateway
    this.api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: 'prod-MyAPI',
      description: 'Production Serverless API',
      deployOptions: {
        stageName: envSuffix,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        tracingEnabled: true,
        dataTraceEnabled: false,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      cloudWatchRole: false, // Disable to avoid IAM role creation issues
    });

    // Request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Create mock integrations for now (avoiding Lambda permissions)
    const mockIntegration = new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({
            message: 'Mock response from API Gateway',
            timestamp: '$context.requestTime',
            requestId: '$context.requestId',
          }),
        },
      }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    });

    // API Resources and Methods with mock responses
    const usersResource = this.api.root.addResource('users');
    const userResource = usersResource.addResource('{id}');
    
    // Add methods with mock integration and request validation
    const methodOptions = {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.NONE, // Changed from IAM to avoid permissions
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }],
    };

    usersResource.addMethod('GET', mockIntegration, methodOptions);
    usersResource.addMethod('POST', mockIntegration, methodOptions);
    userResource.addMethod('GET', mockIntegration, methodOptions);
    userResource.addMethod('PUT', mockIntegration, methodOptions);
    userResource.addMethod('DELETE', mockIntegration, methodOptions);

    const productsResource = this.api.root.addResource('products');
    const productResource = productsResource.addResource('{id}');
    
    productsResource.addMethod('GET', mockIntegration, methodOptions);
    productsResource.addMethod('POST', mockIntegration, methodOptions);
    productResource.addMethod('GET', mockIntegration, methodOptions);
    productResource.addMethod('PUT', mockIntegration, methodOptions);
    productResource.addMethod('DELETE', mockIntegration, methodOptions);

    // Store API Gateway URL in SSM Parameter
    new ssm.StringParameter(this, 'ApiGatewayUrlParam', {
      parameterName: `/api-gateway/url-${envSuffix}`,
      stringValue: this.api.url,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
    });
  }
}