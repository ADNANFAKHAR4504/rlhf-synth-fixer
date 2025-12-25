import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnet1: aws.ec2.Subnet;
  public readonly privateSubnet2: aws.ec2.Subnet;
  public readonly dbSubnetGroup: aws.rds.SubnetGroup;
  public readonly dbSecurityGroup: aws.ec2.SecurityGroup;

  constructor(name: string, args: VpcStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Get the default VPC - using data source
    const defaultVpc = aws.ec2.getVpc({ default: true });

    // Store VPC as component property
    this.vpc = {
      id: pulumi.output(defaultVpc.then(vpc => vpc.id)),
    } as any;

    // Get available availability zones for the current region
    const availabilityZones = aws.getAvailabilityZones({ state: 'available' });

    // Create private subnets for RDS in the default VPC
    this.privateSubnet1 = new aws.ec2.Subnet(
      `tap-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: defaultVpc.then(vpc => vpc.id),
        cidrBlock: '172.31.96.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          Name: `tap-private-subnet-1-${environmentSuffix}`,
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    this.privateSubnet2 = new aws.ec2.Subnet(
      `tap-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: defaultVpc.then(vpc => vpc.id),
        cidrBlock: '172.31.97.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          Name: `tap-private-subnet-2-${environmentSuffix}`,
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Create DB subnet group
    this.dbSubnetGroup = new aws.rds.SubnetGroup(
      `tap-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: [this.privateSubnet1.id, this.privateSubnet2.id],
        tags: {
          Name: `tap-db-subnet-group-${environmentSuffix}`,
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    // Create security group for RDS
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-db-sg-${environmentSuffix}`,
      {
        vpcId: defaultVpc.then(vpc => vpc.id),
        description: 'Security group for RDS database',
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: ['172.31.0.0/16'],
            description: 'MySQL access from VPC',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `tap-db-sg-${environmentSuffix}`,
          ...(args.tags as any),
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      dbSecurityGroupId: this.dbSecurityGroup.id,
    });
  }
}
