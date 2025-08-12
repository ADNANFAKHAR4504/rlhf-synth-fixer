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

// Import the secure compliant infrastructure
import * as secureInfra from './secure-compliant-infra';

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

  // Secure compliant infrastructure outputs
  public readonly vpcIds: typeof secureInfra.vpcIds;
  public readonly ec2InstanceIds: typeof secureInfra.ec2InstanceIds;
  public readonly rdsEndpoints: typeof secureInfra.rdsEndpoints;
  public readonly cloudtrailArn: typeof secureInfra.cloudtrailArn;
  public readonly webAclArn: typeof secureInfra.webAclArn;
  public readonly cloudtrailBucketName: typeof secureInfra.cloudtrailBucketName;
  public readonly kmsKeyArns: typeof secureInfra.kmsKeyArns;

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
    // const environmentSuffix = args.environmentSuffix || 'dev';
    // const tags = args.tags || {};

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

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.
    // this.table = dynamoDBStack.table;

    // Initialize secure compliant infrastructure outputs
    this.vpcIds = secureInfra.vpcIds;
    this.ec2InstanceIds = secureInfra.ec2InstanceIds;
    this.rdsEndpoints = secureInfra.rdsEndpoints;
    this.cloudtrailArn = secureInfra.cloudtrailArn;
    this.webAclArn = secureInfra.webAclArn;
    this.cloudtrailBucketName = secureInfra.cloudtrailBucketName;
    this.kmsKeyArns = secureInfra.kmsKeyArns;

    // Register the outputs of this component.
    this.registerOutputs({
      // table: this.table,
      vpcIds: this.vpcIds,
      ec2InstanceIds: this.ec2InstanceIds,
      rdsEndpoints: this.rdsEndpoints,
      cloudtrailArn: this.cloudtrailArn,
      webAclArn: this.webAclArn,
      cloudtrailBucketName: this.cloudtrailBucketName,
      kmsKeyArns: this.kmsKeyArns,
    });
  }
}
