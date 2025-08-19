I'll create a comprehensive CDKTF TypeScript setup that meets all your security requirements. Here's the complete monolithic infrastructure code:

## Project Structure

```
security-aws-infra/
├── main.ts
├── package.json
├── tsconfig.json
├── cdktf.json
└── README.md
```

## package.json

```json
{
  "name": "security-aws-infra",
  "version": "1.0.0",
  "description": "Security-focused AWS infrastructure with CDKTF",
  "main": "main.ts",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  },
  "dependencies": {
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0",
    "@cdktf/provider-aws": "^19.0.0"
  }
}
```

## tsconfig.json

```json
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
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "cdktf.out"]
}
```

## cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "security-aws-infra",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## main.ts

```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLogging } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamUser } from '@cdktf/provider-aws/lib/iam-user';
import { IamUserPolicy } from '@cdktf/provider-aws/lib/iam-user-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { CloudtrailEventDataStore } from '@cdktf/provider-aws/lib/cloudtrail-event-data-store';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { VpcFlowLog } from '@cdktf/provider-aws/lib/vpc-flow-log';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface CommonTags {
  Environment: string;
  Owner: string;
  Project: string;
}

class SecurityAwsStack extends TerraformStack {
  private readonly commonTags: CommonTags;
  private kmsKey: KmsKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for all resources
    this.commonTags = {
      Environment: 'production',
      Owner: 'security-team',
      Project: 'secure-infrastructure',
    };

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-west-2',
    });

    // Data sources
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    const amazonLinux = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create KMS key for encryption
    this.createKmsKey();

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcLogGroup = this.createCloudWatchLogGroup();

    // Create VPC and networking
    const { vpc, privateSubnets, publicSubnets } =
      this.createVpcAndNetworking(availabilityZones);

    // Create VPC Flow Logs
    this.createVpcFlowLogs(vpc, vpcLogGroup);

    // Create S3 buckets
    const { dataBucket, logsBucket } = this.createS3Buckets();

    // Create security groups
    const securityGroups = this.createSecurityGroups(vpc);

    // Create IAM resources
    const { ec2Role, instanceProfile } = this.createIamResources();

    // Create EC2 instances
    this.createEc2Instances(
      privateSubnets,
      securityGroups.webSg,
      instanceProfile,
      amazonLinux
    );

    // Create CloudTrail for audit logging
    this.createCloudTrail();

    // Outputs
    this.createOutputs(vpc, dataBucket, logsBucket);
  }

  private createKmsKey(): void {
    this.kmsKey = new KmsKey(this, 'main-kms-key', {
      description: 'Main KMS key for encrypting all resources',
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: 'arn:aws:iam::${data.aws_caller_identity.current.account_id}:root',
            },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: this.commonTags,
    });

    new KmsAlias(this, 'main-kms-alias', {
      name: 'alias/main-encryption-key',
      targetKeyId: this.kmsKey.keyId,
    });
  }

  private createCloudWatchLogGroup(): CloudwatchLogGroup {
    return new CloudwatchLogGroup(this, 'vpc-flow-logs', {
      name: '/aws/vpc/flowlogs',
      retentionInDays: 30,
      kmsKeyId: this.kmsKey.arn,
      tags: this.commonTags,
    });
  }

  private createVpcAndNetworking(availabilityZones: DataAwsAvailabilityZones) {
    // VPC
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...this.commonTags,
        Name: 'main-vpc',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
      tags: {
        ...this.commonTags,
        Name: 'main-igw',
      },
    });

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: availabilityZones.names[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...this.commonTags,
          Name: `public-subnet-${i + 1}`,
          Type: 'public',
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: availabilityZones.names[i],
        tags: {
          ...this.commonTags,
          Name: `private-subnet-${i + 1}`,
          Type: 'private',
        },
      });
      privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          ...this.commonTags,
          Name: `nat-eip-${i + 1}`,
        },
      });

      // NAT Gateway
      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...this.commonTags,
          Name: `nat-gateway-${i + 1}`,
        },
      });

      // Route table for private subnet
      const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
        vpcId: vpc.id,
        tags: {
          ...this.commonTags,
          Name: `private-rt-${i + 1}`,
        },
      });

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
    }

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        ...this.commonTags,
        Name: 'public-rt',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    return { vpc, privateSubnets, publicSubnets };
  }

  private createVpcFlowLogs(vpc: Vpc, logGroup: CloudwatchLogGroup): void {
    // IAM role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'vpc-flow-log-role', {
      name: 'vpc-flow-log-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: this.commonTags,
    });

    new IamRolePolicy(this, 'vpc-flow-log-policy', {
      name: 'vpc-flow-log-policy',
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });

    new VpcFlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestination: logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      resourceId: vpc.id,
      resourceType: 'VPC',
      trafficType: 'ALL',
      tags: this.commonTags,
    });
  }

  private createS3Buckets() {
    // Data bucket
    const dataBucket = new S3Bucket(this, 'data-bucket', {
      bucket: `secure-data-bucket-${Math.random().toString(36).substring(7)}`,
      tags: {
        ...this.commonTags,
        Purpose: 'data-storage',
      },
    });

    // Logs bucket
    const logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `secure-logs-bucket-${Math.random().toString(36).substring(7)}`,
      tags: {
        ...this.commonTags,
        Purpose: 'audit-logs',
      },
    });

    // Configure both buckets with security settings
    [dataBucket, logsBucket].forEach((bucket, index) => {
      const bucketName = index === 0 ? 'data' : 'logs';

      // Enable versioning
      new S3BucketVersioning(this, `${bucketName}-bucket-versioning`, {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });

      // Server-side encryption
      new S3BucketServerSideEncryptionConfiguration(
        this,
        `${bucketName}-bucket-encryption`,
        {
          bucket: bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                kmsMasterKeyId: this.kmsKey.arn,
                sseAlgorithm: 'aws:kms',
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

      // Block public access
      new S3BucketPublicAccessBlock(this, `${bucketName}-bucket-pab`, {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      });

      // Enable access logging (data bucket logs to logs bucket)
      if (index === 0) {
        new S3BucketLogging(this, 'data-bucket-logging', {
          bucket: dataBucket.id,
          targetBucket: logsBucket.id,
          targetPrefix: 'access-logs/',
        });
      }
    });

    return { dataBucket, logsBucket };
  }

  private createSecurityGroups(vpc: Vpc) {
    // Web security group (for EC2 instances)
    const webSg = new SecurityGroup(this, 'web-sg', {
      name: 'web-security-group',
      description: 'Security group for web servers',
      vpcId: vpc.id,
      ingress: [
        {
          description: 'HTTP from VPC',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
        {
          description: 'HTTPS from VPC',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
        {
          description: 'SSH from VPC',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
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
        ...this.commonTags,
        Name: 'web-security-group',
      },
    });

    return { webSg };
  }

  private createIamResources() {
    // Create IAM user with MFA enforcement
    const user = new IamUser(this, 'secure-user', {
      name: 'secure-user',
      tags: this.commonTags,
    });

    // Inline policy for the user that enforces MFA
    new IamUserPolicy(this, 'secure-user-policy', {
      name: 'secure-user-policy',
      user: user.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowViewAccountInfo',
            Effect: 'Allow',
            Action: [
              'iam:GetAccountPasswordPolicy',
              'iam:ListVirtualMFADevices',
            ],
            Resource: '*',
          },
          {
            Sid: 'AllowManageOwnPasswords',
            Effect: 'Allow',
            Action: ['iam:ChangePassword', 'iam:GetUser'],
            Resource: 'arn:aws:iam::*:user/${aws:username}',
          },
          {
            Sid: 'AllowManageOwnMFA',
            Effect: 'Allow',
            Action: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:ListMFADevices',
              'iam:EnableMFADevice',
              'iam:ResyncMFADevice',
            ],
            Resource: [
              'arn:aws:iam::*:mfa/${aws:username}',
              'arn:aws:iam::*:user/${aws:username}',
            ],
          },
          {
            Sid: 'DenyAllExceptUnlessSignedInWithMFA',
            Effect: 'Deny',
            NotAction: [
              'iam:CreateVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:GetUser',
              'iam:ListMFADevices',
              'iam:ListVirtualMFADevices',
              'iam:ResyncMFADevice',
              'sts:GetSessionToken',
            ],
            Resource: '*',
            Condition: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
            },
          },
        ],
      }),
    });

    // EC2 instance role
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'ec2-instance-role',
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
      tags: this.commonTags,
    });

    // Inline policy for EC2 role (least privilege)
    new IamRolePolicy(this, 'ec2-role-policy', {
      name: 'ec2-role-policy',
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'ec2:DescribeVolumes',
              'ec2:DescribeTags',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject'],
            Resource: 'arn:aws:s3:::secure-*/*',
          },
        ],
      }),
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'ec2-instance-profile',
        role: ec2Role.name,
      }
    );

    return { ec2Role, instanceProfile };
  }

  private createEc2Instances(
    privateSubnets: Subnet[],
    securityGroup: SecurityGroup,
    instanceProfile: IamInstanceProfile,
    ami: DataAwsAmi
  ): void {
    privateSubnets.forEach((subnet, index) => {
      new Instance(this, `web-server-${index}`, {
        ami: ami.id,
        instanceType: 't3.micro',
        keyName: 'my-key-pair', // You'll need to create this key pair manually
        vpcSecurityGroupIds: [securityGroup.id],
        subnetId: subnet.id,
        iamInstanceProfile: instanceProfile.name,
        ebsBlockDevice: [
          {
            deviceName: '/dev/xvda',
            volumeType: 'gp3',
            volumeSize: 20,
            encrypted: true,
            kmsKeyId: this.kmsKey.arn,
            deleteOnTermination: true,
          },
        ],
        userData: Buffer.from(
          `#!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default
        `
        ).toString('base64'),
        tags: {
          ...this.commonTags,
          Name: `web-server-${index + 1}`,
        },
      });
    });
  }

  private createCloudTrail(): void {
    new CloudtrailEventDataStore(this, 'audit-trail', {
      name: 'security-audit-trail',
      multiRegionEnabled: true,
      organizationEnabled: false,
      advancedEventSelector: [
        {
          name: 'Log all management events',
          fieldSelector: [
            {
              field: 'eventCategory',
              equals: ['Management'],
            },
          ],
        },
        {
          name: 'Log all data events for S3',
          fieldSelector: [
            {
              field: 'eventCategory',
              equals: ['Data'],
            },
            {
              field: 'resources.type',
              equals: ['AWS::S3::Object'],
            },
          ],
        },
      ],
      kmsKeyId: this.kmsKey.arn,
      tags: this.commonTags,
    });
  }

  private createOutputs(
    vpc: Vpc,
    dataBucket: S3Bucket,
    logsBucket: S3Bucket
  ): void {
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'data-bucket-name', {
      value: dataBucket.bucket,
      description: 'Name of the data S3 bucket',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: logsBucket.bucket,
      description: 'Name of the logs S3 bucket',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: this.kmsKey.keyId,
      description: 'ID of the main KMS key',
    });
  }
}

const app = new App();
new SecurityAwsStack(app, 'security-aws-stack');
app.synth();
```

