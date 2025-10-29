# CDK JavaScript - Proactive Monitoring Stack

This solution provides a comprehensive AWS infrastructure for monitoring EC2 instances with CloudWatch alarms, log management, and proactive alerting capabilities.

## Solution Overview

The infrastructure creates a complete monitoring ecosystem including:
- VPC with public subnets for 10 EC2 instances
- Security groups with parameterized access controls
- CloudWatch Agent for custom metrics collection
- S3 bucket for log archiving with lifecycle policies
- CloudWatch Log Groups for system and application logs
- SNS topic for alert notifications
- CloudWatch Alarms for disk, CPU, and memory monitoring
- CloudWatch Dashboard for visual monitoring

## Implementation

```javascript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

/**
 * Properties for TapStack
 */
class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'pr34';

    // Get region from stack
    const region = cdk.Stack.of(this).region;

    // Get parameters with defaults
    const instanceCount = props?.instanceCount || 10;
    const alertEmail = props?.alertEmail || '';
    const allowedHttpCidr = props?.allowedHttpCidr || '0.0.0.0/0';
    const allowedSshCidr = props?.allowedSshCidr || '0.0.0.0/0';
    const logRetentionDays = props?.logRetentionDays || 30;
    const instanceType = props?.instanceType || 't3.micro';

    // ============================================================
    // SECTION 1: VPC and Networking
    // ============================================================

    const vpc = new ec2.Vpc(this, 'MonitoringVpc', {
      vpcName: `monitoring-vpc-${region}-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway for cost savings
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${region}-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    cdk.Tags.of(vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(vpc).add('ManagedBy', 'CDK');

    // ============================================================
    // SECTION 2: Security Groups
    // ============================================================

    const instanceSecurityGroup = new ec2.SecurityGroup(
      this,
      'InstanceSecurityGroup',
      {
        vpc,
        securityGroupName: `ec2-sg-${region}-${environmentSuffix}`,
        description: 'Security group for EC2 monitoring instances',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP from specified CIDR
    instanceSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedHttpCidr),
      ec2.Port.tcp(80),
      'Allow HTTP access from specified CIDR'
    );

    // Allow SSH from specified CIDR
    instanceSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'Allow SSH access from specified CIDR'
    );

    cdk.Tags.of(instanceSecurityGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(instanceSecurityGroup).add('ManagedBy', 'CDK');

    // ============================================================
    // SECTION 3: S3 Bucket for Log Archives
    // ============================================================

    const logBucket = new s3.Bucket(this, 'LogArchiveBucket', {
      bucketName: `log-archives-${region}-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allows destruction in test environments
    });

    cdk.Tags.of(logBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(logBucket).add('ManagedBy', 'CDK');

    // ============================================================
    // SECTION 4: CloudWatch Log Groups
    // ============================================================

    const systemLogGroupName = `/aws/ec2/monitoring-${region}-${environmentSuffix}`;
    const systemLogGroup = new logs.LogGroup(this, 'SystemLogGroup', {
      logGroupName: systemLogGroupName,
      retention: this.getRetentionDays(logRetentionDays),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allows destruction in test environments
    });

    const appLogGroupName = `/aws/ec2/monitoring-app-${region}-${environmentSuffix}`;
    const appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: appLogGroupName,
      retention: this.getRetentionDays(logRetentionDays),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allows destruction in test environments
    });

    cdk.Tags.of(systemLogGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(systemLogGroup).add('ManagedBy', 'CDK');
    cdk.Tags.of(appLogGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(appLogGroup).add('ManagedBy', 'CDK');

    // ============================================================
    // SECTION 5: IAM Role and Instance Profile
    // ============================================================

    const instanceRole = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `EC2 instance role for monitoring - ${region}-${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add inline policy for CloudWatch Logs
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [
          `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:${systemLogGroupName}`,
          `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:${systemLogGroupName}:*`,
          `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:${appLogGroupName}`,
          `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:${appLogGroupName}:*`,
        ],
      })
    );

    // Add inline policy for S3 log uploads
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:PutObjectAcl',
          's3:GetObject',
          's3:ListBucket',
        ],
        resources: [logBucket.bucketArn, `${logBucket.bucketArn}/*`],
      })
    );

    // Add inline policy for EC2 metadata (for CloudWatch Agent)
    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeVolumes',
          'ec2:DescribeTags',
          'ec2:DescribeInstances',
        ],
        resources: ['*'],
      })
    );

    cdk.Tags.of(instanceRole).add('Environment', environmentSuffix);
    cdk.Tags.of(instanceRole).add('ManagedBy', 'CDK');

    // ============================================================
    // SECTION 6: EC2 Instances
    // ============================================================

    // Get latest Amazon Linux 2023 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2023({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // CloudWatch Agent configuration
    const cwAgentConfig = {
      agent: {
        metrics_collection_interval: 60,
        run_as_user: 'cwagent',
      },
      logs: {
        logs_collected: {
          files: {
            collect_list: [
              {
                file_path: '/var/log/messages',
                log_group_name: systemLogGroupName,
                log_stream_name: '{instance_id}/messages',
                retention_in_days: logRetentionDays,
              },
              {
                file_path: '/var/log/secure',
                log_group_name: systemLogGroupName,
                log_stream_name: '{instance_id}/secure',
                retention_in_days: logRetentionDays,
              },
              {
                file_path: '/var/log/application.log',
                log_group_name: appLogGroupName,
                log_stream_name: '{instance_id}/app',
                retention_in_days: logRetentionDays,
              },
            ],
          },
        },
      },
      metrics: {
        namespace: 'CWAgent',
        metrics_collected: {
          cpu: {
            measurement: [
              {
                name: 'cpu_usage_idle',
                rename: 'CPU_IDLE',
                unit: 'Percent',
              },
              'cpu_usage_iowait',
            ],
            metrics_collection_interval: 60,
            totalcpu: false,
          },
          disk: {
            measurement: [
              {
                name: 'used_percent',
                rename: 'DISK_USED',
                unit: 'Percent',
              },
              'disk_used',
              'disk_free',
            ],
            metrics_collection_interval: 60,
            resources: ['*'],
          },
          diskio: {
            measurement: ['io_time'],
            metrics_collection_interval: 60,
            resources: ['*'],
          },
          mem: {
            measurement: [
              {
                name: 'mem_used_percent',
                rename: 'MEM_USED',
                unit: 'Percent',
              },
              'mem_available',
              'mem_used',
            ],
            metrics_collection_interval: 60,
          },
          netstat: {
            measurement: ['tcp_established', 'tcp_time_wait'],
            metrics_collection_interval: 60,
          },
          swap: {
            measurement: ['swap_used_percent'],
            metrics_collection_interval: 60,
          },
        },
      },
    };

    // User data script for CloudWatch Agent installation
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'set -e',
      '',
      '# Update system',
      'yum update -y',
      '',
      '# Install CloudWatch Agent',
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      '',
      '# Create CloudWatch Agent configuration',
      `cat <<'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/config.json`,
      JSON.stringify(cwAgentConfig, null, 2),
      'EOF',
      '',
      '# Start CloudWatch Agent',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\',
      '  -a fetch-config \\',
      '  -m ec2 \\',
      '  -s \\',
      '  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json',
      '',
      '# Create application log file',
      'mkdir -p /var/log',
      'touch /var/log/application.log',
      'chmod 644 /var/log/application.log',
      '',
      '# Install and start a simple web server',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      '',
      '# Create a simple status page',
      `echo '<html><body><h1>Monitoring Instance - ${environmentSuffix}</h1><p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p></body></html>' > /var/www/html/index.html`,
      '',
      '# Log startup to application log',
      `echo "$(date): Instance started in ${environmentSuffix} environment" >> /var/log/application.log`
    );

    // Create EC2 instances
    const instances = [];
    for (let i = 0; i < instanceCount; i++) {
      const instance = new ec2.Instance(this, `MonitoringInstance${i}`, {
        instanceName: `monitoring-instance-${i}-${region}-${environmentSuffix}`,
        vpc,
        instanceType: new ec2.InstanceType(instanceType),
        machineImage: ami,
        securityGroup: instanceSecurityGroup,
        role: instanceRole,
        userData,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
            }),
          },
        ],
      });

      cdk.Tags.of(instance).add('Environment', environmentSuffix);
      cdk.Tags.of(instance).add('ManagedBy', 'CDK');
      cdk.Tags.of(instance).add('InstanceIndex', i.toString());

      instances.push(instance);
    }

    // ============================================================
    // SECTION 7: SNS Topic for Alerts
    // ============================================================

    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `monitoring-alerts-${region}-${environmentSuffix}`,
      displayName: `Monitoring Alerts for ${environmentSuffix} environment`,
    });

    // Add email subscription if provided
    if (alertEmail) {
      alertTopic.addSubscription(
        new subscriptions.EmailSubscription(alertEmail)
      );
    }

    cdk.Tags.of(alertTopic).add('Environment', environmentSuffix);
    cdk.Tags.of(alertTopic).add('ManagedBy', 'CDK');

    // ============================================================
    // SECTION 8: CloudWatch Alarms
    // ============================================================

    const alarms = [];
    instances.forEach((instance, index) => {
      // Disk Usage Alarm
      const diskAlarm = new cloudwatch.Alarm(this, `DiskUsageAlarm${index}`, {
        alarmName: `disk-usage-${instance.instanceId}-${region}-${environmentSuffix}`,
        alarmDescription: `Disk usage > 80% on instance ${instance.instanceId}`,
        metric: new cloudwatch.Metric({
          namespace: 'CWAgent',
          metricName: 'disk_used_percent',
          dimensionsMap: {
            InstanceId: instance.instanceId,
            path: '/',
            fstype: 'xfs',
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });

      diskAlarm.addAlarmAction(new cwactions.SnsAction(alertTopic));
      alarms.push(diskAlarm);

      // CPU Usage Alarm
      const cpuAlarm = new cloudwatch.Alarm(this, `CpuUsageAlarm${index}`, {
        alarmName: `cpu-usage-${instance.instanceId}-${region}-${environmentSuffix}`,
        alarmDescription: `CPU usage > 80% on instance ${instance.instanceId}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: instance.instanceId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      });

      cpuAlarm.addAlarmAction(new cwactions.SnsAction(alertTopic));
      alarms.push(cpuAlarm);

      // Memory Usage Alarm
      const memoryAlarm = new cloudwatch.Alarm(
        this,
        `MemoryUsageAlarm${index}`,
        {
          alarmName: `memory-usage-${instance.instanceId}-${region}-${environmentSuffix}`,
          alarmDescription: `Memory usage > 80% on instance ${instance.instanceId}`,
          metric: new cloudwatch.Metric({
            namespace: 'CWAgent',
            metricName: 'mem_used_percent',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 80,
          evaluationPeriods: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        }
      );

      memoryAlarm.addAlarmAction(new cwactions.SnsAction(alertTopic));
      alarms.push(memoryAlarm);

      cdk.Tags.of(diskAlarm).add('Environment', environmentSuffix);
      cdk.Tags.of(cpuAlarm).add('Environment', environmentSuffix);
      cdk.Tags.of(memoryAlarm).add('Environment', environmentSuffix);
    });

    // ============================================================
    // SECTION 9: CloudWatch Dashboard
    // ============================================================

    const dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `ec2-monitoring-${region}-${environmentSuffix}`,
    });

    // Add widgets to dashboard
    const diskWidgets = [];
    const cpuWidgets = [];
    const statusWidgets = [];

    instances.forEach(instance => {
      // Disk Usage Widget
      diskWidgets.push(
        new cloudwatch.GraphWidget({
          title: `Disk Usage - ${instance.instanceId}`,
          left: [
            new cloudwatch.Metric({
              namespace: 'CWAgent',
              metricName: 'disk_used_percent',
              dimensionsMap: {
                InstanceId: instance.instanceId,
                path: '/',
                fstype: 'xfs',
              },
              statistic: 'Average',
              period: cdk.Duration.minutes(5),
            }),
          ],
          width: 8,
          height: 6,
        })
      );

      // CPU Usage Widget
      cpuWidgets.push(
        new cloudwatch.GraphWidget({
          title: `CPU Usage - ${instance.instanceId}`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/EC2',
              metricName: 'CPUUtilization',
              dimensionsMap: {
                InstanceId: instance.instanceId,
              },
              statistic: 'Average',
              period: cdk.Duration.minutes(5),
            }),
          ],
          width: 8,
          height: 6,
        })
      );

      // Status Check Widget
      statusWidgets.push(
        new cloudwatch.GraphWidget({
          title: `Status Checks - ${instance.instanceId}`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/EC2',
              metricName: 'StatusCheckFailed',
              dimensionsMap: {
                InstanceId: instance.instanceId,
              },
              statistic: 'Sum',
              period: cdk.Duration.minutes(5),
            }),
          ],
          width: 8,
          height: 6,
        })
      );
    });

    // Add all widgets to dashboard in rows
    const widgetRows = [];
    for (let i = 0; i < diskWidgets.length; i += 3) {
      widgetRows.push(diskWidgets.slice(i, i + 3));
    }
    for (let i = 0; i < cpuWidgets.length; i += 3) {
      widgetRows.push(cpuWidgets.slice(i, i + 3));
    }
    for (let i = 0; i < statusWidgets.length; i += 3) {
      widgetRows.push(statusWidgets.slice(i, i + 3));
    }

    widgetRows.forEach(row => {
      dashboard.addWidgets(...row);
    });

    // ============================================================
    // SECTION 10: Outputs
    // ============================================================

    // VPC Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `MonitoringVpcId-${region}-${environmentSuffix}`,
    });

    // Security Group Outputs
    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: instanceSecurityGroup.securityGroupId,
      description: 'EC2 Instance Security Group ID',
      exportName: `InstanceSecurityGroupId-${region}-${environmentSuffix}`,
    });

    // IAM Role Outputs
    new cdk.CfnOutput(this, 'InstanceRoleArn', {
      value: instanceRole.roleArn,
      description: 'EC2 Instance Role ARN',
      exportName: `InstanceRoleArn-${region}-${environmentSuffix}`,
    });

    // S3 Bucket Outputs
    new cdk.CfnOutput(this, 'LogBucketName', {
      value: logBucket.bucketName,
      description: 'S3 Bucket Name for Log Archives',
      exportName: `LogBucketName-${region}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogBucketArn', {
      value: logBucket.bucketArn,
      description: 'S3 Bucket ARN for Log Archives',
      exportName: `LogBucketArn-${region}-${environmentSuffix}`,
    });

    // Log Group Outputs
    new cdk.CfnOutput(this, 'SystemLogGroupName', {
      value: systemLogGroup.logGroupName,
      description: 'CloudWatch Log Group Name for System Logs',
      exportName: `SystemLogGroupName-${region}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppLogGroupName', {
      value: appLogGroup.logGroupName,
      description: 'CloudWatch Log Group Name for Application Logs',
      exportName: `AppLogGroupName-${region}-${environmentSuffix}`,
    });

    // SNS Topic Outputs
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for Alerts',
      exportName: `AlertTopicArn-${region}-${environmentSuffix}`,
    });

    // EC2 Instance Outputs
    instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `InstanceId${index}`, {
        value: instance.instanceId,
        description: `EC2 Instance ID ${index}`,
        exportName: `InstanceId${index}-${region}-${environmentSuffix}`,
      });

      new cdk.CfnOutput(this, `InstancePublicIp${index}`, {
        value: instance.instancePublicIp,
        description: `EC2 Instance ${index} Public IP`,
        exportName: `InstancePublicIp${index}-${region}-${environmentSuffix}`,
      });
    });

    // Dashboard Output
    const dashboardUrl = `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: dashboardUrl,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${region}-${environmentSuffix}`,
    });

    // Summary Output
    new cdk.CfnOutput(this, 'DeploymentSummary', {
      value: JSON.stringify({
        environment: environmentSuffix,
        region: region,
        instanceCount: instances.length,
        vpcId: vpc.vpcId,
        dashboardName: dashboard.dashboardName,
      }),
      description: 'Deployment Summary',
    });
  }

  /**
   * Helper method to convert retention days to CloudWatch retention enum
   */
  getRetentionDays(days) {
    const retentionMap = {
      1: logs.RetentionDays.ONE_DAY,
      3: logs.RetentionDays.THREE_DAYS,
      5: logs.RetentionDays.FIVE_DAYS,
      7: logs.RetentionDays.ONE_WEEK,
      14: logs.RetentionDays.TWO_WEEKS,
      30: logs.RetentionDays.ONE_MONTH,
      60: logs.RetentionDays.TWO_MONTHS,
      90: logs.RetentionDays.THREE_MONTHS,
      120: logs.RetentionDays.FOUR_MONTHS,
      150: logs.RetentionDays.FIVE_MONTHS,
      180: logs.RetentionDays.SIX_MONTHS,
      365: logs.RetentionDays.ONE_YEAR,
      400: logs.RetentionDays.THIRTEEN_MONTHS,
      545: logs.RetentionDays.EIGHTEEN_MONTHS,
      731: logs.RetentionDays.TWO_YEARS,
      1827: logs.RetentionDays.FIVE_YEARS,
      3653: logs.RetentionDays.TEN_YEARS,
    };

    return retentionMap[days] || logs.RetentionDays.ONE_MONTH;
  }
}

export { TapStack };
```

## Key Features

### Security
- Parameterized CIDR blocks for HTTP and SSH access
- Instance profiles with least-privilege IAM policies
- S3 bucket with server-side encryption and blocked public access
- EBS volumes with encryption enabled

### Monitoring
- Custom CloudWatch metrics via CloudWatch Agent
- Disk usage, CPU, and memory alarms with 80% thresholds
- SNS notifications for all alarm states
- Comprehensive dashboard with visual metrics

### Cost Optimization
- GP3 EBS volumes for better price/performance
- S3 lifecycle policies for automatic cost optimization
- No NAT Gateway for reduced networking costs
- t3.micro instances for minimal compute costs
- Configurable removal policies for test environments

### Operational Excellence
- Consistent resource tagging with environment and management metadata
- Parameterized configuration for different environments
- Comprehensive outputs for integration with other systems
- CloudWatch Log Groups with configurable retention

## Deployment Outputs

The stack provides comprehensive outputs including:
- VPC and networking resource IDs
- Instance IDs and public IP addresses
- SNS topic ARN for alert integration
- S3 bucket details for log archiving
- CloudWatch Log Group names
- Dashboard URL for monitoring access
- Deployment summary with key metrics