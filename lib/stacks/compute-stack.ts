import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  applicationSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  instanceRole: iam.Role;
  logBucket: s3.Bucket;
  databaseSecret: secretsmanager.Secret;
  webAcl: wafv2.CfnWebACL;
  tags?: { [key: string]: string };
}

export class ComputeStack extends cdk.NestedStack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create launch template for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y amazon-ssm-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Application Server</h1>" > /var/www/html/index.html',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        agent: {
          metrics_collection_interval: 60,
          run_as_user: 'cwagent',
        },
        metrics: {
          namespace: `${props.environmentSuffix}/EC2`,
          metrics_collected: {
            cpu: {
              measurement: [
                {
                  name: 'cpu_usage_idle',
                  rename: 'CPU_USAGE_IDLE',
                  unit: 'Percent',
                },
                {
                  name: 'cpu_usage_iowait',
                  rename: 'CPU_USAGE_IOWAIT',
                  unit: 'Percent',
                },
                'cpu_time_guest',
              ],
              totalcpu: false,
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: [
                {
                  name: 'used_percent',
                  rename: 'DISK_USED_PERCENT',
                  unit: 'Percent',
                },
                'disk_free',
              ],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: [
                {
                  name: 'mem_used_percent',
                  rename: 'MEM_USED_PERCENT',
                  unit: 'Percent',
                },
                'mem_available',
              ],
              metrics_collection_interval: 60,
            },
            netstat: {
              measurement: ['tcp_established', 'tcp_time_wait'],
              metrics_collection_interval: 60,
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\',
      '  -a fetch-config \\',
      '  -m ec2 \\',
      '  -s \\',
      '  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json'
    );

    // Create Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: `${props.environmentSuffix}-alb-v4`,
    });

    // Enable ALB access logs
    this.alb.logAccessLogs(props.logBucket);

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'ALBWebACLAssociation', {
      resourceArn: this.alb.loadBalancerArn,
      webAclArn: props.webAcl.attrArn,
    });

    // Create Auto Scaling Group
    this.asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: props.applicationSecurityGroup,
      role: props.instanceRole,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      userData,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 2,
      }),
      instanceMonitoring: autoscaling.Monitoring.DETAILED,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(30, {
            volumeType: autoscaling.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    // Add scaling policies
    this.asg.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    this.asg.scaleOnMetric('MemoryScaling', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: `${props.environmentSuffix}/EC2`,
        metricName: 'MEM_USED_PERCENT',
        dimensionsMap: {
          AutoScalingGroupName: this.asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      scalingSteps: [
        { upper: 60, change: -1 },
        { lower: 80, change: +1 },
        { lower: 90, change: +2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
      cooldown: cdk.Duration.minutes(5),
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.asg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Add listener
    this.alb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });
  }
}
