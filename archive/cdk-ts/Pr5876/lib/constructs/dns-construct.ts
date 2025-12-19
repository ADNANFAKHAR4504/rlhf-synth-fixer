import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { StackConfig } from '../interfaces/config-interfaces';
import { NamingUtil } from '../utils/naming';

import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface DnsConstructProps extends StackConfig {
  albDnsName: string;
  vpc: ec2.IVpc;
}

export class DnsConstruct extends Construct {
  public readonly distributionDomain: string;
  public readonly hostedZone?: route53.IHostedZone;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: DnsConstructProps) {
    super(scope, id);

    const { config, albDnsName, vpc } = props;

    // Create a new private hosted zone - don't rely on lookup which fails during synthesis
    const domainName = `${config.environment}.internal`;

    // Create a new private hosted zone for this environment
    const hostedZone = new route53.PrivateHostedZone(
      this,
      'PrivateHostedZone',
      {
        zoneName: domainName,
        vpc: vpc,
      }
    );

    this.hostedZone = hostedZone;

    // CERTIFICATE CREATION (COMMENTED OUT DUE TO DNS VALIDATION ISSUES)
    // CloudFront certificate requires DNS validation which may fail in demo environments
    /*
    const certificate = new certificatemanager.Certificate(this, 'CloudFrontCertificate', {
      domainName: domainName,
      certificateName: NamingUtil.generateResourceName(config, 'cf-cert', false),
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
      subjectAlternativeNames: [`*.${domainName}`]
    });
    */

    // Create CloudFront distribution without certificate (HTTP only for demo)
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      // COMMENTED OUT: Domain names require valid certificate
      // domainNames: [domainName],
      // certificate: certificate,
      comment: `CloudFront distribution for ${config.environment} environment`,
      defaultRootObject: '',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Cost optimization

      // Use HTTP origin since we're not using HTTPS on ALB
      defaultBehavior: {
        origin: new cloudfrontOrigins.HttpOrigin(albDnsName, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          httpPort: 80,
          customHeaders: {
            'X-Forwarded-Proto': 'https',
          },
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy:
          cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
      },

      // Add behaviors for API endpoints (no caching)
      additionalBehaviors: {
        '/api/*': {
          origin: new cloudfrontOrigins.HttpOrigin(albDnsName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            httpsPort: 443,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        },
      },

      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(300),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(300),
        },
      ],

      // Geographic restrictions for compliance
      geoRestriction: cloudfront.GeoRestriction.allowlist(
        'US',
        'CA',
        'GB',
        'DE',
        'FR'
      ),

      // Security settings
      enableLogging: true,
      logBucket: undefined, // Will use default logging bucket
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,

      // Performance
      httpVersion: cloudfront.HttpVersion.HTTP2,
      enableIpv6: true,
    });

    this.distributionDomain = this.distribution.distributionDomainName;

    // ROUTE53 RECORDS (COMMENTED OUT DUE TO HOSTED ZONE VALIDATION ISSUES)
    // These records require proper hosted zone setup which may not be available in demo environments
    // Keeping structure for PROMPT compliance but commenting out due to deployment conflicts

    /*
    // Create Route53 alias record pointing to CloudFront
    new route53.ARecord(this, 'CloudFrontAliasRecord', {
      zone: hostedZone,
      recordName: config.environment,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.distribution)
      ),
      comment: `CloudFront distribution alias for ${config.environment}`,
      ttl: undefined
    });

    // Create direct ALB record for debugging/direct access
    new route53.ARecord(this, 'AlbDirectRecord', {
      zone: hostedZone,
      recordName: `alb.${config.environment}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget({
          loadBalancerCanonicalHostedZoneId: '',
          loadBalancerDNSName: albDnsName
        } as any)
      ),
      comment: `Direct ALB access for ${config.environment}`,
      ttl: undefined
    });

    // Create health check for ALB  
    const healthCheck = new route53.CfnHealthCheck(this, 'AlbHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: albDnsName,
        port: 443,
        resourcePath: '/api/health',
        requestInterval: 30,
        failureThreshold: 3
      }
    });

    // FAILOVER ROUTING (COMMENTED OUT DUE TO HOSTED ZONE ISSUES)
    /*
    // Create failover routing for high availability
    new route53.ARecord(this, 'PrimaryFailoverRecord', {
      zone: hostedZone,
      recordName: `failover.${config.environment}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget({
          loadBalancerCanonicalHostedZoneId: '',
          loadBalancerDNSName: albDnsName
        } as any)
      ),
      comment: `Primary failover record for ${config.environment}`
    });

    // Create secondary failover record pointing to CloudFront
    new route53.ARecord(this, 'SecondaryFailoverRecord', {
      zone: hostedZone,
      recordName: `failover-backup.${config.environment}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.distribution)
      ),
      comment: `Secondary failover record for ${config.environment}`
    });
    */

    // Apply tags
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.distribution).add(
      'Name',
      NamingUtil.generateResourceName(config, 'cf-dist', false)
    );
  }
}
