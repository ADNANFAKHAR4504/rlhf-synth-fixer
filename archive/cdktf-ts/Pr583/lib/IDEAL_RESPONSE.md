# CDKTF TypeScript Infrastructure Solution

## lib/modules.ts

```typescript
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
```

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';
import {
  createVpcWithInternetAccess,
  createEc2InstanceWithEip,
  SecurityGroupConfig,
} from './modules';

export interface TapStackProps {
  environmentSuffix: string;
  stateBucket: string;
  stateBucketRegion: string;
  awsRegion: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    console.log('Environment:', props.environmentSuffix);

    new AwsProvider(this, 'aws', {
      region: props.awsRegion,
    });

    const namePrefix = `iacProject-${props.environmentSuffix}`;

    const vpcResources = createVpcWithInternetAccess(this, namePrefix);
    const vpc = vpcResources.vpc;
    const igw = vpcResources.igw;
    const routeTable = vpcResources.routeTable;
    const publicSubnets = vpcResources.publicSubnets;

    const sg = new SecurityGroupConfig(this, `${namePrefix}-sg`, {
      vpcId: vpc.id,
      allowedCidr: '203.0.113.0/24',
    });

    const instanceIds = [] as string[];
    const allocationIds = [] as string[];
    const amiParam = new DataAwsSsmParameter(this, `${namePrefix}-ami-param`, {
      name: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
    });
    publicSubnets.forEach((subnet, index) => {
      const name = `${namePrefix}-ec2-${index + 1}`;

      const result = createEc2InstanceWithEip(this, name, {
        subnetId: subnet.id,
        ami: amiParam.value,
        instanceType: 't3.micro',
        sgId: sg.securityGroup.id,
        availabilityZone: subnet.availabilityZone,
      });

      instanceIds.push(result.instance.id);
      allocationIds.push(result.eip.id);
    });

    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
      description: 'ID of the created VPC',
    });

    new TerraformOutput(this, 'SubnetIds', {
      value: publicSubnets.map(s => s.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'InternetGatewayId', {
      value: igw.id,
      description: 'ID of the attached Internet Gateway',
    });

    new TerraformOutput(this, 'RouteTableId', {
      value: routeTable.id,
      description: 'ID of the public route table with IGW route',
    });

    new TerraformOutput(this, 'SecurityGroupId', {
      value: sg.securityGroup.id,
      description: 'ID of the security group allowing SSH and HTTP',
    });

    new TerraformOutput(this, 'InstanceIds', {
      value: instanceIds,
      description: 'IDs of the EC2 instances launched',
    });

    new TerraformOutput(this, 'ElasticIpAllocationIds', {
      value: allocationIds,
      description: 'Elastic IP allocation IDs associated with EC2 instances',
    });
  }
}
```
