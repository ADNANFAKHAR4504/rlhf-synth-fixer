import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcArgs {
  cidrBlock: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  tags?: Record<string, string>;
  name: string;
}

export interface VpcResult {
  vpc: aws.ec2.Vpc;
  vpcId: pulumi.Output<string>;
  cidrBlock: pulumi.Output<string>;
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly vpcId: pulumi.Output<string>;
  public readonly cidrBlock: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:VpcComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.cidrBlock,
        enableDnsHostnames: args.enableDnsHostnames ?? true,
        enableDnsSupport: args.enableDnsSupport ?? true,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.vpcId = this.vpc.id;
    this.cidrBlock = this.vpc.cidrBlock;

    this.registerOutputs({
      vpc: this.vpc,
      vpcId: this.vpcId,
      cidrBlock: this.cidrBlock,
    });
  }
}

export function createVpc(
  name: string,
  args: VpcArgs,
  opts?: pulumi.ComponentResourceOptions
): VpcResult {
  const vpcComponent = new VpcComponent(name, args, opts);
  return {
    vpc: vpcComponent.vpc,
    vpcId: vpcComponent.vpcId,
    cidrBlock: vpcComponent.cidrBlock,
  };
}
