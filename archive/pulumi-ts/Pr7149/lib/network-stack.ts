import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-vpc-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({ state: 'available' });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-igw-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Create public subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Public',
          })),
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create private subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Private',
          })),
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-nat-eip-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      eips.push(eip);
    }

    // Create NAT Gateways (one per AZ)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new aws.ec2.NatGateway(
        `payment-nat-${i + 1}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-nat-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );
      natGateways.push(nat);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-public-rt-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Route to Internet Gateway
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
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables (one per AZ for NAT Gateway)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: pulumi.output(tags).apply(t => ({
            ...t,
            Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
          })),
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create VPC Endpoints for S3
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `payment-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.s3',
        vpcEndpointType: 'Gateway',
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-s3-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // Security group for VPC endpoints
    const endpointSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-endpoint-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [vpc.cidrBlock],
            description: 'HTTPS from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-endpoint-sg-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Endpoint for ECR API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ecrApiEndpoint = new aws.ec2.VpcEndpoint(
      `payment-ecr-api-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.ecr.api',
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecr-api-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Endpoint for ECR Docker
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ecrDkrEndpoint = new aws.ec2.VpcEndpoint(
      `payment-ecr-dkr-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.ecr.dkr',
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-ecr-dkr-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    // VPC Endpoint for CloudWatch Logs
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const logsEndpoint = new aws.ec2.VpcEndpoint(
      `payment-logs-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: 'com.amazonaws.us-east-1.logs',
        vpcEndpointType: 'Interface',
        privateDnsEnabled: true,
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSecurityGroup.id],
        tags: pulumi.output(tags).apply(t => ({
          ...t,
          Name: `payment-logs-endpoint-${environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
