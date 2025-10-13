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

    const regionSuffix = props.isPrimary ? 'pri' : 'sec';
    const currentRegion = props.isPrimary
      ? props.primaryRegion
      : props.secondaryRegion;

    // Generate unique suffix for resource naming to avoid conflicts
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    this.uniqueSuffix = `${timestamp}-${randomSuffix}`;

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: currentRegion,
      defaultTags: [
        {
          tags: {
            Project: 'TradingPlatform',
            Environment: 'Production',
            ManagedBy: 'CDKTF',
            Owner: 'FinanceOps',
            CostCenter: 'FinanceOps',
            Timestamp: new Date().toISOString(),
            'DR-RTO': '15-minutes',
            'DR-RPO': '5-minutes',
          },
        },
      ],
    });

    // KMS Keys for encryption
    const kmsKeys = this.createKmsKeys(regionSuffix);

    // VPC
    const vpc = this.createVpc(regionSuffix);

    // S3 Bucket
    const s3Bucket = this.createS3Bucket(regionSuffix, kmsKeys.storageKey);

    // DynamoDB Table for trading data
    const dynamoTable = this.createDynamoTable(
      regionSuffix,
      kmsKeys.databaseKey
    );

    // Store outputs
    this.vpcId = vpc.id;
    this.s3BucketArn = s3Bucket.arn;
    this.dynamoTableArn = dynamoTable.arn;

    // CloudFormation Outputs
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

  private createKmsKeys(regionSuffix: string) {
    const databaseKey = new KmsKey(this, 'DatabaseKey', {
      description: `Database encryption key for trading platform (${regionSuffix})`,
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      deletionWindowInDays: 30,
      tags: {
        Name: `trading-platform-database-key-${regionSuffix}-${this.uniqueSuffix}`,
        Purpose: 'Database encryption',
      },
    });

    new KmsAlias(this, 'DatabaseKeyAlias', {
      name: `alias/trading-platform-database-${regionSuffix}-${this.uniqueSuffix}`,
      targetKeyId: databaseKey.keyId,
    });

    const storageKey = new KmsKey(this, 'StorageKey', {
      description: `S3 encryption key for trading platform (${regionSuffix})`,
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      deletionWindowInDays: 30,
      tags: {
        Name: `trading-platform-storage-key-${regionSuffix}-${this.uniqueSuffix}`,
        Purpose: 'S3 encryption',
      },
    });

    new KmsAlias(this, 'StorageKeyAlias', {
      name: `alias/trading-platform-storage-${regionSuffix}-${this.uniqueSuffix}`,
      targetKeyId: storageKey.keyId,
    });

    return {
      databaseKey,
      storageKey,
    };
  }

  private createVpc(regionSuffix: string): Vpc {
    const vpc = new Vpc(this, 'TradingVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `trading-platform-vpc-${regionSuffix}-${this.uniqueSuffix}`,
        Purpose: 'Trading Platform VPC',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: {
        Name: `trading-platform-igw-${regionSuffix}-${this.uniqueSuffix}`,
      },
    });

    // Public Subnet
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `trading-platform-public-subnet-${regionSuffix}-${this.uniqueSuffix}`,
        Type: 'Public',
      },
    });

    // Private Subnet
    new Subnet(this, 'PrivateSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `trading-platform-private-subnet-${regionSuffix}-${this.uniqueSuffix}`,
        Type: 'Private',
      },
    });

    // Route Table for public subnet
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `trading-platform-public-rt-${regionSuffix}-${this.uniqueSuffix}`,
      },
    });

    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'PublicRouteTableAssociation', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Security Group
    new SecurityGroup(this, 'DefaultSecurityGroup', {
      name: `trading-platform-sg-${regionSuffix}-${this.uniqueSuffix}`,
      description: 'Default security group for trading platform',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS inbound',
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP inbound',
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
        Name: `trading-platform-sg-${regionSuffix}-${this.uniqueSuffix}`,
      },
    });

    return vpc;
  }

  private createS3Bucket(regionSuffix: string, _kmsKey: KmsKey): S3Bucket {
    return new S3Bucket(this, 'TradingDataBucket', {
      bucket: `trading-platform-data-${regionSuffix}-${this.uniqueSuffix}`,
      tags: {
        Name: `trading-platform-data-${regionSuffix}-${this.uniqueSuffix}`,
        Purpose: 'Trading data storage',
        Environment: 'Production',
      },
    });
  }

  private createDynamoTable(
    regionSuffix: string,
    kmsKey: KmsKey
  ): DynamodbTable {
    return new DynamodbTable(this, 'TradingTable', {
      name: `trading-platform-${regionSuffix}-${this.uniqueSuffix}`,
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
        kmsKeyArn: kmsKey.arn,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: `trading-platform-${regionSuffix}-${this.uniqueSuffix}`,
        Purpose: 'Trading transactions storage',
        Environment: 'Production',
      },
    });
  }
}
