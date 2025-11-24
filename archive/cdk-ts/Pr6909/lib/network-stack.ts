import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // VPC with private subnets for RDS and Lambda
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `postgres-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        securityGroupName: `rds-sg-${environmentSuffix}`,
        vpc: this.vpc,
        description: `Security group for PostgreSQL RDS in ${region}`,
        allowAllOutbound: true,
      }
    );

    // Allow PostgreSQL traffic within VPC
    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Security Group for Lambda
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        securityGroupName: `lambda-sg-${environmentSuffix}`,
        vpc: this.vpc,
        description: `Security group for Lambda functions in ${region}`,
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
    cdk.Tags.of(this.vpc).add('Name', `postgres-vpc-${environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Region', region);
    cdk.Tags.of(this.vpc).add('Purpose', 'PostgreSQL');

    // Outputs
    new cdk.CfnOutput(this, 'VpcIdOutput', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: this.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${region}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: this.dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${region}`,
    });
  }
}
