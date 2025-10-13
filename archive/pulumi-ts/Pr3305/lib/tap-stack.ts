/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for static website hosting infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { StaticWebsiteStack } from './static-website-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly websiteUrl: pulumi.Output<string>;
  public readonly cloudfrontDomain: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create the static website infrastructure
    const staticWebsite = new StaticWebsiteStack(
      'static-website',
      {
        environmentSuffix: environmentSuffix,
        domainName: `example-${environmentSuffix}.com`,
        tags: tags,
      },
      { parent: this }
    );

    // Expose outputs
    this.websiteUrl = staticWebsite.websiteUrl;
    this.cloudfrontDomain = staticWebsite.cloudfrontDomain;
    this.s3BucketName = staticWebsite.s3BucketName;

    this.registerOutputs({
      websiteUrl: this.websiteUrl,
      cloudfrontDomain: this.cloudfrontDomain,
      s3BucketName: this.s3BucketName,
    });
  }
}
