/**
 * vpc-helper.ts
 *
 * Helper module to create VPCs for testing VPC peering infrastructure
 * These VPCs are only needed for QA testing and validation
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcHelperArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export interface VpcHelperOutputs {
  paymentVpcId: pulumi.Output<string>;
  auditVpcId: pulumi.Output<string>;
  paymentVpcCidr: string;
  auditVpcCidr: string;
  paymentAccountId: pulumi.Output<string>;
  auditAccountId: pulumi.Output<string>;
}

/**
 * Helper class to create VPCs for testing VPC peering
 * In production, these VPCs would already exist
 */
export class VpcHelper extends pulumi.ComponentResource {
  public readonly paymentVpc: aws.ec2.Vpc;
  public readonly auditVpc: aws.ec2.Vpc;
  public readonly paymentVpcId: pulumi.Output<string>;
  public readonly auditVpcId: pulumi.Output<string>;
  public readonly paymentVpcCidr: string = '10.100.0.0/16';
  public readonly auditVpcCidr: string = '10.200.0.0/16';
  public readonly paymentAccountId: pulumi.Output<string>;
  public readonly auditAccountId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcHelperArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:helper:VpcHelper', name, args, opts);

    const environmentSuffix = args.environmentSuffix;

    // Get current account ID
    const caller = aws.getCallerIdentity();
    this.paymentAccountId = pulumi.output(caller).accountId;
    this.auditAccountId = pulumi.output(caller).accountId;

    const defaultTags = pulumi.output(args.tags || {});

    // Create Payment VPC
    this.paymentVpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: this.paymentVpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `payment-vpc-${environmentSuffix}`,
          BusinessUnit: 'Payment',
        })),
      },
      { parent: this }
    );

    // Create Audit VPC
    this.auditVpc = new aws.ec2.Vpc(
      `audit-vpc-${environmentSuffix}`,
      {
        cidrBlock: this.auditVpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `audit-vpc-${environmentSuffix}`,
          BusinessUnit: 'Audit',
        })),
      },
      { parent: this }
    );

    // Create private subnets for payment VPC (3 AZs)
    for (let i = 0; i < 3; i++) {
      new aws.ec2.Subnet(
        `payment-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.paymentVpc.id,
          cidrBlock: `10.100.${i}.0/24`,
          availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`, // us-east-1a, 1b, 1c
          tags: defaultTags.apply(tags => ({
            ...tags,
            Name: `payment-private-subnet-${i}-${environmentSuffix}`,
            Type: 'Private',
          })),
        },
        { parent: this }
      );
    }

    // Create private subnets for audit VPC (3 AZs)
    for (let i = 0; i < 3; i++) {
      new aws.ec2.Subnet(
        `audit-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.auditVpc.id,
          cidrBlock: `10.200.${i}.0/24`,
          availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`, // us-east-1a, 1b, 1c
          tags: defaultTags.apply(tags => ({
            ...tags,
            Name: `audit-private-subnet-${i}-${environmentSuffix}`,
            Type: 'Private',
          })),
        },
        { parent: this }
      );
    }

    this.paymentVpcId = this.paymentVpc.id;
    this.auditVpcId = this.auditVpc.id;

    this.registerOutputs({
      paymentVpcId: this.paymentVpcId,
      auditVpcId: this.auditVpcId,
      paymentVpcCidr: this.paymentVpcCidr,
      auditVpcCidr: this.auditVpcCidr,
      paymentAccountId: this.paymentAccountId,
      auditAccountId: this.auditAccountId,
    });
  }
}
