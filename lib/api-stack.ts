import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface ApiStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  vpcLink: apigateway.VpcLink;
  loadBalancer: elbv2.NetworkLoadBalancer;
}

export class ApiStack extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // Create CloudWatch log group for API Gateway
    const logGroup = new logs.LogGroup(this, 'ApiGatewayLogs', {
      logGroupName: `/aws/apigateway/payment-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create REST API
    this.api = new apigateway.RestApi(this, 'PaymentApi', {
      restApiName: `payment-api-${props.environmentSuffix}`,
      description: 'Payment processing API Gateway',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: props.environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      cloudWatchRole: true,
      minCompressionSize: cdk.Size.kibibytes(1),
      policy: new cdk.aws_iam.PolicyDocument({
        statements: [
          new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            principals: [new cdk.aws_iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*'],
          }),
        ],
      }),
    });

    // Create HTTP integration with VPC Link
    const integration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      uri: `http://${props.loadBalancer.loadBalancerDnsName}`,
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: props.vpcLink,
      },
    });

    // Add proxy resource
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const proxyResource = this.api.root.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    // Create API key
    const apiKey = this.api.addApiKey('PaymentApiKey', {
      apiKeyName: `payment-api-key-${props.environmentSuffix}`,
      description: 'API key for payment processing',
    });

    // Create usage plan
    const usagePlan = this.api.addUsagePlan('PaymentUsagePlan', {
      name: `payment-usage-plan-${props.environmentSuffix}`,
      description: 'Usage plan for payment API',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Create WAF Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'PaymentApiWaf', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `payment-api-waf-${props.environmentSuffix}`,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    // Note: The association must be with the stage ARN, not the general API ARN
    new wafv2.CfnWebACLAssociation(this, 'WafApiAssociation', {
      resourceArn: this.api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });

    // Tags for compliance
    cdk.Tags.of(this.api).add('PCICompliant', 'true');
    cdk.Tags.of(this.api).add('Environment', props.environmentSuffix);
  }
}
