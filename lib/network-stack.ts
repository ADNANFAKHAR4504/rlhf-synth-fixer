import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // Create VPC with specific CIDR
    this.vpc = new ec2.Vpc(this, 'RetailVPC', {
      vpcName: `retail-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.2.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Add VPC endpoints for S3
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    // Create Security Group for RDS
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `retail-db-sg-${props.environmentSuffix}`,
        description: 'Security group for RDS PostgreSQL database',
        allowAllOutbound: false,
      }
    );

    // Allow PostgreSQL traffic from within VPC
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.2.0.0/16'),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    // Allow HTTPS for S3 backup connectivity
    this.databaseSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('10.2.0.0/16'),
      ec2.Port.tcp(443),
      'Allow HTTPS for S3 backups'
    );

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.databaseSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });
  }
}
