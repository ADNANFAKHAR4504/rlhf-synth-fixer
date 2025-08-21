import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RouteTableArgs {
  vpcId: pulumi.Input<string>;
  tags?: Record<string, string>;
  name: string;
  routes?: Array<{
    cidrBlock?: string;
    destinationPrefixListId?: string;
    gatewayId?: pulumi.Input<string>;
    natGatewayId?: pulumi.Input<string>;
    networkInterfaceId?: pulumi.Input<string>;
    transitGatewayId?: pulumi.Input<string>;
    vpcPeeringConnectionId?: pulumi.Input<string>;
  }>;
}

export interface RouteTableResult {
  routeTable: aws.ec2.RouteTable;
  routeTableId: pulumi.Output<string>;
  routes: aws.ec2.Route[];
}

export interface RouteTableAssociationArgs {
  routeTableId: pulumi.Input<string>;
  subnetId: pulumi.Input<string>;
  name: string;
}

export interface PublicRouteTableArgs {
  vpcId: pulumi.Input<string>;
  internetGatewayId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  tags?: Record<string, string>;
  name: string;
}

export interface PrivateRouteTableArgs {
  vpcId: pulumi.Input<string>;
  natGatewayIds: pulumi.Input<string>[];
  privateSubnetIds: pulumi.Input<string>[];
  tags?: Record<string, string>;
  name: string;
}

export interface RouteTablesResult {
  publicRouteTable: RouteTableResult;
  privateRouteTables: RouteTableResult[];
  publicAssociations: aws.ec2.RouteTableAssociation[];
  privateAssociations: aws.ec2.RouteTableAssociation[];
}

export class RouteTableComponent extends pulumi.ComponentResource {
  public readonly routeTable: aws.ec2.RouteTable;
  public readonly routeTableId: pulumi.Output<string>;
  public readonly routes: aws.ec2.Route[];

