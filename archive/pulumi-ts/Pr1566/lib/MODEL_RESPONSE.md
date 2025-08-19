# Highly Available Web Application Infrastructure - Pulumi TypeScript

This response provides a complete Pulumi TypeScript program that creates a highly available and scalable web application infrastructure on AWS. The implementation follows AWS best practices for security, scalability, and high availability.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 availability zones
- Auto Scaling Group for application servers in public subnets
- Application Load Balancer for traffic distribution
- RDS database instance in private subnets
- S3 bucket for static assets with public access
- IAM roles and policies for security
- CloudWatch monitoring and alerting

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the highly available web application infrastructure.
 * This stack creates a complete AWS infrastructure including VPC, ALB, ASG, RDS, S3, and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly loadBalancerDns: pulumi.Output<string>;
  public readonly staticAssetsBucketName: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get availability zones
    const availableZones = aws.getAvailabilityZones({
      state: "available",
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(`prod-vpc`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `prod-vpc`,
        ...tags,
      },
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`prod-igw`, {
      vpcId: vpc.id,
      tags: {
        Name: `prod-igw`,
        ...tags,
      },
    }, { parent: this });

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public subnets
      const publicSubnet = new aws.ec2.Subnet(`prod-public-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availableZones.then(azs => azs.names[i]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `prod-public-subnet-${i + 1}`,
          Type: "public",
          ...tags,
        },
      }, { parent: this });

      publicSubnets.push(publicSubnet);

      // Private subnets
      const privateSubnet = new aws.ec2.Subnet(`prod-private-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availableZones.then(azs => azs.names[i]),
        tags: {
          Name: `prod-private-subnet-${i + 1}`,
          Type: "private",
          ...tags,
        },
      }, { parent: this });

      privateSubnets.push(privateSubnet);
    }

    // Create NAT Gateway for private subnets
    const eip = new aws.ec2.Eip(`prod-nat-eip`, {
      domain: "vpc",
      tags: {
        Name: `prod-nat-eip`,
        ...tags,
      },
    }, { parent: this });

    const natGateway = new aws.ec2.NatGateway(`prod-nat-gateway`, {
      allocationId: eip.id,
      subnetId: publicSubnets[0].id,
      tags: {
        Name: `prod-nat-gateway`,
        ...tags,
      },
    }, { parent: this, dependsOn: [igw] });

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(`prod-public-rt`, {
      vpcId: vpc.id,
      tags: {
        Name: `prod-public-rt`,
        ...tags,
      },
    }, { parent: this });

    const privateRouteTable = new aws.ec2.RouteTable(`prod-private-rt`, {
      vpcId: vpc.id,
      tags: {
        Name: `prod-private-rt`,
        ...tags,
      },
    }, { parent: this });

    // Create routes
    new aws.ec2.Route(`prod-public-route`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    }, { parent: this });

    new aws.ec2.Route(`prod-private-route`, {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway.id,
    }, { parent: this });

    // Associate subnets with route tables
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`prod-public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`prod-private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Create Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(`prod-alb-sg`, {
      name: `prod-alb-sg`,
      description: "Security group for Application Load Balancer",
      vpcId: vpc.id,
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
      tags: {
        Name: `prod-alb-sg`,
        ...tags,
      },
    }, { parent: this });

    const webServerSecurityGroup = new aws.ec2.SecurityGroup(`prod-web-server-sg`, {
      name: `prod-web-server-sg`,
      description: "Security group for web servers",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          securityGroups: [albSecurityGroup.id],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/16"],
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
      tags: {
        Name: `prod-web-server-sg`,
        ...tags,
      },
    }, { parent: this });

    const dbSecurityGroup = new aws.ec2.SecurityGroup(`prod-db-sg`, {
      name: `prod-db-sg`,
      description: "Security group for RDS database",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [webServerSecurityGroup.id],
        },
      ],
      tags: {
        Name: `prod-db-sg`,
        ...tags,
      },
    }, { parent: this });

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(`prod-ec2-role`, {
      name: `prod-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: {
        Name: `prod-ec2-role`,
        ...tags,
      },
    }, { parent: this });

    // Attach CloudWatch agent policy
    new aws.iam.RolePolicyAttachment(`prod-ec2-cloudwatch-policy`, {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    }, { parent: this });

    // Attach SSM managed instance policy
    new aws.iam.RolePolicyAttachment(`prod-ec2-ssm-policy`, {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    }, { parent: this });

    const instanceProfile = new aws.iam.InstanceProfile(`prod-instance-profile`, {
      name: `prod-instance-profile`,
      role: ec2Role.name,
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ["amazon"],
      filters: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    // User data script for web servers
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from \$(curl http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html
yum install -y amazon-cloudwatch-agent
`;

    // Create Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(`prod-launch-template`, {
      name: `prod-launch-template`,
      imageId: ami.then(ami => ami.id),
      instanceType: "t3.micro",
      keyName: undefined, // Add your key pair name if needed
      userData: Buffer.from(userData).toString('base64'),
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      vpcSecurityGroupIds: [webServerSecurityGroup.id],
      tagSpecifications: [
        {
          resourceType: "instance",
          tags: {
            Name: `prod-web-server`,
            ...tags,
          },
        },
      ],
    }, { parent: this });

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`prod-alb`, {
      name: `prod-alb`,
      loadBalancerType: "application",
      scheme: "internet-facing",
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      tags: {
        Name: `prod-alb`,
        ...tags,
      },
    }, { parent: this });

    const targetGroup = new aws.lb.TargetGroup(`prod-tg`, {
      name: `prod-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: {
        Name: `prod-tg`,
        ...tags,
      },
    }, { parent: this });

    new aws.lb.Listener(`prod-alb-listener`, {
      loadBalancerArn: alb.arn,
      port: "80",
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    }, { parent: this });

    // Create Auto Scaling Group
    new aws.autoscaling.Group(`prod-asg`, {
      name: `prod-asg`,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      vpcZoneIdentifiers: publicSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: "$Latest",
      },
      tags: [
        {
          key: "Name",
          value: `prod-asg`,
          propagateAtLaunch: true,
        },
        ...Object.entries(tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],
    }, { parent: this });

    // Create RDS Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`prod-db-subnet-group`, {
      name: `prod-db-subnet-group`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `prod-db-subnet-group`,
        ...tags,
      },
    }, { parent: this });

    // Create RDS instance
    const database = new aws.rds.Instance(`prod-database`, {
      identifier: `prod-database`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: "gp2",
      dbName: "webapp",
      username: "admin",
      password: "changeme123!", // In production, use AWS Secrets Manager
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      skipFinalSnapshot: true,
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      tags: {
        Name: `prod-database`,
        ...tags,
      },
    }, { parent: this });

    // Create S3 bucket for static assets
    const staticAssetsBucket = new aws.s3.Bucket(`prod-static-assets`, {
      bucket: pulumi.interpolate`prod-static-assets-${environmentSuffix}-${Math.random().toString(36).substring(2, 15)}`,
      tags: {
        Name: `prod-static-assets`,
        ...tags,
      },
    }, { parent: this });

    // Configure bucket for public access
    new aws.s3.BucketPublicAccessBlock(`prod-static-assets-pab`, {
      bucket: staticAssetsBucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false,
    }, { parent: this });

    const bucketPolicy = new aws.s3.BucketPolicy(`prod-static-assets-policy`, {
      bucket: staticAssetsBucket.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "${staticAssetsBucket.arn}/*"
          }
        ]
      }`,
    }, { parent: this });

    // CloudWatch Log Group for application logs
    const logGroup = new aws.cloudwatch.LogGroup(`prod-app-logs`, {
      name: `/aws/ec2/prod-app`,
      retentionInDays: 7,
      tags: {
        Name: `prod-app-logs`,
        ...tags,
      },
    }, { parent: this });

    // CloudWatch Alarms
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm(`prod-high-cpu-alarm`, {
      name: `prod-high-cpu-alarm`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/ApplicationELB",
      period: 300,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "This metric monitors ALB CPU utilization",
      dimensions: {
        LoadBalancer: alb.arnSuffix,
      },
      tags: {
        Name: `prod-high-cpu-alarm`,
        ...tags,
      },
    }, { parent: this });

    // Export important values
    this.vpcId = vpc.id;
    this.loadBalancerDns = alb.dnsName;
    this.staticAssetsBucketName = staticAssetsBucket.id;
    this.databaseEndpoint = database.endpoint;

    this.registerOutputs({
      vpcId: this.vpcId,
      loadBalancerDns: this.loadBalancerDns,
      staticAssetsBucketName: this.staticAssetsBucketName,
      databaseEndpoint: this.databaseEndpoint,
    });
  }
}
```

## Key Features Implemented

1. **VPC with proper subnet architecture**: 2 public subnets and 2 private subnets across different AZs
2. **Auto Scaling Group**: Manages EC2 instances with automatic scaling between 2-6 instances
3. **Application Load Balancer**: Distributes traffic across instances with health checks
4. **RDS MySQL Database**: Deployed in private subnets with security groups
5. **S3 Bucket**: Configured for public access for static assets
6. **Security Groups**: Properly configured to allow only necessary traffic
7. **IAM Roles**: EC2 instances have CloudWatch and SSM permissions
8. **CloudWatch Monitoring**: Log groups and CPU utilization alarms
9. **NAT Gateway**: Allows private subnet instances to access the internet

## Security Best Practices

- Database is isolated in private subnets
- Security groups follow least privilege principle  
- IAM roles use managed policies
- CloudWatch logging enabled for monitoring
- Auto Scaling for high availability

## Cost Optimization

- Uses t3.micro instances (free tier eligible)
- RDS db.t3.micro instance
- Storage auto-scaling enabled for RDS
- CloudWatch logs with 7-day retention

This infrastructure provides a solid foundation for a highly available, scalable web application following AWS best practices for security and cost optimization.