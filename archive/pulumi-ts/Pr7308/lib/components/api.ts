/**
 * API Gateway + WAF Component
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface APIComponentArgs {
  environmentSuffix: string;
  environment: 'dev' | 'staging' | 'prod';
  lambdaFunctionArn: pulumi.Input<string>;
  lambdaFunctionName: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class APIComponent extends pulumi.ComponentResource {
  public readonly apiId: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly wafAclArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: APIComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:api:APIComponent', name, {}, opts);

    const { environmentSuffix, environment, tags } = args;

    const wafAcl = new aws.wafv2.WebAcl(
      `api-waf-${environmentSuffix}`,
      {
        name: `api-waf-${environmentSuffix}`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            action: { block: {} },
            statement: {
              rateBasedStatement: {
                limit: environment === 'prod' ? 2000 : 500,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: `rate-limit-${environmentSuffix}`,
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `api-waf-${environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `api-waf-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const api = new aws.apigatewayv2.Api(
      `payment-api-${environmentSuffix}`,
      {
        name: `payment-api-${environmentSuffix}`,
        protocolType: 'HTTP',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-api-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.apiId = api.id;
    this.apiEndpoint = pulumi.interpolate`${api.apiEndpoint}/${environment}`;
    this.wafAclArn = wafAcl.arn;

    this.registerOutputs({
      apiId: this.apiId,
      apiEndpoint: this.apiEndpoint,
      wafAclArn: this.wafAclArn,
    });
  }
}
