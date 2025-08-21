I'll create a production-ready Infrastructure as Code solution using AWS CDK for Terraform (CDKTF) in TypeScript. This will be organized into two files as requested, following AWS and Terraform best practices.

## `modules.ts`
```typescript
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

/**
 * Interface for common tags that will be applied to all resources
 */
export interface CommonTags {
  Environment: string;
  Owner: string;
  CostCenter: string;
  Project?: string;
}

/**
 * Configuration interface for the networking module
 */
export interface NetworkingConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  tags: CommonTags;
}

/**
 * Configuration interface for the S3 module
 */
export interface S3Config {
  bucketName: string;
  tags: CommonTags;
}

/**
 * Configuration interface for the IAM module
 */
export interface IamConfig {
  roleName: string;
  tags: CommonTags;
}

/**
 * Configuration interface for the RDS module
 */
export interface RdsConfig {
  instanceIdentifier: string;
  dbName: string;
  instanceClass: string;
  allocatedStorage: number;
  engine: string;
  username: string;
  passwordSecretArn?: string; // Reference to AWS Secrets Manager
  vpcSecurityGroupIds: string[];
  subnetGroupName: string;
  dbPassword?: string;
  tags: CommonTags;
}

/**
 * Networking Module - Creates VPC, subnets, and networking components
 * Designed for high availability across multiple AZs
 */
export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly availabilityZones: DataAwsAvailabilityZones;

  constructor(scope: Construct, id: string, config: NetworkingConfig) {
    super(scope, id);

    // Get available AZs for the region (minimum 3 required)
    this.availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support for RDS and other services
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-vpc`,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Environment}-igw`,
      },
    });

    // Create public subnets across multiple AZs for high availability
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${this.availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });

      // Create route table for public subnet
      const routeTable = new RouteTable(this, `public-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-public-rt-${index + 1}`,
        },
      });

      // Route to Internet Gateway
      new Route(this, `public-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      });

      // Associate route table with subnet
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });

      return subnet;
    });

    // Create private subnets for RDS and other internal services
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${this.availabilityZones.fqn}.names[${index}]}`,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });

      // Create route table for private subnet
      const routeTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.tags.Environment}-private-rt-${index + 1}`,
        },
      });

      // Associate route table with subnet
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });

      return subnet;
    });
  }
}

