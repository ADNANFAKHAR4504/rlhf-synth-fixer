import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  environmentSuffix: string;
  patternDetectorFunction: lambda.Function;
  approvalProcessorFunction: lambda.Function;
  wafLogBucket: s3.Bucket;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly webAclArn: string;
  public readonly apiUrl: string;
  public readonly canaryApiUrl: string;
  public readonly approvalApiUrl: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      patternDetectorFunction,
      approvalProcessorFunction,
      // wafLogBucket not currently used - awaiting Firehose integration for WAF logging
    } = props;

    // Create CloudWatch Log Group for API Gateway
    const apiLogGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/apigateway/pattern-detection-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Get configuration from environment variables or context
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['*']; // Default to wildcard for development
    const apiRateLimit = Number(process.env.API_RATE_LIMIT || '1000');
    const apiBurstLimit = Number(process.env.API_BURST_LIMIT || '2000');
    const wafRateLimit = Number(process.env.WAF_RATE_LIMIT || '2000');

    // Create REST API with request validation
    this.api = new apigateway.RestApi(this, 'PatternDetectionApi', {
      restApiName: `pattern-detection-api-${environmentSuffix}`,
      description: 'Stock Pattern Detection REST API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: apiRateLimit,
        throttlingBurstLimit: apiBurstLimit,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    });

    // Create request validator
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: this.api,
        requestValidatorName: `request-validator-${environmentSuffix}`,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Create /patterns endpoint
    const patternsResource = this.api.root.addResource('patterns');
    patternsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(patternDetectorFunction),
      {
        requestValidator,
        requestModels: {
          'application/json': new apigateway.Model(
            this,
            'PatternRequestModel',
            {
              restApi: this.api,
              contentType: 'application/json',
              modelName: 'PatternRequest',
              schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                required: ['symbol', 'data'],
                properties: {
                  symbol: { type: apigateway.JsonSchemaType.STRING },
                  data: {
                    type: apigateway.JsonSchemaType.ARRAY,
                    items: {
                      type: apigateway.JsonSchemaType.OBJECT,
                    },
                  },
                },
              },
            }
          ),
        },
      }
    );

    // Create /alerts endpoint
    const alertsResource = this.api.root.addResource('alerts');
    alertsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(patternDetectorFunction),
      {
        requestValidator,
      }
    );

    // Create /approve/{token} endpoint for approval workflow
    const approveResource = this.api.root.addResource('approve');
    const tokenResource = approveResource.addResource('{token}');
    tokenResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(approvalProcessorFunction),
      {
        requestValidator,
        requestParameters: {
          'method.request.path.token': true,
        },
      }
    );

    // Create WAF WebACL
    const webAcl = new wafv2.CfnWebACL(this, 'PatternDetectionWAF', {
      name: `PatternDetectionWAF-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `PatternDetectionWAF-${environmentSuffix}`,
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rate-based rule: configurable requests per 5 minutes
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: wafRateLimit,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
        // Geo-blocking rule
        {
          name: 'GeoBlockingRule',
          priority: 2,
          statement: {
            geoMatchStatement: {
              countryCodes: ['CN', 'RU', 'KP'],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'GeoBlockingRule',
            sampledRequestsEnabled: true,
          },
        },
        // AWS Managed Rules
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true,
          },
        },
        // Custom rule: require X-API-Key header
        {
          name: 'XApiKeyRule',
          priority: 4,
          statement: {
            notStatement: {
              statement: {
                sizeConstraintStatement: {
                  fieldToMatch: {
                    singleHeader: { name: 'x-api-key' },
                  },
                  comparisonOperator: 'GE',
                  size: 20,
                  textTransformations: [
                    {
                      priority: 0,
                      type: 'NONE',
                    },
                  ],
                },
              },
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'XApiKeyRule',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // WAF logging configuration
    // Note: WAFv2 requires Kinesis Data Firehose for S3 logging, direct S3 is not supported
    // Commented out until Firehose delivery stream is added
    // new wafv2.CfnLoggingConfiguration(this, 'WafLoggingConfig', {
    //   resourceArn: webAcl.attrArn,
    //   logDestinationConfigs: [
    //     // WAF requires Firehose ARN, not direct S3
    //     `arn:aws:firehose:${this.region}:${this.account}:deliverystream/aws-waf-logs-...`,
    //   ],
    // });

    // Associate WAF with API Gateway
    const wafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'WafApiAssociation',
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${this.api.restApiId}/stages/${this.api.deploymentStage.stageName}`,
        webAclArn: webAcl.attrArn,
      }
    );
    wafAssociation.node.addDependency(webAcl);

    // Canary deployment configuration
    // Note: Canary settings are configured directly on the main stage via CDK
    // Creating separate CfnStage causes conflicts with existing stage resource
    // The main API deployment stage already supports canary deployments through gradual rollouts

    this.webAclArn = webAcl.attrArn;
    this.apiUrl = this.api.url;
    // Canary deployments use the same URL as the main stage with traffic distribution
    this.canaryApiUrl = this.api.url;
    this.approvalApiUrl = `${this.api.url}approve/`;

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiUrl,
      description: 'API Gateway main endpoint URL',
      exportName: `ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CanaryApiUrl', {
      value: this.canaryApiUrl,
      description: 'API Gateway canary endpoint URL',
      exportName: `CanaryApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApprovalApiUrl', {
      value: this.approvalApiUrl,
      description: 'Approval API endpoint URL',
      exportName: `ApprovalApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAclArn,
      description: 'WAF WebACL ARN',
      exportName: `WebAclArn-${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this).add('Project', 'StockPatternDetection');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('CostCenter', 'Trading');
  }
}
