import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ProjectXInfrastructureStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

/**
 * ProjectX Infrastructure Stack
 *
 * This stack creates a highly available, scalable infrastructure with:
 * - VPC with public subnets across multiple AZs
 * - Auto Scaling Group with EC2 instances distributed across AZs
 * - Internet Gateway for public access
 * - Security Groups following AWS best practices
 *
 * All resources follow the naming convention: projectX-<component>
 */
export class ProjectXInfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: ProjectXInfrastructureStackProps
  ) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2', // Explicitly set region as required
        account: props?.env?.account,
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 1. VPC Configuration
    // Create VPC with public subnets in multiple AZs for high availability
    const vpc = new ec2.Vpc(this, 'ProjectXVpc', {
      vpcName: 'projectX-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3, // Use up to 3 AZs for maximum availability
      natGateways: 0, // No NAT gateways needed for public subnets only
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'projectX-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      // Enable DNS hostname and resolution for proper EC2 connectivity
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag the VPC for better resource management
    cdk.Tags.of(vpc).add('Name', 'projectX-vpc');
    cdk.Tags.of(vpc).add('Project', 'ProjectX');
    cdk.Tags.of(vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(vpc).add('ManagedBy', 'CDK');

    // 2. Security Group Configuration
    // Create security group for EC2 instances with HTTP/HTTPS access
    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'ProjectXWebServerSG',
      {
        vpc,
        securityGroupName: 'projectX-web-server-sg',
        description:
          'Security group for ProjectX web servers allowing HTTP/HTTPS traffic',
        allowAllOutbound: true, // Allow outbound traffic for updates and external API calls
      }
    );

    // Allow HTTP traffic (port 80) from anywhere
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Allow HTTPS traffic (port 443) from anywhere
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Allow SSH access for administration (restrict to office network only)
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'), // Office network CIDR - replace with actual office IP range
      ec2.Port.tcp(22),
      'Allow SSH from office network only'
    );

    // Tag the security group
    cdk.Tags.of(webServerSecurityGroup).add('Name', 'projectX-web-server-sg');
    cdk.Tags.of(webServerSecurityGroup).add('Project', 'ProjectX');
    cdk.Tags.of(webServerSecurityGroup).add('Environment', environmentSuffix);

    // 3. IAM Role for EC2 Instances
    // Create IAM role with necessary permissions for EC2 instances
    const ec2Role = new iam.Role(this, 'ProjectXEC2Role', {
      roleName: 'projectX-ec2-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for ProjectX EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ), // For CloudWatch monitoring
      ],
    });

    // Create instance profile for the role (used by launch template)
    new iam.CfnInstanceProfile(this, 'ProjectXInstanceProfile', {
      instanceProfileName: 'projectX-instance-profile',
      roles: [ec2Role.roleName],
    });

    // 4. Launch Template Configuration
    // Create launch template for consistent EC2 instance configuration
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'ProjectXLaunchTemplate',
      {
        launchTemplateName: 'projectX-launch-template',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: webServerSecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
        // Enable detailed monitoring for better scaling decisions
        detailedMonitoring: true,
        // Enable EBS encryption for data security
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              deleteOnTermination: true,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    // Add user data script to install and configure web server
    launchTemplate.userData!.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>ProjectX Web Server - Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',
      'echo "<p>Region: us-west-2</p>" >> /var/www/html/index.html'
    );

    // 5. Auto Scaling Group Configuration
    // Create Auto Scaling Group with instances distributed across multiple AZs
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'ProjectXAutoScalingGroup',
      {
        autoScalingGroupName: 'projectX-asg',
        vpc,
        launchTemplate,
        minCapacity: 2, // Minimum 2 instances as required
        maxCapacity: 6, // Allow scaling up to 6 instances
        desiredCapacity: 2, // Start with 2 instances
        // Distribute instances across all available subnets (AZs)
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        // Health check configuration using newer API
        healthChecks: autoscaling.HealthChecks.ec2(),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Add scaling policies for dynamic scaling based on CPU utilization
    autoScalingGroup.scaleOnCpuUtilization('ProjectXScaleUp', {
      targetUtilizationPercent: 70,
    });

    // 6. CloudWatch Alarms for comprehensive monitoring
    // Auto Scaling Group Alarms
    new cloudwatch.Alarm(this, 'ProjectX-ASG-CPUUtilizationAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'ProjectX Auto Scaling Group CPU utilization is high',
    });

    new cloudwatch.Alarm(this, 'ProjectX-ASG-InstanceCountAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupDesiredCapacity',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 4,
      evaluationPeriods: 2,
      alarmDescription: 'ProjectX Auto Scaling Group instance count is high',
    });

    new cloudwatch.Alarm(this, 'ProjectX-ASG-HealthyHostCountAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupInServiceInstances',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      alarmDescription: 'ProjectX Auto Scaling Group healthy host count is low',
    });

    // Tag the Auto Scaling Group
    cdk.Tags.of(autoScalingGroup).add('Name', 'projectX-asg');
    cdk.Tags.of(autoScalingGroup).add('Project', 'ProjectX');
    cdk.Tags.of(autoScalingGroup).add('Environment', environmentSuffix);

    // 7. Outputs
    // Provide useful outputs for reference and integration
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for ProjectX infrastructure',
      exportName: `ProjectX-VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
      exportName: `ProjectX-VpcCidr-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs across multiple AZs',
      exportName: `ProjectX-PublicSubnetIds-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: webServerSecurityGroup.securityGroupId,
      description: 'Security Group ID for web servers',
      exportName: `ProjectX-SecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `ProjectX-AutoScalingGroupName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: vpc.availabilityZones.join(','),
      description: 'Availability Zones used by the infrastructure',
      exportName: `ProjectX-AvailabilityZones-${environmentSuffix}`,
    });
  }
}
