import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Define the arguments for the SecurityInfrastructure component
interface SecurityInfrastructureArgs {
  vpcId: pulumi.Input<string>;
  environment: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityInfrastructure extends pulumi.ComponentResource {
  public readonly webServerSg: aws.ec2.SecurityGroup;
  public readonly webServerSgId: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:components:SecurityInfrastructure', name, args, opts);

    // Create a security group for web servers
    const webServerSgTags = pulumi
      .output(args.tags)
      .apply(t => ({ ...t, Name: `${name}-web-server-sg` }));
    this.webServerSg = new aws.ec2.SecurityGroup(
      `${name}-web-server-sg`,
      {
        vpcId: args.vpcId,
        description: 'Allow inbound traffic on port 80 and 443',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: webServerSgTags,
      },
      { parent: this }
    );

    // Export key outputs
    this.webServerSgId = this.webServerSg.id;
    this.registerOutputs({
      webServerSgId: this.webServerSgId,
    });
  }
}
