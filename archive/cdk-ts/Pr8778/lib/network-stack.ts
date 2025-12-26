import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly loadBalancerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `WebApp-VPC-${props.environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.1.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      flowLogs: {
        cloudwatch: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Load Balancer Security Group
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSG',
      {
        vpc: this.vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Web Server Security Group
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSG', {
      vpc: this.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    this.webSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from Load Balancer'
    );

    // Database Security Group - only from web servers
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.databaseSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web servers'
    );

    // Bastion Host Security Group for secure access
    this.bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc: this.vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true,
    });

    // VPC Peering Connection to existing VPC
    // NOTE: VPC peering requires an actual VPC ID, not a CIDR
    // Commenting out for deployment as we don't have the peer VPC ID
    // const peeringConnection = new ec2.CfnVPCPeeringConnection(
    //   this,
    //   'VPCPeering',
    //   {
    //     vpcId: this.vpc.vpcId,
    //     peerVpcId: 'vpc-xxxxx', // Need actual VPC ID here
    //     peerRegion: 'us-east-1',
    //   }
    // );

    // Add route tables for peering
    // this.vpc.privateSubnets.forEach((subnet, index) => {
    //   new ec2.CfnRoute(this, `PeeringRoute${index}`, {
    //     routeTableId: subnet.routeTable.routeTableId,
    //     destinationCidrBlock: '10.0.0.0/16',
    //     vpcPeeringConnectionId: peeringConnection.ref,
    //   });
    // });

    // Tags for all network resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Network');
  }
}
