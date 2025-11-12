# Static Website Infrastructure with Pulumi TypeScript

Here is the complete Pulumi TypeScript infrastructure code for hosting a static website on AWS:

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for static website hosting infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { StaticWebsiteStack } from './static-website-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly websiteUrl: pulumi.Output<string>;
  public readonly cloudfrontDomain: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create the static website infrastructure
    const staticWebsite = new StaticWebsiteStack('static-website', {
      environmentSuffix: environmentSuffix,
      domainName: `example-${environmentSuffix}.com`,
      tags: tags,
    }, { parent: this });

    // Expose outputs
    this.websiteUrl = staticWebsite.websiteUrl;
    this.cloudfrontDomain = staticWebsite.cloudfrontDomain;
    this.s3BucketName = staticWebsite.s3BucketName;

    this.registerOutputs({
      websiteUrl: this.websiteUrl,
      cloudfrontDomain: this.cloudfrontDomain,
      s3BucketName: this.s3BucketName,
    });
  }
}
```

## File: lib/static-website-stack.ts

```typescript
/**
 * static-website-stack.ts
 *
 * Static website infrastructure component including S3, CloudFront, Route53, and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StaticWebsiteStackArgs {
  environmentSuffix: string;
  domainName: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class StaticWebsiteStack extends pulumi.ComponentResource {
  public readonly websiteUrl: pulumi.Output<string>;
  public readonly cloudfrontDomain: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: StaticWebsiteStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:app:StaticWebsiteStack', name, args, opts);

    const stackName = `${name}-${args.environmentSuffix}`;

    // Create S3 bucket for website content
    const contentBucket = new aws.s3.Bucket(`${stackName}-content`, {
      website: {
        indexDocument: 'index.html',
        errorDocument: 'error.html',
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        id: 'delete-incomplete-multipart-uploads',
        abortIncompleteMultipartUploadDays: 7,
      }],
      tags: args.tags,
    }, { parent: this });

    // Create S3 bucket for logs
    const logsBucket = new aws.s3.Bucket(`${stackName}-logs`, {
      acl: 'log-delivery-write',
      lifecycleRules: [
        {
          enabled: true,
          id: 'transition-to-glacier',
          transitions: [{
            days: 30,
            storageClass: 'GLACIER',
          }],
        },
        {
          enabled: true,
          id: 'delete-old-logs',
          expiration: {
            days: 90,
          },
        },
      ],
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: args.tags,
    }, { parent: this });

    // Block public access for content bucket except through CloudFront
    const contentBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${stackName}-content-pab`,
      {
        bucket: contentBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      },
      { parent: this }
    );

    // Create CloudFront Origin Access Identity
    const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
      `${stackName}-oai`,
      {
        comment: `OAI for ${stackName}`,
      },
      { parent: this }
    );

    // Bucket policy to allow CloudFront OAI access
    const bucketPolicy = new aws.s3.BucketPolicy(
      `${stackName}-content-policy`,
      {
        bucket: contentBucket.id,
        policy: pulumi.all([contentBucket.arn, originAccessIdentity.iamArn]).apply(
          ([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontOAI',
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
      { parent: this, dependsOn: [contentBucketPublicAccessBlock] }
    );

    // Request ACM certificate
    const certificate = new aws.acm.Certificate(
      `${stackName}-certificate`,
      {
        domainName: args.domainName,
        validationMethod: 'DNS',
        tags: args.tags,
      },
      { parent: this, provider: new aws.Provider('us-east-1-provider', { region: 'us-east-1' }) }
    );

    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(
      `${stackName}-distribution`,
      {
        enabled: true,
        isIpv6Enabled: true,
        defaultRootObject: 'index.html',
        priceClass: 'PriceClass_100',

        origins: [{
          domainName: contentBucket.bucketRegionalDomainName,
          originId: 'S3-Website',
          s3OriginConfig: {
            originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
          },
        }],

        defaultCacheBehavior: {
          targetOriginId: 'S3-Website',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          defaultTtl: 3600,
          maxTtl: 86400,
          minTtl: 0,
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
            responsePagePath: '/error.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 404,
            responsePagePath: '/error.html',
            errorCachingMinTtl: 300,
          },
        ],

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          acmCertificateArn: certificate.arn,
          sslSupportMethod: 'sni-only',
          minimumProtocolVersion: 'TLSv1.2_2021',
        },

        loggingConfig: {
          bucket: logsBucket.bucketDomainName,
          prefix: 'cloudfront/',
          includeCookies: false,
        },

        tags: args.tags,
      },
      { parent: this }
    );

    // Create Route53 hosted zone
    const hostedZone = new aws.route53.Zone(
      `${stackName}-zone`,
      {
        name: args.domainName,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create A record
    const aRecord = new aws.route53.Record(
      `${stackName}-a-record`,
      {
        zoneId: hostedZone.zoneId,
        name: args.domainName,
        type: 'A',
        aliases: [{
          name: distribution.domainName,
          zoneId: distribution.hostedZoneId,
          evaluateTargetHealth: false,
        }],
      },
      { parent: this }
    );

    // Create AAAA record for IPv6
    const aaaaRecord = new aws.route53.Record(
      `${stackName}-aaaa-record`,
      {
        zoneId: hostedZone.zoneId,
        name: args.domainName,
        type: 'AAAA',
        aliases: [{
          name: distribution.domainName,
          zoneId: distribution.hostedZoneId,
          evaluateTargetHealth: false,
        }],
      },
      { parent: this }
    );

    // Create CloudWatch alarms for monitoring
    const highErrorRateAlarm4xx = new aws.cloudwatch.MetricAlarm(
      `${stackName}-4xx-errors`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '4xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 5,
        actionsEnabled: true,
        alarmDescription: 'Alarm when 4xx error rate exceeds 5%',
        dimensions: {
          DistributionId: distribution.id,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    const highErrorRateAlarm5xx = new aws.cloudwatch.MetricAlarm(
      `${stackName}-5xx-errors`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5xxErrorRate',
        namespace: 'AWS/CloudFront',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        actionsEnabled: true,
        alarmDescription: 'Alarm when 5xx error rate exceeds 1%',
        dimensions: {
          DistributionId: distribution.id,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    // Upload sample content
    const indexHtml = new aws.s3.BucketObject(
      'index.html',
      {
        bucket: contentBucket.id,
        key: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Our Business</title>
</head>
<body>
    <h1>Welcome to Our Small Business Website</h1>
    <p>This website is powered by AWS S3, CloudFront, and Route53.</p>
</body>
</html>`,
        contentType: 'text/html',
      },
      { parent: this }
    );

    const errorHtml = new aws.s3.BucketObject(
      'error.html',
      {
        bucket: contentBucket.id,
        key: 'error.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Page Not Found</title>
</head>
<body>
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
</body>
</html>`,
        contentType: 'text/html',
      },
      { parent: this }
    );

    // Set outputs
    this.websiteUrl = pulumi.interpolate`https://${args.domainName}`;
    this.cloudfrontDomain = distribution.domainName;
    this.s3BucketName = contentBucket.id;

    this.registerOutputs({
      websiteUrl: this.websiteUrl,
      cloudfrontDomain: this.cloudfrontDomain,
      s3BucketName: this.s3BucketName,
      hostedZoneId: hostedZone.zoneId,
      distributionId: distribution.id,
    });
  }
}