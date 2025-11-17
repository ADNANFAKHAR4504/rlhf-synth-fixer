import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, TagsConfig } from '../types';

export interface ApiGatewayComponentArgs {
  environmentSuffix: string;
  envConfig: EnvironmentConfig;
  tags: TagsConfig;
  lambdaFunctionArn: pulumi.Output<string>;
  lambdaFunctionName: pulumi.Output<string>;
}

export class ApiGatewayComponent extends pulumi.ComponentResource {
  public readonly api: aws.apigatewayv2.Api;
  public readonly stage: aws.apigatewayv2.Stage;
  public readonly wafWebAcl?: aws.wafv2.WebAcl;
  public readonly wafAssociation?: aws.wafv2.WebAclAssociation;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly apiArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApiGatewayComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:apigateway:ApiGatewayComponent', name, {}, opts);

    const {
      environmentSuffix,
      envConfig,
      tags,
      lambdaFunctionArn,
      lambdaFunctionName,
    } = args;

    // Create API Gateway HTTP API
    this.api = new aws.apigatewayv2.Api(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        protocolType: 'HTTP',
        description: `Payment processing API for ${envConfig.environment} environment`,
        corsConfiguration: {
          allowOrigins: ['*'],
          allowMethods: ['POST', 'GET', 'OPTIONS'],
          allowHeaders: ['Content-Type', 'Authorization'],
          maxAge: 300,
        },
        tags: {
          ...tags,
          Name: `payment-api-${environmentSuffix}`,
          CustomDomain: envConfig.customDomain,
        },
      },
      { parent: this }
    );

    // Create Lambda integration
    const integration = new aws.apigatewayv2.Integration(
      `payment-api-integration-${environmentSuffix}`,
      {
        apiId: this.api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: lambdaFunctionArn,
        integrationMethod: 'POST',
        payloadFormatVersion: '2.0',
        timeoutMilliseconds: 30000,
      },
      { parent: this }
    );

    // Create routes
    new aws.apigatewayv2.Route(
      `payment-post-route-${environmentSuffix}`,
      {
        apiId: this.api.id,
        routeKey: 'POST /payment',
        target: pulumi.interpolate`integrations/${integration.id}`,
      },
      { parent: this }
    );

    new aws.apigatewayv2.Route(
      `payment-get-route-${environmentSuffix}`,
      {
        apiId: this.api.id,
        routeKey: 'GET /payment/{id}',
        target: pulumi.interpolate`integrations/${integration.id}`,
      },
      { parent: this }
    );

    // Create CloudWatch log group for API Gateway
    this.logGroup = new aws.cloudwatch.LogGroup(
      `payment-api-logs-${environmentSuffix}`,
      {
        name: `/aws/apigateway/payment-api-${environmentSuffix}`,
        retentionInDays: envConfig.logRetentionDays,
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // Create stage with auto-deploy
    this.stage = new aws.apigatewayv2.Stage(
      `payment-api-stage-${environmentSuffix}`,
      {
        apiId: this.api.id,
        name: envConfig.environment,
        autoDeploy: true,
        accessLogSettings: {
          destinationArn: this.logGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            routeKey: '$context.routeKey',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // Grant API Gateway permission to invoke Lambda
    new aws.lambda.Permission(
      `payment-lambda-apigw-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunctionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create AWS WAF WebACL for prod environment only
    if (envConfig.enableWaf) {
      this.wafWebAcl = new aws.wafv2.WebAcl(
        `payment-waf-${environmentSuffix}`,
        {
          name: `payment-waf-${environmentSuffix}`,
          scope: 'REGIONAL',
          description: `WAF for payment API in ${envConfig.environment}`,
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
                metricName: 'RateLimitRule',
                sampledRequestsEnabled: true,
              },
            },
            {
              name: 'AWSManagedRulesCommonRuleSet',
              priority: 2,
              overrideAction: {
                none: {},
              },
              statement: {
                managedRuleGroupStatement: {
                  vendorName: 'AWS',
                  name: 'AWSManagedRulesCommonRuleSet',
                },
              },
              visibilityConfig: {
                cloudwatchMetricsEnabled: true,
                metricName: 'AWSManagedRulesCommonRuleSet',
                sampledRequestsEnabled: true,
              },
            },
          ],
          visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: `payment-waf-${environmentSuffix}`,
            sampledRequestsEnabled: true,
          },
          tags: {
            ...tags,
          },
        },
        { parent: this }
      );

      // Associate WAF with API Gateway
      this.wafAssociation = new aws.wafv2.WebAclAssociation(
        `payment-waf-association-${environmentSuffix}`,
        {
          resourceArn: this.stage.arn,
          webAclArn: this.wafWebAcl.arn,
        },
        { parent: this }
      );
    }

    this.apiEndpoint = pulumi.interpolate`${this.api.apiEndpoint}/${this.stage.name}`;
    this.apiArn = this.api.arn;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      apiArn: this.apiArn,
    });
  }
}
