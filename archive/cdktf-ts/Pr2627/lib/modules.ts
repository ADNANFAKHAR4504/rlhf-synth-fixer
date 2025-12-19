import { Construct } from 'constructs';
import { TerraformLocal } from 'cdktf';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// import { LaunchConfiguration } from '@cdktf/provider-aws/lib/launch-configuration';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';

import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';

export interface WebAppModulesConfig {
  region: string;
  amiId: string;
  instanceType: string;
  dbUsername: string;
  dbPassword: string;
  domainName: string;
  environment: string;
}

export class WebAppModules extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly loadBalancer: Lb;
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly rdsInstance: DbInstance;
  public readonly secretsManagerSecret: SecretsmanagerSecret;
  public readonly route53Zone: Route53Zone;
  public readonly dnsRecord: Route53Record;

  constructor(scope: Construct, id: string, config: WebAppModulesConfig) {
    super(scope, id);

    // Get availability zones for the region
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // Create VPC with DNS support for Route53 integration
    // CIDR block provides ~65k IP addresses for scalability
    this.vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'main-vpc',
        Environment: config.environment,
      },
    });

    // Internet Gateway for public subnet internet access
    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'main-igw',
        Environment: config.environment,
      },
    });

    // Create public subnets in multiple AZs for high availability
    // Public subnets host the load balancer for internet-facing traffic
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${i + 1}`,
          Environment: config.environment,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);
    }

    // Create private subnets for EC2 instances and RDS
    // Private subnets provide security by isolating application resources
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        tags: {
          Name: `private-subnet-${i + 1}`,
          Environment: config.environment,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Route table for public subnets with internet gateway route
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'public-route-table',
        Environment: config.environment,
      },
    });

    // Route all traffic (0.0.0.0/0) to internet gateway for public access
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Security group for Application Load Balancer
    // Only allows HTTP traffic from internet (port 80)
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: 'alb-security-group',
      description: 'Security group for Application Load Balancer',
      vpcId: this.vpc.id,
      tags: {
        Name: 'alb-security-group',
        Environment: config.environment,
      },
    });

    // Allow inbound HTTP traffic from anywhere to ALB
    new SecurityGroupRule(this, 'alb-http-inbound', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    // Allow all outbound traffic from ALB to EC2 instances
    new SecurityGroupRule(this, 'alb-outbound', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Security group for EC2 instances
    // Only allows traffic from ALB and outbound for updates/dependencies
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: 'ec2-security-group',
      description: 'Security group for EC2 instances',
      vpcId: this.vpc.id,
      tags: {
        Name: 'ec2-security-group',
        Environment: config.environment,
      },
    });

    // Allow HTTP traffic from ALB security group only
    new SecurityGroupRule(this, 'ec2-http-from-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ec2SecurityGroup.id,
      description: 'Allow HTTP traffic from ALB',
    });

    // Allow all outbound traffic for package updates and external API calls
    new SecurityGroupRule(this, 'ec2-outbound', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ec2SecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Security group for RDS database
    // Only allows MySQL/Aurora traffic from EC2 instances
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: 'rds-security-group',
      description: 'Security group for RDS database',
      vpcId: this.vpc.id,
      tags: {
        Name: 'rds-security-group',
        Environment: config.environment,
      },
    });

    // Allow MySQL traffic from EC2 security group only
    new SecurityGroupRule(this, 'rds-mysql-from-ec2', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: ec2SecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow MySQL traffic from EC2 instances',
    });

    // IAM role for EC2 instances to access CloudWatch and Secrets Manager
    // Follows principle of least privilege
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'ec2-cloudwatch-secrets-role',
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
        Environment: config.environment,
      },
    });

    // IAM policy for CloudWatch metrics and logs
    new IamRolePolicy(this, 'ec2-cloudwatch-policy', {
      name: 'CloudWatchMetricsPolicy',
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // IAM policy for Secrets Manager access
    new IamRolePolicy(this, 'ec2-secrets-policy', {
      name: 'SecretsManagerPolicy',
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Instance profile to attach IAM role to EC2 instances
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile-ts',
      {
        name: 'ec2-instance-profile-ts',
        role: ec2Role.name,
        dependsOn: [ec2Role],
      }
    );

    new TerraformLocal(this, 'iam-delay', {
      expression: 'sleep 10', // Wait 10 seconds for IAM propagation
    });

    // Secrets Manager secret for RDS credentials
    // Provides secure storage and automatic rotation capabilities
    this.secretsManagerSecret = new SecretsmanagerSecret(
      this,
      'db-credentials',
      {
        name: 'rds-database-credentials',
        description: 'RDS database credentials',
        tags: {
          Environment: config.environment,
        },
      }
    );

    // Store the actual database credentials in Secrets Manager
    new SecretsmanagerSecretVersion(this, 'db-credentials-version', {
      secretId: this.secretsManagerSecret.id,
      secretString: JSON.stringify({
        username: config.dbUsername,
        password: config.dbPassword,
      }),
    });

    // Application Load Balancer for distributing traffic
    // ALB provides advanced routing, SSL termination, and health checks
    this.loadBalancer = new Lb(this, 'main-alb', {
      name: 'main-application-lb',
      loadBalancerType: 'application',
      subnets: this.publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      tags: {
        Environment: config.environment,
      },
    });

    // Target group for EC2 instances behind the load balancer
    const targetGroup = new LbTargetGroup(this, 'ec2-target-group', {
      name: 'ec2-target-group',
      port: 80,
      protocol: 'HTTP',
      vpcId: this.vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      tags: {
        Environment: config.environment,
      },
    });

    // Load balancer listener to route HTTP traffic to target group
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Launch configuration for Auto Scaling Group
    // Defines the template for EC2 instances
    const launchTemplate = new LaunchTemplate(this, 'web-launch-template', {
      namePrefix: 'web-server-template-',
      imageId: config.amiId,
      instanceType: config.instanceType,

      vpcSecurityGroupIds: [ec2SecurityGroup.id],

      iamInstanceProfile: {
        name: instanceProfile.name,
      },

      userData: Buffer.from(
        `#!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Web Server Running</h1>" > /var/www/html/index.html
    echo "OK" > /var/www/html/health
    yum install -y amazon-cloudwatch-agent
  `
      ).toString('base64'),

      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'web-server-instance',
            Environment: config.environment,
          },
        },
      ],

      dependsOn: [instanceProfile, ec2SecurityGroup, ec2Role],
    });

    // Update Auto Scaling Group to use Launch Template
    this.autoScalingGroup = new AutoscalingGroup(this, 'web-asg', {
      namePrefix: 'web-server-asg-',
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      vpcZoneIdentifier: this.privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,

      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },

      dependsOn: [launchTemplate, targetGroup],

      tag: [
        {
          key: 'Name',
          value: 'web-server-instance',
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: config.environment,
          propagateAtLaunch: true,
        },
      ],
    });

    // DB subnet group for RDS Multi-AZ deployment
    // Spans multiple AZs for high availability
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'main-db-subnet-group-ts',
      subnetIds: this.privateSubnets.map(subnet => subnet.id),
      description: 'Subnet group for RDS database',
      tags: {
        Name: 'main-db-subnet-group-ts',
        Environment: config.environment,
      },
    });

    // RDS MySQL instance with Multi-AZ for high availability
    // Multi-AZ provides automatic failover and backup replication
    this.rdsInstance = new DbInstance(this, 'main-database', {
      identifier: 'main-database',
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: 'webapp',
      username: config.dbUsername,
      password: config.dbPassword,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true, // Enable Multi-AZ for high availability
      publiclyAccessible: false, // Keep database private for security
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      storageEncrypted: true,
      tags: {
        Name: 'main-database',
        Environment: config.environment,
      },
    });

    // CloudWatch alarm for Auto Scaling Group health
    // Monitors if any instances become unhealthy
    new CloudwatchMetricAlarm(this, 'asg-unhealthy-hosts', {
      alarmName: 'asg-unhealthy-hosts',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'This metric monitors unhealthy ALB targets',
      dimensions: {
        TargetGroup: targetGroup.arnSuffix,
        LoadBalancer: this.loadBalancer.arnSuffix,
      },
      tags: {
        Environment: config.environment,
      },
    });

    // CloudWatch alarm for RDS CPU utilization
    // Alerts when database CPU usage is too high
    new CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: 'rds-high-cpu',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors RDS CPU utilization',
      dimensions: {
        DBInstanceIdentifier: this.rdsInstance.id,
      },
      tags: {
        Environment: config.environment,
      },
    });

    // Route 53 hosted zone for DNS management
    this.route53Zone = new Route53Zone(this, 'main-zone', {
      name: config.domainName,
      tags: {
        Environment: config.environment,
      },
    });

    // Route 53 A record pointing to the load balancer
    // Routes web traffic to the ALB DNS name
    this.dnsRecord = new Route53Record(this, 'main-record', {
      zoneId: this.route53Zone.zoneId,
      name: config.domainName,
      type: 'A',
      alias: {
        name: this.loadBalancer.dnsName,
        zoneId: this.loadBalancer.zoneId,
        evaluateTargetHealth: true,
      },
    });
  }
}
