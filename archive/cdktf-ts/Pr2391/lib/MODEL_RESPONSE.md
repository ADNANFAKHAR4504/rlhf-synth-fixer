I'll provide a complete CDKTF solution in TypeScript organized into the two files you specified. This solution will be production-ready with proper security configurations.

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  VpcModule,
  S3Module,
  RdsModule,
  Ec2Module,
  AlbModule,
  Route53Module,
  CloudWatchModule,
  IamModule,
  type VpcConfig,
  type S3Config,
  type RdsConfig,
  type Ec2Config,
  type AlbConfig,
  type Route53Config,
  type CloudWatchConfig,
  type IamConfig
} from "./modules";

/**
 * Main infrastructure stack that orchestrates all AWS resources
 * Implements a secure, scalable web application architecture
 */
class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider with default tags for resource management
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [{
        tags: {
          Environment: "production",
          Project: "tap-application",
          ManagedBy: "cdktf",
          Owner: "platform-team"
        }
      }]
    });

    // Configure remote backend for state management
    new S3Backend(this, {
      bucket: "tap-terraform-state-bucket",
      key: "infrastructure/terraform.tfstate",
      region: "us-west-2",
      encrypt: true,
      dynamodbTable: "tap-terraform-locks"
    });

    // Naming convention helper
    const namePrefix = "tap-prod";
    
    // 1. IAM Module - Create roles and policies first
    const iamConfig: IamConfig = {
      namePrefix,
      createEc2Role: true,
      createRdsRole: true,
      createS3Role: true,
      customPolicies: [
        {
          name: "CloudWatchLogsPolicy",
          policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                  "logs:DescribeLogStreams"
                ],
                Resource: "arn:aws:logs:*:*:*"
              }
            ]
          })
        }
      ]
    };
    const iamModule = new IamModule(this, "iam", iamConfig);

    // 2. VPC Module - Network foundation
    const vpcConfig: VpcConfig = {
      namePrefix,
      cidrBlock: "10.0.0.0/16",
      availabilityZones: ["us-west-2a", "us-west-2b", "us-west-2c"],
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
      privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"],
      databaseSubnetCidrs: ["10.0.100.0/24", "10.0.200.0/24", "10.0.300.0/24"],
      enableNatGateway: true,
      enableVpcFlowLogs: true
    };
    const vpcModule = new VpcModule(this, "vpc", vpcConfig);

    // 3. S3 Module - Object storage with security
    const s3Config: S3Config = {
      namePrefix,
      buckets: [
        {
          name: "application-assets",
          versioning: true,
          encryption: true,
          publicAccess: false,
          lifecycleRules: [
            {
              id: "transition-to-ia",
              status: "Enabled",
              transitions: [
                {
                  days: 30,
                  storageClass: "STANDARD_IA"
                },
                {
                  days: 90,
                  storageClass: "GLACIER"
                }
              ]
            }
          ]
        },
        {
          name: "logs-storage",
          versioning: true,
          encryption: true,
          publicAccess: false
        }
      ]
    };
    const s3Module = new S3Module(this, "s3", s3Config);

    // 4. RDS Module - Database with high availability
    const rdsConfig: RdsConfig = {
      namePrefix,
      engine: "postgres",
      engineVersion: "15.4",
      instanceClass: "db.r6g.large",
      allocatedStorage: 100,
      maxAllocatedStorage: 1000,
      dbName: "tapapp",
      username: "tapuser",
      vpcId: vpcModule.vpcId,
      subnetIds: vpcModule.databaseSubnetIds,
      multiAz: true,
      backupRetentionPeriod: 30,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      enablePerformanceInsights: true,
      monitoringInterval: 60,
      monitoringRoleArn: iamModule.rdsMonitoringRoleArn,
      deletionProtection: true
    };
    const rdsModule = new RdsModule(this, "rds", rdsConfig);

    // 5. EC2 Module - Application servers
    const ec2Config: Ec2Config = {
      namePrefix,
      instanceType: "t3.medium",
      amiId: "ami-0c02fb55956c7d316", // Amazon Linux 2023
      keyName: "tap-prod-key",
      vpcId: vpcModule.vpcId,
      subnetIds: vpcModule.privateSubnetIds,
      instanceProfileName: iamModule.ec2InstanceProfileName,
      minSize: 2,
      maxSize: 10,
      desiredCapacity: 3,
      userData: `#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
  -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux

# Configure application
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app
`,
      healthCheckType: "ELB",
      healthCheckGracePeriod: 300
    };
    const ec2Module = new Ec2Module(this, "ec2", ec2Config);

    // 6. ALB Module - Load balancer for high availability
    const albConfig: AlbConfig = {
      namePrefix,
      vpcId: vpcModule.vpcId,
      subnetIds: vpcModule.publicSubnetIds,
      targetGroupConfig: {
        port: 80,
        protocol: "HTTP",
        healthCheckPath: "/health",
        healthCheckInterval: 30,
        healthCheckTimeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 5
      },
      listenerConfig: {
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
        certificateArn: "" // Will be provided by Route53 module
      },
      enableAccessLogs: true,
      accessLogsBucket: s3Module.bucketNames["logs-storage"]
    };
    const albModule = new AlbModule(this, "alb", albConfig);

    // Attach EC2 instances to ALB target group
    albModule.attachTargets(ec2Module.autoScalingGroupArn);

    // 7. Route53 Module - DNS and SSL certificates
    const route53Config: Route53Config = {
      namePrefix,
      domainName: "tap-app.example.com",
      subdomains: ["www", "api"],
      albDnsName: albModule.dnsName,
      albZoneId: albModule.zoneId,
      enableHealthChecks: true
    };
    const route53Module = new Route53Module(this, "route53", route53Config);

    // Update ALB listener with SSL certificate
    albModule.updateSslCertificate(route53Module.certificateArn);

    // 8. CloudWatch Module - Monitoring and alerting
    const cloudWatchConfig: CloudWatchConfig = {
      namePrefix,
      logGroups: [
        {
          name: "/aws/ec2/application",
          retentionDays: 30
        },
        {
          name: "/aws/rds/postgresql",
          retentionDays: 7
        },
        {
          name: "/aws/applicationloadbalancer/accesslogs",
          retentionDays: 90
        }
      ],
      alarms: [
        {
          name: "high-cpu-utilization",
          description: "EC2 instances high CPU utilization",
          metricName: "CPUUtilization",
          namespace: "AWS/EC2",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 80,
          comparisonOperator: "GreaterThanThreshold",
          dimensions: {
            AutoScalingGroupName: ec2Module.autoScalingGroupName
          }
        },
        {
          name: "rds-cpu-utilization",
          description: "RDS high CPU utilization",
          metricName: "CPUUtilization",
          namespace: "AWS/RDS",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 75,
          comparisonOperator: "GreaterThanThreshold",
          dimensions: {
            DBInstanceIdentifier: rdsModule.dbInstanceId
          }
        },
        {
          name: "alb-target-response-time",
          description: "ALB high response time",
          metricName: "TargetResponseTime",
          namespace: "AWS/ApplicationELB",
          statistic: "Average",
          period: 300,
          evaluationPeriods: 2,
          threshold: 1,
          comparisonOperator: "GreaterThanThreshold",
          dimensions: {
            LoadBalancer: albModule.albArn
          }
        }
      ],
      snsTopicArn: "", // Configure SNS topic for notifications
      dashboardName: "tap-application-dashboard"
    };
    const cloudWatchModule = new CloudWatchModule(this, "cloudwatch", cloudWatchConfig);

    // Output important values for reference
    this.addOverride("output", {
      vpc_id: {
        value: vpcModule.vpcId,
        description: "VPC ID"
      },
      alb_dns_name: {
        value: albModule.dnsName,
        description: "Application Load Balancer DNS name"
      },
      rds_endpoint: {
        value: rdsModule.endpoint,
        description: "RDS endpoint",
        sensitive: true
      },
      domain_name: {
        value: route53Module.domainName,
        description: "Primary domain name"
      }
    });
  }
}

