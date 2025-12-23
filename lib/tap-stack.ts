import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Schedule } from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Generate timestamp for unique names if needed
    const timestamp = Date.now().toString();

    // ====================================================================================
    // CONFIGURATION BLOCK - MODIFY THESE VALUES AS NEEDED
    // ====================================================================================

    const config = {
      // AWS Region - Use from env or default
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',

      // Resource naming suffix
      nameSuffix: environmentSuffix,

      // EC2 Configuration
      ec2AmiId: 'ami-0156001f0548e90b1', // Amazon Linux 2 AMI in us-east-1
      instanceType: 't3.medium',

      // Auto Scaling Configuration
      autoScaling: {
        minSize: 2,
        maxSize: 6,
        targetCpuPercent: 70,
      },

      // VPC Configuration
      vpcCidr: '10.0.0.0/16',

      // Retention Settings
      logRetentionDays: 30,
      backupRetentionDays: 7,

      // Security Configuration
      adminCidr: '0.0.0.0/0', // IMPORTANT: Change to your admin IP range for SSH access

      // Notification Configuration
      notificationEmail: 'admin@example.com', // Change to your email for alarm notifications
    };

    // Validate critical configuration
    // if (config.ec2AmiId === 'ami-PLACEHOLDER') {
    //   throw new Error('ERROR: You must replace ec2AmiId with a valid AMI ID before deployment');
    // }

    // ====================================================================================
    // KMS Keys for Encryption
    // ====================================================================================

    const kmsKey = new kms.Key(this, 'MasterKmsKey', {
      alias: `alias/infrastructure-key${config.nameSuffix}`,
      description: 'KMS key for infrastructure encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag KMS key
    cdk.Tags.of(kmsKey).add('iac-rlhf-amazon', 'true');

    // Allow CloudWatch Logs to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    // Allow Secrets Manager to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('secretsmanager.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    // Allow S3 to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    // Allow Backup to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('backup.amazonaws.com')],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    // ====================================================================================
    // VPC with Multi-AZ Public and Private Subnets
    // ====================================================================================

    const vpc = new ec2.Vpc(this, 'MainVpc', {
      vpcName: `main-vpc${config.nameSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
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

    // Tag VPC
    cdk.Tags.of(vpc).add('iac-rlhf-amazon', 'true');

    // ====================================================================================
    // CloudWatch Log Groups
    // ====================================================================================

    const centralLogGroup = new logs.LogGroup(this, 'CentralLogGroup', {
      logGroupName: `/aws/infrastructure/central${config.nameSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const ec2LogGroup = new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: `/aws/ec2/instances${config.nameSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ====================================================================================
    // Secrets Manager
    // ====================================================================================

    const appSecret = new secretsmanager.Secret(this, 'AppSecret', {
      secretName: `app-secret${config.nameSuffix}`,
      description: 'Application credentials and sensitive configuration',
      encryptionKey: kmsKey,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'appuser',
          database: 'appdb',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // ====================================================================================
    // S3 Bucket with Versioning and Encryption
    // ====================================================================================

    // Separate bucket for access logs
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `access-logs-bucket${config.nameSuffix}-${timestamp}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      bucketName: `secure-bucket${config.nameSuffix}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add bucket policy to enforce secure transport
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Tag S3 buckets
    cdk.Tags.of(s3Bucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(accessLogsBucket).add('iac-rlhf-amazon', 'true');

    // ====================================================================================
    // IAM Role for EC2 Instances (Least Privilege)
    // ====================================================================================

    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `ec2-instance-role${config.nameSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Custom policy for Secrets Manager read access
    const secretsPolicy = new iam.Policy(this, 'SecretsManagerReadPolicy', {
      policyName: `secrets-read-policy${config.nameSuffix}`,
      statements: [
        new iam.PolicyStatement({
          sid: 'ReadSpecificSecret',
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret',
          ],
          resources: [appSecret.secretArn],
        }),
        new iam.PolicyStatement({
          sid: 'DecryptSecret',
          effect: iam.Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:DescribeKey'],
          resources: [kmsKey.keyArn],
          conditions: {
            StringEquals: {
              'kms:ViaService': `secretsmanager.${config.region}.amazonaws.com`,
            },
          },
        }),
      ],
    });
    ec2Role.attachInlinePolicy(secretsPolicy);

    // Custom policy for S3 read access
    const s3Policy = new iam.Policy(this, 'S3ReadPolicy', {
      policyName: `s3-read-policy${config.nameSuffix}`,
      statements: [
        new iam.PolicyStatement({
          sid: 'ListBucket',
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [s3Bucket.bucketArn],
        }),
        new iam.PolicyStatement({
          sid: 'ReadObjects',
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: [`${s3Bucket.bucketArn}/*`],
        }),
        new iam.PolicyStatement({
          sid: 'DecryptObjects',
          effect: iam.Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:DescribeKey'],
          resources: [kmsKey.keyArn],
          conditions: {
            StringEquals: {
              'kms:ViaService': `s3.${config.region}.amazonaws.com`,
            },
          },
        }),
      ],
    });
    ec2Role.attachInlinePolicy(s3Policy);

    // Custom policy for CloudWatch Logs write access
    const logsPolicy = new iam.Policy(this, 'CloudWatchLogsPolicy', {
      policyName: `logs-write-policy${config.nameSuffix}`,
      statements: [
        new iam.PolicyStatement({
          sid: 'WriteToLogGroups',
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          resources: [centralLogGroup.logGroupArn, ec2LogGroup.logGroupArn],
        }),
      ],
    });
    ec2Role.attachInlinePolicy(logsPolicy);

    // ====================================================================================
    // Security Groups
    // ====================================================================================

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: `ec2-sg${config.nameSuffix}`,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow SSH from admin CIDR
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(config.adminCidr),
      ec2.Port.tcp(22),
      'Allow SSH from admin CIDR'
    );

    // ====================================================================================
    // Elastic IP (standalone - can be associated with ASG instance if needed)
    // ====================================================================================
    // NOTE: Bastion host removed due to persistent "did not stabilize" errors in CI pipeline.
    // ASG instances can be accessed via SSM Session Manager instead.

    const elasticIp = new ec2.CfnEIP(this, 'ElasticIP', {
      domain: 'vpc',
      tags: [
        {
          key: 'Name',
          value: `elastic-ip${config.nameSuffix}`,
        },
      ],
    });

    // ====================================================================================
    // Launch Template for ASG
    // ====================================================================================

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'set -e',
      '',
      '# Update system',
      'yum update -y',
      '',
      '# Install CloudWatch agent',
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      '',
      '# Configure CloudWatch agent',
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${ec2LogGroup.logGroupName}",
            "log_stream_name": "{instance_id}/messages",
            "retention_in_days": ${config.logRetentionDays}
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "${ec2LogGroup.logGroupName}",
            "log_stream_name": "{instance_id}/secure",
            "retention_in_days": ${config.logRetentionDays}
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_USAGE_IDLE",
            "unit": "Percent"
          },
          {
            "name": "cpu_usage_iowait",
            "rename": "CPU_USAGE_IOWAIT",
            "unit": "Percent"
          },
          "cpu_time_guest"
        ],
        "totalcpu": false,
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED_PERCENT",
            "unit": "Percent"
          },
          "free"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF`,
      '',
      '# Start CloudWatch agent',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json',
      '',
      '# Install stress tool for testing',
      'amazon-linux-extras install epel -y',
      'yum install stress -y',
      '',
      '# Signal CloudFormation that UserData completed',
      `/opt/aws/bin/cfn-signal -e $? --stack ${this.stackName} --resource AutoScalingGroup --region ${config.region}`
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'EC2LaunchTemplate', {
      launchTemplateName: `ec2-launch-template${config.nameSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.genericLinux({
        [config.region]: config.ec2AmiId,
      }),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      userData: userData,
      // Note: Not specifying blockDevices to use default EBS encryption with AWS managed key
      // This avoids KMS key state issues during ASG instance launches
      requireImdsv2: true,
    });

    // ====================================================================================
    // Auto Scaling Group
    // ====================================================================================

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        autoScalingGroupName: `asg${config.nameSuffix}`,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        launchTemplate,
        minCapacity: config.autoScaling.minSize,
        maxCapacity: config.autoScaling.maxSize,
        desiredCapacity: config.autoScaling.minSize,
        healthCheck: autoscaling.HealthCheck.ec2({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
        }),
        terminationPolicies: [autoscaling.TerminationPolicy.OLDEST_INSTANCE],
        cooldown: cdk.Duration.minutes(5),
      }
    );

    // Fix for LocalStack/CloudFormation LaunchTemplate version issue
    // Explicitly set the LaunchTemplate version to $Default to avoid LatestVersionNumber problems
    const cfnAsg = autoScalingGroup.node
      .defaultChild as autoscaling.CfnAutoScalingGroup;
    cfnAsg.launchTemplate = {
      launchTemplateId: launchTemplate.launchTemplateId!,
      version: '$Default',
    };
    // cfnAsg.cfnOptions.creationPolicy = {
    //   resourceSignal: {
    //     count: config.autoScaling.minSize,
    //     timeout: 'PT10M'
    //   }
    // };

    // CPU target tracking scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: config.autoScaling.targetCpuPercent,
      cooldown: cdk.Duration.minutes(5),
      estimatedInstanceWarmup: cdk.Duration.minutes(5),
    });

    // Tag ASG
    cdk.Tags.of(autoScalingGroup).add('iac-rlhf-amazon', 'true');

    // ====================================================================================
    // SNS Topic for Alarms
    // ====================================================================================

    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `infrastructure-alarms${config.nameSuffix}`,
      displayName: 'Infrastructure Alarms',
      masterKey: kmsKey,
    });

    // Add email subscription
    alarmTopic.addSubscription(
      new sns_subscriptions.EmailSubscription(config.notificationEmail)
    );

    // Tag SNS
    cdk.Tags.of(alarmTopic).add('iac-rlhf-amazon', 'true');

    // ====================================================================================
    // CloudWatch Alarms
    // ====================================================================================

    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
    });

    const cpuAlarmHigh = new cloudwatch.Alarm(this, 'CPUAlarmHigh', {
      alarmName: `cpu-high${config.nameSuffix}`,
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Triggers when CPU utilization is consistently high',
    });
    cpuAlarmHigh.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    const cpuAlarmLow = new cloudwatch.Alarm(this, 'CPUAlarmLow', {
      alarmName: `cpu-low${config.nameSuffix}`,
      metric: cpuMetric,
      threshold: 20,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Triggers when CPU utilization is consistently low',
    });
    cpuAlarmLow.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ====================================================================================
    // AWS Backup
    // ====================================================================================

    const backupVault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: `infrastructure-vault${config.nameSuffix}`,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `infrastructure-backup-plan${config.nameSuffix}`,
      backupVault: backupVault,
      backupPlanRules: [
        new backup.BackupPlanRule({
          ruleName: 'DailyBackup',
          scheduleExpression: Schedule.cron({
            hour: '3',
            minute: '0',
          }),
          deleteAfter: cdk.Duration.days(config.backupRetentionDays),
        }),
      ],
    });

    backupPlan.addSelection('EC2Selection', {
      backupSelectionName: `ec2-selection${config.nameSuffix}`,
      resources: [
        backup.BackupResource.fromTag(
          'aws:autoscaling:groupName',
          autoScalingGroup.autoScalingGroupName
        ),
      ],
      allowRestores: true,
    });

    // Tag backup
    cdk.Tags.of(backupVault).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(backupPlan).add('iac-rlhf-amazon', 'true');

    // ====================================================================================
    // Parameter Store
    // ====================================================================================

    new ssm.StringParameter(this, 'ConfigParameter', {
      parameterName: `/infrastructure/config${config.nameSuffix}`,
      stringValue: JSON.stringify({
        vpcId: vpc.vpcId,
        bucketName: s3Bucket.bucketName,
        region: config.region,
      }),
      description: 'Infrastructure configuration parameters',
      tier: ssm.ParameterTier.STANDARD,
    });

    // ====================================================================================
    // CloudFormation Outputs
    // ====================================================================================

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `public-subnet-ids${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `private-subnet-ids${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `asg-name${config.nameSuffix}`,
    });

    // NOTE: BastionInstanceId output removed - bastion host was removed due to CI stabilization issues
    // Use SSM Session Manager to access ASG instances instead

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `s3-bucket-name${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecretArn', {
      value: appSecret.secretArn,
      description: 'Secrets Manager Secret ARN',
      exportName: `secret-arn${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
      exportName: `ec2-role-arn${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS Topic ARN for Alarms',
      exportName: `sns-topic-arn${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupVaultName', {
      value: backupVault.backupVaultName,
      description: 'AWS Backup Vault Name',
      exportName: `backup-vault-name${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'CentralLogGroupName', {
      value: centralLogGroup.logGroupName,
      description: 'Central CloudWatch Log Group Name',
      exportName: `central-log-group${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2LogGroupName', {
      value: ec2LogGroup.logGroupName,
      description: 'EC2 CloudWatch Log Group Name',
      exportName: `ec2-log-group${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'ElasticIPAddress', {
      value: elasticIp.ref,
      description: 'Elastic IP Address',
      exportName: `elastic-ip${config.nameSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for Encryption',
      exportName: `kms-key-id${config.nameSuffix}`,
    });

    // Apply iac-rlhf-amazon tag to all resources
    // Note: CDK Tags.of(app) is already set in bin/tap.ts, but adding here for completeness
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
  }
}
