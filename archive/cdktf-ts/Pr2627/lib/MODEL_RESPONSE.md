I'll create a scalable and production-ready AWS web application environment using CDK for Terraform (CDKTF) with TypeScript. Here are the two files with clean separation and comprehensive inline comments:

## 1. modules.ts

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  DataAwsAvailabilityZones,
  DataAwsAmi,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  SecurityGroup,
  SecurityGroupRule,
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  LaunchConfiguration,
  AutoscalingGroup,
  Lb,
  LbTargetGroup,
  LbListener,
  DbSubnetGroup,
  DbInstance,
  SecretsmanagerSecret,
  SecretsmanagerSecretVersion,
  CloudwatchMetricAlarm,
  Route53Zone,
  Route53Record,
} from "@cdktf/provider-aws";

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

    // AWS Provider configuration for us-west-2
    new AwsProvider(this, "aws", {
      region: config.region,
    });

    // Get availability zones for the region
    const availabilityZones = new DataAwsAvailabilityZones(this, "available", {
      state: "available",
    });

    // Create VPC with DNS support for Route53 integration
    // CIDR block provides ~65k IP addresses for scalability
    this.vpc = new Vpc(this, "main-vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "main-vpc",
        Environment: config.environment,
      },
    });

    // Internet Gateway for public subnet internet access
    const internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: "main-igw",
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
          Type: "Public",
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
          Type: "Private",
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Route table for public subnets with internet gateway route
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: "public-route-table",
        Environment: config.environment,
      },
    });

    // Route all traffic (0.0.0.0/0) to internet gateway for public access
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
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
    const albSecurityGroup = new SecurityGroup(this, "alb-sg", {
      name: "alb-security-group",
      description: "Security group for Application Load Balancer",
      vpcId: this.vpc.id,
      tags: {
        Name: "alb-security-group",
        Environment: config.environment,
      },
    });

    // Allow inbound HTTP traffic from anywhere to ALB
    new SecurityGroupRule(this, "alb-http-inbound", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSecurityGroup.id,
      description: "Allow HTTP traffic from internet",
    });

    // Allow all outbound traffic from ALB to EC2 instances
    new SecurityGroupRule(this, "alb-outbound", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSecurityGroup.id,
      description: "Allow all outbound traffic",
    });

    // Security group for EC2 instances
    // Only allows traffic from ALB and outbound for updates/dependencies
    const ec2SecurityGroup = new SecurityGroup(this, "ec2-sg", {
      name: "ec2-security-group",
      description: "Security group for EC2 instances",
      vpcId: this.vpc.id,
      tags: {
        Name: "ec2-security-group",
        Environment: config.environment,
      },
    });

    // Allow HTTP traffic from ALB security group only
    new SecurityGroupRule(this, "ec2-http-from-alb", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ec2SecurityGroup.id,
      description: "Allow HTTP traffic from ALB",
    });

    // Allow all outbound traffic for package updates and external API calls
    new SecurityGroupRule(this, "ec2-outbound", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: ec2SecurityGroup.id,
      description: "Allow all outbound traffic",
    });

    // Security group for RDS database
    // Only allows MySQL/Aurora traffic from EC2 instances
    const rdsSecurityGroup = new SecurityGroup(this, "rds-sg", {
      name: "rds-security-group",
      description: "Security group for RDS database",
      vpcId: this.vpc.id,
      tags: {
        Name: "rds-security-group",
        Environment: config.environment,
      },
    });

    // Allow MySQL traffic from EC2 security group only
    new SecurityGroupRule(this, "rds-mysql-from-ec2", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: ec2SecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: "Allow MySQL traffic from EC2 instances",
    });

    // IAM role for EC2 instances to access CloudWatch and Secrets Manager
    // Follows principle of least privilege
    const ec2Role = new IamRole(this, "ec2-role", {
      name: "ec2-cloudwatch-secrets-role",
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
        Environment: config.environment,
      },
    });

    // IAM policy for CloudWatch metrics and logs
    new IamRolePolicy(this, "ec2-cloudwatch-policy", {
      name: "CloudWatchMetricsPolicy",
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "*",
          },
        ],
      }),
    });

    // IAM policy for Secrets Manager access
    new IamRolePolicy(this, "ec2-secrets-policy", {
      name: "SecretsManagerPolicy",
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
            ],
            Resource: "*",
          },
        ],
      }),
    });

    // Instance profile to attach IAM role to EC2 instances
    const instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "ec2-instance-profile",
      role: ec2Role.name,
    });

    // Secrets Manager secret for RDS credentials
    // Provides secure storage and automatic rotation capabilities
    this.secretsManagerSecret = new SecretsmanagerSecret(this, "db-credentials", {
      name: "rds-database-credentials",
      description: "RDS database credentials",
      tags: {
        Environment: config.environment,
      },
    });

    // Store the actual database credentials in Secrets Manager
    new SecretsmanagerSecretVersion(this, "db-credentials-version", {
      secretId: this.secretsManagerSecret.id,
      secretString: JSON.stringify({
        username: config.dbUsername,
        password: config.dbPassword,
      }),
    });

    // Application Load Balancer for distributing traffic
    // ALB provides advanced routing, SSL termination, and health checks
    this.loadBalancer = new Lb(this, "main-alb", {
      name: "main-application-lb",
      loadBalancerType: "application",
      scheme: "internet-facing",
      subnets: this.publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      tags: {
        Environment: config.environment,
      },
    });

    // Target group for EC2 instances behind the load balancer
    const targetGroup = new LbTargetGroup(this, "ec2-target-group", {
      name: "ec2-target-group",
      port: 80,
      protocol: "HTTP",
      vpcId: this.vpc.id,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTP",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200",
      },
      tags: {
        Environment: config.environment,
      },
    });

    // Load balancer listener to route HTTP traffic to target group
    new LbListener(this, "alb-listener", {
      loadBalancerArn: this.loadBalancer.arn,
      port: "80",
      protocol: "HTTP",
      defaultAction: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Launch configuration for Auto Scaling Group
    // Defines the template for EC2 instances
    const launchConfig = new LaunchConfiguration(this, "web-launch-config", {
      name: "web-server-launch-config",
      imageId: config.amiId,
      instanceType: config.instanceType,
      securityGroups: [ec2SecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      // User data script to install and configure web server
      userData: Buffer.from(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Web Server Running</h1>" > /var/www/html/index.html
        echo "OK" > /var/www/html/health
        # Install CloudWatch agent for monitoring
        yum install -y amazon-cloudwatch-agent
      `).toString('base64'),
    });

    // Auto Scaling Group for high availability and scalability
    // Min 2 instances for redundancy, max 5 for cost control
    this.autoScalingGroup = new AutoscalingGroup(this, "web-asg", {
      name: "web-server-asg",
      launchConfiguration: launchConfig.name,
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      vpcZoneIdentifier: this.privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      tag: [
        {
          key: "Name",
          value: "web-server-instance",
          propagateAtLaunch: true,
        },
        {
          key: "Environment",
          value: config.environment,
          propagateAtLaunch: true,
        },
      ],
    });

    // DB subnet group for RDS Multi-AZ deployment
    // Spans multiple AZs for high availability
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: "main-db-subnet-group",
      subnetIds: this.privateSubnets.map(subnet => subnet.id),
      description: "Subnet group for RDS database",
      tags: {
        Name: "main-db-subnet-group",
        Environment: config.environment,
      },
    });

    // RDS MySQL instance with Multi-AZ for high availability
    // Multi-AZ provides automatic failover and backup replication
    this.rdsInstance = new DbInstance(this, "main-database", {
      identifier: "main-database",
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      storageType: "gp2",
      dbName: "webapp",
      username: config.dbUsername,
      password: config.dbPassword,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true, // Enable Multi-AZ for high availability
      publiclyAccessible: false, // Keep database private for security
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      storageEncrypted: true,
      tags: {
        Name: "main-database",
        Environment: config.environment,
      },
    });

    // CloudWatch alarm for Auto Scaling Group health
    // Monitors if any instances become unhealthy
    new CloudwatchMetricAlarm(this, "asg-unhealthy-hosts", {
      alarmName: "asg-unhealthy-hosts",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "UnHealthyHostCount",
      namespace: "AWS/ApplicationELB",
      period: "60",
      statistic: "Average",
      threshold: "0",
      alarmDescription: "This metric monitors unhealthy ALB targets",
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
    new CloudwatchMetricAlarm(this, "rds-cpu-alarm", {
      alarmName: "rds-high-cpu",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: "300",
      statistic: "Average",
      threshold: "80",
      alarmDescription: "This metric monitors RDS CPU utilization",
      dimensions: {
        DBInstanceIdentifier: this.rdsInstance.id,
      },
      tags: {
        Environment: config.environment,
      },
    });

    // Route 53 hosted zone for DNS management
    this.route53Zone = new Route53Zone(this, "main-zone", {
      name: config.domainName,
      tags: {
        Environment: config.environment,
      },
    });

    // Route 53 A record pointing to the load balancer
    // Routes web traffic to the ALB DNS name
    this.dnsRecord = new Route53Record(this, "main-record", {
      zoneId: this.route53Zone.zoneId,
      name: config.domainName,
      type: "A",
      alias: {
        name: this.loadBalancer.dnsName,
        zoneId: this.loadBalancer.zoneId,
        evaluateTargetHealth: true,
      },
    });
  }
}
```

## 2. tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { WebAppModules, WebAppModulesConfig } from "./modules";

/**
 * Main stack that orchestrates all AWS resources for the web application
 * This stack creates a production-ready, scalable web application environment
 */
class WebAppStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configuration for the web application infrastructure
    // These values would typically come from environment variables or config files
    const config: WebAppModulesConfig = {
      region: "us-west-2", // Required region as per specifications
      amiId: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI for us-west-2
      instanceType: "t3.micro", // Cost-effective instance type for web servers
      dbUsername: "admin", // Database master username
      dbPassword: "SecurePassword123!", // Strong password (should use random generation in production)
      domainName: "example.com", // Domain name for Route 53 DNS
      environment: "Production", // Environment tag for all resources
    };

    // Create all AWS resources using the modules
    const webAppModules = new WebAppModules(this, "web-app", config);

    // Output the ELB DNS name for external access
    // This is the primary endpoint users will access
    new TerraformOutput(this, "load-balancer-dns", {
      value: webAppModules.loadBalancer.dnsName,
      description: "DNS name of the Application Load Balancer",
    });

    // Output the Auto Scaling Group name for monitoring and management
    new TerraformOutput(this, "auto-scaling-group-name", {
      value: webAppModules.autoScalingGroup.name,
      description: "Name of the Auto Scaling Group",
    });

    // Output the RDS endpoint for application configuration
    // Applications use this endpoint to connect to the database
    new TerraformOutput(this, "rds-endpoint", {
      value: webAppModules.rdsInstance.endpoint,
      description: "RDS database endpoint",
      sensitive: true, // Mark as sensitive to avoid logging
    });

    // Output the Secrets Manager ARN for credential retrieval
    new TerraformOutput(this, "secrets-manager-arn", {
      value: webAppModules.secretsManagerSecret.arn,
      description: "ARN of the Secrets Manager secret containing DB credentials",
    });

    // Output the Route 53 hosted zone ID for DNS management
    new TerraformOutput(this, "route53-zone-id", {
      value: webAppModules.route53Zone.zoneId,
      description: "Route 53 hosted zone ID",
    });

    // Output the VPC ID for reference by other stacks or resources
    new TerraformOutput(this, "vpc-id", {
      value: webAppModules.vpc.id,
      description: "ID of the main VPC",
    });
  }
}

// Create and deploy the application
const app = new App();
new WebAppStack(app, "production-web-app");
app.synth();
```

## Key Architecture Decisions & Explanations

### **Why Multi-AZ RDS?**
- **High Availability**: Automatic failover to standby instance in different AZ
- **Data Durability**: Synchronous replication ensures no data loss
- **Maintenance**: Zero-downtime maintenance and backups

### **Why Secrets Manager?**
- **Security**: Encrypted storage of sensitive database credentials
- **Rotation**: Automatic credential rotation capabilities
- **Audit**: Full audit trail of credential access
- **Integration**: Native AWS service integration

### **Why Application Load Balancer?**
- **Layer 7 Routing**: Advanced routing based on HTTP headers/paths
- **Health Checks**: Sophisticated health checking capabilities
- **SSL Termination**: Built-in SSL/TLS termination support
- **Auto Scaling Integration**: Seamless integration with ASG

### **Why Private Subnets for EC2/RDS?**
- **Security**: No direct internet access reduces attack surface
- **Compliance**: Meets security best practices for production workloads
- **Network Segmentation**: Clear separation between public and private resources

### **Why CloudWatch Monitoring?**
- **Proactive Monitoring**: Early detection of performance issues
- **Auto Scaling Triggers**: Can trigger scaling events based on metrics
- **Operational Insights**: Detailed metrics for capacity planning

## Deployment Instructions

1. **Install Dependencies**:
   ```bash
   npm install cdktf @cdktf/provider-aws
   ```

2. **Initialize CDKTF**:
   ```bash
   cdktf init --template=typescript
   ```

3. **Validate Configuration**:
   ```bash
   cdktf validate
   ```

4. **Plan Deployment**:
   ```bash
   cdktf plan
   ```

5. **Deploy Infrastructure**:
   ```bash
   cdktf deploy
   ```

This architecture provides a production-ready, scalable web application environment with high availability, security, and monitoring capabilities as specified in the requirements.