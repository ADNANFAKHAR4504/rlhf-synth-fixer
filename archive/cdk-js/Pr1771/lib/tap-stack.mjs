import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_autoscaling as autoscaling } from 'aws-cdk-lib';
import { aws_elasticloadbalancingv2 as elbv2 } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

export class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with public subnets only
    const vpc = new ec2.Vpc(this, `WebAppVpc${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 0, // No NAT gateways to keep costs low
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ]
    });

    // Create Security Group for Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, `ALBSecurityGroup${environmentSuffix}`, {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Create Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `EC2SecurityGroup${environmentSuffix}`, {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Create IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role${environmentSuffix}`, {
      roleName: `tap-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
      ]
    });

    // Create Instance Profile
    const instanceProfile = new iam.InstanceProfile(this, `EC2InstanceProfile${environmentSuffix}`, {
      instanceProfileName: `tap-ec2-profile-${environmentSuffix}`,
      role: ec2Role
    });

    // Get Amazon Linux 2023 AMI for us-west-2
    const amzn2023Ami = ec2.MachineImage.latestAmazonLinux2023({
      architecture: ec2.InstanceArchitecture.X86_64,
    });

    // User data script to install and start Apache web server
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application - Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html'
    );

    // Create Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, `WebAppLaunchTemplate${environmentSuffix}`, {
      launchTemplateName: `tap-launch-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: amzn2023Ami,
      securityGroup: ec2SecurityGroup,
      userData: userData,
      role: ec2Role,
      requireImdsv2: true // Security best practice
    });

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, `WebAppASG${environmentSuffix}`, {
      autoScalingGroupName: `tap-asg-${environmentSuffix}`,
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.seconds(300)
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
        pauseTime: cdk.Duration.minutes(5)
      })
    });

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `WebAppALB${environmentSuffix}`, {
      loadBalancerName: `tap-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      ipAddressType: elbv2.IpAddressType.IPV4 // IPv4 only for now
    });

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `WebAppTargetGroup${environmentSuffix}`, {
      targetGroupName: `tap-tg-${environmentSuffix}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc,
      healthCheckPath: '/',
      healthCheckProtocol: elbv2.Protocol.HTTP,
      healthCheckIntervalDuration: cdk.Duration.seconds(30),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      targets: [autoScalingGroup]
    });

    // Create ALB Listener
    const listener = alb.addListener(`WebAppListener${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup]
    });

    // Add scaling policies
    autoScalingGroup.scaleOnCpuUtilization(`CpuScaling${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5)
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Application', 'WebApp');

    // Output the ALB DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Public DNS name of the Application Load Balancer',
      exportName: `WebAppALBDNS-${environmentSuffix}`
    });

    // Output the ALB URL
    new cdk.CfnOutput(this, 'LoadBalancerURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'URL of the web application',
      exportName: `WebAppURL-${environmentSuffix}`
    });

    // Additional outputs for integration testing
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `WebAppVPCId-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `WebAppASGName-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
      exportName: `WebAppEC2SGId-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `WebAppALBSGId-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
      exportName: `WebAppEC2RoleArn-${environmentSuffix}`
    });

    new cdk.CfnOutput(this, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'Target Group ARN',
      exportName: `WebAppTGArn-${environmentSuffix}`
    });
  }
}
