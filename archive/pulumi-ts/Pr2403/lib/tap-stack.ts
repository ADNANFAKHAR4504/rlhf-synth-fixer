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
import { InfrastructureStack } from './infrastructure-stack';

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
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albZoneId: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly webAclArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly albLogsBucketName: pulumi.Output<string>;
  public readonly cloudFrontLogsBucketName: pulumi.Output<string>;
  // Additional outputs for testing
  public readonly albArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly secondaryAutoScalingGroupName: pulumi.Output<string>;
  public readonly launchTemplateName: pulumi.Output<string>;
  public readonly ec2RoleArn: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly ec2SecurityGroupId: pulumi.Output<string>;
  public readonly cloudFrontDistributionId: pulumi.Output<string>;
  public readonly environment: pulumi.Output<string>;
  public readonly sanitizedName: pulumi.Output<string>;
  public readonly infrastructureStack: InfrastructureStack;

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

    // Example of creating a resource directly (for truly global resources only):
    // const bucket = new aws.s3.Bucket(`tap-global-bucket-${environmentSuffix}`, {
    //   tags: tags,
    // }, { parent: this });

    this.infrastructureStack = new InfrastructureStack(
      'tap-infrastructure',
      {
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // --- Expose Outputs from Infrastructure ---
    // Make outputs from infrastructure available as outputs of this main stack.
    // this.table = dynamoDBStack.table;
    this.vpcId = this.infrastructureStack.vpcId;
    this.publicSubnetIds = this.infrastructureStack.publicSubnetIds;
    this.privateSubnetIds = this.infrastructureStack.privateSubnetIds;
    this.albDnsName = this.infrastructureStack.albDnsName;
    this.albZoneId = this.infrastructureStack.albZoneId;
    this.cloudFrontDomainName = this.infrastructureStack.cloudFrontDomainName;
    this.dynamoTableName = this.infrastructureStack.dynamoTableName;
    this.secretArn = this.infrastructureStack.secretArn;
    this.kmsKeyId = this.infrastructureStack.kmsKeyId;
    this.kmsKeyArn = this.infrastructureStack.kmsKeyArn;
    this.webAclArn = this.infrastructureStack.webAclArn;
    this.logGroupName = this.infrastructureStack.logGroupName;
    this.albLogsBucketName = this.infrastructureStack.albLogsBucketName;
    this.cloudFrontLogsBucketName =
      this.infrastructureStack.cloudFrontLogsBucketName;
    // Additional outputs for testing
    this.albArn = this.infrastructureStack.albArn;
    this.targetGroupArn = this.infrastructureStack.targetGroupArn;
    this.autoScalingGroupName = this.infrastructureStack.autoScalingGroupName;
    this.secondaryAutoScalingGroupName =
      this.infrastructureStack.secondaryAutoScalingGroupName;
    this.launchTemplateName = this.infrastructureStack.launchTemplateName;
    this.ec2RoleArn = this.infrastructureStack.ec2RoleArn;
    this.albSecurityGroupId = this.infrastructureStack.albSecurityGroupId;
    this.ec2SecurityGroupId = this.infrastructureStack.ec2SecurityGroupId;
    this.cloudFrontDistributionId =
      this.infrastructureStack.cloudFrontDistributionId;
    this.environment = this.infrastructureStack.environment;
    this.sanitizedName = this.infrastructureStack.sanitizedName;

    // Register the outputs of this component.
    this.registerOutputs({
      // table: this.table,
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albDnsName: this.albDnsName,
      albZoneId: this.albZoneId,
      cloudFrontDomainName: this.cloudFrontDomainName,
      dynamoTableName: this.dynamoTableName,
      secretArn: this.secretArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      webAclArn: this.webAclArn,
      logGroupName: this.logGroupName,
      albLogsBucketName: this.albLogsBucketName,
      cloudFrontLogsBucketName: this.cloudFrontLogsBucketName,
      // Additional outputs for testing
      albArn: this.albArn,
      targetGroupArn: this.targetGroupArn,
      autoScalingGroupName: this.autoScalingGroupName,
      secondaryAutoScalingGroupName: this.secondaryAutoScalingGroupName,
      launchTemplateName: this.launchTemplateName,
      ec2RoleArn: this.ec2RoleArn,
      albSecurityGroupId: this.albSecurityGroupId,
      ec2SecurityGroupId: this.ec2SecurityGroupId,
      cloudFrontDistributionId: this.cloudFrontDistributionId,
      environment: this.environment,
      sanitizedName: this.sanitizedName,
    });
  }
}
