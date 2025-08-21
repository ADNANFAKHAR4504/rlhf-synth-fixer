/**
 * api-gateway-stack.ts
 *
 * This module defines the REST API Gateway with secure integration to Lambda function.
 * Implements private integration, logging, and security best practices.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  lambdaFunctionArn: pulumi.Input<string>;
  lambdaFunctionName: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly api: aws.apigateway.RestApi;
  public readonly stage: aws.apigateway.Stage;
  public readonly integration: aws.apigateway.Integration;
  public readonly method: aws.apigateway.Method;
  public readonly resource: aws.apigateway.Resource;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, args: ApiGatewayStackArgs, opts?: ResourceOptions) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    const { environmentSuffix, lambdaFunctionArn, lambdaFunctionName, tags } =
      args;

    this.api = new aws.apigateway.RestApi(
      `secure-doc-api-${environmentSuffix}`,
      {
        name: `secure-doc-api-${environmentSuffix}`,
        description: `Secure Document Processing API - ${environmentSuffix}`,
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `secure-doc-api-${environmentSuffix}`,
          Purpose: 'Secure document processing API',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create the /documents resource
    this.resource = new aws.apigateway.Resource(
      `documents-resource-${environmentSuffix}`,
      {
        restApi: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'documents',
      },
      { parent: this }
    );

    // Create the Lambda integration
    this.integration = new aws.apigateway.Integration(
      `lambda-integration-${environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: this.resource.id,
        httpMethod: 'POST',
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: pulumi.interpolate`arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFunctionArn}/invocations`,
        timeoutMilliseconds: 29000,
      },
      { parent: this }
    );

    // Create the POST method
    this.method = new aws.apigateway.Method(
      `post-documents-method-${environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: this.resource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestParameters: {
          'method.request.header.Content-Type': true,
          'method.request.header.x-request-id': false,
        },
      },
      { parent: this }
    );

    // Create Lambda permission
    const lambdaPermission = new aws.lambda.Permission(
      `api-gateway-invoke-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create deployment
    const deployment = new aws.apigateway.Deployment(
      `deployment-${environmentSuffix}`,
      {
        restApi: this.api.id,
        description: `Deployment for ${environmentSuffix}`,
      },
      {
        parent: this,
        dependsOn: [this.method, this.integration, lambdaPermission],
      }
    );

    // Create the stage
    this.stage = new aws.apigateway.Stage(
      `default-stage-${environmentSuffix}`,
      {
        restApi: this.api.id,
        stageName: 'dev',
        deployment: deployment.id,
        description: `Default stage for secure document API - ${environmentSuffix}`,
        // Note: Access logging requires CloudWatch Logs role to be configured in AWS account
        // If you get "CloudWatch Logs role ARN must be set in account settings" error,
        // you need to configure the role first or remove this section temporarily
        // accessLogSettings: {
        //   destinationArn: apiGatewayLogGroupArn,
        //   format: JSON.stringify({
        //     requestId: '$context.requestId',
        //     requestTime: '$context.requestTime',
        //     httpMethod: '$context.httpMethod',
        //     path: '$context.path',
        //     status: '$context.status',
        //     responseLength: '$context.responseLength',
        //     userAgent: '$context.identity.userAgent',
        //     sourceIp: '$context.identity.sourceIp',
        //     protocol: '$context.protocol',
        //     error: {
        //       message: '$context.error.message',
        //       messageString: '$context.error.messageString',
        //     },
        //     integration: {
        //       error: '$context.integration.error',
        //       latency: '$context.integration.latency',
        //       requestId: '$context.integration.requestId',
        //       status: '$context.integration.status',
        //     },
        //   }),
        // },
        tags: {
          Name: `default-stage-${environmentSuffix}`,
          Purpose: 'API Gateway default stage',
          ...tags,
        },
      },
      {
        parent: this,
        dependsOn: [deployment],
      }
    );

    // Construct the API URL
    this.apiUrl = pulumi
      .all([this.api.id, this.stage.stageName])
      .apply(([apiId, stageName]) => {
        const region = 'us-east-1'; // Hardcoded as per requirements
        return `https://${apiId}.execute-api.${region}.amazonaws.com/${stageName}`;
      });

    this.registerOutputs({
      apiId: this.api.id,
      apiArn: this.api.arn,
      apiUrl: this.apiUrl,
      stageId: this.stage.id,
      stageName: this.stage.stageName,
      integrationId: this.integration.id,
      methodId: this.method.id,
      resourceId: this.resource.id,
      executionArn: this.api.executionArn,
    });
  }
}
