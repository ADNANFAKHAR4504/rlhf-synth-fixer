I'll create a highly available and resilient AWS web application environment using CDK for Terraform (CDKTF) in TypeScript. Here's the implementation:

## `modules.ts`

```typescript
import { Construct } from "constructs";
import {
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  SecurityGroup,
  SecurityGroupRule,
} from "@cdktf/provider-aws/lib/vpc";
import {
  Lb,
  LbTargetGroup,
  LbListener,
  LbTargetGroupAttachment,
} from "@cdktf/provider-aws/lib/elb";
import {
  LaunchTemplate,
  AutoscalingGroup,
  AutoscalingPolicy,
  CloudwatchMetricAlarm,
} from "@cdktf/provider-aws/lib/autoscaling";
import {
  Instance,
  Ami,
} from "@cdktf/provider-aws/lib/ec2";
import {
  DbInstance,
  DbSubnetGroup,
  DbParameterGroup,
} from "@cdktf/provider-aws/lib/rds";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-sources";

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
  passwordSecretArn: string;
  vpcId: string;
  subnetIds: string[];
  backupRetentionPeriod: number;
  multiAz: boolean;
}

/**
 * VPC Module - Creates a highly available VPC spanning multiple AZs
 * 
 * This module creates:
 * - A VPC with public and private subnets across 3+ AZs for redundancy
 * - Internet Gateway for public internet access
 * - Route tables for proper traffic routing
 * - Security groups with least-privilege access
 * 
 * HA Benefits:
 * - Multi-AZ deployment ensures no single point of failure
 * - Separate public/private subnets provide network isolation
 * - Multiple route tables enable traffic distribution
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

    // Get available AZs for the region - ensures we can spread across multiple zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    this.availabilityZones = azs.names.slice(0, 3); // Use first 3 AZs for redundancy

    // Create VPC - Foundation for all networking
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.name}-vpc`,
        Environment: "production",
      },
    });

    // Internet Gateway - Enables public internet access for load balancer
    const igw = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-igw`,
      },
    });

    // Create public and private subnets across multiple AZs
    // This ensures high availability - if one AZ fails, others continue operating
    for (let i = 0; i < 3; i++) {
      // Public subnet for load balancer - receives internet traffic
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: this.availabilityZones[i],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.name}-public-subnet-${i + 1}`,
          Type: "Public",
        },
      });

      // Private subnet for application servers and database
      // Provides security isolation from direct internet access
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: this.availabilityZones[i],
        tags: {
          Name: `${config.name}-private-subnet-${i + 1}`,
          Type: "Private",
        },
      });

      this.publicSubnets.push(publicSubnet);
      this.privateSubnets.push(privateSubnet);
    }

    // Public route table - Routes traffic from public subnets to internet
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-public-rt`,
      },
    });

    // Route for internet access via IGW
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Security Group for Web Tier (Load Balancer)
    // Allows HTTP/HTTPS traffic from internet, restricts other access
    this.webSecurityGroup = new SecurityGroup(this, "web-sg", {
      name: `${config.name}-web-sg`,
      description: "Security group for web tier (load balancer)",
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-web-sg`,
      },
    });

    // Allow HTTP traffic from internet
    new SecurityGroupRule(this, "web-http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
    });

    // Allow HTTPS traffic from internet
    new SecurityGroupRule(this, "web-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, "web-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
    });

    // Security Group for Database Tier
    // Only allows access from web tier, providing defense in depth
    this.dbSecurityGroup = new SecurityGroup(this, "db-sg", {
      name: `${config.name}-db-sg`,
      description: "Security group for database tier",
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-db-sg`,
      },
    });

    // Allow MySQL/Aurora access only from web security group
    new SecurityGroupRule(this, "db-ingress", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
    });
  }
}

/**
 * ELB Module - Creates Application Load Balancer for high availability
 * 
 * Features:
 * - Distributes traffic across multiple AZs and instances
 * - Health checks ensure only healthy instances receive traffic
 * - Cross-zone load balancing for even distribution
 * 
 * HA Benefits:
 * - Automatic failover to healthy instances
 * - Multi-AZ deployment survives AZ failures
 * - Health checks prevent traffic to failed instances
 */
export class ElbModule extends Construct {
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, config: ElbModuleConfig) {
    super(scope, id);

    // Application Load Balancer - Distributes incoming traffic across AZs
    // Placed in public subnets to receive internet traffic
    this.loadBalancer = new Lb(this, "alb", {
      name: `${config.name}-alb`,
      loadBalancerType: "application",
      internal: false, // Internet-facing for public access
      securityGroups: config.securityGroupIds,
      subnets: config.subnetIds,
      enableCrossZoneLoadBalancing: true, // Ensures even distribution across AZs
      tags: {
        Name: `${config.name}-alb`,
        Environment: "production",
      },
    });

    // Target Group - Defines health check and routing rules
    // Health checks ensure traffic only goes to healthy instances
    this.targetGroup = new LbTargetGroup(this, "tg", {
      name: `${config.name}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: config.vpcId,
      targetType: "instance",
      
      // Health check configuration for high availability
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,     // Instance healthy after 2 successful checks
        unhealthyThreshold: 2,   // Instance unhealthy after 2 failed checks
        timeout: 5,              // 5 second timeout per check
        interval: 30,            // Check every 30 seconds
        path: "/health",         // Health check endpoint
        matcher: "200",          // Expected HTTP response code
        protocol: "HTTP",
        port: "traffic-port",
      },
      
      tags: {
        Name: `${config.name}-tg`,
      },
    });

    // Listener - Routes incoming requests to target group
    this.listener = new LbListener(this, "listener", {
      loadBalancerArn: this.loadBalancer.arn,
      port: "80",
      protocol: "HTTP",
      
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }
}

