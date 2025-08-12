import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MigrationVpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class MigrationVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly sshSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: MigrationVpcStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with public subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'MigrationVpc', {
      vpcName: `migration-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
      natGateways: 0, // No NAT gateways needed for public-only setup
    });

    // Store public subnets for reference
    this.publicSubnets = this.vpc.publicSubnets;

    // Create security group for SSH access (temporary migration exception)
    this.sshSecurityGroup = new ec2.SecurityGroup(this, 'MigrationSshSg', {
      vpc: this.vpc,
      securityGroupName: `migration-ssh-sg-${environmentSuffix}`,
      description:
        'Security group allowing SSH access for migration (temporary exception)',
      allowAllOutbound: true,
    });

    // Add SSH inbound rule from anywhere (temporary exception)
    this.sshSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere (temporary migration exception)'
    );

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Network');

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for migration infrastructure',
      exportName: `migration-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: `migration-public-subnet-ids-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
      exportName: `migration-ssh-sg-id-${environmentSuffix}`,
    });
  }
}
