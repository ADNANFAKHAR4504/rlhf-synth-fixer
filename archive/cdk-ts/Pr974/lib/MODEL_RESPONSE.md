I'll create a comprehensive CDK project that meets all your requirements. This solution will be modular, secure, and deployable across multiple regions.

## Project Structure

```
multi-region-app/
├── bin/
│   └── multi-region-app.ts
├── lib/
│   ├── constructs/
│   │   ├── vpc-construct.ts
│   │   ├── application-tier-construct.ts
│   │   ├── database-tier-construct.ts
│   │   └── monitoring-construct.ts
│   ├── stacks/
│   │   └── multi-region-stack.ts
│   └── interfaces/
│       └── stack-config.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## 1. Package Configuration

### `package.json`

```json
{
  "name": "multi-region-app",
  "version": "0.1.0",
  "bin": {
    "multi-region-app": "bin/multi-region-app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --all",
    "destroy": "cdk destroy --all"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020", "dom"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

### `cdk.json`

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/multi-region-app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## 2. Interfaces and Configuration

### `lib/interfaces/stack-config.ts`

```typescript
/**
 * Configuration interface for multi-region stack deployment
 * Defines the structure for region-specific and global configurations
 */
export interface StackConfig {
  /** AWS region for deployment */
  region: string;

  /** Environment name (e.g., production, staging) */
  environment: string;

  /** VPC CIDR block for the region */
  vpcCidr: string;

  /** Database configuration */
  database: {
    instanceClass: string;
    engine: string;
    engineVersion: string;
    allocatedStorage: number;
    multiAz: boolean;
    backupRetention: number;
  };

  /** EC2 Auto Scaling configuration */
  autoScaling: {
    instanceType: string;
    minCapacity: number;
    maxCapacity: number;
    desiredCapacity: number;
  };

  /** Common tags applied to all resources */
  tags: { [key: string]: string };
}

/**
 * Default configurations for different regions
 */
export const REGION_CONFIGS: { [region: string]: StackConfig } = {
  'us-east-1': {
    region: 'us-east-1',
    environment: 'Production',
    vpcCidr: '10.0.0.0/16',
    database: {
      instanceClass: 'db.t3.micro',
      engine: 'mysql',
      engineVersion: '8.0.37',
      allocatedStorage: 20,
      multiAz: true,
      backupRetention: 7,
    },
    autoScaling: {
      instanceType: 't3.micro',
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
    },
    tags: {
      Environment: 'Production',
      Project: 'MultiRegionApp',
      Owner: 'Prakhar-Jain',
      Region: 'us-east-1',
    },
  },
  'us-west-2': {
    region: 'us-west-2',
    environment: 'Production',
    vpcCidr: '10.1.0.0/16',
    database: {
      instanceClass: 'db.t3.micro',
      engine: 'mysql',
      engineVersion: '8.0.37',
      allocatedStorage: 20,
      multiAz: true,
      backupRetention: 7,
    },
    autoScaling: {
      instanceType: 't3.micro',
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 3,
    },
    tags: {
      Environment: 'Production',
      Project: 'MultiRegionApp',
      Owner: 'Prakhar-Jain',
      Region: 'us-west-2',
    },
  },
};
```

## 3. VPC Construct

### `lib/constructs/vpc-construct.ts`

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * VPC Construct that creates a highly available network infrastructure
 * with public and private subnets across multiple Availability Zones
 */
export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, config: StackConfig) {
    super(scope, id);

    // Create VPC with public and private subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'MultiRegionVpc', {
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 3, // Use 3 AZs for high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Define subnet configuration for network segregation
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],

      // Configure NAT Gateway for private subnet internet access
      natGateways: 2, // Deploy NAT gateways in 2 AZs for redundancy
      natGatewayProvider: ec2.NatProvider.gateway(),
    });

    // Store subnet references for use by other constructs
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Create VPC Flow Logs for network monitoring and security
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Apply tags to VPC and all subnets
    cdk.Tags.of(this.vpc).add('Name', `MultiRegionApp-VPC-${config.region}`);
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // Tag subnets for better identification
    this.publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `PublicSubnet-${index + 1}-${config.region}`
      );
      cdk.Tags.of(subnet).add('SubnetType', 'Public');
    });

    this.privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `PrivateSubnet-${index + 1}-${config.region}`
      );
      cdk.Tags.of(subnet).add('SubnetType', 'Private');
    });
  }
}
```

## 4. Database Tier Construct

### `lib/constructs/database-tier-construct.ts`

```typescript
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * Database Tier Construct that creates a highly available RDS instance
 * with Multi-AZ deployment and automated backups
 */