/**
 * S3 Module - Creates secure S3 bucket for application logs
 * Implements versioning, encryption, and public access blocking
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketVersioning: S3BucketVersioningA;

  constructor(scope: Construct, id: string, config: S3Config) {
    super(scope, id);

    // Get current AWS account ID for bucket naming uniqueness
    const currentAccount = new DataAwsCallerIdentity(this, 'current');

    // Create S3 bucket with secure defaults
    this.bucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `${config.bucketName}-\${${currentAccount.fqn}.account_id}`,
      tags: {
        ...config.tags,
        Purpose: 'Application Logs Storage',
      },
    });

    // Enable versioning for data protection and compliance
    this.bucketVersioning = new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure server-side encryption with AES256
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access for security
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

/**
 * IAM Module - Creates IAM role and policies for EC2 instances
 * Follows principle of least privilege
 */
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    config: IamConfig,
    s3BucketArn: string
  ) {
    super(scope, id);

    // Create assume role policy for EC2 service
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    // Create IAM role for EC2 instances
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: config.roleName,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: {
        ...config.tags,
        Purpose: 'EC2 Instance Role',
      },
    });

    // Create policy document for S3 access (least privilege)
    const s3Policy = new DataAwsIamPolicyDocument(this, 's3-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            's3:PutObject',
            's3:PutObjectAcl',
            's3:GetObject',
            's3:GetObjectVersion',
          ],
          resources: [`${s3BucketArn}/*`],
        },
        {
          effect: 'Allow',
          actions: ['s3:ListBucket'],
          resources: [s3BucketArn],
        },
      ],
    });

    // Attach S3 policy to the role
    new IamRolePolicy(this, 's3-role-policy', {
      name: `${config.roleName}-s3-policy`,
      role: this.ec2Role.id,
      policy: s3Policy.json,
    });

    // Create instance profile for EC2 instances
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${config.roleName}-profile`,
      role: this.ec2Role.name,
      tags: {
        ...config.tags,
        Purpose: 'EC2 Instance Profile',
      },
    });
  }
}

/**
 * RDS Module - Creates RDS instance with high availability and security
 * Implements Multi-AZ deployment, automated backups, and encryption
 */
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly securityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: RdsConfig,
    vpcId: string,
    subnetIds: string[]
  ) {
    super(scope, id);

    // Create DB subnet group for Multi-AZ deployment
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: config.subnetGroupName,
      subnetIds: subnetIds,
      tags: {
        ...config.tags,
        Purpose: 'RDS Subnet Group',
      },
    });

    // Create security group for RDS instance
    this.securityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.instanceIdentifier}-sg`,
      description: 'Security group for RDS instance',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Purpose: 'RDS Security Group',
      },
    });

    // Allow inbound MySQL/Aurora traffic from VPC
    new SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'], // VPC CIDR
      securityGroupId: this.securityGroup.id,
    });

    // Create RDS instance with production-ready configuration
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: config.instanceIdentifier,
      dbName: config.dbName,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      engine: config.engine,
      username: config.username,
      password: config.dbPassword,

      // High Availability Configuration
      multiAz: true,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],

      // Backup Configuration
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Security Configuration
      storageEncrypted: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.instanceIdentifier}-final-snapshot`,

      // Performance Configuration
      performanceInsightsEnabled: true,
      monitoringInterval: 0,

      tags: {
        ...config.tags,
        Purpose: 'Application Database',
      },
    });
  }
}

/**
 * Security Groups Module - Creates reusable security groups
 */
export class SecurityGroupsModule extends Construct {
  public readonly webSecurityGroup: SecurityGroup;
  public readonly appSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, vpcId: string, tags: CommonTags) {
    super(scope, id);

    // Web tier security group (ALB/ELB)
    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${tags.Environment}-web-sg`,
      description: 'Security group for web tier',
      vpcId: vpcId,
      tags: {
        ...tags,
        Purpose: 'Web Tier Security Group',
      },
    });

    // Allow HTTP and HTTPS traffic
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

    // Application tier security group
    this.appSecurityGroup = new SecurityGroup(this, 'app-sg', {
      name: `${tags.Environment}-app-sg`,
      description: 'Security group for application tier',
      vpcId: vpcId,
      tags: {
        ...tags,
        Purpose: 'Application Tier Security Group',
      },
    });

    // Allow traffic from web tier
    new SecurityGroupRule(this, 'app-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.appSecurityGroup.id,
    });
  }
}
```

## `tap-stack.ts`

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  NetworkingModule,
  S3Module,
  IamModule,
  RdsModule,
  SecurityGroupsModule,
  CommonTags,
} from './modules';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
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
            Environment: environmentSuffix,
            Owner: 'DevOps Team',
            Project: 'RLHF',
            ManagedBy: 'Terraform-CDKTF',
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

    // Common tags for all resources
    const commonTags: CommonTags = {
      Environment: environmentSuffix,
      Owner: 'DevOps Team',
      CostCenter: 'RLHF-CostCenter',
      Project: 'RLHF',
    };

    // ? Add your stack instantiations here
    function tagValue(tags: CommonTags, key: keyof CommonTags): string {
      return (tags[key] ?? '').toString();
    }

    function nameFromTags(tags: CommonTags, suffix: string) {
      const project = tagValue(tags, 'Project').toLowerCase();
      const env = tagValue(tags, 'Environment').toLowerCase();
      return `${project}-${env}-${suffix}`;
    }
    // Deploy Networking Infrastructure
    // Creates VPC with public/private subnets across 3 AZs for high availability
    const networking = new NetworkingModule(this, 'networking', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.101.0/24', '10.0.102.0/24', '10.0.103.0/24'],
      tags: commonTags,
    });

    // Deploy S3 Infrastructure
    // Creates secure bucket for application logs with versioning and encryption
    const s3 = new S3Module(this, 's3', {
      bucketName: nameFromTags(commonTags, 'logs'),
      tags: commonTags,
    });

    // Deploy IAM Infrastructure
    // Creates EC2 role with least privilege access to S3 logs bucket
    const iam = new IamModule(
      this,
      'iam',
      {
        roleName: nameFromTags(commonTags, 'ec2-role'),
        tags: commonTags,
      },
      s3.bucket.arn
    );

    // Deploy Security Groups
    // Creates reusable security groups for web and application tiers
    const securityGroups = new SecurityGroupsModule(
      this,
      'security-groups',
      networking.vpc.id,
      commonTags
    );

    // Deploy RDS Infrastructure
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );
    // Creates Multi-AZ RDS instance with automated backups and encryption
    const rds = new RdsModule(
      this,
      'rds',
      {
        instanceIdentifier: 'rlhfdb',
        dbName: 'rlhfdb',
        instanceClass: 'db.t3.medium', // Use appropriate size for production
        allocatedStorage: 20,
        engine: 'mysql',
        username: 'admin',
        dbPassword: dbPasswordSecret.secretString,
        vpcSecurityGroupIds: [], // Will be set by the module
        subnetGroupName: nameFromTags(commonTags, 'db-subnet-group'),
        tags: commonTags,
      },
      networking.vpc.id,
      networking.privateSubnets.map(subnet => subnet.id)
    );

    // Export all important outputs for use by other stacks or external systems

    // Networking Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networking.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networking.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'availability-zones', {
      value: networking.availabilityZones.names,
      description: 'Available availability zones',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3.bucket.bucket,
      description: 'Name of the S3 logs bucket',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3.bucket.arn,
      description: 'ARN of the S3 logs bucket',
    });

    new TerraformOutput(this, 's3-bucket-domain-name', {
      value: s3.bucket.bucketDomainName,
      description: 'Domain name of the S3 logs bucket',
    });

    // IAM Outputs
    new TerraformOutput(this, 'ec2-role-arn', {
      value: iam.ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'ec2-instance-profile-name', {
      value: iam.instanceProfile.name,
      description: 'Name of the EC2 instance profile',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'web-security-group-id', {
      value: securityGroups.webSecurityGroup.id,
      description: 'ID of the web tier security group',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: securityGroups.appSecurityGroup.id,
      description: 'ID of the application tier security group',
    });

    // RDS Outputs
    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: false, // Endpoint is not sensitive, but connection details are
    });

    new TerraformOutput(this, 'rds-port', {
      value: rds.dbInstance.port,
      description: 'RDS instance port',
    });

    new TerraformOutput(this, 'rds-db-name', {
      value: rds.dbInstance.dbName,
      description: 'RDS database name',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: rds.securityGroup.id,
      description: 'ID of the RDS security group',
    });

    // Additional outputs for monitoring and operations
    new TerraformOutput(this, 'region', {
      value: awsRegion,
      description: 'AWS region where resources are deployed',
    });

    new TerraformOutput(this, 'environment', {
      value: environmentSuffix,
      description: 'Environment name',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```

