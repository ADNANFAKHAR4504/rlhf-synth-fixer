/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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

  /**
   * Optional name for a shared state bucket.
   */
  stateBucket?: pulumi.Input<string>;

  /**
   * Optional AWS region for the shared state bucket.
   */
  stateBucketRegion?: pulumi.Input<string>;

  /**
   * Optional AWS region override for the provider.
   */
  awsRegion?: string;
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
  // Example of a public property for a nested resource's output.
  // public readonly table: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs = {}, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const tapConfig = new pulumi.Config('tapstack');
    const environmentSuffix =
      args.environmentSuffix ??
      tapConfig.get('environmentSuffix') ??
      'dev';
    const region =
      args.awsRegion ||
      tapConfig.get('awsRegion') ||
      tapConfig.get('region') ||
      process.env.AWS_REGION ||
      'us-east-1';

    const mergedTags: { [key: string]: string } = {
      Environment: environmentSuffix,
      ...(args.tags && typeof args.tags === 'object'
        ? (args.tags as { [key: string]: string })
        : {}),
    };

    const provider = new aws.Provider(
      'aws',
      {
        region,
        defaultTags: {
          tags: mergedTags,
        },
      },
      { parent: this }
    );

    // --- Instantiate Nested Components Here ---
    // This is where you would create instances of your other component resources,
    // passing them the necessary configuration.

    // Example of instantiating a DynamoDBStack component:
    // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
    //   environmentSuffix: environmentSuffix,
    //   tags: tags,
    // }, { parent: this });

    // Example of creating a resource directly (for truly global resources only):
    // const bucket = new aws.s3.Bucket(`tap-global-bucket-${environmentSuffix}`, {
    //   tags: tags,
    // }, { parent: this });

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.
    // this.table = dynamoDBStack.table;

    // Register the outputs of this component.
    this.registerOutputs({
      environmentSuffix,
      region,
      stateBucket: args.stateBucket || tapConfig.get('stateBucket') || null,
      stateBucketRegion:
        args.stateBucketRegion ||
        tapConfig.get('stateBucketRegion') ||
        null,
      providerUrn: provider.urn,
    });
  }
}
