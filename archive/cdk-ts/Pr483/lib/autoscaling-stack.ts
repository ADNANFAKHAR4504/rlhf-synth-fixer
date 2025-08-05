import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AutoScalingStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  privateSubnets: ec2.ISubnet[];
  ec2Role: iam.IRole;
  environmentSuffix?: string;
}

export class AutoScalingStack extends cdk.Stack {
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: AutoScalingStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create security group for EC2 instances
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `EC2SecurityGroup${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: `Security group for EC2 instances in ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Allow inbound HTTP traffic from within VPC
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP from VPC'
    );

    // Allow inbound HTTPS traffic from within VPC
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Multi-Tier Application Server</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html'
    );

    // Create Launch Template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `LaunchTemplate${environmentSuffix}`,
      {
        launchTemplateName: `MultiTier-LaunchTemplate-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: this.securityGroup,
        role: props.ec2Role,
        userData: userData,
        requireImdsv2: true,
      }
    );

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `AutoScalingGroup${environmentSuffix}`,
      {
        vpc: props.vpc,
        vpcSubnets: {
          subnets: props.privateSubnets,
        },
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        healthChecks: autoscaling.HealthChecks.ec2(),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
        }),
      }
    );

    // Add scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization(
      `CpuScaling${environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
        cooldown: cdk.Duration.minutes(5),
        estimatedInstanceWarmup: cdk.Duration.minutes(3),
      }
    );

    // Tag the Auto Scaling Group
    cdk.Tags.of(this.autoScalingGroup).add(
      'Name',
      `MultiTier-ASG-${environmentSuffix}`
    );
    cdk.Tags.of(this.autoScalingGroup).add('Environment', environmentSuffix);

    // Outputs
    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: this.autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });
  }
}
