/**
 * networking-stack.ts
 *
 * This module defines the VPC and networking infrastructure with private subnets
 * for Lambda functions and VPC endpoints for secure AWS service access.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface NetworkingStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly s3VpcEndpoint: aws.ec2.VpcEndpoint;
  public readonly vpcSecurityGroup: aws.ec2.SecurityGroup;
  public readonly routeTable: aws.ec2.RouteTable;

  constructor(name: string, args: NetworkingStackArgs, opts?: ResourceOptions) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Force region to us-east-1 as per requirements
    // This ensures all resources are deployed in us-east-1 regardless of Pulumi config
    const region = 'us-east-1';

    // Derive availability zones from the required region
    const availabilityZones = [`${region}a`, `${region}b`];

    this.vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          Purpose: 'Secure document processing infrastructure',
          ...tags,
        },
      },
      { parent: this }
    );

    this.publicSubnets = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Subnet(
          `public-subnet-${index + 1}-${environmentSuffix}`,
          {
            vpcId: this.vpc.id,
            availabilityZone: az,
            cidrBlock: `10.0.${index + 1}.0/24`,
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `public-subnet-${index + 1}-${environmentSuffix}`,
              Type: 'public',
              ...tags,
            },
          },
          { parent: this }
        )
    );

    this.privateSubnets = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Subnet(
          `private-subnet-${index + 1}-${environmentSuffix}`,
          {
            vpcId: this.vpc.id,
            availabilityZone: az,
            cidrBlock: `10.0.${index + 10}.0/24`,
            tags: {
              Name: `private-subnet-${index + 1}-${environmentSuffix}`,
              Type: 'private',
              ...tags,
            },
          },
          { parent: this }
        )
    );

    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    this.routeTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.routeTable.id,
        },
        { parent: this }
      );
    });

    this.vpcSecurityGroup = new aws.ec2.SecurityGroup(
      `vpc-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for VPC endpoints and Lambda functions',
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [this.vpc.cidrBlock],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `vpc-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.s3VpcEndpoint = new aws.ec2.VpcEndpoint(
      `s3-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [this.routeTable.id],
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              Resource: ['*'],
            },
          ],
        }),
        tags: {
          Name: `s3-endpoint-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      vpcArn: this.vpc.arn,
      vpcCidrBlock: this.vpc.cidrBlock,
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      s3VpcEndpointId: this.s3VpcEndpoint.id,
      vpcSecurityGroupId: this.vpcSecurityGroup.id,
      routeTableId: this.routeTable.id,
    });
  }
}
