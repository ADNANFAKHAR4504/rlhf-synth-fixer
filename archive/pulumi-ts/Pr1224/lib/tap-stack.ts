/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It serves as the entry point that initializes the SecureStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific
 * settings, tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecureStack } from './secure-stack';

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
   * VPC CIDR block
   */
  vpcCidr?: string;

  /**
   * EC2 instance type
   */
  instanceType?: string;

  /**
   * RDS instance class
   */
  dbInstanceClass?: string;

  /**
   * Whether to enable key pairs for EC2 instances
   */
  enableKeyPairs?: boolean;
}

/**
 * TapStack represents the main Pulumi component resource for the TAP project.
 *
 * This component acts as the entry point and orchestrates the creation of the
 * SecureStack which contains all the secure infrastructure components.
 */
export class TapStack extends pulumi.ComponentResource {
  // Expose SecureStack outputs
  public readonly mainKmsKeyId: pulumi.Output<string>;
  public readonly mainKmsKeyArn: pulumi.Output<string>;
  public readonly rdsKmsKeyArn: pulumi.Output<string>;
  public readonly mainKmsKeyAlias: pulumi.Output<string>;
  public readonly rdsKmsKeyAlias: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;
  public readonly webInstanceId: pulumi.Output<string>;
  public readonly webInstancePrivateIp: pulumi.Output<string>;
  public readonly environmentSuffix: pulumi.Output<string>;
  public readonly ec2InstanceProfileName: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create the secure infrastructure stack
    const secureStack = new SecureStack(
      `tap-secure-infra-${environmentSuffix}`,
      {
        environmentSuffix: args.environmentSuffix,
        tags: args.tags,
        vpcCidr: args.vpcCidr,
        instanceType: args.instanceType,
        dbInstanceClass: args.dbInstanceClass,
        enableKeyPairs: args.enableKeyPairs,
      },
      { parent: this }
    );

    // Expose all outputs from the secure stack
    this.mainKmsKeyId = secureStack.mainKmsKeyId;
    this.mainKmsKeyArn = secureStack.mainKmsKeyArn;
    this.rdsKmsKeyArn = secureStack.rdsKmsKeyArn;
    this.mainKmsKeyAlias = secureStack.mainKmsKeyAlias;
    this.rdsKmsKeyAlias = secureStack.rdsKmsKeyAlias;
    this.vpcId = secureStack.vpcId;
    this.privateSubnetIds = secureStack.privateSubnetIds;
    this.dataBucketName = secureStack.dataBucketName;
    this.logsBucketName = secureStack.logsBucketName;
    this.databaseEndpoint = secureStack.databaseEndpoint;
    this.dbSubnetGroupName = secureStack.dbSubnetGroupName;
    this.webInstanceId = secureStack.webInstanceId;
    this.webInstancePrivateIp = secureStack.webInstancePrivateIp;
    this.environmentSuffix = pulumi.output(environmentSuffix);
    this.ec2InstanceProfileName = secureStack.ec2InstanceProfileName;
    this.ec2RoleName = secureStack.ec2RoleName;

    // Register outputs with the component
    this.registerOutputs({
      vpcId: this.vpcId,
      dataBucketName: this.dataBucketName,
      logsBucketName: this.logsBucketName,
      databaseEndpoint: this.databaseEndpoint,
      dbSubnetGroupName: this.dbSubnetGroupName,
      webInstanceId: this.webInstanceId,
      webInstancePrivateIp: this.webInstancePrivateIp,
      environmentSuffix: this.environmentSuffix,
      mainKmsKeyAlias: this.mainKmsKeyAlias,
      rdsKmsKeyAlias: this.rdsKmsKeyAlias,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
      ec2RoleName: this.ec2RoleName,
    });
  }
}
