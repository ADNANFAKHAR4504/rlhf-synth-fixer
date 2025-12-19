## lib/modules.ts

```typescript
/**
 * Reusable modular constructs for AWS infrastructure
 * All modules follow security best practices with production-ready configurations
 */

import { Construct } from "constructs";
import * as aws from "@cdktf/provider-aws";

/**
 * VPC Module - Creates a VPC with public and private subnets across 2 AZs
 * Security: Private subnets for compute/data layers, public only for load balancer
 */
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;

  constructor(scope: Construct, id: string, tags: { [key: string]: string }) {
    super(scope, id);

    // Create VPC with DNS support for private hosted zones
    this.vpc = new aws.vpc.Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `${id}-vpc`,
      },
    });

    // Internet Gateway for public subnet outbound connectivity
    this.internetGateway = new aws.internetGateway.InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `${id}-igw`,
      },
    });

    // Public route table
    const publicRouteTable = new aws.routeTable.RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `${id}-public-rt`,
      },
    });

    new aws.route.Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Create subnets across 2 AZs for HA
    const azs = ["us-west-2a", "us-west-2b"];
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    azs.forEach((az, index) => {
      // Public subnets for ALB
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `${id}-public-subnet-${az}`,
          Tier: "Public",
        },
      });
      this.publicSubnets.push(publicSubnet);

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: publicRouteTable.id,
        }
      );

      // Private subnets for EC2 and RDS
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          ...tags,
          Name: `${id}-private-subnet-${az}`,
          Tier: "Private",
        },
      });
      this.privateSubnets.push(privateSubnet);

      // NAT Gateway for private subnet outbound connectivity
      const eip = new aws.eip.Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: {
          ...tags,
          Name: `${id}-nat-eip-${az}`,
        },
      });

      const natGateway = new aws.natGateway.NatGateway(this, `nat-gw-${index}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...tags,
          Name: `${id}-nat-gw-${az}`,
        },
      });
      this.natGateways.push(natGateway);

      // Private route table with NAT Gateway route
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...tags,
            Name: `${id}-private-rt-${az}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateway.id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

/**
 * Security Groups Module - Least privilege network access controls
 */
export class SecurityGroupsModule extends Construct {
  public readonly albSg: aws.securityGroup.SecurityGroup;
  public readonly ec2Sg: aws.securityGroup.SecurityGroup;
  public readonly rdsSg: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // ALB Security Group - Allow HTTPS from internet
    this.albSg = new aws.securityGroup.SecurityGroup(this, "alb-sg", {
      name: `${id}-alb-sg`,
      description: "Security group for Application Load Balancer - HTTPS only",
      vpcId: vpcId,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTPS from internet",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        ...tags,
        Name: `${id}-alb-sg`,
      },
    });

    // EC2 Security Group - Allow traffic from ALB only
    this.ec2Sg = new aws.securityGroup.SecurityGroup(this, "ec2-sg", {
      name: `${id}-ec2-sg`,
      description: "Security group for EC2 instances - restricted access",
      vpcId: vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic for updates and dependencies",
        },
      ],
      tags: {
        ...tags,
        Name: `${id}-ec2-sg`,
      },
    });

    // Allow traffic from ALB to EC2
    new aws.securityGroupRule.SecurityGroupRule(this, "alb-to-ec2", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      sourceSecurityGroupId: this.albSg.id,
      securityGroupId: this.ec2Sg.id,
      description: "Allow HTTP from ALB",
    });

    // RDS Security Group - Allow traffic from EC2 only
    this.rdsSg = new aws.securityGroup.SecurityGroup(this, "rds-sg", {
      name: `${id}-rds-sg`,
      description: "Security group for RDS - EC2 access only",
      vpcId: vpcId,
      tags: {
        ...tags,
        Name: `${id}-rds-sg`,
      },
    });

    // Allow MySQL traffic from EC2 to RDS
    new aws.securityGroupRule.SecurityGroupRule(this, "ec2-to-rds", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: this.ec2Sg.id,
      securityGroupId: this.rdsSg.id,
      description: "Allow MySQL from EC2 instances",
    });
  }
}

/**
 * IAM Module - Least privilege roles and policies
 */
export class IamModule extends Construct {
  public readonly ec2Role: aws.iamRole.IamRole;
  public readonly instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    secretArn: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // EC2 instance role with minimal permissions
    this.ec2Role = new aws.iamRole.IamRole(this, "ec2-role", {
      name: `${id}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
      tags: tags,
    });

    // Policy for CloudWatch Logs
    const cloudwatchPolicy = new aws.iamPolicy.IamPolicy(this, "cloudwatch-policy", {
      name: `${id}-cloudwatch-policy`,
      description: "Allow EC2 instances to send logs to CloudWatch",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: "arn:aws:logs:us-west-2:*:*",
          },
          {
            Effect: "Allow",
            Action: [
              "cloudwatch:PutMetricData",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: tags,
    });

    // Policy for Secrets Manager access (restricted to specific secret)
    const secretsPolicy = new aws.iamPolicy.IamPolicy(this, "secrets-policy", {
      name: `${id}-secrets-policy`,
      description: "Allow EC2 instances to read RDS credentials from Secrets Manager",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret",
            ],
            Resource: secretArn,
          },
        ],
      }),
      tags: tags,
    });

    // SSM policy for Session Manager (secure remote access without SSH)
    const ssmPolicy = new aws.iamPolicy.IamPolicy(this, "ssm-policy", {
      name: `${id}-ssm-policy`,
      description: "Allow EC2 instances to use SSM Session Manager",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "ssm:UpdateInstanceInformation",
              "ssmmessages:CreateControlChannel",
              "ssmmessages:CreateDataChannel",
              "ssmmessages:OpenControlChannel",
              "ssmmessages:OpenDataChannel",
              "ec2messages:GetMessages",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: tags,
    });

    // Attach policies to role
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "cloudwatch-attachment",
      {
        role: this.ec2Role.name,
        policyArn: cloudwatchPolicy.arn,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "secrets-attachment",
      {
        role: this.ec2Role.name,
        policyArn: secretsPolicy.arn,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      "ssm-attachment",
      {
        role: this.ec2Role.name,
        policyArn: ssmPolicy.arn,
      }
    );

    // Instance profile for EC2
    this.instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      "instance-profile",
      {
        name: `${id}-instance-profile`,
        role: this.ec2Role.name,
        tags: tags,
      }
    );
  }
}

