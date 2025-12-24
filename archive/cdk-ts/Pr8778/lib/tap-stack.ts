import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

// LocalStack detection
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly contentBucket: s3.Bucket;
  public readonly database: rds.DatabaseInstance;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ========================================
    // NETWORK INFRASTRUCTURE
    // ========================================

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `WebApp-VPC-${environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.1.0.0/16',
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Load Balancer Security Group
    const loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSG',
      {
        vpc: this.vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Web Server Security Group
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSG', {
      vpc: this.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      loadBalancerSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from Load Balancer'
    );

    // Database Security Group - only from web servers
    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    databaseSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web servers'
    );

    // ========================================
    // SECURITY AND IAM
    // ========================================

    // KMS Key for encryption (simplified for LocalStack)
    const kmsKey = new kms.Key(this, 'WebAppKMSKey', {
      description: 'KMS key for web application encryption',
      enableKeyRotation: !isLocalStack, // Disable rotation for LocalStack
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    kmsKey.addAlias(`webapp-key-${environmentSuffix}`);

    // SNS Topic for alerts
    const alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      displayName: `WebApp Alerts ${environmentSuffix}`,
      masterKey: isLocalStack ? undefined : kmsKey, // Skip KMS for LocalStack
    });

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // S3 Access Role with restricted permissions
    const s3AccessRole = new iam.Role(this, 'S3AccessRole', {
      assumedBy: ec2Role,
      description: 'Restricted S3 access role for web application',
    });

    // CloudWatch Log Group (simplified for LocalStack)
    new logs.LogGroup(this, 'WebAppLogs', {
      logGroupName: `/aws/webapp/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: isLocalStack ? undefined : kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ========================================
    // STORAGE (S3 only - CloudFront removed)
    // ========================================

    // S3 Bucket for web content with encryption
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      encryption: isLocalStack
        ? s3.BucketEncryption.S3_MANAGED
        : s3.BucketEncryption.KMS,
      encryptionKey: isLocalStack ? undefined : kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 bucket policy for restricted access
    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RestrictToSpecificRole',
        effect: iam.Effect.ALLOW,
        principals: [s3AccessRole],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [this.contentBucket.arnForObjects('*')],
      })
    );

    // ========================================
    // DATABASE (Simplified for LocalStack)
    // ========================================

    // DB Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS Instance (simplified for LocalStack)
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `webapp-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSecurityGroup],
      subnetGroup: subnetGroup,
      storageEncrypted: !isLocalStack, // Skip encryption for LocalStack
      storageEncryptionKey: isLocalStack ? undefined : kmsKey,
      backupRetention: isLocalStack
        ? cdk.Duration.days(0)
        : cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      multiAz: false,
      publiclyAccessible: false,
      autoMinorVersionUpgrade: false,
      allowMajorVersionUpgrade: false,
      enablePerformanceInsights: false, // Disable for LocalStack
      monitoringInterval: cdk.Duration.seconds(0), // Disable enhanced monitoring
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Simplified CloudWatch Alarm for RDS
    if (!isLocalStack) {
      new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
        alarmName: `RDS-CPU-${environmentSuffix}`,
        alarmDescription: 'RDS CPU utilization is high',
        metric: this.database.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }).addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));
    }

    // ========================================
    // COMPUTE (Auto Scaling Group and ALB)
    // ========================================

    // User Data for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y nginx',
      'cat > /usr/share/nginx/html/index.html << EOF',
      `<html><body><h1>WebApp Running on ${environmentSuffix}</h1></body></html>`,
      'EOF',
      'systemctl start nginx',
      'systemctl enable nginx'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: webSecurityGroup,
      userData: userData,
      role: ec2Role,
      requireImdsv2: !isLocalStack, // Simplify for LocalStack
    });

    // Auto Scaling Group (simplified for LocalStack)
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc: this.vpc,
        launchTemplate: launchTemplate,
        minCapacity: isLocalStack ? 1 : 2,
        maxCapacity: isLocalStack ? 2 : 6,
        desiredCapacity: isLocalStack ? 1 : 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(2),
        }),
      }
    );

    // Fix for LocalStack: Explicitly set launch template version
    if (isLocalStack) {
      const cfnAsg = this.autoScalingGroup.node
        .defaultChild as autoscaling.CfnAutoScalingGroup;
      cfnAsg.launchTemplate = {
        launchTemplateId: launchTemplate.launchTemplateId,
        version: '$Latest',
      };
    }

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc: this.vpc,
        internetFacing: true,
        securityGroup: loadBalancerSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: this.vpc,
      targets: [this.autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
      },
      targetGroupName: `webapp-tg-${environmentSuffix}`.substring(0, 32),
    });

    // HTTP Listener
    this.loadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Simplified Scaling Policy
    if (!isLocalStack) {
      this.autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
        targetUtilizationPercent: 70,
        cooldown: cdk.Duration.minutes(5),
      });
    }

    // ========================================
    // OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.contentBucket.bucketName,
      description: 'S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    // Tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
  }
}
