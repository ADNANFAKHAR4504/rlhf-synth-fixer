/**
 * networking-stack.mjs
 *
 * Creates VPC, subnets, security groups, and Application Load Balancer
 * with the latest 2025 ALB features and best practices.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class NetworkingStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'networking' };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `webapp-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `webapp-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `webapp-igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: `webapp-igw-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `webapp-public-${i + 1}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `webapp-public-${i + 1}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `webapp-private-${i + 1}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          tags: {
            ...tags,
            Name: `webapp-private-${i + 1}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(subnet);
    }

    // Create NAT Gateways for private subnets
    const natGateways = [];
    for (let i = 0; i < 2; i++) {
      const eip = new aws.ec2.Eip(
        `webapp-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...tags,
            Name: `webapp-nat-eip-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      const natGw = new aws.ec2.NatGateway(
        `webapp-nat-${i + 1}-${environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: this.publicSubnets[i].id,
          tags: { ...tags, Name: `webapp-nat-${i + 1}-${environmentSuffix}` },
        },
        { parent: this, dependsOn: [igw] }
      );

      natGateways.push(natGw);
    }

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `webapp-public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: `webapp-public-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `webapp-public-route-${environmentSuffix}`,
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
        `webapp-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables and associate with NAT gateways
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `webapp-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `webapp-private-rt-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `webapp-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `webapp-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Security group for ALB
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `webapp-alb-sg-${environmentSuffix}`,
      {
        name: `webapp-alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
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
        tags: { ...tags, Name: `webapp-alb-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Security group for EC2 instances
    this.instanceSecurityGroup = new aws.ec2.SecurityGroup(
      `webapp-instance-sg-${environmentSuffix}`,
      {
        name: `webapp-instance-sg-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [this.albSecurityGroup.id],
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'], // Only from within VPC
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
        tags: { ...tags, Name: `webapp-instance-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `webapp-alb-${environmentSuffix}`,
      {
        name: `webapp-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [this.albSecurityGroup.id],
        subnets: this.publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false,
        tags: { ...tags, Name: `webapp-alb-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Target group for ALB
    this.targetGroup = new aws.lb.TargetGroup(
      `webapp-tg-${environmentSuffix}`,
      {
        name: `webapp-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
          port: 'traffic-port',
          protocol: 'HTTP',
        },
        tags: { ...tags, Name: `webapp-tg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ALB Listener
    new aws.lb.Listener(
      `webapp-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: '80',
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnets: pulumi.output(this.publicSubnets.map(s => s.id)),
      privateSubnets: pulumi.output(this.privateSubnets.map(s => s.id)),
      albDnsName: this.alb.dnsName,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}