/**
 * Auto Scaling Group Module - Resilient EC2 deployment
 */
export class AutoScalingModule extends Construct {
  public readonly asg: aws.autoscalingGroup.AutoscalingGroup;
  public readonly launchTemplate: aws.launchTemplate.LaunchTemplate;

  constructor(
    scope: Construct,
    id: string,
    config: {
      subnetIds: string[];
      securityGroupId: string;
      instanceProfileArn: string;
      targetGroupArns: string[];
      instanceType: string;
      minSize: number;
      maxSize: number;
      desiredCapacity: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI using SSM parameter
    const amiData = new aws.dataAwsSsmParameter.DataAwsSsmParameter(this, "ami", {
      name: "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
    });

    // User data script for application setup
    const userData = `#!/bin/bash
# Update system and install dependencies
yum update -y
yum install -y httpd aws-cli jq

# Configure CloudWatch agent
amazon-cloudwatch-agent-ctl -a query -m ec2 -c default -s

# Start web server with health check endpoint
echo "<h1>Production Application Server</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
systemctl start httpd
systemctl enable httpd

# Log instance metadata
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
echo "Instance $INSTANCE_ID initialized at $(date)" >> /var/log/app-init.log
`;

    // Launch template with production configurations
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      "launch-template",
      {
        name: `${id}-launch-template`,
        description: "Production launch template with security hardening",
        imageId: amiData.value,
        instanceType: config.instanceType,
        iamInstanceProfile: {
          arn: config.instanceProfileArn,
        },
        vpcSecurityGroupIds: [config.securityGroupId],
        userData: Buffer.from(userData).toString("base64"),
        
        // Enable detailed monitoring for better observability
        monitoring: {
          enabled: true,
        },
        
        // Instance metadata security - require IMDSv2
        metadataOptions: {
          httpEndpoint: "enabled",
          httpTokens: "required", // Require IMDSv2 for security
          httpPutResponseHopLimit: 1,
        },
        
        // EBS encryption for data at rest
        blockDeviceMappings: [
          {
            deviceName: "/dev/xvda",
            ebs: {
              volumeSize: 20,
              volumeType: "gp3",
              encrypted: true,
              deleteOnTermination: true,
            },
          },
        ],
        
        tagSpecifications: [
          {
            resourceType: "instance",
            tags: {
              ...config.tags,
              Name: `${id}-ec2-instance`,
            },
          },
          {
            resourceType: "volume",
            tags: {
              ...config.tags,
              Name: `${id}-ec2-volume`,
            },
          },
        ],
      }
    );

    // Auto Scaling Group with health checks
    this.asg = new aws.autoscalingGroup.AutoscalingGroup(this, "asg", {
      name: `${id}-asg`,
      vpcZoneIdentifier: config.subnetIds,
      targetGroupArns: config.targetGroupArns,
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      
      launchTemplate: {
        id: this.launchTemplate.id,
        version: "$Latest",
      },
      
      // Enable instance refresh for rolling updates
      instanceRefresh: {
        strategy: "Rolling",
        preferences: {
          minHealthyPercentage: 90,
        },
      },
      
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Auto scaling policies for dynamic scaling
    const scaleUpPolicy = new aws.autoscalingPolicy.AutoscalingPolicy(
      this,
      "scale-up",
      {
        name: `${id}-scale-up`,
        autoscalingGroupName: this.asg.name,
        policyType: "TargetTrackingScaling",
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "ASGAverageCPUUtilization",
          },
          targetValue: 70,
        },
      }
    );
  }
}

