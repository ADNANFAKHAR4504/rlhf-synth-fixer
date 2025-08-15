import { Stack, StackProps, CfnOutput, Duration, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';

export interface ProductionWebAppStackProps extends StackProps {
  readonly certificateArn?: string;
  readonly alarmEmail: string;
  readonly approvedSshCidr: string;
  readonly testing?: boolean;
}

export class ProductionWebAppStack extends Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly ec2Instance: ec2.Instance;
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly s3Bucket: s3.Bucket;
  public readonly applicationLoadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly cloudFrontDistribution: cloudfront.Distribution;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: ProductionWebAppStackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-west-2' },
    });

    // Add production tags to all resources in this stack
    Tags.of(this).add('env', 'production');

    // Create VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1, // Cost optimization - single NAT gateway
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
      ],
    });

    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Create S3 Bucket with versioning and security
    this.s3Bucket = new s3.Bucket(this, 'ProductionS3Bucket', {
      versioned: true, // Enable versioning for data protection
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    // Create CloudFront Distribution
    this.cloudFrontDistribution = new cloudfront.Distribution(
      this,
      'ProductionCloudFront',
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(this.s3Bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: 'index.html',
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Cost optimization
      }
    );

    // Create IAM Role for EC2 with S3 read-only access
    const ec2Role = new iam.Role(this, 'EC2S3ReadOnlyRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'EC2 role with S3 read-only access for production',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Create Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.approvedSshCidr),
      ec2.Port.tcp(22),
      'Allow SSH from approved IP range'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from EC2 instances'
    );

    // Create Application Load Balancer
    this.applicationLoadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'ProductionALB',
      {
        vpc: this.vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnets: this.publicSubnets,
        },
      }
    );

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'ProductionTargetGroup',
      {
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
        },
      }
    );

    // HTTP Listener (redirects to HTTPS)
    this.applicationLoadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS Listener (conditional based on certificate availability)
    if (props.certificateArn && !props.testing) {
      const certificate = elbv2.ListenerCertificate.fromArn(
        props.certificateArn
      );
      this.applicationLoadBalancer.addListener('HTTPSListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultAction: elbv2.ListenerAction.forward([targetGroup]),
      });
    } else {
      // For testing/development, create output notice instead of HTTPS listener
      // In production, you should always provide a valid certificate ARN
      new CfnOutput(this, 'HTTPSListenerNotice', {
        value:
          'HTTPS listener not created. Please provide CERTIFICATE_ARN environment variable for production deployment.',
      });
    }

    // Create RDS Instance with Multi-AZ and encryption
    this.rdsInstance = new rds.DatabaseInstance(this, 'ProductionRDS', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_12, // Using a more widely available version
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnets: this.privateSubnets,
      },
      securityGroups: [rdsSecurityGroup],
      multiAz: true, // Multi-AZ for high availability
      storageEncrypted: true, // Encryption at rest
      backupRetention: Duration.days(7),
      deletionProtection: true, // Prevent accidental deletion in production
      databaseName: 'productiondb',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: 'production-db-credentials',
      }),
    });

    // Create EC2 Instance in private subnet
    this.ec2Instance = new ec2.Instance(this, 'ProductionEC2Instance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc: this.vpc,
      vpcSubnets: {
        subnets: this.privateSubnets,
      },
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
    });

    // Register EC2 instance with target group
    targetGroup.addTarget(
      new targets.InstanceIdTarget(this.ec2Instance.instanceId)
    );

    // Create SNS Topic for alarms
    this.alarmTopic = new sns.Topic(this, 'ProductionAlarmTopic', {
      displayName: 'Production Environment Alarms',
    });

    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(props.alarmEmail)
    );

    // CloudWatch Alarms
    const ec2CpuAlarm = new cloudwatch.Alarm(this, 'EC2HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: this.ec2Instance.instanceId,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 75,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'Alarm if EC2 instance CPU exceeds 75%',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      actionsEnabled: true,
    });

    ec2CpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // RDS CPU Alarm
    const rdsCpuAlarm = new cloudwatch.Alarm(this, 'RDSHighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: this.rdsInstance.instanceIdentifier,
        },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'Alarm if RDS instance CPU exceeds 80%',
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      actionsEnabled: true,
    });

    rdsCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // ALB Target Health Alarm
    const albUnhealthyTargetsAlarm = new cloudwatch.Alarm(
      this,
      'ALBUnhealthyTargetsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'UnHealthyHostCount',
          dimensionsMap: {
            TargetGroup: targetGroup.targetGroupFullName,
            LoadBalancer: this.applicationLoadBalancer.loadBalancerFullName,
          },
          statistic: 'Average',
          period: Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        alarmDescription: 'Alarm if there are unhealthy targets in ALB',
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        actionsEnabled: true,
      }
    );

    albUnhealthyTargetsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Outputs
    new CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'Production VPC ID',
    });

    new CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'Production S3 Bucket Name',
    });

    new CfnOutput(this, 'CloudFrontDistributionDomainName', {
      value: this.cloudFrontDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new CfnOutput(this, 'ApplicationLoadBalancerDNS', {
      value: this.applicationLoadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new CfnOutput(this, 'RDSEndpoint', {
      value: this.rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new CfnOutput(this, 'EC2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'Production EC2 Instance ID',
    });

    new CfnOutput(this, 'AlarmSNSTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS Topic ARN for Alarms',
    });
  }
}
