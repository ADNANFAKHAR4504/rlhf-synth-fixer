import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { EipAssociation } from '@cdktf/provider-aws/lib/eip-association';

interface Ec2InstanceProps {
  subnetId: string;
  ami: string;
  instanceType: string;
  sgId: string;
  availabilityZone: string;
}

export function createVpcWithInternetAccess(
  scope: Construct,
  namePrefix: string
) {
  const vpc = new Vpc(scope, `${namePrefix}-vpc`, {
    cidrBlock: '10.0.0.0/16',
    tags: { Name: `${namePrefix}-vpc` },
  });

  const azs = ['us-east-1a', 'us-east-1b'];

  const publicSubnets = azs.map((az, index) => {
    return new Subnet(scope, `${namePrefix}-public-subnet-${index + 1}`, {
      vpcId: vpc.id,
      cidrBlock: `10.0.${index}.0/24`,
      availabilityZone: az,
      mapPublicIpOnLaunch: true,
      tags: { Name: `${namePrefix}-public-subnet-${index + 1}` },
    });
  });

  const igw = new InternetGateway(scope, `${namePrefix}-igw`, {
    vpcId: vpc.id,
    tags: { Name: `${namePrefix}-igw` },
  });

  const routeTable = new RouteTable(scope, `${namePrefix}-public-rt`, {
    vpcId: vpc.id,
    tags: { Name: `${namePrefix}-public-rt` },
  });

  new Route(scope, `${namePrefix}-public-route`, {
    routeTableId: routeTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: igw.id,
  });

  publicSubnets.forEach((subnet, index) => {
    new RouteTableAssociation(scope, `${namePrefix}-rta-${index + 1}`, {
      subnetId: subnet.id,
      routeTableId: routeTable.id,
    });
  });

  return {
    vpc,
    publicSubnets,
    igw,
    routeTable,
  };
}

export function createEc2InstanceWithEip(
  scope: Construct,
  name: string,
  props: Ec2InstanceProps
): { instance: Instance; eip: Eip } {
  const eip = new Eip(scope, `${name}-eip`, {
    tags: { Name: `${name}-eip` },
  });

  const instance = new Instance(scope, `${name}-instance`, {
    ami: props.ami,
    instanceType: props.instanceType,
    subnetId: props.subnetId,
    vpcSecurityGroupIds: [props.sgId],
    associatePublicIpAddress: true,
    availabilityZone: props.availabilityZone,
    rootBlockDevice: {
      encrypted: true,
    },
    tags: { Name: name },
  });

  new EipAssociation(scope, `${name}-eip-assoc`, {
    instanceId: instance.id,
    allocationId: eip.id,
  });

  return { instance, eip };
}

interface SecurityGroupProps {
  vpcId: string;
  allowedCidr: string;
}

export class SecurityGroupConfig extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, name: string, props: SecurityGroupProps) {
    super(scope, name);

    this.securityGroup = new SecurityGroup(this, `${name}`, {
      vpcId: props.vpcId,
      name: `${name}`,
      description: 'Allow SSH and HTTP from trusted IP range',
      tags: { Name: `${name}` },
    });

    new SecurityGroupRule(this, `${name}-ssh`, {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [props.allowedCidr],
      securityGroupId: this.securityGroup.id,
    });

    new SecurityGroupRule(this, `${name}-http`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [props.allowedCidr],
      securityGroupId: this.securityGroup.id,
    });

    new SecurityGroupRule(this, `${name}-egress`, {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });
  }
}
