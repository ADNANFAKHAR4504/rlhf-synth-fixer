import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface CdkComputeStackProps extends cdk.NestedStackProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class CdkComputeStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: CdkComputeStackProps) {
    super(scope, id, props);

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `cdk-alb-sg-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        securityGroupName: `cdk-alb-sg-${props.environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic from specific IP ranges (replace with your IP ranges)
    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'), // Replace with your specific IP ranges
      ec2.Port.tcp(80),
      'Allow HTTP traffic from specific IP ranges'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'), // Replace with your specific IP ranges
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from specific IP ranges'
    );

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `cdk-ec2-sg-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        securityGroupName: `cdk-ec2-sg-${props.environmentSuffix}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    // Allow traffic from ALB only
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Allow SSH access from specific IP ranges
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'), // Restrict to your specific IP ranges
      ec2.Port.tcp(22),
      'Allow SSH access from specific IP ranges'
    );

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(
      this,
      `cdk-ec2-role-${props.environmentSuffix}`,
      {
        roleName: `cdk-ec2-role-${props.environmentSuffix}`,
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

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>CDK Auto Scaling Instance</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html'
    );

    // Create launch template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `cdk-launch-template-${props.environmentSuffix}`,
      {
        launchTemplateName: `cdk-launch-template-${props.environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        userData: userData,
        role: ec2Role,
        requireImdsv2: true,
      }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `cdk-asg-${props.environmentSuffix}`,
      {
        autoScalingGroupName: `cdk-asg-${props.environmentSuffix}`,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        launchTemplate: launchTemplate,
        minCapacity: 1,
        maxCapacity: 6,
        desiredCapacity: 2,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
      }
    );

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `cdk-alb-${props.environmentSuffix}`,
      {
        loadBalancerName: `cdk-alb-${props.environmentSuffix}`,
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `cdk-tg-${props.environmentSuffix}`,
      {
        targetGroupName: `cdk-tg-${props.environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc: props.vpc,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    );

    // Add Auto Scaling Group to target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Create ALB listener
    alb.addListener(`cdk-listener-${props.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Add scaling policies based on CPU utilization
    autoScalingGroup.scaleOnCpuUtilization(
      `cdk-cpu-scaling-${props.environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
      }
    );

    // Add tags
    cdk.Tags.of(autoScalingGroup).add(
      'Name',
      `cdk-asg-${props.environmentSuffix}`
    );
    cdk.Tags.of(autoScalingGroup).add('Environment', props.environmentSuffix);
    cdk.Tags.of(alb).add('Name', `cdk-alb-${props.environmentSuffix}`);
    cdk.Tags.of(alb).add('Environment', props.environmentSuffix);

    // Output ALB DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: `cdk-alb-dns-${props.environmentSuffix}`,
    });

    // Output Auto Scaling Group ARN
    new cdk.CfnOutput(this, 'AutoScalingGroupArn', {
      value: autoScalingGroup.autoScalingGroupArn,
      description: 'Auto Scaling Group ARN',
      exportName: `cdk-asg-arn-${props.environmentSuffix}`,
    });
  }
}
