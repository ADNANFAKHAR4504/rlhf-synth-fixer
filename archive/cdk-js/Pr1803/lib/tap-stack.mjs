import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      'Environment': 'Production',
      'Project': `synth-trainr165-${environmentSuffix}`,
      'Team': 'synth',
      'EnvironmentSuffix': environmentSuffix
    };

    // Apply tags to the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create VPC with 3 subnets across different AZs
    const vpc = new cdk.aws_ec2.Vpc(this, `vpc-${environmentSuffix}`, {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'database-subnet',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // S3 bucket for static content
    const staticContentBucket = new cdk.aws_s3.Bucket(this, `static-content-${environmentSuffix}`, {
      bucketName: `tap-${environmentSuffix}-static-${this.account}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // IAM role for EC2 instances to access S3
    const ec2Role = new cdk.aws_iam.Role(this, `ec2-role-${environmentSuffix}`, {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances to access S3 static content',
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ]
    });

    // Grant S3 access to EC2 role
    staticContentBucket.grantRead(ec2Role);

    // Create instance profile
    const instanceProfile = new cdk.aws_iam.CfnInstanceProfile(this, `instance-profile-${environmentSuffix}`, {
      roles: [ec2Role.roleName],
      instanceProfileName: `tap-${environmentSuffix}-instance-profile`
    });

    // Security group for ALB
    const albSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, `alb-sg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true
    });

    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security group for EC2 instances
    const ec2SecurityGroup = new cdk.aws_ec2.SecurityGroup(this, `ec2-sg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      cdk.aws_ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      cdk.aws_ec2.Port.tcp(443),
      'Allow HTTPS traffic from ALB'
    );

    // Security group for RDS
    const rdsSecurityGroup = new cdk.aws_ec2.SecurityGroup(this, `rds-sg-${environmentSuffix}`, {
      vpc,
      description: 'Security group for RDS MySQL database',
      allowAllOutbound: false
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      cdk.aws_ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // User data script for EC2 instances
    const userData = cdk.aws_ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Server - $(hostname -f)</h1>" > /var/www/html/index.html',
      // CloudWatch agent configuration
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default'
    );

    // Launch template for EC2 instances
    const launchTemplate = new cdk.aws_ec2.LaunchTemplate(this, `launch-template-${environmentSuffix}`, {
      instanceType: cdk.aws_ec2.InstanceType.of(cdk.aws_ec2.InstanceClass.T3, cdk.aws_ec2.InstanceSize.MICRO),
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      userData: userData,
      role: ec2Role,
      detailedMonitoring: true
    });

    // Auto Scaling Group
    const autoScalingGroup = new cdk.aws_autoscaling.AutoScalingGroup(this, `asg-${environmentSuffix}`, {
      vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      healthCheck: cdk.aws_autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5)
      }),
      updatePolicy: cdk.aws_autoscaling.UpdatePolicy.rollingUpdate({
        minInstancesInService: 1
      })
    });

    // Application Load Balancer
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, `alb-${environmentSuffix}`, {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC
      }
    });

    // Target group for ALB
    const targetGroup = new cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup(this, `target-group-${environmentSuffix}`, {
      vpc,
      port: 80,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3
      }
    });

    // ALB Listener
    alb.addListener(`listener-${environmentSuffix}`, {
      port: 80,
      protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
      defaultAction: cdk.aws_elasticloadbalancingv2.ListenerAction.forward([targetGroup])
    });

    // RDS Subnet Group
    const dbSubnetGroup = new cdk.aws_rds.SubnetGroup(this, `db-subnet-group-${environmentSuffix}`, {
      vpc,
      description: 'Subnet group for RDS MySQL database',
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED
      }
    });

    // RDS MySQL Database with Multi-AZ
    const database = new cdk.aws_rds.DatabaseInstance(this, `database-${environmentSuffix}`, {
      engine: cdk.aws_rds.DatabaseInstanceEngine.mysql({
        version: cdk.aws_rds.MysqlEngineVersion.VER_8_0_39
      }),
      instanceType: cdk.aws_ec2.InstanceType.of(cdk.aws_ec2.InstanceClass.T3, cdk.aws_ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      credentials: cdk.aws_rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `tap-${environmentSuffix}-db-credentials`
      }),
      databaseName: 'webappdb',
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      cloudwatchLogsExports: ['error', 'general'],
      enablePerformanceInsights: false
    });

    // CloudWatch Log Group for application logs
    const logGroup = new cdk.aws_logs.LogGroup(this, `log-group-${environmentSuffix}`, {
      logGroupName: `/aws/ec2/tap-${environmentSuffix}`,
      retention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CloudWatch Dashboard
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, `dashboard-${environmentSuffix}`, {
      dashboardName: `tap-${environmentSuffix}-webapp-dashboard`
    });

    // ALB metrics widget
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metrics.requestCount()],
        width: 12
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [alb.metrics.targetResponseTime()],
        width: 12
      })
    );

    // Auto Scaling Group metrics widget
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Auto Scaling Group Instance Count',
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupDesiredCapacity',
            dimensionsMap: {
              AutoScalingGroupName: autoScalingGroup.autoScalingGroupName
            }
          }),
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensionsMap: {
              AutoScalingGroupName: autoScalingGroup.autoScalingGroupName
            }
          })
        ],
        width: 12
      })
    );

    // RDS metrics widget
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBInstanceIdentifier: database.instanceIdentifier
          }
        })],
        width: 12
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBInstanceIdentifier: database.instanceIdentifier
          }
        })],
        width: 12
      })
    );

    // CloudWatch Alarms
    const highCpuAlarm = new cdk.aws_cloudwatch.Alarm(this, `high-cpu-alarm-${environmentSuffix}`, {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName
        }
      }),
      threshold: 75,
      evaluationPeriods: 2,
      comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High CPU utilization alarm for Auto Scaling Group'
    });

    const rdsHighCpuAlarm = new cdk.aws_cloudwatch.Alarm(this, `rds-high-cpu-alarm-${environmentSuffix}`, {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: database.instanceIdentifier
        }
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High CPU utilization alarm for RDS database'
    });

    // Scaling policies
    const scaleUpPolicy = autoScalingGroup.scaleOnMetric(`scale-up-${environmentSuffix}`, {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName
        }
      }),
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 50, change: +1 },
        { lower: 70, change: +2 }
      ]
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `LoadBalancerDNS-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint',
      exportName: `DatabaseEndpoint-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticContentBucket.bucketName,
      description: 'S3 bucket for static content',
      exportName: `S3BucketName-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardURL-${environmentSuffix}`
    });
  }
}