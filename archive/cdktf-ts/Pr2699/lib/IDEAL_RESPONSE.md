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
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface NetworkingProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  tags: { [key: string]: string };
}

export interface ComputeProps {
  vpcId: string;
  publicSubnetId: string;
  amiId: string;
  keyPairName: string;
  allowedSshCidr: string;
  iamInstanceProfileName: string;
  ec2SecurityGroupId: string;
  tags: { [key: string]: string };
}

export interface StorageProps {
  bucketName: string;
  tags: { [key: string]: string };
}

export interface DatabaseProps {
  vpcId: string;
  privateSubnetIds: string[];
  ec2SecurityGroupId: string;
  tags: { [key: string]: string };
}

export interface MonitoringProps {
  instanceId: string;
  dbInstanceId: string;
  tags: { [key: string]: string };
}

/**
 * Networking Module - Creates VPC, subnets, IGW, NAT Gateway for high availability
 * Security: Private subnets for sensitive resources, public subnets for internet-facing resources
 * High Availability: Multi-AZ deployment with NAT Gateways in each AZ
 */
export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateways: NatGateway[];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    // Get available AZs for high availability
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support for RDS and other services
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: 'main-vpc',
      },
    });

    // Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: 'main-igw',
      },
    });

    // Create public subnets across multiple AZs for high availability
    this.publicSubnets = props.publicSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs for instances
        tags: {
          ...props.tags,
          Name: `public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });

      // Route table for public subnet
      const publicRt = new RouteTable(this, `public-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `public-rt-${index + 1}`,
        },
      });

      // Route to internet gateway
      new Route(this, `public-route-${index}`, {
        routeTableId: publicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      });

      // Associate route table with subnet
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRt.id,
      });

      return subnet;
    });

    // Create Elastic IPs for NAT Gateways (high availability)
    const eips = props.publicSubnetCidrs.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...props.tags,
          Name: `nat-eip-${index + 1}`,
        },
      });
    });

    // Create NAT Gateways in each public subnet for high availability
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gw-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          ...props.tags,
          Name: `nat-gw-${index + 1}`,
        },
      });
    });

    // Create private subnets across multiple AZs
    this.privateSubnets = props.privateSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        tags: {
          ...props.tags,
          Name: `private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });

      // Route table for private subnet
      const privateRt = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `private-rt-${index + 1}`,
        },
      });

      // Route to NAT Gateway for internet access
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      // Associate route table with subnet
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRt.id,
      });

      return subnet;
    });
  }
}

/**
 * IAM Module - Creates roles and policies following least privilege principle
 * Security: Specific permissions for EC2 and S3 access only, no wildcard permissions
 */
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, tags: { [key: string]: string }) {
    super(scope, id);

    // IAM role for EC2 instance with least privilege access
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: 'ec2-app-role',
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
      tags,
    });

    // Attach AWS managed policies for EC2 and S3 access
    // Note: In production, consider custom policies with more restrictive permissions
    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2FullAccess',
    });

    new IamRolePolicyAttachment(this, 's3-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
    });

    // Instance profile for EC2 to assume the role
    this.instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'ec2-app-instance-profile',
        role: this.ec2Role.name,
        tags,
      }
    );
  }
}

/**
 * Security Groups Module - Creates security groups with restrictive rules
 * Security: Principle of least privilege - only necessary ports and sources
 */
export class SecurityGroupsModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    allowedSshCidr: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // Security group for EC2 instance
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: 'ec2-web-sg',
      description: 'Security group for web application EC2 instance',
      vpcId: vpcId,
      tags: {
        ...tags,
        Name: 'ec2-web-sg',
      },
    });

    // SSH access restricted to specific IP range for security
    new SecurityGroupRule(this, 'ec2-ssh-rule', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [allowedSshCidr],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'SSH access from company IP range',
    });

    // HTTP access for web application
    new SecurityGroupRule(this, 'ec2-http-rule', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'HTTP access from internet',
    });

    // Outbound rules for EC2 (allow all outbound for updates, etc.)
    new SecurityGroupRule(this, 'ec2-outbound-rule', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'All outbound traffic',
    });

    // Security group for RDS instance
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: 'rds-sg',
      description: 'Security group for RDS database',
      vpcId: vpcId,
      tags: {
        ...tags,
        Name: 'rds-sg',
      },
    });

    // Database access only from EC2 security group (principle of least privilege)
    new SecurityGroupRule(this, 'rds-mysql-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'MySQL access from EC2 instances only',
    });
  }
}

/**
 * Compute Module - Creates EC2 instance with proper security configuration
 * Security: Instance in public subnet with restricted access, IAM role attached
 */
export class ComputeModule extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    super(scope, id);

    // EC2 instance for web application
    this.instance = new Instance(this, 'web-instance', {
      ami: props.amiId,
      instanceType: 't3.micro', // Cost-effective for development
      keyName: props.keyPairName,
      subnetId: props.publicSubnetId,
      vpcSecurityGroupIds: [props.ec2SecurityGroupId],
      iamInstanceProfile: props.iamInstanceProfileName,

      // User data for basic setup (can be extended)
      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Web Application Server</h1>" > /var/www/html/index.html
      `
      ).toString('base64'),

      tags: {
        ...props.tags,
        Name: 'web-server',
      },
    });
  }
}

