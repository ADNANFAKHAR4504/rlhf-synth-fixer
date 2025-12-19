I'll design a secure and efficient AWS environment using CDKTF in TypeScript that meets all your requirements. Here's the complete implementation:

## modules.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformVariable } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";

export interface SecureAppModuleConfig {
  environment: string;
  allowedIpRanges: string[];
  dbUsername: string;
  dbPassword: string;
  instanceType: string;
}

export class SecureAppModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly kmsKey: KmsKey;
  public readonly s3Bucket: S3Bucket;
  public readonly rdsInstance: DbInstance;
  public readonly ec2Instance: Instance;
  public readonly cloudwatchLogGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: SecureAppModuleConfig) {
    super(scope, id);

    const resourcePrefix = `SecureApp-${config.environment}`;

    // KMS Key for encryption
    this.kmsKey = new KmsKey(this, "kms-key", {
      description: `${resourcePrefix} encryption key`,
      enableKeyRotation: true,
      tags: {
        Name: `${resourcePrefix}-kms-key`,
        Environment: config.environment,
      },
    });

    new KmsAlias(this, "kms-alias", {
      name: `alias/${resourcePrefix.toLowerCase()}-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${resourcePrefix}-vpc`,
        Environment: config.environment,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${resourcePrefix}-igw`,
        Environment: config.environment,
      },
    });

    // Public Subnets
    this.publicSubnets = [
      new Subnet(this, "public-subnet-a", {
        vpcId: this.vpc.id,
        cidrBlock: "10.0.1.0/24",
        availabilityZone: "us-west-2a",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${resourcePrefix}-public-subnet-a`,
          Environment: config.environment,
        },
      }),
      new Subnet(this, "public-subnet-b", {
        vpcId: this.vpc.id,
        cidrBlock: "10.0.2.0/24",
        availabilityZone: "us-west-2b",
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${resourcePrefix}-public-subnet-b`,
          Environment: config.environment,
        },
      }),
    ];

    // Private Subnets
    this.privateSubnets = [
      new Subnet(this, "private-subnet-a", {
        vpcId: this.vpc.id,
        cidrBlock: "10.0.3.0/24",
        availabilityZone: "us-west-2a",
        tags: {
          Name: `${resourcePrefix}-private-subnet-a`,
          Environment: config.environment,
        },
      }),
      new Subnet(this, "private-subnet-b", {
        vpcId: this.vpc.id,
        cidrBlock: "10.0.4.0/24",
        availabilityZone: "us-west-2b",
        tags: {
          Name: `${resourcePrefix}-private-subnet-b`,
          Environment: config.environment,
        },
      }),
    ];

    // Route Tables
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${resourcePrefix}-public-rt`,
        Environment: config.environment,
      },
    });

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

    // Security Groups
    const webSecurityGroup = new SecurityGroup(this, "web-sg", {
      name: `${resourcePrefix}-web-sg`,
      description: "Security group for web servers",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: config.allowedIpRanges,
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: config.allowedIpRanges,
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: config.allowedIpRanges,
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
        Name: `${resourcePrefix}-web-sg`,
        Environment: config.environment,
      },
    });

    const dbSecurityGroup = new SecurityGroup(this, "db-sg", {
      name: `${resourcePrefix}-db-sg`,
      description: "Security group for RDS database",
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [webSecurityGroup.id],
        },
      ],
      tags: {
        Name: `${resourcePrefix}-db-sg`,
        Environment: config.environment,
      },
    });

    // S3 Bucket
    this.s3Bucket = new S3Bucket(this, "s3-bucket", {
      bucket: `${resourcePrefix.toLowerCase()}-storage-${Math.random().toString(36).substring(7)}`,
      tags: {
        Name: `${resourcePrefix}-storage`,
        Environment: config.environment,
      },
    });

    new S3BucketVersioning(this, "s3-versioning", {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    new S3BucketServerSideEncryptionConfiguration(this, "s3-encryption", {
      bucket: this.s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: this.kmsKey.arn,
            sseAlgorithm: "aws:kms",
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, "s3-public-access-block", {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // CloudWatch Log Group
    this.cloudwatchLogGroup = new CloudwatchLogGroup(this, "log-group", {
      name: `/aws/ec2/${resourcePrefix}`,
      retentionInDays: config.environment === "production" ? 90 : 30,
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Name: `${resourcePrefix}-logs`,
        Environment: config.environment,
      },
    });

    // IAM Role for EC2
    const ec2Role = new IamRole(this, "ec2-role", {
      name: `${resourcePrefix}-ec2-role`,
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
        Name: `${resourcePrefix}-ec2-role`,
        Environment: config.environment,
      },
    });

    // IAM Policy for EC2
    const ec2Policy = new IamPolicy(this, "ec2-policy", {
      name: `${resourcePrefix}-ec2-policy`,
      description: "Policy for EC2 instances",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
            ],
            Resource: [`${this.s3Bucket.arn}/*`],
          },
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: [this.cloudwatchLogGroup.arn],
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:GenerateDataKey",
            ],
            Resource: [this.kmsKey.arn],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, "ec2-policy-attachment", {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(this, "instance-profile", {
      name: `${resourcePrefix}-instance-profile`,
      role: ec2Role.name,
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${resourcePrefix.toLowerCase()}-db-subnet-group`,
      subnetIds: this.privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${resourcePrefix}-db-subnet-group`,
        Environment: config.environment,
      },
    });

    // RDS Instance
    this.rdsInstance = new DbInstance(this, "rds-instance", {
      identifier: `${resourcePrefix.toLowerCase()}-db`,
      allocatedStorage: config.environment === "production" ? 100 : 20,
      storageType: "gp2",
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: config.environment === "production" ? "db.t3.medium" : "db.t3.micro",
      dbName: "secureappdb",
      username: config.dbUsername,
      password: config.dbPassword,
      vpcSecurityGroupIds: [dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: config.environment === "production" ? 7 : 3,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      multiAz: config.environment === "production",
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,
      monitoringInterval: 60,
      enabledCloudwatchLogsExports: ["error", "general", "slowquery"],
      skipFinalSnapshot: config.environment !== "production",
      tags: {
        Name: `${resourcePrefix}-db`,
        Environment: config.environment,
      },
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    // EC2 Instance
    this.ec2Instance = new Instance(this, "web-instance", {
      ami: ami.id,
      instanceType: config.instanceType,
      keyName: config.environment === "production" ? "prod-key" : "dev-key",
      vpcSecurityGroupIds: [webSecurityGroup.id],
      subnetId: this.publicSubnets[0].id,
      iamInstanceProfile: instanceProfile.name,
      userData: Buffer.from(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs
systemctl start awslogsd
systemctl enable awslogsd
`).toString('base64'),
      tags: {
        Name: `${resourcePrefix}-web-server`,
        Environment: config.environment,
      },
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, "ec2-cpu-alarm", {
      alarmName: `${resourcePrefix}-ec2-high-cpu`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/EC2",
      period: "300",
      statistic: "Average",
      threshold: "80",
      alarmDescription: "This metric monitors ec2 cpu utilization",
      dimensions: {
        InstanceId: this.ec2Instance.id,
      },
      tags: {
        Name: `${resourcePrefix}-ec2-cpu-alarm`,
        Environment: config.environment,
      },
    });

    new CloudwatchMetricAlarm(this, "rds-cpu-alarm", {
      alarmName: `${resourcePrefix}-rds-high-cpu`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: "300",
      statistic: "Average",
      threshold: "80",
      alarmDescription: "This metric monitors RDS cpu utilization",
      dimensions: {
        DBInstanceIdentifier: this.rdsInstance.id,
      },
      tags: {
        Name: `${resourcePrefix}-rds-cpu-alarm`,
        Environment: config.environment,
      },
    });

    new CloudwatchMetricAlarm(this, "rds-memory-alarm", {
      alarmName: `${resourcePrefix}-rds-low-memory`,
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: "2",
      metricName: "FreeableMemory",
      namespace: "AWS/RDS",
      period: "300",
      statistic: "Average",
      threshold: "100000000", // 100MB in bytes
      alarmDescription: "This metric monitors RDS freeable memory",
      dimensions: {
        DBInstanceIdentifier: this.rdsInstance.id,
      },
      tags: {
        Name: `${resourcePrefix}-rds-memory-alarm`,
        Environment: config.environment,
      },
    });
  }
}
```

## tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformVariable, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { SecureAppModule, SecureAppModuleConfig } from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Environment variable (can be set via TF_VAR_environment)
    const environmentVar = new TerraformVariable(this, "environment", {
      type: "string",
      description: "Environment name (development or production)",
      default: "development",
      validation: [
        {
          condition: "${contains([\"development\", \"production\"], var.environment)}",
          errorMessage: "Environment must be either 'development' or 'production'.",
        },
      ],
    });

    // Database credentials (should be set via environment variables)
    const dbUsernameVar = new TerraformVariable(this, "db_username", {
      type: "string",
      description: "Database username",
      default: "admin",
    });

    const dbPasswordVar = new TerraformVariable(this, "db_password", {
      type: "string",
      description: "Database password",
      sensitive: true,
    });

    // Allowed IP ranges for security groups
    const allowedIpRangesVar = new TerraformVariable(this, "allowed_ip_ranges", {
      type: "list(string)",
      description: "List of allowed IP ranges for security groups",
      default: ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
    });

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Project: "SecureApp",
            ManagedBy: "CDKTF",
            Environment: environmentVar.stringValue,
          },
        },
      ],
    });

    // Environment-specific configuration
    const isProd = "${var.environment == \"production\"}";
    
    const config: SecureAppModuleConfig = {
      environment: environmentVar.stringValue,
      allowedIpRanges: allowedIpRangesVar.listValue,
      dbUsername: dbUsernameVar.stringValue,
      dbPassword: dbPasswordVar.stringValue,
      instanceType: `\${${isProd} ? "t3.medium" : "t3.micro"}`,
    };

    // Deploy the SecureApp module
    const secureApp = new SecureAppModule(this, "secure-app", config);

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: secureApp.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "s3_bucket_name", {
      value: secureApp.s3Bucket.bucket,
      description: "S3 bucket name",
    });

    new TerraformOutput(this, "rds_endpoint", {
      value: secureApp.rdsInstance.endpoint,
      description: "RDS endpoint",
      sensitive: true,
    });

    new TerraformOutput(this, "ec2_public_ip", {
      value: secureApp.ec2Instance.publicIp,
      description: "EC2 instance public IP",
    });

    new TerraformOutput(this, "cloudwatch_log_group", {
      value: secureApp.cloudwatchLogGroup.name,
      description: "CloudWatch log group name",
    });
  }
}

