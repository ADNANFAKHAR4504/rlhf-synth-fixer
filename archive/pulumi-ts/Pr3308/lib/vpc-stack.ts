import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix: string;
  vpcCidr?: string;
  enableFlowLogs?: boolean;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const vpcCidr = args.vpcCidr || '10.5.0.0/16';
    const enableFlowLogs = args.enableFlowLogs !== false;

    // Use hardcoded AZs for now - in real deployment, getAvailabilityZones would work
    const azNames = ['us-east-2a', 'us-east-2b'];

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `${name}-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${name}-vpc-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `${name}-igw-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${name}-igw-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create public and private subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < azNames.length; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `${name}-public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.5.${i * 2}.0/24`,
          availabilityZone: azNames[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${name}-public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Public',
            ...args.tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);

      const privateSubnet = new aws.ec2.Subnet(
        `${name}-private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.5.${i * 2 + 1}.0/24`,
          availabilityZone: azNames[i],
          tags: {
            Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Private',
            ...args.tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Create NAT Gateways for private subnets
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < publicSubnets.length; i++) {
      const subnet = publicSubnets[i];
      const eip = new aws.ec2.Eip(
        `${name}-nat-eip-${i}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            Name: `${name}-nat-eip-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );

      const natGateway = new aws.ec2.NatGateway(
        `${name}-nat-${i}-${args.environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: {
            Name: `${name}-nat-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt-${args.environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${name}-public-rt-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `${name}-public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    for (let i = 0; i < publicSubnets.length; i++) {
      const subnet = publicSubnets[i];
      new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    }

    for (let i = 0; i < privateSubnets.length; i++) {
      const subnet = privateSubnets[i];
      const privateRouteTable = new aws.ec2.RouteTable(
        `${name}-private-rt-${i}-${args.environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `${name}-private-rt-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `${name}-private-route-${i}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // Enable VPC Flow Logs (conditionally)
    if (enableFlowLogs) {
      const flowLogRole = new aws.iam.Role(
        `${name}-flow-log-role-${args.environmentSuffix}`,
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
          tags: args.tags,
        },
        { parent: this }
      );

      new aws.iam.RolePolicyAttachment(
        `${name}-flow-log-policy-${args.environmentSuffix}`,
        {
          role: flowLogRole.name,
          policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
        },
        { parent: this }
      );

      const flowLogGroup = new aws.cloudwatch.LogGroup(
        `${name}-flow-logs-${args.environmentSuffix}`,
        {
          retentionInDays: 7,
          tags: args.tags,
        },
        { parent: this }
      );

      new aws.ec2.FlowLog(
        `${name}-flow-log-${args.environmentSuffix}`,
        {
          iamRoleArn: flowLogRole.arn,
          logDestinationType: 'cloud-watch-logs',
          logDestination: flowLogGroup.arn,
          trafficType: 'ALL',
          vpcId: vpc.id,
          tags: {
            Name: `${name}-flow-log-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        { parent: this }
      );
    }

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
