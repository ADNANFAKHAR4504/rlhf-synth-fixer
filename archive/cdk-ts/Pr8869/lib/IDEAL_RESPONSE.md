# Multi-Region Cloud Development Environment - AWS CDK Implementation

This solution implements a multi-region cloud development environment using AWS CDK with TypeScript, spanning us-west-1 and us-east-1 regions with modular constructs for networking, compute, database, storage, and security.

## Architecture Overview

The solution consists of:
- Multi-region VPCs with public and private subnets in us-east-1 and us-west-1
- EC2 instances in public subnets with HTTP server configured
- RDS PostgreSQL databases with encryption at rest
- S3 bucket with versioning in the primary region us-east-1
- IAM roles and security groups following least privilege principle
- Comprehensive resource tagging

## Project Structure

```
lib/
  tap-stack.ts                          # Main stack orchestrating all constructs
  constructs/
    networking-construct.ts             # VPC, subnets, internet gateway
    compute-construct.ts                # EC2 instances with user data
    database-construct.ts               # RDS PostgreSQL with Secrets Manager
    storage-construct.ts                # S3 bucket with policies
    security-construct.ts               # Security groups and IAM roles
```

## Implementation

### Main Stack - lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './constructs/networking-construct';
import { ComputeConstruct } from './constructs/compute-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { SecurityConstruct } from './constructs/security-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  region: string;
  isPrimaryRegion: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const region = props.region;
    const isPrimaryRegion = props.isPrimaryRegion;

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region,
    });

    // Create security infrastructure
    const security = new SecurityConstruct(this, 'Security', {
      environmentSuffix,
      region,
      vpc: networking.vpc,
    });

    // Create compute infrastructure
    const compute = new ComputeConstruct(this, 'Compute', {
      environmentSuffix,
      region,
      vpc: networking.vpc,
      securityGroup: security.ec2SecurityGroup,
      instanceRole: security.ec2Role,
    });

    // Create database infrastructure
    const database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      region,
      vpc: networking.vpc,
      securityGroup: security.rdsSecurityGroup,
    });

    // Create storage infrastructure only in primary region
    if (isPrimaryRegion) {
      new StorageConstruct(this, 'Storage', {
        environmentSuffix,
        region,
        allowedPrincipals: [security.ec2Role.roleArn],
      });
    }

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: networking.publicSubnet.subnetId,
      description: 'Public Subnet ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: networking.privateSubnet.subnetId,
      description: 'Private Subnet ID',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: compute.instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: database.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });
  }
}
```

### Networking Construct - lib/constructs/networking-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingConstructProps {
  environmentSuffix: string;
  region: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnet: ec2.PublicSubnet;
  public readonly privateSubnet: ec2.PrivateSubnet;
  public readonly internetGateway: ec2.CfnInternetGateway;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Define CIDR blocks for different regions
    const cidrBlocks = {
      'us-east-1': '10.0.0.0/16',
      'us-west-1': '10.1.0.0/16',
    };

    const vpcCidr =
      cidrBlocks[region as keyof typeof cidrBlocks] || '10.0.0.0/16';

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // Disable NAT gateways to avoid EIP issues
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Get references to the created subnets
    this.publicSubnet = this.vpc.publicSubnets[0] as ec2.PublicSubnet;
    this.privateSubnet = this.vpc.isolatedSubnets[0] as ec2.PrivateSubnet;

    // Tag all networking resources
    cdk.Tags.of(this.vpc).add('Name', `vpc-${environmentSuffix}-${region}`);
    cdk.Tags.of(this.vpc).add('Purpose', 'MultiRegionDevEnvironment');
    cdk.Tags.of(this.vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(this.vpc).add('Region', region);

    // Tag subnets if they exist
    if (this.publicSubnet) {
      cdk.Tags.of(this.publicSubnet).add(
        'Name',
        `public-subnet-${environmentSuffix}-${region}`
      );
      cdk.Tags.of(this.publicSubnet).add('Type', 'Public');
    }

    if (this.privateSubnet) {
      cdk.Tags.of(this.privateSubnet).add(
        'Name',
        `private-subnet-${environmentSuffix}-${region}`
      );
      cdk.Tags.of(this.privateSubnet).add('Type', 'Private');
    }
  }
}
```

### Compute Construct - lib/constructs/compute-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ComputeConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  instanceRole: iam.Role;
}

export class ComputeConstruct extends Construct {
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc, securityGroup, instanceRole } =
      props;

    // Create instance profile for the EC2 role
    new iam.CfnInstanceProfile(this, 'InstanceProfile', {
      roles: [instanceRole.roleName],
    });

    // Get the latest Amazon Linux 2023 AMI
    const machineImage = ec2.MachineImage.latestAmazonLinux2023();

    // Create EC2 instance
    this.instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage,
      securityGroup,
      role: instanceRole,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      userData: ec2.UserData.forLinux(),
      keyName: undefined,
    });

    // Add user data for basic setup
    this.instance.addUserData(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Multi-Region Dev Environment</h1>" > /var/www/html/index.html',
      `echo "<p>Region: ${region}</p>" >> /var/www/html/index.html`,
      `echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html`,
      'echo "<p>Instance started at: $(date)</p>" >> /var/www/html/index.html'
    );

    // Tag the instance
    cdk.Tags.of(this.instance).add(
      'Name',
      `ec2-instance-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.instance).add('Purpose', 'DevEnvironment');
    cdk.Tags.of(this.instance).add('Environment', environmentSuffix);
    cdk.Tags.of(this.instance).add('Region', region);
  }
}
```

### Database Construct - lib/constructs/database-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc, securityGroup } = props;

    // Create database credentials secret
    this.secret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database credentials for PostgreSQL',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 16,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create subnet group for RDS
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create parameter group for PostgreSQL
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        description: 'Parameter group for PostgreSQL 15',
      }
    );

    // Create the RDS instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(this.secret),
      vpc,
      securityGroups: [securityGroup],
      subnetGroup,
      parameterGroup,
      multiAz: false, // Disabled for LocalStack compatibility
      storageEncrypted: true,
      storageEncryptionKey: undefined,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      deleteAutomatedBackups: false,
      databaseName: 'devdb',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      enablePerformanceInsights: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag database resources
    cdk.Tags.of(this.database).add(
      'Name',
      `rds-postgres-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.database).add('Purpose', 'DevDatabase');
    cdk.Tags.of(this.database).add('Environment', environmentSuffix);
    cdk.Tags.of(this.database).add('Region', region);
    cdk.Tags.of(this.database).add('Engine', 'PostgreSQL');

    cdk.Tags.of(this.secret).add(
      'Name',
      `db-secret-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.secret).add('Purpose', 'DatabaseCredentials');

    cdk.Tags.of(subnetGroup).add(
      'Name',
      `db-subnet-group-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(parameterGroup).add(
      'Name',
      `db-param-group-${environmentSuffix}-${region}`
    );
  }
}
```

### Storage Construct - lib/constructs/storage-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageConstructProps {
  environmentSuffix: string;
  region: string;
  allowedPrincipals: string[];
}

