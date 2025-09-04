import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'SecurityKey', {
      description: `Security encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    // Grant CloudWatch Logs permissions to use the KMS key
    kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:ReEncrypt*',
        'kms:GenerateDataKey*',
        'kms:CreateGrant',
        'kms:DescribeKey'
      ],
      resources: ['*'],
      conditions: {
        ArnEquals: {
          'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/vpc/flowlogs-${environmentSuffix}`,
        },
      },
    }));

    // Create VPC with proper network segmentation
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipProtocol: ec2.IpProtocol.IPV4_ONLY,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 2, // One per AZ for high availability
    });

    // Apply default security group restrictions
    const defaultSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'DefaultSG',
      vpc.vpcDefaultSecurityGroup
    );
    
    // Create CloudWatch Log Groups for VPC Flow Logs
    const vpcLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create Security Groups with principle of least privilege
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: false,
    });

    // Allow SSH access to bastion (restrict source as needed)
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // In production, restrict to specific IP ranges
      ec2.Port.tcp(22),
      'SSH access to bastion host'
    );

    // Allow outbound HTTPS for updates and AWS API calls
    bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for updates'
    );

    // Allow outbound SSH to private subnets
    bastionSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'SSH to private subnets'
    );

    const privateSecurityGroup = new ec2.SecurityGroup(this, 'PrivateSecurityGroup', {
      vpc,
      description: 'Security group for private subnet resources',
      allowAllOutbound: false,
    });

    // Allow SSH from bastion host only
    privateSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(22),
      'SSH from bastion host'
    );

    // Allow outbound HTTPS for updates
    privateSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for updates'
    );

    // Create IAM role for bastion host with minimal permissions
    const bastionRole = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for bastion host with minimal permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add minimal CloudWatch permissions for bastion monitoring
    bastionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogGroups',
        'logs:DescribeLogStreams',
      ],
      resources: ['*'],
    }));

    // Create IAM role for private instances
    const privateInstanceRole = new iam.Role(this, 'PrivateInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for private instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Get latest Amazon Linux 2023 AMI
    const amazonLinux = ec2.MachineImage.latestAmazonLinux2023({
      edition: ec2.AmazonLinuxEdition.STANDARD,
    });

    // Create bastion host in public subnet
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceName: `bastion-host-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amazonLinux,
      securityGroup: bastionSecurityGroup,
      role: bastionRole,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [vpc.availabilityZones[0]], // Place in first AZ
      },
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true, // Enforce IMDSv2 for security
    });

    // Create private instance for demonstration
    const privateInstance = new ec2.Instance(this, 'PrivateInstance', {
      vpc,
      instanceName: `private-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amazonLinux,
      securityGroup: privateSecurityGroup,
      role: privateInstanceRole,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: [vpc.availabilityZones[0]],
      },
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true,
    });

    // Install CloudWatch agent on private instance
    privateInstance.userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'AWS/EC2',
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait'],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/messages',
                  log_group_name: `/aws/ec2/system-${environmentSuffix}`,
                  log_stream_name: '{instance_id}',
                },
              ],
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Create secure S3 bucket with all security best practices
    const secureStorageBucket = new s3.Bucket(this, 'SecureStorageBucket', {
      bucketName: `secure-storage-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add bucket policy for additional security
    secureStorageBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [
        secureStorageBucket.bucketArn,
        secureStorageBucket.arnForObjects('*'),
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }));

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'SecurityAlerts', {
      topicName: `security-alerts-${environmentSuffix}`,
      displayName: 'Security and Monitoring Alerts',
      masterKey: kmsKey,
    });

    // Create CloudWatch alarms for CPU monitoring
    const cpuAlarmBastion = new cloudwatch.Alarm(this, 'BastionCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: bastionHost.instanceId,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Bastion host CPU utilization exceeds 80%',
      actionsEnabled: true,
    });

    const cpuAlarmPrivate = new cloudwatch.Alarm(this, 'PrivateInstanceCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: privateInstance.instanceId,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Private instance CPU utilization exceeds 80%',
      actionsEnabled: true,
    });

    // Add SNS actions to alarms
    cpuAlarmBastion.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    cpuAlarmPrivate.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Create CloudWatch dashboard for monitoring
    const securityDashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `security-monitoring-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  InstanceId: bastionHost.instanceId,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  InstanceId: privateInstance.instanceId,
                },
              }),
            ],
            period: cdk.Duration.minutes(5),
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Network Bytes In/Out',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'NetworkIn',
                dimensionsMap: {
                  InstanceId: bastionHost.instanceId,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'NetworkIn',
                dimensionsMap: {
                  InstanceId: privateInstance.instanceId,
                },
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'NetworkOut',
                dimensionsMap: {
                  InstanceId: bastionHost.instanceId,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'NetworkOut',
                dimensionsMap: {
                  InstanceId: privateInstance.instanceId,
                },
              }),
            ],
            period: cdk.Duration.minutes(5),
            width: 12,
          }),
        ],
      ],
    });

    // Apply consistent tags to all resources
    const tags = {
      Environment: environmentSuffix,
      Project: 'SecureMultiTier',
      Compliance: 'Required',
      Security: 'High',
      Owner: 'Infrastructure',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs for important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-VpcId`,
    });

    new cdk.CfnOutput(this, 'BastionHostId', {
      value: bastionHost.instanceId,
      description: 'Bastion Host Instance ID',
      exportName: `${environmentSuffix}-BastionHostId`,
    });

    new cdk.CfnOutput(this, 'BastionHostPublicIp', {
      value: bastionHost.instancePublicIp,
      description: 'Bastion Host Public IP Address',
      exportName: `${environmentSuffix}-BastionHostPublicIp`,
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: privateInstance.instanceId,
      description: 'Private Instance ID',
      exportName: `${environmentSuffix}-PrivateInstanceId`,
    });

    new cdk.CfnOutput(this, 'SecureStorageBucketName', {
      value: secureStorageBucket.bucketName,
      description: 'Secure Storage S3 Bucket Name',
      exportName: `${environmentSuffix}-SecureStorageBucket`,
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for Security Alerts',
      exportName: `${environmentSuffix}-AlertsTopic`,
    });

    new cdk.CfnOutput(this, 'SecurityDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${securityDashboard.dashboardName}`,
      description: 'CloudWatch Security Dashboard URL',
    });
  }
}
