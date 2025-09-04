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
import { ScalableWebAppInfrastructure } from './scalable-web-app-infrastructure';

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
   * Optional state bucket for storing state files.
   */
  stateBucket?: string;
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
  public readonly albDnsName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly cloudFrontDomain: pulumi.Output<string>;
  public readonly launchTemplateName: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;
  public readonly albLogsBucketName: pulumi.Output<string>;
  public readonly secretName: pulumi.Output<string>;
  public readonly vpcFlowLogsGroupName: pulumi.Output<string>;
  public readonly secretsKmsKeyId: pulumi.Output<string>;
  public readonly rdsKmsKeyId: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;
  public readonly rdsSubnetGroupName: pulumi.Output<string>;

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

    // Example of instantiating a DynamoDBStack component:
    // const dynamoDBStack = new DynamoDBStack("tap-dynamodb", {
    //   environmentSuffix: environmentSuffix,
    //   tags: tags,
    // }, { parent: this });

    // Instantiate the ScalableWebAppInfrastructure
    const scalableWebAppInfrastructure = new ScalableWebAppInfrastructure(
      'scalable-web-app',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Example of creating a resource directly (for truly global resources only):
    // const bucket = new aws.s3.Bucket(`tap-global-bucket-${environmentSuffix}`, {
    //   tags: tags,
    // }, { parent: this });

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.
    // this.table = dynamoDBStack.table;
    this.albDnsName = scalableWebAppInfrastructure.albDnsName;
    this.vpcId = scalableWebAppInfrastructure.vpcId;
    this.rdsEndpoint = scalableWebAppInfrastructure.rdsEndpoint;
    this.autoScalingGroupName =
      scalableWebAppInfrastructure.autoScalingGroupName;
    this.cloudFrontDomain = scalableWebAppInfrastructure.cloudFrontDomain;
    this.launchTemplateName = scalableWebAppInfrastructure.launchTemplateName;
    this.targetGroupName = scalableWebAppInfrastructure.targetGroupName;
    this.albLogsBucketName = scalableWebAppInfrastructure.albLogsBucketName;
    this.secretName = scalableWebAppInfrastructure.secretName;
    this.vpcFlowLogsGroupName =
      scalableWebAppInfrastructure.vpcFlowLogsGroupName;
    this.secretsKmsKeyId = scalableWebAppInfrastructure.secretsKmsKeyId;
    this.rdsKmsKeyId = scalableWebAppInfrastructure.rdsKmsKeyId;
    this.ec2RoleName = scalableWebAppInfrastructure.ec2RoleName;
    this.rdsSubnetGroupName = scalableWebAppInfrastructure.rdsSubnetGroupName;

    // Register the outputs of this component.
    this.registerOutputs({
      // table: this.table,
      albDnsName: this.albDnsName,
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      autoScalingGroupName: this.autoScalingGroupName,
      cloudFrontDomain: this.cloudFrontDomain,
      launchTemplateName: this.launchTemplateName,
      targetGroupName: this.targetGroupName,
      albLogsBucketName: this.albLogsBucketName,
      secretName: this.secretName,
      vpcFlowLogsGroupName: this.vpcFlowLogsGroupName,
      secretsKmsKeyId: this.secretsKmsKeyId,
      rdsKmsKeyId: this.rdsKmsKeyId,
      ec2RoleName: this.ec2RoleName,
      rdsSubnetGroupName: this.rdsSubnetGroupName,
    });
  }
}