export class DatabaseTierConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.Vpc, config: StackConfig) {
    super(scope, id);

    // Create security group for RDS database
    // This follows the principle of least privilege
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description:
          'Security group for RDS database - allows MySQL/Aurora access from application tier',
        allowAllOutbound: false, // Explicitly deny all outbound traffic
      }
    );

    // Create DB subnet group using isolated subnets for maximum security
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database in isolated subnets',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Generate a secure random password for the database
    const databaseCredentials = rds.Credentials.fromGeneratedSecret('admin', {
      description: `Database credentials for MultiRegionApp in ${config.region}`,
      excludeCharacters: '"@/\\',
    });

    // Create RDS database instance with high availability configuration
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      credentials: databaseCredentials,

      // High availability and backup configuration
      multiAz: config.database.multiAz,
      allocatedStorage: config.database.allocatedStorage,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true, // Enable encryption at rest

      // Backup and maintenance configuration
      backupRetention: cdk.Duration.days(config.database.backupRetention),
      deleteAutomatedBackups: false,
      deletionProtection: true, // Prevent accidental deletion

      // Network configuration
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [this.databaseSecurityGroup],

      // Monitoring and logging
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,

      // Maintenance window (during low-traffic hours)
      preferredMaintenanceWindow: 'sun:03:00-sun:04:00',
      preferredBackupWindow: '02:00-03:00',

      // Parameter group for optimization
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DefaultParameterGroup',
        'default.mysql8.0'
      ),
    });

    // Apply comprehensive tagging
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.database).add(key, value);
      cdk.Tags.of(this.databaseSecurityGroup).add(key, value);
    });

    cdk.Tags.of(this.database).add(
      'Name',
      `MultiRegionApp-Database-${config.region}`
    );
    cdk.Tags.of(this.databaseSecurityGroup).add(
      'Name',
      `MultiRegionApp-DB-SG-${config.region}`
    );
  }

  /**
   * Allow inbound connections from application tier security group
   * This method should be called after the application tier is created
   */
  public allowConnectionsFrom(
    applicationSecurityGroup: ec2.SecurityGroup
  ): void {
    this.databaseSecurityGroup.addIngressRule(
      applicationSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application tier'
    );
  }
}
```

## 5. Application Tier Construct

### `lib/constructs/application-tier-construct.ts`

```typescript
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * Application Tier Construct that creates an Auto Scaling Group of EC2 instances
 * behind an Application Load Balancer for high availability and scalability
 */
