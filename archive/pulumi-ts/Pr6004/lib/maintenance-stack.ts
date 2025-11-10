/**
 * maintenance-stack.ts
 *
 * S3 bucket hosting static maintenance page for failover.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MaintenanceStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MaintenanceStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly websiteEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: MaintenanceStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:maintenance:MaintenanceStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // S3 Bucket for maintenance page
    const bucket = new aws.s3.Bucket(
      `maintenance-bucket-${environmentSuffix}`,
      {
        bucket: `maintenance-page-${environmentSuffix}`,
        website: {
          indexDocument: 'index.html',
        },
        tags: {
          Name: `maintenance-bucket-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Bucket Public Access Block
    const pab = new aws.s3.BucketPublicAccessBlock(
      `maintenance-bucket-pab-${environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      { parent: this }
    );

    // Bucket Policy for public read
    const bucketPolicy = new aws.s3.BucketPolicy(
      `maintenance-bucket-policy-${environmentSuffix}`,
      {
        bucket: bucket.id,
        policy: bucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `${arn}/*`,
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [pab] }
    );

    // Upload maintenance page
    const maintenanceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Mode</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>We'll be right back!</h1>
        <p>Our payment system is currently undergoing scheduled maintenance.</p>
        <p>We expect to be back online shortly. Thank you for your patience.</p>
    </div>
</body>
</html>`;

    new aws.s3.BucketObject(
      `maintenance-index-${environmentSuffix}`,
      {
        bucket: bucket.id,
        key: 'index.html',
        content: maintenanceHtml,
        contentType: 'text/html',
      },
      { parent: this, dependsOn: [bucketPolicy] }
    );

    // Export values
    this.bucketName = bucket.id;
    this.websiteEndpoint = bucket.websiteEndpoint;

    this.registerOutputs({
      bucketName: this.bucketName,
      websiteEndpoint: this.websiteEndpoint,
    });
  }
}
