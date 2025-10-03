import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BlogInfrastructureStackProps {
  environmentSuffix: string;
}

export class BlogInfrastructureStack extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: BlogInfrastructureStackProps
  ) {
    super(scope, id);

    const { environmentSuffix } = props;

    // VPC Configuration
    const vpc = new ec2.Vpc(this, `BlogVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Enable VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    const logGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        logGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Security Group for EC2 Instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('192.168.0.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH from specific CIDR'
    );

    // S3 Bucket for Static Assets
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `blog-static-assets-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'TransitionOldVersions',
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // IAM Role for EC2 Instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Grant S3 bucket access to EC2 instances
    staticAssetsBucket.grantReadWrite(ec2Role);

    // User Data script to install Apache and CloudWatch Agent
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Blog Platform - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/index.html',
      // CloudWatch Agent configuration
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      '    "namespace": "BlogPlatform",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": [',
      '          {"name": "cpu_usage_idle", "rename": "CPU_USAGE_IDLE", "unit": "Percent"},',
      '          {"name": "cpu_usage_iowait", "rename": "CPU_USAGE_IOWAIT", "unit": "Percent"},',
      '          "cpu_time_guest"',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["*"],',
      '        "totalcpu": false',
      '      },',
      '      "mem": {',
      '        "measurement": [',
      '          {"name": "mem_used_percent", "rename": "MEM_USED_PERCENT", "unit": "Percent"},',
      '          {"name": "mem_available", "rename": "MEM_AVAILABLE", "unit": "Bytes"}',
      '        ],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'BlogLaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      userData,
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `BlogALB${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        loadBalancerName: `blog-alb-${environmentSuffix}`,
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlogTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200',
        },
      }
    );

    // ALB Listener
    alb.addListener('BlogListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'BlogAutoScalingGroup', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Attach the target group to the ASG
    asg.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Policies
    asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
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
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 80%',
    });

    new cloudwatch.Alarm(this, 'LowMemoryAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'BlogPlatform',
        metricName: 'MEM_AVAILABLE',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 536870912, // 512 MB in bytes
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when available memory is low',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'BlogDashboard', {
      dashboardName: `BlogPlatform-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
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
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Memory Usage',
        left: [
          new cloudwatch.Metric({
            namespace: 'BlogPlatform',
            metricName: 'MEM_USED_PERCENT',
            dimensionsMap: {
              AutoScalingGroupName: asg.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Target Group Health',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'HealthyHostCount',
            dimensionsMap: {
              TargetGroup: targetGroup.targetGroupFullName,
              LoadBalancer: alb.loadBalancerFullName,
            },
            statistic: 'Average',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'UnHealthyHostCount',
            dimensionsMap: {
              TargetGroup: targetGroup.targetGroupFullName,
              LoadBalancer: alb.loadBalancerFullName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: alb.loadBalancerFullName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'StaticAssetsBucketName', {
      value: staticAssetsBucket.bucketName,
      description: 'Name of the S3 bucket for static assets',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${cdk.Aws.REGION}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