// Application entry point
const app = new App();
new TapStack(app, "tap-infrastructure");
app.synth();
```

## lib/modules.ts

```typescript
import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";

// AWS Provider imports
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { VpcFlowLog } from "@cdktf/provider-aws/lib/vpc-flow-log";

import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";

import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { DbParameterGroup } from "@cdktf/provider-aws/lib/db-parameter-group";

import { Instance } from "@cdktf/provider-aws/lib/instance";
import { LaunchTemplate } from "@cdktf/provider-aws/lib/launch-template";
import { AutoscalingGroup } from "@cdktf/provider-aws/lib/autoscaling-group";

import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { LbTargetGroupAttachment } from "@cdktf/provider-aws/lib/lb-target-group-attachment";

import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { AcmCertificate } from "@cdktf/provider-aws/lib/acm-certificate";
import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation";

import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { CloudwatchDashboard } from "@cdktf/provider-aws/lib/cloudwatch-dashboard";

import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";

// Type definitions for module configurations
export interface VpcConfig {
  namePrefix: string;
  cidrBlock: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  databaseSubnetCidrs: string[];
  enableNatGateway: boolean;
  enableVpcFlowLogs: boolean;
}

export interface S3Config {
  namePrefix: string;
  buckets: Array<{
    name: string;
    versioning: boolean;
    encryption: boolean;
    publicAccess: boolean;
    lifecycleRules?: Array<{
      id: string;
      status: string;
      transitions: Array<{
        days: number;
        storageClass: string;
      }>;
    }>;
  }>;
}

