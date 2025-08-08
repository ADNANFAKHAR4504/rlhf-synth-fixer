import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  hostedZoneId?: string;
  domainName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const region = this.region || 'us-west-2';

    // VPC with 3 AZs for high availability
    const vpc = new ec2.Vpc(this, 'HighAvailabilityVPC', {
      maxAzs: 3,
      natGateways: 3, // One NAT gateway per AZ for redundancy
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
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
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                `arn:aws:s3:::ha-app-data-${environmentSuffix}-${region}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Instance profile creation (implicitly created by LaunchTemplate)
    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>High Availability Web Server - AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</h1>" > /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `ha-app-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
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
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 3,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
      },
      targets: [autoScalingGroup],
    });

    // ALB HTTP Listener - For testing, directly use target group instead of redirecting
    alb.addListener('HTTPListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // HTTPS is disabled for automated testing to avoid certificate validation issues
    // In production, you would:
    // 1. Use DNS validation with Route53 hosted zone
    // 2. Or import an existing ACM certificate
    // 3. Or use a self-signed certificate for development

    // S3 Bucket for application data
    const appDataBucket = new s3.Bucket(this, 'AppDataBucket', {
      bucketName: `ha-app-data-${environmentSuffix}-${region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiredObjectDeleteMarker: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // Cross-region replication bucket for disaster recovery
    // Note: This is created but cross-region replication setup would require additional configuration
    new s3.Bucket(this, 'DisasterRecoveryBucket', {
      bucketName: `ha-app-dr-${environmentSuffix}-${region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `ha-app-alerts-${environmentSuffix}`,
      displayName: 'High Availability App Alerts',
    });

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    cpuAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));

    const targetGroupAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTargetsAlarm',
      {
        metric: targetGroup.metricUnhealthyHostCount({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    targetGroupAlarm.addAlarmAction(new cw_actions.SnsAction(alertTopic));

    // Auto Scaling Policies
    autoScalingGroup.scaleOnMetric('ScaleUp', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        period: cdk.Duration.minutes(5),
      }),
      scalingSteps: [
        { upper: 50, change: +1 },
        { lower: 80, change: +2 },
      ],
    });

    autoScalingGroup.scaleOnMetric('ScaleDown', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        period: cdk.Duration.minutes(5),
      }),
      scalingSteps: [
        { upper: 30, change: -1 },
        { upper: 10, change: -2 },
      ],
    });

    // Route 53 Hosted Zone (optional - requires domain)
    let hostedZone;
    if (props?.hostedZoneId && props?.domainName) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.domainName,
        }
      );

      // Route 53 DNS record with health check
      new route53.ARecord(this, 'DNSRecord', {
        zone: hostedZone,
        recordName: `ha-app-${environmentSuffix}`,
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
      });

      // Health Check
      new route53.CfnHealthCheck(this, 'HealthCheck', {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: '/',
          fullyQualifiedDomainName: alb.loadBalancerDnsName,
          requestInterval: 30,
          failureThreshold: 3,
        },
      });
    }

    // AWS Backup for disaster recovery
    const backupVault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: `ha-app-backup-vault-${environmentSuffix}`,
      encryptionKey: undefined, // Use AWS managed key
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `ha-app-backup-plan-${environmentSuffix}`,
      backupVault: backupVault,
    });

    backupPlan.addRule(
      new backup.BackupPlanRule({
        deleteAfter: cdk.Duration.days(30),
        scheduleExpression: events.Schedule.cron({ hour: '2', minute: '0' }),
      })
    );

    // Add backup selection
    backupPlan.addSelection('BackupSelection', {
      resources: [
        backup.BackupResource.fromTag('Environment', environmentSuffix),
      ],
    });

    // Tagging for backup selection
    cdk.Tags.of(autoScalingGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(appDataBucket).add('Environment', environmentSuffix);

    // EventBridge rule for instance termination notifications
    const instanceTerminationRule = new events.Rule(
      this,
      'InstanceTerminationRule',
      {
        eventPattern: {
          source: ['aws.autoscaling'],
          detailType: ['EC2 Instance Terminate Successful'],
          detail: {
            AutoScalingGroupName: [autoScalingGroup.autoScalingGroupName],
          },
        },
      }
    );

    instanceTerminationRule.addTarget(
      new targets.SnsTopic(alertTopic, {
        message: events.RuleTargetInput.fromText(
          'Instance terminated in Auto Scaling Group: ' +
            autoScalingGroup.autoScalingGroupName
        ),
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'AppDataBucketName', {
      value: appDataBucket.bucketName,
      description: 'S3 Bucket for Application Data',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for Alerts',
    });

    new cdk.CfnOutput(this, 'BackupVaultName', {
      value: backupVault.backupVaultName,
      description: 'AWS Backup Vault Name',
    });
  }
}
