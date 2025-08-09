import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface SecureWebAppStackProps extends cdk.StackProps {
  environment: string;
  domainName?: string;
  hostedZoneId?: string;
}

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureWebAppStackProps) {
    super(scope, id, props);

    const { environment, domainName, hostedZoneId } = props;

    // Generate unique suffix for globally unique resources
    const uniqueSuffix = cdk.Names.uniqueId(this).toLowerCase().substring(0, 8);

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'SecureWebApp',
      ManagedBy: 'CDK',
      DeploymentEnvironment: environment,
    };

    // Apply common tags to the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', commonTags.Project);
    cdk.Tags.of(this).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(this).add('DeploymentEnvironment', environment);

    // 1. KMS Key for encryption with least privilege policy
    const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
      alias: `tf-secure-web-app-key-${environment}`,
      description: `Encryption key for secure web app - ${environment}`,
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: [
              'kms:Create*',
              'kms:Describe*',
              'kms:Enable*',
              'kms:List*',
              'kms:Put*',
              'kms:Update*',
              'kms:Revoke*',
              'kms:Disable*',
              'kms:Get*',
              'kms:Delete*',
              'kms:ScheduleKeyDeletion',
              'kms:CancelKeyDeletion',
            ],
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
            conditions: {
              ArnEquals: {
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
              StringEquals: {
                'kms:ViaService': `s3.${this.region}.amazonaws.com`,
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

    // VPC Flow Logs for security monitoring
    const flowLogRole = new iam.Role(this, `tf-flow-log-role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/VPCFlowLogsDeliveryRolePolicy'
        ),
      ],
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

    // 3. Security Groups
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

    // Allow HTTPS from anywhere (will be protected by WAF)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Allow outbound to EC2 instances on HTTP and HTTPS
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP to EC2 instances'
    );
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS to EC2 instances'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-ec2-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-ec2-security-group-${environment}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: false, // Implement least privilege
      }
    );

    // Allow traffic only from ALB
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // Allow outbound HTTPS for package updates and SSM
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS for updates and SSM'
    );

    // Allow outbound HTTP for package repositories
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for package repositories'
    );

    // Allow DNS resolution
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // No SSH access - using SSM Session Manager instead

    // 4. IAM Role for EC2 instances with least privilege
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
    });

    // Least privilege S3 access - only specific actions on specific resources
    const s3BucketName = `tf-secure-storage-${environment}-${uniqueSuffix}`;
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3ObjectAccess',
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`arn:aws:s3:::${s3BucketName}/app-data/*`],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3BucketList',
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [`arn:aws:s3:::${s3BucketName}`],
        conditions: {
          StringLike: {
            's3:prefix': ['app-data/*'],
          },
        },
      })
    );

    // Least privilege KMS permissions
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'KMSAccess',
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
        resources: [kmsKey.keyArn],
        conditions: {
          StringEquals: {
            'kms:ViaService': `s3.${this.region}.amazonaws.com`,
          },
        },
      })
    );

    // 5. S3 Bucket with enhanced security configurations
    const s3Bucket = new s3.Bucket(this, `tf-secure-storage-${environment}`, {
      bucketName: s3BucketName,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
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
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      eventBridgeEnabled: true,
      // Remove inventories for now as it has complex configuration requirements
    });

    // Separate bucket for access logs to avoid circular dependency
    const accessLogsBucket = new s3.Bucket(
      this,
      `tf-access-logs-${environment}`,
      {
        bucketName: `tf-access-logs-${environment}-${uniqueSuffix}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
        lifecycleRules: [
          {
            id: 'DeleteOldAccessLogs',
            expiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Configure access logging for main bucket using server access logs
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('logging.s3.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${accessLogsBucket.bucketArn}/s3-access-logs/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // SNS Topic for S3 security notifications
    const securityNotificationTopic = new sns.Topic(
      this,
      `tf-security-notifications-${environment}`,
      {
        topicName: `tf-security-notifications-${environment}`,
        displayName: `Security Notifications for ${environment}`,
        masterKey: kmsKey,
      }
    );

    // S3 Bucket notification for security monitoring
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(securityNotificationTopic),
      { prefix: 'app-data/' }
    );

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED,
      new s3n.SnsDestination(securityNotificationTopic),
      { prefix: 'app-data/' }
    );

    // 6. CloudTrail for API logging
    const cloudTrailLogGroup = new logs.LogGroup(
      this,
      `tf-cloudtrail-logs-${environment}`,
      {
        logGroupName: `/aws/cloudtrail/${environment}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
      }
    );

    const cloudTrail = new cloudtrail.Trail(
      this,
      `tf-cloudtrail-${environment}`,
      {
        trailName: `tf-secure-cloudtrail-${environment}`,
        bucket: accessLogsBucket,
        s3KeyPrefix: 'cloudtrail-logs/',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: kmsKey,
        cloudWatchLogGroup: cloudTrailLogGroup,
        sendToCloudWatchLogs: true,
      }
    );

    // 7. GuardDuty for threat detection
    const guardDutyDetector = new guardduty.CfnDetector(
      this,
      `tf-guardduty-${environment}`,
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        dataSources: {
          s3Logs: { enable: true },
          kubernetes: { auditLogs: { enable: true } },
          malwareProtection: {
            scanEc2InstanceWithFindings: { ebsVolumes: true },
          },
        },
      }
    );

    // 8. Launch Template for EC2 instances with enhanced security
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',

      // Install and configure Apache
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Configure security headers
      'cat > /etc/httpd/conf.d/security.conf << EOF',
      'Header always set X-Content-Type-Options nosniff',
      'Header always set X-Frame-Options DENY',
      'Header always set X-XSS-Protection "1; mode=block"',
      'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
      "Header always set Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'\"",
      'Header always set Referrer-Policy "strict-origin-when-cross-origin"',
      'EOF',

      // Create a simple health check page
      'echo "<html><body><h1>Healthy</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/health.html',
      'echo "<html><body><h1>Secure Web Application</h1><p>Environment: ' +
        environment +
        '</p></body></html>" > /var/www/html/index.html',

      // Configure CloudWatch agent
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
              deleteOnTermination: true,
            }),
          },
        ],
        requireImdsv2: true, // Enforce IMDSv2 for security
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
        httpPutResponseHopLimit: 1,
      }
    );

    // 9. SSL Certificate (if domain is provided)
    let certificate: certificatemanager.ICertificate | undefined;
    if (domainName && hostedZoneId) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        `tf-hosted-zone-${environment}`,
        {
          hostedZoneId,
          zoneName: domainName,
        }
      );

      certificate = new certificatemanager.Certificate(
        this,
        `tf-certificate-${environment}`,
        {
          domainName,
          validation:
            certificatemanager.CertificateValidation.fromDns(hostedZone),
        }
      );
    }

    // 10. Application Load Balancer with HTTPS
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

    // ALB Access Logs
    const albLogsBucket = new s3.Bucket(this, `tf-alb-logs-${environment}`, {
      bucketName: `tf-alb-access-logs-${environment}-${uniqueSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
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

    // ALB Listeners with HTTPS redirect
    let listener: elbv2.ApplicationListener;

    if (certificate) {
      // HTTPS Listener
      listener = alb.addListener(`tf-https-listener-${environment}`, {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
        sslPolicy: elbv2.SslPolicy.TLS12_EXT,
      });

      // HTTP to HTTPS redirect
      alb.addListener(`tf-http-redirect-listener-${environment}`, {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
    } else {
      // HTTP Listener (for testing without domain)
      listener = alb.addListener(`tf-listener-${environment}`, {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });
    }

    // Output the listener ARN for reference
    new cdk.CfnOutput(this, `tf-listener-arn-${environment}`, {
      value: listener.listenerArn,
      description: 'ALB Listener ARN',
    });

    // 11. Auto Scaling Group with enhanced configuration
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
        healthChecks: {
          types: ['ELB'],
          gracePeriod: cdk.Duration.minutes(5),
        },
        signals: autoscaling.Signals.waitForAll({
          timeout: cdk.Duration.minutes(10),
        }),
      }
    );

    // Attach ASG to Target Group
    asg.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Policies with multiple metrics
    asg.scaleOnCpuUtilization(`tf-cpu-scaling-${environment}`, {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    asg.scaleOnRequestCount(`tf-request-scaling-${environment}`, {
      targetRequestsPerMinute: 1000,
      cooldown: cdk.Duration.minutes(5),
    });

    // 12. Enhanced WAF v2 Configuration
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
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'GeoBlockingRule',
          priority: 4,
          action: { block: {} },
          statement: {
            geoMatchStatement: {
              countryCodes: ['CN', 'RU', 'KP'], // Block specific countries
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'GeoBlockingRule',
          },
        },
        {
          name: 'SQLInjectionRule',
          priority: 5,
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
            metricName: 'SQLInjectionRule',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tf-waf-metric-${environment}`,
      },
    });

    // WAF Logging Configuration
    const wafLogGroup = new logs.LogGroup(this, `tf-waf-logs-${environment}`, {
      logGroupName: `/aws/wafv2/${environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    new wafv2.CfnLoggingConfiguration(this, `tf-waf-logging-${environment}`, {
      resourceArn: webAcl.attrArn,
      logDestinationConfigs: [wafLogGroup.logGroupArn],
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, `tf-waf-association-${environment}`, {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // 13. Enhanced CloudWatch Alarms and Monitoring
    const httpCodeTarget4xxAlarm = new cloudwatch.Alarm(
      this,
      `tf-4xx-alarm-${environment}`,
      {
        alarmName: `tf-ALB-4xx-errors-${environment}`,
        metric: targetGroup.metrics.httpCodeTarget(
          elbv2.HttpCodeTarget.TARGET_4XX_COUNT
        ),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const httpCodeTarget5xxAlarm = new cloudwatch.Alarm(
      this,
      `tf-5xx-alarm-${environment}`,
      {
        alarmName: `tf-ALB-5xx-errors-${environment}`,
        metric: targetGroup.metrics.httpCodeTarget(
          elbv2.HttpCodeTarget.TARGET_5XX_COUNT
        ),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const responseTimeAlarm = new cloudwatch.Alarm(
      this,
      `tf-response-time-alarm-${environment}`,
      {
        alarmName: `tf-ALB-response-time-${environment}`,
        metric: targetGroup.metrics.targetResponseTime(),
        threshold: 1, // 1 second
        evaluationPeriods: 3,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // WAF blocked requests alarm
    const wafBlockedRequestsAlarm = new cloudwatch.Alarm(
      this,
      `tf-waf-blocked-alarm-${environment}`,
      {
        alarmName: `tf-WAF-blocked-requests-${environment}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/WAFV2',
          metricName: 'BlockedRequests',
          dimensionsMap: {
            WebACL: webAcl.name!,
            Region: this.region,
          },
        }),
        threshold: 100,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // GuardDuty findings alarm
    const guardDutyAlarm = new cloudwatch.Alarm(
      this,
      `tf-guardduty-alarm-${environment}`,
      {
        alarmName: `tf-GuardDuty-findings-${environment}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/GuardDuty',
          metricName: 'FindingCount',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // 14. Outputs
    new cdk.CfnOutput(this, `tf-LoadBalancerDNS-${environment}`, {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, `tf-S3BucketName-${environment}`, {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, `tf-KMSKeyId-${environment}`, {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, `tf-VPCId-${environment}`, {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, `tf-WAFWebACLArn-${environment}`, {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, `tf-CloudTrailArn-${environment}`, {
      value: cloudTrail.trailArn,
      description: 'CloudTrail ARN',
    });

    new cdk.CfnOutput(this, `tf-GuardDutyDetectorId-${environment}`, {
      value: guardDutyDetector.ref,
      description: 'GuardDuty Detector ID',
    });

    if (certificate) {
      new cdk.CfnOutput(this, `tf-CertificateArn-${environment}`, {
        value: certificate.certificateArn,
        description: 'SSL Certificate ARN',
      });
    }

    // CloudWatch Alarm outputs for monitoring
    new cdk.CfnOutput(this, `tf-4xx-alarm-name-${environment}`, {
      value: httpCodeTarget4xxAlarm.alarmName,
      description: '4xx Error Alarm Name',
    });

    new cdk.CfnOutput(this, `tf-5xx-alarm-name-${environment}`, {
      value: httpCodeTarget5xxAlarm.alarmName,
      description: '5xx Error Alarm Name',
    });

    new cdk.CfnOutput(this, `tf-response-time-alarm-name-${environment}`, {
      value: responseTimeAlarm.alarmName,
      description: 'Response Time Alarm Name',
    });

    new cdk.CfnOutput(this, `tf-waf-blocked-alarm-name-${environment}`, {
      value: wafBlockedRequestsAlarm.alarmName,
      description: 'WAF Blocked Requests Alarm Name',
    });

    new cdk.CfnOutput(this, `tf-guardduty-alarm-name-${environment}`, {
      value: guardDutyAlarm.alarmName,
      description: 'GuardDuty Findings Alarm Name',
    });
  }
}
