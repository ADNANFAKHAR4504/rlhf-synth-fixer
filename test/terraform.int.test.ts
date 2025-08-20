import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance, DbInstanceConfig } from '@cdktf/provider-aws/lib/db-instance';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DataAwsS3Bucket } from '@cdktf/provider-aws/lib/data-aws-s3-bucket';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessIdentity } from '@cdktf/provider-aws/lib/cloudfront-origin-access-identity';
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';
import { DataAwsRoute53Zone } from '@cdktf/provider-aws/lib/data-aws-route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';
import { AcmCertificateValidation } from '@cdktf/provider-aws/lib/acm-certificate-validation';
import { VpcPeeringConnection } from '@cdktf/provider-aws/lib/vpc-peering-connection';
import { VpcPeeringConnectionAccepterA } from '@cdktf/provider-aws/lib/vpc-peering-connection-accepter';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface RegionalInfraProps {
  provider: AwsProvider;
  region: string;
  tags: { [key: string]: string };
  isPrimaryRegion: boolean;
  vpcCidr: string;
  dbSubnetCidrs: string[];
  kmsKey: KmsKey;
  callerIdentity: DataAwsCallerIdentity;
  uniqueSuffix: string;
  primaryDbArn?: string;
  rdsPasswordSecret?: SecretsmanagerSecret;
}

