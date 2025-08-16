I'll provide you with a comprehensive CDKTF TypeScript solution that meets all your requirements. This will be a monolithic stack with modular components for secure AWS infrastructure.

## Project Structure

First, let's set up the project structure:

```typescript
// main.ts
import { Construct } from 'constructs';
import { App, TerraformStack, RemoteBackend, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RegionalInfrastructure } from './modules/regional-infrastructure';

class SecureAwsInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Application: 'WebApp',
            Owner: 'DevOps Team',
            ManagedBy: 'Terraform',
          },
        },
      ],
    });

    // Deploy regional infrastructure
    new RegionalInfrastructure(this, 'us-east-1-infra', {
      region: 'us-east-1',
      vpcCidr: '10.0.0.0/16',
      subnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      allowedCidr: '203.0.113.0/24',
      tags: {
        Environment: 'Production',
        Application: 'WebApp',
        Owner: 'DevOps Team',
      },
    });
  }
}

const app = new App();
new SecureAwsInfrastructureStack(app, 'secure-aws-infrastructure');
app.synth();
```

## Regional Infrastructure Module

```typescript
// modules/regional-infrastructure.ts
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { VpcModule } from './vpc';
import { S3Module } from './s3';
import { Ec2Module } from './ec2';
import { IamModule } from './iam';
import { SecurityGroupModule } from './security-group';

export interface RegionalInfrastructureConfig {
  region: string;
  vpcCidr: string;
  subnetCidrs: string[];
  allowedCidr: string;
  tags: { [key: string]: string };
}

export class RegionalInfrastructure extends Construct {
  public readonly vpc: VpcModule;
  public readonly s3: S3Module;
  public readonly ec2: Ec2Module;
  public readonly iam: IamModule;
  public readonly securityGroup: SecurityGroupModule;

  constructor(
    scope: Construct,
    id: string,
    config: RegionalInfrastructureConfig
  ) {
    super(scope, id);

    // Create VPC and subnets
    this.vpc = new VpcModule(this, 'vpc', {
      vpcCidr: config.vpcCidr,
      subnetCidrs: config.subnetCidrs,
      region: config.region,
      tags: config.tags,
    });

    // Create S3 bucket
    this.s3 = new S3Module(this, 's3', {
      region: config.region,
      tags: config.tags,
    });

    // Create IAM roles and policies
    this.iam = new IamModule(this, 'iam', {
      s3BucketArn: this.s3.bucket.arn,
      region: config.region,
      tags: config.tags,
    });

    // Create security groups
    this.securityGroup = new SecurityGroupModule(this, 'security-group', {
      vpcId: this.vpc.vpc.id,
      allowedCidr: config.allowedCidr,
      tags: config.tags,
    });

    // Create EC2 instance
    this.ec2 = new Ec2Module(this, 'ec2', {
      subnetId: this.vpc.publicSubnets[0].id,
      securityGroupIds: [this.securityGroup.webSecurityGroup.id],
      iamInstanceProfile: this.iam.instanceProfile.name,
      region: config.region,
      tags: config.tags,
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: this.s3.bucket.bucket,
      description: 'S3 Bucket Name',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: this.ec2.instance.id,
      description: 'EC2 Instance ID',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: this.ec2.instance.publicIp,
      description: 'EC2 Instance Public IP',
    });
  }
}
```

## VPC Module

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface VpcModuleConfig {
  vpcCidr: string;
  subnetCidrs: string[];
  region: string;
  tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones
    const availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.region}-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.region}-igw`,
      },
    });

    // Create public subnets
    this.publicSubnets = config.subnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.region}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create route table for public subnets
    this.routeTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.region}-public-rt`,
      },
    });

    // Create route to internet gateway
    new Route(this, 'public-route', {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate subnets with route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.routeTable.id,
      });
    });
  }
}
```

## S3 Module

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

export interface S3ModuleConfig {
  region: string;
  tags: { [key: string]: string };
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `webapp-bucket-${config.region}-${Date.now()}`,
      tags: {
        ...config.tags,
        Name: `webapp-bucket-${config.region}`,
      },
    });

    // Enable versioning
    new S3BucketVersioning(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfiguration(this, 'bucket-encryption', {
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

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
```

## IAM Module

