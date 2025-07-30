import { Construct } from 'constructs';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { VpcModule } from '../vpc';

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
