import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  lambdaFunction: aws.lambda.Function;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly apiGatewayName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiGatewayStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:apigateway:ApiGatewayStack', name, args, opts);

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `tap-api-${args.environmentSuffix}`,
      {
        name: `tap-serverless-api-${args.environmentSuffix}`,
        description: 'Serverless API Gateway for TAP application',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Create resource for /items
    const itemsResource = new aws.apigateway.Resource(
      `tap-items-resource-${args.environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'items',
      },
      { parent: this }
    );

    // Create resource for /items/{id}
    const itemResource = new aws.apigateway.Resource(
      `tap-item-resource-${args.environmentSuffix}`,
      {
        restApi: api.id,
        parentId: itemsResource.id,
        pathPart: '{id}',
      },
      { parent: this }
    );

    // Create request validator for input validation
    const requestValidator = new aws.apigateway.RequestValidator(
      `tap-validator-${args.environmentSuffix}`,
      {
        restApi: api.id,
        name: 'request-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      },
      { parent: this }
    );

    // Create model for request validation
    const requestModel = new aws.apigateway.Model(
      `tap-model-${args.environmentSuffix}`,
      {
        restApi: api.id,
        name: 'CreateItemModel',
        contentType: 'application/json',
        schema: JSON.stringify({
          $schema: 'http://json-schema.org/draft-04/schema#',
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['name'],
        }),
      },
      { parent: this }
    );

    // GET method for /items (list all)
    const getItemsMethod = new aws.apigateway.Method(
      `tap-get-items-method-${args.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: itemsResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // POST method for /items (create item)
    const postItemsMethod = new aws.apigateway.Method(
      `tap-post-items-method-${args.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: itemsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
        requestModels: {
          'application/json': requestModel.name,
        },
      },
      { parent: this }
    );

    // GET method for /items/{id} (get specific item)
    const getItemMethod = new aws.apigateway.Method(
      `tap-get-item-method-${args.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: itemResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
        requestParameters: {
          'method.request.path.id': true,
        },
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    const lambdaPermission = new aws.lambda.Permission(
      `tap-lambda-permission-${args.environmentSuffix}`,
      {
        statementId: 'AllowExecutionFromAPIGateway',
        action: 'lambda:InvokeFunction',
        function: args.lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Integration for GET /items
    const getItemsIntegration = new aws.apigateway.Integration(
      `tap-get-items-integration-${args.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: itemsResource.id,
        httpMethod: getItemsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: args.lambdaFunction.invokeArn,
      },
      { parent: this, dependsOn: [lambdaPermission] }
    );

    // Integration for POST /items
    const postItemsIntegration = new aws.apigateway.Integration(
      `tap-post-items-integration-${args.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: itemsResource.id,
        httpMethod: postItemsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: args.lambdaFunction.invokeArn,
      },
      { parent: this, dependsOn: [lambdaPermission] }
    );

    // Integration for GET /items/{id}
    const getItemIntegration = new aws.apigateway.Integration(
      `tap-get-item-integration-${args.environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: itemResource.id,
        httpMethod: getItemMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: args.lambdaFunction.invokeArn,
      },
      { parent: this, dependsOn: [lambdaPermission] }
    );

    // Deploy the API
    const deployment = new aws.apigateway.Deployment(
      `tap-deployment-${args.environmentSuffix}`,
      {
        restApi: api.id,
        // Create a trigger to force new deployment when integrations change
        triggers: {
          redeployment: pulumi.interpolate`${getItemsIntegration.id}-${postItemsIntegration.id}-${getItemIntegration.id}`,
        },
      },
      {
        parent: this,
        dependsOn: [
          getItemsIntegration,
          postItemsIntegration,
          getItemIntegration,
        ],
      }
    );

    // Create a stage for the deployment
    const stage = new aws.apigateway.Stage(
      `tap-stage-${args.environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: args.environmentSuffix,
      },
      { parent: this }
    );

    this.apiEndpoint = pulumi.interpolate`https://${api.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}`;
    this.apiGatewayName = api.name;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      apiGatewayName: this.apiGatewayName,
    });
  }
}
