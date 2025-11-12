/**
 * network-stack.ts
 *
 * This module defines the NetworkStack component for VPC, subnets, NAT gateways,
 * and VPC endpoints for the payment processing environment.
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
  public readonly vpcFlowLogGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create VPC with CIDR 10.0.0.0/16
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

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({ state: 'available' });
    const azNames = azs.apply(zones => zones.names.slice(0, 3));

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

    // Create public subnets (one per AZ)
    this.publicSubnets = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azNames.apply(names => names[i]),
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

    // Create private subnets (one per AZ)
    this.privateSubnets = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: azNames.apply(names => names[i]),
          mapPublicIpOnLaunch: false,
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
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-public-rt-${environmentSuffix}`,
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

    // Create Elastic IPs and NAT Gateways for each public subnet
    const natGateways: aws.ec2.NatGateway[] = [];
    this.publicSubnets.forEach((subnet, i) => {
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

      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          allocationId: eip.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-nat-${i}-${environmentSuffix}`,
            EnvironmentSuffix: environmentSuffix,
          })),
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    });

    // Create private route tables (one per AZ) and associate with NAT Gateways
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `payment-private-rt-${i}-${environmentSuffix}`,
            EnvironmentSuffix: environmentSuffix,
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
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create VPC Endpoint for S3
    this.s3Endpoint = new aws.ec2.VpcEndpoint(
      `payment-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.s3',
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-s3-endpoint-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create VPC Endpoint for DynamoDB
    this.dynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `payment-dynamodb-endpoint-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        serviceName: 'com.amazonaws.ap-southeast-1.dynamodb',
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for VPC Flow Logs
    this.vpcFlowLogGroup = new aws.cloudwatch.LogGroup(
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

    // Create IAM role for VPC Flow Logs
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

    // Attach policy to Flow Log role
    new aws.iam.RolePolicy(
      `payment-flow-log-policy-${environmentSuffix}`,
      {
        role: flowLogRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogGroups",
            "logs:DescribeLogStreams"
          ],
          "Effect": "Allow",
          "Resource": "${this.vpcFlowLogGroup.arn}"
        }]
      }`,
      },
      { parent: this }
    );

    // Enable VPC Flow Logs
    new aws.ec2.FlowLog(
      `payment-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        logDestinationType: 'cloud-watch-logs',
        logDestination: this.vpcFlowLogGroup.arn,
        iamRoleArn: flowLogRole.arn,
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
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
    });
  }
}
