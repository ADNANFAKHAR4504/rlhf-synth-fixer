import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

interface ApiStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName?: string;
  certificateArn?: string;
}

export class ApiStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly usagePlan: apigateway.UsagePlan;
  public readonly apiKey: apigateway.ApiKey;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { environmentSuffix, domainName, certificateArn } = props;

    // API Gateway REST API
    this.apiGateway = new apigateway.RestApi(
      this,
      `PaymentApi${environmentSuffix}`,
      {
        restApiName: `payment-processing-api-${environmentSuffix}`,
        description: 'Payment Processing API Gateway',
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
          ],
        },
        deployOptions: {
          stageName: 'prod',
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
      }
    );

    // Request validator (created but not directly used in this simplified implementation)
    new apigateway.RequestValidator(
      this,
      `RequestValidator${environmentSuffix}`,
      {
        restApi: this.apiGateway,
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // API resources will be created by the processing stack

    // Usage plans for different customer tiers
    this.usagePlan = new apigateway.UsagePlan(
      this,
      `PremiumUsagePlan${environmentSuffix}`,
      {
        name: `premium-payment-usage-${environmentSuffix}`,
        description: 'Premium usage plan for high-volume payment processing',
        throttle: {
          rateLimit: 1000,
          burstLimit: 2000,
        },
        quota: {
          limit: 1000000,
          period: apigateway.Period.MONTH,
        },
      }
    );

    // API Key
    this.apiKey = new apigateway.ApiKey(
      this,
      `PaymentApiKey${environmentSuffix}`,
      {
        apiKeyName: `payment-api-key-${environmentSuffix}`,
        description: 'API key for payment processing endpoints',
      }
    );

    // Associate usage plan with API
    this.usagePlan.addApiStage({
      stage: this.apiGateway.deploymentStage,
      api: this.apiGateway,
    });

    // Custom domain (if domain name provided)
    if (domainName && certificateArn) {
      const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        `Certificate${environmentSuffix}`,
        certificateArn
      );

      const domain = new apigateway.DomainName(
        this,
        `CustomDomain${environmentSuffix}`,
        {
          domainName,
          certificate,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        }
      );

      new apigateway.BasePathMapping(
        this,
        `BasePathMapping${environmentSuffix}`,
        {
          domainName: domain,
          restApi: this.apiGateway,
        }
      );

      // Route53 record (would need hosted zone ID in real implementation)
      // const hostedZone = route53.HostedZone.fromHostedZoneId(this, 'HostedZone', 'Z123456789');
      // new route53.ARecord(this, `AliasRecord${environmentSuffix}`, {
      //   zone: hostedZone,
      //   target: route53.RecordTarget.fromAlias(new route53targets.ApiGatewayDomain(domain)),
      // });
    }

    // Outputs for cross-stack references
    new cdk.CfnOutput(this, `ApiGatewayId${environmentSuffix}`, {
      value: this.apiGateway.restApiId,
      exportName: `PaymentApiId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ApiGatewayUrl${environmentSuffix}`, {
      value: this.apiGateway.url,
      exportName: `PaymentApiUrl-${environmentSuffix}`,
    });
  }
}