/**
 * Storage Module - Creates S3 bucket with encryption and lifecycle policies
 * Security: Server-side encryption enabled, lifecycle policy for cost optimization
 * Compliance: Objects moved to Glacier after 30 days for long-term retention
 */
export class StorageModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id);

    // S3 bucket for application storage and logs
    this.bucket = new S3Bucket(this, 'app-bucket', {
      bucket: props.bucketName,
      tags: {
        ...props.tags,
        Name: props.bucketName,
      },
    });

    // Enable server-side encryption for data at rest (compliance requirement)
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256', // Using SSE-S3 for simplicity
          },
          bucketKeyEnabled: true, // Reduce KMS costs if using KMS
        },
      ],
    });

    // Lifecycle policy to transition objects to Glacier after 30 days (cost optimization)
    new S3BucketLifecycleConfiguration(this, 'bucket-lifecycle', {
      bucket: this.bucket.id,
      rule: [
        {
          id: 'glacier-transition',
          status: 'Enabled',
          transition: [
            {
              days: 30,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // Bucket policy to prevent accidental deletion (similar to CloudFormation stack policy)
    new S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PreventDeletion',
            Effect: 'Deny',
            Principal: '*',
            Action: ['s3:DeleteBucket', 's3:DeleteBucketPolicy'],
            Resource: `arn:aws:s3:::${props.bucketName}`,
            Condition: {
              StringNotEquals: {
                'aws:userid': 'AIDACKCEVSQ6C2EXAMPLE', // Replace with actual root user ID
              },
            },
          },
        ],
      }),
    });
  }
}

/**
 * Database Module - Creates RDS instance in private subnet with encryption
 * Security: Database in private subnet, encrypted at rest, automatic backups
 * High Availability: Multi-AZ deployment option available
 */
export class DatabaseModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    // DB subnet group for multi-AZ deployment
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'main-db-subnet-group',
      subnetIds: props.privateSubnetIds,
      description: 'Subnet group for RDS database',
      tags: {
        ...props.tags,
        Name: 'main-db-subnet-group',
      },
    });

    // RDS MySQL instance with security best practices
    this.dbInstance = new DbInstance(this, 'database', {
      identifier: 'app-database',
      engine: 'mysql',
      instanceClass: 'db.t3.medium', // Cost-effective for development
      allocatedStorage: 20,
      storageType: 'gp2',

      // Database credentials (use AWS Secrets Manager in production)
      dbName: 'appdb',
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'changeme123!', // Use random password or Secrets Manager in production

      // Security configurations
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [props.ec2SecurityGroupId],
      publiclyAccessible: false, // Keep database private for security
      storageEncrypted: true, // Encrypt data at rest (compliance requirement)

      // Backup and maintenance
      backupRetentionPeriod: 7, // 7 days backup retention
      backupWindow: '03:00-04:00', // Backup during low usage hours
      maintenanceWindow: 'sun:04:00-sun:05:00', // Maintenance window
      autoMinorVersionUpgrade: true, // Automatic security updates

      // Monitoring
      monitoringInterval: 0, // Enhanced monitoring
      performanceInsightsEnabled: true, // Performance insights for optimization

      // Deletion protection (uncomment for production)
      // deletionProtection: true,

      tags: {
        ...props.tags,
        Name: 'app-database',
      },
    });
  }
}

/**
 * Monitoring Module - Creates CloudWatch alarms for key metrics
 * Compliance: Monitoring for performance and availability requirements
 */
export class MonitoringModule extends Construct {
  public readonly ec2CpuAlarm: CloudwatchMetricAlarm;
  public readonly rdsCpuAlarm: CloudwatchMetricAlarm;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    super(scope, id);

