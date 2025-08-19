import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DynamodbGlobalTable } from '@cdktf/provider-aws/lib/dynamodb-global-table';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning-a';
import { S3BucketReplicationConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsAccountId } from '@cdktf/provider-aws/lib/data-aws-account-id';

// --- Reusable Regional Construct ---
interface RegionalInfraProps {
provider: AwsProvider;
region: string;
tags: { [key: string]: string };
isPrimaryRegion: boolean;
primaryDbIdentifier?: string; // For creating read replicas
}

class RegionalInfraConstruct extends Construct {
public readonly dbInstance: DbInstance;
public readonly dynamoTable: DynamodbTable;

constructor(scope: Construct, id: string, props: RegionalInfraProps) {
super(scope, id);

    const { provider, region, tags, isPrimaryRegion, primaryDbIdentifier } = props;

    // VPC
    const vpc = new Vpc(this, 'Vpc', {
      provider,
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: `vpc-${region}` },
    });

    // Subnets for HA
    const dbSubnet1 = new Subnet(this, 'DbSubnet1', {
      provider,
      vpcId: vpc.id,
      cidrBlock: '10.0.100.0/24',
      availabilityZone: `${region}a`,
      tags: { ...tags, Name: `dbsubnet-a-${region}` },
    });
    const dbSubnet2 = new Subnet(this, 'DbSubnet2', {
      provider,
      vpcId: vpc.id,
      cidrBlock: '10.0.101.0/24',
      availabilityZone: `${region}b`,
      tags: { ...tags, Name: `dbsubnet-b-${region}` },
    });

    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      provider,
      name: `db-subnet-group-${region}`,
      subnetIds: [dbSubnet1.id, dbSubnet2.id],
      tags,
    });

    // RDS PostgreSQL
    this.dbInstance = new DbInstance(this, 'PostgresDb', {
      provider,
      engine: 'postgres',
      engineVersion: '14',
      instanceClass: 'db.t3.small',
      allocatedStorage: 20,
      identifier: isPrimaryRegion ? `primary-db-${region}` : undefined,
      replicateSourceDb: isPrimaryRegion ? undefined : primaryDbIdentifier,
      dbSubnetGroupName: dbSubnetGroup.name,
      username: 'dbadmin',
      password: `changeme-in-secrets-manager-${Fn.randomid({ byteLength: 8 })}`,
      multiAz: true,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      skipFinalSnapshot: !isPrimaryRegion,
      tags,
    });

    // DynamoDB Table
    this.dynamoTable = new DynamodbTable(this, 'DynamoTable', {
      provider,
      name: `pci-data-table-${region}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'ID',
      attribute: [{ name: 'ID', type: 'S' }],
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      serverSideEncryption: { enabled: true },
      tags,
    });

    // CloudWatch Log Group
    new CloudwatchLogGroup(this, 'AppLogGroup', {
      provider,
      name: `/pci-app/${region}/app-logs`,
      retentionInDays: 365,
      tags,
    });

}
}

// --- Main PCI Compliant Stack ---
class MultiRegionPciStack extends TerraformStack {
constructor(scope: Construct, id: string, domainName: string) {
super(scope, id);

    const commonTags = {
      Project: 'PCIDemo',
      Environment: 'Prod',
      Owner: 'SecurityTeam',
    };

    // --- Providers for Each Region ---
    const usEast1Provider = new AwsProvider(this, 'aws-us-east-1', { region: 'us-east-1', alias: 'us-east-1' });
    const usWest2Provider = new AwsProvider(this, 'aws-us-west-2', { region: 'us-west-2', alias: 'us-west-2' });
    const euWest1Provider = new AwsProvider(this, 'aws-eu-west-1', { region: 'eu-west-1', alias: 'eu-west-1' });

    const accountId = new DataAwsAccountId(this, 'CurrentAccount', { provider: usEast1Provider });

    // --- Global Resources (managed in us-east-1) ---
    // IAM Role for S3 Replication
    const s3RepRole = new IamRole(this, 'S3ReplicationRole', {
      provider: usEast1Provider,
      name: 'S3ReplicationRole',
      assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'S3RepAssumePolicy', {
        statement: [{ actions: ['sts:AssumeRole'], principals: [{ type: 'Service', identifiers: ['s3.amazonaws.com'] }] }],
      }).json,
    });

    // Route 53 Hosted Zone
    const zone = new Route53Zone(this, 'HostedZone', {
      provider: usEast1Provider,
      name: domainName,
    });

    // ACM Certificate for CloudFront (must be in us-east-1)
    const cert = new AcmCertificate(this, 'AcmCert', {
      provider: usEast1Provider,
      domainName: domainName,
      validationMethod: 'DNS',
    });

    // S3 Buckets
    const s3Primary = new S3Bucket(this, 'S3Primary', {
      provider: usEast1Provider,
      bucket: `pci-primary-assets-${accountId.accountId}`,
      tags: { ...commonTags, Region: 'us-east-1' },
    });
    new S3BucketVersioningA(this, 'S3PrimaryVersioning', { provider: usEast1Provider, bucket: s3Primary.id, versioningConfiguration: { status: 'Enabled' } });

    const s3Replica = new S3Bucket(this, 'S3Replica', {
      provider: euWest1Provider,
      bucket: `pci-replica-assets-${accountId.accountId}`,
      tags: { ...commonTags, Region: 'eu-west-1' },
    });
    new S3BucketVersioningA(this, 'S3ReplicaVersioning', { provider: euWest1Provider, bucket: s3Replica.id, versioningConfiguration: { status: 'Enabled' } });

    new S3BucketReplicationConfiguration(this, 'S3Replication', {
      provider: usEast1Provider,
      dependsOn: [s3RepRole],
      role: s3RepRole.arn,
      bucket: s3Primary.id,
      rule: [{
        id: 'cross-region-replication',
        status: 'Enabled',
        destination: { bucket: s3Replica.arn },
      }],
    });

    // WAF for CloudFront
    const webAcl = new Wafv2WebAcl(this, 'WebAcl', {
      provider: usEast1Provider,
      name: 'cloudfront-waf',
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'cloudfront-waf',
        sampledRequestsEnabled: true,
      },
      rule: [{
        name: 'AWS-Managed-CommonRuleSet',
        priority: 1,
        overrideAction: { none: {} },
        statement: {
          managedRuleGroupStatement: {
            vendorName: 'AWS',
            name: 'AWSManagedRulesCommonRuleSet',
          },
        },
        visibilityConfig: {
            cloudwatchMetricsEnabled: true,
            metricName: 'aws-common-rules',
            sampledRequestsEnabled: true,
        },
      }],
    });

    // CloudFront Distribution
    const distribution = new CloudfrontDistribution(this, 'Cloudfront', {
      provider: usEast1Provider,
      enabled: true,
      origins: [{
        domainName: s3Primary.bucketRegionalDomainName,
        originId: s3Primary.id,
      }],
      defaultCacheBehavior: {
        targetOriginId: s3Primary.id,
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
        forwardedValues: { queryString: false, cookies: { forward: 'none' } },
      },
      viewerCertificate: {
        acmCertificateArn: cert.arn,
        sslSupportMethod: 'sni-only',
      },
      webAclId: webAcl.arn,
      tags: commonTags,
    });

    // --- Regional Deployments ---
    const usEast1Infra = new RegionalInfraConstruct(this, 'us-east-1-infra', {
      provider: usEast1Provider,
      region: 'us-east-1',
      tags: commonTags,
      isPrimaryRegion: true,
    });

    const usWest2Infra = new RegionalInfraConstruct(this, 'us-west-2-infra', {
      provider: usWest2Provider,
      region: 'us-west-2',
      tags: commonTags,
      isPrimaryRegion: false,
      primaryDbIdentifier: usEast1Infra.dbInstance.identifier,
    });

    // --- DynamoDB Global Table ---
    new DynamodbGlobalTable(this, 'GlobalTable', {
      provider: usEast1Provider,
      name: 'pci-global-data-table',
      replica: [
        { regionName: usEast1Infra.dynamoTable.region },
        { regionName: usWest2Infra.dynamoTable.region },
      ],
      dependsOn: [usEast1Infra.dynamoTable, usWest2Infra.dynamoTable],
    });

    // --- Route 53 Records for Latency-Based Routing ---
    // In a real app, these would point to ALBs in each region. Here, we point to the RDS instances as placeholders.
    new Route53Record(this, 'LatencyRecordEast', {
      provider: usEast1Provider,
      zoneId: zone.id,
      name: `db.${domainName}`,
      type: 'CNAME',
      ttl: 300,
      records: [usEast1Infra.dbInstance.address],
      latencyRoutingPolicy: { region: 'us-east-1' },
      setIdentifier: 'us-east-1-db',
    });

    new Route53Record(this, 'LatencyRecordWest', {
      provider: usEast1Provider,
      zoneId: zone.id,
      name: `db.${domainName}`,
      type: 'CNAME',
      ttl: 300,
      records: [usWest2Infra.dbInstance.address],
      latencyRoutingPolicy: { region: 'us-west-2' },
      setIdentifier: 'us-west-2-db',
    });

    new Route53Record(this, 'CloudfrontRecord', {
        provider: usEast1Provider,
        zoneId: zone.id,
        name: domainName,
        type: 'A',
        alias: {
            name: distribution.domainName,
            zoneId: distribution.hostedZoneId,
            evaluateTargetHealth: true,
        },
    });

}
}
