import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SecureNetworkingProps {
  vpcName: string;
  cidr: string;
  maxAzs: number;
  environmentSuffix?: string;
}

export class SecureNetworking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly s3Endpoint: ec2.GatewayVpcEndpoint;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecureNetworkingProps) {
    super(scope, id);

    // Create VPC with private and public subnets
    this.vpc = new ec2.Vpc(this, 'SecureVPC', {
      vpcName: props.vpcName,
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
      maxAzs: props.maxAzs,
      natGateways: 1, // Minimize costs while maintaining security
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `Public-${props.environmentSuffix || 'dev'}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `Private-${props.environmentSuffix || 'dev'}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `Database-${props.environmentSuffix || 'dev'}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create VPC endpoint for S3 to ensure traffic doesn't traverse public internet
    this.s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create secure security group (NO SSH from 0.0.0.0/0)
    this.securityGroup = new ec2.SecurityGroup(this, 'SecureSecurityGroup', {
      vpc: this.vpc,
      description: 'Secure security group with restricted access',
      allowAllOutbound: false, // Explicit outbound rules only
    });

    // Allow HTTPS outbound for secure communications
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow HTTP outbound for package updates (consider restricting further)
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for updates'
    );

    // Allow SSH only from VPC CIDR (internal access only)
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.cidr),
      ec2.Port.tcp(22),
      'Allow SSH from VPC only'
    );

    // VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });
  }
}
