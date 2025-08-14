import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, `secure-${props.environmentSuffix}-vpc`, {
      vpcName: `secure-${props.environmentSuffix}-vpc`,
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: `secure-${props.environmentSuffix}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `secure-${props.environmentSuffix}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: `secure-${props.environmentSuffix}-isolated`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;

    // Create strict Network ACLs for additional security
    const privateNacl = new ec2.NetworkAcl(
      this,
      `secure-${props.environmentSuffix}-private-nacl`,
      {
        vpc: this.vpc,
        networkAclName: `secure-${props.environmentSuffix}-private-nacl`,
      }
    );

    // Allow HTTPS outbound from private subnets
    privateNacl.addEntry(`secure-${props.environmentSuffix}-https-out`, {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    // Allow HTTP outbound for package updates
    privateNacl.addEntry(`secure-${props.environmentSuffix}-http-out`, {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    // Apply tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('ProjectName', 'secure-infrastructure');
    cdk.Tags.of(this).add('CostCenter', 'security-team');
  }
}
