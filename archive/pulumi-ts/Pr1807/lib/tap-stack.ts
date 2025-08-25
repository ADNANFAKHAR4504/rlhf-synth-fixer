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
import { SecureStack } from './secure-stack';

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
  tags?: Record<string, string>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly secureStack: SecureStack;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Input validation
    if (!args) {
      args = {};
    }

    const environment = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Validate environment suffix
    if (typeof environment !== 'string' || environment.trim() === '') {
      throw new Error('Environment suffix must be a non-empty string');
    }

    // Create the secure infrastructure stack
    this.secureStack = new SecureStack(
      'secure-infrastructure',
      {
        environment,
        tags,
      },
      { parent: this }
    );

    // Register the outputs of this component
    this.registerOutputs();
  }
}
