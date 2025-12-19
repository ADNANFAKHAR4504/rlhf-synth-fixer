// modules.ts
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { Fn } from 'cdktf';

// Fix the CommonTags interface with index signature
export interface CommonTags {
  Environment: string;
  Department: string;
  [key: string]: string; // Add index signature to fix the type error
}

export interface VPCModuleConfig {
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  tags: CommonTags;
}

export class VPCModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateway: aws.natGateway.NatGateway;
  public readonly eipForNat: aws.eip.Eip;

  constructor(scope: Construct, id: string, config: VPCModuleConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        ...config.tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-igw`,
          ...config.tags,
        },
      }
    );

    // Create Public Subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${id}-public-subnet-${index}`,
          Type: 'Public',
          ...config.tags,
        },
      });
    });

    // Create Private Subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${id}-private-subnet-${index}`,
          Type: 'Private',
          ...config.tags,
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    this.eipForNat = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${id}-nat-eip`,
        ...config.tags,
      },
    });

    const firstPublicSubnet = this.publicSubnets[0];
    // Create NAT Gateway in first public subnet
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat-gateway', {
      allocationId: this.eipForNat.id,
      subnetId: firstPublicSubnet.id,
      tags: {
        Name: `${id}-nat-gateway`,
        ...config.tags,
      },
    });

    // Create and configure route tables
    const publicRouteTable = new aws.routeTable.RouteTable(
      this,
      'public-route-table',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-public-rt`,
          ...config.tags,
        },
      }
    );

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    const privateRouteTable = new aws.routeTable.RouteTable(
      this,
      'private-route-table',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${id}-private-rt`,
          ...config.tags,
        },
      }
    );

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

export interface IAMModuleConfig {
  tags: CommonTags;
}

export class IAMModule extends Construct {
  public readonly ec2Role: aws.iamRole.IamRole;
  public readonly ec2InstanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IAMModuleConfig) {
    super(scope, id);

    // Create IAM role for EC2 instances
    this.ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: `${id}-ec2-role`,
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
      tags: config.tags,
    });

    // Attach SSM managed instance policy for Session Manager
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ssm-policy',
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    // Create custom policy for S3 access
    const s3Policy = new aws.iamPolicy.IamPolicy(this, 's3-policy', {
      name: `${id}-s3-policy`,
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
            Resource: ['arn:aws:s3:::*/*', 'arn:aws:s3:::*'],
          },
        ],
      }),
      tags: config.tags,
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      's3-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: s3Policy.arn,
      }
    );

    // Create instance profile
    this.ec2InstanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${id}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: config.tags,
      }
    );
  }
}

export interface EC2ModuleConfig {
  vpcId: string;
  subnetId: string;
  instanceType: string;
  amiId: string; // Now passed from tap-stack
  sshAllowedCidr: string;
  iamInstanceProfile: string;
  tags: CommonTags;
  useKeyPair?: boolean; // Optional flag to use SSH key
}

export class EC2Module extends Construct {
  public readonly instance: aws.instance.Instance;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly keyPair?: aws.keyPair.KeyPair;

  constructor(scope: Construct, id: string, config: EC2ModuleConfig) {
    super(scope, id);

    // Create security group
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ec2-sg', {
      name: `${id}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: config.vpcId,
      tags: {
        Name: `${id}-ec2-sg`,
        ...config.tags,
      },
    });

    // SSH access from specific IP range (only if using key pair)
    if (config.useKeyPair) {
      new aws.securityGroupRule.SecurityGroupRule(this, 'ssh-ingress', {
        type: 'ingress',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [config.sshAllowedCidr],
        securityGroupId: this.securityGroup.id,
        description: 'SSH access from specific IP range',
      });
    }

    // Allow all outbound traffic
    new aws.securityGroupRule.SecurityGroupRule(this, 'all-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Create EC2 instance
    this.instance = new aws.instance.Instance(this, 'instance', {
      ami: config.amiId,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: config.iamInstanceProfile,
      userData: Fn.base64encode(
        Fn.rawString(`#!/bin/bash
# Update system
yum update -y

# Install SSM Agent for Session Manager access (no SSH key needed)
yum install -y amazon-ssm-agent
systemctl start amazon-ssm-agent
systemctl enable amazon-ssm-agent

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install PostgreSQL client for RDS connectivity
amazon-linux-extras install postgresql13 -y

# Install AWS CLI
yum install -y aws-cli

echo "Instance setup complete"
`)
      ),
      tags: {
        Name: `${id}-instance`,
        ...config.tags,
      },
    });
  }
}

export interface RDSModuleConfig {
  vpcId: string;
  subnetIds: string[];
  ec2SecurityGroupId: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  instanceClass: string;
  allocatedStorage: number;
  tags: CommonTags;
}

export class RDSModule extends Construct {
  public readonly dbInstance: aws.dbInstance.DbInstance;
  public readonly dbSecurityGroup: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: RDSModuleConfig) {
    super(scope, id);

    // Create security group for RDS
    this.dbSecurityGroup = new aws.securityGroup.SecurityGroup(this, 'rds-sg', {
      name: `${id}-rds-sg`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: config.vpcId,
      tags: {
        Name: `${id}-rds-sg`,
        ...config.tags,
      },
    });

    // Allow PostgreSQL access from EC2 security group
    new aws.securityGroupRule.SecurityGroupRule(this, 'postgres-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: config.ec2SecurityGroupId,
      securityGroupId: this.dbSecurityGroup.id,
      description: 'PostgreSQL access from EC2 instances',
    });

    // Create DB subnet group
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${id}-db-subnet-group`,
        subnetIds: config.subnetIds,
        description: 'Subnet group for RDS instances',
        tags: config.tags,
      }
    );

    // Create RDS PostgreSQL instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'postgres', {
      identifier: `${id}-postgres`,
      engine: 'postgres',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      publiclyAccessible: false,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: false,
      skipFinalSnapshot: true,
      tags: config.tags,
    });
  }
}

export interface S3ModuleConfig {
  bucketPrefix: string;
  vpcId: string;
  tags: CommonTags;
}

export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly vpcEndpoint: aws.vpcEndpoint.VpcEndpoint;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: `${config.bucketPrefix}-${Date.now()}`,
      tags: config.tags,
    });

    // Enable versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'bucket-encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Block public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'bucket-pab',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Create VPC endpoint for S3
    this.vpcEndpoint = new aws.vpcEndpoint.VpcEndpoint(this, 's3-endpoint', {
      vpcId: config.vpcId,
      serviceName: `com.amazonaws.${config.tags.Region || 'eu-north-1'}.s3`,
      vpcEndpointType: 'Gateway',
      tags: {
        Name: `${id}-s3-endpoint`,
        ...config.tags,
      },
    });
  }
}
