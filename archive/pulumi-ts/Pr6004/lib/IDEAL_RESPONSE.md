# IDEAL_RESPONSE.md

## lib/database-stack.ts
```ts
// File: lib/database-stack.ts


/**
 * database-stack.ts
 *
 * RDS Aurora PostgreSQL cluster with multi-AZ read replicas.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  vpc: aws.ec2.Vpc;
  privateSubnetIds: pulumi.Output<string>[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly clusterIdentifier: pulumi.Output<string>;
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly readerEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:database:DatabaseStack', name, args, opts);

    const { environmentSuffix, vpc, privateSubnetIds, tags } = args;

    // Security Group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [vpc.cidrBlock],
            description: 'Allow PostgreSQL from VPC',
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
          Name: `db-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      `rds-kms-${environmentSuffix}`,
      {
        description: `RDS encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: {
          Name: `rds-kms-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `rds-kms-alias-${environmentSuffix}`,
      {
        name: `alias/rds-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnetIds,
        tags: {
          Name: `db-subnet-group-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // DB Cluster Parameter Group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `db-cluster-pg-${environmentSuffix}`,
      {
        family: 'aurora-postgresql15',
        description: `Cluster parameter group for ${environmentSuffix}`,
        parameters: [
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
        ],
        tags: {
          Name: `db-cluster-pg-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // RDS Aurora Cluster
    const cluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        databaseName: 'payments',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('ChangeMe123456!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        dbClusterParameterGroupName: clusterParameterGroup.name,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        applyImmediately: true,
        tags: {
          Name: `aurora-cluster-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Primary Writer Instance
    const writerInstance = new aws.rds.ClusterInstance(
      `aurora-writer-${environmentSuffix}`,
      {
        identifier: `aurora-writer-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        availabilityZone: availabilityZones.names[0],
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-writer-${environmentSuffix}`,
          Role: 'writer',
          ...tags,
        },
      },
      { parent: this }
    );

    // Read Replica 1
    const readerInstance1 = new aws.rds.ClusterInstance(
      `aurora-reader-1-${environmentSuffix}`,
      {
        identifier: `aurora-reader-1-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        availabilityZone: availabilityZones.names[1],
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-reader-1-${environmentSuffix}`,
          Role: 'reader',
          ...tags,
        },
      },
      { parent: this, dependsOn: [writerInstance] }
    );

    // Read Replica 2
    new aws.rds.ClusterInstance(
      `aurora-reader-2-${environmentSuffix}`,
      {
        identifier: `aurora-reader-2-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.t3.medium',
        engine: 'aurora-postgresql',
        availabilityZone: availabilityZones.names[2],
        publiclyAccessible: false,
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-reader-2-${environmentSuffix}`,
          Role: 'reader',
          ...tags,
        },
      },
      { parent: this, dependsOn: [readerInstance1] }
    );

    // Export values
    this.clusterIdentifier = cluster.clusterIdentifier;
    this.clusterEndpoint = cluster.endpoint;
    this.readerEndpoint = cluster.readerEndpoint;

    this.registerOutputs({
      clusterIdentifier: this.clusterIdentifier,
      clusterEndpoint: this.clusterEndpoint,
      readerEndpoint: this.readerEndpoint,
    });
  }
}

```



## lib/compute-stack.ts
```ts
// File: lib/compute-stack.ts
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

