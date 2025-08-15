import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  webSecurityGroup: ec2.SecurityGroup;
  loadBalancerSecurityGroup: ec2.SecurityGroup;
  ec2Role: iam.Role;
  alertsTopic: sns.Topic;
}

export class ComputeStack extends cdk.NestedStack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Instance Profile for EC2
    new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [props.ec2Role.roleName],
    });

    // User Data for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y nginx',
      // Configure HTTP for testing (in production use HTTPS)
      'cat > /usr/share/nginx/html/index.html << EOF',
      '<html><body><h1>WebApp Running on ${ENVIRONMENT_SUFFIX}</h1></body></html>',
      'EOF',
      'systemctl start nginx',
      'systemctl enable nginx',
      // Install CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: props.webSecurityGroup,
      userData: userData,
      role: props.ec2Role,
      requireImdsv2: true,
      httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      instanceMetadataTags: true,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
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
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.loadBalancerSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: props.vpc,
      targets: [this.autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
      },
      targetGroupName: `webapp-tg-${props.environmentSuffix}-${this.node.addr.substring(0, 8)}`,
    });

    // HTTP Listener (Using HTTP for testing - in production use HTTPS with ACM certificate)
    this.loadBalancer.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Scaling Policies
    this.autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // CloudWatch Alarms for EC2
    new cloudwatch.Alarm(this, 'EC2CPUAlarm', {
      alarmName: `EC2-CPU-${props.environmentSuffix}-${this.node.addr.substring(0, 8)}`,
      alarmDescription: 'EC2 CPU utilization is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(props.alertsTopic));

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Compute');
  }
}
