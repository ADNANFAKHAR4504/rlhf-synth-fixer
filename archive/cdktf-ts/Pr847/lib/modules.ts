import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { EbsVolume } from '@cdktf/provider-aws/lib/ebs-volume';
import { VolumeAttachment } from '@cdktf/provider-aws/lib/volume-attachment';

/**
 * Configuration interface for common tags and environment settings
 */
export interface CommonConfig {
  environment: string;
  owner: string;
  region: string;
  projectName: string;
}

/**
 * VPC Module - Creates a Virtual Private Cloud with configurable CIDR block
 * Provides isolated network environment for all AWS resources
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly internetGateway: InternetGateway;

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & { cidrBlock: string }
  ) {
    super(scope, id);

    // Create VPC with DNS support enabled for proper hostname resolution
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.projectName}-vpc`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-igw`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });
  }
}

/**
 * Subnet Module - Creates public and private subnets across multiple AZs
 * Ensures high availability and proper network segmentation
 */
export class SubnetModule extends Construct {
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateways: NatGateway[];
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTables: RouteTable[];

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      vpc: Vpc;
      internetGateway: InternetGateway;
      publicSubnetCidrs: string[];
      privateSubnetCidrs: string[];
    }
  ) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];
    this.privateRouteTables = [];

    // Create public subnets in different AZs for high availability
    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: config.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs
        tags: {
          Name: `${config.projectName}-public-subnet-${index + 1}`,
          Type: 'Public',
          Environment: config.environment,
          Owner: config.owner,
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Create private subnets in different AZs
    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: config.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        tags: {
          Name: `${config.projectName}-private-subnet-${index + 1}`,
          Type: 'Private',
          Environment: config.environment,
          Owner: config.owner,
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create NAT Gateways for private subnet internet access
    this.publicSubnets.forEach((subnet, index) => {
      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `${config.projectName}-nat-eip-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // NAT Gateway in public subnet
      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `${config.projectName}-nat-gateway-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });
      this.natGateways.push(natGateway);
    });

    // Create public route table with internet gateway route
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-public-rt`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Route for public subnets to internet gateway
    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: config.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Create private route tables with NAT gateway routes
    this.privateSubnets.forEach((subnet, index) => {
      const routeTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: config.vpc.id,
        tags: {
          Name: `${config.projectName}-private-rt-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // Route for private subnets to NAT gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });

      this.privateRouteTables.push(routeTable);
    });
  }
}

/**
 * Security Group Module - Creates security groups with least privilege access
 * Implements defense in depth security strategy
 */
