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
import { SecureInfrastructure } from './secure-infrastructure';

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
   * AWS region for resource deployment.
   * Defaults to 'ap-south-1' if not provided.
   */
  awsRegion?: string;

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
  public infrastructure: SecureInfrastructure;

  // Public outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly appBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly vpcFlowLogId: pulumi.Output<string>;
  public readonly apiSecretName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs = {}, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const region = args.awsRegion || 'ap-south-1';
    const environment =
      args.environmentSuffix !== undefined ? args.environmentSuffix : 'dev';
    const defaultTags = {
      Project: 'MyApp',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
      ...((args.tags as any) || {}),
    };

    this.infrastructure = new SecureInfrastructure(
      region,
      environment,
      defaultTags
    );

    // Initialize outputs
    this.vpcId = this.infrastructure.vpcId;
    this.appBucketName = this.infrastructure.appBucketName;
    this.logsBucketName = this.infrastructure.logsBucketName;
    this.dbEndpoint = this.infrastructure.dbEndpoint;
    this.kmsKeyId = this.infrastructure.kmsKeyId;
    this.webSecurityGroupId = this.infrastructure.webSecurityGroupId;
    this.dbSecurityGroupId = this.infrastructure.dbSecurityGroupId;
    this.cloudFrontDomainName = this.infrastructure.cloudFrontDomainName;
    this.vpcFlowLogId = this.infrastructure.vpcFlowLogId;
    this.apiSecretName = this.infrastructure.apiSecretName;

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.vpcId,
      appBucketName: this.appBucketName,
      logsBucketName: this.logsBucketName,
      dbEndpoint: this.dbEndpoint,
      kmsKeyId: this.kmsKeyId,
      webSecurityGroupId: this.webSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
      cloudFrontDomainName: this.cloudFrontDomainName,
      vpcFlowLogId: this.vpcFlowLogId,
      apiSecretName: this.apiSecretName,
    });
  }
}
