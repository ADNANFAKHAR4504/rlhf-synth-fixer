import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  webAppSecurityGroup: ec2.ISecurityGroup;
  albSecurityGroup: ec2.ISecurityGroup;
  ec2Role: iam.IRole;
}

export class ComputeStack extends cdk.Stack {
  public readonly applicationLoadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly webAppAutoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly efsFileSystem?: efs.FileSystem; // Made optional
  public readonly webAppLaunchTemplate: ec2.LaunchTemplate;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      vpc,
      webAppSecurityGroup,
      albSecurityGroup,
      ec2Role,
    } = props;

    // Create EFS Security Group
    const efsSecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-efs-sg-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EFS file system',
        allowAllOutbound: true, // Allow outbound for EFS responses
      }
    );

    // Allow NFS traffic from web-app tier
    efsSecurityGroup.addIngressRule(
      webAppSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow NFS from web-app tier'
    );

    // Allow NFS traffic from the same security group (for EFS mount targets)
    efsSecurityGroup.addIngressRule(
      efsSecurityGroup,
      ec2.Port.tcp(2049),
      'Allow NFS from same security group'
    );

    // Create EFS File System for shared storage
    this.efsFileSystem = new efs.FileSystem(
      this,
      `tf-efs-${environmentSuffix}`,
      {
        vpc,
        lifecyclePolicy: efs.LifecyclePolicy.AFTER_30_DAYS,
        performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
        throughputMode: efs.ThroughputMode.BURSTING,
        encrypted: false, // No KMS encryption, using standard encryption
        securityGroup: efsSecurityGroup,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create EFS Access Point
    new efs.AccessPoint(this, `tf-efs-access-point-${environmentSuffix}`, {
      fileSystem: this.efsFileSystem,
      path: '/shared-data',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
    });

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Enhanced web app user data combining web and application functionality
    const webAppUserData = ec2.UserData.forLinux();
    webAppUserData.addCommands(
      '#!/bin/bash',
      'exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1', // Log everything
      'echo "Starting web-app user data script"',

      // Basic system updates and install nginx
      'yum update -y',
      // Try amazon-linux-extras first, then fall back to standard yum
      'if amazon-linux-extras install -y nginx1; then',
      '  echo "nginx installed via amazon-linux-extras"',
      'else',
      '  echo "amazon-linux-extras failed, trying yum install"',
      '  yum install -y nginx',
      'fi',

      // Start and enable nginx
      'systemctl start nginx',
      'systemctl enable nginx',

      // Verify nginx is running
      'if systemctl is-active --quiet nginx; then',
      '  echo "nginx is running successfully"',
      'else',
      '  echo "nginx failed to start, attempting restart"',
      '  systemctl restart nginx',
      'fi',

      // Create a comprehensive web application with health checks
      'cat > /usr/share/nginx/html/index.html << EOF',
      '<html>',
      '<head><title>TapStack Web Application</title></head>',
      '<body>',
      '    <h1>Welcome to TapStack Web Application</h1>',
      '    <p>This is a nginx-based web application running on AWS infrastructure.</p>',
      '    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>',
      '    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>',
      '</body>',
      '</html>',
      'EOF',

      // Create a simple health check page
      'cat > /usr/share/nginx/html/health.html << EOF',
      '<html><body><h1>Healthy</h1></body></html>',
      'EOF',

      // Configure nginx to serve on port 8080 (for ALB health checks)
      'cat > /etc/nginx/conf.d/default.conf << EOF',
      'server {',
      '    listen 8080;',
      '    location / {',
      '        root /usr/share/nginx/html;',
      '        index index.html;',
      '    }',
      '    location /health {',
      '        return 200 "healthy";',
      '        add_header Content-Type text/plain;',
      '    }',
      '}',
      'EOF',

      // Install EFS utilities
      'yum install -y amazon-efs-utils',

      // Create mount point and mount EFS
      'mkdir -p /mnt/efs',
      `echo "${this.efsFileSystem.fileSystemId}.efs.${cdk.Aws.REGION}.amazonaws.com:/ /mnt/efs efs defaults,_netdev" >> /etc/fstab`,
      'mount -a',

      // Create shared directory and set permissions
      'mkdir -p /mnt/efs/shared-data',
      'chown -R nginx:nginx /mnt/efs/shared-data',
      'chmod 755 /mnt/efs/shared-data',

      // Create a symlink in nginx html directory
      'ln -sf /mnt/efs/shared-data /usr/share/nginx/html/shared',

      'systemctl reload nginx',
      'echo "Web-app user data script completed successfully"'
    );

    // Create Launch Template for Web-App Tier
    this.webAppLaunchTemplate = new ec2.LaunchTemplate(
      this,
      `tf-web-app-launch-template-${environmentSuffix}`,
      {
        machineImage: amazonLinuxAmi,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        securityGroup: webAppSecurityGroup,
        role: ec2Role,
        userData: webAppUserData,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
        detailedMonitoring: true,
      }
    );

    // Create Application Load Balancer
    this.applicationLoadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `tf-alb-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        deletionProtection: false,
      }
    );

    // Create Auto Scaling Group for Web-App Tier
    this.webAppAutoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `tf-web-app-asg-${environmentSuffix}`,
      {
        vpc,
        launchTemplate: this.webAppLaunchTemplate,
        autoScalingGroupName: `tf-web-app-asg-${environmentSuffix}`, // Explicit name for cross-stack references
        minCapacity: 1,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(600), // Increased grace period
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Override launch template version for LocalStack compatibility
    // LocalStack doesn't support GetAtt LatestVersionNumber intrinsic function
    const cfnAsg = this.webAppAutoScalingGroup.node
      .defaultChild as autoscaling.CfnAutoScalingGroup;
    cfnAsg.addPropertyOverride('LaunchTemplate', {
      LaunchTemplateId: this.webAppLaunchTemplate.launchTemplateId,
      Version: '$Latest',
    });

    // Create Target Group for Web-App Tier
    const webAppTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `tf-web-app-tg-${environmentSuffix}`,
      {
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(60), // Increased interval
          path: '/health',
          port: '8080',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(30), // Increased timeout
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5, // More tolerant
        },
        targetType: elbv2.TargetType.INSTANCE,
      }
    );

    // Attach ASG to Target Group
    webAppTargetGroup.addTarget(this.webAppAutoScalingGroup);

    // Create ALB Listener
    this.applicationLoadBalancer.addListener(
      `tf-alb-listener-${environmentSuffix}`,
      {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [webAppTargetGroup],
      }
    );

    // Auto Scaling Policies for Web-App Tier
    const webAppCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: this.webAppAutoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    this.webAppAutoScalingGroup.scaleOnMetric(
      `tf-web-app-scale-up-${environmentSuffix}`,
      {
        metric: webAppCpuMetric,
        scalingSteps: [
          { upper: 50, change: +1 },
          { lower: 70, change: +2 },
          { lower: 85, change: +3 },
        ],
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      }
    );

    this.webAppAutoScalingGroup.scaleOnMetric(
      `tf-web-app-scale-down-${environmentSuffix}`,
      {
        metric: webAppCpuMetric,
        scalingSteps: [
          { upper: 30, change: -1 },
          { upper: 20, change: -2 },
        ],
        adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      }
    );

    // Add comprehensive tags
    const tags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      Component: 'Compute',
      CostCenter: 'Infrastructure',
      Compliance: 'SOC2',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, `ALBDnsName-${environmentSuffix}`, {
      value: this.applicationLoadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `tf-alb-dns-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebAppAutoScalingGroupArn-${environmentSuffix}`, {
      value: this.webAppAutoScalingGroup.autoScalingGroupArn,
      description: 'Web-App tier Auto Scaling Group ARN',
      exportName: `tf-web-app-asg-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebAppLaunchTemplateId-${environmentSuffix}`, {
      value: this.webAppLaunchTemplate.launchTemplateId!,
      description: 'Web-App tier Launch Template ID',
      exportName: `tf-web-app-lt-id-${environmentSuffix}`,
    });

    // EFS Output
    new cdk.CfnOutput(this, `EFSFileSystemId-${environmentSuffix}`, {
      value: this.efsFileSystem.fileSystemId,
      description: 'EFS File System ID',
      exportName: `tf-efs-id-${environmentSuffix}`,
    });
  }
}
