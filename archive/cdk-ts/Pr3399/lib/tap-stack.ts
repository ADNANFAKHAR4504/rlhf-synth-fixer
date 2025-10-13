import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ==========================================
    // 1. NETWORKING LAYER - VPC Configuration
    // ==========================================

    // Create VPC with specific CIDR block in us-east-1
    const vpc = new ec2.Vpc(this, 'BookstoreVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.8.0.0/16'),
      maxAzs: 2, // Use 2 AZs for high availability
      natGateways: 0, // No NAT gateways needed for public subnets only
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'BookstorePublic',
          subnetType: ec2.SubnetType.PUBLIC,
          // Ensures subnets get 10.8.1.0/24 and 10.8.2.0/24
        },
      ],
      vpcName: `bookstore-vpc-${environmentSuffix}`,
    });

    // Tag VPC and subnets for better identification
    cdk.Tags.of(vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(vpc).add('Application', 'OnlineBookstore');

    // ==========================================
    // 2. SECURITY GROUPS - Network Security
    // ==========================================

    // Security Group for Application Load Balancer
    // ALLOWS: Inbound HTTP (80) and HTTPS (443) from Internet
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      securityGroupName: `bookstore-alb-sg-${environmentSuffix}`,
      allowAllOutbound: true,
    });

    // Allow inbound HTTP traffic from anywhere
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from Internet'
    );

    // Allow inbound HTTPS traffic from anywhere
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from Internet'
    );

    // Security Group for EC2 Instances
    // ALLOWS: Inbound HTTP (80) ONLY from ALB Security Group
    const instanceSecurityGroup = new ec2.SecurityGroup(
      this,
      'InstanceSecurityGroup',
      {
        vpc,
        description:
          'Security group for EC2 instances - allows traffic only from ALB',
        securityGroupName: `bookstore-instance-sg-${environmentSuffix}`,
        allowAllOutbound: true, // Allows instances to download packages, connect to S3, etc.
      }
    );

    // CRITICAL CONNECTION: Only allow traffic from ALB security group
    instanceSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic only from ALB'
    );

    // ==========================================
    // 3. IAM ROLE - EC2 Instance Permissions
    // ==========================================

    // Create IAM role for EC2 instances with S3 access
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for bookstore EC2 instances',
      roleName: `bookstore-ec2-role-${environmentSuffix}`,
      managedPolicies: [
        // Add SSM for potential remote management
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        // Add CloudWatch for metrics and logs
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // ==========================================
    // 4. COMPUTE LAYER - EC2 & Auto Scaling
    // ==========================================

    // User Data script to install and configure Nginx
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'amazon-linux-extras install nginx1 -y',
      'systemctl start nginx',
      'systemctl enable nginx',
      // Create a custom index page
      'echo "<h1>Welcome to the Online Bookstore</h1>" > /usr/share/nginx/html/index.html',
      'echo "<p>Instance ID: $(ec2-metadata --instance-id | cut -d \" \" -f 2)</p>" >> /usr/share/nginx/html/index.html',
      'echo "<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d \" \" -f 2)</p>" >> /usr/share/nginx/html/index.html',
      // Configure Nginx to log real client IPs from ALB
      "sed -i 's/listen       80;/listen       80;\\n        real_ip_header X-Forwarded-For;\\n        set_real_ip_from 10.8.0.0\\/16;/' /etc/nginx/nginx.conf",
      'systemctl restart nginx'
    );

    // Create Auto Scaling Group with EC2 instances
    const asg = new autoscaling.AutoScalingGroup(this, 'BookstoreASG', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Deploy in public subnets
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData: userData,
      role: instanceRole,
      securityGroup: instanceSecurityGroup,
      minCapacity: 1, // Minimum 1 instance to reduce vCPU usage
      maxCapacity: 3, // Allow scaling up to 3 instances (6 vCPUs max)
      desiredCapacity: 1, // Start with 1 instance (2 vCPUs)
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5), // Give instances time to start
      }),
      autoScalingGroupName: `bookstore-asg-${environmentSuffix}`,
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(), // Enable rolling updates
    });

    // Add tags to instances
    cdk.Tags.of(asg).add('Name', 'BookstoreWebServer');
    cdk.Tags.of(asg).add('Environment', environmentSuffix);

    // ==========================================
    // 5. LOAD BALANCING - Application Load Balancer
    // ==========================================

    // Create Application Load Balancer in public subnets
    const alb = new elbv2.ApplicationLoadBalancer(this, 'BookstoreALB', {
      vpc,
      internetFacing: true, // Public-facing load balancer
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Deploy in public subnets
      },
      loadBalancerName: `bookstore-alb-${environmentSuffix}`,
      idleTimeout: cdk.Duration.seconds(60),
      http2Enabled: true, // Enable HTTP/2 for better performance
    });

    // Create target group for the Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BookstoreTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(5),
          interval: cdk.Duration.seconds(30),
          healthyHttpCodes: '200',
        },
        targetGroupName: `bookstore-targets-${environmentSuffix}`,
        stickinessCookieDuration: cdk.Duration.hours(1), // Enable session stickiness
        deregistrationDelay: cdk.Duration.seconds(30), // Faster instance replacement
      }
    );

    // CRUCIAL CONNECTION: Register ASG with the Target Group
    asg.attachToApplicationTargetGroup(targetGroup);

    // Add HTTP listener to ALB
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // Add HTTPS listener (placeholder - requires certificate)
    alb.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTP, // Using HTTP for demo, should be HTTPS with certificate
      defaultAction: elbv2.ListenerAction.redirect({
        port: '80',
        protocol: 'HTTP',
      }),
    });

    // ==========================================
    // 6. STORAGE LAYER - S3 Bucket
    // ==========================================

    // Create S3 bucket for application assets with versioning
    // Generate a unique suffix to avoid bucket name conflicts
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const assetsBucket = new s3.Bucket(this, 'BookstoreAssetsBucket', {
      bucketName: `bookstore-assets-${this.region}-${environmentSuffix}-${uniqueSuffix}`,
      versioned: true, // MANDATORY: Enable versioning for data durability
      encryption: s3.BucketEncryption.S3_MANAGED, // Enable server-side encryption
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Security best practice
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack is deleted
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90), // Clean up old versions after 90 days
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: [`http://${alb.loadBalancerDnsName}`],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Grant read access to EC2 instances for serving static content
    assetsBucket.grantRead(instanceRole);

    // Add tags to S3 bucket
    cdk.Tags.of(assetsBucket).add('Environment', environmentSuffix);
    cdk.Tags.of(assetsBucket).add('Application', 'OnlineBookstore');
    cdk.Tags.of(assetsBucket).add('Purpose', 'ApplicationAssets');

    // ==========================================
    // 7. MONITORING - CloudWatch Alarms
    // ==========================================

    // Create CloudWatch Alarm for CPU Utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        period: cdk.Duration.minutes(5), // 5-minute periods
      }),
      alarmName: `bookstore-high-cpu-${environmentSuffix}`,
      alarmDescription: 'Alarm when average CPU exceeds 80% for 15 minutes',
      threshold: 80, // Trigger at 80% CPU utilization
      evaluationPeriods: 3, // Must breach threshold for 3 consecutive periods
      datapointsToAlarm: 3, // All 3 datapoints must breach (15 minutes total)
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    });

    // Auto Scaling based on CPU utilization
    asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70, // Target 70% CPU utilization
      cooldown: cdk.Duration.minutes(5),
      estimatedInstanceWarmup: cdk.Duration.minutes(5),
    });

    // Additional scaling policy based on ALB request count
    asg.scaleOnRequestCount('RequestCountScaling', {
      targetRequestsPerMinute: 1000, // Scale when requests exceed 1000/minute per instance
      cooldown: cdk.Duration.minutes(3),
    });

    // Additional alarm for ALB target health
    new cloudwatch.Alarm(this, 'UnhealthyTargetsAlarm', {
      metric: targetGroup.metrics.unhealthyHostCount(),
      alarmName: `bookstore-unhealthy-targets-${environmentSuffix}`,
      alarmDescription: 'Alarm when unhealthy targets detected',
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    // Alarm for ALB response time
    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: targetGroup.metrics.targetResponseTime(),
      alarmName: `bookstore-high-response-time-${environmentSuffix}`,
      alarmDescription: 'Alarm when target response time exceeds 2 seconds',
      threshold: 2, // 2 seconds
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Alarm for ALB 5XX errors
    new cloudwatch.Alarm(this, 'High5xxErrorsAlarm', {
      metric: alb.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
        {
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }
      ),
      alarmName: `bookstore-high-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm when 5XX errors exceed threshold',
      threshold: 10, // More than 10 5XX errors in 5 minutes
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // ==========================================
    // 8. OUTPUTS - Stack Information
    // ==========================================

    // Output the ALB DNS name for accessing the application
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `BookstoreALBDNS-${environmentSuffix}`,
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'Name of the S3 bucket for application assets',
      exportName: `BookstoreAssetsBucket-${environmentSuffix}`,
    });

    // Output the CloudWatch alarm name
    new cdk.CfnOutput(this, 'CPUAlarmName', {
      value: cpuAlarm.alarmName,
      description: 'Name of the CPU utilization alarm',
      exportName: `BookstoreCPUAlarm-${environmentSuffix}`,
    });
  }
}
