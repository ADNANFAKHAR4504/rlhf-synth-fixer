import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `WebAppVPC-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 1,
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
        },
      ],
    });

    // Create Systems Manager parameters for secure configuration
    const appVersionParam = new ssm.StringParameter(this, `AppVersion-${environmentSuffix}`, {
      parameterName: `/webapp/${environmentSuffix}/app-version`,
      stringValue: '1.0.0',
      description: 'Application version for the web application',
    });

    const dbConnectionParam = new ssm.StringParameter(this, `DatabaseConfig-${environmentSuffix}`, {
      parameterName: `/webapp/${environmentSuffix}/database-config`,
      stringValue: 'placeholder-connection-string',
      description: 'Database connection configuration',
    });

    // Security Group for Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, `ALBSecurityGroup-${environmentSuffix}`, {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `EC2SecurityGroup-${environmentSuffix}`, {
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
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access for maintenance'
    );

    // Add egress rules for ALB to communicate with EC2 instances
    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic to EC2 instances'
    );

    // IAM Role for EC2 instances to access SSM parameters
    const ec2Role = new iam.Role(this, `EC2Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Grant permissions to read SSM parameters
    appVersionParam.grantRead(ec2Role);
    dbConnectionParam.grantRead(ec2Role);

    // Use a specific AMI ID for us-east-1 to avoid DescribeImages permission requirement
    const amazonLinux = ec2.MachineImage.genericLinux({
      'us-east-1': 'ami-0e95a5e2743ec9ec9', // Amazon Linux 2 AMI
      'us-west-2': 'ami-05c3dc660cb6907f0', // Fallback for other regions
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server - $(hostname -f)</h1>" > /var/www/html/index.html',
      'echo "<p>Environment: ' + environmentSuffix + '</p>" >> /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, `WebAppLaunchTemplate-${environmentSuffix}`, {
      machineImage: amazonLinux,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      userData,
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      detailedMonitoring: true,
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, `WebAppASG-${environmentSuffix}`, {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Health check configuration  
      // Use EC2 health checks - ELB health check will be configured via target group attachment
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `WebAppALB-${environmentSuffix}`, {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Target Group for the Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `WebAppTargetGroup-${environmentSuffix}`, {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 5,
      },
    });

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // HTTP Listener
    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // HTTPS Listener disabled - requires SSL certificate
    // const httpsListener = alb.addListener('HTTPSListener', {
    //   port: 443,
    //   protocol: elbv2.ApplicationProtocol.HTTPS,
    //   certificates: [], // Need actual certificate ARN here
    //   defaultAction: elbv2.ListenerAction.redirect({
    //     protocol: elbv2.ApplicationProtocol.HTTP,
    //     port: '80',
    //   }),
    // });

    // Auto Scaling Policies
    const scaleUpPolicy = autoScalingGroup.scaleOnCpuUtilization('ScaleUpPolicy', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    const scaleDownPolicy = autoScalingGroup.scaleOnRequestCount('ScaleOnRequestCount', {
      targetRequestsPerMinute: 1000,
    });

    // CloudWatch Alarms for monitoring
    const highCpuAlarm = new cloudwatch.Alarm(this, `HighCPUAlarm-${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Global Accelerator disabled for cost optimization
    // const accelerator = new Accelerator(this, `WebAppAccelerator-${environmentSuffix}`, {
    //   acceleratorName: `webapp-accelerator-${environmentSuffix}`,
    //   ipAddressType: IpAddressType.IPV4,
    //   enabled: true,
    // });

    // const listener = accelerator.addListener('Listener', {
    //   listenerName: 'webapp-listener',
    //   protocol: GaProtocol.TCP,
    //   portRanges: [
    //     {
    //       fromPort: 80,
    //       toPort: 80,
    //     },
    //   ],
    // });

    // listener.addEndpointGroup('EndpointGroup', {
    //   region: this.region,
    //   endpoints: [
    //     {
    //       endpointId: alb.loadBalancerArn,
    //       weight: 100,
    //     },
    //   ],
    // });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer URL',
    });

    // new cdk.CfnOutput(this, 'GlobalAcceleratorURL', {
    //   value: `http://${accelerator.dnsName}`,
    //   description: 'Global Accelerator URL for improved performance',
    // });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    // Output SSM parameter names for testing
    new cdk.CfnOutput(this, 'AppVersionParameterName', {
      value: appVersionParam.parameterName,
      description: 'SSM Parameter name for app version',
    });

    new cdk.CfnOutput(this, 'DatabaseConfigParameterName', {
      value: dbConnectionParam.parameterName,
      description: 'SSM Parameter name for database config',
    });

    // Output Target Group ARN for testing
    new cdk.CfnOutput(this, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'Target Group ARN',
    });

    // Output ALB DNS Name (without protocol for flexibility)
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    // Tags for resources
    cdk.Tags.of(this).add('Project', 'WebApplication');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
  }
}

export { TapStack };
