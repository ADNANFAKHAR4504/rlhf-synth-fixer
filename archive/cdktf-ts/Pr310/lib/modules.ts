import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

//
// ==============================
// VPC MODULE
// ==============================
export interface VpcModuleProps {
  cidrBlock: string;
  environment: string;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly igw: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    this.vpc = new Vpc(this, 'DevVpc', {
      cidrBlock: props.cidrBlock,
      tags: {
        Environment: props.environment,
      },
    });

    this.igw = new InternetGateway(this, 'DevIgw', {
      vpcId: this.vpc.id,
      tags: {
        Environment: props.environment,
      },
    });

    this.routeTable = new RouteTable(this, 'DevRouteTable', {
      vpcId: this.vpc.id,
      tags: {
        Environment: props.environment,
      },
    });

    new Route(this, 'DevRoute', {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.igw.id,
    });
  }

  get vpcId() {
    return this.vpc.id;
  }
}

//
// ==============================
// SUBNETS MODULE
// ==============================
export interface SubnetsModuleProps {
  vpcModule: VpcModule;
  environment: string;
}

export class SubnetsModule extends Construct {
  public readonly publicSubnets: Subnet[];

  constructor(scope: Construct, id: string, props: SubnetsModuleProps) {
    super(scope, id);

    const { vpcModule, environment } = props;

    this.publicSubnets = [
      new Subnet(this, 'DevPublicSubnet1', {
        vpcId: vpcModule.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: environment,
        },
      }),
      new Subnet(this, 'DevPublicSubnet2', {
        vpcId: vpcModule.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: environment,
        },
      }),
    ];

    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `SubnetAssoc${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: vpcModule.routeTable.id,
      });
    });
  }
}

//
// ==============================
// EC2 MODULE
// ==============================
export interface Ec2ModuleProps {
  subnetsModule: SubnetsModule;
  environment: string;
}

// export class Ec2Module extends Construct {
//   constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
//     super(scope, id);

//     const { subnetsModule, environment } = props;

//     new Instance(this, 'DevInstance', {
//       ami: 'ami-083e865b97bdf1c1b',
//       instanceType: 't2.micro',
//       subnetId: subnetsModule.publicSubnets[0].id,
//       associatePublicIpAddress: true,
//       tags: {
//         Environment: environment,
//       },
//     });
//   }
// }

export class Ec2Module extends Construct {
  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);
    const { subnetsModule, environment } = props;

    // ✅ Lookup latest Amazon Linux 2 AMI dynamically
    const ami = new DataAwsAmi(this, 'LatestAmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // ✅ Security Group allowing SSH (port 22)
    const sg = new SecurityGroup(this, 'DevInstanceSG', {
      vpcId: subnetsModule.publicSubnets[0].vpcId,
      description: 'Allow SSH access',
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // You can restrict this to your IP
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
        Environment: environment,
      },
    });

    // ✅ Create EC2 instance using latest AMI and security group
    new Instance(this, 'DevInstance', {
      ami: ami.id,
      instanceType: 't2.micro',
      subnetId: subnetsModule.publicSubnets[0].id,
      associatePublicIpAddress: true,
      vpcSecurityGroupIds: [sg.id],
      tags: {
        Environment: environment,
      },
    });
  }
}