## README.md

````markdown
# Security-Focused AWS Infrastructure with CDKTF

This project creates a comprehensive, security-focused AWS infrastructure using CDKTF (Cloud Development Kit for Terraform) with TypeScript.

## Security Features Implemented

### ✅ Resource Tagging

- All resources tagged with Environment, Owner, and Project
- Consistent tagging strategy across all components

### ✅ IAM Security

- Inline policies following least privilege principle
- MFA enforcement for all IAM users
- Dedicated service roles with minimal permissions

### ✅ Encryption at Rest

- KMS-managed encryption keys with automatic rotation
- All S3 buckets encrypted with customer-managed KMS keys
- EBS volumes encrypted with KMS keys

### ✅ S3 Security

- Versioning enabled on all buckets
- Public access completely blocked
- Access logging enabled
- Server-side encryption with KMS

### ✅ Network Security

- VPC with no direct internet access for private resources
- NAT Gateways for secure outbound traffic
- Security groups with restrictive rules
- VPC Flow Logs enabled

### ✅ Comprehensive Logging

- CloudTrail for API audit logging
- VPC Flow Logs for network monitoring
- CloudWatch integration for EC2 instances
- S3 access logging

### ✅ EC2 Security

- Instances deployed in private subnets only
- Security groups with minimal required access
- Encrypted EBS volumes
- IAM instance profiles with least privilege

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Node.js** (v16 or later)
3. **Terraform** (v1.0 or later)
4. **CDKTF CLI** installed globally

