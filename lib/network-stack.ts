import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environmentSuffix, isPrimary, primaryRegion, drRegion } = props;
    const currentRegion = isPrimary ? primaryRegion : drRegion;

    // VPC with private subnets for RDS and Lambda
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `postgres-dr-vpc-${environmentSuffix}-${currentRegion}`,
      ipAddresses: ec2.IpAddresses.cidr(
        isPrimary ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      maxAzs: 3,
      natGateways: 2, // For high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `private-db-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `private-lambda-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        securityGroupName: `rds-sg-${environmentSuffix}-${currentRegion}`,
        vpc: this.vpc,
        description: `Security group for PostgreSQL RDS in ${currentRegion}`,
        allowAllOutbound: true,
      }
    );

    // Allow PostgreSQL traffic within VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Allow traffic from the other region's VPC for cross-region replication
    const peerVpcCidr = isPrimary ? '10.1.0.0/16' : '10.0.0.0/16';
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(peerVpcCidr),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from peer VPC'
    );

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        securityGroupName: `lambda-sg-${environmentSuffix}-${currentRegion}`,
        vpc: this.vpc,
        description: `Security group for Lambda functions in ${currentRegion}`,
        allowAllOutbound: true,
      }
    );

    // VPC Endpoints for AWS services (cost optimization - avoid NAT charges)
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('SnsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Tags
    cdk.Tags.of(this.vpc).add(
      'Name',
      `postgres-dr-vpc-${environmentSuffix}-${currentRegion}`
    );
    cdk.Tags.of(this.vpc).add('Region', currentRegion);
    cdk.Tags.of(this.vpc).add('Purpose', 'PostgreSQL-DR');

    // Outputs
    new cdk.CfnOutput(this, 'VpcIdOutput', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: this.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${currentRegion}`,
    });
  }
}
