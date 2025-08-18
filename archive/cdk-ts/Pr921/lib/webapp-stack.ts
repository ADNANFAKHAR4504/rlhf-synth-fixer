import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  regionName: string;
}

export class WebAppStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSG-${props.regionName}`,
      {
        vpc: props.vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

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

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `WebAppALB-${props.regionName}`,
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        loadBalancerName: `alb-${props.regionName.substring(0, 3)}-${props.environmentSuffix.substring(0, 20)}`,
      }
    );

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `EC2SG-${props.regionName}`,
      {
        vpc: props.vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role-${props.regionName}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<html><body><h1>Web Application - Region: ${AWS::Region}</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/index.html'
    );

    // Create Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `LaunchTemplate-${props.regionName}`,
      {
        launchTemplateName: `lt-${props.regionName.substring(0, 3)}-${props.environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: userData,
        detailedMonitoring: true,
      }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `ASG-${props.regionName}`,
      {
        vpc: props.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        autoScalingGroupName: `asg-${props.regionName.substring(0, 3)}-${props.environmentSuffix}`,
      }
    );

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup-${props.regionName}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(10),
          unhealthyThresholdCount: 5,
          path: '/',
        },
        targetGroupName: `tg-${props.regionName.substring(0, 3)}-${props.environmentSuffix.substring(0, 20)}`,
      }
    );

    // Attach ASG to target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Add listener to ALB
    this.loadBalancer.addListener(`Listener-${props.regionName}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Add scaling policies
    autoScalingGroup.scaleOnCpuUtilization(`CPUScaling-${props.regionName}`, {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    autoScalingGroup.scaleOnRequestCount(`RequestScaling-${props.regionName}`, {
      targetRequestsPerMinute: 1000,
      cooldown: cdk.Duration.minutes(5),
    });

    // Export ALB DNS name for Route 53
    new cdk.CfnOutput(this, `LoadBalancerDNS-${props.regionName}`, {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `ALB-DNS-${props.regionName}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `LoadBalancerHostedZoneId-${props.regionName}`, {
      value: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
      exportName: `ALB-HZ-${props.regionName}-${props.environmentSuffix}`,
    });
  }
}