export class SecurityGroupModule extends Construct {
  public readonly sshSecurityGroup: SecurityGroup;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      vpc: Vpc;
      sshCidrBlock: string;
    }
  ) {
    super(scope, id);

    // Security group for SSH access - restricted to specific CIDR
    this.sshSecurityGroup = new SecurityGroup(this, 'ssh-sg', {
      name: `${config.projectName}-ssh-sg`,
      description: 'Security group for SSH access',
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-ssh-sg`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // SSH inbound rule
    new SecurityGroupRule(this, 'ssh-inbound', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.sshCidrBlock],
      securityGroupId: this.sshSecurityGroup.id,
      description: 'SSH access from authorized CIDR',
    });

    // Security group for web servers - HTTP/HTTPS from anywhere
    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${config.projectName}-web-sg`,
      description: 'Security group for web servers',
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-web-sg`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // HTTP inbound rule
    new SecurityGroupRule(this, 'http-inbound', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'HTTP access from anywhere',
    });

    // HTTPS inbound rule
    new SecurityGroupRule(this, 'https-inbound', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'HTTPS access from anywhere',
    });

    // Security group for database - only from web servers
    this.dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${config.projectName}-db-sg`,
      description: 'Security group for database servers',
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-db-sg`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Database inbound rule - only from web security group
    new SecurityGroupRule(this, 'db-inbound', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
      description: 'MySQL access from web servers',
    });

    // Outbound rules for all security groups (allow all outbound)
    [
      this.sshSecurityGroup,
      this.webSecurityGroup,
      this.dbSecurityGroup,
    ].forEach((sg, index) => {
      new SecurityGroupRule(this, `outbound-${index}`, {
        type: 'egress',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: sg.id,
        description: 'All outbound traffic',
      });
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies with least privilege
 * Provides secure access for EC2 instances and other services
 */
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: CommonConfig) {
    super(scope, id);

    // IAM role for EC2 instances
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.projectName}-ec2-role`,
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
        Name: `${config.projectName}-ec2-role`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // IAM policy for EC2 instances - minimal required permissions
    new IamRolePolicy(this, 'ec2-policy', {
      name: `${config.projectName}-ec2-policy`,
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'cloudwatch:PutMetricData',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // Instance profile for EC2 instances
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.projectName}-ec2-instance-profile`,
        role: this.ec2Role.name,
      }
    );
  }
}

/**
 * EC2 Module - Creates EC2 instances with encrypted EBS volumes
 * Implements security best practices for compute resources
 */
export class Ec2Module extends Construct {
  public readonly instances: Instance[];

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      subnets: Subnet[];
      securityGroups: SecurityGroup[];
      instanceProfile: IamInstanceProfile;
      instanceType: string;
      keyName: string;
    }
  ) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    this.instances = [];

    // Create EC2 instances in specified subnets
    config.subnets.forEach((subnet, index) => {
      const instance = new Instance(this, `instance-${index}`, {
        ami: ami.id,
        instanceType: config.instanceType,
        keyName: config.keyName,
        subnetId: subnet.id,
        vpcSecurityGroupIds: config.securityGroups.map(sg => sg.id),
        iamInstanceProfile: config.instanceProfile.name,
        // Enable detailed monitoring
        monitoring: true,
        // Encrypt root volume
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
        },
        tags: {
          Name: `${config.projectName}-instance-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // Create additional encrypted EBS volume
      const volume = new EbsVolume(this, `ebs-volume-${index}`, {
        availabilityZone: instance.availabilityZone,
        size: 10,
        type: 'gp3',
        encrypted: true,
        tags: {
          Name: `${config.projectName}-ebs-volume-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // Attach EBS volume to instance
      new VolumeAttachment(this, `volume-attachment-${index}`, {
        deviceName: '/dev/sdf',
        volumeId: volume.id,
        instanceId: instance.id,
      });

      this.instances.push(instance);
    });
  }
}

/**
 * RDS Module - Creates RDS instances in private subnets with encryption
 * Implements database security and high availability best practices
 */
export class RdsModule extends Construct {
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbInstance: DbInstance;

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      privateSubnets: Subnet[];
      securityGroup: SecurityGroup;
      dbName: string;
      dbUsername: string;
      dbPassword: string;
      instanceClass: string;
    }
  ) {
    super(scope, id);

    // Create DB subnet group for RDS placement
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.projectName}-db-subnet-group`,
      subnetIds: config.privateSubnets.map(subnet => subnet.id),
      description: 'Database subnet group for RDS instances',
      tags: {
        Name: `${config.projectName}-db-subnet-group`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Create RDS instance with encryption and backup
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${config.projectName}-db-instance`,
      engine: 'mysql',
      instanceClass: config.instanceClass,
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling
      storageType: 'gp3',
      storageEncrypted: true,

      // Database configuration
      dbName: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,

      // Network and security
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroup.id],
      publiclyAccessible: false,

      // Backup and maintenance
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Monitoring and performance
      monitoringInterval: 0,
      performanceInsightsEnabled: true,

      // Deletion protection
      deletionProtection: false, // Set to true for production
      skipFinalSnapshot: true, // Set to false for production

      tags: {
        Name: `${config.projectName}-db-instance`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });
  }
}

/**
 * S3 Module - Creates S3 buckets with encryption and security configurations
 * Implements data protection and access control best practices
 */
export class S3Module extends Construct {
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: CommonConfig) {
    super(scope, id);

    // Create S3 bucket for logs
    this.logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `${config.projectName}-logs-${config.environment}-${Date.now()}`,
      tags: {
        Name: `${config.projectName}-logs-bucket`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Enable server-side encryption using correct class
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
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

    // Enable versioning using correct class
    new S3BucketVersioningA(this, 'logs-bucket-versioning', {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Block public access remains the same
    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
