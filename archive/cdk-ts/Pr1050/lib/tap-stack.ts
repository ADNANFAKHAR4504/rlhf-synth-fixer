import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with public subnets in multiple AZs
    const vpc = new ec2.Vpc(this, 'CorpDisasterRecoveryVpc', {
      vpcName: `corp-dr-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'corp-public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(
      this,
      'CorpWebSecurityGroup',
      {
        securityGroupName: `corp-web-sg-${environmentSuffix}`,
        vpc,
        description: 'Security group for disaster recovery web instances',
        allowAllOutbound: true,
      }
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access for maintenance'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'CorpEc2Role', {
      roleName: `corp-ec2-dr-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3BackupAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              resources: [
                'arn:aws:s3:::corp-backup-*/*',
                'arn:aws:s3:::corp-backup-*',
              ],
            }),
          ],
        }),
      },
    });

    // Instance profile not explicitly needed as role is assigned directly to EC2 instances

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Disaster Recovery Instance - AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html',
      'echo "Health Check: OK" > /var/www/html/health',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      '    "namespace": "CWAgent",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],',
      '        "metrics_collection_interval": 60,',
      '        "totalcpu": false',
      '      },',
      '      "disk": {',
      '        "measurement": ["used_percent"],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["*"]',
      '      },',
      '      "diskio": {',
      '        "measurement": ["io_time"],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["*"]',
      '      },',
      '      "mem": {',
      '        "measurement": ["mem_used_percent"],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Primary EC2 instance in first AZ
    const primaryInstance = new ec2.Instance(this, 'CorpPrimaryInstance', {
      instanceName: `corp-primary-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [vpc.availabilityZones[0]],
      },
      securityGroup: webSecurityGroup,
      userData,
      role: ec2Role,
      keyName: process.env.EC2_KEY_PAIR || undefined,
      detailedMonitoring: true,
    });

    // Secondary EC2 instance in second AZ
    const secondaryInstance = new ec2.Instance(this, 'CorpSecondaryInstance', {
      instanceName: `corp-secondary-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [vpc.availabilityZones[1]],
      },
      securityGroup: webSecurityGroup,
      userData,
      role: ec2Role,
      keyName: process.env.EC2_KEY_PAIR || undefined,
      detailedMonitoring: true,
    });

    // S3 bucket for backups with versioning
    const backupBucket = new s3.Bucket(this, 'CorpBackupBucket', {
      bucketName: `corp-backup-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Enable auto-deletion for destroy
      lifecycleRules: [
        {
          id: 'corp-backup-lifecycle',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      serverAccessLogsBucket: undefined, // Consider adding access logging
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'CorpDisasterRecoveryAlerts', {
      topicName: `corp-dr-alerts-${environmentSuffix}`,
      displayName: 'Corporation Disaster Recovery Alerts',
    });

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(
        process.env.ALERT_EMAIL || 'admin@corp.local'
      )
    );

    // CloudWatch Alarms for primary instance
    const primaryCpuAlarm = new cloudwatch.Alarm(this, 'CorpPrimaryCpuAlarm', {
      alarmName: `corp-primary-cpu-high-${environmentSuffix}`,
      alarmDescription: 'Primary instance CPU utilization is too high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: primaryInstance.instanceId,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    const primaryStatusAlarm = new cloudwatch.Alarm(
      this,
      'CorpPrimaryStatusAlarm',
      {
        alarmName: `corp-primary-status-check-${environmentSuffix}`,
        alarmDescription: 'Primary instance status check failed',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'StatusCheckFailed',
          dimensionsMap: {
            InstanceId: primaryInstance.instanceId,
          },
        }),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    // CloudWatch Alarms for secondary instance
    const secondaryCpuAlarm = new cloudwatch.Alarm(
      this,
      'CorpSecondaryCpuAlarm',
      {
        alarmName: `corp-secondary-cpu-high-${environmentSuffix}`,
        alarmDescription: 'Secondary instance CPU utilization is too high',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: secondaryInstance.instanceId,
          },
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    // Add SNS actions to alarms
    primaryCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    primaryStatusAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );
    secondaryCpuAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Route 53 Hosted Zone (assuming domain exists)
    const domainName = process.env.DOMAIN_NAME || 'corp-dr.local';

    // If you have an existing hosted zone, use this:
    // const hostedZone = route53.HostedZone.fromLookup(this, 'CorpHostedZone', {
    //   domainName: domainName,
    // });

    // For demo purposes, create a new hosted zone
    const hostedZone = new route53.HostedZone(this, 'CorpHostedZone', {
      zoneName: domainName,
    });

    // Health checks for Route 53 failover
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'CorpPrimaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: primaryInstance.instancePublicDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `corp-primary-health-check-${environmentSuffix}`,
          },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    const secondaryHealthCheck = new route53.CfnHealthCheck(
      this,
      'CorpSecondaryHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          resourcePath: '/health',
          fullyQualifiedDomainName: secondaryInstance.instancePublicDnsName,
          port: 80,
          requestInterval: 30,
          failureThreshold: 3,
        },
        healthCheckTags: [
          {
            key: 'Name',
            value: `corp-secondary-health-check-${environmentSuffix}`,
          },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    // Route 53 records with failover routing using CfnRecordSet for proper failover support
    new route53.CfnRecordSet(this, 'CorpPrimaryRecord', {
      hostedZoneId: hostedZone.hostedZoneId,
      name: `app.${domainName}`,
      type: 'A',
      ttl: '60',
      resourceRecords: [primaryInstance.instancePublicIp],
      setIdentifier: 'primary',
      failover: 'PRIMARY',
      healthCheckId: primaryHealthCheck.attrHealthCheckId,
    });

    new route53.CfnRecordSet(this, 'CorpSecondaryRecord', {
      hostedZoneId: hostedZone.hostedZoneId,
      name: `app.${domainName}`,
      type: 'A',
      ttl: '60',
      resourceRecords: [secondaryInstance.instancePublicIp],
      setIdentifier: 'secondary',
      failover: 'SECONDARY',
      healthCheckId: secondaryHealthCheck.attrHealthCheckId,
    });

    // Apply corporate tags to all resources
    const corporateTags = {
      Environment: environmentSuffix,
      Project: 'DisasterRecovery',
      Owner: 'ITOperations',
      CostCenter: 'IT-DR-001',
      BackupRequired: 'true',
      ComplianceLevel: 'high',
    };

    Object.entries(corporateTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Output important information
    new cdk.CfnOutput(this, 'PrimaryInstanceId', {
      value: primaryInstance.instanceId,
      description: 'Primary EC2 Instance ID',
      exportName: `${this.stackName}-PrimaryInstanceId`,
    });

    new cdk.CfnOutput(this, 'SecondaryInstanceId', {
      value: secondaryInstance.instanceId,
      description: 'Secondary EC2 Instance ID',
      exportName: `${this.stackName}-SecondaryInstanceId`,
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
      exportName: `${this.stackName}-BackupBucketName`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for Disaster Recovery Alerts',
      exportName: `${this.stackName}-SNSTopicArn`,
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `${this.stackName}-HostedZoneId`,
    });

    new cdk.CfnOutput(this, 'ApplicationUrl', {
      value: `http://app.${domainName}`,
      description: 'Application URL with failover routing',
      exportName: `${this.stackName}-ApplicationUrl`,
    });

    // Additional outputs for testing
    new cdk.CfnOutput(this, 'PrimaryInstancePublicIp', {
      value: primaryInstance.instancePublicIp,
      description: 'Primary EC2 Instance Public IP',
      exportName: `${this.stackName}-PrimaryInstancePublicIp`,
    });

    new cdk.CfnOutput(this, 'SecondaryInstancePublicIp', {
      value: secondaryInstance.instancePublicIp,
      description: 'Secondary EC2 Instance Public IP',
      exportName: `${this.stackName}-SecondaryInstancePublicIp`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment Suffix',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });
  }
}