  constructor(
    name: string,
    args: RouteTableArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:RouteTableComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.routeTable = new aws.ec2.RouteTable(
      `${name}-rt`,
      {
        vpcId: args.vpcId,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.routeTableId = this.routeTable.id;
    this.routes = [];

    // Create additional routes if provided
    if (args.routes) {
      args.routes.forEach((routeConfig, index) => {
        const route = new aws.ec2.Route(
          `${name}-route-${index}`,
          {
            routeTableId: this.routeTable.id,
            destinationCidrBlock: routeConfig.cidrBlock, // Changed from cidrBlock to destinationCidrBlock
            destinationPrefixListId: routeConfig.destinationPrefixListId,
            gatewayId: routeConfig.gatewayId,
            natGatewayId: routeConfig.natGatewayId,
            networkInterfaceId: routeConfig.networkInterfaceId,
            transitGatewayId: routeConfig.transitGatewayId,
            vpcPeeringConnectionId: routeConfig.vpcPeeringConnectionId,
          },
          { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );

        this.routes.push(route);
      });
    }

    this.registerOutputs({
      routeTable: this.routeTable,
      routeTableId: this.routeTableId,
      routes: this.routes,
    });
  }
}

export class RouteTableAssociationComponent extends pulumi.ComponentResource {
  public readonly association: aws.ec2.RouteTableAssociation;

  constructor(
    name: string,
    args: RouteTableAssociationArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:RouteTableAssociationComponent', name, {}, opts);

    this.association = new aws.ec2.RouteTableAssociation(
      `${name}-assoc`,
      {
        routeTableId: args.routeTableId,
        subnetId: args.subnetId,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.registerOutputs({
      association: this.association,
    });
  }
}

export class RouteTablesComponent extends pulumi.ComponentResource {
  public readonly publicRouteTable: RouteTableResult;
  public readonly privateRouteTables: RouteTableResult[];
  public readonly publicAssociations: aws.ec2.RouteTableAssociation[];
  public readonly privateAssociations: aws.ec2.RouteTableAssociation[];

  constructor(
    name: string,
    publicArgs: PublicRouteTableArgs,
    privateArgs: PrivateRouteTableArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:vpc:RouteTablesComponent', name, {}, opts);

    // Create public route table
    const publicRouteTableComponent = new RouteTableComponent(
      `${name}-public`,
      {
        vpcId: publicArgs.vpcId,
        name: `${publicArgs.name}-public`,
        tags: publicArgs.tags,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: publicArgs.internetGatewayId,
          },
        ],
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
    );

    this.publicRouteTable = {
      routeTable: publicRouteTableComponent.routeTable,
      routeTableId: publicRouteTableComponent.routeTableId,
      routes: publicRouteTableComponent.routes,
    };

    // Create public subnet associations
    this.publicAssociations = [];
    if (Array.isArray(publicArgs.publicSubnetIds)) {
      publicArgs.publicSubnetIds.forEach((subnetId, index) => {
        const association = new aws.ec2.RouteTableAssociation(
          `${name}-public-assoc-${index}`,
          {
            routeTableId: this.publicRouteTable.routeTableId,
            subnetId: subnetId,
          },
          { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
        this.publicAssociations.push(association);
      });
    }

    // Create private route tables (one per NAT Gateway for HA)
    this.privateRouteTables = [];
    this.privateAssociations = [];

    const natGatewayIdsArray = Array.isArray(privateArgs.natGatewayIds)
      ? privateArgs.natGatewayIds
      : [privateArgs.natGatewayIds];
    const privateSubnetIdsArray = Array.isArray(privateArgs.privateSubnetIds)
      ? privateArgs.privateSubnetIds
      : [privateArgs.privateSubnetIds];

    natGatewayIdsArray.forEach((natGatewayId, index) => {
      const privateRouteTableComponent = new RouteTableComponent(
        `${name}-private-${index}`,
        {
          vpcId: privateArgs.vpcId,
          name: `${privateArgs.name}-private-${index}`,
          tags: privateArgs.tags,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              natGatewayId: natGatewayId,
            },
          ],
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
      );

      this.privateRouteTables.push({
        routeTable: privateRouteTableComponent.routeTable,
        routeTableId: privateRouteTableComponent.routeTableId,
        routes: privateRouteTableComponent.routes,
      });

      // Associate private subnets with their corresponding route table
      if (privateSubnetIdsArray[index]) {
        const association = new aws.ec2.RouteTableAssociation(
          `${name}-private-assoc-${index}`,
          {
            routeTableId: privateRouteTableComponent.routeTableId,
            subnetId: privateSubnetIdsArray[index],
          },
          { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
        this.privateAssociations.push(association);
      }
    });

    this.registerOutputs({
      publicRouteTable: this.publicRouteTable,
      privateRouteTables: this.privateRouteTables,
      publicAssociations: this.publicAssociations,
      privateAssociations: this.privateAssociations,
    });
  }
}

export function createRouteTable(
  name: string,
  args: RouteTableArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): RouteTableResult {
  const routeTableComponent = new RouteTableComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    routeTable: routeTableComponent.routeTable,
    routeTableId: routeTableComponent.routeTableId,
    routes: routeTableComponent.routes,
  };
}

export function createRouteTableAssociation(
  name: string,
  args: RouteTableAssociationArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): aws.ec2.RouteTableAssociation {
  const associationComponent = new RouteTableAssociationComponent(
    name,
    args,
    opts
  ); // ← FIXED: Pass opts through
  return associationComponent.association;
}

export function createRouteTables(
  name: string,
  publicArgs: PublicRouteTableArgs,
  privateArgs: PrivateRouteTableArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): RouteTablesResult {
  const routeTablesComponent = new RouteTablesComponent(
    name,
    publicArgs,
    privateArgs,
    opts // ← FIXED: Pass opts through
  );
  return {
    publicRouteTable: routeTablesComponent.publicRouteTable,
    privateRouteTables: routeTablesComponent.privateRouteTables,
    publicAssociations: routeTablesComponent.publicAssociations,
    privateAssociations: routeTablesComponent.privateAssociations,
  };
}
