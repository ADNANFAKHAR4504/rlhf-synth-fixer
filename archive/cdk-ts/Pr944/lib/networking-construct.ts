import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  primaryVpcId?: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: cdk.aws_ec2.Vpc;
  public vpcPeeringConnection?: cdk.aws_ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, isPrimary, primaryVpcId } = props;

    // Create VPC with appropriate CIDR blocks to avoid overlap
    const vpcCidr = isPrimary ? '10.0.0.0/16' : '10.1.0.0/16';

    this.vpc = new cdk.aws_ec2.Vpc(this, 'MainVpc', {
      vpcName: `${environmentSuffix}-vpc-${region}`,
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2, // Cost-efficient: use fewer NAT gateways
    });

    // VPC Flow Logs for security monitoring
    new cdk.aws_ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: cdk.aws_ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: cdk.aws_ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: cdk.aws_ec2.FlowLogTrafficType.ALL,
    });

    // Setup VPC Peering for secondary region connecting to primary
    if (!isPrimary && primaryVpcId) {
      this.setupVpcPeering(environmentSuffix, region, primaryVpcId);
    }

    // Security Groups
    this.createSecurityGroups(environmentSuffix);
  }

  private setupVpcPeering(
    environmentSuffix: string,
    region: string,
    primaryVpcId: string
  ): void {
    // Create VPC Peering Connection from secondary to primary region
    this.vpcPeeringConnection = new cdk.aws_ec2.CfnVPCPeeringConnection(
      this,
      'VpcPeeringConnection',
      {
        vpcId: this.vpc.vpcId,
        peerVpcId: primaryVpcId,
        peerRegion: 'us-east-1', // Primary is always in us-east-1
        tags: [
          {
            key: 'Name',
            value: `${environmentSuffix}-vpc-peering-${region}-to-us-east-1`,
          },
          {
            key: 'CostOptimized',
            value: 'true',
          },
        ],
      }
    );

    // Add routes to private subnets for cross-region communication
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.aws_ec2.CfnRoute(this, `PeeringRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '10.0.0.0/16', // Primary VPC CIDR
        vpcPeeringConnectionId: this.vpcPeeringConnection!.ref,
      });
    });
  }

  private createSecurityGroups(environmentSuffix: string): void {
    // ALB Security Group
    new cdk.aws_ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environmentSuffix}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Lambda Security Group
    new cdk.aws_ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environmentSuffix}-lambda-sg`,
      description: 'Security group for Lambda functions',
      allowAllOutbound: true,
    });

    // RDS Security Group
    new cdk.aws_ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${environmentSuffix}-rds-sg`,
      description: 'Security group for RDS instances',
      allowAllOutbound: false,
    });
  }
}
