import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface SecureWebAppStackProps extends cdk.StackProps {
  environment: string;
}

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureWebAppStackProps) {
    super(scope, id, props);

    const { environment } = props;
    const prefix = 'tf';

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebApp');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // 1. VPC Configuration
    const vpc = this.createVPC(prefix, environment);

    // 2. KMS Key for encryption
    const kmsKey = this.createKMSKey(prefix, environment);

    // 3. S3 Bucket
    const s3Bucket = this.createS3Bucket(prefix, environment, kmsKey);

    // 4. Security Groups
    const { albSecurityGroup, ec2SecurityGroup } = this.createSecurityGroups(
      vpc,
      prefix,
      environment
    );

    // 5. IAM Role for EC2 instances
    const ec2Role = this.createEC2Role(s3Bucket, prefix, environment);

    // 6. Application Load Balancer
    const alb = this.createApplicationLoadBalancer(
      vpc,
      albSecurityGroup,
      prefix,
      environment
    );

    // 7. Auto Scaling Group
    const asg = this.createAutoScalingGroup(
      vpc,
      ec2SecurityGroup,
      ec2Role,
      alb,
      prefix,
      environment
    );

    // 8. WAFv2
    this.createWAFv2(alb, prefix, environment);

    // 9. CloudWatch Monitoring
    this.createCloudWatchDashboard(alb, asg, prefix, environment);

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${prefix}-${environment}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name for EC2 data',
      exportName: `${prefix}-${environment}-s3-bucket-name`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${prefix}-${environment}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${prefix}-${environment}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `${prefix}-${environment}-asg-name`,
    });
  }

  private createVPC(prefix: string, environment: string): ec2.Vpc {
    return new ec2.Vpc(this, `${prefix}-vpc-${environment}`, {
      vpcName: `${prefix}-vpc-${environment}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1, // Cost optimization - use 1 NAT Gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${prefix}-public-subnet-${environment}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${prefix}-private-subnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      flowLogs: {
        [`${prefix}-vpc-flowlogs-${environment}`]: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, `${prefix}-vpc-flowlogs-${environment}`, {
              logGroupName: `/aws/vpc/flowlogs/${prefix}-${environment}`,
              retention: logs.RetentionDays.ONE_MONTH,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            })
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });
  }

  private createKMSKey(prefix: string, environment: string): kms.Key {
    return new kms.Key(this, `${prefix}-kms-key-${environment}`, {
      alias: `${prefix}-encryption-key-${environment}`,
      description: `KMS key for ${prefix} infrastructure encryption - ${environment}`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
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
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });
  }

  private createS3Bucket(
    prefix: string,
    environment: string,
    kmsKey: kms.Key
  ): s3.Bucket {
    return new s3.Bucket(this, `${prefix}-ec2-data-bucket-${environment}`, {
      bucketName: `${prefix}-ec2-data-bucket-${environment}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
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
      enforceSSL: true,
      eventBridgeEnabled: true,
    });
  }

  private createSecurityGroups(
    vpc: ec2.Vpc,
    prefix: string,
    environment: string
  ) {
    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${prefix}-alb-sg-${environment}`,
      {
        vpc,
        securityGroupName: `${prefix}-alb-sg-${environment}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    // Allow HTTPS traffic from anywhere
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Allow HTTP traffic from anywhere (redirect to HTTPS)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // EC2 Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${prefix}-ec2-sg-${environment}`,
      {
        vpc,
        securityGroupName: `${prefix}-ec2-sg-${environment}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true, // Needed for updates and SSM
      }
    );

    // Allow traffic from ALB only
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Allow HTTPS outbound for updates and SSM
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for health checks'
    );

    return { albSecurityGroup, ec2SecurityGroup };
  }

  private createEC2Role(
    s3Bucket: s3.Bucket,
    prefix: string,
    environment: string
  ): iam.Role {
    const role = new iam.Role(this, `${prefix}-ec2-role-${environment}`, {
      roleName: `${prefix}-ec2-role-${environment}`,
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

    // Add S3 permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
      })
    );

    return role;
  }

  private createApplicationLoadBalancer(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    prefix: string,
    environment: string
  ): elbv2.ApplicationLoadBalancer {
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${prefix}-alb-${environment}`,
      {
        loadBalancerName: `${prefix}-alb-${environment}`,
        vpc,
        internetFacing: true,
        securityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        deletionProtection: false, // Set to true for production
        http2Enabled: true,
        idleTimeout: cdk.Duration.seconds(60),
      }
    );

    // Enable access logs
    const accessLogsBucket = new s3.Bucket(
      this,
      `${prefix}-alb-logs-${environment}`,
      {
        bucketName: `${prefix}-alb-access-logs-${environment}`,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            expiration: cdk.Duration.days(90),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Add bucket policy to allow ALB to write access logs
    // Use CDK's built-in ELB service principal instead of hardcoded account IDs
    accessLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowELBServiceAccount',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
        ],
        actions: ['s3:PutObject'],
        resources: [`${accessLogsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    accessLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowELBServiceAccountGetBucketAcl',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
        ],
        actions: ['s3:GetBucketAcl'],
        resources: [accessLogsBucket.bucketArn],
      })
    );

    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', accessLogsBucket.bucketName);

    return alb;
  }

  private createAutoScalingGroup(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    role: iam.Role,
    alb: elbv2.ApplicationLoadBalancer,
    prefix: string,
    environment: string
  ): autoscaling.AutoScalingGroup {
    // User data script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Web Application</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',

      // Install CloudWatch agent
      'yum install -y amazon-cloudwatch-agent',

      // Install SSM agent (should be pre-installed on Amazon Linux 2023)
      'yum install -y amazon-ssm-agent',
      'systemctl start amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${prefix}-launch-template-${environment}`,
      {
        launchTemplateName: `${prefix}-launch-template-${environment}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023({
          cpuType: ec2.AmazonLinuxCpuType.X86_64,
        }),
        securityGroup,
        role,
        userData,
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
        httpPutResponseHopLimit: 2,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `${prefix}-asg-${environment}`,
      {
        autoScalingGroupName: `${prefix}-asg-${environment}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
        }),
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${prefix}-tg-${environment}`,
      {
        targetGroupName: `${prefix}-tg-${environment}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        targets: [asg],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
          timeout: cdk.Duration.seconds(5),
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    // ALB Listener
    alb.addListener(`${prefix}-listener-${environment}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // Auto Scaling Policies
    asg.scaleOnCpuUtilization(`${prefix}-cpu-scaling-${environment}`, {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    return asg;
  }

  private createWAFv2(
    alb: elbv2.ApplicationLoadBalancer,
    prefix: string,
    environment: string
  ): wafv2.CfnWebACL {
    const webAcl = new wafv2.CfnWebACL(this, `${prefix}-waf-${environment}`, {
      name: `${prefix}-waf-${environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: `WAF for ${prefix} Application Load Balancer - ${environment}`,
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
              limit: 10000,
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
        metricName: `${prefix}-waf-metric-${environment}`,
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(
      this,
      `${prefix}-waf-association-${environment}`,
      {
        resourceArn: alb.loadBalancerArn,
        webAclArn: webAcl.attrArn,
      }
    );

    return webAcl;
  }

  private createCloudWatchDashboard(
    alb: elbv2.ApplicationLoadBalancer,
    asg: autoscaling.AutoScalingGroup,
    prefix: string,
    environment: string
  ): cloudwatch.Dashboard {
    const dashboard = new cloudwatch.Dashboard(
      this,
      `${prefix}-dashboard-${environment}`,
      {
        dashboardName: `${prefix}-monitoring-dashboard-${environment}`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'ALB Request Count',
              left: [alb.metrics.requestCount()],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'ALB Response Time',
              left: [alb.metrics.targetResponseTime()],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'ASG Instance Count',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/AutoScaling',
                  metricName: 'GroupDesiredCapacity',
                  dimensionsMap: {
                    AutoScalingGroupName: asg.autoScalingGroupName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'ALB HTTP Errors',
              left: [
                alb.metrics.httpCodeTarget(
                  elbv2.HttpCodeTarget.TARGET_4XX_COUNT
                ),
                alb.metrics.httpCodeTarget(
                  elbv2.HttpCodeTarget.TARGET_5XX_COUNT
                ),
              ],
              width: 12,
              height: 6,
            }),
          ],
        ],
      }
    );

    return dashboard;
  }
}
