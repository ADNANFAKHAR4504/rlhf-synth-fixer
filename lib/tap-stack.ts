import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import {
  DbInstance,
  DbInstanceConfig,
} from '@cdktf/provider-aws/lib/db-instance';
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
// FIX: Corrected the import name from VpcPeeringConnectionAccepter to VpcPeeringConnectionAccepterA
import { VpcPeeringConnectionAccepterA } from '@cdktf/provider-aws/lib/vpc-peering-connection-accepter';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';

// LocalStack detection: Check for LocalStack endpoint in environment
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK_ENDPOINT !== undefined;

// --- Reusable Regional Construct ---
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
}

class RegionalInfra extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dynamoTable: DynamodbTable;
  public readonly s3Bucket: S3Bucket;
  public readonly vpc: Vpc;

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
    } = props;

    this.vpc = new Vpc(this, 'MainVpc', {
      provider,
      cidrBlock: vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: `pci-vpc-${region}-${uniqueSuffix}` },
    });

    const privateSubnets = dbSubnetCidrs.map((cidr, index) => {
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
      subnetIds: privateSubnets.map(subnet => subnet.id),
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
        password: 'CHANGEME-use-secrets-manager',
        multiAz: !isLocalStack,
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        skipFinalSnapshot: isLocalStack,
      });
    } else if (!isLocalStack) {
      // Cross-region RDS replication not supported in LocalStack Community
      Object.assign(dbConfig, {
        replicateSourceDb: primaryDbArn,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
      });
    } else {
      // For LocalStack: Create independent DB in secondary region
      Object.assign(dbConfig, {
        allocatedStorage: 20,
        engine: 'postgres',
        engineVersion: '16',
        username: 'adminuser',
        password: 'CHANGEME-use-secrets-manager',
        multiAz: false,
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        skipFinalSnapshot: true,
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

    const domainName = 'pci-multiregion-deploy-test-2.net';
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-2';
    const s3ReplicaRegion = 'eu-west-1';

    const tags = {
      Project: 'MultiRegionPCI',
      Owner: 'ComplianceTeam',
      ManagedBy: 'CDKTF',
    };

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // LocalStack endpoint configuration
    const localStackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

    const primaryProvider = isLocalStack
      ? new AwsProvider(this, 'aws-primary', {
          region: primaryRegion,
          alias: 'primary',
          accessKey: 'test',
          secretKey: 'test',
          skipCredentialsValidation: true,
          skipMetadataApiCheck: 'true',
          skipRequestingAccountId: true,
          s3UsePathStyle: true,
          endpoints: [{
            s3: localStackEndpoint,
            dynamodb: localStackEndpoint,
            rds: localStackEndpoint,
            kms: localStackEndpoint,
            cloudwatch: localStackEndpoint,
            iam: localStackEndpoint,
            sts: localStackEndpoint,
            ec2: localStackEndpoint,
            route53: localStackEndpoint,
            acm: localStackEndpoint,
          }],
        })
      : new AwsProvider(this, 'aws-primary', {
          region: primaryRegion,
          alias: 'primary',
        });

    const secondaryProvider = isLocalStack
      ? new AwsProvider(this, 'aws-secondary', {
          region: secondaryRegion,
          alias: 'secondary',
          accessKey: 'test',
          secretKey: 'test',
          skipCredentialsValidation: true,
          skipMetadataApiCheck: 'true',
          skipRequestingAccountId: true,
          s3UsePathStyle: true,
          endpoints: [{
            s3: localStackEndpoint,
            dynamodb: localStackEndpoint,
            rds: localStackEndpoint,
            kms: localStackEndpoint,
            cloudwatch: localStackEndpoint,
            iam: localStackEndpoint,
            sts: localStackEndpoint,
            ec2: localStackEndpoint,
            route53: localStackEndpoint,
            acm: localStackEndpoint,
          }],
        })
      : new AwsProvider(this, 'aws-secondary', {
          region: secondaryRegion,
          alias: 'secondary',
        });

    const s3ReplicaProvider = isLocalStack
      ? new AwsProvider(this, 'aws-s3-replica', {
          region: s3ReplicaRegion,
          alias: 's3-replica',
          accessKey: 'test',
          secretKey: 'test',
          skipCredentialsValidation: true,
          skipMetadataApiCheck: 'true',
          skipRequestingAccountId: true,
          s3UsePathStyle: true,
          endpoints: [{
            s3: localStackEndpoint,
            dynamodb: localStackEndpoint,
            rds: localStackEndpoint,
            kms: localStackEndpoint,
            cloudwatch: localStackEndpoint,
            iam: localStackEndpoint,
            sts: localStackEndpoint,
            ec2: localStackEndpoint,
            route53: localStackEndpoint,
            acm: localStackEndpoint,
          }],
        })
      : new AwsProvider(this, 'aws-s3-replica', {
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
    });

    // VPC Peering - simplified for LocalStack
    let peeringConnection: VpcPeeringConnection | undefined;
    if (!isLocalStack) {
      peeringConnection = new VpcPeeringConnection(this, 'VpcPeering', {
        provider: primaryProvider,
        vpcId: primaryInfra.vpc.id,
        peerVpcId: secondaryInfra.vpc.id,
        peerRegion: secondaryRegion,
        autoAccept: false,
        tags: { ...tags, Name: `peering-${primaryRegion}-to-${secondaryRegion}` },
      });

      // FIX: Corrected the class name from VpcPeeringConnectionAccepter to VpcPeeringConnectionAccepterA
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
    }

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

    // Pro-only services: Route53, ACM, CloudFront, WAF, Route53 HealthChecks
    // These are only created when NOT using LocalStack Community Edition
    let cfDistribution: CloudfrontDistribution | undefined;

    if (!isLocalStack) {
      const zone = new DataAwsRoute53Zone(this, 'DnsZoneLookup', {
        provider: primaryProvider,
        name: domainName,
      });

      const certificate = new AcmCertificate(this, 'AcmCert', {
        provider: primaryProvider,
        domainName: domainName,
        validationMethod: 'DNS',
        tags,
      });

      const dvo = certificate.domainValidationOptions.get(0);
      const certValidationRecord = new Route53Record(
        this,
        'CertValidationRecord',
        {
          provider: primaryProvider,
          zoneId: zone.zoneId,
          name: dvo.resourceRecordName,
          type: dvo.resourceRecordType,
          records: [dvo.resourceRecordValue],
          ttl: 60,
          allowOverwrite: true,
        }
      );

      const certificateValidation = new AcmCertificateValidation(
        this,
        'AcmCertificateValidation',
        {
          provider: primaryProvider,
          certificateArn: certificate.arn,
          validationRecordFqdns: [certValidationRecord.fqdn],
        }
      );

      certificateValidation.node.addDependency(certValidationRecord);

      const originAccessIdentity = new CloudfrontOriginAccessIdentity(
        this,
        'OAI',
        {
          provider: primaryProvider,
          comment: `OAI for PCI S3 bucket ${uniqueSuffix}`,
        }
      );

      new S3BucketPolicy(this, 'S3BucketPolicy', {
        provider: primaryProvider,
        bucket: primaryInfra.s3Bucket.id,
        policy: new DataAwsIamPolicyDocument(this, 'S3PolicyDoc', {
          statement: [
            {
              actions: ['s3:GetObject'],
              resources: [`${primaryInfra.s3Bucket.arn}/*`],
              principals: [
                {
                  type: 'AWS',
                  identifiers: [originAccessIdentity.iamArn],
                },
              ],
            },
          ],
        }).json,
      });

      const webAcl = new Wafv2WebAcl(this, 'WebAcl', {
        provider: primaryProvider,
        name: `pci-waf-acl-${uniqueSuffix}`,
        scope: 'CLOUDFRONT',
        defaultAction: { allow: {} },
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `pci-waf-acl-${uniqueSuffix}`,
          sampledRequestsEnabled: true,
        },
        rule: [
          {
            name: 'AWS-Managed-Rules-Common',
            priority: 1,
            overrideAction: { none: {} },
            statement: {
              managed_rule_group_statement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendor_name: 'AWS',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: `aws-common-rules-${uniqueSuffix}`,
              sampledRequestsEnabled: true,
            },
          },
        ] as any,
        tags,
      });

      cfDistribution = new CloudfrontDistribution(this, 'CfDistribution', {
        provider: primaryProvider,
        enabled: true,
        origin: [
          {
            originId: primaryInfra.s3Bucket.id,
            domainName: primaryInfra.s3Bucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity:
                originAccessIdentity.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: primaryInfra.s3Bucket.id,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          forwardedValues: {
            queryString: false,
            cookies: { forward: 'none' },
          },
        },
        viewerCertificate: {
          acmCertificateArn: certificateValidation.certificateArn,
          sslSupportMethod: 'sni-only',
        },
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        webAclId: webAcl.arn,
        tags,
      });

      const primaryDbHealthCheck = new Route53HealthCheck(
        this,
        'PrimaryDbHealthCheck',
        {
          provider: primaryProvider,
          fqdn: primaryInfra.dbInstance.address,
          port: 5432,
          type: 'TCP',
          failureThreshold: 3,
          requestInterval: 30,
          tags,
        }
      );

      const secondaryDbHealthCheck = new Route53HealthCheck(
        this,
        'SecondaryDbHealthCheck',
        {
          provider: primaryProvider,
          fqdn: secondaryInfra.dbInstance.address,
          port: 5432,
          type: 'TCP',
          failureThreshold: 3,
          requestInterval: 30,
          tags,
        }
      );

      new Route53Record(this, 'CloudfrontRecord', {
        provider: primaryProvider,
        zoneId: zone.zoneId,
        name: domainName,
        type: 'A',
        allowOverwrite: true,
        alias: {
          name: cfDistribution.domainName,
          zoneId: cfDistribution.hostedZoneId,
          evaluateTargetHealth: true,
        },
      });

      new Route53Record(this, 'LatencyRecordEast', {
        provider: primaryProvider,
        zoneId: zone.zoneId,
        name: `db.${domainName}`,
        type: 'CNAME',
        ttl: 300,
        records: [primaryInfra.dbInstance.address],
        latencyRoutingPolicy: { region: primaryRegion },
        setIdentifier: 'primary-db-us-east-1',
        allowOverwrite: true,
        healthCheckId: primaryDbHealthCheck.id,
      });

      new Route53Record(this, 'LatencyRecordWest', {
        provider: primaryProvider,
        zoneId: zone.zoneId,
        name: `db.${domainName}`,
        type: 'CNAME',
        ttl: 300,
        records: [secondaryInfra.dbInstance.address],
        latencyRoutingPolicy: { region: secondaryRegion },
        setIdentifier: 'secondary-db-us-west-2',
        allowOverwrite: true,
        healthCheckId: secondaryDbHealthCheck.id,
      });
    }

    new TerraformOutput(this, 'PrimaryRdsEndpoint', {
      value: primaryInfra.dbInstance.address,
    });
    new TerraformOutput(this, 'SecondaryRdsEndpoint', {
      value: secondaryInfra.dbInstance.address,
    });
    new TerraformOutput(this, 'DynamoDbTableName', {
      value: primaryInfra.dynamoTable.name,
    });
    new TerraformOutput(this, 'PrimaryS3BucketName', {
      value: primaryInfra.s3Bucket.bucket,
    });

    // CloudFront output only when not using LocalStack
    if (!isLocalStack && cfDistribution) {
      new TerraformOutput(this, 'CloudFrontDomain', {
        value: cfDistribution.domainName,
      });
    }
  }
}
