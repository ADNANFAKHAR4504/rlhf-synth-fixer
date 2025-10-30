/**
 * API Gateway with WAF, throttling, and X-Ray
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ApiGatewayArgs {
  apiName: string;
  lambdaFunction: aws.lambda.Function;
  wafWebAclArn: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiGatewayMigration extends pulumi.ComponentResource {
  public readonly api: aws.apigateway.RestApi;
  public readonly deployment: aws.apigateway.Deployment;
  public readonly stage: aws.apigateway.Stage;

  constructor(
    name: string,
    args: ApiGatewayArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:ApiGatewayMigration', name, {}, opts);

    // Create REST API
    this.api = new aws.apigateway.RestApi(
      `${args.apiName}-${args.environmentSuffix}`,
      {
        name: `${args.apiName}-${args.environmentSuffix}`,
        description: 'Payment processing API',
        tags: args.tags,
      },
      { parent: this }
    );

    // Create resource
    const resource = new aws.apigateway.Resource(
      `${args.apiName}-resource-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        parentId: this.api.rootResourceId,
        pathPart: 'payment',
      },
      { parent: this }
    );

    // Create method
    const method = new aws.apigateway.Method(
      `${args.apiName}-method-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: resource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda integration
    const integration = new aws.apigateway.Integration(
      `${args.apiName}-integration-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        resourceId: resource.id,
        httpMethod: method.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: args.lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Lambda permission
    new aws.lambda.Permission(
      `${args.apiName}-lambda-permission-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: args.lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Deployment
    this.deployment = new aws.apigateway.Deployment(
      `${args.apiName}-deployment-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        triggers: {
          redeployment: pulumi
            .all([resource.id, method.id, integration.id])
            .apply(ids => JSON.stringify(ids)),
        },
      },
      { parent: this, dependsOn: [method, integration] }
    );

    // Stage with X-Ray tracing
    this.stage = new aws.apigateway.Stage(
      `${args.apiName}-stage-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        deployment: this.deployment.id,
        stageName: 'prod',
        xrayTracingEnabled: true,
        tags: args.tags,
      },
      { parent: this }
    );

    // CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-${args.apiName}-${args.environmentSuffix}`,
      {
        name: `/aws/apigateway/${args.apiName}-${args.environmentSuffix}`,
        retentionInDays: 30,
        tags: args.tags,
      },
      { parent: this }
    );

    // Method settings for throttling and logging
    new aws.apigateway.MethodSettings(
      `${args.apiName}-method-settings-${args.environmentSuffix}`,
      {
        restApi: this.api.id,
        stageName: this.stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
          loggingLevel: 'INFO',
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      },
      { parent: this, dependsOn: [this.stage, logGroup] }
    );

    // Associate WAF with API Gateway
    new aws.wafv2.WebAclAssociation(
      `${args.apiName}-waf-association-${args.environmentSuffix}`,
      {
        resourceArn: this.stage.arn,
        webAclArn: args.wafWebAclArn,
      },
      { parent: this, dependsOn: [this.stage] }
    );

    this.registerOutputs({
      apiId: this.api.id,
      apiEndpoint: this.stage.invokeUrl,
    });
  }
}
