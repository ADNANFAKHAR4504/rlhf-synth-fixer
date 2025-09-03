import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const { account, region } = this;
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create stable unique suffix for resource naming
    const uniqueSuffix = `${account}-${region}-${environmentSuffix}`;

    // Common tags for all resources (used via cdk.Tags.of() calls)

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'ProductionVPC', {
      maxAzs: 2,
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
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 1, // Reduce cost
    });

    // Add tags to VPC
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // Create security groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Configure security group rules
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    // Add tags to security groups
    cdk.Tags.of(albSecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(ec2SecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(rdsSecurityGroup).add('Environment', 'Production');

    // Create IAM role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`arn:aws:s3:::production-app-data-${uniqueSuffix}/*`],
            }),
          ],
        }),
      },
    });

    // Add tags to IAM role
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    // Create user data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
      'echo "<p>Region: ' + region + '</p>" >> /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html'
    );

    // Create launch template with minimal configuration
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': 'ami-0c02fb55956c7d316',
        'us-west-2': 'ami-011e15a70256b7f26',
      }),
      userData,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: false, // Disabled to avoid KMS issues
          }),
        },
      ],
      requireImdsv2: true,
    });

    // Add tags to launch template
    cdk.Tags.of(launchTemplate).add('Environment', 'Production');

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: 3,
        maxCapacity: 6,
        desiredCapacity: 3,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 2,
          pauseTime: cdk.Duration.minutes(5),
        }),
      }
    );

    // Add tags to Auto Scaling Group
    cdk.Tags.of(autoScalingGroup).add('Environment', 'Production');

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        deletionProtection: false,
      }
    );

    // Add tags to ALB
    cdk.Tags.of(alb).add('Environment', 'Production');

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
        healthyThresholdCount: 2,
      },
      targetGroupName: `tg-${uniqueSuffix}`,
    });

    // Add tags to target group
    cdk.Tags.of(targetGroup).add('Environment', 'Production');

    // Create HTTP listener
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Add tags to subnet group
    cdk.Tags.of(dbSubnetGroup).add('Environment', 'Production');

    // Create RDS parameter group
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_37,
        }),
        description: 'Parameter group for MySQL 8.0.37',
        parameters: {
          slow_query_log: '1',
          long_query_time: '2',
        },
      }
    );

    // Add tags to parameter group
    cdk.Tags.of(parameterGroup).add('Environment', 'Production');

    // Create RDS database instance
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_37,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroup: dbSubnetGroup,
      parameterGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: false, // Disabled to avoid KMS issues
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: false, // Disabled for t3.micro instances
      cloudwatchLogsExports: ['error', 'general'],
      autoMinorVersionUpgrade: false,
    });

    // Add tags to database
    cdk.Tags.of(database).add('Environment', 'Production');

    // Create S3 bucket with minimal configuration
    const s3Bucket = new s3.Bucket(this, 'ProductionDataBucket', {
      bucketName: `production-app-data-${uniqueSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED, // Use S3-managed encryption (no KMS)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add tags to S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', 'Production');

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/application-${uniqueSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add tags to log group
    cdk.Tags.of(logGroup).add('Environment', 'Production');

    // Create CloudWatch alarm for CPU utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      alarmName: `HighCPUUtilization-${uniqueSuffix}`,
      alarmDescription: 'Alarm when CPU utilization exceeds 70%',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 70,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add tags to alarm
    cdk.Tags.of(cpuAlarm).add('Environment', 'Production');

    // Create scaling policies
    autoScalingGroup.scaleOnMetric('ScaleUp', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      scalingSteps: [
        { upper: 50, change: +1 },
        { lower: 70, change: +2 },
        { lower: 85, change: +3 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    autoScalingGroup.scaleOnMetric('ScaleDown', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: cloudwatch.Stats.AVERAGE,
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      scalingSteps: [
        { upper: 30, change: -1 },
        { upper: 20, change: -2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database Endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });
  }
}
