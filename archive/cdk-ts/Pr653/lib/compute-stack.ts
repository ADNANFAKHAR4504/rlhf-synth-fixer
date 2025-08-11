import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

interface ComputeStackProps extends cdk.StackProps {
  securityStack: SecurityStack;
}

export class ComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { securityStack } = props;

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: securityStack.appSecurityGroup,
      role: securityStack.ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            kmsKey: securityStack.kmsKey,
          }),
        },
      ],
      requireImdsv2: true,
    });

    // Add user data commands if userData is defined
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    if (launchTemplate.userData) {
      launchTemplate.userData.addCommands(
        'yum update -y',
        'yum install -y amazon-cloudwatch-agent',
        'yum install -y docker',
        'service docker start',
        'usermod -a -G docker ec2-user',
        // Configure CloudWatch agent
        `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/application/secure-web-app-${environmentSuffix}",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF`,
        '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
      );
    }

    // Auto Scaling Group across multiple AZs
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc: securityStack.vpc,
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
      }
    );

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc: securityStack.vpc,
        internetFacing: true,
        securityGroup: securityStack.albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: securityStack.vpc,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
      },
    });

    // Attach Auto Scaling Group to Target Group
    this.autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // HTTP Listener (for testing - in production you would use HTTPS with a valid certificate)
    this.alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Enable access logs using the ALB-specific log bucket
    this.alb.logAccessLogs(securityStack.albLogBucket, 'alb-logs');
  }
}
