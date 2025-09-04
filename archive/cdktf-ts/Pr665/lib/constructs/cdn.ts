import { Construct } from 'constructs';
import {
  cloudfrontDistribution,
  route53Record,
  route53Zone,
  dataAwsRoute53Zone,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface CdnProps {
  config: AppConfig;
  albDnsName: string;
  webAclArn: string;
  logsBucket: string;
}

export class CdnConstruct extends Construct {
  public readonly distribution: cloudfrontDistribution.CloudfrontDistribution;
  public readonly hostedZone?: route53Zone.Route53Zone;

  constructor(scope: Construct, id: string, props: CdnProps) {
    super(scope, id);

    const { config, albDnsName /*, webAclArn, logsBucket */ } = props;

    this.distribution = new cloudfrontDistribution.CloudfrontDistribution(
      this,
      'distribution',
      {
        comment: `CloudFront distribution for ${config.projectName}`,
        enabled: true,
        isIpv6Enabled: true,
        defaultRootObject: 'index.html',
        priceClass: 'PriceClass_100',

        aliases: config.domainName
          ? [config.domainName, `www.${config.domainName}`]
          : undefined,

        origin: [
          {
            domainName: albDnsName,
            originId: `${config.projectName}-alb-origin`,
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],

        defaultCacheBehavior: {
          targetOriginId: `${config.projectName}-alb-origin`,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,

          forwardedValues: {
            queryString: true,
            cookies: {
              forward: 'all',
            },
            headers: ['Host', 'Authorization', 'CloudFront-Forwarded-Proto'],
          },

          minTtl: 0,
          defaultTtl: 0,
          maxTtl: 31536000,

          trustedSigners: [],
        },

        orderedCacheBehavior: [
          {
            pathPattern: '/api/*',
            targetOriginId: `${config.projectName}-alb-origin`,
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: [
              'DELETE',
              'GET',
              'HEAD',
              'OPTIONS',
              'PATCH',
              'POST',
              'PUT',
            ],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,

            forwardedValues: {
              queryString: true,
              cookies: {
                forward: 'all',
              },
              headers: ['*'],
            },

            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 0,

            trustedSigners: [],
          },
          {
            pathPattern: '/static/*',
            targetOriginId: `${config.projectName}-alb-origin`,
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,

            forwardedValues: {
              queryString: false,
              cookies: {
                forward: 'none',
              },
            },

            minTtl: 0,
            defaultTtl: 86400,
            maxTtl: 31536000,

            trustedSigners: [],
          },
        ],

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: config.domainName
          ? {
              acmCertificateArn:
                'arn:aws:acm:us-east-1:123456789012:certificate/example',
              sslSupportMethod: 'sni-only',
              minimumProtocolVersion: 'TLSv1.2_2021',
            }
          : {
              cloudfrontDefaultCertificate: true,
            },

        customErrorResponse: [
          {
            errorCode: 404,
            responseCode: 404,
            responsePagePath: '/404.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 500,
            responseCode: 500,
            responsePagePath: '/500.html',
            errorCachingMinTtl: 0,
          },
        ],

        // Temporarily disabled WAF due to scope mismatch (regional vs global required for CloudFront)
        // TODO: Create a separate CLOUDFRONT-scoped WAF for CloudFront
        // webAclId: webAclArn,

        // Temporarily disabled CloudFront logging due to S3 ACL access issue
        // TODO: Re-enable once S3 bucket ACL permissions are resolved
        /*
        loggingConfig: {
          bucket: `${logsBucket}.s3.amazonaws.com`,
          includeCookies: false,
          prefix: `cloudfront-logs-${config.environment}/`,
        },
        */

        tags: {
          ...config.tags,
          Name: `${config.projectName}-cloudfront-distribution`,
        },
      }
    );

    if (config.domainName) {
      try {
        // Try to find existing hosted zone, but make it optional
        const existingZone = new dataAwsRoute53Zone.DataAwsRoute53Zone(
          this,
          'existing-zone',
          {
            name: config.domainName,
            privateZone: false,
          }
        );

        new route53Record.Route53Record(this, 'domain-record', {
          zoneId: existingZone.zoneId,
          name: config.domainName,
          type: 'A',
          alias: {
            name: this.distribution.domainName,
            zoneId: this.distribution.hostedZoneId,
            evaluateTargetHealth: false,
          },
        });

        new route53Record.Route53Record(this, 'www-domain-record', {
          zoneId: existingZone.zoneId,
          name: `www.${config.domainName}`,
          type: 'A',
          alias: {
            name: this.distribution.domainName,
            zoneId: this.distribution.hostedZoneId,
            evaluateTargetHealth: false,
          },
        });
      } catch (error) {
        this.hostedZone = new route53Zone.Route53Zone(this, 'hosted-zone', {
          name: config.domainName,
          comment: `Hosted zone for ${config.projectName}`,
          tags: {
            ...config.tags,
            Name: `${config.projectName}-hosted-zone`,
          },
        });

        new route53Record.Route53Record(this, 'domain-record', {
          zoneId: this.hostedZone.zoneId,
          name: config.domainName,
          type: 'A',
          alias: {
            name: this.distribution.domainName,
            zoneId: this.distribution.hostedZoneId,
            evaluateTargetHealth: false,
          },
        });

        new route53Record.Route53Record(this, 'www-domain-record', {
          zoneId: this.hostedZone.zoneId,
          name: `www.${config.domainName}`,
          type: 'A',
          alias: {
            name: this.distribution.domainName,
            zoneId: this.distribution.hostedZoneId,
            evaluateTargetHealth: false,
          },
        });
      }
    }
  }
}
