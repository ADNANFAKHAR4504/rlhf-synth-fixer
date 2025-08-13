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
import { SecureCompliantInfra } from './secure-compliant-infra';

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
   * Project name for resource naming.
   */
  projectName?: string;

  /**
   * CIDR block for SSH access restriction.
   */
  allowedSshCidr?: string;

  /**
   * VPC CIDR block.
   */
  vpcCidr?: string;

  /**
   * AWS regions for multi-region deployment.
   */
  regions?: string[];
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

  // Secure compliant infrastructure instance
  public readonly secureInfra: SecureCompliantInfra;

  // Expose infrastructure outputs for backward compatibility
  public readonly vpcIds: typeof this.secureInfra.vpcIds;
  public readonly ec2InstanceIds: typeof this.secureInfra.ec2InstanceIds;
  public readonly rdsEndpoints: typeof this.secureInfra.rdsEndpoints;
  public readonly cloudtrailArn: typeof this.secureInfra.cloudtrailArn;
  public readonly webAclArn: typeof this.secureInfra.webAclArn;
  public readonly cloudtrailBucketName: typeof this.secureInfra.cloudtrailBucketName;
  public readonly kmsKeyArns: typeof this.secureInfra.kmsKeyArns;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // --- Instantiate Secure Compliant Infrastructure ---
    this.secureInfra = new SecureCompliantInfra(
      'secure-infra',
      {
        projectName: args.projectName || 'webapp',
        environment: environmentSuffix,
        allowedSshCidr: args.allowedSshCidr || '203.0.113.0/24',
        vpcCidr: args.vpcCidr || '10.0.0.0/16',
        regions: args.regions || ['us-west-1', 'ap-south-1'],
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    // Make outputs from your nested components available as outputs of this main stack.
    // this.table = dynamoDBStack.table;

    // Initialize secure compliant infrastructure outputs for backward compatibility
    this.vpcIds = this.secureInfra.vpcIds;
    this.ec2InstanceIds = this.secureInfra.ec2InstanceIds;
    this.rdsEndpoints = this.secureInfra.rdsEndpoints;
    this.cloudtrailArn = this.secureInfra.cloudtrailArn;
    this.webAclArn = this.secureInfra.webAclArn;
    this.cloudtrailBucketName = this.secureInfra.cloudtrailBucketName;
    this.kmsKeyArns = this.secureInfra.kmsKeyArns;

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
