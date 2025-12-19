import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface InternetGatewayArgs {
  vpcId: pulumi.Input<string>;
  tags?: Record<string, string>;
  name: string;
}

export interface InternetGatewayResult {
  internetGateway: aws.ec2.InternetGateway;
  internetGatewayId: pulumi.Output<string>;
  vpcAttachment: aws.ec2.InternetGatewayAttachment;
}

export class InternetGatewayComponent extends pulumi.ComponentResource {
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly internetGatewayId: pulumi.Output<string>;
  public readonly vpcAttachment: aws.ec2.InternetGatewayAttachment;

  constructor(
    name: string,
    args: InternetGatewayArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:InternetGatewayComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.vpcAttachment = new aws.ec2.InternetGatewayAttachment(
      `${name}-igw-attachment`,
      {
        vpcId: args.vpcId,
        internetGatewayId: this.internetGateway.id,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.internetGatewayId = this.internetGateway.id;

    this.registerOutputs({
      internetGateway: this.internetGateway,
      internetGatewayId: this.internetGatewayId,
      vpcAttachment: this.vpcAttachment,
    });
  }
}

export function createInternetGateway(
  name: string,
  args: InternetGatewayArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): InternetGatewayResult {
  const igwComponent = new InternetGatewayComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    internetGateway: igwComponent.internetGateway,
    internetGatewayId: igwComponent.internetGatewayId,
    vpcAttachment: igwComponent.vpcAttachment,
  };
}
