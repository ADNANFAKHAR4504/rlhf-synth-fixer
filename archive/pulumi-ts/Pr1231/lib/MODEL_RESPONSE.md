# Secure Three-Tier Web Application with Pulumi and TypeScript

I'll create a comprehensive Infrastructure as Code solution that provisions a secure three-tier web application on AWS using Pulumi and TypeScript.

## Project Structure and Implementation

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get availability zones
const availabilityZones = aws.getAvailabilityZones({
  state: 'available',
});

// 1. NETWORKING - VPC with Public and Private Subnets
const vpc = new aws.ec2.Vpc('main-vpc', {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: 'main-vpc',
    Environment: 'production',
  },
});

// Internet Gateway for public subnets
const internetGateway = new aws.ec2.InternetGateway('main-igw', {
  vpcId: vpc.id,
  tags: {
    Name: 'main-igw',
  },
});

// Public Subnets (for ALB)
const publicSubnets = availabilityZones.then(azs =>
  azs.names.slice(0, 2).map(
    (az, index) =>
      new aws.ec2.Subnet(`public-subnet-${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index + 1}`,
          Type: 'public',
        },
      })
  )
);

// Private Subnets (for EC2 and RDS)
const privateSubnets = availabilityZones.then(azs =>
  azs.names.slice(0, 2).map(
    (az, index) =>
      new aws.ec2.Subnet(`private-subnet-${index + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `private-subnet-${index + 1}`,
          Type: 'private',
        },
      })
  )
);

// NAT Gateway for private subnet internet access
const natGateway = pulumi.all([publicSubnets]).apply(([pubSubnets]) => {
  const eip = new aws.ec2.Eip('nat-eip', {
    domain: 'vpc',
    tags: {
      Name: 'nat-eip',
    },
  });

  return new aws.ec2.NatGateway('nat-gateway', {
    allocationId: eip.id,
    subnetId: pubSubnets[0].id,
    tags: {
      Name: 'nat-gateway',
    },
  });
});

// Route Tables
const publicRouteTable = new aws.ec2.RouteTable('public-rt', {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    },
  ],
  tags: {
    Name: 'public-rt',
  },
});

const privateRouteTable = new aws.ec2.RouteTable('private-rt', {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    },
  ],
  tags: {
    Name: 'private-rt',
  },
});

// Route Table Associations
pulumi.all([publicSubnets]).apply(([pubSubnets]) => {
  pubSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(`public-rta-${index + 1}`, {
      subnetId: subnet.id,
      routeTableId: publicRouteTable.id,
    });
  });
});

pulumi.all([privateSubnets]).apply(([privSubnets]) => {
  privSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(`private-rta-${index + 1}`, {
      subnetId: subnet.id,
      routeTableId: privateRouteTable.id,
    });
  });
});

// 2. SECURITY GROUPS

// ALB Security Group
const albSecurityGroup = new aws.ec2.SecurityGroup('alb-sg', {
  name: 'alb-sg',
  description: 'Security group for Application Load Balancer',
  vpcId: vpc.id,
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 80,
      toPort: 80,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'HTTP access from internet',
    },
    {
      protocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'HTTPS access from internet',
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
    Name: 'alb-sg',
  },
});

// Application Security Group
const appSecurityGroup = new aws.ec2.SecurityGroup('app-sg', {
  name: 'app-sg',
  description: 'Security group for Application servers',
  vpcId: vpc.id,
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 8080,
      toPort: 8080,
      securityGroups: [albSecurityGroup.id],
      description: 'HTTP access from ALB',
    },
    {
      protocol: 'tcp',
      fromPort: 22,
      toPort: 22,
      cidrBlocks: [vpc.cidrBlock],
      description: 'SSH access from VPC',
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
    Name: 'app-sg',
  },
});

// Database Security Group
const dbSecurityGroup = new aws.ec2.SecurityGroup('db-sg', {
  name: 'db-sg',
  description: 'Security group for RDS PostgreSQL database',
  vpcId: vpc.id,
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      securityGroups: [appSecurityGroup.id],
      description: 'PostgreSQL access from application servers',
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
    Name: 'db-sg',
  },
});

// 3. DATABASE TIER - RDS PostgreSQL

// DB Subnet Group
const dbSubnetGroup = pulumi.all([privateSubnets]).apply(
  ([privSubnets]) =>
    new aws.rds.SubnetGroup('db-subnet-group', {
      name: 'db-subnet-group',
      subnetIds: privSubnets.map(subnet => subnet.id),
      tags: {
        Name: 'db-subnet-group',
      },
    })
);

// RDS Instance
const rdsInstance = new aws.rds.Instance('postgres-db', {
  identifier: 'webapp-postgres-db',
  engine: 'postgres',
  engineVersion: '15.4',
  instanceClass: 'db.t3.micro',
  allocatedStorage: 20,
  storageType: 'gp2',
  storageEncrypted: true, // Required: Storage encryption

  dbName: 'webappdb',
  username: 'dbadmin',
  password: 'SecurePassword123!', // In production, use AWS Secrets Manager

  vpcSecurityGroupIds: [dbSecurityGroup.id],
  dbSubnetGroupName: dbSubnetGroup.name,

  backupRetentionPeriod: 7,
  backupWindow: '03:00-04:00',
  maintenanceWindow: 'sun:04:00-sun:05:00',

  skipFinalSnapshot: true, // Set to false in production
  deletionProtection: false, // Set to true in production

  tags: {
    Name: 'webapp-postgres-db',
    Environment: 'production',
  },
});

// 4. APPLICATION TIER - EC2 Auto Scaling Group

// Launch Template
const launchTemplate = pulumi.all([privateSubnets]).apply(
  ([privSubnets]) =>
    new aws.ec2.LaunchTemplate('app-launch-template', {
      name: 'app-launch-template',
      imageId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 AMI (update for your region)
      instanceType: 't3.micro',

      vpcSecurityGroupIds: [appSecurityGroup.id],

      userData: pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Simple web application container
docker run -d -p 8080:80 --name webapp nginx:alpine
`,

      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'webapp-instance',
            Environment: 'production',
          },
        },
      ],
    })
);

