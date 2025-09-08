/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Import your nested stacks here. For example:
// import { DynamoDBStack } from "./dynamodb-stack";

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  // Public property for the S3 bucket output
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Get environment suffix and tags with defaults
    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // --- Instantiate Nested Components Here ---
    // This is where you would create instances of your other component resources,
    // passing them the necessary configuration.

    // Example of instantiating a DynamoDBStack component:
    // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
    //   environmentSuffix: environmentSuffix,
    //   tags: tags,
    // }, { parent: this });

    // Create S3 bucket for TAP project
    // Use a simple, predictable naming scheme to avoid invalid S3 bucket names
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string
    const bucketName = `tap-storage-${environmentSuffix}-${timestamp}`;

    // Log the bucket name for debugging
    console.log(
      `Creating S3 bucket with name: ${bucketName} (length: ${bucketName.length})`
    );

    // Create the S3 bucket
    this.bucket = new aws.s3.Bucket(
      `tap-storage-${environmentSuffix}`,
      {
        bucket: bucketName,
        tags: {
          ...tags,
          Name: bucketName,
          Environment: environmentSuffix,
          Project: 'TAP',
          ManagedBy: 'Pulumi',
          Purpose: 'storage',
        },
      },
      { parent: this }
    );

    // Enable versioning for the bucket
    new aws.s3.BucketVersioning(
      `tap-storage-${environmentSuffix}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-storage-${environmentSuffix}-encryption`,
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

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `tap-storage-${environmentSuffix}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Set bucket name as output
    this.bucketName = this.bucket.bucket;

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.
    // this.table = dynamoDBStack.table;

    // Register the outputs of this component.
    this.registerOutputs({
      // bucket: this.bucket,
      bucketName: this.bucketName,
      // table: this.table,
    });
  }
}
