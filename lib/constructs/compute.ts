import { Construct } from 'constructs';
import {
  launchTemplate,
  autoscalingGroup,
  autoscalingPolicy,
  lb,
  lbTargetGroup,
  lbListener,
  autoscalingAttachment,
  dataAwsAmi,
  cloudwatchMetricAlarm,
  wafv2WebAclAssociation,
} from '@cdktf/provider-aws/lib';
import { AppConfig } from '../config/variables';

export interface ComputeProps {
  config: AppConfig;
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  albSecurityGroupId: string;
  ec2SecurityGroupId: string;
  instanceProfileName: string;
  webAclArn: string;
  accessLogsBucket: string;
  accessLogsBucketPolicy: any;
}

export class ComputeConstruct extends Construct {
  public readonly launchTemplate: launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: autoscalingGroup.AutoscalingGroup;
  public readonly applicationLoadBalancer: lb.Lb;
  public readonly targetGroup: lbTargetGroup.LbTargetGroup;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    const {
      config,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      albSecurityGroupId,
      ec2SecurityGroupId,
      instanceProfileName,
      webAclArn,
      accessLogsBucket,
      accessLogsBucketPolicy,
    } = props;

    const amiData = new dataAwsAmi.DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from \$(hostname -f)</h1>" > /var/www/html/index.html

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "${config.projectName}/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
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

    this.launchTemplate = new launchTemplate.LaunchTemplate(
      this,
      'launch-template',
      {
        name: `${config.projectName}-${config.environment}-launch-template`,
        imageId: amiData.id,
        instanceType: config.instanceType,
        keyName: undefined,

        iamInstanceProfile: {
          name: instanceProfileName,
        },

        vpcSecurityGroupIds: [ec2SecurityGroupId],

        userData: Buffer.from(userData).toString('base64'),

        monitoring: {
          enabled: true,
        },

        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 8,
              volumeType: 'gp3',
              encrypted: 'false',
              deleteOnTermination: 'true',
            },
          },
        ],

        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...config.tags,
              Name: `${config.projectName}-instance`,
            },
          },
          {
            resourceType: 'volume',
            tags: {
              ...config.tags,
              Name: `${config.projectName}-volume`,
            },
          },
        ],

        tags: config.tags,
      }
    );

    this.applicationLoadBalancer = new lb.Lb(this, 'alb', {
      name: `${config.projectName}-${config.environment}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroupId],
      subnets: publicSubnetIds,
      enableDeletionProtection: false,

      accessLogs: {
        bucket: accessLogsBucket,
        enabled: true,
        prefix: 'alb-access-logs',
      },

      dependsOn: [accessLogsBucketPolicy],

      tags: {
        ...config.tags,
        Name: `${config.projectName}-alb`,
      },
    });

    new wafv2WebAclAssociation.Wafv2WebAclAssociation(
      this,
      'alb-waf-association',
      {
        resourceArn: this.applicationLoadBalancer.arn,
        webAclArn: webAclArn,
      }
    );

    this.targetGroup = new lbTargetGroup.LbTargetGroup(this, 'target-group', {
      name: `${config.projectName}-${config.environment}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'instance',

      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 10,
        interval: 30,
        path: '/',
        matcher: '200',
        port: 'traffic-port',
        protocol: 'HTTP',
      },

      tags: {
        ...config.tags,
        Name: `${config.projectName}-target-group`,
      },
    });

    new lbListener.LbListener(this, 'alb-listener', {
      loadBalancerArn: this.applicationLoadBalancer.arn,
      port: 80,
      protocol: 'HTTP',

      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],

      tags: config.tags,
    });

    this.autoScalingGroup = new autoscalingGroup.AutoscalingGroup(this, 'asg', {
      name: `${config.projectName}-${config.environment}-asg`,
      minSize: 1,
      maxSize: 6,
      desiredCapacity: 1,
      vpcZoneIdentifier: privateSubnetIds,

      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },

      healthCheckType: 'EC2',
      healthCheckGracePeriod: 600,

      tag: [
        {
          key: 'Name',
          value: `${config.projectName}-asg-instance`,
          propagateAtLaunch: true,
        },
        ...Object.entries(config.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],
    });

    new autoscalingAttachment.AutoscalingAttachment(this, 'asg-attachment', {
      autoscalingGroupName: this.autoScalingGroup.id,
      lbTargetGroupArn: this.targetGroup.arn,
    });

    const scaleUpPolicy = new autoscalingPolicy.AutoscalingPolicy(
      this,
      'scale-up-policy',
      {
        name: `${config.projectName}-${config.environment}-scale-up`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      }
    );

    const scaleDownPolicy = new autoscalingPolicy.AutoscalingPolicy(
      this,
      'scale-down-policy',
      {
        name: `${config.projectName}-${config.environment}-scale-down`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      }
    );

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'cpu-alarm-high', {
      alarmName: `${config.projectName}-${config.environment}-cpu-utilization-high`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      dimensions: {
        AutoScalingGroupName: this.autoScalingGroup.name,
      },
      alarmActions: [scaleUpPolicy.arn],
      tags: config.tags,
    });

    new cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'cpu-alarm-low', {
      alarmName: `${config.projectName}-${config.environment}-cpu-utilization-low`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 10,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      dimensions: {
        AutoScalingGroupName: this.autoScalingGroup.name,
      },
      alarmActions: [scaleDownPolicy.arn],
      tags: config.tags,
    });
  }
}
