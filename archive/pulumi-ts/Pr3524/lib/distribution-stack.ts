import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DistributionStackArgs {
  environmentSuffix: string;
  bucketId: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
  bucketDomainName: pulumi.Output<string>;
  edgeLambdaArn: pulumi.Output<string>;
  logsBucketDomainName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DistributionStack extends pulumi.ComponentResource {
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;

  constructor(
    name: string,
    args: DistributionStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:distribution:DistributionStack', name, {}, opts);

    const { environmentSuffix, bucketDomainName, edgeLambdaArn, tags } = args;

    // Create CloudFront key pair for signed URLs
    new aws.secretsmanager.Secret(
      `cf-signing-key-${environmentSuffix}`,
      {
        description: 'CloudFront signing key for software distribution',
        tags,
      },
      { parent: this }
    );

    // Generate a valid RSA public key for CloudFront signing
    // This is a valid RSA 2048-bit public key for demonstration
    const publicKey = new aws.cloudfront.PublicKey(
      `signing-key-${environmentSuffix}`,
      {
        encodedKey: pulumi.output(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA/XVI5gYUZj+zKdfoIGvg
YoCmI4gdEqBtI57NPwHscGDO8Gn9r2W7eJ7xmbuzTKICeGrbi7sWzP6rzEFvRheG
CLyQXUDTPdPQvKTMsOzKJrgQcPuUR2Za92gM8Djyv/ATmt2410otvHd76BcZolG7
uJlSBcXgUQ3Ra0aNdVZk3AbOVu/nfi+NZXiBQn0PyptY+GEXZVnbFg1RFB8JgH6/
xVdveMeFx4bLhubvtQqu8BKE5ZyNvccUE1O/7NLUmcQjy2YAI4w09rfPFP/e565x
YZhE3XaxxXbGlC/uZNhRK/VZp2Xt9d6BCBwp/nUepolligRT+cIlgaoI9sfpm/2+
1wIDAQAB
-----END PUBLIC KEY-----`),
        comment: `Public key for ${environmentSuffix} environment`,
      },
      { parent: this }
    );

    // Create CloudFront key group
    const keyGroup = new aws.cloudfront.KeyGroup(
      `signing-key-group-${environmentSuffix}`,
      {
        items: [publicKey.id],
        comment: `Key group for ${environmentSuffix} environment`,
      },
      { parent: this }
    );

    // Create Origin Access Control
    const oac = new aws.cloudfront.OriginAccessControl(
      `dist-oac-${environmentSuffix}`,
      {
        description: 'OAC for Software Distribution',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
      { parent: this }
    );

    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(
      `software-dist-${environmentSuffix}`,
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: `Software distribution for ${environmentSuffix}`,
        defaultRootObject: 'index.html',

        origins: [
          {
            domainName: bucketDomainName,
            originId: 's3-origin',
            s3OriginConfig: {
              originAccessIdentity: '',
            },
            originAccessControlId: oac.id,
          },
        ],

        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: 's3-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          trustedKeyGroups: [keyGroup.id],

          forwardedValues: {
            queryString: false,
            cookies: { forward: 'none' },
          },

          minTtl: 0,
          defaultTtl: 86400,
          maxTtl: 31536000,
          compress: true,

          lambdaFunctionAssociations: [
            {
              eventType: 'viewer-request',
              lambdaArn: edgeLambdaArn,
              includeBody: false,
            },
          ],
        },

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        // Logging disabled due to ACL requirements
        // To enable, the logs bucket needs ACL support
        // loggingConfig: {
        //   bucket: logsBucketDomainName,
        //   prefix: 'cloudfront-logs/',
        // },

        tags,
      },
      { parent: this }
    );

    this.distributionUrl = distribution.domainName;
    this.distributionId = distribution.id;

    this.registerOutputs({
      distributionUrl: this.distributionUrl,
      distributionId: this.distributionId,
    });
  }
}
