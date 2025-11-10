import { Construct } from 'constructs';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';

export interface ApiGatewayStackProps {
  environmentSuffix: string;
  transactionProcessorArn: string;
  transactionProcessorInvokeArn: string;
  statusCheckerArn: string;
  statusCheckerInvokeArn: string;
}

export class ApiGatewayStack extends Construct {
  public readonly api: ApiGatewayRestApi;
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      transactionProcessorArn,
      transactionProcessorInvokeArn,
      statusCheckerArn,
      statusCheckerInvokeArn,
    } = props;

    // Create REST API
    this.api = new ApiGatewayRestApi(this, 'rest_api', {
      name: `payment-api-${environmentSuffix}`,
      description: 'Payment Processing REST API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `payment-api-${environmentSuffix}`,
      },
    });

    // Create /transactions resource
    const transactionsResource = new ApiGatewayResource(
      this,
      'transactions_resource',
      {
        restApiId: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'transactions',
      }
    );

    // POST /transactions method
    const transactionsMethod = new ApiGatewayMethod(
      this,
      'transactions_method',
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      }
    );

    // Integration for POST /transactions
    new ApiGatewayIntegration(this, 'transactions_integration', {
      restApiId: this.api.id,
      resourceId: transactionsResource.id,
      httpMethod: transactionsMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: transactionProcessorInvokeArn,
    });

    // Lambda permission for transactions
    new LambdaPermission(this, 'transactions_lambda_permission', {
      statementId: `AllowAPIGatewayInvoke-${environmentSuffix}`,
      action: 'lambda:InvokeFunction',
      functionName: transactionProcessorArn,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.api.executionArn}/*/*`,
    });

    // Create /status resource
    const statusResource = new ApiGatewayResource(this, 'status_resource', {
      restApiId: this.api.id,
      parentId: this.api.rootResourceId,
      pathPart: 'status',
    });

    // GET /status method
    const statusMethod = new ApiGatewayMethod(this, 'status_method', {
      restApiId: this.api.id,
      resourceId: statusResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
      requestParameters: {
        'method.request.querystring.transaction_id': true,
      },
    });

    // Integration for GET /status
    new ApiGatewayIntegration(this, 'status_integration', {
      restApiId: this.api.id,
      resourceId: statusResource.id,
      httpMethod: statusMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: statusCheckerInvokeArn,
    });

    // Lambda permission for status
    new LambdaPermission(this, 'status_lambda_permission', {
      statementId: `AllowAPIGatewayInvokeStatus-${environmentSuffix}`,
      action: 'lambda:InvokeFunction',
      functionName: statusCheckerArn,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.api.executionArn}/*/*`,
    });

    // Enable CORS for transactions
    const transactionsCorsMethod = new ApiGatewayMethod(
      this,
      'transactions_cors',
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'OPTIONS',
        authorization: 'NONE',
      }
    );

    new ApiGatewayIntegration(this, 'transactions_cors_integration', {
      restApiId: this.api.id,
      resourceId: transactionsResource.id,
      httpMethod: transactionsCorsMethod.httpMethod,
      type: 'MOCK',
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    });

    // Enable CORS for status
    const statusCorsMethod = new ApiGatewayMethod(this, 'status_cors', {
      restApiId: this.api.id,
      resourceId: statusResource.id,
      httpMethod: 'OPTIONS',
      authorization: 'NONE',
    });

    new ApiGatewayIntegration(this, 'status_cors_integration', {
      restApiId: this.api.id,
      resourceId: statusResource.id,
      httpMethod: statusCorsMethod.httpMethod,
      type: 'MOCK',
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    });

    // Create deployment
    const deployment = new ApiGatewayDeployment(this, 'deployment', {
      restApiId: this.api.id,
      dependsOn: [transactionsMethod, statusMethod],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Create prod stage
    const stage = new ApiGatewayStage(this, 'prod_stage', {
      restApiId: this.api.id,
      deploymentId: deployment.id,
      stageName: 'prod',
      variables: {
        environment: environmentSuffix,
      },
      xrayTracingEnabled: true,
      tags: {
        Name: `payment-api-${environmentSuffix}`,
      },
    });

    // Configure stage settings
    new ApiGatewayMethodSettings(this, 'method_settings', {
      restApiId: this.api.id,
      stageName: stage.stageName,
      methodPath: '*/*',
      settings: {
        metricsEnabled: true,
        loggingLevel: 'INFO',
        dataTraceEnabled: true,
        throttlingBurstLimit: 10000,
        throttlingRateLimit: 10000,
        cachingEnabled: false,
      },
    });

    this.apiUrl = `https://${this.api.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}`;
  }
}
