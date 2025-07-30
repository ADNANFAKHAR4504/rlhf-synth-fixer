import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';

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

  // Optional: expose output values like VPC ID
  get vpcId() {
    return this.vpc.id;
  }
}
