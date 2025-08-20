# Web Application Infrastructure with CDK JavaScript

Here's a complete highly available web application infrastructure using AWS CDK in JavaScript:

## bin/tap.mjs
```javascript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();
new TapStack(app, 'synth-trainr165', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
});
```

## lib/tap-stack.mjs
```javascript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      'Environment': 'Production',
      'Project': 'synth-trainr165',
      'Team': 'synth'
    };

    // Apply tags to the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Create VPC with 3 subnets across different AZs
    const vpc = new ec2.Vpc(this, 'synth-trainr165-vpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'database-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // S3 bucket for static content
    const staticContentBucket = new s3.Bucket(this, 'synth-trainr165-static-content', {
      bucketName: `synth-trainr165-static-content-${this.account}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // IAM role for EC2 instances to access S3
    const ec2Role = new iam.Role(this, 'synth-trainr165-ec2-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances to access S3 static content',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ]
    });

    // Grant S3 access to EC2 role
    staticContentBucket.grantRead(ec2Role);

    // Create instance profile
    const instanceProfile = new iam.CfnInstanceProfile(this, 'synth-trainr165-instance-profile', {
      roles: [ec2Role.roleName],
      instanceProfileName: 'synth-trainr165-instance-profile'
    });

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'synth-trainr165-alb-sg', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'synth-trainr165-ec2-sg', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from ALB'
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'synth-trainr165-rds-sg', {
      vpc,
      description: 'Security group for RDS MySQL database',
      allowAllOutbound: false
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
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
    const launchTemplate = new ec2.LaunchTemplate(this, 'synth-trainr165-launch-template', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      userData: userData,
      role: ec2Role,
      detailedMonitoring: true
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'synth-trainr165-asg', {
      vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      healthCheckType: autoscaling.HealthCheckType.ELB,
      healthCheckGracePeriod: cdk.Duration.minutes(5),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdatePolicy({
        minInstancesInService: 1
      })
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'synth-trainr165-alb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    // Target group for ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'synth-trainr165-target-group', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheckPath: '/',
      healthCheckIntervalPeriod: cdk.Duration.seconds(30),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3
    });

    // ALB Listener
    alb.addListener('synth-trainr165-listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup])
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'synth-trainr165-db-subnet-group', {
      vpc,
      description: 'Subnet group for RDS MySQL database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }
    });

    // RDS MySQL Database with Multi-AZ
    const database = new rds.DatabaseInstance(this, 'synth-trainr165-database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'synth-trainr165-db-credentials'
      }),
      databaseName: 'webappdb',
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT
    });

    // CloudWatch Log Group for application logs
    const logGroup = new logs.LogGroup(this, 'synth-trainr165-log-group', {
      logGroupName: '/aws/ec2/synth-trainr165',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'synth-trainr165-dashboard', {
      dashboardName: 'synth-trainr165-webapp-dashboard'
    });

    // ALB metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metricRequestCount()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [alb.metricTargetResponseTime()],
        width: 12
      })
    );

    // Auto Scaling Group metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Auto Scaling Group Instance Count',
        left: [autoScalingGroup.metricGroupDesiredCapacity(), autoScalingGroup.metricGroupInServiceInstances()],
        width: 12
      })
    );

    // RDS metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [database.metricCPUUtilization()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [database.metricDatabaseConnections()],
        width: 12
      })
    );

    // CloudWatch Alarms
    const highCpuAlarm = new cloudwatch.Alarm(this, 'synth-trainr165-high-cpu-alarm', {
      metric: autoScalingGroup.metricCPUUtilization(),
      threshold: 75,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High CPU utilization alarm for Auto Scaling Group'
    });

    const rdsHighCpuAlarm = new cloudwatch.Alarm(this, 'synth-trainr165-rds-high-cpu-alarm', {
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High CPU utilization alarm for RDS database'
    });

    // Scaling policies
    const scaleUpPolicy = autoScalingGroup.scaleOnMetric('synth-trainr165-scale-up', {
      metric: autoScalingGroup.metricCPUUtilization(),
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 50, change: +1 },
        { lower: 70, change: +2 }
      ]
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer'
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint'
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticContentBucket.bucketName,
      description: 'S3 bucket for static content'
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID'
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL'
    });
  }
}
```

This infrastructure creates a highly available web application with:

1. **VPC**: Custom VPC with 3 subnets across different AZs (public, private, isolated)
2. **Auto Scaling**: ASG with minimum 2 instances, maximum 6, with health checks
3. **Load Balancer**: Application Load Balancer distributing traffic across instances
4. **Database**: RDS MySQL with Multi-AZ deployment for high availability
5. **IAM Roles**: EC2 instances have S3 access permissions
6. **Tagging**: All resources tagged with Environment: Production
7. **Monitoring**: CloudWatch logging, metrics, alarms, and dashboard

The code follows AWS best practices with proper security groups, monitoring, and scaling policies.