import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { Password } from '@cdktf/provider-random/lib/password';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

export interface RegionConfig {
  readonly region: string;
  readonly vpcCidr: string;
  readonly publicSubnetCidr: string;
  readonly privateSubnetCidr: string;
  readonly dbSubnetACidr: string;
  readonly dbSubnetBCidr: string;
  readonly azA: string;
  readonly azB: string;
}

export interface StackConfig {
  readonly commonTags: { [key: string]: string };
  readonly regions: RegionConfig[];
}

export class MultiRegionSecurityStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: StackConfig) {
    super(scope, id);

    new RandomProvider(this, 'random');

    const providers = new Map<string, AwsProvider>();
    for (const regionConfig of config.regions) {
      providers.set(
        regionConfig.region,
        new AwsProvider(this, `aws-provider-${regionConfig.region}`, {
          region: regionConfig.region,
          alias: regionConfig.region,
        })
      );
    }

    const centralProvider = providers.get('us-east-1')!;
    if (!centralProvider) {
      throw new Error(
        'A provider for the us-east-1 region is required for central resources.'
      );
    }
    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    const kmsKeys = new Map<string, KmsKey>();
    for (const regionConfig of config.regions) {
      const key = new KmsKey(this, `KmsKey-${regionConfig.region}`, {
        provider: providers.get(regionConfig.region)!,
        description: `KMS key for SecureCore resources in ${regionConfig.region}`,
        enableKeyRotation: true,
        tags: { ...config.commonTags, Region: regionConfig.region },
      });
      kmsKeys.set(regionConfig.region, key);
    }
    const centralKmsKey = kmsKeys.get('us-east-1')!;

    const centralLogBucket = new S3Bucket(this, 'CentralLogBucket', {
      provider: centralProvider,
      bucket: `securecore-central-logs-${uniqueSuffix}`,
      tags: {
        ...config.commonTags,
        Region: 'us-east-1',
        Name: 'central-log-bucket',
      },
    });

    new S3BucketVersioningA(this, 'CentralLogBucketVersioning', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketLifecycleConfiguration(
      this,
      'CentralLogBucketLifecycleConfig',
      {
        provider: centralProvider,
        bucket: centralLogBucket.id,
        rule: [
          {
            id: 'log-management-rule',
            status: 'Enabled',
            // FIX: Added explicit filter to apply the rule to all objects.
            filter: [
              {
                prefix: '',
              },
            ],
            transition: [
              {
                days: 90,
                storageClass: 'STANDARD_IA',
              },
            ],
            expiration: [
              {
                days: 365,
              },
            ],
            noncurrentVersionExpiration: [
              {
                noncurrentDays: 30,
              },
            ],
          },
        ],
      }
    );

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'CentralLogBucketEncryption',
      {
        provider: centralProvider,
        bucket: centralLogBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: centralKmsKey.id,
            },
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'CentralLogBucketPublicAccess', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLoggingA(this, 'CentralLogBucketLogging', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      targetBucket: centralLogBucket.id,
      targetPrefix: 'log-bucket-access/',
    });

