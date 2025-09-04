# Highly Available and Scalable Web Application Infrastructure

I'll help you create a comprehensive Pulumi JavaScript infrastructure for a highly available and scalable web application. This solution will implement all your requirements with proper VPC setup, auto-scaling, S3 static hosting, and security best practices.

## lib/tap-stack.mjs

```javascript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod'). Defaults to 'dev' if not provided.
 * @property {Object<string, string>} [tags] - Optional default tags to apply to resources.
 */

/**
 * Represents the main Pulumi component resource for the TAP project.
 * Implements a highly available and scalable web application infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const tags = args?.tags || {
      Environment: environmentSuffix,
      Project: 'TapStack',
      ManagedBy: 'Pulumi'
    };

    // Get available AZs in us-west-2
    const availableAzs = aws.getAvailabilityZones({
      state: 'available',
    });

    // VPC Configuration
    const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `tap-vpc-${environmentSuffix}` },
    }, { parent: this });

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...tags, Name: `tap-igw-${environmentSuffix}` },
    }, { parent: this });

    // Public Subnets (across 2 AZs for HA)
    const publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`tap-public-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availableAzs.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `tap-public-subnet-${i + 1}-${environmentSuffix}`, Type: 'Public' },
      }, { parent: this });
      publicSubnets.push(subnet);
    }

    // Private Subnets (across 2 AZs for HA)
    const privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(`tap-private-subnet-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availableAzs.then(azs => azs.names[i]),
        tags: { ...tags, Name: `tap-private-subnet-${i + 1}-${environmentSuffix}`, Type: 'Private' },
      }, { parent: this });
      privateSubnets.push(subnet);
    }

    // NAT Gateways (one per AZ for HA)
    const natGateways = [];
    for (let i = 0; i < 2; i++) {
      const eip = new aws.ec2.Eip(`tap-nat-eip-${i + 1}-${environmentSuffix}`, {
        domain: 'vpc',
        tags: { ...tags, Name: `tap-nat-eip-${i + 1}-${environmentSuffix}` },
      }, { parent: this });

      const natGw = new aws.ec2.NatGateway(`tap-nat-gateway-${i + 1}-${environmentSuffix}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: { ...tags, Name: `tap-nat-gateway-${i + 1}-${environmentSuffix}` },
      }, { parent: this, dependsOn: [igw] });
      
      natGateways.push(natGw);
    }

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: { ...tags, Name: `tap-public-rt-${environmentSuffix}` },
    }, { parent: this });

    new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`tap-public-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    // Private route tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`tap-private-rt-${i + 1}-${environmentSuffix}`, {
        vpcId: vpc.id,
        tags: { ...tags, Name: `tap-private-rt-${i + 1}-${environmentSuffix}` },
      }, { parent: this });

      new aws.ec2.Route(`tap-private-route-${i + 1}-${environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`tap-private-rta-${i + 1}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Security Groups
    const albSg = new aws.ec2.SecurityGroup(`tap-alb-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for Application Load Balancer',
      ingress: [
        { fromPort: 80, toPort: 80, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
        { fromPort: 443, toPort: 443, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags, Name: `tap-alb-sg-${environmentSuffix}` },
    }, { parent: this });

    const webSg = new aws.ec2.SecurityGroup(`tap-web-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for web servers',
      ingress: [
        { fromPort: 80, toPort: 80, protocol: 'tcp', securityGroups: [albSg.id] },
        { fromPort: 22, toPort: 22, protocol: 'tcp', cidrBlocks: ['10.0.0.0/16'] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags, Name: `tap-web-sg-${environmentSuffix}` },
    }, { parent: this });

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
        }],
      }),
      tags,
    }, { parent: this });

    // IAM Policy for S3 access
    const s3Policy = new aws.iam.RolePolicy(`tap-s3-policy-${environmentSuffix}`, {
      role: ec2Role.id,
      policy: pulumi.output(pulumi.all([]).apply(() => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          Resource: [
            `arn:aws:s3:::tap-static-assets-${environmentSuffix}`,
            `arn:aws:s3:::tap-static-assets-${environmentSuffix}/*`,
          ],
        }],
      }))),
    }, { parent: this });

    // Attach AWS managed policies
    new aws.iam.RolePolicyAttachment(`tap-ssm-policy-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`tap-cloudwatch-policy-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    }, { parent: this });

    const instanceProfile = new aws.iam.InstanceProfile(`tap-instance-profile-${environmentSuffix}`, {
      role: ec2Role.name,
      tags,
    }, { parent: this });

    // S3 Bucket for static assets
    const staticBucket = new aws.s3.Bucket(`tap-static-assets-${environmentSuffix}`, {
      bucket: `tap-static-assets-${environmentSuffix}-${Date.now()}`,
      tags,
    }, { parent: this });

    // S3 Bucket website configuration
    new aws.s3.BucketWebsiteConfiguration(`tap-static-website-${environmentSuffix}`, {
      bucket: staticBucket.id,
      indexDocument: { suffix: 'index.html' },
      errorDocument: { key: 'error.html' },
    }, { parent: this });

    // S3 Bucket public access block (allow public read)
    new aws.s3.BucketPublicAccessBlock(`tap-static-pab-${environmentSuffix}`, {
      bucket: staticBucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false,
    }, { parent: this });

    // S3 Bucket policy for public read access
    new aws.s3.BucketPolicy(`tap-static-policy-${environmentSuffix}`, {
      bucket: staticBucket.id,
      policy: staticBucket.id.apply(bucketName => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`,
        }],
      })),
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI
    const amiId = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*'] },
        { name: 'architecture', values: ['x86_64'] },
      ],
    });

    // Launch Template with user data
    const launchTemplate = new aws.ec2.LaunchTemplate(`tap-launch-template-${environmentSuffix}`, {
      namePrefix: `tap-template-${environmentSuffix}-`,
      imageId: amiId.then(ami => ami.id),
      instanceType: 't3.micro',
      iamInstanceProfile: { name: instanceProfile.name },
      vpcSecurityGroupIds: [webSg.id],
      userData: pulumi.output(staticBucket.id).apply(bucketName => 
        Buffer.from(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TAP Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #dff0d8; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>TAP Highly Available Web Application</h1>
        <div class="status">
            <h2>Application Status: Running</h2>
            <p>Instance ID: \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p>Availability Zone: \$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p>Static Assets Bucket: ${bucketName}</p>
        </div>
    </div>
</body>
</html>
EOF

# Configure httpd to serve content
chown apache:apache /var/www/html/index.html
systemctl restart httpd
`).toString('base64')
      ),
      tagSpecifications: [{
        resourceType: 'instance',
        tags: { ...tags, Name: `tap-web-instance-${environmentSuffix}` },
      }],
      tags,
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`tap-alb-${environmentSuffix}`, {
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSg.id],
      tags: { ...tags, Name: `tap-alb-${environmentSuffix}` },
    }, { parent: this });

    // ALB Target Group
    const targetGroup = new aws.lb.TargetGroup(`tap-tg-${environmentSuffix}`, {
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200',
        path: '/',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: { ...tags, Name: `tap-tg-${environmentSuffix}` },
    }, { parent: this });

    // ALB Listener
    new aws.lb.Listener(`tap-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: '80',
      protocol: 'HTTP',
      defaultActions: [{
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      }],
      tags,
    }, { parent: this });

    // Auto Scaling Group
    const asg = new aws.autoscaling.Group(`tap-asg-${environmentSuffix}`, {
      vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 10,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tags: Object.entries({ ...tags, Name: `tap-asg-${environmentSuffix}` }).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    }, { parent: this });

    // Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscaling.Policy(`tap-scale-up-${environmentSuffix}`, {
      scalingAdjustment: 2,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      policyType: 'SimpleScaling',
    }, { parent: this });

    const scaleDownPolicy = new aws.autoscaling.Policy(`tap-scale-down-${environmentSuffix}`, {
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      policyType: 'SimpleScaling',
    }, { parent: this });

    // CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(`tap-high-cpu-${environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [scaleUpPolicy.arn],
      dimensions: {
        AutoScalingGroupName: asg.name,
      },
      tags,
    }, { parent: this });

    new aws.cloudwatch.MetricAlarm(`tap-low-cpu-${environmentSuffix}`, {
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 20,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [scaleDownPolicy.arn],
      dimensions: {
        AutoScalingGroupName: asg.name,
      },
      tags,
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      vpcId: vpc.id,
      publicSubnetIds: pulumi.all(publicSubnets.map(subnet => subnet.id)),
      privateSubnetIds: pulumi.all(privateSubnets.map(subnet => subnet.id)),
      albDnsName: alb.dnsName,
      albZoneId: alb.zoneId,
      staticBucketName: staticBucket.id,
      staticBucketWebsiteEndpoint: staticBucket.websiteEndpoint,
      asgName: asg.name,
    });

    // Export outputs for external access
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.staticBucketName = staticBucket.id;
    this.staticBucketWebsiteEndpoint = staticBucket.websiteEndpoint;
  }
}
```

This implementation provides:

1. **Multi-AZ VPC Setup**: VPC with public and private subnets across 2 availability zones in us-west-2
2. **High Availability**: NAT gateways in each AZ, auto scaling group spanning both AZs, ALB with health checks
3. **Auto Scaling**: Auto scaling group with CloudWatch alarms for CPU-based scaling (scale up at 70%, scale down at 20%)
4. **S3 Static Hosting**: Properly configured S3 bucket for static asset hosting with public read access
5. **Security**: IAM roles and policies following best practices, security groups with minimal required access
6. **Load Balancing**: Application Load Balancer distributing traffic across instances
7. **Modern Features**: Uses latest Amazon Linux 2, proper IAM instance profiles, and CloudWatch integration

The infrastructure automatically handles traffic spikes by scaling from 2 to 10 instances based on CPU utilization, ensures high availability by distributing resources across multiple AZs, and provides secure access to S3 for static content serving.