```bash
npm install -g cdktf-cli
```
````

## Deployment Instructions

### 1. Clone and Setup

```bash
git clone <repository-url>
cd security-aws-infra
npm install
```

### 2. Configure AWS Provider

Ensure your AWS credentials are configured:

```bash
aws configure
# or set environment variables:
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-west-2"
```

### 3. Create EC2 Key Pair

Create an EC2 key pair for SSH access:

```bash
aws ec2 create-key-pair --key-name my-key-pair --query 'KeyMaterial' --output text > my-key-pair.pem
chmod 400 my-key-pair.pem
```

### 4. Initialize and Deploy

```bash
# Get provider dependencies
cdktf get

# Compile TypeScript
npm run build

# Generate Terraform configuration
cdktf synth

# Review the plan
cdktf plan

# Deploy infrastructure
cdktf deploy
```

### 5. Verify Deployment

```bash
# Check if resources are created
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=secure-infrastructure"
aws s3 ls | grep secure-
aws kms list-keys
```

## Compliance Verification

### Security Group Rules

```bash
aws ec2 describe-security-groups --group-names web-security-group
```

### S3 Bucket Encryption

```bash
aws s3api get-bucket-encryption --bucket <bucket-name>
```

### VPC Flow Logs

```bash
aws ec2 describe-flow-logs
```

