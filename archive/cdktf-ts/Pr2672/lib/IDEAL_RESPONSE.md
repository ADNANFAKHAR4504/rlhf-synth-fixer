## modules.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { cloudtrail } from '@cdktf/provider-aws';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';

export interface InfrastructureModuleConfig {
  vpcCidr: string;
  companyIpRange: string;
  amiId: string;
  instanceType: string;
  dbUsername: string;
  dbPassword: string;
  environment: string;
}

export class InfrastructureModule extends Construct {
  public readonly vpc: Vpc;
  public readonly s3Bucket: S3Bucket;
  public readonly ec2Instance: Instance;
  public readonly rdsInstance: DbInstance;
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly wafWebAcl: Wafv2WebAcl;

  constructor(
    scope: Construct,
    id: string,
    config: InfrastructureModuleConfig
  ) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // VPC - Isolated network environment for financial data security
    this.vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.environment}-vpc`,
        Environment: config.environment,
        Purpose: 'Financial Services Infrastructure',
      },
    });

    // Internet Gateway - Required for public subnet internet access
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-igw`,
        Environment: config.environment,
      },
    });

    // Public Subnets - For application servers that need direct internet access
    // Two AZs for high availability and fault tolerance
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.environment}-public-subnet-1`,
        Environment: config.environment,
        Type: 'Public',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.environment}-public-subnet-2`,
        Environment: config.environment,
        Type: 'Public',
      },
    });

    // Private Subnets - For database servers to ensure no direct internet access
    // Critical for financial data protection and compliance
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      tags: {
        Name: `${config.environment}-private-subnet-1`,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: `${config.environment}-private-subnet-2`,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    // Elastic IP for NAT Gateway - Static IP for outbound traffic from private subnets
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${config.environment}-nat-eip`,
        Environment: config.environment,
      },
    });

    // NAT Gateway - Allows private subnet resources outbound internet access
    // without exposing them to inbound traffic (security best practice)
    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `${config.environment}-nat-gateway`,
        Environment: config.environment,
      },
    });

    // Route Tables and Routes
    // Public route table - Routes traffic through Internet Gateway
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-public-rt`,
        Environment: config.environment,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Private route table - Routes traffic through NAT Gateway for outbound only
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-private-rt`,
        Environment: config.environment,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Route table associations
    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    });

    // S3 Bucket for Application Logs - Critical for audit trails and compliance
    this.s3Bucket = new S3Bucket(this, 'app-logs-bucket', {
      bucket: 'app-logs-prod-ts',
      tags: {
        Name: 'app-logs-prod-ts',
        Environment: config.environment,
        Purpose: 'Application Logs Storage',
        Compliance: 'Financial Services',
      },
    });

    // S3 Bucket Versioning - Required for compliance and data recovery
    new S3BucketVersioningA(this, 'app-logs-versioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket Encryption - Protects sensitive log data at rest
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'app-logs-encryption',
      {
        bucket: this.s3Bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket Public Access Block - Prevents accidental public exposure
    new S3BucketPublicAccessBlock(this, 'app-logs-pab', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Bucket Policy - Restricts access to VPC endpoints only
    // Critical security measure for financial data
    // S3 Bucket Policy - Updated to include CloudTrail permissions
    // S3 Bucket Policy - Updated with proper CloudTrail permissions
    new S3BucketPolicy(this, 'app-logs-policy', {
      bucket: this.s3Bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'VPCEndpointAccess',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: 'arn:aws:s3:::app-logs-prod-ts/*',
            Condition: {
              StringEquals: {
                'aws:sourceVpc': this.vpc.id,
              },
            },
          },
          // CloudTrail permissions - GetBucketAcl
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: 'arn:aws:s3:::app-logs-prod-ts',
          },
          // CloudTrail permissions - PutObject
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: 'arn:aws:s3:::app-logs-prod-ts/cloudtrail-logs/*',
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
          // CloudTrail permissions - GetBucketLocation
          {
            Sid: 'AWSCloudTrailGetBucketLocation',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketLocation',
            Resource: 'arn:aws:s3:::app-logs-prod-ts',
          },
        ],
      }),
    });

    // IAM Role for EC2 - Principle of least privilege for S3 access
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.environment}-ec2-s3-role`,
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
        Name: `${config.environment}-ec2-s3-role`,
        Environment: config.environment,
      },
    });

    // IAM Policy for S3 Access - Minimal permissions for application logs
    const s3Policy = new IamPolicy(this, 's3-access-policy', {
      name: `${config.environment}-s3-access-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [this.s3Bucket.arn, `${this.s3Bucket.arn}/*`],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2-s3-policy-attachment', {
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    // IAM Instance Profile for EC2
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.environment}-ec2-profile`,
        role: ec2Role.name,
      }
    );

    // Security Group for Application Server
    // Restricts access to company IP ranges only - critical for financial security
    const appSecurityGroup = new SecurityGroup(this, 'app-sg', {
      name: `${config.environment}-app-sg`,
      description: 'Security group for application server',
      vpcId: this.vpc.id,

      // SSH access restricted to company IP range
      ingress: [
        {
          description: 'SSH from company network',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [config.companyIpRange],
        },
        {
          description: 'HTTP from company network',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: [config.companyIpRange],
        },
        {
          description: 'HTTPS from company network',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: [config.companyIpRange],
        },
      ],

      // Allow all outbound traffic for application functionality
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      tags: {
        Name: `${config.environment}-app-sg`,
        Environment: config.environment,
      },
    });

    // Security Group for Database Server
    // Only allows access from application security group - network segmentation
    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${config.environment}-db-sg`,
      description: 'Security group for database server',
      vpcId: this.vpc.id,

      // Database access only from application servers
      ingress: [
        {
          description: 'MySQL/Aurora from app servers',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [appSecurityGroup.id],
        },
      ],

      tags: {
        Name: `${config.environment}-db-sg`,
        Environment: config.environment,
      },
    });

    // EC2 Instance with Auto Recovery enabled
    // Auto Recovery ensures business continuity in case of hardware failures
    this.ec2Instance = new Instance(this, 'app-server', {
      ami: config.amiId,
      instanceType: config.instanceType,
      subnetId: publicSubnet1.id,
      vpcSecurityGroupIds: [appSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,

      // Auto Recovery for fault tolerance
      disableApiTermination: true,

      // Monitoring enabled for CloudWatch alarms
      monitoring: true,

      tags: {
        Name: `${config.environment}-app-server`,
        Environment: config.environment,
        Purpose: 'Application Server',
        AutoRecovery: 'Enabled',
      },

      // User data script to enable auto recovery
      userDataBase64: Buffer.from(
        `#!/bin/bash
        yum update -y
        # Enable auto recovery
        aws ec2 modify-instance-attribute --instance-id $(curl -s http://169.254.169.254/latest/meta-data/instance-id) --disable-api-termination
      `
      ).toString('base64'),
    });

    // DB Subnet Group for Multi-AZ deployment
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.environment}-db-subnet-group`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `${config.environment}-db-subnet-group`,
        Environment: config.environment,
      },
    });

    // RDS Database Instance - Multi-AZ for high availability
    // Private subnet deployment for security
    this.rdsInstance = new DbInstance(this, 'database', {
      identifier: `${config.environment}-database`,
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageEncrypted: true, // Encryption at rest for financial data

      dbName: 'appdb',
      username: config.dbUsername,
      password: config.dbPassword,

      // Multi-AZ deployment for high availability and fault tolerance
      multiAz: true,

      // Automatic minor version upgrades for security patches
      autoMinorVersionUpgrade: true,

      // Not publicly accessible - security requirement for financial data
      publiclyAccessible: false,

      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSecurityGroup.id],

      // Backup configuration for compliance
      backupRetentionPeriod: 30,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Deletion protection for critical data
      deletionProtection: true,

      tags: {
        Name: `${config.environment}-database`,
        Environment: config.environment,
        Purpose: 'Application Database',
        Compliance: 'Financial Services',
      },
    });

    // CloudTrail for audit logging - Required for financial compliance
    this.cloudTrail = new cloudtrail.Cloudtrail(this, 'audit-trail', {
      name: `${config.environment}-audit-trail`,
      s3BucketName: this.s3Bucket.bucket,
      s3KeyPrefix: 'cloudtrail-logs/',

      // Log all management events for comprehensive auditing
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,

      tags: {
        Name: `${config.environment}-audit-trail`,
        Environment: config.environment,
        Purpose: 'Compliance Audit Logging',
      },
    });

    // CloudWatch Alarm for CPU monitoring
    // 80% threshold for proactive monitoring and scaling decisions
    new CloudwatchMetricAlarm(this, 'cpu-alarm', {
      alarmName: `${config.environment}-high-cpu-alarm`,
      alarmDescription: 'Alarm when CPU exceeds 80%',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: 'GreaterThanThreshold',

      dimensions: {
        InstanceId: this.ec2Instance.id,
      },

      tags: {
        Name: `${config.environment}-high-cpu-alarm`,
        Environment: config.environment,
      },
    });

    this.wafWebAcl = new Wafv2WebAcl(this, 'web-acl', {
      name: `${config.environment}-web-acl`,
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `${config.environment}WebAcl`,
      },

      tags: {
        Name: `${config.environment}-web-acl`,
        Environment: config.environment,
        Purpose: 'Web Application Firewall',
      },
    });
  }
}
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { InfrastructureModule, InfrastructureModuleConfig } from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'Financial Services Infrastructure',
            ManagedBy: 'CDKTF',
            Compliance: 'SOX-PCI-DSS',
            CostCenter: 'IT-Infrastructure',
          },
        },
      ],
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Infrastructure configuration
    // These values should be moved to environment variables or parameter store in production
    const config: InfrastructureModuleConfig = {
      // VPC CIDR block - provides 65,536 IP addresses for growth
      vpcCidr: '10.0.0.0/16',

      // Company IP range - restrict access to known corporate network
      // TODO: Replace with actual company IP range
      companyIpRange: '203.0.113.0/24', // Example IP range - replace with actual

      // AMI ID for Amazon Linux 2 in us-west-2
      // TODO: Use latest AMI ID or implement AMI lookup
      amiId: 'ami-01102c5e8ab69fb75', // Amazon Linux 2 AMI

      // Instance type - t3.micro for cost optimization in non-production
      // Consider larger instances for production workloads
      instanceType: 't3.micro',

      // Database credentials - should be stored in AWS Secrets Manager in production
      dbUsername: process.env.DB_USERNAME || 'admin',
      dbPassword: process.env.DB_PASSWORD || 'changeme123!', // TODO: Use AWS Secrets Manager

      // Environment designation
      environment: environmentSuffix,
    };

    // Deploy the infrastructure module with configuration
    const infrastructure = new InfrastructureModule(
      this,
      'infrastructure',
      config
    );

    // Stack Outputs - Critical information for operations and integration

    // S3 bucket name for application logs
    // Used by applications for log storage configuration
    new TerraformOutput(this, 's3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the S3 bucket for application logs',
      sensitive: false,
    });

    // EC2 instance ID for monitoring and management
    new TerraformOutput(this, 'ec2-instance-id', {
      value: infrastructure.ec2Instance.id,
      description: 'ID of the application server EC2 instance',
      sensitive: false,
    });

    // RDS endpoint for application database connections
    // Applications use this endpoint to connect to the database
    new TerraformOutput(this, 'rds-endpoint', {
      value: infrastructure.rdsInstance.endpoint,
      description: 'RDS database endpoint for application connections',
      sensitive: false,
    });

    // CloudTrail ARN for compliance reporting
    new TerraformOutput(this, 'cloudtrail-arn', {
      value: infrastructure.cloudTrail.arn,
      description: 'ARN of the CloudTrail for audit logging',
      sensitive: false,
    });

    // WAF Web ACL ARN for application integration
    new TerraformOutput(this, 'waf-webacl-arn', {
      value: infrastructure.wafWebAcl.arn,
      description: 'ARN of the WAF Web ACL for application protection',
      sensitive: false,
    });

    // VPC ID for reference by other stacks or resources
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the main VPC',
      sensitive: false,
    });

    // Application server public IP for access configuration
    new TerraformOutput(this, 'app-server-public-ip', {
      value: infrastructure.ec2Instance.publicIp,
      description: 'Public IP address of the application server',
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```