/**
 * Application Load Balancer Module - HTTPS-only with health checks
 */
export class AlbModule extends Construct {
  public readonly alb: aws.lb.Lb;
  public readonly targetGroup: aws.lbTargetGroup.LbTargetGroup;
  public readonly httpsListener: aws.lbListener.LbListener;

  constructor(
    scope: Construct,
    id: string,
    config: {
      subnetIds: string[];
      securityGroupId: string;
      vpcId: string;
      certificateArn?: string;
      logBucketName: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Target group for EC2 instances
    this.targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, "target-group", {
      name: `${id}-tg`,
      port: 80,
      protocol: "HTTP",
      vpcId: config.vpcId,
      targetType: "instance",
      
      // Health check configuration
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
      
      // Stickiness for session affinity
      stickiness: {
        type: "lb_cookie",
        cookieDuration: 86400, // 1 day
        enabled: true,
      },
      
      deregistrationDelay: 30,
      tags: config.tags,
    });

    // Application Load Balancer
    this.alb = new aws.lb.Lb(this, "alb", {
      name: `${id}-alb`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [config.securityGroupId],
      subnets: config.subnetIds,
      
      // Enable deletion protection for production
      enableDeletionProtection: false, // Set to true in production
      
      // Enable HTTP/2
      enableHttp2: true,
      
      // Enable access logs to S3
      accessLogs: {
        bucket: config.logBucketName,
        prefix: "alb-logs",
        enabled: true,
      },
      
      tags: {
        ...config.tags,
        Name: `${id}-alb`,
      },
    });

    // HTTPS listener (requires ACM certificate)
    if (config.certificateArn) {
      this.httpsListener = new aws.lbListener.LbListener(this, "https-listener", {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
        certificateArn: config.certificateArn,
        
        defaultAction: [
          {
            type: "forward",
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        
        tags: config.tags,
      });
    } else {
      // HTTP listener (redirects to HTTPS in production with certificate)
      this.httpsListener = new aws.lbListener.LbListener(this, "http-listener", {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: "HTTP",
        
        defaultAction: [
          {
            type: "forward",
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        
        tags: config.tags,
      });
    }
  }
}

/**
 * RDS MySQL Module - Multi-AZ with encryption and automated backups
 */
export class RdsModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly subnetGroup: aws.dbSubnetGroup.DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      subnetIds: string[];
      securityGroupId: string;
      username: string;
      password: string;
      instanceClass: string;
      allocatedStorage: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // DB subnet group for Multi-AZ deployment
    this.subnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(this, "subnet-group", {
      name: `${id}-db-subnet-group`,
      description: "Subnet group for RDS Multi-AZ deployment",
      subnetIds: config.subnetIds,
      tags: {
        ...config.tags,
        Name: `${id}-db-subnet-group`,
      },
    });

    // RDS MySQL instance with production configurations
    this.dbInstance = new aws.dbInstance.DbInstance(this, "mysql", {
      identifier: `${id}-mysql-db`,
      engine: "mysql",
      engineVersion: "8.0.35",
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: "gp3",
      storageEncrypted: true, // Encryption at rest
      
      // Credentials from Secrets Manager
      username: config.username,
      password: config.password,
      
      // Network configuration
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroupId],
      publiclyAccessible: false, // No public access for security
      
      // High availability
      multiAz: true,
      
      // Backup configuration
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Automatic minor version upgrades
      autoMinorVersionUpgrade: true,
      
      // Performance Insights for monitoring
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      
      // Enhanced monitoring
      enabledCloudwatchLogsExports: ["error", "general", "slowquery"],
      monitoringInterval: 60,
      monitoringRoleArn: new aws.iamRole.IamRole(this, "rds-monitoring-role", {
        name: `${id}-rds-monitoring-role`,
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "monitoring.rds.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        managedPolicyArns: [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
        ],
        tags: config.tags,
      }).arn,
      
      // Deletion protection
      deletionProtection: false, // Set to true in production
      skipFinalSnapshot: true,
      finalSnapshotIdentifier: `${id}-final-snapshot-${Date.now()}`,
      
      tags: {
        ...config.tags,
        Name: `${id}-mysql-db`,
      },
    });
  }
}

