/**
 * network-stack.ts
 *
 * Network infrastructure: VPC, Subnets, NAT Gateways, Transit Gateway, VPC Flow Logs
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  vpcCidr: string;
  regions: {
    primary: string;
    replicas: string[];
  };
  tags: pulumi.Input<{ [key: string]: string }>;
  enableTransitGateway: boolean;
  enableFlowLogs: boolean;
  kmsKeyId: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  // optional provider passed from TapStack so lookups and resources use same region
  awsProvider?: aws.Provider;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly transitGatewayId: pulumi.Output<string>;
  public readonly natGatewayIds: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    const {
      environmentSuffix,
      vpcCidr,
      regions,
      tags,
      enableTransitGateway,
      enableFlowLogs,
      kmsKeyArn,
      awsProvider,
    } = args;

    // Create a reusable resource options object that includes the provider (if provided)
    const resOpts: pulumi.ResourceOptions = awsProvider
      ? { parent: this, provider: awsProvider }
      : { parent: this };

    //  Primary VPC
    const vpc = new aws.ec2.Vpc(
      `banking-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-vpc-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    // --- Get Availability Zones using the same provider so AZ names match provider region ---
    const availabilityZones = aws.getAvailabilityZones(
      { state: 'available' },
      awsProvider ? { provider: awsProvider } : {}
    );

    // --- Public Subnets (3 AZs) ---
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `banking-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.29.${i}.0/24`,
          // resolve AZ name from the provider-scoped availabilityZones lookup
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `banking-public-subnet-${i}-${environmentSuffix}`,
            Tier: 'Public',
          })),
        },
        resOpts
      );
      publicSubnets.push(subnet);
    }

    //  Private Subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `banking-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.29.${10 + i}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `banking-private-subnet-${i}-${environmentSuffix}`,
            Tier: 'Private',
          })),
        },
        resOpts
      );
      privateSubnets.push(subnet);
    }

    //  Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `banking-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-igw-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    // Single NAT Gateway for dev environments
    const natEip = new aws.ec2.Eip(
      `banking-nat-eip-0-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-nat-eip-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    const natGateway = new aws.ec2.NatGateway(
      `banking-nat-0-${environmentSuffix}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnets[0].id,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-nat-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    //  Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `banking-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-public-rt-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    // Associate Public Subnets with Public Route Table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `banking-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        resOpts
      );
    });

    //  Single Private Route Table for all private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `banking-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-private-rt-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    // Associate all private subnets with the single route table
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `banking-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        resOpts
      );
    });

    //  VPC Flow Logs
    if (enableFlowLogs) {
      const flowLogsRole = new aws.iam.Role(
        `banking-flowlogs-role-${environmentSuffix}`,
        {
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
            ],
          }),
          tags: tags,
        },
        resOpts
      );

      new aws.iam.RolePolicy(
        `banking-flowlogs-policy-${environmentSuffix}`,
        {
          role: flowLogsRole.id,
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
        resOpts
      );

      const flowLogsGroup = new aws.cloudwatch.LogGroup(
        `banking-flowlogs-${environmentSuffix}`,
        {
          retentionInDays: 30,
          kmsKeyId: kmsKeyArn,
          tags: tags,
        },
        resOpts
      );

      new aws.ec2.FlowLog(
        `banking-flowlog-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          trafficType: 'ALL',
          iamRoleArn: flowLogsRole.arn,
          logDestination: flowLogsGroup.arn,
          tags: tags,
        },
        resOpts
      );
    }

    //  Transit Gateway (for multi-region connectivity)
    let transitGateway: aws.ec2transitgateway.TransitGateway | undefined;
    if (enableTransitGateway) {
      transitGateway = new aws.ec2transitgateway.TransitGateway(
        `banking-tgw-${environmentSuffix}`,
        {
          description: 'Transit Gateway for multi-region banking platform',
          defaultRouteTableAssociation: 'enable',
          defaultRouteTablePropagation: 'enable',
          dnsSupport: 'enable',
          vpnEcmpSupport: 'enable',
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `banking-tgw-${environmentSuffix}`,
          })),
        },
        resOpts
      );

      // Attach VPC to Transit Gateway
      new aws.ec2transitgateway.VpcAttachment(
        `banking-tgw-attachment-${environmentSuffix}`,
        {
          transitGatewayId: transitGateway.id,
          vpcId: vpc.id,
          subnetIds: privateSubnets.map(s => s.id),
          dnsSupport: 'enable',
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `banking-tgw-attachment-${environmentSuffix}`,
          })),
        },
        resOpts
      );
    }

    // VPC Endpoints for AWS Services
    const vpcEndpointSecurityGroup = new aws.ec2.SecurityGroup(
      `banking-vpce-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: [vpcCidr],
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-vpce-sg-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    // Interface endpoints for AWS services
    const interfaceEndpoints = [
      'ec2',
      'ecr.api',
      'ecr.dkr',
      'ecs',
      'ecs-agent',
      'ecs-telemetry',
      'logs',
      'secretsmanager',
      'kms',
    ];

    interfaceEndpoints.forEach(service => {
      new aws.ec2.VpcEndpoint(
        `banking-vpce-${service}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          serviceName: `com.amazonaws.${regions.primary}.${service}`,
          vpcEndpointType: 'Interface',
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [vpcEndpointSecurityGroup.id],
          privateDnsEnabled: true,
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `banking-vpce-${service}-${environmentSuffix}`,
          })),
        },
        resOpts
      );
    });

    // Gateway endpoints
    new aws.ec2.VpcEndpoint(
      `banking-vpce-s3-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${regions.primary}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-vpce-s3-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    new aws.ec2.VpcEndpoint(
      `banking-vpce-dynamodb-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${regions.primary}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [publicRouteTable.id],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `banking-vpce-dynamodb-${environmentSuffix}`,
        })),
      },
      resOpts
    );

    //  Outputs
    this.primaryVpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.transitGatewayId = transitGateway
      ? transitGateway.id
      : pulumi.output('');
    this.natGatewayIds = pulumi.output([natGateway.id]);

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      transitGatewayId: this.transitGatewayId,
      natGatewayIds: this.natGatewayIds,
    });
  }
}