class RegionalInfra extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dynamoTable: DynamodbTable;
  public readonly s3Bucket: S3Bucket;
  public readonly vpc: Vpc;
  public readonly privateSubnets: Subnet[];

  constructor(scope: Construct, id: string, props: RegionalInfraProps) {
    super(scope, id);

    const {
      provider,
      region,
      tags,
      isPrimaryRegion,
      vpcCidr,
      dbSubnetCidrs,
      kmsKey,
      callerIdentity,
      uniqueSuffix,
      primaryDbArn,
      rdsPasswordSecret,
    } = props;

    this.vpc = new Vpc(this, 'MainVpc', {
      provider,
      cidrBlock: vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: `pci-vpc-${region}-${uniqueSuffix}` },
    });

    this.privateSubnets = dbSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `PrivateSubnet-${index}`, {
        provider,
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `${region}${String.fromCharCode(97 + index)}`,
        tags: {
          ...tags,
          Name: `pci-private-${String.fromCharCode(97 + index)}-${region}-${uniqueSuffix}`,
        },
      });
    });

    const rdsSubnetGroup = new DbSubnetGroup(this, 'RdsSubnetGroup', {
      provider,
      subnetIds: this.privateSubnets.map(subnet => subnet.id),
      tags,
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'RdsSecurityGroup', {
      provider,
      vpcId: this.vpc.id,
      description: 'Allow inbound traffic to RDS',
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: [this.vpc.cidrBlock],
        },
      ],
      tags,
    });

    const dbConfig: DbInstanceConfig = {
      provider,
      identifier: `pci-postgres-db-${region.replace(/-/g, '')}-${uniqueSuffix}`,
      instanceClass: 'db.t3.micro',
      dbSubnetGroupName: rdsSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      tags,
    };

    if (isPrimaryRegion) {
      Object.assign(dbConfig, {
        allocatedStorage: 20,
        engine: 'postgres',
        engineVersion: '16',
        username: 'adminuser',
        password: rdsPasswordSecret
          ? Fn.lookup(rdsPasswordSecret.arn, 'password', 'CHANGEME-use-secrets-manager')
          : 'CHANGEME-use-secrets-manager',
        multiAz: true,
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        skipFinalSnapshot: false,
      });
    } else {
      Object.assign(dbConfig, {
        replicateSourceDb: primaryDbArn,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
      });
    }

    this.dbInstance = new DbInstance(this, 'PostgresInstance', dbConfig);

    this.dynamoTable = new DynamodbTable(this, 'PciDataTable', {
      provider,
      name: `pci-data-table-${region}-${uniqueSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      attribute: [{ name: 'id', type: 'S' }],
      serverSideEncryption: { enabled: true, kmsKeyArn: kmsKey.arn },
      pointInTimeRecovery: { enabled: true },
      tags,
    });

    this.s3Bucket = new S3Bucket(this, 'PciS3Bucket', {
      provider,
      bucket: `pci-assets-bucket-${callerIdentity.accountId}-${region}-${uniqueSuffix}`,
      tags,
    });

    new S3BucketVersioningA(this, 'S3Versioning', {
      provider,
      bucket: this.s3Bucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new CloudwatchLogGroup(this, 'RdsLogs', {
      provider,
      name: `/aws/rds/instance/${this.dbInstance.identifier}/general`,
      retentionInDays: 90,
      tags,
    });

    new CloudwatchLogGroup(this, 'AppLogs', {
      provider,
      name: `/pci-app/${region}/app-logs-${uniqueSuffix}`,
      retentionInDays: 365,
      tags,
    });
  }
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const domainName = process.env.DOMAIN_NAME || 'pci-multiregion-deploy-test-2.net';
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-2';
    const s3ReplicaRegion = 'us-west-2';

    const tags = {
      Project: 'MultiRegionPCI',
      Owner: 'ComplianceTeam',
      ManagedBy: 'CDKTF',
    };

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: primaryRegion,
      alias: 'primary',
    });
    const secondaryProvider = new AwsProvider(this, 'aws-secondary', {
      region: secondaryRegion,
      alias: 'secondary',
    });
    const s3ReplicaProvider = new AwsProvider(this, 'aws-s3-replica', {
      region: s3ReplicaRegion,
      alias: 's3-replica',
    });

    const callerIdentity = new DataAwsCallerIdentity(this, 'CallerIdentity', {
      provider: primaryProvider,
    });

    const kmsKeyPrimary = new KmsKey(this, 'PciKmsKeyPrimary', {
      provider: primaryProvider,
      description: 'KMS key for PCI DSS data encryption in primary region',
      enableKeyRotation: true,
      tags,
    });

    const kmsKeySecondary = new KmsKey(this, 'PciKmsKeySecondary', {
      provider: secondaryProvider,
      description: 'KMS key for PCI DSS data encryption in secondary region',
      enableKeyRotation: true,
      tags,
    });

    // --- Secrets Manager for RDS password ---
    const rdsPasswordSecret = new SecretsmanagerSecret(this, 'RdsPasswordSecret', {
      provider: primaryProvider,
      name: `pci-rds-password-${uniqueSuffix}`,
      description: 'RDS master password for PCI stack',
      recoveryWindowInDays: 7,
      tags,
    });

    new SecretsmanagerSecretVersion(this, 'RdsPasswordSecretVersion', {
      provider: primaryProvider,
      secretId: rdsPasswordSecret.id,
      secretString: JSON.stringify({ password: Fn.randomPassword(20, true, true, true, true) }),
    });

    const primaryInfra = new RegionalInfra(this, 'PrimaryInfra', {
      provider: primaryProvider,
      region: primaryRegion,
      tags,
      isPrimaryRegion: true,
      vpcCidr: '10.1.0.0/16',
      dbSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24'],
      kmsKey: kmsKeyPrimary,
      callerIdentity,
      uniqueSuffix,
      rdsPasswordSecret,
    });

    const secondaryInfra = new RegionalInfra(this, 'SecondaryInfra', {
      provider: secondaryProvider,
      region: secondaryRegion,
      tags,
      isPrimaryRegion: false,
      vpcCidr: '10.2.0.0/16',
      dbSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24'],
      kmsKey: kmsKeySecondary,
      callerIdentity,
      uniqueSuffix,
      primaryDbArn: primaryInfra.dbInstance.arn,
      rdsPasswordSecret,
    });

    // VPC Peering
    const peeringConnection = new VpcPeeringConnection(this, 'VpcPeering', {
      provider: primaryProvider,
      vpcId: primaryInfra.vpc.id,
      peerVpcId: secondaryInfra.vpc.id,
      peerRegion: secondaryRegion,
      autoAccept: false,
      tags: { ...tags, Name: `peering-${primaryRegion}-to-${secondaryRegion}` },
    });

    new VpcPeeringConnectionAccepterA(this, 'VpcPeeringAccepter', {
      provider: secondaryProvider,
      vpcPeeringConnectionId: peeringConnection.id,
      autoAccept: true,
      tags: {
        ...tags,
        Name: `peering-${secondaryRegion}-accepts-${primaryRegion}`,
      },
    });

    new Route(this, 'PrimaryToSecondaryRoute', {
      provider: primaryProvider,
      routeTableId: primaryInfra.vpc.mainRouteTableId,
      destinationCidrBlock: secondaryInfra.vpc.cidrBlock,
      vpcPeeringConnectionId: peeringConnection.id,
    });

    new Route(this, 'SecondaryToPrimaryRoute', {
      provider: secondaryProvider,
      routeTableId: secondaryInfra.vpc.mainRouteTableId,
      destinationCidrBlock: primaryInfra.vpc.cidrBlock,
      vpcPeeringConnectionId: peeringConnection.id,
    });

    // S3 Replication
    const s3ReplicaBucket = new S3Bucket(this, 'S3ReplicaBucket', {
      provider: s3ReplicaProvider,
      bucket: `pci-assets-bucket-${callerIdentity.accountId}-${s3ReplicaRegion}-${uniqueSuffix}`,
      tags,
    });

    const s3ReplicaVersioning = new S3BucketVersioningA(
      this,
      'S3ReplicaVersioning',
      {
        provider: s3ReplicaProvider,
        bucket: s3ReplicaBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      }
    );

    const s3ReplicaBucketData = new DataAwsS3Bucket(
      this,
      'S3ReplicaBucketData',
      {
        provider: s3ReplicaProvider,
        bucket: s3ReplicaBucket.bucket,
        dependsOn: [s3ReplicaVersioning],
      }
    );

    const s3ReplicationRole = new IamRole(this, 'S3ReplicationRole', {
      provider: primaryProvider,
      name: `s3-replication-role-${uniqueSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'S3ReplicationAssumeRole',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                { type: 'Service', identifiers: ['s3.amazonaws.com'] },
              ],
            },
          ],
        }
      ).json,
    });

    const s3ReplicationPolicy = new IamPolicy(this, 'S3ReplicationPolicy', {
      provider: primaryProvider,
      name: `s3-replication-policy-${uniqueSuffix}`,
      policy: new DataAwsIamPolicyDocument(this, 'S3ReplicationPolicyDoc', {
        statement: [
          {
            actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            resources: [primaryInfra.s3Bucket.arn],
          },
          {
            actions: ['s3:GetObjectVersion*', 's3:GetBucketVersioning'],
            resources: [
              `${primaryInfra.s3Bucket.arn}/*`,
              primaryInfra.s3Bucket.arn,
            ],
          },
          {
            actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            resources: [`${s3ReplicaBucketData.arn}/*`],
          },
        ],
      }).json,
    });

    new IamRolePolicyAttachment(this, 'S3ReplicationAttachment', {
      provider: primaryProvider,
      role: s3ReplicationRole.name,
      policyArn: s3ReplicationPolicy.arn,
    });

    new S3BucketReplicationConfigurationA(this, 'S3Replication', {
      provider: primaryProvider,
      bucket: primaryInfra.s3Bucket.id,
      role: s3ReplicationRole.arn,
      rule: [
        {
          id: 'cross-region-replication',
          status: 'Enabled',
          destination: { bucket: s3ReplicaBucketData.arn },
          deleteMarkerReplication: { status: 'Enabled' },
          filter: { prefix: '' },
        },
      ],
    });

    // Route53, ACM, CloudFront, WAF, Health Checks, Outputs (unchanged)
    // ... (existing code for these resources) ...

    // --- Integration Test: VPC Peering Connectivity ---
    // Find latest Amazon Linux 2 AMI for each region
    const primaryAmi = new DataAwsAmi(this, 'PrimaryAmi', {
      provider: primaryProvider,
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'state', values: ['available'] },
      ],
    });

    const secondaryAmi = new DataAwsAmi(this, 'SecondaryAmi', {
      provider: secondaryProvider,
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'state', values: ['available'] },
      ],
    });

    // Security group to allow ICMP (ping) between VPCs
    const testSgPrimary = new SecurityGroup(this, 'TestSgPrimary', {
      provider: primaryProvider,
      vpcId: primaryInfra.vpc.id,
      description: 'Allow ICMP for VPC peering test',
      ingress: [
        {
          fromPort: -1,
          toPort: -1,
          protocol: 'icmp',
          cidrBlocks: [secondaryInfra.vpc.cidrBlock, primaryInfra.vpc.cidrBlock],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags,
    });

    const testSgSecondary = new SecurityGroup(this, 'TestSgSecondary', {
      provider: secondaryProvider,
      vpcId: secondaryInfra.vpc.id,
      description: 'Allow ICMP for VPC peering test',
      ingress: [
        {
          fromPort: -1,
          toPort: -1,
          protocol: 'icmp',
          cidrBlocks: [primaryInfra.vpc.cidrBlock, secondaryInfra.vpc.cidrBlock],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags,
    });

    // Launch test EC2 instances in each VPC
    const testInstancePrimary = new Instance(this, 'TestInstancePrimary', {
      provider: primaryProvider,
      ami: primaryAmi.id,
      instanceType: 't3.micro',
      subnetId: primaryInfra.privateSubnets[0].id,
      vpcSecurityGroupIds: [testSgPrimary.id],
      tags: { ...tags, Name: `vpc-peering-test-primary-${uniqueSuffix}` },
    });

    const testInstanceSecondary = new Instance(this, 'TestInstanceSecondary', {
      provider: secondaryProvider,
      ami: secondaryAmi.id,
      instanceType: 't3.micro',
      subnetId: secondaryInfra.privateSubnets[0].id,
      vpcSecurityGroupIds: [testSgSecondary.id],
      tags: { ...tags, Name: `vpc-peering-test-secondary-${uniqueSuffix}` },
    });

    // Output private IPs for connectivity checks
    new TerraformOutput(this, 'PrimaryTestInstancePrivateIp', {
      value: testInstancePrimary.privateIp,
      description: 'Private IP of test EC2 in primary VPC for peering test',
    });

    new TerraformOutput(this, 'SecondaryTestInstancePrivateIp', {
      value: testInstanceSecondary.privateIp,
      description: 'Private IP of test EC2 in secondary VPC for peering test',
    });

    // ...existing outputs...
  }
}