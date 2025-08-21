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
import { ProductionWebAppStack } from './production-web-app-stack';

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
   * AWS region where resources should be deployed.
   * Defaults to 'us-west-2' if not provided.
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

  // Production Web App Stack outputs
  public readonly webAppStack: ProductionWebAppStack;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly rdsIdentifier: pulumi.Output<string>;
  public readonly launchTemplateName: pulumi.Output<string>;

  // Additional outputs for integration testing
  public readonly albName: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;
  public readonly ec2InstanceProfileName: pulumi.Output<string>;
  public readonly ec2PolicyName: pulumi.Output<string>;
  public readonly rdsInstanceId: pulumi.Output<string>;
  public readonly rdsKmsKeyId: pulumi.Output<string>;
  public readonly rdsKmsKeyAlias: pulumi.Output<string>;
  public readonly projectName: string;
  public readonly environment: string;
  public readonly resourcePrefix: string;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.region || 'us-west-2'; // Default region
    const tags = args.tags || {};

    // --- Instantiate Nested Components Here ---
    // This is where you would create instances of your other component resources,
    // passing them the necessary configuration.

    // Instantiate the Production Web App Stack
    this.webAppStack = new ProductionWebAppStack(
      'production-web-app',
      {
        environment: environmentSuffix, // Pass environmentSuffix as environment
        projectName: 'tap', // Clean project name without environment suffix
        region: region, // Pass the configurable region
        tags: {
          ...tags,
          DeploymentRegion: region, // Add region to tags for tracking
        },
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
    this.albDnsName = this.webAppStack.albDnsName;
    this.rdsEndpoint = this.webAppStack.rdsEndpoint;
    this.s3BucketName = this.webAppStack.s3BucketName;
    this.rdsIdentifier = this.webAppStack.rdsIdentifier;
    this.launchTemplateName = this.webAppStack.launchTemplateName;

    // Additional outputs for integration testing
    this.albName = this.webAppStack.loadBalancer.name;
    this.autoScalingGroupName = this.webAppStack.autoScalingGroup.name;
    this.ec2RoleName = this.webAppStack.ec2Role.name;
    this.ec2InstanceProfileName = this.webAppStack.ec2InstanceProfile.name;
    this.ec2PolicyName = this.webAppStack.ec2S3Policy.name;
    this.rdsInstanceId = this.webAppStack.database.id;
    this.rdsKmsKeyId = this.webAppStack.rdsKmsKey.keyId;
    this.rdsKmsKeyAlias = this.webAppStack.rdsKmsAlias.name;
    this.projectName = 'tap';
    this.environment = environmentSuffix;
    this.resourcePrefix = `tap-${environmentSuffix}`;

    // Register the outputs of this component.
    this.registerOutputs({
      // Basic infrastructure
      albDnsName: this.albDnsName,
      rdsEndpoint: this.rdsEndpoint,
      s3BucketName: this.s3BucketName,
      rdsIdentifier: this.rdsIdentifier,
      launchTemplateName: this.launchTemplateName,
      vpcId: this.webAppStack.vpc.id,
      publicSubnetIds: this.webAppStack.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.webAppStack.privateSubnets.map(
        subnet => subnet.id
      ),

      // Additional outputs for integration testing
      albName: this.albName,
      autoScalingGroupName: this.autoScalingGroupName,
      ec2RoleName: this.ec2RoleName,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
      ec2PolicyName: this.ec2PolicyName,
      rdsInstanceId: this.rdsInstanceId,
      rdsKmsKeyId: this.rdsKmsKeyId,
      rdsKmsKeyAlias: this.rdsKmsKeyAlias,
      projectName: this.projectName,
      environment: this.environment,
      resourcePrefix: this.resourcePrefix,
    });
  }
}
