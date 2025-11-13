import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface Route53HealthCheckProps {
  readonly zoneName: string;
  readonly environmentSuffix: string;
  readonly timestamp: string;
  readonly primaryApiGateway?: apigateway.RestApi;
  readonly drApiGateway?: apigateway.RestApi;
  readonly cloudFrontDistribution?: cloudfront.Distribution;
  readonly isPrimary?: boolean;
}

export class Route53HealthCheck extends Construct {
  public readonly hostedZone: route53.HostedZone;
  private _healthCheckId: string | undefined;

  constructor(scope: Construct, id: string, props: Route53HealthCheckProps) {
    super(scope, id);

    const { zoneName, environmentSuffix, timestamp, isPrimary = true } = props;

    // Create hosted zone (only in primary region)
    if (isPrimary) {
      this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
        zoneName: `${zoneName}-${environmentSuffix}-${timestamp}.example.internal`,
        comment: `Trading platform ${environmentSuffix} DNS zone`,
      });
    } else {
      // Import existing hosted zone in DR region
      // Note: In a real scenario, you'd get this from cross-stack references
      const importedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'ImportedZone',
        {
          hostedZoneId: 'PLACEHOLDER', // This would be passed from primary stack
          zoneName: `${zoneName}-${environmentSuffix}-${timestamp}.example.internal`,
        }
      );
      // Cast to concrete type for consistency
      this.hostedZone = importedZone as route53.HostedZone;
    }

    // Create health check for API Gateway if provided
    if (props.primaryApiGateway && isPrimary) {
      this.createApiHealthCheck(props.primaryApiGateway, 'primary');
    }

    if (props.drApiGateway && !isPrimary) {
      this.createApiHealthCheck(props.drApiGateway, 'dr');
    }

    // Create weighted routing records
    if (props.primaryApiGateway && isPrimary) {
      new route53.ARecord(this, 'PrimaryApiRecord', {
        zone: this.hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGateway(props.primaryApiGateway)
        ),
        setIdentifier: 'primary',
        weight: 100, // Primary gets all traffic initially
      });
    }

    if (props.drApiGateway && !isPrimary) {
      new route53.ARecord(this, 'DrApiRecord', {
        zone: this.hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGateway(props.drApiGateway)
        ),
        setIdentifier: 'dr',
        weight: 0, // DR gets no traffic initially
      });
    }

    // CloudFront distribution record
    if (props.cloudFrontDistribution && isPrimary) {
      new route53.ARecord(this, 'CloudFrontRecord', {
        zone: this.hostedZone,
        recordName: 'cdn',
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(props.cloudFrontDistribution)
        ),
      });
    }

    // Add tags
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: environmentSuffix,
      Component: 'Route53',
      Type: isPrimary ? 'Primary' : 'DR',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.hostedZone.node.addMetadata('aws:cdk:tagging', { [key]: value });
    });
  }

  get healthCheckId(): string | undefined {
    return this._healthCheckId;
  }

  private createApiHealthCheck(
    api: apigateway.RestApi,
    type: 'primary' | 'dr'
  ): void {
    // Create health check for API Gateway
    // Note: This uses the API Gateway's execute-api domain
    const healthCheck = new route53.CfnHealthCheck(this, `${type}HealthCheck`, {
      healthCheckConfig: {
        type: 'HTTPS',
        resourcePath: '/health',
        fullyQualifiedDomainName: `${api.restApiId}.execute-api.${api.stack.region}.amazonaws.com`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    this._healthCheckId = healthCheck.attrHealthCheckId;

    // Add tags to health check
    healthCheck.addPropertyOverride('Tags', [
      { Key: 'Project', Value: 'iac-rlhf-amazon' },
      { Key: 'Component', Value: 'Route53HealthCheck' },
      { Key: 'Type', Value: type },
    ]);
  }
}
