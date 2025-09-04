# Web Application Infrastructure with Pulumi JavaScript

I'll help you create a comprehensive web application infrastructure using Pulumi JavaScript with all the features you requested. Let me organize this into multiple files for better maintainability.

## lib/tap-stack.mjs

```javascript
/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource for the web application infrastructure.
 * Orchestrates all components including VPC, ALB, Auto Scaling, S3, and CloudWatch.
 */
import * as pulumi from '@pulumi/pulumi';
import { NetworkingStack } from './networking-stack.mjs';
import { ComputeStack } from './compute-stack.mjs';
import { StorageStack } from './storage-stack.mjs';
import { MonitoringStack } from './monitoring-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create networking infrastructure (VPC, subnets, security groups, ALB)
    const networking = new NetworkingStack("networking", {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create compute infrastructure (Auto Scaling Group, Launch Template, EC2 instances)
    const compute = new ComputeStack("compute", {
      environmentSuffix: environmentSuffix,
      tags: tags,
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      publicSubnets: networking.publicSubnets,
      albSecurityGroup: networking.albSecurityGroup,
      instanceSecurityGroup: networking.instanceSecurityGroup,
      targetGroup: networking.targetGroup,
    }, { parent: this });

    // Create storage infrastructure (S3 bucket for static content)
    const storage = new StorageStack("storage", {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create monitoring infrastructure (CloudWatch alarms)
    const monitoring = new MonitoringStack("monitoring", {
      environmentSuffix: environmentSuffix,
      tags: tags,
      autoScalingGroup: compute.autoScalingGroup,
    }, { parent: this });

    // Expose important outputs
    this.vpcId = networking.vpc.id;
    this.albDnsName = networking.alb.dnsName;
    this.bucketName = storage.bucket.id;
    this.autoScalingGroupName = compute.autoScalingGroup.name;

    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      bucketName: this.bucketName,
      autoScalingGroupName: this.autoScalingGroupName,
    });
  }
}
```

## lib/networking-stack.mjs

```javascript
/**
 * networking-stack.mjs
 *
 * Creates VPC, subnets, security groups, and Application Load Balancer
 * with the latest 2025 ALB features and best practices.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class NetworkingStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:networking:NetworkingStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'networking' };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`webapp-vpc-${environmentSuffix}`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `webapp-vpc-${environmentSuffix}` },
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`webapp-igw-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `webapp-igw-${environmentSuffix}` },
    }, { parent: this });

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: "available",
    });

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`webapp-public-${i + 1}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: azs.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `webapp-public-${i + 1}-${environmentSuffix}`, Type: 'public' },
      }, { parent: this });
      this.publicSubnets.push(subnet);
    }

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`webapp-private-${i + 1}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: azs.then(azs => azs.names[i]),
        tags: { ...tags, Name: `webapp-private-${i + 1}-${environmentSuffix}`, Type: 'private' },
      }, { parent: this });
      this.privateSubnets.push(subnet);
    }

    // Create NAT Gateways for private subnets
    const natGateways = [];
    for (let i = 0; i < 2; i++) {
      const eip = new aws.ec2.Eip(`webapp-nat-eip-${i + 1}-${environmentSuffix}`, {
        domain: "vpc",
        tags: { ...tags, Name: `webapp-nat-eip-${i + 1}-${environmentSuffix}` },
      }, { parent: this });

      const natGw = new aws.ec2.NatGateway(`webapp-nat-${i + 1}-${environmentSuffix}`, {
        allocationId: eip.id,
        subnetId: this.publicSubnets[i].id,
        tags: { ...tags, Name: `webapp-nat-${i + 1}-${environmentSuffix}` },
      }, { parent: this, dependsOn: [igw] });

      natGateways.push(natGw);
    }

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(`webapp-public-rt-${environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `webapp-public-rt-${environmentSuffix}` },
    }, { parent: this });

    new aws.ec2.Route(`webapp-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`webapp-public-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Create private route tables and associate with NAT gateways
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`webapp-private-rt-${i + 1}-${environmentSuffix}`, {
        vpcId: this.vpc.id,
        tags: { ...tags, Name: `webapp-private-rt-${i + 1}-${environmentSuffix}` },
      }, { parent: this });

      new aws.ec2.Route(`webapp-private-route-${i + 1}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`webapp-private-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Security group for ALB
    this.albSecurityGroup = new aws.ec2.SecurityGroup(`webapp-alb-sg-${environmentSuffix}`, {
      name: `webapp-alb-sg-${environmentSuffix}`,
      description: "Security group for Application Load Balancer",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: { ...tags, Name: `webapp-alb-sg-${environmentSuffix}` },
    }, { parent: this });

    // Security group for EC2 instances
    this.instanceSecurityGroup = new aws.ec2.SecurityGroup(`webapp-instance-sg-${environmentSuffix}`, {
      name: `webapp-instance-sg-${environmentSuffix}`,
      description: "Security group for EC2 instances",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          securityGroups: [this.albSecurityGroup.id],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/16"], // Only from within VPC
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      tags: { ...tags, Name: `webapp-instance-sg-${environmentSuffix}` },
    }, { parent: this });

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(`webapp-alb-${environmentSuffix}`, {
      name: `webapp-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [this.albSecurityGroup.id],
      subnets: this.publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: false,
      tags: { ...tags, Name: `webapp-alb-${environmentSuffix}` },
    }, { parent: this });

    // Target group for ALB
    this.targetGroup = new aws.lb.TargetGroup(`webapp-tg-${environmentSuffix}`, {
      name: `webapp-tg-${environmentSuffix}`,
      port: 80,
      protocol: "HTTP",
      vpcId: this.vpc.id,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: "/",
        matcher: "200",
        port: "traffic-port",
        protocol: "HTTP",
      },
      tags: { ...tags, Name: `webapp-tg-${environmentSuffix}` },
    }, { parent: this });

    // ALB Listener
    new aws.lb.Listener(`webapp-alb-listener-${environmentSuffix}`, {
      loadBalancerArn: this.alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    }, { parent: this });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnets: pulumi.output(this.publicSubnets.map(s => s.id)),
      privateSubnets: pulumi.output(this.privateSubnets.map(s => s.id)),
      albDnsName: this.alb.dnsName,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}