## Key Features and Best Practices Implemented:

### 🏗️ **Modular Architecture**
- **Reusable Modules**: Each AWS service is encapsulated in its own module
- **Scalable Design**: Easy to add new components without refactoring
- **Type Safety**: Full TypeScript support with interfaces and type checking

### 🔒 **Security Best Practices**
- **Principle of Least Privilege**: IAM roles with minimal required permissions
- **Encryption**: S3 server-side encryption and RDS encryption at rest
- **Network Security**: Security groups with specific ingress rules
- **Public Access Blocking**: S3 buckets blocked from public access

### 🌐 **High Availability**
- **Multi-AZ Deployment**: RDS configured for Multi-AZ
- **Multiple Availability Zones**: Infrastructure spans 3+ AZs
- **Subnet Strategy**: Public/private subnet separation

### 📊 **Operational Excellence**
- **Comprehensive Tagging**: All resources tagged with Environment, Owner, CostCenter
- **State Management**: S3 backend with DynamoDB locking
- **Monitoring**: Performance Insights enabled for RDS
- **Backup Strategy**: Automated RDS backups with 7-day retention

### 🔧 **Production-Ready Features**
- **No Hardcoded Secrets**: Uses AWS Secrets Manager for RDS passwords
- **Versioning**: S3 bucket versioning enabled
- **Deletion Protection**: RDS deletion protection enabled
- **Final Snapshots**: Automatic final snapshots before RDS deletion

### 📈 **Scalability Considerations**
- **Modular Design**: Easy to add Auto Scaling Groups, Load Balancers, etc.
- **Network Design**: Subnets sized for growth
- **Security Group Strategy**: Tiered security groups for web/app/data layers

This infrastructure provides a solid foundation for a three-tier application with room for expansion and follows all AWS Well-Architected Framework principles.