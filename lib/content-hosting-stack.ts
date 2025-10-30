/**
 * ContentHostingStack - Reusable Pulumi component for multi-environment static content hosting
 *
 * This component creates a complete CDN infrastructure including:
 * - S3 bucket for static content storage with versioning
 * - CloudFront distribution with Origin Access Identity
 * - ACM certificate for SSL/TLS
 * - Route53 DNS records for environment-specific domains
 * - IAM policies for secure access
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ContentHostingStackArgs {
  /**
   * Environment suffix (dev/staging/prod) for resource naming and configuration
   */
  environmentSuffix: string;

  /**
   * Project name for resource naming
   */
  projectName: string;

  /**
   * Domain name for the hosted zone (e.g., myapp.com)
   */
  domainName: string;

  /**
   * Tags to apply to all resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class ContentHostingStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly distributionDomainName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ContentHostingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:content:ContentHostingStack', name, args, opts);

    const { environmentSuffix, projectName, domainName, tags = {} } = args;

    // Determine environment-specific cache TTL
    const cacheTtl = this.getCacheTtl(environmentSuffix);

    // Determine environment-specific subdomain
    const subdomain = this.getSubdomain(environmentSuffix, domainName);

    // Merge tags with environment-specific tags
    const resourceTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: projectName,
      ManagedBy: 'Pulumi',
    }));

    // Create S3 bucket for static content
    const bucket = new aws.s3.Bucket(
      `${projectName}-${environmentSuffix}-content`,
      {
        bucket: `${projectName}-${environmentSuffix}-content`,
        versioning: {
          enabled: true,
        },
        tags: resourceTags,
      },
      { parent: this }
    );

    // Block public access to the bucket (CloudFront only access)
    new aws.s3.BucketPublicAccessBlock(
      `${projectName}-${environmentSuffix}-public-access-block`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create CloudFront Origin Access Identity
    const oai = new aws.cloudfront.OriginAccessIdentity(
      `${projectName}-${environmentSuffix}-oai`,
      {
        comment: `OAI for ${projectName} ${environmentSuffix} environment`,
      },
      { parent: this }
    );

    // Create bucket policy to allow CloudFront OAI access
    const bucketPolicy = new aws.s3.BucketPolicy(
      `${projectName}-${environmentSuffix}-bucket-policy`,
      {
        bucket: bucket.id,
        policy: pulumi
          .all([bucket.arn, oai.iamArn])
          .apply(([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontOAIAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this, dependsOn: [bucket] }
    );

    // Get existing Route53 hosted zone
    const hostedZone = aws.route53.getZone({
      name: domainName,
    });

    // Create ACM certificate in us-east-1 (required for CloudFront)
    const usEast1Provider = new aws.Provider(
      `${projectName}-${environmentSuffix}-us-east-1-provider`,
      {
        region: 'us-east-1',
      },
      { parent: this }
    );

    const certificate = new aws.acm.Certificate(
      `${projectName}-${environmentSuffix}-cert`,
      {
        domainName: `*.${domainName}`,
        subjectAlternativeNames: [domainName],
        validationMethod: 'DNS',
        tags: resourceTags,
      },
      { parent: this, provider: usEast1Provider }
    );

    // Create DNS validation records for ACM certificate
    const certValidationRecords = certificate.domainValidationOptions.apply(
      options => {
        return options.map((option, index) => {
          return new aws.route53.Record(
            `${projectName}-${environmentSuffix}-cert-validation-${index}`,
            {
              zoneId: hostedZone.then(z => z.zoneId),
              name: option.resourceRecordName,
              type: option.resourceRecordType,
              records: [option.resourceRecordValue],
              ttl: 60,
              allowOverwrite: true,
            },
            { parent: this }
          );
        });
      }
    );

    // Wait for certificate validation
    const certValidation = new aws.acm.CertificateValidation(
      `${projectName}-${environmentSuffix}-cert-validation`,
      {
        certificateArn: certificate.arn,
        validationRecordFqdns: certValidationRecords.apply(records =>
          records.map(r => r.fqdn)
        ),
      },
      { parent: this, provider: usEast1Provider }
    );

    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(
      `${projectName}-${environmentSuffix}-distribution`,
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: `CDN for ${projectName} ${environmentSuffix} environment`,
        defaultRootObject: 'index.html',
        aliases: [subdomain],
        origins: [
          {
            originId: bucket.arn,
            domainName: bucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity: oai.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: bucket.arn,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          minTtl: 0,
          defaultTtl: cacheTtl,
          maxTtl: cacheTtl * 2,
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
        },
        customErrorResponses: [
          {
            errorCode: 403,
            responseCode: 404,
            responsePagePath: '/404.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 404,
            responseCode: 404,
            responsePagePath: '/404.html',
            errorCachingMinTtl: 300,
          },
        ],
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          acmCertificateArn: certValidation.certificateArn,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        },
        tags: resourceTags,
      },
      { parent: this, dependsOn: [certValidation, bucketPolicy] }
    );

    // Create Route53 A record pointing to CloudFront
    new aws.route53.Record(
      `${projectName}-${environmentSuffix}-dns-record`,
      {
        zoneId: hostedZone.then(z => z.zoneId),
        name: subdomain,
        type: 'A',
        aliases: [
          {
            name: distribution.domainName,
            zoneId: distribution.hostedZoneId,
            evaluateTargetHealth: false,
          },
        ],
      },
      { parent: this, dependsOn: [distribution] }
    );

    // Set outputs
    this.bucketName = bucket.id;
    this.distributionUrl = pulumi.interpolate`https://${subdomain}`;
    this.distributionDomainName = distribution.domainName;

    // Register outputs
    this.registerOutputs({
      bucketName: this.bucketName,
      distributionUrl: this.distributionUrl,
      distributionDomainName: this.distributionDomainName,
    });
  }

  /**
   * Get cache TTL based on environment
   */
  private getCacheTtl(environment: string): number {
    switch (environment) {
      case 'dev':
        return 60;
      case 'staging':
        return 300;
      case 'prod':
        return 86400;
      default:
        return 300;
    }
  }

  /**
   * Get subdomain based on environment
   */
  private getSubdomain(environment: string, domainName: string): string {
    if (environment === 'prod') {
      return domainName;
    }
    return `${environment}.${domainName}`;
  }
}