### CloudTrail Status

```bash
aws cloudtrail describe-event-data-stores
```

### IAM Policy Verification

```bash
aws iam get-user-policy --user-name secure-user --policy-name secure-user-policy
```

## Security Checklist

- [ ] All resources have required tags (Environment, Owner, Project)
- [ ] IAM policies are inline and follow least privilege
- [ ] KMS encryption enabled for all data at rest
- [ ] S3 buckets have versioning and public access blocked
- [ ] VPC uses NAT Gateway for outbound traffic (no direct internet)
- [ ] Logging enabled for all services
- [ ] EC2 instances in private subnets with security groups
- [ ] MFA enforcement configured for IAM users

## Monitoring and Maintenance

### CloudWatch Logs

Monitor logs in the following log groups:

- `/aws/vpc/flowlogs` - VPC Flow Logs
- CloudTrail events in the event data store

### Cost Optimization

- NAT Gateways are the primary cost driver
- Consider using VPC endpoints for AWS services to reduce NAT Gateway usage
- Monitor CloudWatch logs retention settings

### Security Updates

- Regularly rotate KMS keys (automatic rotation enabled)
- Review IAM policies quarterly
- Update EC2 instances with latest security patches
- Monitor CloudTrail for unusual activity

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

**Warning**: This will permanently delete all resources including encrypted data in S3 buckets.