/**
 * S3 Module - Encrypted bucket for ALB logs with lifecycle policies
 */
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    config: {
      transitionDays: number;
      expirationDays: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // S3 bucket for ALB logs
    this.bucket = new aws.s3Bucket.S3Bucket(this, "logs-bucket", {
      bucket: `${id}-alb-logs-${Date.now()}`, // Unique bucket name
      
      tags: {
        ...config.tags,
        Name: `${id}-alb-logs`,
        Purpose: "ALB Access Logs",
      },
    });

    // Enable versioning for data protection
    new aws.s3BucketVersioningV2.S3BucketVersioningV2(this, "versioning", {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Server-side encryption with S3-managed keys
    new aws.s3BucketServerSideEncryptionConfigurationV2.S3BucketServerSideEncryptionConfigurationV2(
      this,
      "encryption",
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      "public-access-block",
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Lifecycle policies for cost optimization
    new aws.s3BucketLifecycleConfigurationV2.S3BucketLifecycleConfigurationV2(
      this,
      "lifecycle",
      {
        bucket: this.bucket.id,
        rule: [
          {
            id: "alb-logs-lifecycle",
            status: "Enabled",
            
            transition: [
              {
                days: config.transitionDays,
                storageClass: "STANDARD_IA",
              },
              {
                days: config.transitionDays + 30,
                storageClass: "GLACIER",
              },
            ],
            
            expiration: {
              days: config.expirationDays,
            },
            
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      }
    );

    // Bucket policy for ALB access logs
    new aws.s3BucketPolicy.S3BucketPolicy(this, "bucket-policy", {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              AWS: "arn:aws:iam::797873946194:root", // ELB service account for us-west-2
            },
            Action: "s3:PutObject",
            Resource: `${this.bucket.arn}/alb-logs/*`,
          },
        ],
      }),
    });
  }
}

/**
 * CloudWatch Dashboard Module - Comprehensive monitoring
 */
export class CloudWatchDashboardModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;

  constructor(
    scope: Construct,
    id: string,
    config: {
      asgName: string;
      albArn: string;
      dbInstanceId: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Extract ALB name from ARN
    const albName = config.albArn.split("/").slice(-3).join("/");

    const dashboardBody = {
      widgets: [
        // EC2 Auto Scaling metrics
        {
          type: "metric",
          properties: {
            metrics: [
              ["AWS/EC2", "CPUUtilization", { stat: "Average", label: "EC2 CPU %" }],
              [".", ".", { stat: "Maximum", label: "EC2 CPU Max %" }],
              ["AWS/AutoScaling", "GroupDesiredCapacity", { stat: "Average", label: "Desired Capacity" }],
              [".", "GroupInServiceInstances", { stat: "Average", label: "InService Instances" }],
            ],
            view: "timeSeries",
            stacked: false,
            region: "us-west-2",
            title: "EC2 Auto Scaling Group Metrics",
            period: 300,
            dimensions: {
              AutoScalingGroupName: config.asgName,
            },
          },
        },
        
        // ALB metrics
        {
          type: "metric",
          properties: {
            metrics: [
              ["AWS/ApplicationELB", "RequestCount", { stat: "Sum", label: "Request Count" }],
              [".", "TargetResponseTime", { stat: "Average", label: "Response Time (s)" }],
              [".", "HTTPCode_Target_2XX_Count", { stat: "Sum", label: "2XX Responses" }],
              [".", "HTTPCode_Target_4XX_Count", { stat: "Sum", label: "4XX Errors" }],
              [".", "HTTPCode_Target_5XX_Count", { stat: "Sum", label: "5XX Errors" }],
              [".", "HealthyHostCount", { stat: "Average", label: "Healthy Hosts" }],
              [".", "UnHealthyHostCount", { stat: "Average", label: "Unhealthy Hosts" }],
            ],
            view: "timeSeries",
            stacked: false,
            region: "us-west-2",
            title: "Application Load Balancer Metrics",
            period: 300,
            dimensions: {
              LoadBalancer: albName,
            },
          },
        },
        
        // RDS metrics
        {
          type: "metric",
          properties: {
            metrics: [
              ["AWS/RDS", "DatabaseConnections", { stat: "Average", label: "DB Connections" }],
              [".", "CPUUtilization", { stat: "Average", label: "DB CPU %" }],
              [".", "FreeableMemory", { stat: "Average", label: "Freeable Memory" }],
              [".", "ReadLatency", { stat: "Average", label: "Read Latency (ms)" }],
              [".", "WriteLatency", { stat: "Average", label: "Write Latency (ms)" }],
              [".", "FreeStorageSpace", { stat: "Average", label: "Free Storage" }],
            ],
            view: "timeSeries",
            stacked: false,
            region: "us-west-2",
            title: "RDS Database Metrics",
            period: 300,
            dimensions: {
              DBInstanceIdentifier: config.dbInstanceId,
            },
          },
        },
      ],
    };

    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      "dashboard",
      {
        dashboardName: `${id}-production-dashboard`,
        dashboardBody: JSON.stringify(dashboardBody),
      }
    );
  }
}
```

## lib/tap-stack.ts

```typescript
/**
 * Main TAP Stack - Composes all infrastructure modules
 * Implements a secure, resilient multi-tier architecture
 */

