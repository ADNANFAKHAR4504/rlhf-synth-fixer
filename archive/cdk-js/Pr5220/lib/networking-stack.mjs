import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkingStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix;

    // Create VPC with multi-AZ configuration
    this.vpc = new ec2.Vpc(this, 'HealthTechVPC', {
      vpcName: `healthtech-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1, // Cost optimization - single NAT gateway
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
    });

    // Security group for database access
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      securityGroupName: `db-sg-${environmentSuffix}`,
      vpc: this.vpc,
      description: 'Security group for RDS database access',
      allowAllOutbound: false,
    });

    // Security group for ECS tasks
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      securityGroupName: `ecs-sg-${environmentSuffix}`,
      vpc: this.vpc,
      description: 'Security group for ECS Fargate tasks',
    });

    // Security group for ElastiCache
    this.cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      securityGroupName: `cache-sg-${environmentSuffix}`,
      vpc: this.vpc,
      description: 'Security group for ElastiCache cluster',
      allowAllOutbound: false,
    });

    // Security group for EFS
    this.efsSecurityGroup = new ec2.SecurityGroup(this, 'EFSSecurityGroup', {
      securityGroupName: `efs-sg-${environmentSuffix}`,
      vpc: this.vpc,
      description: 'Security group for EFS filesystem',
      allowAllOutbound: false,
    });

    // Allow ECS to access database
    this.dbSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow ECS tasks to access RDS'
    );

    // Allow ECS to access ElastiCache
    this.cacheSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow ECS tasks to access ElastiCache'
    );

    // Allow ECS to access EFS
    this.efsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow ECS tasks to access EFS'
    );

    // VPC Flow Logs for audit compliance
    const logGroup = new cdk.aws_logs.LogGroup(this, 'VPCFlowLogs', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'FlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup),
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'HealthTech-DR');
    cdk.Tags.of(this).add('Compliance', 'HIPAA');
  }
}
