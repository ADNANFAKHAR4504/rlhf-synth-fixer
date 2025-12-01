import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly efsSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'HealthcareVpc', {
      vpcName: `healthcare-vpc-${props.environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1, // Cost optimization: single NAT gateway
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ALB Security Group - accepts traffic from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `alb-sg-${props.environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // ECS Security Group - accepts traffic only from ALB
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ecs-sg-${props.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // RDS Security Group - accepts traffic only from ECS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `rds-sg-${props.environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    this.rdsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from ECS tasks'
    );

    // EFS Security Group - accepts traffic only from ECS
    this.efsSecurityGroup = new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `efs-sg-${props.environmentSuffix}`,
      description: 'Security group for EFS',
      allowAllOutbound: false,
    });

    this.efsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow NFS traffic from ECS tasks'
    );

    // Add tags
    cdk.Tags.of(this.vpc).add(
      'Name',
      `healthcare-vpc-${props.environmentSuffix}`
    );
  }
}
