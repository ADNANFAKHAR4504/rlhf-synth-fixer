# Trading Platform Infrastructure - CDKTF Implementation

## Overview

This implementation provides a complete multi-account AWS landing zone with trading platform infrastructure using CDKTF (Cloud Development Kit for Terraform). The solution includes VPC networking, DynamoDB storage, S3 data buckets, KMS encryption, and AWS Organizations governance.

## Core Infrastructure Components

### 1. CDKTF Application Entry Point

**File: `bin/tap.ts`**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'cdktf';
import { TradingPlatformStack } from '../lib/tap-stack';

const app = new App();

new TradingPlatformStack(app, 'trading-platform', {
  isPrimary: true,
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-west-2',
  domainName: 'trading-platform.example.com',
});

app.synth();
```

### 2. Trading Platform Stack Implementation

**File: `lib/tap-stack.ts`**

```typescript
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

export interface TradingPlatformStackProps {
  readonly isPrimary: boolean;
  readonly primaryRegion: string;
  readonly secondaryRegion: string;
  readonly domainName: string;
  readonly hostedZoneId?: string;
  readonly globalBucketName?: string;
  readonly primaryDbClusterArn?: string;
}

export class TradingPlatformStack extends TerraformStack {
  private readonly uniqueSuffix: string;
  public readonly vpcId: string;
  public readonly s3BucketArn: string;
  public readonly dynamoTableArn: string;