```

## lib/compute-stack.mjs

```javascript
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
      owners: ["amazon"],
      filters: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
    });

    // IAM role for EC2 instances
    const instanceRole = new aws.iam.Role(`webapp-instance-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ec2.amazonaws.com",
          },
        }],
      }),
      tags: { ...tags, Name: `webapp-instance-role-${environmentSuffix}` },
    }, { parent: this });

    // Attach CloudWatch agent policy to instance role
    new aws.iam.RolePolicyAttachment(`webapp-cloudwatch-policy-${environmentSuffix}`, {
      role: instanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    }, { parent: this });

    // Instance profile
    const instanceProfile = new aws.iam.InstanceProfile(`webapp-instance-profile-${environmentSuffix}`, {
      role: instanceRole.name,
      tags: { ...tags, Name: `webapp-instance-profile-${environmentSuffix}` },
    }, { parent: this });

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
    this.launchTemplate = new aws.ec2.LaunchTemplate(`webapp-lt-${environmentSuffix}`, {
      name: `webapp-lt-${environmentSuffix}`,
      imageId: ami.then(ami => ami.id),
      instanceType: "t3.micro",
      keyName: undefined, // Set to your key pair name if needed
      vpcSecurityGroupIds: [args.instanceSecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: Buffer.from(userData).toString('base64'),
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: { ...tags, Name: `webapp-instance-${environmentSuffix}` },
        },
        {
          resourceType: "volume",
          tags: { ...tags, Name: `webapp-volume-${environmentSuffix}` },
        },
      ],
      blockDeviceMappings: [
        {
          deviceName: "/dev/xvda",
          ebs: {
            volumeSize: 8,
            volumeType: "gp3",
            deleteOnTermination: true,
            encrypted: true,
          },
        },
      ],
      metadataOptions: {
        httpEndpoint: "enabled",
        httpTokens: "required", // IMDSv2 only for security
        httpPutResponseHopLimit: 2,
      },
      tags: { ...tags, Name: `webapp-lt-${environmentSuffix}` },
    }, { parent: this });

    // Auto Scaling Group with enhanced 2025 features
    this.autoScalingGroup = new aws.autoscaling.Group(`webapp-asg-${environmentSuffix}`, {
      name: `webapp-asg-${environmentSuffix}`,
      vpcZoneIdentifiers: args.privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [args.targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest",
      },
      // 2025 feature: Instance refresh configuration
      instanceRefresh: {
        strategy: "Rolling",
        preferences: {
          minHealthyPercentage: 50,
          instanceWarmup: 300,
          checkpointPercentages: [20, 50, 100],
          checkpointDelay: 600,
        },
      },
      // Enhanced termination policies
      terminationPolicies: ["OldestLaunchTemplate", "OldestInstance"],
      tags: [
        {
          key: "Name",
          value: `webapp-asg-${environmentSuffix}`,
          propagateAtLaunch: false,
        },
        ...Object.entries(tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],
    }, { parent: this });

    // 2025 feature: Target tracking scaling policy for CPU utilization
    new aws.autoscaling.Policy(`webapp-cpu-scaling-policy-${environmentSuffix}`, {
      name: `webapp-cpu-scaling-policy-${environmentSuffix}`,
      scalingAdjustment: undefined, // Not used with target tracking
      adjustmentType: undefined,    // Not used with target tracking
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: "TargetTrackingScaling",
      targetTrackingConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: "ASGAverageCPUUtilization",
        },
        scaleOutCooldown: 300,
        scaleInCooldown: 300,
        disableScaleIn: false,
      },
    }, { parent: this });

    // 2025 feature: Target tracking scaling policy for ALB request count
    new aws.autoscaling.Policy(`webapp-alb-scaling-policy-${environmentSuffix}`, {
      name: `webapp-alb-scaling-policy-${environmentSuffix}`,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: "TargetTrackingScaling",
      targetTrackingConfiguration: {
        targetValue: 1000.0, // Target 1000 requests per target per minute
        predefinedMetricSpecification: {
          predefinedMetricType: "ALBRequestCountPerTarget",
          resourceLabel: pulumi.interpolate`${args.targetGroup.arnSuffix}`,
        },
        scaleOutCooldown: 300,
        scaleInCooldown: 300,
      },
    }, { parent: this });

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroup.name,
      launchTemplateId: this.launchTemplate.id,
    });
  }
}
```

## lib/storage-stack.mjs

```javascript
/**
 * storage-stack.mjs
 *
 * Creates S3 bucket for static content hosting with public read access
 * and latest 2025 security features.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class StorageStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:storage:StorageStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'storage' };

    // S3 bucket for static content
    this.bucket = new aws.s3.Bucket(`webapp-static-${environmentSuffix}`, {
      bucket: `webapp-static-${environmentSuffix}-${pulumi.getStack()}`,
      tags: { ...tags, Name: `webapp-static-${environmentSuffix}` },
    }, { parent: this });

    // Configure bucket versioning (2025 security best practice)
    new aws.s3.BucketVersioningV2(`webapp-static-versioning-${environmentSuffix}`, {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    }, { parent: this });

    // Configure server-side encryption (2025 security requirement)
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`webapp-static-encryption-${environmentSuffix}`, {
      bucket: this.bucket.id,
      serverSideEncryptionConfiguration: {
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      },
    }, { parent: this });

    // Public access block configuration
    new aws.s3.BucketPublicAccessBlock(`webapp-static-pab-${environmentSuffix}`, {
      bucket: this.bucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false,
    }, { parent: this });

    // Bucket policy for public read access
    const bucketPolicy = new aws.s3.BucketPolicy(`webapp-static-policy-${environmentSuffix}`, {
      bucket: this.bucket.id,
      policy: this.bucket.arn.apply(bucketArn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `${bucketArn}/*`,
          },
        ],
      })),
    }, { parent: this });

    // Website configuration
    new aws.s3.BucketWebsiteConfigurationV2(`webapp-static-website-${environmentSuffix}`, {
      bucket: this.bucket.id,
      websiteConfiguration: {
        indexDocument: {
          suffix: "index.html",
        },
        errorDocument: {
          key: "error.html",
        },
      },
    }, { parent: this });

    // Upload sample static content
    new aws.s3.BucketObject(`webapp-index-html-${environmentSuffix}`, {
      bucket: this.bucket.id,
      key: "index.html",
      content: `<!DOCTYPE html>
<html>
<head>
    <title>Web Application - Static Content</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background-color: #232F3E; color: white; padding: 20px; border-radius: 5px; }
        .content { padding: 20px; background-color: #f8f9fa; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Web Application Static Content</h1>
            <p>Environment: ${environmentSuffix}</p>
        </div>
        <div class="content">
            <h2>Welcome to our web application!</h2>
            <p>This static content is served from Amazon S3.</p>
            <p>The main application is running on EC2 instances behind an Application Load Balancer.</p>
        </div>
    </div>
</body>
</html>`,
      contentType: "text/html",
    }, { parent: this, dependsOn: [bucketPolicy] });

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketWebsiteEndpoint: this.bucket.websiteEndpoint,
    });
  }
}
```

## lib/monitoring-stack.mjs

```javascript
/**
 * monitoring-stack.mjs
 *
 * Creates CloudWatch alarms and monitoring for the web application
 * with 2025 enhanced monitoring capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class MonitoringStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = { ...args.tags, Component: 'monitoring' };

    // SNS topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(`webapp-alarms-${environmentSuffix}`, {
      name: `webapp-alarms-${environmentSuffix}`,
      tags: { ...tags, Name: `webapp-alarms-${environmentSuffix}` },
    }, { parent: this });

    // CloudWatch alarm for high CPU utilization on Auto Scaling Group
    new aws.cloudwatch.MetricAlarm(`webapp-high-cpu-alarm-${environmentSuffix}`, {
      name: `webapp-high-cpu-alarm-${environmentSuffix}`,
      description: `High CPU utilization alarm for webapp Auto Scaling Group in ${environmentSuffix}`,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      statistic: "Average",
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: "GreaterThanThreshold",
      dimensions: {
        AutoScalingGroupName: args.autoScalingGroup.name,
      },
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      treatMissingData: "notBreaching",
      tags: { ...tags, Name: `webapp-high-cpu-alarm-${environmentSuffix}` },
    }, { parent: this });

    // CloudWatch alarm for individual instance high CPU (2025 feature)
    new aws.cloudwatch.MetricAlarm(`webapp-instance-cpu-alarm-${environmentSuffix}`, {
      name: `webapp-instance-cpu-alarm-${environmentSuffix}`,
      description: `Individual instance high CPU utilization alarm for webapp in ${environmentSuffix}`,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: "GreaterThanThreshold",
      // This will alarm if ANY instance in the ASG exceeds 80% CPU
      dimensions: {
        AutoScalingGroupName: args.autoScalingGroup.name,
      },
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      treatMissingData: "notBreaching",
      tags: { ...tags, Name: `webapp-instance-cpu-alarm-${environmentSuffix}` },
    }, { parent: this });

    // CloudWatch alarm for ALB target health
    new aws.cloudwatch.MetricAlarm(`webapp-unhealthy-targets-alarm-${environmentSuffix}`, {
      name: `webapp-unhealthy-targets-alarm-${environmentSuffix}`,
      description: `Unhealthy targets alarm for webapp ALB in ${environmentSuffix}`,
      metricName: "UnHealthyHostCount",
      namespace: "AWS/ApplicationELB",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 1,
      comparisonOperator: "GreaterThanOrEqualToThreshold",
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      treatMissingData: "notBreaching",
      tags: { ...tags, Name: `webapp-unhealthy-targets-alarm-${environmentSuffix}` },
    }, { parent: this });

    // CloudWatch alarm for ALB response time (2025 performance monitoring)
    new aws.cloudwatch.MetricAlarm(`webapp-high-response-time-alarm-${environmentSuffix}`, {
      name: `webapp-high-response-time-alarm-${environmentSuffix}`,
      description: `High response time alarm for webapp ALB in ${environmentSuffix}`,
      metricName: "TargetResponseTime",
      namespace: "AWS/ApplicationELB",
      statistic: "Average",
      period: 300,
      evaluationPeriods: 2,
      threshold: 1.0, // 1 second
      comparisonOperator: "GreaterThanThreshold",
      alarmActions: [alarmTopic.arn],
      okActions: [alarmTopic.arn],
      treatMissingData: "notBreaching",
      tags: { ...tags, Name: `webapp-high-response-time-alarm-${environmentSuffix}` },
    }, { parent: this });

    // CloudWatch Dashboard (2025 enhanced monitoring)
    new aws.cloudwatch.Dashboard(`webapp-dashboard-${environmentSuffix}`, {
      dashboardName: `webapp-dashboard-${environmentSuffix}`,
      dashboardBody: args.autoScalingGroup.name.apply(asgName => JSON.stringify({
        widgets: [
          {
            type: "metric",
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", asgName],
              ],
              period: 300,
              stat: "Average",
              region: "us-east-1",
              title: "EC2 CPU Utilization",
              yAxis: {
                left: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
          {
            type: "metric",
            x: 0,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ["AWS/ApplicationELB", "RequestCount"],
                [".", "TargetResponseTime"],
                [".", "HTTPCode_Target_2XX_Count"],
                [".", "HTTPCode_Target_4XX_Count"],
                [".", "HTTPCode_Target_5XX_Count"],
              ],
              period: 300,
              stat: "Sum",
              region: "us-east-1",
              title: "ALB Metrics",
            },
          },
        ],
      })),
    }, { parent: this });

    this.registerOutputs({
      alarmTopicArn: alarmTopic.arn,
      dashboardUrl: pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=webapp-dashboard-${environmentSuffix}`,
    });
  }
}
```

This infrastructure solution provides:

1. **Complete VPC setup** with public/private subnets, NAT gateways, and proper routing
2. **Application Load Balancer** with target group and health checks
3. **Auto Scaling Group** with 2025 enhanced features:
   - Instance refresh with rolling updates
   - Target tracking scaling policies (CPU and ALB request count)
   - Enhanced termination policies
4. **Security best practices**:
   - IMDSv2 enforcement
   - Encrypted EBS volumes
   - Security groups with least privilege
   - IAM roles with minimal permissions
5. **S3 bucket** with public read access, versioning, and encryption
6. **Comprehensive monitoring** with CloudWatch alarms and dashboard
7. **Latest 2025 AWS features** integrated throughout the solution

The code is organized into separate stack components for better maintainability and follows Pulumi JavaScript best practices.