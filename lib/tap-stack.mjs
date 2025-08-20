/**
 * tap-stack.mjs
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Import your nested stacks here. For example:
// import { DynamoDBStack } from "./dynamodb-stack.mjs";

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod'). Defaults to 'dev' if not provided.
 * @property {Object<string, string>} [tags] - Optional default tags to apply to resources.
 */

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
  // Test S3 bucket property
  bucketName;

  /**
   * Creates a new TapStack component.
   * @param {string} name - The logical name of this Pulumi component.
   * @param {TapStackArgs} args - Configuration arguments including environment suffix and tags.
   * @param {pulumi.ResourceOptions} [opts] - Pulumi options.
   */
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    // Get environment suffix and tags from args
    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {};

    // Create a test S3 bucket to verify Pulumi setup
    const testBucket = new aws.s3.Bucket(`tap-test-bucket-${environmentSuffix}`, {
      tags: {
        ...tags,
        Environment: environmentSuffix,
        Purpose: 'Testing Pulumi.js setup',
      },
    }, { parent: this });

    // Store the bucket name as an output
    this.bucketName = testBucket.id;

    // Register the outputs of this component
    this.registerOutputs({
      bucketName: this.bucketName,
    });
  }
}
