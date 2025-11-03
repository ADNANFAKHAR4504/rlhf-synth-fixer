/**
 * tap-stack.ts
 *
 * Payment Processing System - Cloud Environment Setup
 *
 * This Pulumi TypeScript program sets up a foundational AWS cloud environment
 * for a payment processing system in ap-southeast-2 region with multi-AZ
 * architecture for high availability.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the Payment Processing infrastructure.
 *
 * This component creates a complete VPC environment with:
 * - Multi-AZ public and private subnets
 * - NAT Gateways for outbound connectivity
 * - S3 bucket for transaction logs
 * - VPC Flow Logs for network monitoring
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly s3BucketName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Define base tags required by the task
    const baseTags = {
      Environment: environmentSuffix,
      Project: 'payment-processing',
      ManagedBy: 'pulumi',
      ...args.tags,
    };

    // Configure AWS provider for ap-southeast-2 region
    const provider = new aws.Provider(
      `payment-provider-${environmentSuffix}`,
      {
        region: 'ap-southeast-2',
        defaultTags: {
          tags: baseTags,
        },
      },
      { parent: this }
    );

    // Get availability zones for the region
    const azs = aws.getAvailabilityZonesOutput(
      {
        state: 'available',
      },
      { provider }
    );

    // Create VPC with CIDR block 10.0.0.0/16
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...baseTags,
          Name: `payment-vpc-${environmentSuffix}`,
        },
      },
      { parent: this, provider }
    );

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...baseTags,
          Name: `payment-igw-${environmentSuffix}`,
        },
      },
      { parent: this, provider }
    );

    // Create Public Subnets (3 across different AZs)
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const publicSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const az = azs.names[i];
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: publicSubnetCidrs[i],
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...baseTags,
            Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this, provider }
      );
      publicSubnets.push(subnet);
    }

    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // Create Private Subnets (3 across different AZs)
    const privateSubnetCidrs = [
      '10.0.101.0/24',
      '10.0.102.0/24',
      '10.0.103.0/24',
    ];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      const az = azs.names[i];
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: privateSubnetCidrs[i],
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...baseTags,
            Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this, provider }
      );
      privateSubnets.push(subnet);
    }

    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Create Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...baseTags,
          Name: `payment-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this, provider }
    );

    // Add route to Internet Gateway for public route table
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this, provider }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this, provider }
      );
    });

    // Create Elastic IPs and NAT Gateways for each public subnet
    const natGateways: aws.ec2.NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Allocate Elastic IP
      const eip = new aws.ec2.Eip(
        `payment-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...baseTags,
            Name: `payment-eip-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this, provider }
      );

      // Create NAT Gateway
      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i + 1}-${environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...baseTags,
            Name: `payment-nat-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this, provider }
      );

      natGateways.push(natGateway);
    }

    // Create Private Route Tables and Routes for each private subnet
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...baseTags,
            Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this, provider }
      );

      // Add route to NAT Gateway
      new aws.ec2.Route(
        `payment-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this, provider }
      );

      // Associate private subnet with its route table
      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this, provider }
      );
    });

    // Create S3 bucket for transaction logs with unique name
    const randomSuffix = environmentSuffix;
    const s3Bucket = new aws.s3.BucketV2(
      `payment-logs-${randomSuffix}`,
      {
        bucket: `payment-logs-${randomSuffix}`,
        tags: {
          ...baseTags,
          Name: `payment-logs-${randomSuffix}`,
          Purpose: 'transaction-logs',
        },
      },
      { parent: this, provider }
    );

    // Enable versioning on S3 bucket
    new aws.s3.BucketVersioningV2(
      `payment-logs-versioning-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this, provider }
    );

    this.s3BucketName = s3Bucket.bucket;

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogsGroup = new aws.cloudwatch.LogGroup(
      `payment-flowlogs-${environmentSuffix}`,
      {
        name: `/aws/vpc/payment-flowlogs-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...baseTags,
          Name: `payment-flowlogs-${environmentSuffix}`,
        },
      },
      { parent: this, provider }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `payment-flowlogs-role-${environmentSuffix}`,
      {
        name: `payment-flowlogs-role-${environmentSuffix}`,
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
        tags: baseTags,
      },
      { parent: this, provider }
    );

    // Attach policy to IAM role for CloudWatch Logs
    new aws.iam.RolePolicy(
      `payment-flowlogs-policy-${environmentSuffix}`,
      {
        name: `payment-flowlogs-policy-${environmentSuffix}`,
        role: flowLogsRole.id,
        policy: pulumi.all([flowLogsGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
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
                Resource: `${logGroupArn}:*`,
              },
            ],
          })
        ),
      },
      { parent: this, provider }
    );

    // Create VPC Flow Logs to capture ALL traffic (accepted and rejected)
    new aws.ec2.FlowLog(
      `payment-flowlog-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        iamRoleArn: flowLogsRole.arn,
        logDestinationType: 'cloud-watch-logs',
        logDestination: flowLogsGroup.arn,
        trafficType: 'ALL',
        tags: {
          ...baseTags,
          Name: `payment-flowlog-${environmentSuffix}`,
        },
      },
      { parent: this, provider }
    );

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      s3BucketName: this.s3BucketName,
    });
  }
}
