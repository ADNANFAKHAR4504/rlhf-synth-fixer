import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

// LocalStack detection - use environment variable or context
// For LocalStack, set LOCALSTACK=true before synth/deploy
const isLocalStack =
  process.env.LOCALSTACK === 'true' ||
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

export interface TapStackProps extends cdk.StackProps {
  readonly environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix ?? 'dev';
    const stackName = 'TapStack';

    // VPC with Multi-AZ setup (simplified for LocalStack)
    const vpc = new ec2.Vpc(this, `${stackName}-${environmentSuffix}-VPC`, {
      cidr: '10.0.0.0/16',
      maxAzs: isLocalStack ? 2 : 3,
      natGateways: isLocalStack ? 0 : 3, // LocalStack: no NAT Gateway (not supported reliably)
      subnetConfiguration: isLocalStack
        ? [
            // LocalStack: simplified networking - public and isolated subnets only
            {
              cidrMask: 24,
              name: `${stackName}-${environmentSuffix}-PublicSubnet`,
              subnetType: ec2.SubnetType.PUBLIC,
            },
            {
              cidrMask: 24,
              name: `${stackName}-${environmentSuffix}-DatabaseSubnet`,
              subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
          ]
        : [
            // Production: full 3-tier architecture
            {
              cidrMask: 24,
              name: `${stackName}-${environmentSuffix}-PublicSubnet`,
              subnetType: ec2.SubnetType.PUBLIC,
            },
            {
              cidrMask: 24,
              name: `${stackName}-${environmentSuffix}-PrivateSubnet`,
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            {
              cidrMask: 24,
              name: `${stackName}-${environmentSuffix}-DatabaseSubnet`,
              subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
          ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${stackName}-${environmentSuffix}-ALB-SG`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${stackName}-${environmentSuffix}-EC2-SG`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `${stackName}-${environmentSuffix}-DB-SG`,
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    databaseSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(
      this,
      `${stackName}-${environmentSuffix}-EC2-Role`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
        ],
      }
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${stackName}-${environmentSuffix}-LaunchTemplate`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.custom(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>High Availability Web Application - AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm`),
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `${stackName}-${environmentSuffix}-ASG`,
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          // LocalStack: use public subnets (no NAT Gateway support)
          subnetType: isLocalStack
            ? ec2.SubnetType.PUBLIC
            : ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    // Auto Scaling Policies
    // Target tracking scaling policy for CPU utilization
    // This policy will handle both scale-out (at 70%) and scale-in (at 30%)
    new autoscaling.TargetTrackingScalingPolicy(
      this,
      `${stackName}-${environmentSuffix}-TargetTracking`,
      {
        autoScalingGroup,
        targetValue: 70,
        predefinedMetric:
          autoscaling.PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
      }
    );

    // Additional step scaling for more aggressive scale-in when CPU is very low
    const scaleInMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.seconds(300),
    });

    autoScalingGroup.scaleOnMetric(
      `${stackName}-${environmentSuffix}-StepScaling`,
      {
        metric: scaleInMetric,
        scalingSteps: [
          { upper: 30, change: -1 },
          { lower: 30, upper: 70, change: 0 },
          { lower: 70, change: 1 },
        ],
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        cooldown: cdk.Duration.seconds(300),
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${stackName}-${environmentSuffix}-ALB`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${stackName}-${environmentSuffix}-TargetGroup`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(5),
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    // ALB Listener
    alb.addListener(`${stackName}-${environmentSuffix}-Listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // WAF and CloudFront are Pro-only in LocalStack - skip for LocalStack
    // In production, these would provide additional security and CDN capabilities

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `${stackName}-${environmentSuffix}-DBSubnetGroup`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // RDS Parameter Group
    const parameterGroup = new rds.ParameterGroup(
      this,
      `${stackName}-${environmentSuffix}-DBParameterGroup`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_39,
        }),
        description: 'Parameter group for MySQL 8.0',
      }
    );

    // RDS Instance with Multi-AZ (simplified for LocalStack)
    const database = new rds.DatabaseInstance(
      this,
      `${stackName}-${environmentSuffix}-Database`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_39,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [databaseSecurityGroup],
        multiAz: isLocalStack ? false : true, // LocalStack: single-AZ for simplicity
        storageEncrypted: isLocalStack ? false : true, // LocalStack: disable encryption
        backupRetention: isLocalStack
          ? cdk.Duration.days(1)
          : cdk.Duration.days(7),
        deletionProtection: false,
        parameterGroup,
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `${stackName}-${environmentSuffix}-db-credentials`,
        }),
        allocatedStorage: 20,
        maxAllocatedStorage: isLocalStack ? 20 : 100, // LocalStack: disable auto-scaling storage
        enablePerformanceInsights: false,
        removalPolicy: isLocalStack
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
      }
    );

    // Read Replica - Skip for LocalStack (Pro-only feature)
    let readReplica: rds.DatabaseInstanceReadReplica | undefined;
    if (!isLocalStack) {
      readReplica = new rds.DatabaseInstanceReadReplica(
        this,
        `${stackName}-${environmentSuffix}-ReadReplica`,
        {
          sourceDatabaseInstance: database,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.SMALL
          ),
          vpc,
          securityGroups: [databaseSecurityGroup],
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
      );
    }

    // SNS Topic for Alerts
    const alertTopic = new sns.Topic(
      this,
      `${stackName}-${environmentSuffix}-AlertTopic`,
      {
        displayName: 'High Availability Alerts',
      }
    );

    // CloudWatch Alarms
    const highCpuAlarm = new cloudwatch.Alarm(
      this,
      `${stackName}-${environmentSuffix}-HighCPUAlarm`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
          statistic: 'Average',
          period: cdk.Duration.seconds(300),
        }),
        threshold: 80,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    highCpuAlarm.addAlarmAction(new cloudwatchactions.SnsAction(alertTopic));

    const databaseConnectionsAlarm = new cloudwatch.Alarm(
      this,
      `${stackName}-${environmentSuffix}-DBConnectionsAlarm`,
      {
        metric: database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    databaseConnectionsAlarm.addAlarmAction(
      new cloudwatchactions.SnsAction(alertTopic)
    );

    const albTargetResponseTimeAlarm = new cloudwatch.Alarm(
      this,
      `${stackName}-${environmentSuffix}-ALBResponseTimeAlarm`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'TargetResponseTime',
          dimensionsMap: {
            LoadBalancer: alb.loadBalancerFullName,
          },
          statistic: 'Average',
          period: cdk.Duration.seconds(300),
        }),
        threshold: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    albTargetResponseTimeAlarm.addAlarmAction(
      new cloudwatchactions.SnsAction(alertTopic)
    );

    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      `${stackName}-${environmentSuffix}-UnhealthyHostAlarm`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'UnHealthyHostCount',
          dimensionsMap: {
            TargetGroup: targetGroup.targetGroupFullName,
            LoadBalancer: alb.loadBalancerFullName,
          },
          statistic: 'Average',
          period: cdk.Duration.seconds(300),
        }),
        threshold: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    unhealthyHostAlarm.addAlarmAction(
      new cloudwatchactions.SnsAction(alertTopic)
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `${stackName}-${environmentSuffix}-Dashboard`,
      {
        dashboardName: `${stackName}-${environmentSuffix}-HighAvailability`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
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
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [database.metricDatabaseConnections()],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    // CloudFront and Read Replica outputs only for non-LocalStack
    if (!isLocalStack && readReplica) {
      new cdk.CfnOutput(this, 'ReadReplicaEndpoint', {
        value: readReplica.instanceEndpoint.hostname,
        description: 'RDS read replica endpoint',
      });
    }

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
    });
  }
}