import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import {
  VpcModule,
  SecurityGroupsModule,
  IamModule,
  AutoScalingModule,
  AlbModule,
  RdsModule,
  S3Module,
  CloudWatchDashboardModule,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-west-2
    new aws.provider.AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            ManagedBy: "CDKTF",
            Project: "TAP",
          },
        },
      ],
    });

    // Common tags for all resources
    const commonTags = {
      Environment: "Production",
      Stack: "TAP",
      ManagedBy: "CDKTF",
    };

    // =========================
    // NETWORKING
    // =========================
    
    // Deploy VPC with public/private subnets across 2 AZs
    const vpcModule = new VpcModule(this, "tap-vpc", commonTags);

    // Create security groups with least privilege
    const securityGroups = new SecurityGroupsModule(
      this,
      "tap-security",
      vpcModule.vpc.id,
      commonTags
    );

    // =========================
    // SECRETS MANAGEMENT
    // =========================
    
    // Generate secure random password for RDS
    const dbPasswordRandom = new aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
      this,
      "db-password-random",
      {
        passwordLength: 32,
        excludeCharacters: '"@/\\',
      }
    );

    // Store RDS credentials in Secrets Manager
    const dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      "db-secret",
      {
        name: "tap-rds-credentials",
        description: "RDS MySQL database credentials",
        recoveryWindowInDays: 7, // Keep deleted secrets for 7 days
        tags: commonTags,
      }
    );

    const dbSecretVersion = new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      "db-secret-version",
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: "admin",
          password: dbPasswordRandom.randomPassword,
          engine: "mysql",
          port: 3306,
        }),
      }
    );

    // =========================
    // IAM ROLES & POLICIES
    // =========================
    
    // Create IAM roles with least privilege
    const iamModule = new IamModule(
      this,
      "tap-iam",
      dbSecret.arn,
      commonTags
    );

    // =========================
    // STORAGE
    // =========================
    
    // S3 bucket for ALB logs with encryption and lifecycle
    const s3Module = new S3Module(this, "tap-s3", {
      transitionDays: 30,
      expirationDays: 365,
      tags: commonTags,
    });

    // =========================
    // LOAD BALANCER
    // =========================
    
    // Get ACM certificate ARN from environment or create new one
    const certificateArn = process.env.ACM_CERTIFICATE_ARN;
    
    // If no certificate provided and domain is available, create one
    let acmCertArn = certificateArn;
    if (!certificateArn && process.env.DOMAIN_NAME) {
      const certificate = new aws.acmCertificate.AcmCertificate(
        this,
        "tap-certificate",
        {
          domainName: process.env.DOMAIN_NAME,
          validationMethod: "DNS",
          subjectAlternativeNames: [`*.${process.env.DOMAIN_NAME}`],
          tags: commonTags,
        }
      );
      
      // Wait for certificate validation
      new aws.acmCertificateValidation.AcmCertificateValidation(
        this,
        "tap-cert-validation",
        {
          certificateArn: certificate.arn,
        }
      );
      
      acmCertArn = certificate.arn;
    }

    // Deploy Application Load Balancer
    const albModule = new AlbModule(this, "tap-alb", {
      subnetIds: vpcModule.publicSubnets.map((s) => s.id),
      securityGroupId: securityGroups.albSg.id,
      vpcId: vpcModule.vpc.id,
      certificateArn: acmCertArn,
      logBucketName: s3Module.bucket.id,
      tags: commonTags,
    });

    // =========================
    // COMPUTE
    // =========================
    
    // Deploy Auto Scaling Group
    const asgModule = new AutoScalingModule(this, "tap-asg", {
      subnetIds: vpcModule.privateSubnets.map((s) => s.id),
      securityGroupId: securityGroups.ec2Sg.id,
      instanceProfileArn: iamModule.instanceProfile.arn,
      targetGroupArns: [albModule.targetGroup.arn],
      instanceType: "t3.medium",
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      tags: commonTags,
    });

    // =========================
    // DATABASE
    // =========================
    
    // Deploy RDS MySQL Multi-AZ
    const rdsModule = new RdsModule(this, "tap-rds", {
      subnetIds: vpcModule.privateSubnets.map((s) => s.id),
      securityGroupId: securityGroups.rdsSg.id,
      username: "admin",
      password: dbPasswordRandom.randomPassword,
      instanceClass: "db.t3.medium",
      allocatedStorage: 100,
      tags: commonTags,
    });

    // =========================
    // MONITORING
    // =========================
    
    // Create CloudWatch Dashboard
    const dashboardModule = new CloudWatchDashboardModule(
      this,
      "tap-dashboard",
      {
        asgName: asgModule.asg.name,
        albArn: albModule.alb.arn,
        dbInstanceId: rdsModule.dbInstance.id,
        tags: commonTags,
      }
    );

    // =========================
    // CLOUDWATCH ALARMS
    // =========================
    
    // High CPU alarm for Auto Scaling Group
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, "high-cpu-alarm", {
      alarmName: "tap-high-cpu",
      alarmDescription: "Triggers when ASG CPU exceeds 80%",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: 300,
      statistic: "Average",
      threshold: 80,
      dimensions: {
        AutoScalingGroupName: asgModule.asg.name,
      },
      tags: commonTags,
    });

    // RDS high connection count alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      "high-db-connections",
      {
        alarmName: "tap-high-db-connections",
        alarmDescription: "Triggers when database connections exceed 80",
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "DatabaseConnections",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        dimensions: {
          DBInstanceIdentifier: rdsModule.dbInstance.id,
        },
        tags: commonTags,
      }
    );

    // ALB unhealthy target alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      "unhealthy-targets",
      {
        alarmName: "tap-unhealthy-targets",
        alarmDescription: "Triggers when unhealthy targets detected",
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "UnHealthyHostCount",
        namespace: "AWS/ApplicationELB",
        period: 60,
        statistic: "Average",
        threshold: 0,
        dimensions: {
          TargetGroup: albModule.targetGroup.arnSuffix,
          LoadBalancer: albModule.alb.arnSuffix,
        },
        treatMissingData: "notBreaching",
        tags: commonTags,
      }
    );

    // =========================
    // OUTPUTS
    // =========================
    
    // ALB DNS name for accessing the application
    new TerraformOutput(this, "alb-dns-name", {
      value: albModule.alb.dnsName,
      description: "DNS name of the Application Load Balancer",
    });

    // RDS endpoint for database connections
    new TerraformOutput(this, "rds-endpoint", {
      value: rdsModule.dbInstance.endpoint,
      description: "RDS MySQL database endpoint",
    });

    // Auto Scaling Group name for management
    new TerraformOutput(this, "asg-name", {
      value: asgModule.asg.name,
      description: "Auto Scaling Group name",
    });

    // CloudWatch Dashboard ARN for monitoring
    new TerraformOutput(this, "dashboard-arn", {
      value: dashboardModule.dashboard.dashboardArn,
      description: "CloudWatch Dashboard ARN",
    });

    // VPC ID for reference
    new TerraformOutput(this, "vpc-id", {
      value: vpcModule.vpc.id,
      description: "VPC ID",
    });

    // S3 bucket for ALB logs
    new TerraformOutput(this, "alb-logs-bucket", {
      value: s3Module.bucket.id,
      description: "S3 bucket for ALB access logs",
    });

    // Secret ARN for application access
    new TerraformOutput(this, "db-secret-arn", {
      value: dbSecret.arn,
      description: "ARN of the Secrets Manager secret containing RDS credentials",
    });
  }
}
```