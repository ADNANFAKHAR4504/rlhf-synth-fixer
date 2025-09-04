import { Construct } from 'constructs';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';

import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami'; // Fixed import

import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';

export interface VpcModuleConfig {
  cidrBlock: string;
  region: string;
  name: string;
}

export interface ElbModuleConfig {
  name: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
}

export interface AsgModuleConfig {
  name: string;
  vpcId: string;
  subnetIds: string[];
  targetGroupArn: string;
  instanceType: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  securityGroupIds: string[];
}

export interface RdsModuleConfig {
  name: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string; // Fixed: Use password instead of passwordSecretArn
  vpcSecurityGroupIds: string[]; // Fixed: Use array of security group IDs
  subnetIds: string[];
  backupRetentionPeriod: number;
  multiAz: boolean;
}

/**
 * VPC Module - Creates a highly available VPC spanning multiple AZs
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly webSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;
  public readonly availabilityZones: string[];

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // AZs for the region (more predictable)
    this.availabilityZones = [
      `${config.region}a`,
      `${config.region}b`,
      `${config.region}c`,
    ];

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.name}-vpc`,
        Environment: 'production',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-igw`,
      },
    });

    // Create subnets across multiple AZs
    for (let i = 0; i < 3; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: this.availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.name}-public-subnet-${i + 1}`,
          Type: 'Public',
        },
      });

      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: this.availabilityZones[i],
        tags: {
          Name: `${config.name}-private-subnet-${i + 1}`,
          Type: 'Private',
        },
      });

      this.publicSubnets.push(publicSubnet);
      this.privateSubnets.push(privateSubnet);
    }

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Security Groups
    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${config.name}-web-sg`,
      description: 'Security group for web tier',
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-web-sg`,
      },
    });

    // Web security group rules
    new SecurityGroupRule(this, 'web-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'web-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'web-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
    });

    // Database security group
    this.dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${config.name}-db-sg`,
      description: 'Security group for database tier',
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-db-sg`,
      },
    });

    new SecurityGroupRule(this, 'db-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
    });
  }
}

/**
 * ELB Module - Creates Application Load Balancer
 */
export class ElbModule extends Construct {
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, config: ElbModuleConfig) {
    super(scope, id);

    this.loadBalancer = new Lb(this, 'alb', {
      name: `${config.name}-alb`,
      loadBalancerType: 'application',
      internal: false,
      securityGroups: config.securityGroupIds,
      subnets: config.subnetIds,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: `${config.name}-alb`,
        Environment: 'production',
      },
    });

    this.targetGroup = new LbTargetGroup(this, 'tg', {
      name: `${config.name}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      targetType: 'instance',

      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 5,
        timeout: 10,
        interval: 60,
        path: '/health',
        matcher: '200',
        protocol: 'HTTP',
        port: 'traffic-port',
      },

      tags: {
        Name: `${config.name}-tg`,
      },
    });

    // Fixed: port should be number, not string
    this.listener = new LbListener(this, 'listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: 80, // Fixed: Changed from "80" to 80
      protocol: 'HTTP',

      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

/**
 * ASG Module - Creates Auto Scaling Group
 */
export class AsgModule extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly scaleUpPolicy: AutoscalingPolicy;
  public readonly scaleDownPolicy: AutoscalingPolicy;

  constructor(scope: Construct, id: string, config: AsgModuleConfig) {
    super(scope, id);

    // Fixed: Use DataAwsAmi instead of Ami
    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true, // This is correct for DataAwsAmi
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    this.launchTemplate = new LaunchTemplate(this, 'lt', {
      name: `${config.name}-lt`,
      imageId: ami.id,
      instanceType: config.instanceType,
      vpcSecurityGroupIds: config.securityGroupIds,

      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        
        # Create health check endpoint
        echo "<html><body><h1>Healthy</h1></body></html>" > /var/www/html/health
        echo "<html><body><h1>Hello from $(hostname -f)</h1></body></html>" > /var/www/html/index.html
        
        # Ensure Apache is running and restart if needed
        systemctl restart httpd
        
        # Wait a bit for services to be ready
        sleep 30
        `
      ).toString('base64'),

      tags: {
        Name: `${config.name}-lt`,
      },
    });

    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: `${config.name}-asg`,
      vpcZoneIdentifier: config.subnetIds,
      targetGroupArns: [config.targetGroupArn],
      healthCheckType: 'EC2',
      healthCheckGracePeriod: 600,

      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,

      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },

      // Fixed: Use 'tag' instead of 'tags'
      tag: [
        {
          key: 'Name',
          value: `${config.name}-asg-instance`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: 'production',
          propagateAtLaunch: true,
        },
      ],
    });

    this.scaleUpPolicy = new AutoscalingPolicy(this, 'scale-up', {
      name: `${config.name}-scale-up`,
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });

    this.scaleDownPolicy = new AutoscalingPolicy(this, 'scale-down', {
      name: `${config.name}-scale-down`,
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });

    // Fixed: Convert string values to numbers for CloudWatch alarms
    new CloudwatchMetricAlarm(this, 'cpu-high', {
      alarmName: `${config.name}-cpu-high`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2, // Fixed: Changed from "2" to 2
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120, // Fixed: Changed from "120" to 120
      statistic: 'Average',
      threshold: 70, // Fixed: Changed from "70" to 70
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [this.scaleUpPolicy.arn],
      dimensions: {
        AutoScalingGroupName: this.autoScalingGroup.name,
      },
    });

    new CloudwatchMetricAlarm(this, 'cpu-low', {
      alarmName: `${config.name}-cpu-low`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2, // Fixed: Changed from "2" to 2
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120, // Fixed: Changed from "120" to 120
      statistic: 'Average',
      threshold: 30, // Fixed: Changed from "30" to 30
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      alarmActions: [this.scaleDownPolicy.arn],
      dimensions: {
        AutoScalingGroupName: this.autoScalingGroup.name,
      },
    });
  }
}

/**
 * RDS Module - Creates highly available database
 */
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbParameterGroup: DbParameterGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.name}-db-subnet-group`,
      subnetIds: config.subnetIds,
      description: 'Subnet group for RDS database',
      tags: {
        Name: `${config.name}-db-subnet-group`,
      },
    });

    this.dbParameterGroup = new DbParameterGroup(this, 'db-param-group', {
      family: 'mysql8.0',
      name: `${config.name}-db-param-group`,
      description: 'Custom parameter group',

      parameter: [
        {
          name: 'innodb_buffer_pool_size',
          value: '{DBInstanceClassMemory*3/4}',
        },
      ],

      tags: {
        Name: `${config.name}-db-param-group`,
      },
    });

    // Fixed: Use correct property names for RDS instance
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${config.name}-db`,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,

      dbName: config.dbName,
      username: config.username,
      password: config.password, // Fixed: Use password instead of managePasswordSecretArn

      multiAz: config.multiAz,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds, // Fixed: Use the array from config

      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 0,

      parameterGroupName: this.dbParameterGroup.name,

      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.name}-final-snapshot`,

      tags: {
        Name: `${config.name}-db`,
        Environment: 'production',
        Backup: 'required',
      },
    });
  }
}