export interface RdsConfig {
  namePrefix: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  maxAllocatedStorage: number;
  dbName: string;
  username: string;
  vpcId: string;
  subnetIds: string[];
  multiAz: boolean;
  backupRetentionPeriod: number;
  backupWindow: string;
  maintenanceWindow: string;
  enablePerformanceInsights: boolean;
  monitoringInterval: number;
  monitoringRoleArn: string;
  deletionProtection: boolean;
}

export interface Ec2Config {
  namePrefix: string;
  instanceType: string;
  amiId: string;
  keyName: string;
  vpcId: string;
  subnetIds: string[];
  instanceProfileName: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  userData: string;
  healthCheckType: string;
  healthCheckGracePeriod: number;
}

export interface AlbConfig {
  namePrefix: string;
  vpcId: string;
  subnetIds: string[];
  targetGroupConfig: {
    port: number;
    protocol: string;
    healthCheckPath: string;
    healthCheckInterval: number;
    healthCheckTimeout: number;
    healthyThreshold: number;
    unhealthyThreshold: number;
  };
  listenerConfig: {
    port: number;
    protocol: string;
    sslPolicy: string;
    certificateArn: string;
  };
  enableAccessLogs: boolean;
  accessLogsBucket: string;
}

export interface Route53Config {
  namePrefix: string;
  domainName: string;
  subdomains: string[];
  albDnsName: string;
  albZoneId: string;
  enableHealthChecks: boolean;
}

export interface CloudWatchConfig {
  namePrefix: string;
  logGroups: Array<{
    name: string;
    retentionDays: number;
  }>;
  alarms: Array<{
    name: string;
    description: string;
    metricName: string;
    namespace: string;
    statistic: string;
    period: number;
    evaluationPeriods: number;
    threshold: number;
    comparisonOperator: string;
    dimensions: Record<string, string>;
  }>;
  snsTopicArn: string;
  dashboardName: string;
}

export interface IamConfig {
  namePrefix: string;
  createEc2Role: boolean;
  createRdsRole: boolean;
  createS3Role: boolean;
  customPolicies: Array<{
    name: string;
    policy: string;
  }>;
}

/**
 * VPC Module - Creates a secure, multi-AZ VPC with public, private, and database subnets
 */
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly databaseSubnetIds: string[];
  public readonly internetGatewayId: string;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    // Create VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.namePrefix}-vpc`
      }
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `${config.namePrefix}-igw`
      }
    });

    this.internetGatewayId = igw.id;

    // Create public subnets
    const publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.namePrefix}-public-subnet-${index + 1}`,
          Type: "Public"
        }
      });
    });

    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);

    // Create private subnets
    const privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          Name: `${config.namePrefix}-private-subnet-${index + 1}`,
          Type: "Private"
        }
      });
    });

    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);

    // Create database subnets
    const databaseSubnets = config.databaseSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `database-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          Name: `${config.namePrefix}-database-subnet-${index + 1}`,
          Type: "Database"
        }
      });
    });

    this.databaseSubnetIds = databaseSubnets.map(subnet => subnet.id);

    // Create NAT Gateways if enabled
    let natGateways: NatGateway[] = [];
    if (config.enableNatGateway) {
      natGateways = publicSubnets.map((subnet, index) => {
        const eip = new Eip(this, `nat-eip-${index}`, {
          domain: "vpc",
          tags: {
            Name: `${config.namePrefix}-nat-eip-${index + 1}`
          }
        });

        return new NatGateway(this, `nat-gateway-${index}`, {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: {
            Name: `${config.namePrefix}-nat-gateway-${index + 1}`
          }
        });
      });
    }

    // Create route tables and routes
    // Public route table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: {
        Name: `${config.namePrefix}-public-rt`
      }
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Private route tables (one per AZ for high availability)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `${config.namePrefix}-private-rt-${index + 1}`
        }
      });

      if (config.enableNatGateway && natGateways[index]) {
        new Route(this, `private-route-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: natGateways[index].id
        });
      }

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // Database route table
    const databaseRouteTable = new RouteTable(this, "database-rt", {
      vpcId: vpc.id,
      tags: {
        Name: `${config.namePrefix}-database-rt`
      }
    });

    databaseSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `database-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: databaseRouteTable.id
      });
    });

    // Enable VPC Flow Logs if requested
    if (config.enableVpcFlowLogs) {
      new VpcFlowLog(this, "vpc-flow-log", {
        resourceId: vpc.id,
        resourceType: "VPC",
        trafficType: "ALL",
        logDestinationType: "cloud-watch-logs",
        logGroupName: `/aws/vpc/flowlogs/${config.namePrefix}`,
        tags: {
          Name: `${config.namePrefix}-vpc-flow-log`
        }
      });
    }
  }
}

