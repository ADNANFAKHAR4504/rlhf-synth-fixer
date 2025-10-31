/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of the ContentHostingStack component
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { ContentHostingStack } from './content-hosting-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'staging', 'prod').
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
 * This component orchestrates the instantiation of the ContentHostingStack
 * for multi-environment static content hosting with CloudFront CDN.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly distributionDomainName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Instantiate the ContentHostingStack component
    const contentHosting = new ContentHostingStack(
      'content-hosting',
      {
        environmentSuffix: environmentSuffix,
        projectName: 'myapp',
        domainName: 'myapp.com',
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs from ContentHostingStack
    this.bucketName = contentHosting.bucketName;
    this.distributionUrl = contentHosting.distributionUrl;
    this.distributionDomainName = contentHosting.distributionDomainName;

    // Register the outputs of this component
    this.registerOutputs({
      bucketName: this.bucketName,
      distributionUrl: this.distributionUrl,
      distributionDomainName: this.distributionDomainName,
    });
  }
}
