/**
 * TapStack - Optimized Lambda Image Processing Infrastructure
 *
 * This stack implements an optimized Lambda-based image processing pipeline with:
 * - ARM64 architecture for all Lambda functions
 * - Lambda SnapStart for Java functions
 * - Reserved concurrency configuration
 * - Lambda layers for shared dependencies
 * - CloudWatch log retention (7 days)
 * - X-Ray tracing for observability
 * - Least-privilege IAM roles
 * - Lambda function URLs with CORS
 * - S3 buckets for input/output
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly thumbnailFunctionUrl: pulumi.Output<string>;
  public readonly watermarkFunctionUrl: pulumi.Output<string>;
  public readonly metadataFunctionUrl: pulumi.Output<string>;
  public readonly inputBucketName: pulumi.Output<string>;
  public readonly outputBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get configuration for bucket names
    const config = new pulumi.Config();
    const inputBucketName =
      config.get('inputBucketName') || `image-input-${environmentSuffix}`;
    const outputBucketName =
      config.get('outputBucketName') || `image-output-${environmentSuffix}`;

    // Create S3 buckets for image processing
    const inputBucket = new aws.s3.Bucket(
      `input-bucket-${environmentSuffix}`,
      {
        bucket: inputBucketName,
        forceDestroy: true, // Allow cleanup during testing
        tags: {
          ...tags,
          Name: `input-bucket-${environmentSuffix}`,
          Purpose: 'Image processing input',
        },
      },
      { parent: this }
    );

    const outputBucket = new aws.s3.Bucket(
      `output-bucket-${environmentSuffix}`,
      {
        bucket: outputBucketName,
        forceDestroy: true, // Allow cleanup during testing
        tags: {
          ...tags,
          Name: `output-bucket-${environmentSuffix}`,
          Purpose: 'Image processing output',
        },
      },
      { parent: this }
    );

    // Create Lambda Layer for shared Node.js dependencies (ARM64 compatible)
    const nodejsLayer = new aws.lambda.LayerVersion(
      `nodejs-shared-layer-${environmentSuffix}`,
      {
        layerName: `nodejs-shared-layer-${environmentSuffix}`,
        code: new pulumi.asset.AssetArchive({
          'nodejs/node_modules': new pulumi.asset.FileArchive(
            '../lib/lambda/layers/nodejs'
          ),
        }),
        compatibleRuntimes: ['nodejs20.x', 'nodejs18.x'],
        compatibleArchitectures: ['arm64'],
        description:
          'Shared Node.js dependencies for image processing functions',
      },
      { parent: this }
    );

    // Create Lambda Layer for Java dependencies (ARM64 compatible)
    const javaLayer = new aws.lambda.LayerVersion(
      `java-shared-layer-${environmentSuffix}`,
      {
        layerName: `java-shared-layer-${environmentSuffix}`,
        code: new pulumi.asset.AssetArchive({
          'java/lib': new pulumi.asset.FileArchive('../lib/lambda/layers/java'),
        }),
        compatibleRuntimes: ['java21', 'java17'],
        compatibleArchitectures: ['arm64'],
        description: 'Shared Java dependencies for watermark processing',
      },
      { parent: this }
    );

    // IAM Role for Thumbnail Generator Lambda
    const thumbnailRole = new aws.iam.Role(
      `thumbnail-lambda-role-${environmentSuffix}`,
      {
        name: `thumbnail-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...tags,
          Name: `thumbnail-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `thumbnail-lambda-basic-${environmentSuffix}`,
      {
        role: thumbnailRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach X-Ray tracing policy
    new aws.iam.RolePolicyAttachment(
      `thumbnail-lambda-xray-${environmentSuffix}`,
      {
        role: thumbnailRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    // Inline policy for S3 access (least privilege)
    new aws.iam.RolePolicy(
      `thumbnail-lambda-s3-policy-${environmentSuffix}`,
      {
        role: thumbnailRole.id,
        policy: pulumi
          .all([inputBucket.arn, outputBucket.arn])
          .apply(([inputArn, outputArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject'],
                  Resource: `${inputArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject'],
                  Resource: `${outputArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for Thumbnail Generator with 7-day retention
    const thumbnailLogGroup = new aws.cloudwatch.LogGroup(
      `thumbnail-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/thumbnail-generator-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `thumbnail-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Thumbnail Generator Lambda Function
    const thumbnailFunction = new aws.lambda.Function(
      `thumbnail-generator-${environmentSuffix}`,
      {
        name: `thumbnail-generator-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: thumbnailRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive(
            '../lib/lambda/thumbnail-generator'
          ),
        }),
        memorySize: 1024,
        timeout: 60,
        // Reserved concurrency removed due to account limitations
        architectures: ['arm64'],
        layers: [nodejsLayer.arn],
        environment: {
          variables: {
            INPUT_BUCKET: inputBucket.bucket,
            OUTPUT_BUCKET: outputBucket.bucket,
          },
        },
        tracingConfig: {
          mode: 'Active', // Enable X-Ray tracing
        },
        tags: {
          ...tags,
          Name: `thumbnail-generator-${environmentSuffix}`,
          Function: 'Thumbnail generation',
        },
      },
      { parent: this, dependsOn: [thumbnailLogGroup] }
    );

    // Thumbnail Function URL with CORS
    const thumbnailFunctionUrl = new aws.lambda.FunctionUrl(
      `thumbnail-url-${environmentSuffix}`,
      {
        functionName: thumbnailFunction.name,
        authorizationType: 'NONE',
        cors: {
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['*'],
          maxAge: 300,
        },
      },
      { parent: this }
    );

    // IAM Role for Watermark Applier Lambda
    const watermarkRole = new aws.iam.Role(
      `watermark-lambda-role-${environmentSuffix}`,
      {
        name: `watermark-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...tags,
          Name: `watermark-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `watermark-lambda-basic-${environmentSuffix}`,
      {
        role: watermarkRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `watermark-lambda-xray-${environmentSuffix}`,
      {
        role: watermarkRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `watermark-lambda-s3-policy-${environmentSuffix}`,
      {
        role: watermarkRole.id,
        policy: pulumi
          .all([inputBucket.arn, outputBucket.arn])
          .apply(([inputArn, outputArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject'],
                  Resource: `${inputArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject'],
                  Resource: `${outputArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for Watermark Applier with 7-day retention
    const watermarkLogGroup = new aws.cloudwatch.LogGroup(
      `watermark-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/watermark-applier-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `watermark-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Watermark Applier Lambda Function (Java with SnapStart)
    const watermarkFunction = new aws.lambda.Function(
      `watermark-applier-${environmentSuffix}`,
      {
        name: `watermark-applier-${environmentSuffix}`,
        runtime: 'java21',
        handler: 'com.imageprocessing.WatermarkHandler',
        role: watermarkRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('../lib/lambda/watermark-applier'),
        }),
        memorySize: 512,
        timeout: 60,
        // Reserved concurrency removed due to account limitations
        architectures: ['arm64'],
        layers: [javaLayer.arn],
        environment: {
          variables: {
            INPUT_BUCKET: inputBucket.bucket,
            OUTPUT_BUCKET: outputBucket.bucket,
          },
        },
        tracingConfig: {
          mode: 'Active', // Enable X-Ray tracing
        },
        snapStart: {
          applyOn: 'PublishedVersions', // Enable SnapStart for Java
        },
        tags: {
          ...tags,
          Name: `watermark-applier-${environmentSuffix}`,
          Function: 'Watermark application',
        },
      },
      { parent: this, dependsOn: [watermarkLogGroup] }
    );

    // Watermark Function URL with CORS
    // Note: SnapStart is enabled on the function directly, no need for explicit version/alias in Pulumi
    const watermarkFunctionUrl = new aws.lambda.FunctionUrl(
      `watermark-url-${environmentSuffix}`,
      {
        functionName: watermarkFunction.name,
        authorizationType: 'NONE',
        cors: {
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['*'],
          maxAge: 300,
        },
      },
      { parent: this }
    );

    // IAM Role for Metadata Extractor Lambda
    const metadataRole = new aws.iam.Role(
      `metadata-lambda-role-${environmentSuffix}`,
      {
        name: `metadata-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...tags,
          Name: `metadata-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `metadata-lambda-basic-${environmentSuffix}`,
      {
        role: metadataRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `metadata-lambda-xray-${environmentSuffix}`,
      {
        role: metadataRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `metadata-lambda-s3-policy-${environmentSuffix}`,
      {
        role: metadataRole.id,
        policy: pulumi
          .all([inputBucket.arn, outputBucket.arn])
          .apply(([inputArn, outputArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject'],
                  Resource: `${inputArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject'],
                  Resource: `${outputArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for Metadata Extractor with 7-day retention
    const metadataLogGroup = new aws.cloudwatch.LogGroup(
      `metadata-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/metadata-extractor-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `metadata-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Metadata Extractor Lambda Function
    const metadataFunction = new aws.lambda.Function(
      `metadata-extractor-${environmentSuffix}`,
      {
        name: `metadata-extractor-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: metadataRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('../lib/lambda/metadata-extractor'),
        }),
        memorySize: 256,
        timeout: 60,
        // Reserved concurrency removed due to account limitations
        architectures: ['arm64'],
        layers: [nodejsLayer.arn],
        environment: {
          variables: {
            INPUT_BUCKET: inputBucket.bucket,
            OUTPUT_BUCKET: outputBucket.bucket,
          },
        },
        tracingConfig: {
          mode: 'Active', // Enable X-Ray tracing
        },
        tags: {
          ...tags,
          Name: `metadata-extractor-${environmentSuffix}`,
          Function: 'Metadata extraction',
        },
      },
      { parent: this, dependsOn: [metadataLogGroup] }
    );

    // Metadata Function URL with CORS
    const metadataFunctionUrl = new aws.lambda.FunctionUrl(
      `metadata-url-${environmentSuffix}`,
      {
        functionName: metadataFunction.name,
        authorizationType: 'NONE',
        cors: {
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST'],
          allowHeaders: ['*'],
          maxAge: 300,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.thumbnailFunctionUrl = thumbnailFunctionUrl.functionUrl;
    this.watermarkFunctionUrl = watermarkFunctionUrl.functionUrl;
    this.metadataFunctionUrl = metadataFunctionUrl.functionUrl;
    this.inputBucketName = inputBucket.bucket;
    this.outputBucketName = outputBucket.bucket;

    this.registerOutputs({
      thumbnailFunctionUrl: this.thumbnailFunctionUrl,
      watermarkFunctionUrl: this.watermarkFunctionUrl,
      metadataFunctionUrl: this.metadataFunctionUrl,
      inputBucketName: this.inputBucketName,
      outputBucketName: this.outputBucketName,
      thumbnailFunctionArn: thumbnailFunction.arn,
      watermarkFunctionArn: watermarkFunction.arn,
      metadataFunctionArn: metadataFunction.arn,
    });
  }
}
