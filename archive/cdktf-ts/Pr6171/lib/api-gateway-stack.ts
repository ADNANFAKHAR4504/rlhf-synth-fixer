import { Construct } from 'constructs';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { ApiGatewayMethodSettings } from '@cdktf/provider-aws/lib/api-gateway-method-settings';
import { ApiGatewayMethodResponse } from '@cdktf/provider-aws/lib/api-gateway-method-response';
import { ApiGatewayIntegrationResponse } from '@cdktf/provider-aws/lib/api-gateway-integration-response';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';

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

    // Get current AWS region dynamically
    const currentRegion = new DataAwsRegion(this, 'current_region', {});

    // Create REST API
    this.api = new ApiGatewayRestApi(this, `rest-api-${environmentSuffix}`, {
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
      `transactions-resource-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'transactions',
      }
    );

    // POST /transactions method
    const transactionsMethod = new ApiGatewayMethod(
      this,
      `transactions-method-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      }
    );

    // Integration for POST /transactions
    const transactionsIntegration = new ApiGatewayIntegration(
      this,
      `transactions-integration-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: transactionsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: transactionProcessorInvokeArn,
      }
    );

    // Lambda permission for transactions
    new LambdaPermission(
      this,
      `transactions-lambda-permission-${environmentSuffix}`,
      {
        statementId: `AllowAPIGatewayInvoke-${environmentSuffix}`,
        action: 'lambda:InvokeFunction',
        functionName: transactionProcessorArn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${this.api.executionArn}/*/*`,
      }
    );

    // Create /status resource
    const statusResource = new ApiGatewayResource(
      this,
      `status-resource-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'status',
      }
    );

    // GET /status method
    const statusMethod = new ApiGatewayMethod(
      this,
      `status-method-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: statusResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
        requestParameters: {
          'method.request.querystring.transaction_id': true,
        },
      }
    );

    // Integration for GET /status
    const statusIntegration = new ApiGatewayIntegration(
      this,
      `status-integration-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: statusResource.id,
        httpMethod: statusMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: statusCheckerInvokeArn,
      }
    );

    // Lambda permission for status
    new LambdaPermission(
      this,
      `status-lambda-permission-${environmentSuffix}`,
      {
        statementId: `AllowAPIGatewayInvokeStatus-${environmentSuffix}`,
        action: 'lambda:InvokeFunction',
        functionName: statusCheckerArn,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${this.api.executionArn}/*/*`,
      }
    );

    // Enable CORS for transactions
    const transactionsCorsMethod = new ApiGatewayMethod(
      this,
      `transactions-cors-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'OPTIONS',
        authorization: 'NONE',
      }
    );

    const transactionsCorsIntegration = new ApiGatewayIntegration(
      this,
      `transactions-cors-integration-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: transactionsCorsMethod.httpMethod,
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }
    );

    // Method response for transactions CORS
    new ApiGatewayMethodResponse(
      this,
      `transactions-cors-method-response-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: transactionsCorsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }
    );

    // Integration response for transactions CORS
    new ApiGatewayIntegrationResponse(
      this,
      `transactions-cors-integration-response-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: transactionsResource.id,
        httpMethod: transactionsCorsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers':
            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'", // eslint-disable-line max-len
          'method.response.header.Access-Control-Allow-Methods':
            "'OPTIONS,POST'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
        dependsOn: [transactionsCorsIntegration],
      }
    );

    // Enable CORS for status
    const statusCorsMethod = new ApiGatewayMethod(
      this,
      `status-cors-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: statusResource.id,
        httpMethod: 'OPTIONS',
        authorization: 'NONE',
      }
    );

    const statusCorsIntegration = new ApiGatewayIntegration(
      this,
      `status-cors-integration-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: statusResource.id,
        httpMethod: statusCorsMethod.httpMethod,
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }
    );

    // Method response for status CORS
    new ApiGatewayMethodResponse(
      this,
      `status-cors-method-response-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: statusResource.id,
        httpMethod: statusCorsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }
    );

    // Integration response for status CORS
    new ApiGatewayIntegrationResponse(
      this,
      `status-cors-integration-response-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        resourceId: statusResource.id,
        httpMethod: statusCorsMethod.httpMethod,
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers':
            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'", // eslint-disable-line max-len
          'method.response.header.Access-Control-Allow-Methods':
            "'OPTIONS,GET'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
        dependsOn: [statusCorsIntegration],
      }
    );

    // Create deployment
    const deployment = new ApiGatewayDeployment(
      this,
      `deployment-${environmentSuffix}`,
      {
        restApiId: this.api.id,
        dependsOn: [
          transactionsMethod,
          transactionsIntegration,
          statusMethod,
          statusIntegration,
          transactionsCorsMethod,
          transactionsCorsIntegration,
          statusCorsMethod,
          statusCorsIntegration,
        ],
        lifecycle: {
          createBeforeDestroy: true,
        },
      }
    );

    // Create prod stage
    const stage = new ApiGatewayStage(this, `prod-stage-${environmentSuffix}`, {
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
    new ApiGatewayMethodSettings(this, `method-settings-${environmentSuffix}`, {
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

    this.apiUrl = `https://${this.api.id}.execute-api.${currentRegion.name}.amazonaws.com/${stage.stageName}`;
  }
}
