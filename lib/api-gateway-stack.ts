import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiGatewayStackArgs {
  environmentSuffix: string;
  albDnsName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiGatewayStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:api:ApiGatewayStack', name, args, opts);

    const { environmentSuffix, albDnsName, tags } = args;

    // REST API
    const api = new aws.apigateway.RestApi(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        description: 'Payment Processing API',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-api-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Link for private ALB integration (optional, using public ALB for simplicity)
    const resource = new aws.apigateway.Resource(
      `payment-api-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: '{proxy+}',
      },
      { parent: this }
    );

    const method = new aws.apigateway.Method(
      `payment-api-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: resource.id,
        httpMethod: 'ANY',
        authorization: 'NONE',
        apiKeyRequired: true,
        requestParameters: {
          'method.request.path.proxy': true,
        },
      },
      { parent: this }
    );

    const integration = new aws.apigateway.Integration(
      `payment-api-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        integrationHttpMethod: 'ANY',
        type: 'HTTP_PROXY',
        uri: pulumi.interpolate`http://${albDnsName}/{proxy}`,
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
      { parent: this }
    );

    // Deployment
    const deployment = new aws.apigateway.Deployment(
      `payment-api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [integration] }
    );

    // Stage
    const stage = new aws.apigateway.Stage(
      `payment-api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: deployment.id,
        stageName: environmentSuffix,
      },
      { parent: this }
    );

    // Usage Plan with Rate Limiting
    const usagePlan = new aws.apigateway.UsagePlan(
      `payment-usage-plan-${environmentSuffix}`,
      {
        name: `payment-usage-plan-${environmentSuffix}`,
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        throttleSettings: {
          burstLimit: 1000,
          rateLimit: 1000,
        },
        quotaSettings: {
          limit: 1000000,
          period: 'MONTH',
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-usage-plan-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // API Key
    const apiKey = new aws.apigateway.ApiKey(
      `payment-api-key-${environmentSuffix}`,
      {
        name: `payment-api-key-${environmentSuffix}`,
        enabled: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-api-key-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Associate API Key with Usage Plan
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _usagePlanKey = new aws.apigateway.UsagePlanKey(
      `payment-usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    // Outputs
    this.apiUrl = stage.invokeUrl;

    this.registerOutputs({
      apiUrl: this.apiUrl,
      apiId: api.id,
    });
  }
}