const app = new App();
new TapStack(app, "tap-stack");
app.synth();
```

## Key Features Implemented

### 🔐 **Security & Compliance**
- **KMS Encryption**: All services use KMS encryption (S3, RDS, CloudWatch logs)
- **IAM Least Privilege**: EC2 instances use IAM roles with minimal required permissions
- **Security Groups**: Restrictive inbound/outbound rules with configurable IP ranges
- **S3 Security**: Public access blocked, versioning enabled, encryption at rest

### 🏗️ **Infrastructure Architecture**
- **VPC**: CIDR 10.0.0.0/16 with public/private subnets across AZ A & B
- **High Availability**: Multi-AZ RDS deployment in production
- **Network Segmentation**: Separate subnets for web and database tiers

### 📊 **Monitoring & Logging**
- **CloudWatch Alarms**: CPU monitoring for EC2 and RDS, memory monitoring for RDS
- **Centralized Logging**: CloudWatch log groups with KMS encryption
- **Retention Policies**: Environment-specific log retention (30 days dev, 90 days prod)

### 🌍 **Environment Management**
- **Conditional Logic**: Different configurations for development vs production
- **Variable Management**: Sensitive values via Terraform variables
- **Resource Naming**: Consistent `SecureApp-{environment}` prefix

### 🚀 **Deployment Ready**
Deploy with CDKTF CLI:

```bash
# Development
export TF_VAR_db_password="your-secure-password"
cdktf deploy

# Production
export TF_VAR_environment="production"
export TF_VAR_db_password="your-production-password"
cdktf deploy
```

This implementation provides a production-ready, secure, and compliant AWS infrastructure that can be deployed via CDKTF CLI with proper environment separation and comprehensive monitoring.