import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  private readonly stringSuffix: string;
  public readonly environment: 'primary' | 'secondary';
  private readonly domainName: string;
  private readonly notificationEmail: string;

  public readonly vpcId: string;
  public readonly elbDnsName: string;
  public readonly rdsEndpoint: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly securityGroupIds: string[];
  public readonly instanceIds: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Determine environment based on region
    const region = cdk.Stack.of(this).region;
    this.environment = region === 'us-east-1' ? 'primary' : 'secondary';
    this.domainName = this.node.tryGetContext('domainName') || 'example.com';
    this.notificationEmail =
      this.node.tryGetContext('notificationEmail') || 'ops@example.com';

    // Generate unique string suffix for resource naming
    this.stringSuffix = `${this.environment}-${region}`;

    // Create KMS Key for encryption
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting all data at rest',
      alias: `prod-encryption-key-${this.stringSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `prod-app-vpc-${this.stringSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `prod-public-subnet-${this.stringSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `prod-private-subnet-${this.stringSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    this.vpcId = vpc.vpcId;
    this.publicSubnetIds = vpc.publicSubnets.map(subnet => subnet.subnetId);
    this.privateSubnetIds = vpc.privateSubnets.map(subnet => subnet.subnetId);

    // Create Network ACLs
    const publicNacl = new ec2.NetworkAcl(this, 'PublicNacl', {
      vpc,
      networkAclName: `prod-public-nacl-${this.stringSuffix}`,
    });

    // Associate NACLs with subnets
    vpc.publicSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `PublicNaclAssociation${index}`,
        {
          subnet,
          networkAcl: publicNacl,
        }
      );
    });

    // Add NACL rules
    publicNacl.addEntry('AllowHttpInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    publicNacl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    publicNacl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    publicNacl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Create Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      securityGroupName: `prod-alb-sg-${this.stringSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebServerSecurityGroup',
      {
        vpc,
        securityGroupName: `prod-webserver-sg-${this.stringSuffix}`,
        description: 'Security group for web servers',
        allowAllOutbound: true,
      }
    );

    webServerSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      securityGroupName: `prod-rds-sg-${this.stringSuffix}`,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      webServerSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from web servers'
    );

    this.securityGroupIds = [
      albSecurityGroup.securityGroupId,
      webServerSecurityGroup.securityGroupId,
      rdsSecurityGroup.securityGroupId,
    ];

    // Create S3 bucket for logs
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `prod-app-logs-${this.stringSuffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'MoveToGlacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      roleName: `prod-ec2-role-${this.stringSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Grant EC2 instances access to S3 log bucket
    logBucket.grantWrite(ec2Role);

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/ec2/prod-app-${this.stringSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create SNS Topic for notifications
    const snsTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `prod-alarm-topic-${this.stringSuffix}`,
      masterKey: kmsKey,
    });

    snsTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(this.notificationEmail)
    );

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AppLoadBalancer', {
      vpc,
      loadBalancerName: `prod-alb-${this.stringSuffix}`,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      crossZoneEnabled: true,
    });

    this.elbDnsName = alb.loadBalancerDnsName;

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      targetGroupName: `prod-tg-${this.stringSuffix}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      stickinessCookieDuration: cdk.Duration.minutes(5),
      stickinessCookieName: 'MyAppSession',
    });

    // Create ACM Certificate for HTTPS
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: this.domainName,
      subjectAlternativeNames: [`*.${this.domainName}`],
      validation: acm.CertificateValidation.fromDns(),
    });

    // Add HTTP Listener (redirect to HTTPS)
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // Add HTTPS Listener
    alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup],
    });

    // Create Launch Template with improved logging
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Healthy - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/health',
      'echo "<h1>Hello from AWS HA Infrastructure - $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/index.html',
      // Install CloudWatch agent for continuous logging
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U amazon-cloudwatch-agent.rpm',
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}-error"
          }
        ]
      }
    }
  }
}
EOF`,
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `prod-lt-${this.stringSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      role: ec2Role,
      userData: userData,
      securityGroup: webServerSecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            encrypted: true,
            kmsKey: kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        autoScalingGroupName: `prod-asg-${this.stringSuffix}`,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
        }),
        terminationPolicies: [autoscaling.TerminationPolicy.OLDEST_INSTANCE],
      }
    );

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Add Auto Scaling policies
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      subnetGroupName: `prod-db-subnet-group-${this.stringSuffix}`,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create RDS instance with deletionProtection set to false
    const rdsInstance = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `prod-mysql-db-${this.stringSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      allocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // Set to false as per requirements
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.rdsEndpoint = rdsInstance.instanceEndpoint.socketAddress;

    // Create CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      alarmName: `prod-high-cpu-${this.stringSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

    const rdsConnectionAlarm = new cloudwatch.Alarm(
      this,
      'RdsConnectionAlarm',
      {
        alarmName: `prod-rds-connections-${this.stringSuffix}`,
        metric: rdsInstance.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    rdsConnectionAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(snsTopic)
    );

    const albHealthyHostsAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostsAlarm',
      {
        alarmName: `prod-unhealthy-hosts-${this.stringSuffix}`,
        metric: targetGroup.metricHealthyHostCount(),
        threshold: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
      }
    );

    albHealthyHostsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(snsTopic)
    );

    // Create Route 53 resources
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: this.domainName,
    });

    // Create Route 53 record
    new route53.ARecord(this, 'AppRecord', {
      zone: hostedZone,
      recordName:
        this.environment === 'primary' ? 'app' : `app-${this.environment}`,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.LoadBalancerTarget(alb)
      ),
    });

    // Create CloudWatch Dashboard
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `prod-monitoring-${this.stringSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'CPUUtilization',
                statistic: 'Average',
                dimensionsMap: {
                  AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
                },
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ALB Request Count',
            left: [alb.metricRequestCount()],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'RDS CPU Utilization',
            left: [rdsInstance.metricCPUUtilization()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'RDS Database Connections',
            left: [rdsInstance.metricDatabaseConnections()],
            width: 12,
          }),
        ],
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'ElbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: `${this.stackName}-elb-dns`,
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.instanceEndpoint.socketAddress,
      description: 'RDS Endpoint',
      exportName: `${this.stackName}-rds-endpoint`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${this.stackName}-public-subnets`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-private-subnets`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupIds', {
      value: this.securityGroupIds.join(','),
      description: 'Security Group IDs (ALB, WebServer, RDS)',
      exportName: `${this.stackName}-security-groups`,
    });

    this.instanceIds = new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name (use to query instance IDs)',
      exportName: `${this.stackName}-asg-name`,
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: logBucket.bucketName,
      description: 'S3 Bucket for Application Logs',
      exportName: `${this.stackName}-log-bucket`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for Encryption',
      exportName: `${this.stackName}-kms-key`,
    });
  }
}
