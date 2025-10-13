import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ApiStackArgs {
  environmentSuffix: string;
  licenseApiLambdaArn: pulumi.Output<string>;
  licenseApiLambdaName: pulumi.Output<string>;
  usageTrackingLambdaArn: pulumi.Output<string>;
  usageTrackingLambdaName: pulumi.Output<string>;
  signedUrlLambdaArn: pulumi.Output<string>;
  signedUrlLambdaName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:api:ApiStack', name, {}, opts);

    const {
      environmentSuffix,
      licenseApiLambdaArn,
      licenseApiLambdaName,
      usageTrackingLambdaArn,
      usageTrackingLambdaName,
      signedUrlLambdaArn,
      signedUrlLambdaName,
      tags,
    } = args;

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `software-dist-api-${environmentSuffix}`,
      {
        description: 'API for software distribution platform',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags,
      },
      { parent: this }
    );

    // Create /licenses resource
    const licensesResource = new aws.apigateway.Resource(
      `licenses-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'licenses',
      },
      { parent: this }
    );

    // Create /licenses/validate resource
    const validateResource = new aws.apigateway.Resource(
      `validate-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: licensesResource.id,
        pathPart: 'validate',
      },
      { parent: this }
    );

    // Create /usage resource
    const usageResource = new aws.apigateway.Resource(
      `usage-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'usage',
      },
      { parent: this }
    );

    // Create /usage/track resource
    const trackResource = new aws.apigateway.Resource(
      `track-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: usageResource.id,
        pathPart: 'track',
      },
      { parent: this }
    );

    // Create /download resource
    const downloadResource = new aws.apigateway.Resource(
      `download-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'download',
      },
      { parent: this }
    );

    // Create /download/signed-url resource
    const signedUrlResource = new aws.apigateway.Resource(
      `signed-url-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: downloadResource.id,
        pathPart: 'signed-url',
      },
      { parent: this }
    );

    // Create Lambda permission for license API
    const licenseApiPermission = new aws.lambda.Permission(
      `license-api-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: licenseApiLambdaName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create Lambda permission for usage tracking
    const usageTrackingPermission = new aws.lambda.Permission(
      `usage-tracking-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: usageTrackingLambdaName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create Lambda permission for signed URL generation
    const signedUrlPermission = new aws.lambda.Permission(
      `signed-url-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: signedUrlLambdaName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create POST method for /licenses/validate
    const validateMethod = new aws.apigateway.Method(
      `validate-post-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: validateResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        apiKeyRequired: true,
      },
      { parent: this }
    );

    // Create integration for license validation
    const validateIntegration = new aws.apigateway.Integration(
      `validate-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: validateResource.id,
        httpMethod: validateMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: licenseApiLambdaArn.apply(
          arn =>
            `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${arn}/invocations`
        ),
      },
      { parent: this, dependsOn: [licenseApiPermission] }
    );

    // Create POST method for /usage/track
    const trackMethod = new aws.apigateway.Method(
      `track-post-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: trackResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        apiKeyRequired: true,
      },
      { parent: this }
    );

    // Create integration for usage tracking
    const trackIntegration = new aws.apigateway.Integration(
      `track-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: trackResource.id,
        httpMethod: trackMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: usageTrackingLambdaArn.apply(
          arn =>
            `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${arn}/invocations`
        ),
      },
      { parent: this, dependsOn: [usageTrackingPermission] }
    );

    // Create POST method for /download/signed-url
    const signedUrlMethod = new aws.apigateway.Method(
      `signed-url-post-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: signedUrlResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        apiKeyRequired: true,
      },
      { parent: this }
    );

    // Create integration for signed URL generation
    const signedUrlIntegration = new aws.apigateway.Integration(
      `signed-url-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: signedUrlResource.id,
        httpMethod: signedUrlMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: signedUrlLambdaArn.apply(
          arn =>
            `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${arn}/invocations`
        ),
      },
      { parent: this, dependsOn: [signedUrlPermission] }
    );

    // Deploy the API
    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi
            .all([
              validateMethod.id,
              validateIntegration.id,
              trackMethod.id,
              trackIntegration.id,
              signedUrlMethod.id,
              signedUrlIntegration.id,
            ])
            .apply(ids => JSON.stringify(ids)),
        },
      },
      {
        parent: this,
        dependsOn: [
          validateIntegration,
          trackIntegration,
          signedUrlIntegration,
        ],
      }
    );

    // Create stage
    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        deployment: deployment.id,
        restApi: api.id,
        stageName: environmentSuffix,
        xrayTracingEnabled: true,
        tags,
      },
      { parent: this }
    );

    // Create API key for authentication
    const apiKey = new aws.apigateway.ApiKey(
      `api-key-${environmentSuffix}`,
      {
        name: `tap-api-key-${environmentSuffix}`,
        description: 'API key for TAP license validation and usage tracking',
        tags,
      },
      { parent: this }
    );

    // Create usage plan
    const usagePlan = new aws.apigateway.UsagePlan(
      `usage-plan-${environmentSuffix}`,
      {
        name: `tap-usage-plan-${environmentSuffix}`,
        description: 'Usage plan for TAP API',
        apiStages: [
          {
            apiId: api.id,
            stage: stage.stageName,
          },
        ],
        throttleSettings: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
        quotaSettings: {
          limit: 50000,
          period: 'DAY',
        },
        tags,
      },
      { parent: this }
    );

    // Attach API key to usage plan
    new aws.apigateway.UsagePlanKey(
      `usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}`;

    this.registerOutputs({
      apiUrl: this.apiUrl,
    });
  }
}
