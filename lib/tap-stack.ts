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

// Import nested stacks
import { KmsStack } from './stacks/kms-stack';
import { VpcStack } from './stacks/vpc-stack';
import { IamStack } from './stacks/iam-stack';
import { S3Stack } from './stacks/s3-stack';
import { SecurityGroupStack } from './stacks/security-group-stack';
import { RdsStack } from './stacks/rds-stack';
import { Ec2Stack } from './stacks/ec2-stack';

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
   * Enable key pairs for EC2 instances
   */
  enableKeyPairs?: boolean;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  // Infrastructure outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly webInstanceId: pulumi.Output<string>;
  public readonly webInstancePrivateIp: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args?: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const vpcCidr = args?.vpcCidr || '10.0.0.0/16';
    const instanceType = args?.instanceType || 't3.micro';
    const dbInstanceClass = args?.dbInstanceClass || 'db.t3.micro';
    const enableKeyPairs = args?.enableKeyPairs || false;
    const tags = args?.tags || {};

    // --- Instantiate Nested Components ---

    // 1. Create KMS keys for encryption
    const kmsStack = new KmsStack(
      'tap-kms',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Create VPC infrastructure
    const vpcStack = new VpcStack(
      'tap-vpc',
      {
        environmentSuffix,
        vpcCidr,
        tags,
      },
      { parent: this }
    );

    // 3. Create IAM roles and policies
    const iamStack = new IamStack(
      'tap-iam',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 4. Create S3 buckets with encryption
    const s3Stack = new S3Stack(
      'tap-s3',
      {
        environmentSuffix,
        mainKmsKeyArn: kmsStack.mainKeyArn,
        tags,
      },
      { parent: this }
    );

    // 5. Create Security Groups with restrictive rules
    const securityGroupStack = new SecurityGroupStack(
      'tap-security-group',
      {
        environmentSuffix,
        vpcId: vpcStack.vpcId,
        tags,
      },
      { parent: this }
    );

    // 6. Create RDS instance with encryption
    const rdsStack = new RdsStack(
      'tap-rds',
      {
        environmentSuffix,
        privateSubnetIds: vpcStack.privateSubnetIds,
        dbSecurityGroupId: securityGroupStack.dbSecurityGroupId,
        rdsKmsKeyArn: kmsStack.rdsKeyArn,
        dbSecretArn:
          'arn:aws:secretsmanager:us-east-1:123456789012:secret:placeholder',
        instanceClass: dbInstanceClass,
        tags,
      },
      { parent: this }
    );

    // 7. Create EC2 instance with encrypted storage
    const ec2Stack = new Ec2Stack(
      'tap-ec2',
      {
        environmentSuffix,
        privateSubnetIds: vpcStack.privateSubnetIds,
        webSecurityGroupId: securityGroupStack.webSecurityGroupId,
        ec2InstanceProfileName: iamStack.ec2InstanceProfileName,
        mainKmsKeyArn: kmsStack.mainKeyArn,
        instanceType,
        enableKeyPairs,
        tags,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    this.vpcId = vpcStack.vpcId;
    this.dataBucketName = s3Stack.dataBucketName;
    this.logsBucketName = s3Stack.logsBucketName;
    this.databaseEndpoint = rdsStack.dbInstanceEndpoint;
    this.webInstanceId = ec2Stack.instanceId;
    this.webInstancePrivateIp = ec2Stack.privateIp;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      dataBucketName: this.dataBucketName,
      logsBucketName: this.logsBucketName,
      databaseEndpoint: this.databaseEndpoint,
      webInstanceId: this.webInstanceId,
      webInstancePrivateIp: this.webInstancePrivateIp,
    });
  }
}
