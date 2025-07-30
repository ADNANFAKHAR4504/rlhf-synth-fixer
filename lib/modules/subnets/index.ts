import { TerraformStack } from 'cdktf';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { VpcModule } from '../vpc';
import { Construct } from 'constructs';

export class SubnetsModule extends TerraformStack {
  public readonly publicSubnets: Subnet[];

  constructor(scope: Construct, id: string, vpcModule: VpcModule) {
    super(scope, id);

    // Create Public Subnets
    this.publicSubnets = [
      new Subnet(this, 'DevPublicSubnet1', {
        vpcId: vpcModule.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: 'Dev',
        },
      }),
      new Subnet(this, 'DevPublicSubnet2', {
        vpcId: vpcModule.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: {
          Environment: 'Dev',
        },
      }),
    ];

    // Associate Subnets with Route Table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `SubnetAssoc${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: vpcModule.routeTable.id,
      });
    });
  }
}
