import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface ProductionInfrastructureStackProps extends cdk.StackProps {
  envSuffix: string;
}

export class ProductionInfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ProductionInfrastructureStackProps
  ) {
    super(scope, id, props);

    // Environment suffix for naming convention
    const envSuffix = props.envSuffix;

    // 0. Create KMS key for encryption
    const kmsKey = this.createKMSKey(envSuffix);

    // 1. Create VPC with security best practices
    const vpc = this.createSecureVPC(envSuffix);

    // 2. Create S3 bucket for artifacts/state
    const artifactsBucket = this.createSecureS3Bucket(envSuffix, kmsKey);

    // 3. Create CloudTrail for audit logging
    this.createCloudTrail(envSuffix, kmsKey);

    // 4. Create IAM role for EC2 instances
    const ec2Role = this.createEC2IAMRole(envSuffix, artifactsBucket);

    // 5. Create security groups
    const securityGroups = this.createSecurityGroups(vpc, envSuffix);

    // 6. Create CloudWatch Log Group
    const logGroup = this.createLogGroup(envSuffix, kmsKey);

    // 7. Create SNS topic for alerts
    const alertsTopic = this.createSNSTopic(envSuffix, kmsKey);

    // 8. Create Launch Template
    const launchTemplate = this.createLaunchTemplate(
      vpc,
      ec2Role,
      securityGroups,
      logGroup,
      envSuffix
    );

    // 9. Create Auto Scaling Group
    const autoScalingGroup = this.createAutoScalingGroup(
      vpc,
      launchTemplate,
      envSuffix
    );

    // 10. Create CloudWatch Alarms and Monitoring
    this.createMonitoring(autoScalingGroup, alertsTopic, envSuffix);

    // 11. Create SSM Parameters for configuration
    this.createSSMParameters(vpc, artifactsBucket, envSuffix);

    // 12. Apply Environment: Production tag to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebApp');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // 13. Output important information
    this.createOutputs(vpc, artifactsBucket, autoScalingGroup);
  }

  private createKMSKey(envSuffix: string): kms.Key {
    return new kms.Key(this, `WebAppKMSKey-${envSuffix}`, {
      description: `KMS Key for secure web application - ${envSuffix}`,
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });
  }

  private createCloudTrail(envSuffix: string, kmsKey: kms.Key): void {
    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(
      this,
      `CloudTrailBucket-${envSuffix}`,
      {
        bucketName: `webapp-cloudtrail-${envSuffix}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // Create CloudTrail
    new cloudtrail.Trail(this, `WebAppCloudTrail-${envSuffix}`, {
      trailName: `webapp-cloudtrail-${envSuffix}`,
      bucket: cloudTrailBucket,
      encryptionKey: kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(
        this,
        `CloudTrailLogGroup-${envSuffix}`,
        {
          logGroupName: `/aws/cloudtrail/webapp-${envSuffix}`,
          retention: logs.RetentionDays.ONE_MONTH,
          encryptionKey: kmsKey,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
      ),
    });
  }

  private createSecureVPC(envSuffix: string): ec2.Vpc {
    const vpc = new ec2.Vpc(this, `SecureVPC-${envSuffix}`, {
      vpcName: `secure-webapp-vpc-${envSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${envSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${envSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      flowLogs: {
        [`VPCFlowLogs-${envSuffix}`]: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Add VPC endpoint for S3 for secure access
    vpc.addGatewayEndpoint(`S3Endpoint-${envSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Add VPC endpoint for SSM for secure parameter access
    vpc.addInterfaceEndpoint(`SSMEndpoint-${envSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      privateDnsEnabled: true,
    });

    // Add VPC endpoint for CloudWatch Logs
    vpc.addInterfaceEndpoint(`CloudWatchLogsEndpoint-${envSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true,
    });

    return vpc;
  }

  private createSecureS3Bucket(envSuffix: string, _kmsKey: kms.Key): s3.Bucket {
    const bucketName = `secure-webapp-artifacts-${envSuffix}`;
    const bucket = new s3.Bucket(this, `ArtifactsBucket-${envSuffix}`, {
      bucketName: bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
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
      ],
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add explicit bucket policy for additional security
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Deny unencrypted object uploads
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedObjectUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'AES256',
          },
        },
      })
    );

    return bucket;
  }

  private createEC2IAMRole(envSuffix: string, bucket: s3.Bucket): iam.Role {
    const role = new iam.Role(this, `EC2Role-${envSuffix}`, {
      roleName: `EC2-WebApp-Role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for S3 bucket access with least privilege
    role.attachInlinePolicy(
      new iam.Policy(this, `S3AccessPolicy-${envSuffix}`, {
        policyName: `S3AccessPolicy-${envSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [`${bucket.bucketArn}/*`],
            conditions: {
              StringEquals: {
                's3:x-amz-server-side-encryption': 'AES256',
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:ListBucket'],
            resources: [bucket.bucketArn],
          }),
        ],
      })
    );

    // Add policy for CloudWatch Logs with least privilege - specific log group only
    role.attachInlinePolicy(
      new iam.Policy(this, `CloudWatchLogsPolicy-${envSuffix}`, {
        policyName: `CloudWatchLogsPolicy-${envSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            resources: [
              `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/webapp-${envSuffix}:*`,
              `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/webapp-${envSuffix}`,
            ],
          }),
        ],
      })
    );

    return role;
  }

  private createSecurityGroups(vpc: ec2.Vpc, envSuffix: string) {
    // Web tier security group with least privilege
    const webSecurityGroup = new ec2.SecurityGroup(this, `WebSG-${envSuffix}`, {
      vpc,
      description: 'Security group for web tier',
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS inbound
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Remove SSH access - use SSM Session Manager instead for secure access
    // This eliminates the need for SSH keys and provides better audit trails

    // Allow outbound HTTPS for updates and API calls
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS API calls and updates'
    );

    // Allow outbound HTTP for package updates (Amazon Linux repos)
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package updates'
    );

    // Allow DNS resolution
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // Allow NTP for time synchronization (security best practice)
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(123),
      'Allow NTP for time synchronization'
    );

    return { webSecurityGroup };
  }

  private createLogGroup(envSuffix: string, kmsKey: kms.Key): logs.LogGroup {
    return new logs.LogGroup(this, `WebAppLogGroup-${envSuffix}`, {
      logGroupName: `/aws/ec2/webapp-${envSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  private createSNSTopic(envSuffix: string, kmsKey: kms.Key): sns.Topic {
    return new sns.Topic(this, `AlertsTopic-${envSuffix}`, {
      topicName: `webapp-alerts-${envSuffix}`,
      displayName: 'Web Application Alerts',
      masterKey: kmsKey,
    });
  }

  private createLaunchTemplate(
    vpc: ec2.Vpc,
    role: iam.Role,
    securityGroups: { webSecurityGroup: ec2.SecurityGroup },
    logGroup: logs.LogGroup,
    envSuffix: string
  ): ec2.LaunchTemplate {
    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y awslogs',

      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "WebApp/Production",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF`,

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s',

      // Install and start nginx (example web server)
      'amazon-linux-extras install -y nginx1',
      'systemctl start nginx',
      'systemctl enable nginx',

      // Create a simple health check page
      'echo "Healthy" > /usr/share/nginx/html/health',

      // Set up log rotation
      'echo "/var/log/webapp/*.log {" > /etc/logrotate.d/webapp',
      'echo "    daily" >> /etc/logrotate.d/webapp',
      'echo "    rotate 7" >> /etc/logrotate.d/webapp',
      'echo "    compress" >> /etc/logrotate.d/webapp',
      'echo "    delaycompress" >> /etc/logrotate.d/webapp',
      'echo "    missingok" >> /etc/logrotate.d/webapp',
      'echo "    notifempty" >> /etc/logrotate.d/webapp',
      'echo "}" >> /etc/logrotate.d/webapp'
    );

    return new ec2.LaunchTemplate(this, `LaunchTemplate-${envSuffix}`, {
      launchTemplateName: `webapp-launch-template-${envSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup: securityGroups.webSecurityGroup,
      role: role,
      requireImdsv2: true, // Security best practice
      detailedMonitoring: true,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });
  }

  private createAutoScalingGroup(
    vpc: ec2.Vpc,
    launchTemplate: ec2.LaunchTemplate,
    envSuffix: string
  ): autoscaling.AutoScalingGroup {
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `AutoScalingGroup-${envSuffix}`,
      {
        autoScalingGroupName: `webapp-asg-${envSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 1,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthChecks: autoscaling.HealthChecks.ec2({
          gracePeriod: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          minInstancesInService: 1,
          maxBatchSize: 1,
          pauseTime: cdk.Duration.minutes(10),
        }),
      }
    );

    // Add scaling policies
    asg.scaleOnCpuUtilization(`ScaleUpPolicy-${envSuffix}`, {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    return asg;
  }

  private createMonitoring(
    asg: autoscaling.AutoScalingGroup,
    alertsTopic: sns.Topic,
    envSuffix: string
  ): void {
    // High CPU utilization alarm
    const highCpuAlarm = new cloudwatch.Alarm(
      this,
      `HighCPUAlarm-${envSuffix}`,
      {
        alarmName: `webapp-high-cpu-${envSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            AutoScalingGroupName: asg.autoScalingGroupName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    highCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

    // Low instance count alarm
    const lowInstanceAlarm = new cloudwatch.Alarm(
      this,
      `LowInstanceAlarm-${envSuffix}`,
      {
        alarmName: `webapp-low-instances-${envSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/AutoScaling',
          metricName: 'GroupInServiceInstances',
          dimensionsMap: {
            AutoScalingGroupName: asg.autoScalingGroupName,
          },
          period: cdk.Duration.minutes(1),
          statistic: 'Average',
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      }
    );

    lowInstanceAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertsTopic)
    );

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `WebAppDashboard-${envSuffix}`,
      {
        dashboardName: `webapp-monitoring-${envSuffix}`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName: asg.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Instance Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensionsMap: {
              AutoScalingGroupName: asg.autoScalingGroupName,
            },
          }),
        ],
      })
    );
  }

  private createSSMParameters(
    vpc: ec2.Vpc,
    bucket: s3.Bucket,
    envSuffix: string
  ): void {
    new ssm.StringParameter(this, `VPCIdParameter-${envSuffix}`, {
      parameterName: `/webapp/${envSuffix}/vpc-id`,
      stringValue: vpc.vpcId,
      description: 'VPC ID for the web application',
    });

    new ssm.StringParameter(this, `S3BucketParameter-${envSuffix}`, {
      parameterName: `/webapp/${envSuffix}/s3-bucket`,
      stringValue: bucket.bucketName,
      description: 'S3 bucket for artifacts',
    });

    new ssm.StringParameter(this, `EnvironmentParameter-${envSuffix}`, {
      parameterName: `/webapp/${envSuffix}/environment`,
      stringValue: envSuffix,
      description: 'Environment name',
    });
  }

  private createOutputs(
    vpc: ec2.Vpc,
    bucket: s3.Bucket,
    asg: autoscaling.AutoScalingGroup
  ): void {
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: 'ProductionVPCId',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket for artifacts',
      exportName: 'ProductionS3Bucket',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: 'ProductionASGName',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'ProductionRegion',
    });
  }
}
