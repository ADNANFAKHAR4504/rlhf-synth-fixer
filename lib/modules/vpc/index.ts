import { TerraformStack } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Construct } from 'constructs';

export class VpcModule extends TerraformStack {
  public readonly vpc: Vpc;
  public readonly igw: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'DevVpc', {
      cidrBlock: '10.0.0.0/16',
      tags: {
        Environment: 'Dev',
      },
    });

    // Create Internet Gateway
    this.igw = new InternetGateway(this, 'DevIgw', {
      vpcId: this.vpc.id,
      tags: {
        Environment: 'Dev',
      },
    });

    // Create Route Table
    this.routeTable = new RouteTable(this, 'DevRouteTable', {
      vpcId: this.vpc.id,
      tags: {
        Environment: 'Dev',
      },
    });

    // Create Route for Internet Gateway
    new Route(this, 'DevRoute', {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.igw.id,
    });
  }
}
