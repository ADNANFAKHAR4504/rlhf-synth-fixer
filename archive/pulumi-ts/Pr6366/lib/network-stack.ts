/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * network-stack.ts
 * 
 * This module defines the VPC and networking infrastructure for the payment
 * processing environment.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly s3Endpoint: aws.ec2.VpcEndpoint;
  public readonly dynamodbEndpoint: aws.ec2.VpcEndpoint;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // DYNAMIC: Get the current AWS region from the provider
    const currentRegion = aws.getRegionOutput({}, opts);
    const region = currentRegion.name;

    // DYNAMIC: Get actual availability zones from AWS for the current region
    // This prevents errors if zones change in the future
    const availableAZs = pulumi.output(
      aws.getAvailabilityZones({
        state: 'available',
      }, opts)
    );

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-igw-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create public subnets across multiple AZs (dynamically fetched)
    this.publicSubnets = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          // DYNAMIC: Use actual AZ from AWS
          availabilityZone: availableAZs.names[i],
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-public-subnet-${i}-${environmentSuffix}`,
            Type: 'Public',
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-rt-${environmentSuffix}`,
          Type: 'Public',
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Elastic IPs for NAT Gateways
    const natEips = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-eip-${i}-${environmentSuffix}`,
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
      natEips.push(eip);
    }

    // Create NAT Gateways in each public subnet
    const natGateways = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(
        `payment-nat-${i}-${environmentSuffix}`,
        {
          allocationId: natEips[i].id,
          subnetId: this.publicSubnets[i].id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-${i}-${environmentSuffix}`,
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
      natGateways.push(nat);
    }

    // Create private subnets across multiple AZs (dynamically fetched)
    this.privateSubnets = [];
    const privateRouteTables = [];
    for (let i = 0; i < 3; i++) {
      // Create private subnet
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          // DYNAMIC: Use actual AZ from AWS
          availabilityZone: availableAZs.names[i],
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-subnet-${i}-${environmentSuffix}`,
            Type: 'Private',
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);

      // Create private route table for this subnet
      const routeTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-rt-${i}-${environmentSuffix}`,
            Type: 'Private',
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
      privateRouteTables.push(routeTable);

      // Add route to NAT Gateway
      new aws.ec2.Route(
        `payment-private-route-${i}-${environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      // Associate private subnet with its route table
      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );
    }

    // Create VPC Endpoints for AWS services
    // DYNAMIC: Use current region for service names + explicit Gateway type
    this.s3Endpoint = new aws.ec2.VpcEndpoint(
      `payment-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        // DYNAMIC: Use current region from provider
        serviceName: pulumi.interpolate`com.amazonaws.${region}.s3`,
        // CRITICAL: Explicitly set Gateway type
        vpcEndpointType: 'Gateway',
        routeTableIds: [
          publicRouteTable.id,
          ...privateRouteTables.map((rt) => rt.id),
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-s3-endpoint-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    this.dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `payment-dynamodb-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        // DYNAMIC: Use current region from provider
        serviceName: pulumi.interpolate`com.amazonaws.${region}.dynamodb`,
        // CRITICAL: Explicitly set Gateway type
        vpcEndpointType: 'Gateway',
        routeTableIds: [
          publicRouteTable.id,
          ...privateRouteTables.map((rt) => rt.id),
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Enable VPC Flow Logs
    const flowLogRole = new aws.iam.Role(
      `payment-flow-log-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ],
        }),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-flow-log-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `payment-flow-log-policy-${environmentSuffix}`,
      {
        role: flowLogRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    const flowLogGroup = new aws.cloudwatch.LogGroup(
      `payment-vpc-flow-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-flow-logs-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    new aws.ec2.FlowLog(
      `payment-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        iamRoleArn: flowLogRole.arn,
        logDestination: flowLogGroup.arn,
        trafficType: 'ALL',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-flow-log-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map((s) => s.id),
      privateSubnetIds: this.privateSubnets.map((s) => s.id),
      s3EndpointId: this.s3Endpoint.id,
      dynamodbEndpointId: this.dynamodbEndpoint.id,
    });
  }
}
