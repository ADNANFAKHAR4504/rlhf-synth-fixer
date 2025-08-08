# Model Response

## CDKTF AWS Infrastructure Implementation

This file contains the model-generated response for creating a secure VPC infrastructure using CDKTF TypeScript.

### Code Implementation

```typescript
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export class SecureVpcStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpc = new Vpc(this, 'MainVpc', {
      cidrBlock: '10.0.0.0/16',
    });

    const availabilityZones = ['us-east-1a', 'us-east-1b'];

    const publicSubnets = availabilityZones.map((az, i) =>
      new Subnet(this, `PublicSubnet${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
      })
    );

    const privateSubnets = availabilityZones.map((az, i) =>
      new Subnet(this, `PrivateSubnet${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: false,
      })
    );

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
    });

    const eips = publicSubnets.map((_, i) =>
      new Eip(this, `NatEip${i + 1}`, {
        vpc: true,
      })
    );

    const natGateways = eips.map((eip, i) =>
      new NatGateway(this, `NatGateway${i + 1}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
      })
    );

    const publicRouteTable = new RouteTable(this, 'PublicRT', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `PublicRTA${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    privateSubnets.forEach((subnet, i) => {
      const rt = new RouteTable(this, `PrivateRT${i + 1}`, {
        vpcId: vpc.id,
        route: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[i].id,
          },
        ],
      });

      new RouteTableAssociation(this, `PrivateRTA${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: rt.id,
      });
    });

    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: publicSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: privateSubnets.map(subnet => subnet.id),
    });
  }
}
```

### Key Features

- Creates a VPC with public and private subnets
- Sets up NAT gateways for private subnet internet access
- Configures routing tables and associations
- Provides Terraform outputs for VPC and subnet IDs
- Uses hardcoded availability zones (limitation to be addressed)
