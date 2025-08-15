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
 * - Use other components (e.g., SecureInfrastructure) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  // Public properties for nested resource outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly iamRoleArn: pulumi.Output<string>;
  public readonly instanceProfileName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly cloudtrailArn: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly availableAZs: pulumi.Output<string[]>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly guardDutyDetectorId: pulumi.Output<string>;
  public readonly configDeliveryChannelName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environment = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // --- Instantiate Nested Components Here ---
    // Create the secure infrastructure component
    const secureInfrastructure = new SecureInfrastructure(
      `secure-infrastructure-${environment}`,
      {
        environment: environment,
        tags: {
          ManagedBy: 'Pulumi',
          Component: 'SecureInfrastructure',
          ...tags, // Custom tags override defaults
        },
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    // Make outputs from the secure infrastructure component available as outputs of this main stack
    this.vpcId = secureInfrastructure.vpcId;
    this.publicSubnetIds = secureInfrastructure.publicSubnetIds;
    this.privateSubnetIds = secureInfrastructure.privateSubnetIds;
    this.webSecurityGroupId = secureInfrastructure.webSecurityGroupId;
    this.dbSecurityGroupId = secureInfrastructure.dbSecurityGroupId;
    this.iamRoleArn = secureInfrastructure.iamRoleArn;
    this.instanceProfileName = secureInfrastructure.instanceProfileName;
    this.dynamoTableName = secureInfrastructure.dynamoTableName;
    this.kmsKeyId = secureInfrastructure.kmsKeyId;
    this.kmsKeyArn = secureInfrastructure.kmsKeyArn;
    this.cloudtrailArn = secureInfrastructure.cloudtrailArn;
    this.s3BucketName = secureInfrastructure.s3BucketName;
    this.availableAZs = secureInfrastructure.availableAZs;
    this.snsTopicArn = secureInfrastructure.snsTopicArn;
    this.guardDutyDetectorId = secureInfrastructure.guardDutyDetectorId;
    this.configDeliveryChannelName =
      secureInfrastructure.configDeliveryChannelName;

    // Register the outputs of this component.
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      webSecurityGroupId: this.webSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
      iamRoleArn: this.iamRoleArn,
      instanceProfileName: this.instanceProfileName,
      dynamoTableName: this.dynamoTableName,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      cloudtrailArn: this.cloudtrailArn,
      s3BucketName: this.s3BucketName,
      availableAZs: this.availableAZs,
      snsTopicArn: this.snsTopicArn,
      guardDutyDetectorId: this.guardDutyDetectorId,
      configDeliveryChannelName: this.configDeliveryChannelName,
    });
  }
}
