/**
 * compute-stack.mjs
 *
 * Creates Auto Scaling Group, Launch Template, and EC2 configuration
 * with 2025 enhanced features like instance refresh and target tracking.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class ComputeStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:compute:ComputeStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'compute' };

    // Get the latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
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

    // IAM role for EC2 instances
    const instanceRole = new aws.iam.Role(
      `webapp-instance-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...tags, Name: `webapp-instance-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Attach CloudWatch agent policy to instance role
    new aws.iam.RolePolicyAttachment(
      `webapp-cloudwatch-policy-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `webapp-instance-profile-${environmentSuffix}`,
      {
        role: instanceRole.name,
        tags: { ...tags, Name: `webapp-instance-profile-${environmentSuffix}` },
      },
      { parent: this }
    );

    // User data script for web server setup
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Web Server - Instance \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html
echo "<p>Availability Zone: \$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "WebApp/${environmentSuffix}",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    {
                        "name": "cpu_usage_idle",
                        "rename": "CPU_USAGE_IDLE",
                        "unit": "Percent"
                    },
                    {
                        "name": "cpu_usage_iowait",
                        "rename": "CPU_USAGE_IOWAIT",
                        "unit": "Percent"
                    },
                    {
                        "name": "cpu_usage_system",
                        "rename": "CPU_USAGE_SYSTEM",
                        "unit": "Percent"
                    },
                    {
                        "name": "cpu_usage_user",
                        "rename": "CPU_USAGE_USER",
                        "unit": "Percent"
                    }
                ],
                "metrics_collection_interval": 60,
                "totalcpu": true
            },
            "disk": {
                "measurement": [
                    {
                        "name": "used_percent",
                        "rename": "DISK_USED_PERCENT",
                        "unit": "Percent"
                    }
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    {
                        "name": "mem_used_percent",
                        "rename": "MEM_USED_PERCENT",
                        "unit": "Percent"
                    }
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`;

    // Launch template with latest 2025 features
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `webapp-lt-${environmentSuffix}`,
      {
        name: `webapp-lt-${environmentSuffix}`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        keyName: undefined, // Set to your key pair name if needed
        vpcSecurityGroupIds: [args.instanceSecurityGroup.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: { ...tags, Name: `webapp-instance-${environmentSuffix}` },
          },
          {
            resourceType: 'volume',
            tags: { ...tags, Name: `webapp-volume-${environmentSuffix}` },
          },
        ],
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 8,
              volumeType: 'gp3',
              deleteOnTermination: true,
              encrypted: true,
              kmsKeyId: 'arn:aws:kms:us-east-1:718240086340:key/1d699820-3d3e-4a8d-aa0f-8c85a4cb7e5a', // AWS managed EBS key
            },
          },
        ],
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // IMDSv2 only for security
          httpPutResponseHopLimit: 2,
        },
        tags: { ...tags, Name: `webapp-lt-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Auto Scaling Group with enhanced 2025 features
    this.autoScalingGroup = new aws.autoscaling.Group(
      `webapp-asg-${environmentSuffix}`,
      {
        name: `webapp-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: args.privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [args.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 5,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        // 2025 feature: Instance refresh configuration
        instanceRefresh: {
          strategy: 'Rolling',
          preferences: {
            minHealthyPercentage: 50,
            instanceWarmup: 300,
            checkpointPercentages: [20, 50, 100],
            checkpointDelay: 600,
          },
        },
        // Enhanced termination policies
        terminationPolicies: ['OldestLaunchTemplate', 'OldestInstance'],
        tags: [
          {
            key: 'Name',
            value: `webapp-asg-${environmentSuffix}`,
            propagateAtLaunch: false,
          },
          ...Object.entries(tags).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
          })),
        ],
      },
      { parent: this }
    );

    // 2025 feature: Target tracking scaling policy for CPU utilization
    new aws.autoscaling.Policy(
      `webapp-cpu-scaling-policy-${environmentSuffix}`,
      {
        name: `webapp-cpu-scaling-policy-${environmentSuffix}`,
        scalingAdjustment: undefined, // Not used with target tracking
        adjustmentType: undefined, // Not used with target tracking
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          disableScaleIn: false,
        },
      },
      { parent: this }
    );

    // 2025 feature: Target tracking scaling policy for ALB request count
    // Note: ALB request scaling requires proper resource label format
    // Commenting out for now as it requires ALB ARN suffix which varies per deployment

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroup.name,
      launchTemplateId: this.launchTemplate.id,
    });
  }
}

