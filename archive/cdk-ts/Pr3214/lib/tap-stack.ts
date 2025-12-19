import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly staticContentBucket: s3.Bucket;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // VPC Configuration with specified CIDR
    this.vpc = new ec2.Vpc(this, 'CommunityPlatformVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.3.0.0/16'),
      maxAzs: 2,
      natGateways: 0, // Cost optimization - using public subnets only
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // S3 Bucket for static content with Intelligent-Tiering
    this.staticContentBucket = new s3.Bucket(this, 'StaticContentBucket', {
      bucketName: `community-static-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Security Group for web servers
    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebServerSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for web servers',
        allowAllOutbound: true,
      }
    );

    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // IAM Role for EC2 instances
    const webServerRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceConnect'),
      ],
    });

    // Grant S3 bucket access to EC2 instances
    this.staticContentBucket.grantRead(webServerRole);

    // User data script to install Apache
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Community Platform Web Server - Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /var/www/html/index.html',
      '',
      '# Install CloudWatch agent',
      'wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      '',
      '# Configure CloudWatch agent for memory metrics',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      '    "namespace": "CommunityPlatform",',
      '    "metrics_collected": {',
      '      "mem": {',
      '        "measurement": [',
      '          {',
      '            "name": "mem_used_percent",',
      '            "rename": "MemoryUsedPercent"',
      '          }',
      '        ]',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      '',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: webServerSecurityGroup,
        role: webServerRole,
        userData: userData,
        detailedMonitoring: true,
        requireImdsv2: true,
      }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebServerASG',
      {
        vpc: this.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 5,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        healthCheck: autoscaling.HealthCheck.ec2({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    // Auto Scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 60,
      cooldown: cdk.Duration.seconds(300),
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'CommunityPlatformAlerts',
      topicName: `community-platform-alerts-${environmentSuffix}`,
    });

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 80%',
    });

    cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // Memory alarm using custom CloudWatch metric
    const memoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'CommunityPlatform',
        metricName: 'MemoryUsedPercent',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm when memory usage exceeds 80%',
    });

    memoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // CloudWatch Application Insights
    // Note: Temporarily removed to avoid deployment issues with Resource Groups
    // Can be re-enabled once proper Resource Group is created
    // new applicationinsights.CfnApplication(this, 'ApplicationInsights', {
    //   resourceGroupName: `community-platform-${environmentSuffix}`,
    //   autoConfigurationEnabled: true,
    //   cweMonitorEnabled: true,
    //   opsCenterEnabled: true,
    // });

    // EC2 Instance Connect Endpoint for secure browser-based SSH
    // Note: Removed to avoid deployment issues - can be added back if needed
    // new ec2.CfnInstanceConnectEndpoint(this, 'InstanceConnectEndpoint', {
    //   subnetId: this.vpc.publicSubnets[0].subnetId,
    //   securityGroupIds: [webServerSecurityGroup.securityGroupId],
    // });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'StaticContentBucketName', {
      value: this.staticContentBucket.bucketName,
      description: 'S3 Bucket for static content',
      exportName: `${this.stackName}-StaticBucket`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: this.autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `${this.stackName}-ASGName`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `${this.stackName}-AlertTopic`,
    });

    // Tags
    cdk.Tags.of(this).add('Project', 'CommunityPlatform');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
