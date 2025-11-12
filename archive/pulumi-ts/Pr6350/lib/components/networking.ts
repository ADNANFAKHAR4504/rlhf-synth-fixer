/**
 * NetworkingStack - VPC, subnets, NAT gateways, VPC endpoints, flow logs
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface NetworkingStackArgs {
  environmentSuffix: string;
  cidrBlock: string;
  availabilityZoneCount: number;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;
  public readonly flowLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: NetworkingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const { environmentSuffix, cidrBlock, availabilityZoneCount, tags } = args;

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-igw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Public and Private Subnets
    this.publicSubnetIds = [];
    this.privateSubnetIds = [];
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < availabilityZoneCount; i++) {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-public-subnet-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      this.publicSubnetIds.push(publicSubnet.id);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-subnet-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      this.privateSubnetIds.push(privateSubnet.id);

      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-eip-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      // NAT Gateway
      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnet.id,
          allocationId: eip.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

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
    for (let i = 0; i < availabilityZoneCount; i++) {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: this.publicSubnetIds[i],
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Private Route Tables (one per AZ for NAT Gateway)
    for (let i = 0; i < availabilityZoneCount; i++) {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-rt-${i}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: this.privateSubnetIds[i],
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // VPC Endpoints for S3 and DynamoDB
    new aws.ec2.VpcEndpoint(
      `payment-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: 'com.amazonaws.eu-south-2.s3',
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-s3-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.ec2.VpcEndpoint(
      `payment-dynamodb-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: 'com.amazonaws.eu-south-2.dynamodb',
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security Group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for payment Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-lambda-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;

    // VPC Flow Logs
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
        maxSessionDuration: 3600, // 1 hour
        tags,
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
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    const flowLogGroup = new aws.cloudwatch.LogGroup(
      `payment-flow-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    this.flowLogGroupName = flowLogGroup.name;

    new aws.ec2.FlowLog(
      `payment-flow-log-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        logDestinationType: 'cloud-watch-logs',
        logDestination: flowLogGroup.arn,
        iamRoleArn: flowLogRole.arn,
        tags,
      },
      { parent: this }
    );

    // Transit Gateway
    const transitGateway = new aws.ec2transitgateway.TransitGateway(
      `payment-tgw-${environmentSuffix}`,
      {
        description:
          'Transit Gateway for payment processing multi-region connectivity',
        defaultRouteTableAssociation: 'enable',
        defaultRouteTablePropagation: 'enable',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-tgw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.ec2transitgateway.VpcAttachment(
      `payment-tgw-attachment-${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.id,
        vpcId: this.vpc.id,
        subnetIds: this.privateSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-tgw-attachment-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
      flowLogGroupName: this.flowLogGroupName,
    });
  }
}
