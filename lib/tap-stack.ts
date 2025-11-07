import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly flowLogBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Mandatory tags
    const mandatoryTags = {
      Environment: 'production',
      Project: 'payment-processor',
      CostCenter: 'engineering',
    };

    // Create S3 bucket for VPC Flow Logs
    this.flowLogBucket = new s3.Bucket(
      this,
      `FlowLogBucket${environmentSuffix}`,
      {
        bucketName: `vpc-flow-logs-${environmentSuffix}-${this.account}-${this.region}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Apply tags to bucket
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.flowLogBucket).add(key, value);
    });

    // Create VPC with specific configuration
    this.vpc = new ec2.Vpc(this, `PaymentVPC${environmentSuffix}`, {
      vpcName: `payment-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1, // One NAT Gateway to save costs and EIP addresses
    });

    // Apply tags to VPC
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // Create VPC Flow Logs to S3
    new ec2.FlowLog(this, `VPCFlowLog${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toS3(this.flowLogBucket),
      trafficType: ec2.FlowLogTrafficType.ALL,
      flowLogName: `vpc-flow-log-${environmentSuffix}`,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    // Add S3 Gateway Endpoint
    this.vpc.addGatewayEndpoint(`S3Endpoint${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: this.vpc.privateSubnets,
        },
      ],
    });

    // Add DynamoDB Gateway Endpoint
    this.vpc.addGatewayEndpoint(`DynamoDBEndpoint${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnets: this.vpc.privateSubnets,
        },
      ],
    });

    // Create ALB Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    // Add ingress rules for ALB (HTTP and HTTPS)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Apply tags to ALB security group
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.albSecurityGroup).add(key, value);
    });

    // Create ECS Security Group
    this.ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `ECSSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `ecs-sg-${environmentSuffix}`,
        description: 'Security group for ECS Fargate containers',
        allowAllOutbound: true,
      }
    );

    // Add ingress rule for ECS (only from ALB)
    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB on port 8080'
    );

    // Apply tags to ECS security group
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.ecsSecurityGroup).add(key, value);
    });

    // Create RDS Security Group
    this.rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `rds-sg-${environmentSuffix}`,
        description: 'Security group for RDS Aurora PostgreSQL',
        allowAllOutbound: false,
      }
    );

    // Add ingress rule for RDS (only from ECS)
    this.rdsSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from ECS containers'
    );

    // Apply tags to RDS security group
    Object.entries(mandatoryTags).forEach(([key, value]) => {
      cdk.Tags.of(this.rdsSecurityGroup).add(key, value);
    });

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnetIds-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `PrivateSubnetIds-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: this.albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `ALBSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ECSSecurityGroupId', {
      value: this.ecsSecurityGroup.securityGroupId,
      description: 'ECS Security Group ID',
      exportName: `ECSSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RDSSecurityGroupId', {
      value: this.rdsSecurityGroup.securityGroupId,
      description: 'RDS Security Group ID',
      exportName: `RDSSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FlowLogBucketName', {
      value: this.flowLogBucket.bucketName,
      description: 'S3 Bucket for VPC Flow Logs',
      exportName: `FlowLogBucketName-${environmentSuffix}`,
    });
  }
}
