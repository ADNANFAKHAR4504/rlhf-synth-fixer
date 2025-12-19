import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface WebApplicationStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class WebApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebApplicationStackProps) {
    super(scope, id, props);

    // Create VPC with specified CIDR
    const vpc = new ec2.Vpc(this, `JobBoardVpc${props.environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),
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
    });

    // EC2 Instance Connect Endpoint is available via EC2 console for SSH access

    // Create S3 bucket for static files
    const staticFilesBucket = new s3.Bucket(this, 'StaticFilesBucket', {
      bucketName: `job-board-static-files-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Create bucket policy for web hosting
    staticFilesBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${staticFilesBucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
      })
    );

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup${props.environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Also allow HTTPS for future use
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup${props.environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH from internal network'
    );

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
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

    // Add S3 access to EC2 role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          staticFilesBucket.bucketArn,
          `${staticFilesBucket.bucketArn}/*`,
        ],
      })
    );

    // User data script for Apache installation
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Job Board Application - Instance $(hostname)</h1>" > /var/www/html/index.html',
      'echo "<p>Serving 3000+ daily users</p>" >> /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      '    "namespace": "JobBoard/EC2",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": [',
      '          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},',
      '          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},',
      '          "cpu_time_system",',
      '          "cpu_time_user"',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "totalcpu": false',
      '      },',
      '      "disk": {',
      '        "measurement": [',
      '          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["/"]',
      '      },',
      '      "mem": {',
      '        "measurement": [',
      '          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}',
      '        ],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      'systemctl restart amazon-cloudwatch-agent'
    );

    // Launch template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData: userData,
        role: ec2Role,
        securityGroup: ec2SecurityGroup,
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebServerAutoScalingGroup',
      {
        vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `JobBoardAlb${props.environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        loadBalancerName: `job-board-alb-${props.environmentSuffix}`,
      }
    );

    // Create target group with Automatic Target Weights enabled
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebServerTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          path: '/',
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targetGroupName: `job-board-tg-${props.environmentSuffix}`,
      }
    );

    // Add weighted random algorithm attribute for Automatic Target Weights
    const cfnTargetGroup = targetGroup.node
      .defaultChild as elbv2.CfnTargetGroup;
    cfnTargetGroup.targetGroupAttributes = [
      {
        key: 'load_balancing.algorithm.type',
        value: 'weighted_random',
      },
      {
        key: 'load_balancing.algorithm.anomaly_mitigation',
        value: 'on',
      },
    ];

    // Create HTTP listener for now (certificate would be required for HTTPS)
    // Note: In production, you would use HTTPS with a valid certificate from ACM
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create S3 bucket for WAF logging
    // Generate a unique suffix for the bucket to avoid conflicts
    const uniqueSuffix = cdk.Names.uniqueId(this).toLowerCase().substring(0, 8);
    const wafLogBucket = new s3.Bucket(this, 'WAFLogBucket', {
      bucketName: `aws-waf-logs-${props.environmentSuffix}-${uniqueSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create WAF v2 Web ACL with Bot Control
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      name: `job-board-web-acl-${props.environmentSuffix}`,
      description: 'WAF v2 Web ACL with Bot Control for Job Board Application',
      rules: [
        // Rate limiting rule
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: {
            block: {},
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        // AWS Managed Bot Control rule group
        {
          name: 'AWSManagedRulesBotControlRuleSet',
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesBotControlRuleSet',
              excludedRules: [],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesBotControlRuleSet',
          },
        },
        // AWS Managed Common Rule Set
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 3,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
              excludedRules: [],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `job-board-web-acl-${props.environmentSuffix}`,
      },
    });

    // Configure WAF logging - using S3 bucket instead of CloudWatch logs
    new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingConfiguration', {
      resourceArn: webAcl.attrArn,
      logDestinationConfigs: [wafLogBucket.bucketArn],
    });

    // Associate WAF Web ACL with ALB
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `job-board-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch Alarms for EC2 health monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 80%',
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Target health alarm
    const unhealthyTargetsAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTargetsAlarm',
      {
        metric: targetGroup.metricUnhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: 'Alarm when unhealthy targets detected',
      }
    );

    unhealthyTargetsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // Auto scaling based on CPU
    new autoscaling.TargetTrackingScalingPolicy(this, 'CpuScaling', {
      autoScalingGroup: autoScalingGroup,
      targetValue: 70,
      predefinedMetric:
        autoscaling.PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
      cooldown: cdk.Duration.minutes(5),
    });

    // Auto scaling based on ALB request count per target
    new autoscaling.TargetTrackingScalingPolicy(this, 'RequestCountScaling', {
      autoScalingGroup: autoScalingGroup,
      targetValue: 100,
      predefinedMetric:
        autoscaling.PredefinedMetric.ALB_REQUEST_COUNT_PER_TARGET,
      resourceLabel: `${alb.loadBalancerFullName}/${targetGroup.targetGroupFullName}`,
    });

    // Create CloudWatch alarms for ALB monitoring (simulating network monitoring)
    // Since AWS::NetworkMonitor::Monitor is not available, we'll use ALB metrics
    const targetResponseTimeAlarm = new cloudwatch.Alarm(
      this,
      'TargetResponseTimeAlarm',
      {
        metric: targetGroup.metricTargetResponseTime(),
        threshold: 0.1, // Alert if response time exceeds 100ms
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alarm when target response time exceeds 100ms',
      }
    );

    targetResponseTimeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    const requestCountAlarm = new cloudwatch.Alarm(this, 'RequestCountAlarm', {
      metric: targetGroup.metricRequestCount(),
      threshold: 1000, // Alert if request count exceeds 1000 per minute
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when request count exceeds threshold',
    });

    requestCountAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // Add alarm for ALB HTTP 5xx errors (network-like monitoring)
    const http5xxAlarm = new cloudwatch.Alarm(this, 'Http5xxAlarm', {
      metric: targetGroup.metricHttpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT
      ),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when HTTP 5xx errors exceed threshold',
    });

    http5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Output values
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'StaticFilesBucketName', {
      value: staticFilesBucket.bucketName,
      description: 'Name of the S3 bucket for static files',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the VPC',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });

    new cdk.CfnOutput(this, 'WAFWebACLArn', {
      value: webAcl.attrArn,
      description: 'ARN of the WAF Web ACL',
    });

    new cdk.CfnOutput(this, 'WAFLogBucketName', {
      value: wafLogBucket.bucketName,
      description: 'Name of the S3 bucket for WAF logs',
    });

    new cdk.CfnOutput(this, 'TargetResponseTimeAlarmName', {
      value: targetResponseTimeAlarm.alarmName,
      description:
        'Name of the Target Response Time alarm for network monitoring',
    });
  }
}