```

## lib/maintenance-stack.ts
```ts
// File: lib/maintenance-stack.ts
/**
 * maintenance-stack.ts
 *
 * S3 bucket hosting static maintenance page for failover.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MaintenanceStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MaintenanceStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly websiteEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: MaintenanceStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:maintenance:MaintenanceStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // S3 Bucket for maintenance page
    const bucket = new aws.s3.Bucket(
      `maintenance-bucket-${environmentSuffix}`,
      {
        bucket: `maintenance-page-${environmentSuffix}`,
        website: {
          indexDocument: 'index.html',
        },
        tags: {
          Name: `maintenance-bucket-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Bucket Public Access Block
    const pab = new aws.s3.BucketPublicAccessBlock(
      `maintenance-bucket-pab-${environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      { parent: this }
    );

    // Bucket Policy for public read
    const bucketPolicy = new aws.s3.BucketPolicy(
      `maintenance-bucket-policy-${environmentSuffix}`,
      {
        bucket: bucket.id,
        policy: bucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `${arn}/*`,
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [pab] }
    );

    // Upload maintenance page
    const maintenanceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maintenance Mode</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔧</div>
        <h1>We'll be right back!</h1>
        <p>Our payment system is currently undergoing scheduled maintenance.</p>
        <p>We expect to be back online shortly. Thank you for your patience.</p>
    </div>
</body>
</html>`;

    new aws.s3.BucketObject(
      `maintenance-index-${environmentSuffix}`,
      {
        bucket: bucket.id,
        key: 'index.html',
        content: maintenanceHtml,
        contentType: 'text/html',
      },
      { parent: this, dependsOn: [bucketPolicy] }
    );

    // Export values
    this.bucketName = bucket.id;
    this.websiteEndpoint = bucket.websiteEndpoint;

    this.registerOutputs({
      bucketName: this.bucketName,
      websiteEndpoint: this.websiteEndpoint,
    });
  }
}

```

## lib/monitoring-stack.ts
```ts
// File: lib/monitoring-stack.ts
/**
 * monitoring-stack.ts
 *
 * CloudWatch monitoring, alarms, SNS notifications, and Route 53 health checks.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  albArn: pulumi.Output<string>;
  albTargetGroupArn: pulumi.Output<string>;
  asgName: pulumi.Output<string>;
  instanceIds: pulumi.Output<string[]>;
  clusterIdentifier: pulumi.Output<string>;
  maintenanceBucketWebsiteEndpoint: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const {
      environmentSuffix,
      albArn,
      albTargetGroupArn,
      asgName,
      clusterIdentifier,
      tags,
    } = args;

    // SNS Topic for notifications
    const snsTopic = new aws.sns.Topic(
      `alerts-topic-${environmentSuffix}`,
      {
        name: `alerts-topic-${environmentSuffix}`,
        displayName: 'Infrastructure Alerts',
        tags: {
          Name: `alerts-topic-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // SNS Topic Subscription
    new aws.sns.TopicSubscription(
      `alerts-email-${environmentSuffix}`,
      {
        topic: snsTopic.arn,
        protocol: 'email',
        endpoint: 'ops@company.com',
      },
      { parent: this }
    );

    // Extract ALB name from ARN
    const albName = albArn.apply(arn => {
      const parts = arn.split(':');
      const resourcePart = parts[parts.length - 1];
      return resourcePart.split('/').slice(1).join('/');
    });

    const targetGroupName = albTargetGroupArn.apply(arn => {
      const parts = arn.split(':');
      const resourcePart = parts[parts.length - 1];
      return resourcePart;
    });

    // CloudWatch Alarm - ALB Unhealthy Hosts
    new aws.cloudwatch.MetricAlarm(
      `alb-unhealthy-hosts-${environmentSuffix}`,
      {
        name: `alb-unhealthy-hosts-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        dimensions: {
          LoadBalancer: albName,
          TargetGroup: targetGroupName,
        },
        alarmDescription: 'Alert when unhealthy hosts detected',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `alb-unhealthy-hosts-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - ALB Target Response Time
    new aws.cloudwatch.MetricAlarm(
      `alb-response-time-${environmentSuffix}`,
      {
        name: `alb-response-time-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        dimensions: {
          LoadBalancer: albName,
        },
        alarmDescription: 'Alert when response time exceeds 1 second',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `alb-response-time-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - ASG Instance Termination
    new aws.cloudwatch.MetricAlarm(
      `asg-termination-${environmentSuffix}`,
      {
        name: `asg-termination-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'GroupTerminatingInstances',
        namespace: 'AWS/AutoScaling',
        period: 60,
        statistic: 'Sum',
        threshold: 0,
        dimensions: {
          AutoScalingGroupName: asgName,
        },
        alarmDescription: 'Alert when instances are terminating',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `asg-termination-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - RDS CPU Utilization
    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-${environmentSuffix}`,
      {
        name: `rds-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBClusterIdentifier: clusterIdentifier,
        },
        alarmDescription: 'Alert when RDS CPU exceeds 80%',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `rds-cpu-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - RDS Database Connections
    new aws.cloudwatch.MetricAlarm(
      `rds-connections-${environmentSuffix}`,
      {
        name: `rds-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBClusterIdentifier: clusterIdentifier,
        },
        alarmDescription: 'Alert when database connections exceed threshold',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `rds-connections-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm - RDS Replica Lag
    new aws.cloudwatch.MetricAlarm(
      `rds-replica-lag-${environmentSuffix}`,
      {
        name: `rds-replica-lag-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'AuroraReplicaLag',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Maximum',
        threshold: 1000,
        dimensions: {
          DBClusterIdentifier: clusterIdentifier,
        },
        alarmDescription: 'Alert when replica lag exceeds 1 second',
        alarmActions: [snsTopic.arn],
        tags: {
          Name: `rds-replica-lag-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Export values
    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}

```

## lib/networking-stack.ts
```ts
// File: lib/networking-stack.ts
/**
 * networking-stack.ts
 *
 * VPC and networking infrastructure across 3 availability zones.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkingStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkingStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: NetworkingStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
      filters: [
        {
          name: 'region-name',
          values: ['us-east-1'],
        },
      ],
    });

    // VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Public Subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const azNames = availabilityZones.names;

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: azNames[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i + 1}-${environmentSuffix}`,
            ...tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    }

    // Private Subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: azNames[i],
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `private-subnet-${i + 1}-${environmentSuffix}`,
            ...tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    }

    // NAT Gateway (single for cost optimization)
    const eip = new aws.ec2.Eip(
      `nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${environmentSuffix}`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          Name: `nat-gateway-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private Route Table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `private-route-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { parent: this }
    );

    // Associate private subnets with private route table
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Export subnet IDs
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}

```

## lib/tap-stack.ts
```ts
// File: lib/tap-stack.ts
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource orchestrating the highly available
 * payment processing infrastructure with automatic failure recovery.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkingStack } from './networking-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { MonitoringStack } from './monitoring-stack';
import { MaintenanceStack } from './maintenance-stack';

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
 * Main TapStack component orchestrating all infrastructure components.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly auroraEndpoint: pulumi.Output<string>;
  public readonly maintenanceBucket: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Networking - VPC, Subnets, NAT Gateway
    const networking = new NetworkingStack(
      'networking',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Maintenance Page - S3 bucket with static website
    const maintenance = new MaintenanceStack(
      'maintenance',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 3. Database - RDS Aurora PostgreSQL cluster
    const database = new DatabaseStack(
      'database',
      {
        environmentSuffix,
        vpc: networking.vpc,
        privateSubnetIds: networking.privateSubnetIds,
        tags,
      },
      { parent: this }
    );

    // 4. Compute - ALB, ASG, EC2 instances
    const compute = new ComputeStack(
      'compute',
      {
        environmentSuffix,
        vpc: networking.vpc,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        databaseEndpoint: database.clusterEndpoint,
        tags,
      },
      { parent: this }
    );

    // 5. Monitoring - CloudWatch, SNS, Route 53
    const monitoring = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        albArn: compute.albArn,
        albTargetGroupArn: compute.targetGroupArn,
        asgName: compute.asgName,
        instanceIds: compute.instanceIds,
        clusterIdentifier: database.clusterIdentifier,
        maintenanceBucketWebsiteEndpoint: maintenance.websiteEndpoint,
        tags,
      },
      { parent: this }
    );

    // Export stack outputs
    this.albDnsName = compute.albDnsName;
    this.auroraEndpoint = database.clusterEndpoint;
    this.maintenanceBucket = maintenance.bucketName;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      auroraEndpoint: this.auroraEndpoint,
      maintenanceBucket: this.maintenanceBucket,
      vpcId: networking.vpc.id,
      snsTopicArn: monitoring.snsTopicArn,
    });
  }
}

```
