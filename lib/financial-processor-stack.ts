import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface FinancialProcessorStackConfig {
  environment: string;
  appName: string;
  costCenter: string;
  primaryRegion: string;
  secondaryRegion: string;
  domainName: string;
}

export class FinancialProcessorStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    config: FinancialProcessorStackConfig
  ) {
    super(scope, id);

    const commonTags = {
      Environment: config.environment,
      App: config.appName,
      ManagedBy: 'CDKTF',
      CostCenter: config.costCenter,
    };

    // AWS Providers for both regions
    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: config.primaryRegion,
      alias: 'primary',
    });

    const secondaryProvider = new AwsProvider(this, 'aws-secondary', {
      region: config.secondaryRegion,
      alias: 'secondary',
    });

    // Generate unique suffix to avoid resource naming conflicts
    // Use timestamp and random string for uniqueness across deployments
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 6);
    const uniqueSuffix = `${timestamp}-${randomStr}`;

    // KMS Keys for encryption (per region)
    const primaryKmsKey = new KmsKey(this, 'primary-kms-key', {
      provider: primaryProvider,
      description:
        'KMS key for financial processor encryption in primary region',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${config.primaryRegion}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new KmsAlias(this, 'primary-kms-alias', {
      provider: primaryProvider,
      name: `alias/${config.appName}-primary-${uniqueSuffix}`,
      targetKeyId: primaryKmsKey.keyId,
    });

    const secondaryKmsKey = new KmsKey(this, 'secondary-kms-key', {
      provider: secondaryProvider,
      description:
        'KMS key for financial processor encryption in secondary region',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${config.secondaryRegion}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: commonTags,
    });

    new KmsAlias(this, 'secondary-kms-alias', {
      provider: secondaryProvider,
      name: `alias/${config.appName}-secondary-${uniqueSuffix}`,
      targetKeyId: secondaryKmsKey.keyId,
    });

    // VPC Configuration - Primary Region
    const primaryVpc = new Vpc(this, 'primary-vpc', {
      provider: primaryProvider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: `${config.appName}-primary-vpc` },
    });

    // Public Subnets - Primary
    const primaryPublicSubnet1 = new Subnet(this, 'primary-public-subnet-1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${config.primaryRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: `${config.appName}-primary-public-1` },
    });

    const primaryPublicSubnet2 = new Subnet(this, 'primary-public-subnet-2', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${config.primaryRegion}b`,
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: `${config.appName}-primary-public-2` },
    });

    // Private Subnets - Primary
    const primaryPrivateSubnet1 = new Subnet(this, 'primary-private-subnet-1', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `${config.primaryRegion}a`,
      tags: { ...commonTags, Name: `${config.appName}-primary-private-1` },
    });

    const primaryPrivateSubnet2 = new Subnet(this, 'primary-private-subnet-2', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${config.primaryRegion}b`,
      tags: { ...commonTags, Name: `${config.appName}-primary-private-2` },
    });

    // Internet Gateway - Primary
    const primaryIgw = new InternetGateway(this, 'primary-igw', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: { ...commonTags, Name: `${config.appName}-primary-igw` },
    });

    // NAT Gateway - Primary
    const primaryNatEip = new Eip(this, 'primary-nat-eip', {
      provider: primaryProvider,
      domain: 'vpc',
      tags: { ...commonTags, Name: `${config.appName}-primary-nat-eip` },
    });

    const primaryNatGateway = new NatGateway(this, 'primary-nat-gateway', {
      provider: primaryProvider,
      allocationId: primaryNatEip.id,
      subnetId: primaryPublicSubnet1.id,
      tags: { ...commonTags, Name: `${config.appName}-primary-nat` },
    });

    // Route Tables - Primary
    const primaryPublicRt = new RouteTable(this, 'primary-public-rt', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: { ...commonTags, Name: `${config.appName}-primary-public-rt` },
    });

    new Route(this, 'primary-public-route', {
      provider: primaryProvider,
      routeTableId: primaryPublicRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: primaryIgw.id,
    });

    new RouteTableAssociation(this, 'primary-public-rta-1', {
      provider: primaryProvider,
      subnetId: primaryPublicSubnet1.id,
      routeTableId: primaryPublicRt.id,
    });

    new RouteTableAssociation(this, 'primary-public-rta-2', {
      provider: primaryProvider,
      subnetId: primaryPublicSubnet2.id,
      routeTableId: primaryPublicRt.id,
    });

    const primaryPrivateRt = new RouteTable(this, 'primary-private-rt', {
      provider: primaryProvider,
      vpcId: primaryVpc.id,
      tags: { ...commonTags, Name: `${config.appName}-primary-private-rt` },
    });

    new Route(this, 'primary-private-route', {
      provider: primaryProvider,
      routeTableId: primaryPrivateRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: primaryNatGateway.id,
    });

    new RouteTableAssociation(this, 'primary-private-rta-1', {
      provider: primaryProvider,
      subnetId: primaryPrivateSubnet1.id,
      routeTableId: primaryPrivateRt.id,
    });

    new RouteTableAssociation(this, 'primary-private-rta-2', {
      provider: primaryProvider,
      subnetId: primaryPrivateSubnet2.id,
      routeTableId: primaryPrivateRt.id,
    });

    // VPC Configuration - Secondary Region
    const secondaryVpc = new Vpc(this, 'secondary-vpc', {
      provider: secondaryProvider,
      cidrBlock: '10.1.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...commonTags, Name: `${config.appName}-secondary-vpc` },
    });

    // Public Subnets - Secondary
    const secondaryPublicSubnet1 = new Subnet(
      this,
      'secondary-public-subnet-1',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.1.0/24',
        availabilityZone: `${config.secondaryRegion}a`,
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `${config.appName}-secondary-public-1` },
      }
    );

    const secondaryPublicSubnet2 = new Subnet(
      this,
      'secondary-public-subnet-2',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.2.0/24',
        availabilityZone: `${config.secondaryRegion}b`,
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: `${config.appName}-secondary-public-2` },
      }
    );

    // Private Subnets - Secondary
    const secondaryPrivateSubnet1 = new Subnet(
      this,
      'secondary-private-subnet-1',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.10.0/24',
        availabilityZone: `${config.secondaryRegion}a`,
        tags: { ...commonTags, Name: `${config.appName}-secondary-private-1` },
      }
    );

    const secondaryPrivateSubnet2 = new Subnet(
      this,
      'secondary-private-subnet-2',
      {
        provider: secondaryProvider,
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.11.0/24',
        availabilityZone: `${config.secondaryRegion}b`,
        tags: { ...commonTags, Name: `${config.appName}-secondary-private-2` },
      }
    );

    // Internet Gateway - Secondary
    const secondaryIgw = new InternetGateway(this, 'secondary-igw', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      tags: { ...commonTags, Name: `${config.appName}-secondary-igw` },
    });

    // NAT Gateway - Secondary (Commented out to avoid EIP limit)
    // const secondaryNatEip = new Eip(this, 'secondary-nat-eip', {
    //   provider: secondaryProvider,
    //   domain: 'vpc',
    //   tags: { ...commonTags, Name: `${config.appName}-secondary-nat-eip` },
    // });

    // const secondaryNatGateway = new NatGateway(this, 'secondary-nat-gateway', {
    //   provider: secondaryProvider,
    //   allocationId: secondaryNatEip.id,
    //   subnetId: secondaryPublicSubnet1.id,
    //   tags: { ...commonTags, Name: `${config.appName}-secondary-nat` },
    // });

    // Route Tables - Secondary
    const secondaryPublicRt = new RouteTable(this, 'secondary-public-rt', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      tags: { ...commonTags, Name: `${config.appName}-secondary-public-rt` },
    });

    new Route(this, 'secondary-public-route', {
      provider: secondaryProvider,
      routeTableId: secondaryPublicRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: secondaryIgw.id,
    });

    new RouteTableAssociation(this, 'secondary-public-rta-1', {
      provider: secondaryProvider,
      subnetId: secondaryPublicSubnet1.id,
      routeTableId: secondaryPublicRt.id,
    });

    new RouteTableAssociation(this, 'secondary-public-rta-2', {
      provider: secondaryProvider,
      subnetId: secondaryPublicSubnet2.id,
      routeTableId: secondaryPublicRt.id,
    });

    const secondaryPrivateRt = new RouteTable(this, 'secondary-private-rt', {
      provider: secondaryProvider,
      vpcId: secondaryVpc.id,
      tags: { ...commonTags, Name: `${config.appName}-secondary-private-rt` },
    });

    // Secondary private route commented out due to NAT gateway removal
    // new Route(this, 'secondary-private-route', {
    //   provider: secondaryProvider,
    //   routeTableId: secondaryPrivateRt.id,
    //   destinationCidrBlock: '0.0.0.0/0',
    //   natGatewayId: secondaryNatGateway.id,
    // });

    new RouteTableAssociation(this, 'secondary-private-rta-1', {
      provider: secondaryProvider,
      subnetId: secondaryPrivateSubnet1.id,
      routeTableId: secondaryPrivateRt.id,
    });

    new RouteTableAssociation(this, 'secondary-private-rta-2', {
      provider: secondaryProvider,
      subnetId: secondaryPrivateSubnet2.id,
      routeTableId: secondaryPrivateRt.id,
    });

    // Security Groups
    const appSecurityGroup = new SecurityGroup(this, 'app-security-group', {
      provider: primaryProvider,
      name: `${config.appName}-app-sg`,
      description: 'Security group for financial processor application',
      vpcId: primaryVpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS traffic',
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP traffic for health checks',
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
      tags: { ...commonTags, Name: `${config.appName}-app-sg` },
    });

    const secondaryAppSecurityGroup = new SecurityGroup(
      this,
      'secondary-app-security-group',
      {
        provider: secondaryProvider,
        name: `${config.appName}-app-sg`,
        description: 'Security group for financial processor application',
        vpcId: secondaryVpc.id,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS traffic',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP traffic for health checks',
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
        tags: { ...commonTags, Name: `${config.appName}-app-sg` },
      }
    );

    // DynamoDB Global Tables
    const transactionTable = new DynamodbTable(this, 'transaction-table', {
      provider: primaryProvider,
      name: `${config.appName}-transactions-${uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'transactionId',
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
        kmsKeyArn: primaryKmsKey.arn,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      replica: [
        {
          regionName: config.secondaryRegion,
          kmsKeyArn: secondaryKmsKey.arn,
          pointInTimeRecovery: true,
        },
      ],
      tags: commonTags,
    });

    // S3 Buckets with Cross-Region Replication
    const primaryBucket = new S3Bucket(this, 'primary-bucket', {
      provider: primaryProvider,
      bucket: `${config.appName}-primary-${Math.random().toString(36).substring(7)}`,
      tags: commonTags,
    });

    const secondaryBucket = new S3Bucket(this, 'secondary-bucket', {
      provider: secondaryProvider,
      bucket: `${config.appName}-secondary-${Math.random().toString(36).substring(7)}`,
      tags: commonTags,
    });

    // S3 Bucket Versioning
    new S3BucketVersioningA(this, 'primary-bucket-versioning', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketVersioningA(this, 'secondary-bucket-versioning', {
      provider: secondaryProvider,
      bucket: secondaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 Bucket Encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'primary-bucket-encryption',
      {
        provider: primaryProvider,
        bucket: primaryBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: primaryKmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
          },
        ],
      }
    );

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'secondary-bucket-encryption',
      {
        provider: secondaryProvider,
        bucket: secondaryBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: secondaryKmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
          },
        ],
      }
    );

    // S3 Public Access Block
    new S3BucketPublicAccessBlock(this, 'primary-bucket-pab', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketPublicAccessBlock(this, 'secondary-bucket-pab', {
      provider: secondaryProvider,
      bucket: secondaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // IAM Role for S3 Replication
    const replicationRole = new IamRole(this, 's3-replication-role', {
      provider: primaryProvider,
      name: `${config.appName}-s3-replication-role-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 's3.amazonaws.com',
            },
          },
        ],
      }),
      tags: commonTags,
    });

    const replicationPolicy = new IamPolicy(this, 's3-replication-policy', {
      provider: primaryProvider,
      name: `${config.appName}-s3-replication-policy-${uniqueSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: `${primaryBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: primaryBucket.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: `${secondaryBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: primaryKmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:GenerateDataKey'],
            Resource: secondaryKmsKey.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 's3-replication-policy-attachment', {
      provider: primaryProvider,
      role: replicationRole.name,
      policyArn: replicationPolicy.arn,
    });

    // S3 Cross-Region Replication
    new S3BucketReplicationConfigurationA(this, 'primary-bucket-replication', {
      provider: primaryProvider,
      role: replicationRole.arn,
      bucket: primaryBucket.id,
      rule: [
        {
          id: 'ReplicateToSecondary',
          status: 'Enabled',
          priority: 1,
          filter: {
            prefix: '',
          },
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          destination: {
            bucket: secondaryBucket.arn,
            storageClass: 'STANDARD_IA',
            replicationTime: {
              status: 'Enabled',
              time: {
                minutes: 15,
              },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: {
                minutes: 15,
              },
            },
            encryptionConfiguration: {
              replicaKmsKeyId: secondaryKmsKey.arn,
            },
          },
          sourceSelectionCriteria: {
            sseKmsEncryptedObjects: {
              status: 'Enabled',
            },
          },
        },
      ],
    });

    // Application Load Balancers
    const primaryAlb = new Lb(this, 'primary-alb', {
      provider: primaryProvider,
      name: `finp-pri-${uniqueSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [appSecurityGroup.id],
      subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
      enableDeletionProtection: false,
      tags: commonTags,
    });

    const secondaryAlb = new Lb(this, 'secondary-alb', {
      provider: secondaryProvider,
      name: `finp-sec-${uniqueSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [secondaryAppSecurityGroup.id],
      subnets: [secondaryPublicSubnet1.id, secondaryPublicSubnet2.id],
      enableDeletionProtection: false,
      tags: commonTags,
    });

    // Target Groups
    const primaryTargetGroup = new LbTargetGroup(this, 'primary-target-group', {
      provider: primaryProvider,
      name: `finp-pri-tg-${uniqueSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: primaryVpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200',
        path: '/health',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: commonTags,
    });

    const secondaryTargetGroup = new LbTargetGroup(
      this,
      'secondary-target-group',
      {
        provider: secondaryProvider,
        name: `finp-sec-tg-${uniqueSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: secondaryVpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/health',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: commonTags,
      }
    );

    // ALB Listeners
    new LbListener(this, 'primary-alb-listener', {
      provider: primaryProvider,
      loadBalancerArn: primaryAlb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: primaryTargetGroup.arn,
        },
      ],
    });

    new LbListener(this, 'secondary-alb-listener', {
      provider: secondaryProvider,
      loadBalancerArn: secondaryAlb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: secondaryTargetGroup.arn,
        },
      ],
    });

    // Route53 Hosted Zone
    const hostedZone = new Route53Zone(this, 'hosted-zone', {
      provider: primaryProvider,
      name: config.domainName,
      tags: commonTags,
    });

    // Route53 Health Checks
    const primaryHealthCheck = new Route53HealthCheck(
      this,
      'primary-health-check',
      {
        provider: primaryProvider,
        fqdn: primaryAlb.dnsName,
        port: 80,
        type: 'HTTP',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: { ...commonTags, Name: `${config.appName}-primary-health-check` },
      }
    );

    const secondaryHealthCheck = new Route53HealthCheck(
      this,
      'secondary-health-check',
      {
        provider: primaryProvider,
        fqdn: secondaryAlb.dnsName,
        port: 80,
        type: 'HTTP',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          ...commonTags,
          Name: `${config.appName}-secondary-health-check`,
        },
      }
    );

    // Route53 DNS Records with Failover
    new Route53Record(this, 'primary-dns-record', {
      provider: primaryProvider,
      zoneId: hostedZone.zoneId,
      name: config.domainName,
      type: 'A',
      setIdentifier: 'primary',
      failoverRoutingPolicy: {
        type: 'PRIMARY',
      },
      healthCheckId: primaryHealthCheck.id,
      alias: {
        name: primaryAlb.dnsName,
        zoneId: primaryAlb.zoneId,
        evaluateTargetHealth: true,
      },
    });

    new Route53Record(this, 'secondary-dns-record', {
      provider: primaryProvider,
      zoneId: hostedZone.zoneId,
      name: config.domainName,
      type: 'A',
      setIdentifier: 'secondary',
      failoverRoutingPolicy: {
        type: 'SECONDARY',
      },
      healthCheckId: secondaryHealthCheck.id,
      alias: {
        name: secondaryAlb.dnsName,
        zoneId: secondaryAlb.zoneId,
        evaluateTargetHealth: true,
      },
    });

    // Lambda Execution Role
    const lambdaExecutionRole = new IamRole(this, 'lambda-execution-role', {
      provider: primaryProvider,
      name: `${config.appName}-lambda-execution-role-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      provider: primaryProvider,
      role: lambdaExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    const lambdaRoute53Policy = new IamPolicy(this, 'lambda-route53-policy', {
      provider: primaryProvider,
      name: `${config.appName}-lambda-route53-policy-${uniqueSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'route53:GetHealthCheck',
              'route53:ListHealthChecks',
              'route53:ChangeResourceRecordSets',
              'route53:GetChange',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-route53-policy-attachment', {
      provider: primaryProvider,
      role: lambdaExecutionRole.name,
      policyArn: lambdaRoute53Policy.arn,
    });

    // Health Check Lambda Function - using minimal dummy ZIP
    // Note: In production, this would reference a proper deployment package
    const healthCheckLambda = new LambdaFunction(this, 'health-check-lambda', {
      provider: primaryProvider,
      functionName: `${config.appName}-health-check`,
      role: lambdaExecutionRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      timeout: 300,
      filename: '../../../lib/lambda-placeholder.zip', // Path relative to cdktf.out/stacks/financial-processor
      sourceCodeHash: 'placeholder-hash-' + Date.now(),
      environment: {
        variables: {
          HOSTED_ZONE_ID: hostedZone.zoneId,
          DOMAIN_NAME: config.domainName,
          PRIMARY_HEALTH_CHECK_ID: primaryHealthCheck.id,
          SECONDARY_HEALTH_CHECK_ID: secondaryHealthCheck.id,
        },
      },
      tags: commonTags,
    });

    // CloudWatch Event Rule for Health Check Monitoring
    const healthCheckEventRule = new CloudwatchEventRule(
      this,
      'health-check-event-rule',
      {
        provider: primaryProvider,
        name: `${config.appName}-health-check-rule`,
        description: 'Trigger health check lambda every 2 minutes',
        scheduleExpression: 'rate(2 minutes)',
        state: 'ENABLED',
        tags: commonTags,
      }
    );

    new CloudwatchEventTarget(this, 'health-check-event-target', {
      provider: primaryProvider,
      rule: healthCheckEventRule.name,
      targetId: 'HealthCheckLambdaTarget',
      arn: healthCheckLambda.arn,
    });

    new LambdaPermission(this, 'allow-eventbridge-invoke-lambda', {
      provider: primaryProvider,
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: healthCheckLambda.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: healthCheckEventRule.arn,
    });

    // CloudWatch Log Groups
    // CloudWatch Log Groups (without KMS encryption to avoid permission issues)
    new CloudwatchLogGroup(this, 'primary-app-logs', {
      provider: primaryProvider,
      name: `/aws/application/${config.appName}/primary-${uniqueSuffix}`,
      retentionInDays: 30,
      tags: commonTags,
    });

    new CloudwatchLogGroup(this, 'secondary-app-logs', {
      provider: secondaryProvider,
      name: `/aws/application/${config.appName}/secondary-${uniqueSuffix}`,
      retentionInDays: 30,
      tags: commonTags,
    });

    new CloudwatchLogGroup(this, 'lambda-logs', {
      provider: primaryProvider,
      name: `/aws/lambda/${config.appName}-health-check-${uniqueSuffix}`,
      retentionInDays: 14,
      tags: commonTags,
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'primary-health-alarm', {
      provider: primaryProvider,
      alarmName: `${config.appName}-primary-health-alarm`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HealthCheckStatus',
      namespace: 'AWS/Route53',
      period: 60,
      statistic: 'Minimum',
      threshold: 1,
      alarmDescription: 'Primary region health check failed',
      dimensions: {
        HealthCheckId: primaryHealthCheck.id,
      },
      treatMissingData: 'breaching',
      tags: commonTags,
    });

    new CloudwatchMetricAlarm(this, 'secondary-health-alarm', {
      provider: primaryProvider,
      alarmName: `${config.appName}-secondary-health-alarm`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HealthCheckStatus',
      namespace: 'AWS/Route53',
      period: 60,
      statistic: 'Minimum',
      threshold: 1,
      alarmDescription: 'Secondary region health check failed',
      dimensions: {
        HealthCheckId: secondaryHealthCheck.id,
      },
      treatMissingData: 'breaching',
      tags: commonTags,
    });

    // Outputs
    new TerraformOutput(this, 'primary-vpc-id', {
      value: primaryVpc.id,
      description: 'Primary VPC ID',
    });

    new TerraformOutput(this, 'secondary-vpc-id', {
      value: secondaryVpc.id,
      description: 'Secondary VPC ID',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: transactionTable.name,
      description: 'DynamoDB Global Table name',
    });

    new TerraformOutput(this, 'primary-s3-bucket', {
      value: primaryBucket.bucket,
      description: 'Primary S3 bucket name',
    });

    new TerraformOutput(this, 'secondary-s3-bucket', {
      value: secondaryBucket.bucket,
      description: 'Secondary S3 bucket name',
    });

    new TerraformOutput(this, 'primary-alb-dns', {
      value: primaryAlb.dnsName,
      description: 'Primary ALB DNS name',
    });

    new TerraformOutput(this, 'secondary-alb-dns', {
      value: secondaryAlb.dnsName,
      description: 'Secondary ALB DNS name',
    });

    new TerraformOutput(this, 'route53-zone-id', {
      value: hostedZone.zoneId,
      description: 'Route53 hosted zone ID',
    });

    new TerraformOutput(this, 'domain-name', {
      value: config.domainName,
      description: 'Application domain name',
    });
  }
}
