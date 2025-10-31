import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VPCStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VPCStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly rdsSecurityGroupId: pulumi.Output<string>;
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VPCStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VPCStack', name, {}, opts);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `backup-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `backup-vpc-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create private subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `private-subnet-1-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `private-subnet-2-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS PostgreSQL',
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `rds-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for backup Lambda',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([args.tags]).apply(([tags]) => ({
          ...tags,
          Name: `lambda-sg-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Allow Lambda to connect to RDS
    new aws.ec2.SecurityGroupRule(
      `lambda-to-rds-${args.environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        securityGroupId: rdsSecurityGroup.id,
        sourceSecurityGroupId: lambdaSecurityGroup.id,
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.privateSubnetIds = pulumi.output([
      privateSubnet1.id,
      privateSubnet2.id,
    ]);
    this.rdsSecurityGroupId = rdsSecurityGroup.id;
    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
    });
  }
}