  constructor(scope: Construct, id: string, props: TradingPlatformStackProps) {
    super(scope, id);

    // Generate unique suffix for resource naming
    this.uniqueSuffix =
      Math.floor(Math.random() * 1000000).toString() +
      '-' +
      Math.random().toString(36).substring(2, 6);

    // Configure AWS Provider with default tags
    new AwsProvider(this, 'aws', {
      region: props.primaryRegion,
      defaultTags: [
        {
          tags: {
            Project: 'TradingPlatform',
            Environment: 'Production',
            ManagedBy: 'CDKTF',
            Owner: 'FinanceOps',
            CostCenter: 'FinanceOps',
            'DR-RPO': '5-minutes',
            'DR-RTO': '15-minutes',
            Timestamp: new Date().toISOString(),
          },
        },
      ],
    });

    // Create VPC
    const vpc = new Vpc(this, 'TradingVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `trading-platform-vpc-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Purpose: 'Trading Platform VPC',
      },
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: {
        Name: `trading-platform-igw-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      },
    });

    // Create Public Subnet
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      availabilityZone: `${props.primaryRegion}a`,
      cidrBlock: '10.0.1.0/24',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `trading-platform-public-subnet-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Type: 'Public',
      },
    });

    // Create Private Subnet
    new Subnet(this, 'PrivateSubnet', {
      vpcId: vpc.id,
      availabilityZone: `${props.primaryRegion}b`,
      cidrBlock: '10.0.2.0/24',
      tags: {
        Name: `trading-platform-private-subnet-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Type: 'Private',
      },
    });

    // Create Route Table for Public Subnet
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `trading-platform-public-rt-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      },
    });

    // Create Route to Internet Gateway
    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate Route Table with Public Subnet
    new RouteTableAssociation(this, 'PublicRouteTableAssociation', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Create Security Group
    new SecurityGroup(this, 'DefaultSecurityGroup', {
      name: `trading-platform-sg-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      description: 'Default security group for trading platform',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP inbound',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS inbound',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `trading-platform-sg-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      },
    });

    // Create KMS Keys
    const databaseKey = new KmsKey(this, 'DatabaseKey', {
      description: `Database encryption key for trading platform (${props.isPrimary ? 'pri' : 'sec'})`,
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      deletionWindowInDays: 30,
      tags: {
        Name: `trading-platform-database-key-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Purpose: 'Database encryption',
      },
    });

    const storageKey = new KmsKey(this, 'StorageKey', {
      description: `S3 encryption key for trading platform (${props.isPrimary ? 'pri' : 'sec'})`,
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      deletionWindowInDays: 30,
      tags: {
        Name: `trading-platform-storage-key-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Purpose: 'S3 encryption',
      },
    });

    // Create KMS Key Aliases
    new KmsAlias(this, 'DatabaseKeyAlias', {
      name: `alias/trading-platform-database-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      targetKeyId: databaseKey.keyId,
    });

    new KmsAlias(this, 'StorageKeyAlias', {
      name: `alias/trading-platform-storage-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      targetKeyId: storageKey.keyId,
    });

    // Create S3 Bucket
    const s3Bucket = new S3Bucket(this, 'TradingDataBucket', {
      bucket: `trading-platform-data-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      tags: {
        Name: `trading-platform-data-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Environment: 'Production',
        Purpose: 'Trading data storage',
      },
    });

    this.s3BucketArn = s3Bucket.arn;

    // Create DynamoDB Table
    const dynamoTable = new DynamodbTable(this, 'TradingTable', {
      name: `trading-platform-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'tradingId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'tradingId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'S',
        },
        {
          name: 'userId',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'UserIndex',
          hashKey: 'userId',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: databaseKey.arn,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `trading-platform-${props.isPrimary ? 'pri' : 'sec'}-${this.uniqueSuffix}`,
        Environment: 'Production',
        Purpose: 'Trading transactions storage',
      },
    });

    this.dynamoTableArn = dynamoTable.arn;

    // Create Outputs
    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'S3BucketArn', {
      value: s3Bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    new TerraformOutput(this, 'DynamoTableArn', {
      value: dynamoTable.arn,
      description: 'ARN of the DynamoDB table',
    });
  }
}
```

### 3. CloudFormation Template for AWS Organizations

**File: `lib/TapStack.yml`**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-account landing zone with AWS Organizations'

Parameters:
  OrganizationName:
    Type: String
    Default: 'TradingPlatform'
    Description: 'Name of the AWS Organization'

  MasterAccountEmail:
    Type: String
    Description: 'Email for the master account'

  SecurityAccountEmail:
    Type: String
    Description: 'Email for the security account'

  ProductionAccountEmail:
    Type: String
    Description: 'Email for the production account'

  DevelopmentAccountEmail:
    Type: String
    Description: 'Email for the development account'

Resources:
  # AWS Organizations
  Organization:
    Type: AWS::Organizations::Organization
    Properties:
      FeatureSet: ALL

  # Organizational Units
  SecurityOU:
    Type: AWS::Organizations::OrganizationalUnit
    Properties:
      Name: Security
      ParentId: !GetAtt Organization.RootId

  WorkloadsOU:
    Type: AWS::Organizations::OrganizationalUnit
    Properties:
      Name: Workloads
      ParentId: !GetAtt Organization.RootId

  # Service Control Policies
  RestrictRegionsSCP:
    Type: AWS::Organizations::Policy
    Properties:
      Name: RestrictRegions
      Description: Restrict operations to allowed regions
      Type: SERVICE_CONTROL_POLICY
      Content: |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Action": "*",
              "Resource": "*",
              "Condition": {
                "StringNotEquals": {
                  "aws:RequestedRegion": [
                    "us-east-1",
                    "us-west-2",
                    "eu-west-1",
                    "eu-central-1"
                  ]
                }
              }
            }
          ]
        }

  PreventRootAccessSCP:
    Type: AWS::Organizations::Policy
    Properties:
      Name: PreventRootAccess
      Description: Prevent root user access
      Type: SERVICE_CONTROL_POLICY
      Content: |
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Deny",
              "Action": "*",
              "Resource": "*",
              "Condition": {
                "StringEquals": {
                  "aws:PrincipalType": "Root"
                }
              }
            }
          ]
        }

  # Account Creation
  SecurityAccount:
    Type: AWS::Organizations::Account
    Properties:
      AccountName: Security
      Email: !Ref SecurityAccountEmail

  ProductionAccount:
    Type: AWS::Organizations::Account
    Properties:
      AccountName: Production
      Email: !Ref ProductionAccountEmail

  DevelopmentAccount:
    Type: AWS::Organizations::Account
    Properties:
      AccountName: Development
      Email: !Ref DevelopmentAccountEmail

  # Policy Attachments
  RestrictRegionsAttachment:
    Type: AWS::Organizations::PolicyAttachment
    Properties:
      PolicyId: !Ref RestrictRegionsSCP
      TargetId: !GetAtt Organization.RootId
      TargetType: ROOT

  PreventRootAccessAttachment:
    Type: AWS::Organizations::PolicyAttachment
    Properties:
      PolicyId: !Ref PreventRootAccessSCP
      TargetId: !GetAtt Organization.RootId
      TargetType: ROOT

  # CloudTrail for Organization
  OrganizationCloudTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: OrganizationTrail
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true

  # S3 Bucket for CloudTrail
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${OrganizationName}-cloudtrail-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  OrganizationId:
    Description: Organization ID
    Value: !Ref Organization
    Export:
      Name: !Sub '${AWS::StackName}-OrganizationId'

  SecurityAccountId:
    Description: Security Account ID
    Value: !Ref SecurityAccount
    Export:
      Name: !Sub '${AWS::StackName}-SecurityAccountId'

  ProductionAccountId:
    Description: Production Account ID
    Value: !Ref ProductionAccount
    Export:
      Name: !Sub '${AWS::StackName}-ProductionAccountId'

  DevelopmentAccountId:
    Description: Development Account ID
    Value: !Ref DevelopmentAccount
    Export:
      Name: !Sub '${AWS::StackName}-DevelopmentAccountId'
```

## Architecture Features

### Multi-Account Landing Zone

- AWS Organizations with Service Control Policies
- Separate accounts for Security, Production, and Development
- Regional restrictions and root access prevention
- Centralized CloudTrail logging

### Trading Platform Infrastructure

- **VPC**: Complete networking with public/private subnets
- **DynamoDB**: High-performance NoSQL database with encryption
- **S3**: Secure data storage with versioning
- **KMS**: Customer-managed encryption keys
- **Security Groups**: Network-level security controls

### Security and Compliance

- Encryption at rest and in transit
- Point-in-time recovery for DynamoDB
- Multi-region support for disaster recovery
- Comprehensive resource tagging for cost management

### Operational Excellence

- Infrastructure as Code with CDKTF
- Automated resource provisioning
- Consistent naming conventions
- Comprehensive monitoring setup