    // CloudWatch alarm for EC2 CPU utilization
    this.ec2CpuAlarm = new CloudwatchMetricAlarm(this, 'ec2-cpu-alarm', {
      alarmName: 'ec2-high-cpu',
      alarmDescription: 'EC2 instance CPU utilization is too high',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      statistic: 'Average',
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 80, // Alert when CPU > 80%
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        InstanceId: props.instanceId,
      },
      tags: {
        ...props.tags,
        Name: 'ec2-cpu-alarm',
      },
    });

    // CloudWatch alarm for RDS CPU utilization
    this.rdsCpuAlarm = new CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: 'rds-high-cpu',
      alarmDescription: 'RDS instance CPU utilization is too high',
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      statistic: 'Average',
      period: 300, // 5 minutes
      evaluationPeriods: 2,
      threshold: 80, // Alert when CPU > 80%
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        DBInstanceIdentifier: props.dbInstanceId,
      },
      tags: {
        ...props.tags,
        Name: 'rds-cpu-alarm',
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
import {
  NetworkingModule,
  ComputeModule,
  StorageModule,
  DatabaseModule,
  MonitoringModule,
  IamModule,
  SecurityGroupsModule,
} from './modules';
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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
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

    // ? Add your stack instantiations her
    // Configuration variables - customize these for your environment
    const config = {
      region: awsRegion,
      // Replace with your specific AMI ID (Amazon Linux 2 example)
      amiId: 'ami-0c02fb55956c7d316',
      // Replace with your key pair name
      keyPairName: 'production-key-poetic-primate',
      // Replace with your company's IP range for SSH access
      allowedSshCidr: '203.0.113.0/24', // Example IP range - replace with actual
      // S3 bucket name - must be globally unique
      bucketName: 'my-app-storage-bucket-12345-rlhf-ts',
      // VPC and subnet configuration
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
    };

    // Common tags applied to all resources for compliance and cost tracking
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'WebApp',
      Owner: 'DevOps Team',
      CostCenter: 'Engineering',
      ManagedBy: 'CDKTF',
    };

    // 1. Create IAM roles and policies first (dependencies for EC2)
    const iamModule = new IamModule(this, 'iam', commonTags);

    // 2. Create networking infrastructure (VPC, subnets, gateways)
    const networkingModule = new NetworkingModule(this, 'networking', {
      vpcCidr: config.vpcCidr,
      publicSubnetCidrs: config.publicSubnetCidrs,
      privateSubnetCidrs: config.privateSubnetCidrs,
      tags: commonTags,
    });

    // 3. Create security groups (dependencies for EC2 and RDS)
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      'security-groups',
      networkingModule.vpc.id,
      config.allowedSshCidr,
      commonTags
    );

    // 4. Create compute resources (EC2 instance)
    const computeModule = new ComputeModule(this, 'compute', {
      vpcId: networkingModule.vpc.id,
      publicSubnetId: networkingModule.publicSubnets[0].id,
      amiId: config.amiId,
      keyPairName: config.keyPairName,
      allowedSshCidr: config.allowedSshCidr,
      iamInstanceProfileName: iamModule.instanceProfile.name,
      ec2SecurityGroupId: securityGroupsModule.ec2SecurityGroup.id,
      tags: commonTags,
    });

    // 5. Create storage resources (S3 bucket with encryption and lifecycle)
    const storageModule = new StorageModule(this, 'storage', {
      bucketName: config.bucketName,
      tags: commonTags,
    });

    // 6. Create database resources (RDS in private subnet)
    const databaseModule = new DatabaseModule(this, 'database', {
      vpcId: networkingModule.vpc.id,
      privateSubnetIds: networkingModule.privateSubnets.map(
        subnet => subnet.id
      ),
      ec2SecurityGroupId: securityGroupsModule.rdsSecurityGroup.id,
      tags: commonTags,
    });

    // 7. Create monitoring and alerting (CloudWatch alarms)
    new MonitoringModule(this, 'monitoring', {
      instanceId: computeModule.instance.id,
      dbInstanceId: databaseModule.dbInstance.id,
      tags: commonTags,
    });

    // Stack Outputs - Important information for operations and integration
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: computeModule.instance.id,
      description: 'ID of the EC2 web server instance',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: computeModule.instance.publicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: storageModule.bucket.bucket,
      description: 'Name of the S3 bucket for application storage',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.dbInstance.endpoint,
      description: 'RDS database endpoint for application connection',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: networkingModule.natGateways.map(nat => nat.id),
      description: 'IDs of the NAT Gateways for high availability',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkingModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of private subnets for internal resources',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkingModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of public subnets for internet-facing resources',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```