// Auto Scaling Group
const autoScalingGroup = pulumi.all([privateSubnets, launchTemplate]).apply(
  ([privSubnets, lt]) =>
    new aws.autoscaling.Group('app-asg', {
      name: 'app-asg',
      vpcZoneIdentifiers: privSubnets.map(subnet => subnet.id),

      launchTemplate: {
        id: lt.id,
        version: '$Latest',
      },

      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,

      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,

      tags: [
        {
          key: 'Name',
          value: 'app-asg',
          propagateAtLaunch: true,
        },
      ],
    })
);

// 5. WEB TIER - Application Load Balancer with WAF

// Target Group
const targetGroup = new aws.lb.TargetGroup('app-tg', {
  name: 'app-tg',
  port: 8080,
  protocol: 'HTTP',
  vpcId: vpc.id,

  healthCheck: {
    enabled: true,
    path: '/',
    port: '8080',
    protocol: 'HTTP',
    healthyThreshold: 2,
    unhealthyThreshold: 2,
    timeout: 5,
    interval: 30,
    matcher: '200',
  },

  tags: {
    Name: 'app-tg',
  },
});

// Attach ASG to Target Group
const asgAttachment = new aws.autoscaling.Attachment('asg-attachment', {
  autoscalingGroupName: autoScalingGroup.name,
  lbTargetGroupArn: targetGroup.arn,
});

// Application Load Balancer
const applicationLoadBalancer = pulumi.all([publicSubnets]).apply(
  ([pubSubnets]) =>
    new aws.lb.LoadBalancer('app-alb', {
      name: 'app-alb',
      loadBalancerType: 'application',
      scheme: 'internet-facing',

      subnets: pubSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],

      enableDeletionProtection: false, // Set to true in production

      tags: {
        Name: 'app-alb',
        Environment: 'production',
      },
    })
);

