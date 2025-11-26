/**
 * vpc-stack.ts
 *
 * Creates VPC infrastructure with public and private subnets across multiple AZs,
 * NAT Gateway, and VPC endpoints for cost optimization.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  cidr: string;
  availabilityZones: number;
  tags?: pulumi.Input<{ [key: string]: string }>;
  enableNatGateway?: boolean;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly databaseSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, args, opts);

    const {
      environmentSuffix,
      cidr,
      availabilityZones,
      tags,
      enableNatGateway = false,
    } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `financial-vpc-${environmentSuffix}`,
      {
        cidrBlock: cidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `financial-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    const azNames = azs.names.apply(names => names.slice(0, availabilityZones));

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `financial-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `financial-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < availabilityZones; i++) {
      const subnet = new aws.ec2.Subnet(
        `financial-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azNames.apply(names => names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `financial-public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Create private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < availabilityZones; i++) {
      const subnet = new aws.ec2.Subnet(
        `financial-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azNames.apply(names => names[i]),
          tags: {
            ...tags,
            Name: `financial-private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // Create Elastic IP and NAT Gateway only if enabled (disabled by default for cost optimization and EIP limits)
    let natGateway: aws.ec2.NatGateway | undefined;

    if (enableNatGateway) {
      const eip = new aws.ec2.Eip(
        `financial-nat-eip-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...tags,
            Name: `financial-nat-eip-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      natGateway = new aws.ec2.NatGateway(
        `financial-nat-gateway-${environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnets[0].id,
          tags: {
            ...tags,
            Name: `financial-nat-gateway-${environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [igw] }
      );
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `financial-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `financial-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `financial-public-route-${environmentSuffix}`,
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
        `financial-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route table
    const privateRouteTable = new aws.ec2.RouteTable(
      `financial-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `financial-private-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to NAT Gateway only if NAT Gateway is enabled
    if (enableNatGateway && natGateway) {
      new aws.ec2.Route(
        `financial-private-route-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { parent: this }
      );
    }

    // Associate private subnets with private route table
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `financial-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create VPC Endpoint for S3
    new aws.ec2.VpcEndpoint(
      `financial-s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${aws.getRegionOutput().name}.s3`,
        routeTableIds: [privateRouteTable.id, publicRouteTable.id],
        tags: {
          ...tags,
          Name: `financial-s3-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for VPC endpoints
    const vpcEndpointSg = new aws.ec2.SecurityGroup(
      `financial-vpce-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [cidr],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `financial-vpce-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create VPC Endpoint for ECR API
    new aws.ec2.VpcEndpoint(
      `financial-ecr-api-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${aws.getRegionOutput().name}.ecr.api`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `financial-ecr-api-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create VPC Endpoint for ECR DKR
    new aws.ec2.VpcEndpoint(
      `financial-ecr-dkr-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${aws.getRegionOutput().name}.ecr.dkr`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: {
          ...tags,
          Name: `financial-ecr-dkr-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for database
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `financial-db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS Aurora database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [cidr],
            description: 'PostgreSQL access from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `financial-db-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.databaseSecurityGroupId = dbSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      databaseSecurityGroupId: this.databaseSecurityGroupId,
    });
  }
}
