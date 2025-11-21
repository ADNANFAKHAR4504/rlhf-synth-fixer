import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiProps {
  environment: string;
  environmentSuffix: string;
  paymentProcessorFunction: aws.lambda.Function;
  validationFunction: aws.lambda.Function;
  enableWaf: boolean;
}

export class ApiComponent extends pulumi.ComponentResource {
  public restApi: aws.apigateway.RestApi;
  public deployment: aws.apigateway.Deployment;
  public stage: aws.apigateway.Stage;
  public wafAcl?: aws.wafv2.WebAcl;

  constructor(
    name: string,
    props: ApiProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:api:ApiComponent', name, {}, opts);

    // Create REST API
    this.restApi = new aws.apigateway.RestApi(
      `payment-api-${props.environment}-${props.environmentSuffix}`,
      {
        name: `payments-api-${props.environment}-${props.environmentSuffix}`,
        description: `Payment processing API for ${props.environment}`,
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `payment-api-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Create /process resource
    const processResource = new aws.apigateway.Resource(
      `process-resource-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        parentId: this.restApi.rootResourceId,
        pathPart: 'process',
      },
      { parent: this }
    );

    // Create POST method for /process
    const processMethod = new aws.apigateway.Method(
      `process-method-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        resourceId: processResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda integration for /process
    const processIntegration = new aws.apigateway.Integration(
      `process-integration-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        resourceId: processResource.id,
        httpMethod: processMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: props.paymentProcessorFunction.invokeArn,
      },
      { parent: this }
    );

    // Lambda permission for API Gateway
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const processPermission = new aws.lambda.Permission(
      `process-permission-${props.environment}-${props.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: props.paymentProcessorFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.restApi.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create /validate resource
    const validateResource = new aws.apigateway.Resource(
      `validate-resource-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        parentId: this.restApi.rootResourceId,
        pathPart: 'validate',
      },
      { parent: this }
    );

    // Create POST method for /validate
    const validateMethod = new aws.apigateway.Method(
      `validate-method-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        resourceId: validateResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Lambda integration for /validate
    const validateIntegration = new aws.apigateway.Integration(
      `validate-integration-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        resourceId: validateResource.id,
        httpMethod: validateMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: props.validationFunction.invokeArn,
      },
      { parent: this }
    );

    // Lambda permission for validation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const validatePermission = new aws.lambda.Permission(
      `validate-permission-${props.environment}-${props.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: props.validationFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.restApi.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create deployment
    this.deployment = new aws.apigateway.Deployment(
      `api-deployment-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        description: `Deployment for ${props.environment}`,
      },
      {
        parent: this,
        dependsOn: [processIntegration, validateIntegration],
      }
    );

    // Create stage
    this.stage = new aws.apigateway.Stage(
      `api-stage-${props.environment}-${props.environmentSuffix}`,
      {
        restApi: this.restApi.id,
        deployment: this.deployment.id,
        stageName: props.environment,
        description: `${props.environment} stage`,
        tags: {
          Name: `payment-api-stage-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Create WAF for production
    if (props.enableWaf) {
      this.wafAcl = new aws.wafv2.WebAcl(
        `payment-waf-${props.environment}-${props.environmentSuffix}`,
        {
          name: `payments-waf-${props.environment}-${props.environmentSuffix}`,
          description: `WAF for payment API ${props.environment}`,
          scope: 'REGIONAL',
          defaultAction: {
            allow: {},
          },
          rules: [
            {
              name: 'RateLimitRule',
              priority: 1,
              action: {
                block: {},
              },
              statement: {
                rateBasedStatement: {
                  limit: 2000,
                  aggregateKeyType: 'IP',
                },
              },
              visibilityConfig: {
                cloudwatchMetricsEnabled: true,
                metricName: `payments-rate-limit-${props.environment}`,
                sampledRequestsEnabled: true,
              },
            },
          ],
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: `payments-waf-${props.environment}`,
            sampledRequestsEnabled: true,
          },
          tags: {
            Name: `payment-waf-${props.environment}-${props.environmentSuffix}`,
            Environment: props.environment,
          },
        },
        { parent: this }
      );

      // Associate WAF with API Gateway stage
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const wafAssociation = new aws.wafv2.WebAclAssociation(
        `waf-association-${props.environment}-${props.environmentSuffix}`,
        {
          resourceArn: this.stage.arn,
          webAclArn: this.wafAcl.arn,
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      apiId: this.restApi.id,
      apiEndpoint: pulumi.interpolate`${this.restApi.executionArn}/${this.stage.stageName}`,
      invokeUrl: this.stage.invokeUrl,
    });
  }
}
