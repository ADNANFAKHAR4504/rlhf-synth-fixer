import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  apiGateway: apigateway.RestApi;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // WAF Web ACL for API Gateway
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `WebAcl-${props.environmentSuffix}`,
      {
        name: `serverless-waf-${props.environmentSuffix}`,
        description: 'WAF Web ACL for API Gateway protection',
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          // Rate limiting rule
          {
            name: 'RateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            action: {
              block: {
                customResponse: {
                  responseCode: 429,
                  customResponseBodyKey: 'TooManyRequests',
                },
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          // SQL Injection protection
          {
            name: 'SQLiRule',
            priority: 2,
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'MATCH',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRule',
            },
          },
          // XSS protection
          {
            name: 'XSSRule',
            priority: 3,
            statement: {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'MATCH',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'XSSRule',
            },
          },
          // Size constraint rule
          {
            name: 'SizeRestrictionRule',
            priority: 4,
            statement: {
              sizeConstraintStatement: {
                fieldToMatch: {
                  body: {
                    oversizeHandling: 'MATCH',
                  },
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'NONE',
                  },
                ],
                comparisonOperator: 'GT',
                size: 8192, // 8KB limit
              },
            },
            action: { block: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SizeRestrictionRule',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `serverless-waf-${props.environmentSuffix}`,
        },
        customResponseBodies: {
          TooManyRequests: {
            contentType: 'APPLICATION_JSON',
            content: '{"error": "Too many requests. Please try again later."}',
          },
        },
      }
    );

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(
      this,
      `WebAclAssociation-${props.environmentSuffix}`,
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${props.apiGateway.restApiId}/stages/${props.apiGateway.deploymentStage.stageName}`,
        webAclArn: this.webAcl.attrArn,
      }
    );

    // Output
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `WebAclArn-${props.environmentSuffix}`,
    });
  }
}
