import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';
    const { lambdaStack } = props;

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

    // Add tags for Resource Group discovery
    cdk.Tags.of(this.api).add('Environment', envSuffix);
    cdk.Tags.of(this.api).add('Application', 'ServerlessApp');

    // Request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Create Lambda integrations
    const userManagementIntegration = new apigateway.LambdaIntegration(
      lambdaStack.userManagementFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    const productCatalogIntegration = new apigateway.LambdaIntegration(
      lambdaStack.productCatalogFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    const orderProcessingIntegration = new apigateway.LambdaIntegration(
      lambdaStack.orderProcessingFunction,
      {
        proxy: true,
        allowTestInvoke: false,
      }
    );

    // API Resources and Methods with Lambda integrations
    const usersResource = this.api.root.addResource('users');
    const userResource = usersResource.addResource('{id}');
    
    // Add methods with Lambda integration and request validation
    const methodOptions = {
      requestValidator,
      authorizationType: apigateway.AuthorizationType.NONE,
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL,
        },
      }],
    };

    usersResource.addMethod('GET', userManagementIntegration, methodOptions);
    usersResource.addMethod('POST', userManagementIntegration, methodOptions);
    userResource.addMethod('GET', userManagementIntegration, methodOptions);
    userResource.addMethod('PUT', userManagementIntegration, methodOptions);
    userResource.addMethod('DELETE', userManagementIntegration, methodOptions);

    const productsResource = this.api.root.addResource('products');
    const productResource = productsResource.addResource('{id}');
    
    productsResource.addMethod('GET', productCatalogIntegration, methodOptions);
    productsResource.addMethod('POST', productCatalogIntegration, methodOptions);
    productResource.addMethod('GET', productCatalogIntegration, methodOptions);
    productResource.addMethod('PUT', productCatalogIntegration, methodOptions);
    productResource.addMethod('DELETE', productCatalogIntegration, methodOptions);

    const ordersResource = this.api.root.addResource('orders');
    const orderResource = ordersResource.addResource('{id}');
    
    ordersResource.addMethod('GET', orderProcessingIntegration, methodOptions);
    ordersResource.addMethod('POST', orderProcessingIntegration, methodOptions);
    orderResource.addMethod('GET', orderProcessingIntegration, methodOptions);
    orderResource.addMethod('PUT', orderProcessingIntegration, methodOptions);
    orderResource.addMethod('DELETE', orderProcessingIntegration, methodOptions);

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