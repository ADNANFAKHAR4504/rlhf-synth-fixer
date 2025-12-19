import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiGatewayStackProps extends cdk.StackProps {
  environmentSuffix: string;
  createUserFunction: lambda.Function;
  getUserFunction: lambda.Function;
  deleteUserFunction: lambda.Function;
}

export class ApiGatewayStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    // Create REST API
    this.api = new apigateway.RestApi(this, 'UserApi', {
      restApiName: `User-API-${props.environmentSuffix}`,
      description: `User management API for ${props.environmentSuffix} environment`,
      deployOptions: {
        stageName: props.environmentSuffix,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        // Disable metrics and tracing for LocalStack
        metricsEnabled: !isLocalStack,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: !isLocalStack,
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

    // Create users resource
    const usersResource = this.api.root.addResource('users');

    // POST /users - Create user
    usersResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.createUserFunction, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '201',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: '201',
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
      }
    );

    // Create {userId} resource
    const userResource = usersResource.addResource('{userId}');

    // GET /users/{userId} - Get user
    userResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.getUserFunction, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '404',
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
      }
    );

    // DELETE /users/{userId} - Delete user
    userResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(props.deleteUserFunction, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '404',
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
      }
    );

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      exportName: `ApiGatewayUrl-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.api.restApiId,
      exportName: `ApiGatewayId-${props.environmentSuffix}`,
    });
  }
}
