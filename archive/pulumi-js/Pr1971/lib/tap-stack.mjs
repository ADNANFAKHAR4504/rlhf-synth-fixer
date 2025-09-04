/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource for secure infrastructure deployment
 * Orchestrates KMS, IAM, and S3 components across multiple regions
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { KMSStack } from './kms-stack.mjs';
import { IAMStack } from './iam-stack.mjs';
import { S3Stack } from './s3-stack.mjs';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod'). Defaults to 'dev' if not provided.
 * @property {Object<string, string>} [tags] - Optional default tags to apply to resources.
 */

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates secure infrastructure components including:
 * - Multi-region KMS encryption keys
 * - S3 buckets with comprehensive security controls
 * - IAM roles with least privilege access
 * - AWS Access Analyzer integration
 */
export class TapStack extends pulumi.ComponentResource {
  /**
   * Creates a new TapStack component.
   * @param {string} name - The logical name of this Pulumi component.
   * @param {TapStackArgs} args - Configuration arguments including environment suffix and tags.
   * @param {pulumi.ResourceOptions} [opts] - Pulumi options.
   */
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const regions = ['us-west-2', 'eu-central-1'];
    const tags = {
      Project: 'TAP',
      Environment: environmentSuffix,
      SecurityLevel: 'High',
      ...args.tags || {},
    };

    // Create IAM stack (global resources)
    const iamStack = new IAMStack('tap-iam', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create regional resources
    const regionalResources = {};
    
    for (const region of regions) {
      // Create provider for each region
      const provider = new aws.Provider(`provider-${region}`, {
        region: region,
      });

      // Create KMS stack for each region
      const kmsStack = new KMSStack(`tap-kms-${region}`, {
        region,
        environmentSuffix,
        tags,
      }, { parent: this, provider });

      // Create S3 stack for each region
      const s3Stack = new S3Stack(`tap-s3-${region}`, {
        region,
        kmsKeyId: kmsStack.s3Key.keyId,
        environmentSuffix,
        tags,
      }, { parent: this, provider });

      regionalResources[region] = {
        kms: kmsStack,
        s3: s3Stack,
        provider,
      };
    }

    // Store regional resources
    this.regionalResources = regionalResources;
    this.iamStack = iamStack;

    this.registerOutputs({
      iamRoleArn: iamStack.roleArn,
      accessAnalyzerArn: iamStack.accessAnalyzerArn,
      regionalResources: Object.fromEntries(
        Object.entries(regionalResources).map(([region, resources]) => [
          region,
          {
            kmsKeyArn: resources.kms.keyArn,
            s3BucketArn: resources.s3.bucketArn,
          }
        ])
      ),
    });
  }
}

