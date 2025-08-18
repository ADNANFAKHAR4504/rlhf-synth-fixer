import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ComputeStackArgs {
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  publicSubnetIds: pulumi.Input<string[]>;
  webSecurityGroupId: pulumi.Input<string>;
  albSecurityGroupId: pulumi.Input<string>;
  instanceProfileName: pulumi.Input<string>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly applicationLoadBalancer: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;
  public readonly cpuAlarm: aws.cloudwatch.MetricAlarm;
  public readonly scaleUpPolicy: aws.autoscaling.Policy;
  public readonly scaleDownPolicy: aws.autoscaling.Policy;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('webapp:compute:ComputeStack', name, args, opts);

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // User data script
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "WebApp/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s`;

    // Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${name}-launch-template`,
      {
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        iamInstanceProfile: {
          name: args.instanceProfileName,
        },
        vpcSecurityGroupIds: [args.webSecurityGroupId],
        userData: Buffer.from(userData).toString('base64'),
        tags: {
          ...args.tags,
          Name: `${name}-launch-template-${args.environmentSuffix}`,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...args.tags,
              Name: `${name}-web-instance-${args.environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        loadBalancerType: 'application',
        subnets: args.publicSubnetIds,
        securityGroups: [args.albSecurityGroupId],
        tags: {
          ...args.tags,
          Name: `${name}-alb-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
        },
        tags: {
          ...args.tags,
          Name: `${name}-tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ALB Listener
    this.listener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: this.applicationLoadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Auto Scaling Group with highly responsive scaling
    this.autoScalingGroup = new aws.autoscaling.Group(
      `${name}-asg`,
      {
        vpcZoneIdentifiers: args.privateSubnetIds,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        tags: [
          {
            key: 'Name',
            value: pulumi.interpolate`${name}-asg-${args.environmentSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Scale Up Policy (Highly Responsive)
    this.scaleUpPolicy = new aws.autoscaling.Policy(
      `${name}-scale-up`,
      {
        scalingAdjustment: 2,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // Scale Down Policy
    this.scaleDownPolicy = new aws.autoscaling.Policy(
      `${name}-scale-down`,
      {
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // CloudWatch Alarm for Scale Up (High Resolution)
    this.cpuAlarm = new aws.cloudwatch.MetricAlarm(
      `${name}-cpu-high`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 60, // High resolution - 1 minute
        statistic: 'Average',
        threshold: 70,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        alarmActions: [this.scaleUpPolicy.arn],
        tags: {
          ...args.tags,
          Name: `${name}-cpu-high-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Scale Down
    new aws.cloudwatch.MetricAlarm(
      `${name}-cpu-low`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 30,
        alarmDescription:
          'This metric monitors ec2 cpu utilization for scale down',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        alarmActions: [this.scaleDownPolicy.arn],
        tags: {
          ...args.tags,
          Name: `${name}-cpu-low-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albDnsName: this.applicationLoadBalancer.dnsName,
      asgName: this.autoScalingGroup.name,
    });
  }
}
