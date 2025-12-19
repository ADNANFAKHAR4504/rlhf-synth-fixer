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
// import * as aws from '@pulumi/aws'; // Removed as it's only used in example code

// Import your nested stacks here. For example:
// import { DynamoDBStack } from "./dynamodb-stack";
import { WebAppInfrastructure } from './webapp-infrastructure';

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
  // Example of a public property for a nested resource's output.
  // public readonly table: pulumi.Output<string>;

  // WebApp Infrastructure outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly databaseSecurityGroupId: pulumi.Output<string>;
  public readonly webServerInstanceProfileName: pulumi.Output<string>;
  public readonly databaseSubnetGroupName: pulumi.Output<string>;
  public readonly applicationDataBucketName: pulumi.Output<string>;
  public readonly backupBucketName: pulumi.Output<string>;
  public readonly region: string;
  public readonly webServerRoleName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // The following variables are commented out as they are only used in example code.
    // To use them, uncomment the lines below and the corresponding example code.
    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // --- Instantiate Nested Components Here ---
    // This is where you would create instances of your other component resources,
    // passing them the necessary configuration.

    // Instantiate WebApp Infrastructure
    const webAppInfrastructure = new WebAppInfrastructure(
      'webapp-infra',
      {
        environmentSuffix: environmentSuffix,
        region: 'us-west-2',
        tags: tags,
      },
      { parent: this }
    );

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

    // Expose WebApp Infrastructure outputs
    this.vpcId = webAppInfrastructure.vpcId;
    this.publicSubnetIds = webAppInfrastructure.publicSubnetIds;
    this.privateSubnetIds = webAppInfrastructure.privateSubnetIds;
    this.webSecurityGroupId = webAppInfrastructure.webSecurityGroupId;
    this.databaseSecurityGroupId = webAppInfrastructure.databaseSecurityGroupId;
    this.webServerInstanceProfileName =
      webAppInfrastructure.webServerInstanceProfileName;
    this.databaseSubnetGroupName = webAppInfrastructure.databaseSubnetGroupName;
    this.applicationDataBucketName =
      webAppInfrastructure.applicationDataBucketName;
    this.backupBucketName = webAppInfrastructure.backupBucketName;
    this.region = webAppInfrastructure.region;
    this.webServerRoleName = webAppInfrastructure.webServerRoleName;

    // Register the outputs of this component.
    this.registerOutputs({
      // table: this.table,
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      webSecurityGroupId: this.webSecurityGroupId,
      databaseSecurityGroupId: this.databaseSecurityGroupId,
      webServerInstanceProfileName: this.webServerInstanceProfileName,
      databaseSubnetGroupName: this.databaseSubnetGroupName,
      applicationDataBucketName: this.applicationDataBucketName,
      backupBucketName: this.backupBucketName,
      region: this.region,
      webServerRoleName: this.webServerRoleName,
    });
  }
}