// ALB Listener
const albListener = new aws.lb.Listener('app-alb-listener', {
  loadBalancerArn: applicationLoadBalancer.arn,
  port: '80',
  protocol: 'HTTP',

  defaultActions: [
    {
      type: 'forward',
      targetGroupArn: targetGroup.arn,
    },
  ],
});

// WAFv2 Web ACL
const webAcl = new aws.wafv2.WebAcl('app-web-acl', {
  name: 'app-web-acl',
  description: 'WAF Web ACL for Application Load Balancer',
  scope: 'REGIONAL',

  defaultAction: {
    allow: {},
  },

  rules: [
    {
      name: 'AWSManagedRulesCommonRuleSet',
      priority: 1,

      overrideAction: {
        none: {},
      },

      statement: {
        managedRuleGroupStatement: {
          name: 'AWSManagedRulesCommonRuleSet',
          vendorName: 'AWS',
        },
      },

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: 'CommonRuleSetMetric',
      },
    },
  ],

  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudwatchMetricsEnabled: true,
    metricName: 'webACL',
  },

  tags: {
    Name: 'app-web-acl',
    Environment: 'production',
  },
});

// Associate WAF with ALB
const webAclAssociation = new aws.wafv2.WebAclAssociation(
  'app-waf-association',
  {
    resourceArn: applicationLoadBalancer.arn,
    webAclArn: webAcl.arn,
  }
);

// 6. MONITORING - SNS Topic and CloudWatch Alarm

// SNS Topic for alerts
const alertsTopic = new aws.sns.Topic('alerts-topic', {
  name: 'webapp-alerts',
  displayName: 'Web Application Alerts',
  tags: {
    Name: 'webapp-alerts',
    Environment: 'production',
  },
});

// CloudWatch Alarm for RDS CPU Utilization
const rdsAlarm = new aws.cloudwatch.MetricAlarm('rds-cpu-alarm', {
  name: 'rds-high-cpu-utilization',
  description: 'Alarm when RDS CPU exceeds 80%',

  metricName: 'CPUUtilization',
  namespace: 'AWS/RDS',
  statistic: 'Average',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 80,
  comparisonOperator: 'GreaterThanThreshold',

  dimensions: {
    DBInstanceIdentifier: rdsInstance.identifier,
  },

  alarmActions: [alertsTopic.arn],
  okActions: [alertsTopic.arn],

  tags: {
    Name: 'rds-cpu-alarm',
    Environment: 'production',
  },
});

// Outputs
export const vpcId = vpc.id;
export const albDnsName = applicationLoadBalancer.dnsName;
export const rdsEndpoint = rdsInstance.endpoint;
export const snsTopicArn = alertsTopic.arn;
export const webAclArn = webAcl.arn;
```

## Key Implementation Details

### 🔒 **Security Features**

1. **Network Isolation**: Private subnets for application and database tiers
2. **Security Groups**: Strict ingress/egress rules between tiers
3. **Encryption**: RDS storage encryption enabled
4. **WAF Protection**: AWS managed rule set for common attacks

### 🏗️ **Architecture Components**

1. **VPC**: Multi-AZ setup with public/private subnets
2. **RDS**: Encrypted PostgreSQL in private subnets
3. **Auto Scaling**: EC2 instances with health checks
4. **Load Balancer**: Internet-facing ALB with WAF
5. **Monitoring**: CloudWatch alarms with SNS notifications

### 🔧 **Configuration Highlights**

- **Database**: Encrypted storage, backup retention, maintenance windows
- **Auto Scaling**: Min/max capacity with health checks
- **Load Balancer**: Health checks and target group configuration
- **WAF**: AWS managed common rule set protection
- **Monitoring**: RDS CPU utilization alarm with SNS integration

This infrastructure provides a production-ready, secure three-tier web application with proper monitoring and alerting capabilities.