```typescript
import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

export interface IamModuleConfig {
  s3BucketArn: string;
  region: string;
  tags: { [key: string]: string };
}

export class IamModule extends Construct {
  public readonly role: IamRole;
  public readonly policy: IamPolicy;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // Create IAM role for EC2
    this.role = new IamRole(this, 'ec2-role', {
      name: `ec2-s3-role-${config.region}`,
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
        ...config.tags,
        Name: `ec2-s3-role-${config.region}`,
      },
    });

    // Create IAM policy for S3 access (least privilege)
    this.policy = new IamPolicy(this, 's3-policy', {
      name: `ec2-s3-policy-${config.region}`,
      description: 'Policy for EC2 to access S3 bucket in the same region',
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
            Resource: [config.s3BucketArn, `${config.s3BucketArn}/*`],
          },
        ],
      }),
      tags: {
        ...config.tags,
        Name: `ec2-s3-policy-${config.region}`,
      },
    });

    // Attach policy to role
    new IamRolePolicyAttachment(this, 'policy-attachment', {
      role: this.role.name,
      policyArn: this.policy.arn,
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `ec2-instance-profile-${config.region}`,
      role: this.role.name,
      tags: {
        ...config.tags,
        Name: `ec2-instance-profile-${config.region}`,
      },
    });
  }
}
```

## Security Group Module

```typescript
import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

export interface SecurityGroupModuleConfig {
  vpcId: string;
  allowedCidr: string;
  tags: { [key: string]: string };
}

export class SecurityGroupModule extends Construct {
  public readonly webSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Create security group for web servers
    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: 'web-security-group',
      description:
        'Security group for web servers - allows HTTP and SSH from specific CIDR',
      vpcId: config.vpcId,

      ingress: [
        {
          description: 'HTTP access from allowed CIDR',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: [config.allowedCidr],
        },
        {
          description: 'SSH access from allowed CIDR',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [config.allowedCidr],
        },
      ],

      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      tags: {
        ...config.tags,
        Name: 'web-security-group',
      },
    });
  }
}
```

## EC2 Module

```typescript
import { Construct } from 'constructs';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface Ec2ModuleConfig {
  subnetId: string;
  securityGroupIds: string[];
  iamInstanceProfile: string;
  region: string;
  tags: { [key: string]: string };
}

export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux', {
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

    // Create EC2 instance
    this.instance = new Instance(this, 'web-server', {
      ami: amazonLinuxAmi.id,
      instanceType: 't2.micro',
      subnetId: config.subnetId,
      vpcSecurityGroupIds: config.securityGroupIds,
      iamInstanceProfile: config.iamInstanceProfile,

      userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Web Server in ${config.region}</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
`,

      tags: {
        ...config.tags,
        Name: `web-server-${config.region}`,
      },
    });
  }
}
```

## Package.json

```json
{
  "name": "secure-aws-infrastructure",
  "version": "1.0.0",
  "description": "Secure AWS infrastructure with CDKTF",
  "main": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.8",
    "@types/node": "^20.9.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
```

## CDKTF Configuration

```json
// cdktf.json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "secure-aws-infrastructure",
  "sendCrashReports": "false",
  "codeMakerOutput": "generated",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", "cdktf.out", "generated"]
}
```

## Deployment Instructions

1. **Initialize the project:**

```bash
npm install
cdktf get
```

2. **Before deployment, create the state management resources:**

```bash
# Create S3 bucket for state (replace with your bucket name)
aws s3 mb s3://your-terraform-state-bucket --region us-east-1

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

3. **Synthesize and deploy:**

```bash
# Compile TypeScript
npm run build

# Generate Terraform configuration
cdktf synth

# Plan deployment
terraform -chdir=cdktf.out/stacks/secure-aws-infrastructure plan

# Apply deployment
terraform -chdir=cdktf.out/stacks/secure-aws-infrastructure apply
```

## Key Security Features

1. **IAM Best Practices:**
   - Least privilege access
   - Resource-specific permissions
   - Proper role assumption policies

2. **Network Security:**
   - Restricted security group rules
   - Only specific CIDR block access
   - Proper VPC configuration

3. **S3 Security:**
   - Versioning enabled
   - Server-side encryption
   - Public access blocked

This solution provides a secure, scalable, and maintainable infrastructure that follows Terraform and AWS best practices while meeting all your specified requirements.
