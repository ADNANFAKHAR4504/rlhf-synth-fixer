/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the web application deployment.
 * Orchestrates VPC, Auto Scaling, Load Balancer, S3, and IAM resources.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component resource for the web application infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get availability zones for us-west-2
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `tap-vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `tap-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `tap-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          availabilityZone: azs.then(azs => azs.names[i]),
          cidrBlock: `10.0.${i + 1}.0/24`,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `tap-public-subnet-${i}-${environmentSuffix}`,
            Type: 'Public',
            ...tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);
    }

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `tap-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create S3 bucket for application logs
    const logsBucket = new aws.s3.Bucket(
      `tap-logs-bucket-${environmentSuffix}`,
      {
        bucket: `tap-application-logs-${environmentSuffix}-${Date.now()}`,
        tags: {
          Name: `tap-logs-bucket-${environmentSuffix}`,
          Purpose: 'ApplicationLogs',
          ...tags,
        },
      },
      { parent: this }
    );

    // Configure S3 bucket lifecycle to manage log retention
    new aws.s3.BucketLifecycleConfiguration(
      `tap-logs-lifecycle-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            id: 'log-cleanup',
            status: 'Enabled',
            expiration: {
              days: 30,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 7,
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access to the logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-logs-pab-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `tap-ec2-role-${environmentSuffix}`,
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
        tags: {
          Name: `tap-ec2-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM policy for S3 access
    const s3Policy = new aws.iam.Policy(
      `tap-s3-policy-${environmentSuffix}`,
      {
        description: 'Allow EC2 instances to write logs to S3 bucket',
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:PutObjectAcl",
              "s3:GetObject",
              "s3:ListBucket"
            ],
            "Resource": [
              "${logsBucket.arn}",
              "${logsBucket.arn}/*"
            ]
          }
        ]
      }`,
        tags: {
          Name: `tap-s3-policy-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `tap-policy-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: s3Policy.arn,
      },
      { parent: this }
    );

    // Attach CloudWatch agent policy for monitoring
    new aws.iam.RolePolicyAttachment(
      `tap-cloudwatch-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-instance-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: {
          Name: `tap-instance-profile-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Security group for ALB
    const albSg = new aws.ec2.SecurityGroup(
      `tap-alb-sg-${environmentSuffix}`,
      {
        namePrefix: `tap-alb-sg-${environmentSuffix}`,
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: `tap-alb-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Security group for EC2 instances
    const ec2Sg = new aws.ec2.SecurityGroup(
      `tap-ec2-sg-${environmentSuffix}`,
      {
        namePrefix: `tap-ec2-sg-${environmentSuffix}`,
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSg.id],
            description: 'HTTP from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'SSH from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: `tap-ec2-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get latest Amazon Linux 2 AMI
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

    // User data script for web server setup and log shipping to S3
    const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd awslogs

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>TAP Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>TAP Web Application</h1>
        <div class="status">
            <h2>Status: Running</h2>
            <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p>Timestamp: $(date)</p>
        </div>
        <h2>Features:</h2>
        <ul>
            <li>Auto Scaling (1-3 instances)</li>
            <li>Load Balanced Traffic Distribution</li>
            <li>Application Logs stored in S3</li>
            <li>CloudWatch Monitoring</li>
        </ul>
    </div>
</body>
</html>
EOF

# Configure awslogs to send Apache logs to S3 via CloudWatch
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/httpd/access_log]
file = /var/log/httpd/access_log
log_group_name = tap-web-logs-${environmentSuffix}
log_stream_name = {instance_id}/apache/access.log
datetime_format = %d/%b/%Y:%H:%M:%S %z

[/var/log/httpd/error_log]
file = /var/log/httpd/error_log
log_group_name = tap-web-logs-${environmentSuffix}
log_stream_name = {instance_id}/apache/error.log
datetime_format = %a %b %d %H:%M:%S %Y
EOF

# Set region for awslogs
sed -i 's/us-east-1/us-west-2/g' /etc/awslogs/awscli.conf

# Start awslogs service
systemctl start awslogsd
systemctl enable awslogsd

# Create a simple log shipping script to S3
cat > /usr/local/bin/ship-logs-to-s3.sh << 'EOF'
#!/bin/bash
LOG_BUCKET="${logsBucket.bucket}"
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Ship access logs
if [ -f /var/log/httpd/access_log ]; then
    aws s3 cp /var/log/httpd/access_log s3://$LOG_BUCKET/$INSTANCE_ID/apache/access_$TIMESTAMP.log --region us-west-2
fi

# Ship error logs
if [ -f /var/log/httpd/error_log ]; then
    aws s3 cp /var/log/httpd/error_log s3://$LOG_BUCKET/$INSTANCE_ID/apache/error_$TIMESTAMP.log --region us-west-2
fi
EOF

chmod +x /usr/local/bin/ship-logs-to-s3.sh

# Set up cron job to ship logs every 5 minutes
echo "*/5 * * * * /usr/local/bin/ship-logs-to-s3.sh" | crontab -

# Start services
systemctl restart httpd
`;

    // Create launch template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `tap-launch-template-${environmentSuffix}`,
      {
        namePrefix: `tap-lt-${environmentSuffix}`,
        description: 'Launch template for TAP web application',
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        keyName: undefined, // No key pair for this demo
        vpcSecurityGroupIds: [ec2Sg.id],
        iamInstanceProfile: {
          name: instanceProfile.name,
        },
        userData: userData.apply(ud => Buffer.from(ud).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `tap-web-server-${environmentSuffix}`,
              Purpose: 'WebServer',
              ...tags,
            },
          },
        ],
        tags: {
          Name: `tap-launch-template-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `tap-alb-${environmentSuffix}`,
      {
        name: `tap-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false,
        tags: {
          Name: `tap-alb-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `tap-tg-${environmentSuffix}`,
      {
        name: `tap-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 10,
          interval: 30,
          path: '/',
          matcher: '200',
          protocol: 'HTTP',
          port: 'traffic-port',
        },
        tags: {
          Name: `tap-tg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create ALB listener
    new aws.lb.Listener(
      `tap-alb-listener-${environmentSuffix}`,
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
        tags: {
          Name: `tap-alb-listener-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create CloudWatch log group for application logs
    new aws.cloudwatch.LogGroup(
      `tap-web-logs-${environmentSuffix}`,
      {
        name: `tap-web-logs-${environmentSuffix}`,
        retentionInDays: 14,
        tags: {
          Name: `tap-web-logs-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `tap-asg-${environmentSuffix}`,
      {
        name: `tap-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: publicSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        enabledMetrics: [
          'GroupMinSize',
          'GroupMaxSize',
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupTotalInstances',
        ],
        tags: [
          {
            key: 'Name',
            value: `tap-asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Create Auto Scaling Policy for scale up (CPU > 70%)
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `tap-scale-up-policy-${environmentSuffix}`,
      {
        name: `tap-scale-up-policy-${environmentSuffix}`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // Create Auto Scaling Policy for scale down (CPU < 30%)
    const scaleDownPolicy = new aws.autoscaling.Policy(
      `tap-scale-down-policy-${environmentSuffix}`,
      {
        name: `tap-scale-down-policy-${environmentSuffix}`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
        policyType: 'SimpleScaling',
      },
      { parent: this }
    );

    // CloudWatch Alarms for Auto Scaling
    new aws.cloudwatch.MetricAlarm(
      `tap-cpu-high-alarm-${environmentSuffix}`,
      {
        name: `tap-cpu-high-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 70,
        alarmDescription: 'This metric monitors ec2 cpu utilization high',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        alarmActions: [scaleUpPolicy.arn],
        tags: {
          Name: `tap-cpu-high-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `tap-cpu-low-alarm-${environmentSuffix}`,
      {
        name: `tap-cpu-low-alarm-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 30,
        alarmDescription: 'This metric monitors ec2 cpu utilization low',
        dimensions: {
          AutoScalingGroupName: autoScalingGroup.name,
        },
        alarmActions: [scaleDownPolicy.arn],
        tags: {
          Name: `tap-cpu-low-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Enhanced Target Tracking Scaling Policy (Latest AWS Feature)
    new aws.autoscaling.Policy(
      `tap-target-tracking-policy-${environmentSuffix}`,
      {
        name: `tap-target-tracking-policy-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        autoscalingGroupName: autoScalingGroup.name,
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          targetValue: 50.0,
        },
      },
      { parent: this }
    );

    // Export outputs
    this.vpcId = vpc.id;
    this.loadBalancerDns = alb.dnsName;
    this.autoScalingGroupName = autoScalingGroup.name;
    this.logsBucketName = logsBucket.bucket;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      loadBalancerDns: this.loadBalancerDns,
      autoScalingGroupName: this.autoScalingGroupName,
      logsBucketName: this.logsBucketName,
      albSecurityGroupId: albSg.id,
      ec2SecurityGroupId: ec2Sg.id,
    });
  }
}
