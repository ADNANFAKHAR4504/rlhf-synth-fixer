import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { EgressOnlyInternetGateway } from '@cdktf/provider-aws/lib/egress-only-internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route'; // Corrected: Import Route
import { Instance } from '@cdktf/provider-aws/lib/instance';

interface VpcProps {
  name: string;
  tags: { [key: string]: string };
}

export class Ipv6OnlyVpc extends Construct {
  public readonly vpc: Vpc;
  public readonly igw: InternetGateway;
  public readonly eoigw: EgressOnlyInternetGateway;
  public readonly publicRouteTable: RouteTable;

  constructor(scope: Construct, name: string, props: VpcProps) {
    super(scope, name);

    this.vpc = new Vpc(this, 'ipv6-only-vpc', {
      // Correct Fix: Provide a dummy IPv4 CIDR block to satisfy AWS API validation.
      // This CIDR block will not be used in the subnets or routing.
      cidrBlock: '10.0.0.0/16', 
      assignGeneratedIpv6CidrBlock: true,
      tags: { Name: `${props.name}-vpc`, ...props.tags },
    });

    this.igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.name}-igw`, ...props.tags },
    });

    this.eoigw = new EgressOnlyInternetGateway(this, 'egress-only-igw', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.name}-eoigw`, ...props.tags },
    });

    this.publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.name}-public-rt`, ...props.tags },
    });

    new Route(this, 'public-ipv6-route', {
      routeTableId: this.publicRouteTable.id,
      destinationIpv6CidrBlock: '::/0',
      gatewayId: this.igw.id,
    });
  }
}

interface SubnetProps {
  name: string;
  vpcId: string;
  ipv6CidrBlock: string;
  publicRouteTableId?: string; // Corrected: Add publicRouteTableId as an optional prop
  tags: { [key: string]: string };
}

export class Ipv6OnlySubnet extends Construct {
  public readonly subnet: Subnet;

  constructor(scope: Construct, name: string, props: SubnetProps) {
    super(scope, name);

    this.subnet = new Subnet(this, 'ipv6-only-subnet', {
      vpcId: props.vpcId,
      ipv6CidrBlock: props.ipv6CidrBlock,
      assignIpv6AddressOnCreation: true,
      mapPublicIpOnLaunch: true, // This is an IPv4 property, but `ipv6AddressOnCreation` is the IPv6 equivalent. Keeping it for general best practice, though it's not strictly necessary for IPv6-only.
      tags: { Name: `${props.name}-subnet`, ...props.tags },
    });

    if (props.publicRouteTableId) {
      new RouteTableAssociation(this, 'public-route-table-association', {
        subnetId: this.subnet.id,
        routeTableId: props.publicRouteTableId, // Corrected: Reference the passed prop
      });
    }
  }
}

interface SecurityGroupProps {
  name: string;
  vpcId: string;
  tags: { [key: string]: string };
}

export class Ipv6OnlySecurityGroup extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, name: string, props: SecurityGroupProps) {
    super(scope, name);

    this.securityGroup = new SecurityGroup(this, 'ipv6-only-sg', {
      name: `${props.name}-sg`,
      description: 'IPv6-only security group',
      vpcId: props.vpcId,
      tags: { Name: `${props.name}-sg`, ...props.tags },
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          ipv6CidrBlocks: ['::/0'],
          description: 'Allow HTTP IPv6',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          ipv6CidrBlocks: ['::/0'],
          description: 'Allow all outbound IPv6 traffic',
        },
      ],
    });
  }
}

interface IamProps {
  name: string;
  tags: { [key: string]: string };
}

export class Ec2Iam extends Construct {
  public readonly role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, name: string, props: IamProps) {
    super(scope, name);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: { Service: 'ec2.amazonaws.com' },
          Effect: 'Allow',
          Sid: '',
        },
      ],
    });

    this.role = new IamRole(this, 'ec2-role', {
      name: `${props.name}-ec2-role`,
      assumeRolePolicy,
      tags: { Name: `${props.name}-ec2-role`, ...props.tags },
    });

    this.instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.name}-ec2-instance-profile`,
        role: this.role.name,
        tags: { Name: `${props.name}-ec2-instance-profile`, ...props.tags },
      }
    );
  }
}

interface Ec2InstanceProps {
  name: string;
  instanceType: string;
  ami: string;
  subnetId: string;
  securityGroupId: string;
  instanceProfileName: string;
  userData: string;
  tags: { [key: string]: string };
}

export class Ipv6OnlyEc2Instance extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, name: string, props: Ec2InstanceProps) {
    super(scope, name);

    this.instance = new Instance(this, 'ipv6-only-ec2', {
      ami: props.ami,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [props.securityGroupId],
      ipv6AddressCount: 1, // Corrected: use ipv6AddressCount to request a public IPv6 address
      iamInstanceProfile: props.instanceProfileName,
      userData: props.userData,
      tags: { Name: `${props.name}-ec2-instance`, ...props.tags },
    });
  }
}
