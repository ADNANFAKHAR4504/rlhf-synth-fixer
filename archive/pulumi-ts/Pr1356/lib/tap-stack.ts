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
import { SecureWebAppStack } from './resource';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'Production' if not provided.
   */
  environment?: string;

  /**
   * Owner tag for resources.
   * Defaults to 'DevOps' if not provided.
   */
  owner?: string;

  /**
   * Domain name for Route 53 configuration (optional).
   */
  domainName?: string;

  /**
   * CIDR block for SSH access restriction.
   * Defaults to '203.0.113.0/24' if not provided.
   */
  allowedSshCidr?: string;

  /**
   * AWS region for deployment.
   * Defaults to 'us-west-1' if not provided.
   */
  region?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of the SecureWebAppStack
 * and manages the configuration and outputs.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly secureWebApp: SecureWebAppStack;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments for the secure web application.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Set default values
    const environment = args.environment || 'Production';
    const owner = args.owner || 'DevOps';
    const allowedSshCidr = args.allowedSshCidr || '203.0.113.0/24';
    const region = args.region || 'us-west-1';

    // Instantiate the SecureWebAppStack
    this.secureWebApp = new SecureWebAppStack(
      'secure-web-app',
      {
        environment,
        owner,
        domainName: args.domainName,
        allowedSshCidr,
        region,
      },
      { parent: this }
    );

    // Register the outputs from the secure web app stack
    this.registerOutputs({
      vpcId: this.secureWebApp.vpc.id,
      publicSubnetId: this.secureWebApp.publicSubnet.id,
      privateSubnetId: this.secureWebApp.privateSubnet.id,
      rdsEndpoint: this.secureWebApp.rdsInstance.endpoint,
      ec2PublicIp: this.secureWebApp.ec2Instance.publicIp,
      albDnsName: this.secureWebApp.alb.dnsName,
      s3BucketName: this.secureWebApp.s3Bucket.bucket,
      lambdaFunctionName: this.secureWebApp.lambdaFunction.name,
      kmsKeyId: this.secureWebApp.kmsKey.keyId,
      ...(this.secureWebApp.route53Record && {
        domainName: this.secureWebApp.route53Record.name,
      }),
    });
  }
}
