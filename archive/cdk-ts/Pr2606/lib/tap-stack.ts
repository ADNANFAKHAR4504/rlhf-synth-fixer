import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  domainName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const domainName =
      props?.domainName || this.node.tryGetContext('domainName');

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'TAP-Migration',
      ManagedBy: 'CDK',
      CostCenter: 'Engineering',
    };

    // Apply tags to all resources in this stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // 1. NETWORKING - VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'ApplicationVpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs
    vpc.addFlowLog('VpcFlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 2. SECURITY - KMS key for encryption
    const kmsKey = new kms.Key(this, 'ApplicationKey', {
      alias: `tap-key-${environmentSuffix}`,
      description: 'KMS key for TAP application encryption',
      enableKeyRotation: true,
      enabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant EC2 and Auto Scaling services permission to use the KMS key for EBS volume encryption
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable use of the key via EC2',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('ec2.amazonaws.com'),
          new iam.ServicePrincipal('autoscaling.amazonaws.com'),
        ],
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey*',
          'kms:GenerateDataKeyWithoutPlainText',
          'kms:ReEncrypt*',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `ec2.${cdk.Aws.REGION}.amazonaws.com`,
          },
        },
      })
    );

    // Additional permissions for EC2 instances to use the key directly
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable direct use by EC2 instances',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('ec2.amazonaws.com')],
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:CreateGrant'],
        resources: ['*'],
      })
    );

    // Additional grant permissions for Auto Scaling to create grants without ViaService condition
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('autoscaling.amazonaws.com')],
        actions: ['kms:CreateGrant', 'kms:ListGrants', 'kms:RevokeGrant'],
        resources: ['*'],
        conditions: {
          Bool: {
            'kms:GrantIsForAWSResource': 'true',
          },
        },
      })
    );

    // Grant permissions to the Auto Scaling service-linked role
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Auto Scaling service-linked role',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
          ),
        ],
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey*',
          'kms:GenerateDataKeyWithoutPlainText',
          'kms:ReEncrypt*',
        ],
        resources: ['*'],
      })
    );

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      securityGroupName: `tap-alb-sg-${environmentSuffix}`,
    });

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

    const applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description: 'Security group for EC2 instances',
        securityGroupName: `tap-app-sg-${environmentSuffix}`,
      }
    );

    applicationSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS database',
        securityGroupName: `tap-db-sg-${environmentSuffix}`,
      }
    );

    databaseSecurityGroup.addIngressRule(
      applicationSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: `tap-ec2-role-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add comprehensive KMS policy for encrypted EBS volumes
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:GenerateDataKeyWithoutPlainText',
          'kms:GenerateDataKey*',
          'kms:ReEncrypt*',
          'kms:Encrypt',
        ],
        resources: [kmsKey.keyArn],
      })
    );

    // KMS permissions are handled in the key policy above

    // 3. STORAGE - S3 bucket for backups
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'transition-to-glacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(180), // Must be at least 90 days more than Glacier
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Grant EC2 instances access to backup bucket
    backupBucket.grantReadWrite(ec2Role);

    // 4. DATABASE - RDS PostgreSQL with read replica
    const databaseSubnetGroup = new rds.SubnetGroup(
      this,
      'DatabaseSubnetGroup',
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        subnetGroupName: `tap-db-subnet-${environmentSuffix}`,
      }
    );

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_7,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [databaseSecurityGroup],
      subnetGroup: databaseSubnetGroup,
      databaseName: 'tapdb',
      instanceIdentifier: `tap-db-${environmentSuffix}`,
      allocatedStorage: 100,
      maxAllocatedStorage: 200,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // Read Replica
    const readReplica = new rds.DatabaseInstanceReadReplica(
      this,
      'ReadReplica',
      {
        sourceDatabaseInstance: database,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [databaseSecurityGroup],
        instanceIdentifier: `tap-db-replica-${environmentSuffix}`,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        monitoringInterval: cdk.Duration.seconds(60),
      }
    );

    // 5. COMPUTE - Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        loadBalancerName: `tap-alb-${environmentSuffix}`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      targetGroupName: `tap-tg-${environmentSuffix}`,
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Listener
    loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // User Data for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>TAP Application - Instance $(hostname)</h1>" > /var/www/html/index.html',
      'mkdir -p /var/www/html/health',
      'echo "OK" > /var/www/html/health/index.html'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `tap-lt-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      role: ec2Role,
      securityGroup: applicationSecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            // Temporarily use AWS managed keys for EBS to avoid KMS key state issues
            // kmsKey: kmsKey,
          }),
        },
      ],
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        autoScalingGroupName: `tap-asg-${environmentSuffix}`,
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Grant the Auto Scaling Group permission to use the KMS key
    kmsKey.grantEncryptDecrypt(autoScalingGroup.role);

    // Auto Scaling Policies
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      cooldown: cdk.Duration.minutes(5),
    });

    // 6. DNS - Route 53 (optional)
    if (domainName) {
      const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName,
      });

      new route53.ARecord(this, 'ApplicationRecord', {
        zone: hostedZone,
        recordName: `tap-${environmentSuffix}`,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.LoadBalancerTarget(loadBalancer)
        ),
        ttl: cdk.Duration.minutes(5),
      });
    }

    // 7. MONITORING - CloudWatch Alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `tap-alarms-${environmentSuffix}`,
      displayName: 'TAP Application Alarms',
    });

    // CPU Utilization Alarm
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: cpuMetric,
      threshold: 70,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 70%',
      alarmName: `tap-high-cpu-${environmentSuffix}`,
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Database CPU Alarm
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: database.metricCPUUtilization(),
      threshold: 70,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'Database CPU utilization alarm',
      alarmName: `tap-db-cpu-${environmentSuffix}`,
    });

    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Database Storage Alarm
    const dbStorageAlarm = new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      metric: database.metricFreeStorageSpace(),
      threshold: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'Database storage space alarm',
      alarmName: `tap-db-storage-${environmentSuffix}`,
    });

    dbStorageAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Target Group Unhealthy Hosts Alarm
    const unhealthyHostsAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostsAlarm',
      {
        metric: targetGroup.metricUnhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        alarmDescription: 'Alarm when unhealthy hosts detected',
        alarmName: `tap-unhealthy-hosts-${environmentSuffix}`,
      }
    );

    unhealthyHostsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ApplicationDashboard', {
      defaultInterval: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [cpuMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database CPU Utilization',
        left: [database.metricCPUUtilization()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Target Group Health',
        left: [targetGroup.metricHealthyHostCount()],
        right: [targetGroup.metricUnhealthyHostCount()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [loadBalancer.metricRequestCount()],
        width: 12,
      })
    );

    // OUTPUTS
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `tap-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${loadBalancer.loadBalancerDnsName}`,
      description: 'Application URL',
      exportName: `tap-app-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `tap-db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS Database Port',
      exportName: `tap-db-port-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReadReplicaEndpoint', {
      value: readReplica.instanceEndpoint.hostname,
      description: 'RDS Read Replica Endpoint',
      exportName: `tap-db-replica-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
      exportName: `tap-backup-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: backupBucket.bucketArn,
      description: 'S3 Backup Bucket ARN',
      exportName: `tap-backup-bucket-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `tap-asg-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Alarm Topic ARN',
      exportName: `tap-alarm-topic-${environmentSuffix}`,
    });

    if (domainName) {
      new cdk.CfnOutput(this, 'ApplicationDomain', {
        value: `tap-${environmentSuffix}.${domainName}`,
        description: 'Application Domain Name',
        exportName: `tap-domain-${environmentSuffix}`,
      });
    }
  }
}
