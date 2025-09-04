/**
 * storage-stack.mjs
 *
 * Creates S3 bucket for static content hosting with public read access
 * and latest 2025 security features.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class StorageStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:storage:StorageStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'storage' };

    // S3 bucket for static content
    this.bucket = new aws.s3.Bucket(
      `webapp-static-${environmentSuffix}`,
      {
        bucket: `webapp-static-${environmentSuffix}-${pulumi.getStack()}`.toLowerCase(),
        tags: { ...tags, Name: `webapp-static-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Configure bucket versioning (2025 security best practice)
    new aws.s3.BucketVersioning(
      `webapp-static-versioning-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure server-side encryption (2025 security requirement)
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `webapp-static-encryption-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Note: Due to AWS account restrictions, public access is disabled by default
    // In production, you would either:
    // 1. Use CloudFront distribution for public access
    // 2. Configure bucket policies with specific principal access
    // For now, keeping the bucket private

    // Website configuration
    new aws.s3.BucketWebsiteConfiguration(
      `webapp-static-website-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        indexDocument: {
          suffix: 'index.html',
        },
        errorDocument: {
          key: 'error.html',
        },
      },
      { parent: this }
    );

    // Upload sample static content
    new aws.s3.BucketObject(
      `webapp-index-html-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        key: 'index.html',
        content: `<!DOCTYPE html>
<html>
<head>
    <title>Web Application - Static Content</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background-color: #232F3E; color: white; padding: 20px; border-radius: 5px; }
        .content { padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Web Application Static Content</h1>
            <p>Environment: ${environmentSuffix}</p>
        </div>
        <div class="content">
            <h2>Welcome to our web application!</h2>
            <p>This static content is served from Amazon S3.</p>
            <p>The main application is running on EC2 instances behind an Application Load Balancer.</p>
        </div>
    </div>
</body>
</html>`,
        contentType: 'text/html',
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketWebsiteEndpoint: this.bucket.websiteEndpoint,
    });
  }
}

