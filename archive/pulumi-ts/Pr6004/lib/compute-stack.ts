/**
 * compute-stack.ts
 *
 * Application Load Balancer and Auto Scaling Group infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  databaseEndpoint: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly asgName: pulumi.Output<string>;
  public readonly instanceIds: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    const { environmentSuffix, vpc, publicSubnetIds, privateSubnetIds, tags } =
      args;

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Security Group for EC2 instances
    const instanceSecurityGroup = new aws.ec2.SecurityGroup(
      `instance-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `instance-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `alb-${environmentSuffix}`,
      {
        loadBalancerType: 'application',
        subnets: publicSubnetIds,
        securityGroups: [albSecurityGroup.id],
        enableCrossZoneLoadBalancing: true,
        enableHttp2: true,
        tags: {
          Name: `alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for ALB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _albLogGroup = new aws.cloudwatch.LogGroup(
      `alb-logs-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: {
          Name: `alb-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'instance',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          port: '80',
          interval: 15,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          matcher: '200',
        },
        tags: {
          Name: `tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // ALB Listener
    new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2023 AMI
    const ami = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // IAM Role for EC2 instances
    const instanceRole = new aws.iam.Role(
      `instance-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        ],
        tags: {
          Name: `instance-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `instance-profile-${environmentSuffix}`,
      {
        role: instanceRole.name,
        tags: {
          Name: `instance-profile-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for EC2
    const ec2LogGroup = new aws.cloudwatch.LogGroup(
      `ec2-logs-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: {
          Name: `ec2-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // User data script
    const userData = pulumi.interpolate`#!/bin/bash
set -e

# Update packages
yum update -y

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent for application logs
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CFGEOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/app.log",
            "log_group_name": "${ec2LogGroup.name}",
            "log_stream_name": "{instance_id}/app.log",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          }
        ]
      }
    }
  }
}
CFGEOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Install application dependencies
yum install -y httpd

# Create simple health check endpoint
echo "OK" > /var/www/html/health

# Start application
systemctl enable httpd
systemctl start httpd

# Create sample application log
touch /var/log/app.log
echo "$(date): Application started on $(hostname)" >> /var/log/app.log
`;

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `launch-template-${environmentSuffix}`,
      {
        imageId: ami.id,
        instanceType: 't3.medium',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        vpcSecurityGroupIds: [instanceSecurityGroup.id],
        userData: userData.apply(ud => Buffer.from(ud).toString('base64')),
        monitoring: {
          enabled: true,
        },
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `instance-${environmentSuffix}`,
              ...tags,
            },
          },
        ],
      },
      { parent: this }
    );

    // Auto Scaling Group
    const asg = new aws.autoscaling.Group(
      `asg-${environmentSuffix}`,
      {
        vpcZoneIdentifiers: privateSubnetIds,
        minSize: 3,
        maxSize: 9,
        desiredCapacity: 3,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        targetGroupArns: [targetGroup.arn],
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Auto Scaling Policy - Scale Up
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `scale-up-policy-${environmentSuffix}`,
      {
        autoscalingGroupName: asg.name,
        adjustmentType: 'ChangeInCapacity',
        scalingAdjustment: 1,
        cooldown: 300,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // Auto Scaling Policy - Scale Down
    const scaleDownPolicy = new aws.autoscaling.Policy(
      `scale-down-policy-${environmentSuffix}`,
      {
        autoscalingGroupName: asg.name,
        adjustmentType: 'ChangeInCapacity',
        scalingAdjustment: -1,
        cooldown: 300,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // CloudWatch Alarm - High CPU
    new aws.cloudwatch.MetricAlarm(
      `high-cpu-alarm-${environmentSuffix}`,
      {
        name: `high-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 60,
        statistic: 'Average',
        threshold: 70,
        dimensions: {
          AutoScalingGroupName: asg.name,
        },
        alarmActions: [scaleUpPolicy.arn],
        tags: {
          Name: `high-cpu-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - Low CPU
    new aws.cloudwatch.MetricAlarm(
      `low-cpu-alarm-${environmentSuffix}`,
      {
        name: `low-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 60,
        statistic: 'Average',
        threshold: 30,
        dimensions: {
          AutoScalingGroupName: asg.name,
        },
        alarmActions: [scaleDownPolicy.arn],
        tags: {
          Name: `low-cpu-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Lifecycle Hook for connection draining
    new aws.autoscaling.LifecycleHook(
      `termination-hook-${environmentSuffix}`,
      {
        autoscalingGroupName: asg.name,
        lifecycleTransition: 'autoscaling:EC2_INSTANCE_TERMINATING',
        defaultResult: 'CONTINUE',
        heartbeatTimeout: 300,
        name: `termination-hook-${environmentSuffix}`,
      },
      { parent: this }
    );

    // Export values
    this.albArn = alb.arn;
    this.albDnsName = alb.dnsName;
    this.targetGroupArn = targetGroup.arn;
    this.asgName = asg.name;
    this.instanceIds = pulumi.output([]);

    this.registerOutputs({
      albArn: this.albArn,
      albDnsName: this.albDnsName,
      targetGroupArn: this.targetGroupArn,
      asgName: this.asgName,
    });
  }
}
