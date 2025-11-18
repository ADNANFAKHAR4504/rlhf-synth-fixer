import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface NetworkingStackProps extends cdk.StackProps {
  environmentSuffix: string;
  encryptionKey: kms.IKey;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly flowLogsBucket: s3.Bucket;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // S3 bucket for VPC Flow Logs with 90-day retention
    this.flowLogsBucket = new s3.Bucket(this, 'FlowLogsBucket', {
      bucketName: `vpc-flow-logs-${props.environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'FlowLogsRetention',
          enabled: true,
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    // VPC with private subnets across 3 AZs, no internet gateway on database subnets
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 3,
      natGateways: 1, // Minimal NAT for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // No internet gateway
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
    });

    // CloudWatch Log Group for VPC Flow Logs with KMS encryption
    const flowLogsLogGroup = new logs.LogGroup(this, 'FlowLogsLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${props.environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      encryptionKey: props.encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for VPC Flow Logs
    const flowLogsRole = new iam.Role(this, 'FlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    flowLogsLogGroup.grantWrite(flowLogsRole);
    this.flowLogsBucket.grantWrite(flowLogsRole);

    // VPC Flow Logs to S3 with 90-day retention
    new ec2.FlowLog(this, 'FlowLogsToS3', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toS3(
        this.flowLogsBucket,
        'flow-logs/'
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Flow Logs to CloudWatch
    new ec2.FlowLog(this, 'FlowLogsToCloudWatch', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsLogGroup,
        flowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security group for application tier with explicit egress rules
    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    // Allow HTTPS outbound only
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS API calls'
    );

    // Security group for database tier with no outbound internet
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for database tier - no internet access',
        allowAllOutbound: false,
      }
    );

    // Allow database access only from application security group
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from application tier'
    );

    // Allow app to connect to database
    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow connection to database'
    );

    // Apply tags
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'security-team');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'FlowLogsBucketName', {
      value: this.flowLogsBucket.bucketName,
      description: 'VPC Flow Logs S3 Bucket',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });
  }
}
