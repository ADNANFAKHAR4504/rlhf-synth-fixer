// Compute construct for production
// Removed ACM imports
import { AutoscalingAttachment } from '@cdktf/provider-aws/lib/autoscaling-attachment';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsRoute53Zone } from '@cdktf/provider-aws/lib/data-aws-route53-zone';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  securityGroupId: string;
  instanceProfile: string;
  loadBalancerSecurityGroupId: string;
  domainName: string;
  environmentSuffix: string;
}

export class ComputeConstruct extends Construct {
  public albArn: string;
  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // CloudWatch Log Group for user data logs
    const logGroup = new CloudwatchLogGroup(this, 'user-data-logs', {
      name: `/aws/ec2/${props.environmentSuffix}/user-data`,
      retentionInDays: 30,
      tags: {
        Name: `${props.environmentSuffix}-user-data-logs`,
        Environment: props.environmentSuffix,
      },
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    // User data script that logs to CloudWatch
    const userData = `#!/bin/bash
yum update -y
yum install -y awslogs

# Configure CloudWatch Logs agent
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/user-data.log]
file = /var/log/user-data.log
log_group_name = ${logGroup.name}
log_stream_name = {instance_id}/user-data
datetime_format = %b %d %H:%M:%S

[/var/log/messages]
file = /var/log/messages
log_group_name = ${logGroup.name}
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S
EOF

# Configure CloudWatch Logs region
sed -i 's/us-east-1/us-west-2/g' /etc/awslogs/awscli.conf

# Start CloudWatch Logs agent
systemctl start awslogsd
systemctl enable awslogsd

# Log user data execution
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "$(date): Starting user data script execution"

# Install and configure nginx
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Production Server</title>
</head>
<body>
    <h1>Production Environment</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

echo "$(date): User data script execution completed"
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${props.environmentSuffix}-launch-template`,
      description: `Launch template for ${props.environmentSuffix} EC2 instances`,
      imageId: ami.id,
      instanceType: 't3.micro',
      keyName: undefined, // No key pair for production security
      vpcSecurityGroupIds: [props.securityGroupId],
      userData: Buffer.from(userData).toString('base64'),
      iamInstanceProfile: {
        name: props.instanceProfile,
      },
      monitoring: {
        enabled: true, // Enable detailed CloudWatch monitoring
      },
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: 'true',
            deleteOnTermination: 'true',
          },
        },
      ],
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `${props.environmentSuffix}-instance`,
            Environment: props.environmentSuffix,
            LaunchedBy: 'autoscaling-group',
          },
        },
        {
          resourceType: 'volume',
          tags: {
            Name: `${props.environmentSuffix}-instance-volume`,
            Environment: props.environmentSuffix,
          },
        },
      ],
      tags: {
        Name: `${props.environmentSuffix}-launch-template`,
        Environment: props.environmentSuffix,
      },
    });

    // Application Load Balancer
    const loadBalancer = new Lb(this, 'load-balancer', {
      name: `${props.environmentSuffix}-alb`,
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [props.loadBalancerSecurityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `${props.environmentSuffix}-alb`,
        Environment: props.environmentSuffix,
      },
    });
    this.albArn = loadBalancer.arn;

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${props.environmentSuffix}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/',
        matcher: '200',
        port: 'traffic-port',
        protocol: 'HTTP',
      },
      tags: {
        Name: `${props.environmentSuffix}-tg`,
        Environment: props.environmentSuffix,
      },
    });

    // Lookup Route53 Hosted Zone by domain name
    new DataAwsRoute53Zone(this, 'hosted-zone', {
      name: props.domainName.split('.').slice(-2).join('.'), // e.g., example.com
      privateZone: false,
    });

    // Removed ACM certificate and validation resources

    // Load Balancer Listener (use certificate.arn)
    // Add HTTP listener for ALB (no SSL)
    new LbListener(this, 'lb-listener', {
      loadBalancerArn: loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: `${props.environmentSuffix}-lb-listener`,
        Environment: props.environmentSuffix,
      },
    });

    // Auto Scaling Group
    const autoScalingGroup = new AutoscalingGroup(this, 'autoscaling-group', {
      name: `${props.environmentSuffix}-asg`,
      minSize: 3,
      maxSize: 10,
      desiredCapacity: 3,
      vpcZoneIdentifier: props.privateSubnetIds,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      defaultCooldown: 300,
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances',
      ],
      tag: [
        {
          key: 'Name',
          value: `${props.environmentSuffix}-asg-instance`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: props.environmentSuffix,
          propagateAtLaunch: true,
        },
      ],
    });

    // Attach Auto Scaling Group to Target Group
    new AutoscalingAttachment(this, 'asg-attachment', {
      autoscalingGroupName: autoScalingGroup.id,
      lbTargetGroupArn: targetGroup.arn,
    });
  }
}
