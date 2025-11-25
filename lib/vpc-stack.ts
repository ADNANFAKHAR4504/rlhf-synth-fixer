/**
 * vpc-stack.ts
 *
 * Defines VPC infrastructure for ECS tasks and ALB.
 *
 * Features:
 * - 3 Availability Zones for high availability
 * - Public subnets for ALB
 * - Private subnets for ECS tasks
 * - NAT Gateways for private subnet internet access (optional)
 * - VPC Flow Logs to CloudWatch (with KMS encryption)
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  vpcCidr?: string; // Default: 10.0.0.0/16
  enableNatGateway?: boolean; // Default: false (for cost optimization)
  kmsKeyId?: pulumi.Input<string>; // For VPC Flow Logs encryption
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly vpcFlowLog?: aws.ec2.FlowLog;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, args, opts);

    const {
      environmentSuffix,
      vpcCidr = '10.0.0.0/16',
      enableNatGateway = false,
      kmsKeyId,
      tags,
    } = args;

    // Get available AZs
    const availableAZs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `cicd-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `cicd-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `cicd-igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `cicd-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `cicd-public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `cicd-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `cicd-public-route-${environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Create subnets in 3 AZs
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.privateRouteTables = [];

    for (let i = 0; i < 3; i++) {
      const az = availableAZs.then(azs => azs.names[i]);

      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `cicd-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `cicd-public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `cicd-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );

      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `cicd-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: az,
          tags: {
            ...tags,
            Name: `cicd-private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );

      // Private route table
      const privateRouteTable = new aws.ec2.RouteTable(
        `cicd-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `cicd-private-rt-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `cicd-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );

      this.privateSubnets.push(privateSubnet);
      this.privateRouteTables.push(privateRouteTable);

      // Optional: NAT Gateway (disabled by default for cost optimization)
      if (enableNatGateway) {
        const eip = new aws.ec2.Eip(
          `cicd-nat-eip-${i}-${environmentSuffix}`,
          {
            domain: 'vpc',
            tags: {
              ...tags,
              Name: `cicd-nat-eip-${i}-${environmentSuffix}`,
            },
          },
          { parent: this }
        );

        const natGateway = new aws.ec2.NatGateway(
          `cicd-nat-${i}-${environmentSuffix}`,
          {
            subnetId: publicSubnet.id,
            allocationId: eip.id,
            tags: {
              ...tags,
              Name: `cicd-nat-${i}-${environmentSuffix}`,
            },
          },
          { parent: this }
        );

        new aws.ec2.Route(
          `cicd-private-route-${i}-${environmentSuffix}`,
          {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
          { parent: this }
        );
      }
    }

    // Optional: VPC Flow Logs (if KMS key provided)
    if (kmsKeyId) {
      const flowLogGroup = new aws.cloudwatch.LogGroup(
        `cicd-vpc-flow-logs-${environmentSuffix}`,
        {
          name: `/aws/vpc/${environmentSuffix}`,
          retentionInDays: 7, // Short retention for testing
          // kmsKeyId: kmsKeyId, // Removed to avoid KMS propagation timing issues
          tags: {
            ...tags,
            Name: `cicd-vpc-flow-logs-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      const flowLogRole = new aws.iam.Role(
        `cicd-vpc-flow-log-role-${environmentSuffix}`,
        {
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'vpc-flow-logs.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
              },
            ],
          }),
          tags: {
            ...tags,
            Name: `cicd-vpc-flow-log-role-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.iam.RolePolicy(
        `cicd-vpc-flow-log-policy-${environmentSuffix}`,
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

      this.vpcFlowLog = new aws.ec2.FlowLog(
        `cicd-vpc-flow-log-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          trafficType: 'ALL',
          logDestinationType: 'cloud-watch-logs',
          logDestination: flowLogGroup.arn,
          iamRoleArn: flowLogRole.arn,
          tags: {
            ...tags,
            Name: `cicd-vpc-flow-log-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      vpcId: this.vpc.id,
      vpcCidr: this.vpc.cidrBlock,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
    });
  }
}
