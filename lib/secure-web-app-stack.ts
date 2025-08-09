import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface SecureWebAppStackProps extends cdk.StackProps {
  environment: string;
}

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureWebAppStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebApp');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // 1. KMS Key for encryption with improved least privilege policy
    const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
      description: `Encryption key for secure web app - ${environment}`,
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: [
              'kms:DescribeKey',
              'kms:GetKeyPolicy',
              'kms:PutKeyPolicy',
              'kms:CreateGrant',
              'kms:RevokeGrant',
              'kms:EnableKeyRotation',
              'kms:DisableKeyRotation',
              'kms:GetKeyRotationStatus',
              'kms:ScheduleKeyDeletion',
              'kms:CancelKeyDeletion',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/*`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              StringLike: {
                'kms:EncryptionContext:aws:s3:arn': `arn:aws:s3:::tf-secure-storage-${environment}/*`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow SNS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `sns.${this.region}.amazonaws.com`,
              },
            },
          }),
        ],
      }),
    });

    // SNS Topic for security monitoring notifications with access policy
    const securityNotificationsTopic = new sns.Topic(
      this,
      `tf-security-notifications-${environment}`,
      {
        topicName: `tf-security-notifications-${environment}`,
        displayName: `Security Notifications - ${environment}`,
        masterKey: kmsKey,
      }
    );

    // Add explicit SNS topic access policy
    securityNotificationsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowS3Publish',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [securityNotificationsTopic.topicArn],
        conditions: {
          StringEquals: {
            'aws:SourceAccount': this.account,
          },
          ArnLike: {
            'aws:SourceArn': `arn:aws:s3:::tf-secure-storage-${environment}`,
          },
        },
      })
    );

    // 2. VPC with public and private subnets
    const vpc = new ec2.Vpc(this, `tf-vpc-${environment}`, {
      vpcName: `tf-secure-vpc-${environment}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // For high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `tf-public-subnet-${environment}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `tf-private-subnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `tf-isolated-subnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for security monitoring with inline permissions
    const flowLogRole = new iam.Role(this, `tf-flow-log-role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogDeliveryPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/vpc/flowlogs-${environment}:*`,
              ],
            }),
          ],
        }),
      },
    });

    const flowLogGroup = new logs.LogGroup(
      this,
      `tf-vpc-flow-logs-${environment}`,
      {
        logGroupName: `/aws/vpc/flowlogs-${environment}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
      }
    );

    new ec2.FlowLog(this, `tf-vpc-flow-log-${environment}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 3. Security Groups with least privilege
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-alb-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-alb-security-group-${environment}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-ec2-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-ec2-security-group-${environment}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: false, // Improved: Explicit outbound rules only
      }
    );

    // Allow HTTP and HTTPS from anywhere (will be protected by WAF)
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

    // Allow outbound only to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow outbound HTTP to EC2 instances only'
    );

    // Allow traffic only from ALB
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // Specific outbound rules for EC2 instances
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS for package updates and AWS services'
    );
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for package updates'
    );
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(53),
      'Allow DNS resolution'
    );
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // No SSH access - using SSM Session Manager instead

    // 4. IAM Role for EC2 instances with least privilege and inline policies
    const ec2Role = new iam.Role(this, `tf-ec2-role-${environment}`, {
      roleName: `tf-ec2-instance-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `arn:aws:s3:::tf-secure-storage-${environment}/logs/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [`arn:aws:s3:::tf-secure-storage-${environment}`],
              conditions: {
                StringLike: {
                  's3:prefix': ['logs/*'],
                },
              },
            }),
          ],
        }),
        KMSAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // 5. S3 Bucket with enhanced security configurations
    const s3Bucket = new s3.Bucket(this, `tf-secure-storage-${environment}`, {
      bucketName: `tf-secure-storage-${environment}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
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
    });

    // Add explicit bucket policy to deny non-TLS access
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [s3Bucket.bucketArn, s3Bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // S3 Bucket notification for security monitoring
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(securityNotificationsTopic)
    );

    // 6. Launch Template for EC2 instances with improved security
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y --security', // Only security updates
      'yum install -y amazon-cloudwatch-agent',

      // Install and configure Apache
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Create a simple health check page
      'echo "<html><body><h1>Healthy</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/health.html',
      'echo "<html><body><h1>Secure Web Application</h1><p>Environment: ' +
        environment +
        '</p></body></html>" > /var/www/html/index.html',

      // Configure CloudWatch agent with secure permissions
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          metrics: {
            namespace: `SecureWebApp/${environment}`,
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
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
                    file_path: '/var/log/httpd/access_log',
                    log_group_name: `/aws/ec2/httpd/access-${environment}`,
                    log_stream_name: '{instance_id}',
                  },
                  {
                    file_path: '/var/log/httpd/error_log',
                    log_group_name: `/aws/ec2/httpd/error-${environment}`,
                    log_stream_name: '{instance_id}',
                  },
                ],
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',

      // Set secure permissions on CloudWatch agent config
      'chmod 600 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
      'chown root:root /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',

      // Signal CloudFormation that the instance is ready
      `/opt/aws/bin/cfn-signal -e $? --stack ${this.stackName} --resource AutoScalingGroup --region ${this.region}`
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `tf-launch-template-${environment}`,
      {
        launchTemplateName: `tf-secure-launch-template-${environment}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: userData,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
        requireImdsv2: true, // Enforce IMDSv2 for security
      }
    );

    // 7. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `tf-alb-${environment}`,
      {
        loadBalancerName: `tf-secure-alb-${environment}`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // ALB Access Logs - using auto-generated name to avoid conflicts
    const albLogsBucket = new s3.Bucket(this, `tf-alb-logs-${environment}`, {
      // Remove explicit bucketName to let CDK auto-generate unique name
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    alb.logAccessLogs(albLogsBucket, 'alb-access-logs');

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `tf-target-group-${environment}`,
      {
        targetGroupName: `tf-secure-tg-${environment}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/health.html',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targetType: elbv2.TargetType.INSTANCE,
      }
    );

    // ALB Listener
    alb.addListener(`tf-listener-${environment}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 8. Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `tf-asg-${environment}`,
      {
        autoScalingGroupName: `tf-secure-asg-${environment}`,
        vpc,
        launchTemplate,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        signals: autoscaling.Signals.waitForAll({
          timeout: cdk.Duration.minutes(10),
        }),
      }
    );

    // Configure ELB health check using L1 construct to avoid deprecation warnings
    const cfnAsg = asg.node.defaultChild as autoscaling.CfnAutoScalingGroup;
    cfnAsg.healthCheckType = 'ELB';
    cfnAsg.healthCheckGracePeriod = 300;

    // Attach ASG to Target Group
    asg.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Policies
    asg.scaleOnCpuUtilization(`tf-cpu-scaling-${environment}`, {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // 9. Enhanced WAF v2 Configuration with additional security rules
    const webAcl = new wafv2.CfnWebACL(this, `tf-waf-${environment}`, {
      name: `tf-secure-waf-${environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesBotControlRuleSet',
          priority: 4,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesBotControlRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'BotControlRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 5,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 1000, // Reduced from 2000 for better security
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tf-waf-metric-${environment}`,
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, `tf-waf-association-${environment}`, {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // 10. Enhanced CloudWatch Alarms and Monitoring
    new cloudwatch.Alarm(this, `tf-4xx-alarm-${environment}`, {
      alarmName: `tf-ALB-4xx-errors-${environment}`,
      metric: targetGroup.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_4XX_COUNT
      ),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, `tf-5xx-alarm-${environment}`, {
      alarmName: `tf-ALB-5xx-errors-${environment}`,
      metric: targetGroup.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT
      ),
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, `tf-response-time-alarm-${environment}`, {
      alarmName: `tf-ALB-response-time-${environment}`,
      metric: targetGroup.metrics.targetResponseTime(),
      threshold: 1, // 1 second
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // WAF blocked requests alarm
    new cloudwatch.Alarm(this, `tf-waf-blocked-requests-alarm-${environment}`, {
      alarmName: `tf-WAF-blocked-requests-${environment}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/WAFV2',
        metricName: 'BlockedRequests',
        dimensionsMap: {
          WebACL: webAcl.name!,
          Region: this.region,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 100, // Alert if more than 100 requests blocked in 5 minutes
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // EC2 CPU utilization alarm
    new cloudwatch.Alarm(this, `tf-ec2-cpu-alarm-${environment}`, {
      alarmName: `tf-EC2-high-cpu-${environment}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // 11. Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'WAFWebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'SecurityNotificationsTopicArn', {
      value: securityNotificationsTopic.topicArn,
      description: 'SNS Topic ARN for security notifications',
    });
  }
}
