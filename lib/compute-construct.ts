// Compute construct for production
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';
import { AcmCertificateValidation } from '@cdktf/provider-aws/lib/acm-certificate-validation';
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

export class ComputeConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      vpcId: string;
      publicSubnetIds: string[];
      privateSubnetIds: string[];
      securityGroupId: string;
      instanceProfile: string;
      loadBalancerSecurityGroupId: string;
      domainName: string;
    }
  ) {
    super(scope, id);

    // CloudWatch Log Group for user data logs
    const logGroup = new CloudwatchLogGroup(this, 'user-data-logs', {
      name: '/aws/ec2/production/user-data',
      retentionInDays: 30,
      tags: {
        Name: 'production-user-data-logs',
        Environment: 'production',
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
      name: 'production-launch-template',
      description: 'Launch template for production EC2 instances',
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
            Name: 'production-instance',
            Environment: 'production',
            LaunchedBy: 'autoscaling-group',
          },
        },
        {
          resourceType: 'volume',
          tags: {
            Name: 'production-instance-volume',
            Environment: 'production',
          },
        },
      ],
      tags: {
        Name: 'production-launch-template',
        Environment: 'production',
      },
    });

    // Application Load Balancer
    const loadBalancer = new Lb(this, 'load-balancer', {
      name: 'production-alb',
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [props.loadBalancerSecurityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: 'production-alb',
        Environment: 'production',
      },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: 'production-tg',
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
        Name: 'production-tg',
        Environment: 'production',
      },
    });

    // Lookup Route53 Hosted Zone by domain name
    new DataAwsRoute53Zone(this, 'hosted-zone', {
      name: props.domainName.split('.').slice(-2).join('.'), // e.g., example.com
      privateZone: false,
    });

    // ACM Certificate (DNS validation)
    const certificate = new AcmCertificate(this, 'alb-certificate', {
      domainName: props.domainName,
      validationMethod: 'DNS',
      tags: {
        Name: 'production-alb-certificate',
        Environment: 'production',
      },
    });

    // ACM Certificate Validation
    new AcmCertificateValidation(this, 'alb-certificate-validation', {
      certificateArn: certificate.arn,
      validationRecordFqdns: [
        // This will be populated automatically by Terraform/CDKTF
      ],
    });

    // Load Balancer Listener (use certificate.arn)
    new LbListener(this, 'lb-listener', {
      loadBalancerArn: loadBalancer.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificate.arn,
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: 'production-lb-listener',
        Environment: 'production',
      },
    });

    // Auto Scaling Group
    const autoScalingGroup = new AutoscalingGroup(this, 'autoscaling-group', {
      name: 'production-asg',
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
          value: 'production-asg-instance',
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: 'production',
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
