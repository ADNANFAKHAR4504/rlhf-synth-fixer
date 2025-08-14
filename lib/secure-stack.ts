/**
 * secure-stack.ts
 *
 * This module defines the SecureStack class, which contains all the secure infrastructure
 * components for the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of all resource-specific components including:
 * - KMS encryption keys
 * - VPC and networking components
 * - IAM roles and policies
 * - S3 buckets with security configurations
 * - Security groups
 * - RDS database with encryption
 * - EC2 instances with security hardening
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Import nested stacks
import { Ec2Stack } from './stacks/ec2-stack';
import { IamStack } from './stacks/iam-stack';
import { KmsStack } from './stacks/kms-stack';
import { RdsStack } from './stacks/rds-stack';
import { S3Stack } from './stacks/s3-stack';
import { SecurityGroupStack } from './stacks/security-group-stack';
import { VpcStack } from './stacks/vpc-stack';

/**
 * SecureStackArgs defines the input arguments for the SecureStack Pulumi component.
 */
export interface SecureStackArgs {
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
 * SecureStack represents the main secure infrastructure component for the TAP project.
 *
 * This component provisions a complete secure AWS infrastructure including:
 * - Encryption keys (KMS)
 * - Network isolation (VPC, subnets, security groups)
 * - Identity and access management (IAM)
 * - Secure storage (S3 with encryption)
 * - Database with encryption (RDS)
 * - Hardened compute instances (EC2)
 */
export class SecureStack extends pulumi.ComponentResource {
  // KMS outputs
  public readonly mainKmsKeyId: pulumi.Output<string>;
  public readonly mainKmsKeyArn: pulumi.Output<string>;
  public readonly rdsKmsKeyArn: pulumi.Output<string>;
  public readonly mainKmsKeyAlias: pulumi.Output<string>;
  public readonly rdsKmsKeyAlias: pulumi.Output<string>;

  // VPC outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;

  // S3 outputs
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;

  // RDS outputs
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;

  // EC2 outputs
  public readonly webInstanceId: pulumi.Output<string>;
  public readonly webInstancePrivateIp: pulumi.Output<string>;

  // IAM outputs
  public readonly ec2InstanceProfileName: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;

  constructor(name: string, args: SecureStackArgs, opts?: ResourceOptions) {
    super('tap:secure:SecureStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Create KMS keys for encryption
    const kmsStack = new KmsStack(
      `tap-kms-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Create VPC and networking components
    const vpcStack = new VpcStack(
      `tap-vpc-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        vpcCidr: args.vpcCidr,
      },
      { parent: this }
    );

    // 3. Create IAM roles and policies
    const iamStack = new IamStack(
      `tap-iam-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 4. Create S3 buckets with encryption
    const s3Stack = new S3Stack(
      `tap-s3-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        mainKmsKeyArn: kmsStack.mainKeyArn,
      },
      { parent: this }
    );

    // 5. Create security groups
    const securityGroupStack = new SecurityGroupStack(
      `tap-security-group-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        vpcId: vpcStack.vpcId,
      },
      { parent: this }
    );

    // 6. Create RDS database with encryption
    const rdsStack = new RdsStack(
      `tap-rds-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        privateSubnetIds: vpcStack.privateSubnetIds,
        dbSecurityGroupId: securityGroupStack.dbSecurityGroupId,
        rdsKmsKeyArn: kmsStack.rdsKeyArn,
        instanceClass: args.dbInstanceClass,
      },
      { parent: this }
    );

    // 7. Create EC2 instances with security hardening
    const ec2Stack = new Ec2Stack(
      `tap-ec2-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        privateSubnetIds: vpcStack.privateSubnetIds,
        webSecurityGroupId: securityGroupStack.webSecurityGroupId,
        ec2InstanceProfileName: iamStack.ec2InstanceProfileName,
        mainKmsKeyArn: kmsStack.mainKeyArn,
        instanceType: args.instanceType,
        enableKeyPairs: args.enableKeyPairs,
      },
      { parent: this }
    );

    // Export outputs
    this.mainKmsKeyId = kmsStack.mainKeyId;
    this.mainKmsKeyArn = kmsStack.mainKeyArn;
    this.rdsKmsKeyArn = kmsStack.rdsKeyArn;
    this.mainKmsKeyAlias = kmsStack.mainKeyAlias;
    this.rdsKmsKeyAlias = kmsStack.rdsKeyAlias;
    this.vpcId = vpcStack.vpcId;
    this.privateSubnetIds = vpcStack.privateSubnetIds;
    this.dataBucketName = s3Stack.dataBucketName;
    this.logsBucketName = s3Stack.logsBucketName;
    this.databaseEndpoint = rdsStack.dbInstanceEndpoint;
    this.dbSubnetGroupName = rdsStack.dbSubnetGroupName;
    this.webInstanceId = ec2Stack.instanceId;
    this.webInstancePrivateIp = ec2Stack.privateIp;
    this.ec2InstanceProfileName = iamStack.ec2InstanceProfileName;
    this.ec2RoleName = iamStack.ec2RoleName;

    // Register outputs with the component
    this.registerOutputs({
      vpcId: this.vpcId,
      dataBucketName: this.dataBucketName,
      logsBucketName: this.logsBucketName,
      databaseEndpoint: this.databaseEndpoint,
      dbSubnetGroupName: this.dbSubnetGroupName,
      webInstanceId: this.webInstanceId,
      webInstancePrivateIp: this.webInstancePrivateIp,
      mainKmsKeyAlias: this.mainKmsKeyAlias,
      rdsKmsKeyAlias: this.rdsKmsKeyAlias,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
      ec2RoleName: this.ec2RoleName,
    });
  }
}
