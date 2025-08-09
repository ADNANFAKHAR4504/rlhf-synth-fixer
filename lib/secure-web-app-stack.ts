import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface SecureWebAppStackProps extends cdk.StackProps {
  environment: string;
  allowedCidrBlocks?: string[];
}

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureWebAppStackProps) {
    super(scope, id, props);

    const { environment } = props;
    const allowedCidrBlocks = props.allowedCidrBlocks || ['10.0.0.0/8'];

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebApp');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // 1. KMS Key for encryption (created first as other resources depend on it)
    const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
      alias: `tf-encryption-key-${environment}`,
      description: `KMS key for encrypting resources in ${environment} environment`,
      enableKeyRotation: true,
      rotationPeriod: cdk.Duration.days(365),
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
          }),
        ],
      }),
    });

    // 2. VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, `tf-vpc-${environment}`, {
      vpcName: `tf-vpc-${environment}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
      ],
      natGateways: 2, // For high availability
      flowLogs: {
        [`tf-vpc-flow-logs-${environment}`]: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, `tf-vpc-flow-logs-${environment}`, {
              logGroupName: `/aws/vpc/flowlogs-${environment}`,
              retention: logs.RetentionDays.ONE_MONTH,
              encryptionKey: kmsKey,
            })
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // 3. Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-alb-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-alb-sg-${environment}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    // Allow HTTP and HTTPS from allowed CIDR blocks
    allowedCidrBlocks.forEach(cidr => {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(80),
        `Allow HTTP from ${cidr}`
      );
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `Allow HTTPS from ${cidr}`
      );
    });

    // Allow outbound to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP to EC2 instances'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-ec2-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-ec2-sg-${environment}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: false,
      }
    );

    // Allow HTTP from ALB only
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Allow HTTPS outbound for package updates and SSM
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.prefixList('pl-63a5400a'),
      ec2.Port.tcp(443),
      'Allow HTTPS to S3 endpoints'
    );

    // Allow HTTPS to AWS service endpoints only
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.ipv4('169.254.169.254/32'),
      ec2.Port.tcp(80),
      'Allow HTTP to EC2 metadata service'
    );

    // Allow DNS resolution
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // 4. IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `tf-ec2-role-${environment}`, {
      roleName: `tf-ec2-role-${environment}-${cdk.Aws.ACCOUNT_ID}`,
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
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              resources: [
                `arn:aws:s3:::tf-backend-storage-${environment}`,
                `arn:aws:s3:::tf-backend-storage-${environment}/logs/*`,
              ],
              conditions: {
                StringEquals: {
                  's3:ExistingObjectTag/Environment': environment,
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
              conditions: {
                StringEquals: {
                  'kms:ViaService': [
                    `s3.${this.region}.amazonaws.com`,
                    `logs.${this.region}.amazonaws.com`,
                  ],
                },
              },
            }),
          ],
        }),
      },
    });

    // 5. S3 Bucket with security best practices
    const s3Bucket = new s3.Bucket(this, `tf-backend-storage-${environment}`, {
      bucketName: `tf-backend-storage-${environment}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
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
      serverAccessLogsPrefix: 'access-logs/',
    });

    // 6. User Data Script for EC2 bootstrapping
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Install and configure CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Create CloudWatch agent configuration
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          metrics: {
            namespace: `tf-webapp-${environment}`,
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
                    log_group_name: `/aws/ec2/httpd-access-${environment}`,
                    log_stream_name: '{instance_id}',
                  },
                  {
                    file_path: '/var/log/httpd/error_log',
                    log_group_name: `/aws/ec2/httpd-error-${environment}`,
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

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s',

      // Create a simple index page
      'echo "<h1>Secure Web Application - ' +
        environment +
        '</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',

      // Configure log rotation
      'cat > /etc/logrotate.d/httpd << EOF',
      '/var/log/httpd/*log {',
      '    daily',
      '    missingok',
      '    rotate 52',
      '    compress',
      '    delaycompress',
      '    notifempty',
      '    create 640 apache apache',
      '    sharedscripts',
      '    postrotate',
      '        systemctl reload httpd',
      '    endscript',
      '}',
      'EOF'
    );

    // 7. Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `tf-launch-template-${environment}`,
      {
        launchTemplateName: `tf-launch-template-${environment}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        userData: userData,
        role: ec2Role,
        securityGroup: ec2SecurityGroup,
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
        requireImdsv2: true, // Require IMDSv2 for security
      }
    );

    // 8. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `tf-alb-${environment}`,
      {
        loadBalancerName: `tf-alb-${environment}`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        deletionProtection: true,
      }
    );

    // Enable access logging for ALB
    const albLogsBucket = new s3.Bucket(this, `tf-alb-logs-${environment}`, {
      bucketName: `tf-alb-logs-${environment}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);

    // 9. Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `tf-asg-${environment}`,
      {
        autoScalingGroupName: `tf-asg-${environment}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthChecks: {
          types: ['EC2'],
          gracePeriod: cdk.Duration.minutes(5),
        },
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // 10. Target Group and Listener
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `tf-target-group-${environment}`,
      {
        targetGroupName: `tf-target-group-${environment}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        targets: [asg],
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
      }
    );

    alb.addListener(`tf-listener-${environment}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 11. WAFv2 Web ACL
    const webAcl = new wafv2.CfnWebACL(this, `tf-waf-${environment}`, {
      name: `tf-waf-${environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: `WAF for ALB in ${environment} environment`,
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
          name: 'RateLimitRule',
          priority: 3,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRuleMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tf-waf-${environment}`,
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, `tf-waf-association-${environment}`, {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // 12. CloudWatch Log Groups for application logs
    new logs.LogGroup(this, `tf-httpd-access-logs-${environment}`, {
      logGroupName: `/aws/ec2/httpd-access-${environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    new logs.LogGroup(this, `tf-httpd-error-logs-${environment}`, {
      logGroupName: `/aws/ec2/httpd-error-${environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    // 13. SNS Topic for Alerts
    const alertsTopic = new sns.Topic(this, `tf-alerts-${environment}`, {
      topicName: `tf-alerts-${environment}`,
      displayName: `Alerts for ${environment} environment`,
      masterKey: kmsKey,
    });

    // 14. CloudWatch Alarms
    const highCpuAlarm = new cloudwatch.Alarm(
      this,
      `tf-high-cpu-alarm-${environment}`,
      {
        alarmName: `tf-high-cpu-alarm-${environment}`,
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
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'High CPU utilization in ASG',
      }
    );

    highCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

    const unhealthyHostsAlarm = new cloudwatch.Alarm(
      this,
      `tf-unhealthy-hosts-alarm-${environment}`,
      {
        alarmName: `tf-unhealthy-hosts-alarm-${environment}`,
        metric: targetGroup.metrics.unhealthyHostCount({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: 'Unhealthy hosts detected in target group',
      }
    );

    unhealthyHostsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertsTopic)
    );

    // 15. Auto Scaling Policies
    // Use Target Tracking Scaling Policy (modern approach) instead of Step Scaling
    new autoscaling.TargetTrackingScalingPolicy(
      this,
      `tf-cpu-scaling-policy-${environment}`,
      {
        autoScalingGroup: asg,
        targetValue: 70,
        predefinedMetric:
          autoscaling.PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
      }
    );

    // 16. Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
      exportName: `tf-alb-dns-${environment}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `tf-s3-bucket-${environment}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
      exportName: `tf-kms-key-${environment}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tf-vpc-id-${environment}`,
    });

    new cdk.CfnOutput(this, 'WAFWebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `tf-waf-arn-${environment}`,
    });
  }
}
