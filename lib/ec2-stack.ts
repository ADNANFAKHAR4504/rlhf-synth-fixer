import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
// import * as acm from 'aws-cdk-lib/aws-certificatemanager'; // Removed - cert validation would fail
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface Ec2StackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  webServerSg: ec2.SecurityGroup;
  albSg: ec2.SecurityGroup;
  applicationBucket: s3.IBucket;
  environmentSuffix: string;
}

export class Ec2Stack extends cdk.Stack {
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly applicationLoadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id, props);

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant access to S3 bucket
    props.applicationBucket.grantReadWrite(ec2Role);

    // User data script for web servers
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Web Server</h1>" > /var/www/html/index.html',

      // Install and configure CloudWatch agent
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',

      // Install SSM agent (for secure access)
      'yum install -y amazon-ssm-agent',
      'systemctl start amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent'
    );

    // Launch template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: props.webServerSg,
        userData: userData,
        role: ec2Role,
        requireImdsv2: true, // Security best practice
        detailedMonitoring: true, // Enable detailed monitoring for production
      }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebServerAsg',
      {
        vpc: props.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(3),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'WebServerAlb',
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.albSg,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebServerTargetGroup',
      {
        port: 80,
        vpc: props.vpc,
        targets: [this.autoScalingGroup],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    );

    // HTTP listener
    this.applicationLoadBalancer.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Note: HTTPS listener removed for automated deployment
    // In production, add proper domain and ACM certificate

    // Auto scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });
  }
}