export class ApplicationTierConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;
  public readonly loadBalancerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.Vpc, config: StackConfig) {
    super(scope, id);

    // Create security group for Application Load Balancer
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(
      this,
      'LoadBalancerSecurityGroup',
      {
        vpc,
        description:
          'Security group for Application Load Balancer - allows HTTP/HTTPS from internet',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP and HTTPS traffic from the internet to ALB
    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );
    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Create security group for EC2 instances
    this.applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description:
          'Security group for application EC2 instances - allows traffic from ALB',
        allowAllOutbound: true, // Allow outbound for package updates and external API calls
      }
    );

    // Allow traffic from ALB to EC2 instances on port 80
    this.applicationSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from Application Load Balancer'
    );

    // Allow SSH access for maintenance (restrict to specific IP ranges in production)
    this.applicationSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // In production, replace with specific IP ranges
      ec2.Port.tcp(22),
      'Allow SSH access for maintenance'
    );

    // Create IAM role for EC2 instances with necessary permissions
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances in the application tier',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Create instance profile for EC2 role
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        roles: [ec2Role.roleName],
        instanceProfileName: `MultiRegionApp-EC2-Profile-${config.region}`,
      }
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd mysql',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Create a simple web page
      'echo "<html><body><h1>Multi-Region Application</h1>" > /var/www/html/index.html',
      `echo "<p>Region: ${config.region}</p>" >> /var/www/html/index.html`,
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',
      'echo "</body></html>" >> /var/www/html/index.html',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'MultiRegionApp/EC2',
          metrics_collected: {
            cpu: {
              measurement: [
                'cpu_usage_idle',
                'cpu_usage_iowait',
                'cpu_usage_user',
                'cpu_usage_system',
              ],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/httpd/access_log',
                  log_group_name: `/aws/ec2/multiregionapp/${config.region}/httpd/access`,
                  log_stream_name: '{instance_id}',
                },
                {
                  file_path: '/var/log/httpd/error_log',
                  log_group_name: `/aws/ec2/multiregionapp/${config.region}/httpd/error`,
                  log_stream_name: '{instance_id}',
                },
              ],
            },
          },
        },
      }),
      'EOF',

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Create launch template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: new ec2.InstanceType(config.autoScaling.instanceType),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.applicationSecurityGroup,
      userData,
      role: ec2Role,

      // Enable detailed monitoring
      detailedMonitoring: true,

      // Instance metadata service configuration
      requireImdsv2: true,
      httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      httpPutResponseHopLimit: 2,
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: config.autoScaling.minCapacity,
        maxCapacity: config.autoScaling.maxCapacity,
        desiredCapacity: config.autoScaling.desiredCapacity,

        // Deploy instances in private subnets for security
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },

        // Health check configuration
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),

        // Instance replacement policy
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: config.autoScaling.minCapacity,
          pauseTime: cdk.Duration.seconds(300),
        }),
      }
    );

    // Configure Auto Scaling policies based on CPU utilization
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: this.loadBalancerSecurityGroup,

        // Deploy ALB in public subnets
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Create target group for Auto Scaling Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],

      // Health check configuration
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
        healthyThresholdCount: 2,
      },

      // Deregistration delay
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Create listener for ALB
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Apply comprehensive tagging
    const resources = [
      this.loadBalancer,
      this.autoScalingGroup,
      this.applicationSecurityGroup,
      this.loadBalancerSecurityGroup,
      launchTemplate,
      targetGroup,
    ];

    resources.forEach(resource => {
      Object.entries(config.tags).forEach(([key, value]) => {
        cdk.Tags.of(resource).add(key, value);
      });
    });

    // Add specific name tags
    cdk.Tags.of(this.loadBalancer).add(
      'Name',
      `MultiRegionApp-ALB-${config.region}`
    );
    cdk.Tags.of(this.autoScalingGroup).add(
      'Name',
      `MultiRegionApp-ASG-${config.region}`
    );
    cdk.Tags.of(this.applicationSecurityGroup).add(
      'Name',
      `MultiRegionApp-App-SG-${config.region}`
    );
    cdk.Tags.of(this.loadBalancerSecurityGroup).add(
      'Name',
      `MultiRegionApp-ALB-SG-${config.region}`
    );
  }
}
```

## 6. Monitoring Construct

### `lib/constructs/monitoring-construct.ts`

```typescript
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * Monitoring Construct that sets up comprehensive CloudWatch monitoring,
 * alarms, and logging for the multi-region application
 */
export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    config: StackConfig,
    resources: {
      loadBalancer: elbv2.ApplicationLoadBalancer;
      autoScalingGroup: autoscaling.AutoScalingGroup;
      database: rds.DatabaseInstance;
    }
  ) {
    super(scope, id);

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `MultiRegionApp Alerts - ${config.region}`,
      topicName: `MultiRegionApp-Alerts-${config.region}`
    });

    // Create log groups for application logs
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/application`,
      retention: logs.RetentionDays.ONE_WEEK
    });

    const httpdAccessLogGroup = new logs.LogGroup(this, 'HttpdAccessLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/access`,
      retention: logs.RetentionDays.ONE_WEEK
    });

    const httpdErrorLogGroup = new logs.LogGroup(this, 'HttpdErrorLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/error`,
      retention: logs.RetentionDays.ONE_WEEK
    });

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `MultiRegionApp-${config.region}`,
      defaultInterval: cdk.Duration.hours(1)
    });

    // Add ALB metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [resources.loadBalancer.metricRequestCount()],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [resources.loadBalancer.metricTargetResponseTime()],
        width: 12,
        height: 6
      })
    );

    // Add Auto Scaling Group metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ASG Instance Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupDesiredCapacity',
            dimensionsMap: {
              AutoScalingGroupName: resources.autoScalingGroup.autoScalingGroupName
            }
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensionsMap: {
              AutoScalingGroupName: resources.autoScalingGroup.autoScalingGroupName
            }
          })
        ],
        width: 12,
        height: 6
      }),
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName: resources.autoScalingGroup.autoScalingGroupName
            },
            statistic: 'Average'
          })
        ],
        width: 12,
        height: 6
      })
    );

    // Add RDS metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch
```