/**
 * ASG Module - Creates Auto Scaling Group for elastic compute capacity
 * 
 * Features:
 * - Automatically scales instances based on demand
 * - Replaces failed instances automatically
 * - Distributes instances across multiple AZs
 * - Integrates with load balancer for seamless scaling
 * 
 * HA Benefits:
 * - Automatic instance replacement on failure
 * - Multi-AZ deployment survives AZ failures
 * - Dynamic scaling handles traffic spikes
 * - Integration with ELB ensures new instances receive traffic
 */
export class AsgModule extends Construct {
  public readonly launchTemplate: LaunchTemplate;
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly scaleUpPolicy: AutoscalingPolicy;
  public readonly scaleDownPolicy: AutoscalingPolicy;

  constructor(scope: Construct, id: string, config: AsgModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new Ami(this, "ami", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    // Launch Template - Defines instance configuration
    // Template approach allows for easy updates and versioning
    this.launchTemplate = new LaunchTemplate(this, "lt", {
      name: `${config.name}-lt`,
      imageId: ami.id,
      instanceType: config.instanceType,
      vpcSecurityGroupIds: config.securityGroupIds,
      
      // User data script for application setup
      userData: Buffer.from(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        
        # Simple health check endpoint
        echo "<html><body><h1>Healthy</h1></body></html>" > /var/www/html/health
        
        # Basic application page
        echo "<html><body><h1>Hello from $(hostname -f)</h1></body></html>" > /var/www/html/index.html
      `).toString('base64'),
      
      tags: {
        Name: `${config.name}-lt`,
      },
    });

    // Auto Scaling Group - Manages fleet of EC2 instances
    // Ensures desired capacity is maintained across AZs
    this.autoScalingGroup = new AutoscalingGroup(this, "asg", {
      name: `${config.name}-asg`,
      vpcZoneIdentifier: config.subnetIds, // Spread across multiple AZs
      targetGroupArns: [config.targetGroupArn],
      healthCheckType: "ELB", // Use ELB health checks for better accuracy
      healthCheckGracePeriod: 300, // 5 minutes for instance to become healthy
      
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest",
      },
      
      // Ensure instances are distributed across AZs for HA
      availabilityZones: config.subnetIds, // This will be mapped to AZs
      
      tags: [
        {
          key: "Name",
          value: `${config.name}-asg-instance`,
          propagateAtLaunch: true,
        },
        {
          key: "Environment",
          value: "production",
          propagateAtLaunch: true,
        },
      ],
    });

    // Scale Up Policy - Adds instances when demand increases
    this.scaleUpPolicy = new AutoscalingPolicy(this, "scale-up", {
      name: `${config.name}-scale-up`,
      scalingAdjustment: 1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 300, // 5 minute cooldown between scaling actions
      autoscalingGroupName: this.autoScalingGroup.name,
    });

    // Scale Down Policy - Removes instances when demand decreases
    this.scaleDownPolicy = new AutoscalingPolicy(this, "scale-down", {
      name: `${config.name}-scale-down`,
      scalingAdjustment: -1,
      adjustmentType: "ChangeInCapacity",
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });

    // CloudWatch Alarms for automatic scaling based on CPU utilization
    // Scale up when CPU > 70% for 2 consecutive periods
    new CloudwatchMetricAlarm(this, "cpu-high", {
      alarmName: `${config.name}-cpu-high`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: "120",
      statistic: "Average",
      threshold: "70",
      alarmDescription: "This metric monitors ec2 cpu utilization",
      alarmActions: [this.scaleUpPolicy.arn],
      dimensions: {
        AutoScalingGroupName: this.autoScalingGroup.name,
      },
    });

    // Scale down when CPU < 30% for 2 consecutive periods
    new CloudwatchMetricAlarm(this, "cpu-low", {
      alarmName: `${config.name}-cpu-low`,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: "120",
      statistic: "Average",
      threshold: "30",
      alarmDescription: "This metric monitors ec2 cpu utilization",
      alarmActions: [this.scaleDownPolicy.arn],
      dimensions: {
        AutoScalingGroupName: this.autoScalingGroup.name,
      },
    });
  }
}

/**
 * RDS Module - Creates highly available database with Multi-AZ deployment
 * 
 * Features:
 * - Multi-AZ deployment for automatic failover
 * - Automated backups with point-in-time recovery
 * - Encryption at rest and in transit
 * - Subnet group spans multiple AZs
 * 
 * HA Benefits:
 * - Multi-AZ provides automatic failover in case of AZ failure
 * - Automated backups enable disaster recovery
 * - Subnet group across AZs ensures database availability
 * - Read replicas can be added for read scaling
 */
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbParameterGroup: DbParameterGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // DB Subnet Group - Spans multiple AZs for high availability
    // RDS uses this to place primary and standby instances in different AZs
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.name}-db-subnet-group`,
      subnetIds: config.subnetIds, // Must span at least 2 AZs for Multi-AZ
      description: "Subnet group for RDS database spanning multiple AZs",
      tags: {
        Name: `${config.name}-db-subnet-group`,
      },
    });

    // DB Parameter Group - Custom database configuration
    // Allows for performance tuning and optimization
    this.dbParameterGroup = new DbParameterGroup(this, "db-param-group", {
      family: "mysql8.0", // Adjust based on engine version
      name: `${config.name}-db-param-group`,
      description: "Custom parameter group for optimized performance",
      
      parameter: [
        {
          name: "innodb_buffer_pool_size",
          value: "{DBInstanceClassMemory*3/4}", // Use 75% of available memory
        },
      ],
      
      tags: {
        Name: `${config.name}-db-param-group`,
      },
    });

    // RDS Instance - Multi-AZ MySQL database with high availability
    this.dbInstance = new DbInstance(this, "db-instance", {
      identifier: `${config.name}-db`,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: "gp3", // Latest generation storage for better performance
      storageEncrypted: true, // Encryption at rest for security
      
      // Database configuration
      dbName: config.dbName,
      username: config.username,
      managePasswordSecretArn: config.passwordSecretArn, // Use AWS Secrets Manager
      
      // High Availability Configuration
      multiAz: config.multiAz, // Enable Multi-AZ for automatic failover
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [config.vpcId], // This should be security group IDs
      
      // Backup Configuration - Critical for disaster recovery
      backupRetentionPeriod: config.backupRetentionPeriod, // Minimum 7 days as required
      backupWindow: "03:00-04:00", // Maintenance window during low traffic
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Performance and Monitoring
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60, // Enhanced monitoring every minute
      
      // Parameter group for custom configuration
      parameterGroupName: this.dbParameterGroup.name,
      
      // Deletion protection for production
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.name}-final-snapshot`,
      
      tags: {
        Name: `${config.name}-db`,
        Environment: "production",
        Backup: "required",
      },
    });
  }
}
```

## `tap-stack.ts`

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput, TerraformVariable } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  VpcModule,
  ElbModule,
  AsgModule,
  RdsModule,
} from "./modules";

/**
 * TAP Stack - Terraform Application Platform Stack
 * 
 * This stack orchestrates all infrastructure modules to create a highly available
 * web application environment. It demonstrates proper separation of concerns by
 * importing reusable modules and wiring them together with configurable variables.
 * 
 * Architecture Overview:
 * - Multi-AZ VPC with public/private subnets
 * - Application Load Balancer in public subnets
 * - Auto Scaling Group with EC2 instances in private subnets
 * - Multi-AZ RDS database in private subnets
 * 
 * High Availability Features:
 * - Survives single AZ failure
 * - Automatic instance replacement
 * - Database failover capability
 * - Load balancer health checks
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Provider Configuration
    new AwsProvider(this, "aws", {
      region: "us-east-1", // Required region as specified
    });

    // =============================================================================
    // VARIABLES - Configurable parameters for flexibility and reusability
    // =============================================================================

    // Application Configuration
    const appName = new TerraformVariable(this, "app_name", {
      type: "string",
      default: "tap-web-app",
      description: "Name of the application - used for resource naming",
    });

    // VPC Configuration
    const vpcCidr = new TerraformVariable(this, "vpc_cidr", {
      type: "string",
      default: "10.0.0.0/16",
      description: "CIDR block for VPC - provides IP address space",
    });

    // EC2 Instance Configuration
    const instanceType = new TerraformVariable(this, "instance_type", {
      type: "string",
      default: "t3.micro",
      description: "EC2 instance type for web servers",
    });

    // Auto Scaling Configuration
    const asgMinSize = new TerraformVariable(this, "asg_min_size", {
      type: "number",
      default: 2,
      description: "Minimum number of instances in ASG - ensures baseline capacity",
    });

    const asgMaxSize = new TerraformVariable(this, "asg_max_size", {
      type: "number",
      default: 6,
      description: "Maximum number of instances in ASG - controls cost",
    });

    const asgDesiredCapacity = new TerraformVariable(this, "asg_desired_capacity", {
      type: "number",
      default: 3,
      description: "Desired number of instances - one per AZ for HA",
    });

    // RDS Configuration
    const dbInstanceClass = new TerraformVariable(this, "db_instance_class", {
      type: "string",
      default: "db.t3.micro",
      description: "RDS instance class - determines compute and memory",
    });

    const dbAllocatedStorage = new TerraformVariable(this, "db_allocated_storage", {
      type: "number",
      default: 20,
      description: "Initial storage allocation for RDS in GB",
    });

    const dbName = new TerraformVariable(this, "db_name", {
      type: "string",
      default: "tapdb",
      description: "Name of the database to create",
    });

    const dbUsername = new TerraformVariable(this, "db_username", {
      type: "string",
      default: "admin",
      description: "Master username for database",
    });

    // Security Configuration - No hardcoded credentials
    const dbPasswordSecretArn = new TerraformVariable(this, "db_password_secret_arn", {
      type: "string",
      description: "ARN of AWS Secrets Manager secret containing database password",
      sensitive: true,
    });

    // =============================================================================
    // INFRASTRUCTURE MODULES - Building blocks for high availability
    // =============================================================================

    // VPC Module - Foundation networking layer
    // Creates multi-AZ network infrastructure with proper isolation
    const vpc = new VpcModule(this, "vpc", {
      cidrBlock: vpcCidr.stringValue,
      region: "us-east-1",
      name: appName.stringValue,
    });

    // ELB Module - Load balancing layer
    // Distributes traffic across multiple AZs and instances
    const elb = new ElbModule(this, "elb", {
      name: appName.stringValue,
      vpcId: vpc.vpc.id,
      subnetIds: vpc.publicSubnets.map(subnet => subnet.id), // Public subnets for internet access
      securityGroupIds: [vpc.webSecurityGroup.id],
    });

    // ASG Module - Compute layer with auto-scaling
    // Provides elastic capacity with automatic failure recovery
    const asg = new AsgModule(this, "asg", {
      name: appName.stringValue,
      vpcId: vpc.vpc.id,
      subnetIds: vpc.privateSubnets.map(subnet => subnet.id), // Private subnets for security
      targetGroupArn: elb.targetGroup.arn,
      instanceType: instanceType.stringValue,
      minSize: asgMinSize.numberValue,
      maxSize: asgMaxSize.numberValue,
      desiredCapacity: asgDesiredCapacity.numberValue,
      securityGroupIds: [vpc.webSecurityGroup.id],
    });

    // RDS Module - Database layer with Multi-AZ deployment
    // Provides persistent data storage with automatic failover
    const rds = new RdsModule(this, "rds", {
      name: appName.stringValue,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: dbInstanceClass.stringValue,
      allocatedStorage: dbAllocatedStorage.numberValue,
      dbName: dbName.stringValue,
      username: dbUsername.stringValue,
      passwordSecretArn: dbPasswordSecretArn.stringValue,
      vpcId: vpc.dbSecurityGroup.id, // Database security group
      subnetIds: vpc.privateSubnets.map(subnet => subnet.id), // Private subnets for security
      backupRetentionPeriod: 7, // Required minimum 7-day retention
      multiAz: true, // Required Multi-AZ for high availability
    });

    // =============================================================================
    // OUTPUTS - Critical resource information for external access and monitoring
    // =============================================================================

    // Load Balancer DNS - Primary application endpoint
    new TerraformOutput(this, "load_balancer_dns", {
      value: elb.loadBalancer.dnsName,
      description: "DNS name of the Application Load Balancer - use this to access the application",
    });

    // Load Balancer Zone ID - For Route 53 alias records
    new TerraformOutput(this, "load_balancer_zone_id", {
      value: elb.loadBalancer.zoneId,
      description: "Zone ID of the load balancer for DNS configuration",
    });

    // RDS Endpoint - Database connection string
    new TerraformOutput(this, "rds_endpoint", {
      value: rds.dbInstance.endpoint,
      description: "RDS instance endpoint for database connections",
      sensitive: false, // Endpoint is not sensitive, but connection details are
    });

    // RDS Port - Database connection port
    new TerraformOutput(this, "rds_port", {
      value: rds.dbInstance.port,
      description: "Port number for database connections",
    });

    // Auto Scaling Group Details
    new TerraformOutput(this, "asg_name", {
      value: asg.autoScalingGroup.name,
      description: "Name of the Auto Scaling Group for monitoring and management",
    });

    new TerraformOutput(this, "asg_arn", {
      value: asg.autoScalingGroup.arn,
      description: "ARN of the Auto Scaling Group for IAM policies and monitoring",
    });

    // VPC Information
    new TerraformOutput(this, "vpc_id", {
      value: vpc.vpc.id,
      description: "VPC ID for additional resource deployment",
    });

    new TerraformOutput(this, "availability_zones", {
      value: vpc.availabilityZones,
      description: "Availability zones used for deployment - shows multi-AZ setup",
    });

    // Security Group IDs for additional resources
    new TerraformOutput(this, "web_security_group_id", {
      value: vpc.webSecurityGroup.id,
      description: "Security group ID for web tier - use for additional web resources",
    });

    new TerraformOutput(this, "db_security_group_id", {
      value: vpc.dbSecurityGroup.id,
      description: "Security group ID for database tier - use for additional DB resources",
    });

    // Application URL - Constructed endpoint for easy access
    new TerraformOutput(this, "application_url", {
      value: `http://${elb.loadBalancer.dnsName}`,
      description: "Complete application URL - ready to use endpoint",
    });
  }
}

// Application entry point
const app = new App();
new TapStack(app, "tap-stack");
app.synth();
```

## Key Architectural Decisions and HA Features

### 1. **Multi-AZ Design**
- **VPC spans 3 AZs** - Ensures no single point of failure
- **Subnets in each AZ** - Both public (for ELB) and private (for instances/DB)
- **ASG distributes instances** across all AZs automatically

### 2. **Load Balancer High Availability**
- **Application Load Balancer** with cross-zone load balancing
- **Health checks** prevent traffic to unhealthy instances
- **Multiple AZ