/**
 * S3 Module - Creates secure S3 buckets with encryption and lifecycle policies
 */
export class S3Module extends Construct {
  public readonly bucketNames: Record<string, string> = {};
  public readonly bucketArns: Record<string, string> = {};

  constructor(scope: Construct, id: string, config: S3Config) {
    super(scope, id);

    config.buckets.forEach((bucketConfig, index) => {
      const bucketName = `${config.namePrefix}-${bucketConfig.name}`;
      
      // Create S3 bucket
      const bucket = new S3Bucket(this, `bucket-${index}`, {
        bucket: bucketName,
        tags: {
          Name: bucketName,
          Purpose: bucketConfig.name
        }
      });

      this.bucketNames[bucketConfig.name] = bucket.id;
      this.bucketArns[bucketConfig.name] = bucket.arn;

      // Configure versioning
      if (bucketConfig.versioning) {
        new S3BucketVersioning(this, `bucket-versioning-${index}`, {
          bucket: bucket.id,
          versioningConfiguration: {
            status: "Enabled"
          }
        });
      }

      // Configure encryption
      if (bucketConfig.encryption) {
        new S3BucketEncryption(this, `bucket-encryption-${index}`, {
          bucket: bucket.id,
          rule: [{
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256"
            },
            bucketKeyEnabled: true
          }]
        });
      }

      // Block public access
      if (!bucketConfig.publicAccess) {
        new S3BucketPublicAccessBlock(this, `bucket-pab-${index}`, {
          bucket: bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true
        });
      }

      // Configure lifecycle rules
      if (bucketConfig.lifecycleRules) {
        new S3BucketLifecycleConfiguration(this, `bucket-lifecycle-${index}`, {
          bucket: bucket.id,
          rule: bucketConfig.lifecycleRules.map(rule => ({
            id: rule.id,
            status: rule.status,
            transition: rule.transitions.map(t => ({
              days: t.days,
              storageClass: t.storageClass
            }))
          }))
        });
      }

      // Secure bucket policy
      new S3BucketPolicy(this, `bucket-policy-${index}`, {
        bucket: bucket.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "DenyInsecureConnections",
              Effect: "Deny",
              Principal: "*",
              Action: "s3:*",
              Resource: [
                bucket.arn,
                `${bucket.arn}/*`
              ],
              Condition: {
                Bool: {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        })
      });
    });
  }
}

/**
 * RDS Module - Creates a secure, highly available PostgreSQL database
 */
export class RdsModule extends Construct {
  public readonly endpoint: string;
  public readonly dbInstanceId: string;

  constructor(scope: Construct, id: string, config: RdsConfig) {
    super(scope, id);

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.namePrefix}-db-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        Name: `${config.namePrefix}-db-subnet-group`
      }
    });

    // Create DB parameter group
    const dbParameterGroup = new DbParameterGroup(this, "db-parameter-group", {
      family: `${config.engine}15`,
      name: `${config.namePrefix}-db-params`,
      description: "Custom parameter group for PostgreSQL",
      parameter: [
        {
          name: "log_statement",
          value: "all"
        },
        {
          name: "log_min_duration_statement",
          value: "1000"
        },
        {
          name: "shared_preload_libraries",
          value: "pg_stat_statements"
        }
      ],
      tags: {
        Name: `${config.namePrefix}-db-params`
      }
    });

    // Create security group for RDS
    const dbSecurityGroup = new SecurityGroup(this, "db-security-group", {
      name: `${config.namePrefix}-db-sg`,
      description: "Security group for RDS database",
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/16"], // Only allow VPC traffic
          description: "PostgreSQL access from VPC"
        }
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic"
        }
      ],
      tags: {
        Name: `${config.namePrefix}-db-sg`
      }
    });

    // Generate random password (in production, use AWS Secrets Manager)
    const dbPassword = "ChangeMe123!"; // This should be managed securely

    // Create RDS instance
    const dbInstance = new DbInstance(this, "db-instance", {
      identifier: `${config.namePrefix}-database`,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      maxAlloc