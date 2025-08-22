import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix = this.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // VPC with security-focused configuration
    const vpc = new ec2.Vpc(this, 'SecureWebVpc', {
      vpcName: `tap-${environmentSuffix}-vpc`,
      maxAzs: 3,
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ],
      // Enable VPC Flow Logs for security monitoring
      flowLogs: {
        'VpcFlowLog': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        }
      }
    });

    // Security Group for ALB - allows inbound HTTP/HTTPS from internet
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: vpc,
      securityGroupName: `tap-${environmentSuffix}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
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

    // Add egress rule for ALB to communicate with targets
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP traffic to targets'
    );

    // Security Group for EC2 instances - allows traffic only from ALB
    const webServerSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc: vpc,
      securityGroupName: `tap-${environmentSuffix}-web-sg`,
      description: 'Security group for web server instances',
      allowAllOutbound: true, // Allow outbound for package updates
    });

    webServerSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Application Load Balancer in public subnets
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebApplicationLoadBalancer', {
      vpc: vpc,
      loadBalancerName: `tap-${environmentSuffix}-alb`,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      // Ensure ALB is destroyable
      deletionProtection: false,
    });

    // Latest Amazon Linux AMI
    const amiId = ec2.MachineImage.latestAmazonLinux2023({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      edition: ec2.AmazonLinuxEdition.STANDARD,
      virtualization: ec2.AmazonLinuxVirt.HVM,
      storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // IAM Role for EC2 instances with minimal permissions
    const ec2Role = new iam.Role(this, 'WebServerRole', {
      roleName: `tap-${environmentSuffix}-web-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Secure Web Application - ${environmentSuffix}</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>AZ: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p><p>Environment: ${environmentSuffix}</p>" > /var/www/html/index.html`,
      'chkconfig httpd on'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebServerLaunchTemplate', {
      launchTemplateName: `tap-${environmentSuffix}-lt`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amiId,
      securityGroup: webServerSecurityGroup,
      role: ec2Role,
      userData: userData,
      // Enable detailed monitoring for better scaling metrics
      detailedMonitoring: true,
      // Use IMDSv2 for enhanced security
      requireImdsv2: true,
    });

    // Auto Scaling Group in private subnets for security
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebServerAutoScalingGroup', {
      vpc: vpc,
      autoScalingGroupName: `tap-${environmentSuffix}-asg`,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Enable CloudWatch detailed monitoring
      groupMetrics: [autoscaling.GroupMetrics.all()],
      // Ensure instances are replaced when terminated
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
      // Health check settings
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.seconds(300),
      }),
    });

    // Target Group for the Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WebServerTargetGroup', {
      vpc: vpc,
      targetGroupName: `tap-${environmentSuffix}-tg`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      targets: [autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2,
      },
      // Deregistration delay for graceful instance termination
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ALB Listener
    const listener = alb.addListener('WebServerListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Add scaling policies for auto scaling
    autoScalingGroup.scaleOnCpuUtilization('CpuScalingPolicy', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    // Add request count based scaling
    autoScalingGroup.scaleOnRequestCount('RequestCountScalingPolicy', {
      targetRequestsPerMinute: 1000,
      targetGroup: targetGroup,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    // Apply consistent tags for security and cost management
    cdk.Tags.of(this).add('Project', 'SecureWebApplication');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Infrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);

    // Outputs for reference and integration testing
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `tap-${environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
      exportName: `tap-${environmentSuffix}-alb-arn`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `tap-${environmentSuffix}-asg-name`,
    });

    new cdk.CfnOutput(this, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'Target Group ARN',
      exportName: `tap-${environmentSuffix}-tg-arn`,
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `tap-${environmentSuffix}-alb-sg-id`,
    });

    new cdk.CfnOutput(this, 'WebServerSecurityGroupId', {
      value: webServerSecurityGroup.securityGroupId,
      description: 'Web Server Security Group ID',
      exportName: `tap-${environmentSuffix}-web-sg-id`,
    });

    new cdk.CfnOutput(this, 'LaunchTemplateId', {
      value: launchTemplate.launchTemplateId || 'N/A',
      description: 'Launch Template ID',
      exportName: `tap-${environmentSuffix}-lt-id`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment Suffix used for resource naming',
      exportName: `tap-${environmentSuffix}-env-suffix`,
    });
  }
}