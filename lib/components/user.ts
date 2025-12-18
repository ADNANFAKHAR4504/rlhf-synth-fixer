// lib/components/frontend.ts

/**
 * Frontend Infrastructure Component
 * Creates S3 bucket, CloudFront distribution, and related resources
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface FrontendInfrastructureArgs {
  tags: { [key: string]: string };
}

export class FrontendInfrastructure extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly oac: aws.cloudfront.OriginAccessControl;
  public readonly cloudfrontDistribution: aws.cloudfront.Distribution;

  constructor(
    name: string,
    args: FrontendInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:frontend:Infrastructure', name, {}, opts);

    // S3 bucket for static website content
    this.bucket = new aws.s3.Bucket(
      `${name}-website`,
      {
        website: {
          indexDocument: 'index.html',
          errorDocument: 'error.html',
        },
        acl: 'private',
        tags: { ...args.tags, Name: `${name}-website` },
      },
      { parent: this }
    );

    // Block public access to the S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `${name}-website-pab`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Origin Access Control for CloudFront to access S3
    this.oac = new aws.cloudfront.OriginAccessControl(
      `${name}-oac`,
      {
        name: `${name}-oac`,
        description: 'OAC for S3 bucket access',
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
      { parent: this }
    );

    // CloudFront distribution with S3 origin
    this.cloudfrontDistribution = new aws.cloudfront.Distribution(
      `${name}-distribution`,
      {
        origins: [
          {
            domainName: this.bucket.bucketDomainName,
            originId: `${name}-s3-origin`,
            originAccessControlId: this.oac.id,
          },
        ],
        enabled: true,
        isIpv6Enabled: true,
        defaultRootObject: 'index.html',
        defaultCacheBehavior: {
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          targetOriginId: `${name}-s3-origin`,
          compress: true,
          viewerProtocolPolicy: 'redirect-to-https',
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        customErrorResponses: [
          {
            errorCode: 404,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 403,
            responseCode: 200,
            responsePagePath: '/index.html',
            errorCachingMinTtl: 300,
          },
        ],
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        priceClass: 'PriceClass_100',
        tags: { ...args.tags, Name: `${name}-distribution` },
      },
      { parent: this }
    );

    // S3 bucket policy to allow CloudFront access
    const bucketPolicy = pulumi
      .all([this.bucket.arn, this.cloudfrontDistribution.arn])
      .apply(([bucketArn, distributionArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AllowCloudFrontServicePrincipal',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudfront.amazonaws.com',
              },
              Action: 's3:GetObject',
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  'AWS:SourceArn': distributionArn,
                },
              },
            },
          ],
        })
      );

    new aws.s3.BucketPolicy(
      `${name}-bucket-policy`,
      {
        bucket: this.bucket.id,
        policy: bucketPolicy,
      },
      { parent: this }
    );

    // Upload sample files
    this.uploadSampleFiles(name);

    this.registerOutputs({
      bucketName: this.bucket.id,
      cloudfrontDomain: this.cloudfrontDistribution.domainName,
      cloudfrontDistributionId: this.cloudfrontDistribution.id,
    });
  }

  /**
   * Upload sample HTML, CSS, and JS files
   */
  private uploadSampleFiles(name: string): void {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Tier Web Application</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Multi-Tier Web Application</h1>
    <p>This is a sample frontend for the multi-tier web application.</p>
    <div id="api-test">
      <button onclick="testAPI()">Test Backend API</button>
      <div id="api-result"></div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`;

    new aws.s3.BucketObject(
      `${name}-index-html`,
      {
        bucket: this.bucket.id,
        key: 'index.html',
        content: indexHtml,
        contentType: 'text/html',
      },
      { parent: this }
    );

    const cssContent = `
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

#api-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 50px;
}
`;

    new aws.s3.BucketObject(
      `${name}-css`,
      {
        bucket: this.bucket.id,
        key: 'styles.css',
        content: cssContent,
        contentType: 'text/css',
      },
      { parent: this }
    );

    const jsContent = `
async function testAPI() {
  const resultDiv = document.getElementById('api-result');
  resultDiv.innerHTML = 'Testing API...';

  try {
    // Placeholder for API testing
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = \`<strong>API Response:</strong> \${JSON.stringify(data, null, 2)}\`;
    } else {
      resultDiv.innerHTML = \`<strong>Error:</strong> \${response.status} - \${response.statusText}\`;
    }
  } catch (error) {
    resultDiv.innerHTML = \`<strong>Error:</strong> \${error.message}\`;
  }
}
`;

    new aws.s3.BucketObject(
      `${name}-js`,
      {
        bucket: this.bucket.id,
        key: 'app.js',
        content: jsContent,
        contentType: 'application/javascript',
      },
      { parent: this }
    );

    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back to home</a>
  </div>
</body>
</html>`;

    new aws.s3.BucketObject(
      `${name}-error-html`,
      {
        bucket: this.bucket.id,
        key: 'error.html',
        content: errorHtml,
        contentType: 'text/html',
      },
      { parent: this }
    );
  }
}