export class StorageConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, allowedPrincipals } = props;

    // Create S3 bucket with versioning and encryption
    this.bucket = new s3.Bucket(this, 'DevBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects disabled for LocalStack compatibility
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
          enabled: true,
        },
      ],
      publicReadAccess: false,
    });

    // Create bucket policy to restrict access to EC2 instances only
    const allowAccessStatement = new iam.PolicyStatement({
      sid: 'AllowEC2Access',
      effect: iam.Effect.ALLOW,
      principals: allowedPrincipals.map(arn =>
        iam.Role.fromRoleArn(this, `Role-${arn.split('/').pop()}`, arn)
      ),
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
      ],
      resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
    });

    this.bucket.addToResourcePolicy(allowAccessStatement);

    // Tag storage resources
    cdk.Tags.of(this.bucket).add(
      'Name',
      `dev-bucket-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.bucket).add('Purpose', 'DevStorage');
    cdk.Tags.of(this.bucket).add('Environment', environmentSuffix);
    cdk.Tags.of(this.bucket).add('Region', region);
    cdk.Tags.of(this.bucket).add('Versioning', 'Enabled');
    cdk.Tags.of(this.bucket).add('Encryption', 'S3Managed');

    // Output the bucket name for integration tests
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the S3 bucket',
    });
  }
}
```

### Security Construct - lib/constructs/security-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.Vpc;
}

export class SecurityConstruct extends Construct {
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc } = props;

    // Create security group for EC2 instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow SSH access on port 22
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // Allow HTTP access on port 80
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access'
    );

    // Create security group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL access from EC2 security group
    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2'
    );

    // Create IAM role for EC2 instances
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances to access S3',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add S3 access policy for the primary region bucket
    if (region === 'us-east-1') {
      this.ec2Role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
            's3:GetObjectVersion',
          ],
          resources: [
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*`,
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*/*`,
          ],
        })
      );
    }

    // Cross-region S3 access for us-west-1 instances
    if (region === 'us-west-1') {
      this.ec2Role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:ListBucket', 's3:GetObjectVersion'],
          resources: [
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*`,
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*/*`,
          ],
        })
      );
    }

    // Tag security resources
    cdk.Tags.of(this.ec2SecurityGroup).add(
      'Name',
      `ec2-sg-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.ec2SecurityGroup).add('Purpose', 'EC2Security');
    cdk.Tags.of(this.rdsSecurityGroup).add(
      'Name',
      `rds-sg-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.rdsSecurityGroup).add('Purpose', 'RDSSecurity');
    cdk.Tags.of(this.ec2Role).add(
      'Name',
      `ec2-role-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.ec2Role).add('Purpose', 'EC2IAMRole');
  }
}
```

## Key Implementation Details

### Multi-Region Architecture
- **us-east-1** Primary Region: VPC 10.0.0.0/16, EC2, RDS, S3 bucket
- **us-west-1** Secondary Region: VPC 10.1.0.0/16, EC2, RDS with cross-region read access to S3

### Security Features
- EC2 security groups allow only SSH on port 22 and HTTP on port 80
- RDS security group allows PostgreSQL on port 5432 only from EC2 instances
- IAM roles follow least privilege principle
- S3 bucket blocks all public access and enforces SSL
- RDS storage encryption enabled with AWS managed keys

### Tagging Strategy
All resources are tagged with:
- Environment: Environment suffix dev, staging, prod
- Region: AWS region
- Purpose: Resource purpose description
- Name: Human-readable resource name

### Modularity
The solution uses separate CDK constructs for:
- Networking: VPC, subnets, route tables
- Compute: EC2 instances with user data
- Database: RDS PostgreSQL with Secrets Manager
- Storage: S3 bucket with policies and lifecycle rules
- Security: Security groups and IAM roles

## Deployment

Deploy using CDK:

```bash
# Install dependencies
npm install

# Bootstrap CDK for both regions
cdk bootstrap aws://ACCOUNT_ID/us-east-1
cdk bootstrap aws://ACCOUNT_ID/us-west-1

# Deploy
cdk deploy --all
```

## Outputs

The stack provides the following outputs:
- VpcId: VPC identifier
- PublicSubnetId: Public subnet identifier
- PrivateSubnetId: Private subnet identifier
- EC2InstanceId: EC2 instance identifier
- RDSEndpoint: RDS database endpoint hostname
- S3BucketName: S3 bucket name in primary region only