    new S3BucketPolicy(this, 'CentralLogBucketPolicy', {
      provider: centralProvider,
      bucket: centralLogBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSLogDeliveryWrite',
            Effect: 'Allow',
            Principal: { Service: 'delivery.logs.amazonaws.com' },
            Action: 's3:PutObject',
            Resource: `${centralLogBucket.arn}/*`,
            Condition: {
              StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
            },
          },
          {
            Sid: 'AWSLogDeliveryAclCheck',
            Effect: 'Allow',
            Principal: { Service: 'delivery.logs.amazonaws.com' },
            Action: 's3:GetBucketAcl',
            Resource: centralLogBucket.arn,
          },
          {
            Sid: 'DenyInsecureTransport',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: `${centralLogBucket.arn}/*`,
            Condition: { Bool: { 'aws:SecureTransport': 'false' } },
          },
        ],
      }),
    });

    const appServiceRole = new IamRole(this, 'AppServiceRole', {
      provider: centralProvider,
      name: `secure-core-app-service-role-${uniqueSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });

    const appServicePolicy = new IamPolicy(this, 'AppServicePolicy', {
      provider: centralProvider,
      name: `secure-core-app-service-policy-${uniqueSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 's3:GetObject',
            Effect: 'Allow',
            Resource: `${centralLogBucket.arn}/app-config/*`,
          },
          {
            Action: [
              'ssmmessages:CreateControlChannel',
              'ssmmessages:CreateDataChannel',
              'ssmmessages:OpenControlChannel',
              'ssmmessages:OpenDataChannel',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'AppServicePolicyAttachment', {
      provider: centralProvider,
      role: appServiceRole.name,
      policyArn: appServicePolicy.arn,
    });

    for (const regionConfig of config.regions) {
      const regionProvider = providers.get(regionConfig.region)!;
      const regionKmsKey = kmsKeys.get(regionConfig.region)!;
      const tags = { ...config.commonTags, Region: regionConfig.region };

      const vpc = new Vpc(this, `VPC-${regionConfig.region}`, {
        provider: regionProvider,
        cidrBlock: regionConfig.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${regionConfig.region}` },
      });
      const igw = new InternetGateway(this, `IGW-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        tags: { ...tags, Name: `igw-${regionConfig.region}` },
      });
      const publicSubnet = new Subnet(
        this,
        `PublicSubnet-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          cidrBlock: regionConfig.publicSubnetCidr,
          availabilityZone: regionConfig.azA,
          mapPublicIpOnLaunch: false,
          tags: { ...tags, Name: `public-subnet-${regionConfig.region}` },
        }
      );
      const eip = new Eip(this, `EIP-${regionConfig.region}`, {
        provider: regionProvider,
        domain: 'vpc',
      });
      const natGateway = new NatGateway(this, `NAT-${regionConfig.region}`, {
        provider: regionProvider,
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { ...tags, Name: `nat-${regionConfig.region}` },
        dependsOn: [igw],
      });
      const privateSubnet = new Subnet(
        this,
        `PrivateSubnet-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          cidrBlock: regionConfig.privateSubnetCidr,
          availabilityZone: regionConfig.azA,
          mapPublicIpOnLaunch: false,
          tags: { ...tags, Name: `private-subnet-${regionConfig.region}` },
        }
      );
      const dbSubnetA = new Subnet(this, `DbSubnetA-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        cidrBlock: regionConfig.dbSubnetACidr,
        availabilityZone: regionConfig.azA,
        mapPublicIpOnLaunch: false,
        tags: { ...tags, Name: `db-subnet-a-${regionConfig.region}` },
      });
      const dbSubnetB = new Subnet(this, `DbSubnetB-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        cidrBlock: regionConfig.dbSubnetBCidr,
        availabilityZone: regionConfig.azB,
        mapPublicIpOnLaunch: false,
        tags: { ...tags, Name: `db-subnet-b-${regionConfig.region}` },
      });
      const publicRouteTable = new RouteTable(
        this,
        `PublicRT-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          tags: { ...tags, Name: `public-rt-${regionConfig.region}` },
        }
      );
      new Route(this, `PublicRoute-${regionConfig.region}`, {
        provider: regionProvider,
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      });
      new RouteTableAssociation(this, `PublicRTA-${regionConfig.region}`, {
        provider: regionProvider,
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });
      const privateRouteTable = new RouteTable(
        this,
        `PrivateRT-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          tags: { ...tags, Name: `private-rt-${regionConfig.region}` },
        }
      );
      new Route(this, `PrivateRoute-${regionConfig.region}`, {
        provider: regionProvider,
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });
      new RouteTableAssociation(this, `PrivateRTA-${regionConfig.region}`, {
        provider: regionProvider,
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
      const dbRouteTable = new RouteTable(this, `DbRT-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        tags: { ...tags, Name: `db-rt-${regionConfig.region}` },
      });
      new RouteTableAssociation(this, `DbRTAA-${regionConfig.region}`, {
        provider: regionProvider,
        subnetId: dbSubnetA.id,
        routeTableId: dbRouteTable.id,
      });
      new RouteTableAssociation(this, `DbRTAB-${regionConfig.region}`, {
        provider: regionProvider,
        subnetId: dbSubnetB.id,
        routeTableId: dbRouteTable.id,
      });
      const appSg = new SecurityGroup(this, `AppSG-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        name: `app-sg-${regionConfig.region}-${uniqueSuffix}`,
        description:
          'Security group for application workloads. Allows all outbound traffic.',
        tags: { ...tags, Name: `app-sg-${regionConfig.region}` },
        egress: [
          { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
        ],
      });
      const dbSg = new SecurityGroup(this, `DbSG-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        name: `db-sg-${regionConfig.region}-${uniqueSuffix}`,
        description:
          'Allows inbound PostgreSQL traffic (TCP/5432) only from the application security group.',
        tags: { ...tags, Name: `db-sg-${regionConfig.region}` },
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [appSg.id],
          },
        ],
      });
      const privateNacl = new NetworkAcl(
        this,
        `PrivateNACL-${regionConfig.region}`,
        {
          provider: regionProvider,
          vpcId: vpc.id,
          subnetIds: [privateSubnet.id, dbSubnetA.id, dbSubnetB.id],
          tags: { ...tags, Name: `private-nacl-${regionConfig.region}` },
        }
      );
      new NetworkAclRule(
        this,
        `PrivateNaclInboundAllowInternal-${regionConfig.region}`,
        {
          provider: regionProvider,
          networkAclId: privateNacl.id,
          ruleNumber: 100,
          egress: false,
          protocol: '-1',
          ruleAction: 'allow',
          cidrBlock: vpc.cidrBlock,
          fromPort: 0,
          toPort: 0,
        }
      );
      new NetworkAclRule(
        this,
        `PrivateNaclOutboundAllowInternal-${regionConfig.region}`,
        {
          provider: regionProvider,
          networkAclId: privateNacl.id,
          ruleNumber: 100,
          egress: true,
          protocol: '-1',
          ruleAction: 'allow',
          cidrBlock: vpc.cidrBlock,
          fromPort: 0,
          toPort: 0,
        }
      );
      new FlowLog(this, `FlowLog-${regionConfig.region}`, {
        provider: regionProvider,
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: centralLogBucket.arn,
        tags: { ...tags, Name: `flow-log-${regionConfig.region}` },
      });
      const dbPassword = new Password(
        this,
        `DBPassword-${regionConfig.region}`,
        { length: 16, special: true, overrideSpecial: '_-.' }
      );
      const dbSecret = new SecretsmanagerSecret(
        this,
        `DBSecret-${regionConfig.region}`,
        {
          provider: regionProvider,
          name: `prod/rds/master_password/${regionConfig.region}-${uniqueSuffix}`,
          tags: { ...tags, Name: `db-secret-${regionConfig.region}` },
        }
      );

      new SecretsmanagerSecretVersion(
        this,
        `DBSecretVersion-${regionConfig.region}`,
        {
          provider: regionProvider,
          secretId: dbSecret.id,
          secretString: JSON.stringify({
            username: 'dbadmin',
            password: dbPassword.result,
          }),
        }
      );

      const dbSubnetGroup = new DbSubnetGroup(
        this,
        `DbSubnetGroup-${regionConfig.region}`,
        {
          provider: regionProvider,
          name: `db-subnet-group-${regionConfig.region}-${uniqueSuffix}`,
          subnetIds: [dbSubnetA.id, dbSubnetB.id],
          tags: { ...tags, Name: `db-subnet-group-${regionConfig.region}` },
        }
      );

      new DbInstance(this, `DB-${regionConfig.region}`, {
        provider: regionProvider,
        identifier: `app-db-${regionConfig.region}-${uniqueSuffix}`,
        engine: 'postgres',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        multiAz: true,
        storageEncrypted: true,
        kmsKeyId: regionKmsKey.arn,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSg.id],
        // FIX: Provide the username directly for provisioning.
        username: 'dbadmin',
        // FIX: Provide the password directly from the random resource.
        password: dbPassword.result,
        skipFinalSnapshot: true,
        tags: { ...tags, Name: `app-db-${regionConfig.region}` },
      });
    }
  }
}
