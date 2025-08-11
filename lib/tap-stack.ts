import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { IResolvable, S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { Compute } from './compute';
import { Database } from './database';
import { Dns } from './dns';
import { Monitoring } from './monitoring';
import { SecureVpc } from './secure-vpc';
import { Security } from './security';

export interface TapStackProps {
  environment?: string;
  project?: string;
  owner?: string;
  costCenter?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  dynamoLockTable?: string;
  primaryRegion?: string;
  secondaryRegion?: string;
  environmentSuffix?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

function toProviderDefaultTagsArray(
  tags: AwsProviderDefaultTags | undefined
): IResolvable | AwsProviderDefaultTags[] | undefined {
  if (!tags) return undefined;
  return [tags];
}

/** Case-insensitive merge to avoid IAM “Duplicate tag keys” */
function mergeTagsCaseInsensitive(
  base: Record<string, string>,
  extra?: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) out[k.toLowerCase()] = v;
  if (extra) {
    for (const [k, v] of Object.entries(extra)) out[k.toLowerCase()] = v;
  }
  return out;
}

export class TapStack extends TerraformStack {
  public readonly primary: AwsProvider;
  public readonly secondary: AwsProvider;
  public readonly environment: string;

  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id);

    // ---- Workspace / env naming ----
    const environment =
      props.environment ??
      props.environmentSuffix ??
      process.env.CDKTF_WORKSPACE ??
      process.env.TF_WORKSPACE ??
      process.env.ENVIRONMENT_SUFFIX ??
      'dev';
    this.environment = environment;

    // ---- Tag context (normalized to lowercase keys) ----
    const project = props.project ?? process.env.PROJECT ?? 'multi-region-app';
    const owner = props.owner ?? process.env.OWNER ?? 'DevOps Team';
    const costCenter =
      props.costCenter ?? process.env.COST_CENTER ?? 'Engineering';

    const mergedLowerTags = mergeTagsCaseInsensitive(
      {
        environment,
        project,
        owner,
        cost_center: costCenter,
        managedby: 'cdktf',
      },
      props.defaultTags?.tags
    );

    const mergedDefaultTags: AwsProviderDefaultTags = { tags: mergedLowerTags };

    // ---- Provider constraints ----
    this.addOverride('terraform.required_version', '>= 1.6');
    this.addOverride('terraform.required_providers.aws', {
      source: 'hashicorp/aws',
      version: '~> 5.0',
    });

    // ---- Regions ----
    const primaryRegion =
      props.primaryRegion || process.env.AWS_REGION_PRIMARY || 'us-east-1';
    const secondaryRegion =
      props.secondaryRegion || process.env.AWS_REGION_SECONDARY || 'eu-west-1';

    // Providers
    this.primary = new AwsProvider(this, 'awsPrimary', {
      region: primaryRegion,
      alias: 'primary',
      defaultTags: toProviderDefaultTagsArray(mergedDefaultTags),
    });

    this.secondary = new AwsProvider(this, 'awsSecondary', {
      region: secondaryRegion,
      alias: 'secondary',
      defaultTags: toProviderDefaultTagsArray(mergedDefaultTags),
    });

    // Random provider
    new RandomProvider(this, 'random', {});

    // ---- Remote state (S3 + optional DynamoDB lock) ----
    const stateBucket =
      props.stateBucket ||
      process.env.TERRAFORM_STATE_BUCKET ||
      'iac-rlhf-tf-states';
    const stateBucketRegion =
      props.stateBucketRegion ||
      process.env.TERRAFORM_STATE_BUCKET_REGION ||
      'us-east-1';
    const dynamoLockTable = props.dynamoLockTable || process.env.TF_LOCK_TABLE;

    new S3Backend(this, {
      bucket: stateBucket,
      key: `infrastructure/${environment}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    if (dynamoLockTable && dynamoLockTable.trim().length > 0) {
      this.addOverride('terraform.backend.s3.dynamodb_table', dynamoLockTable);
    }

    // ---- Sanity outputs ----
    new TerraformOutput(this, 'workspace', { value: environment });
    new TerraformOutput(this, 'primary_region', { value: primaryRegion });
    new TerraformOutput(this, 'secondary_region', { value: secondaryRegion });

    // ---- Secure VPCs ----
    const vpcCidrPrimary = process.env.VPC_CIDR_PRIMARY || '10.0.0.0/16';
    const vpcCidrSecondary = process.env.VPC_CIDR_SECONDARY || '10.1.0.0/16';
    const azCount = parseInt(process.env.AZ_COUNT || '2', 10);
    const natPerAz = process.env.NAT_PER_AZ === 'true';

    const primaryVpc = new SecureVpc(this, 'PrimaryVpc', {
      provider: this.primary,
      environment: this.environment,
      region: primaryRegion,
      vpcCidr: vpcCidrPrimary,
      azCount,
      natPerAz,
    });

    const secondaryVpc = new SecureVpc(this, 'SecondaryVpc', {
      provider: this.secondary,
      environment: this.environment,
      region: secondaryRegion,
      vpcCidr: vpcCidrSecondary,
      azCount,
      natPerAz,
    });

    new TerraformOutput(this, 'primary_vpc_id', { value: primaryVpc.vpcId });
    new TerraformOutput(this, 'secondary_vpc_id', {
      value: secondaryVpc.vpcId,
    });

    // ---- Security (SGs) ----
    const adminCidr = process.env.ADMIN_CIDR || '';
    const appPort = parseInt(process.env.APP_PORT || '80', 10);
    const enableSshToApp = process.env.ENABLE_SSH_TO_APP === 'true';

    const primarySec = new Security(this, 'PrimarySecurity', {
      provider: this.primary,
      environment: this.environment,
      region: primaryRegion,
      vpcId: primaryVpc.vpcId,
      adminCidr,
      appPort,
      enableSshToApp,
    });

    const secondarySec = new Security(this, 'SecondarySecurity', {
      provider: this.secondary,
      environment: this.environment,
      region: secondaryRegion,
      vpcId: secondaryVpc.vpcId,
      adminCidr,
      appPort,
      enableSshToApp,
    });

    // ---- Compute (ALB/ASG) ----
    const primaryCompute = new Compute(this, 'PrimaryCompute', {
      provider: this.primary,
      environment: this.environment,
      region: primaryRegion,
      vpcId: primaryVpc.vpcId,
      publicSubnets: primaryVpc.publicSubnetIds,
      privateSubnets: primaryVpc.privateSubnetIds,
      albSgId: primarySec.albSgId,
      appSgId: primarySec.appSgId,
      instanceType: 't3.micro',
      acmCertArn: process.env.ACM_CERT_ARN || '',
    });

    const secondaryCompute = new Compute(this, 'SecondaryCompute', {
      provider: this.secondary,
      environment: this.environment,
      region: secondaryRegion,
      vpcId: secondaryVpc.vpcId,
      publicSubnets: secondaryVpc.publicSubnetIds,
      privateSubnets: secondaryVpc.privateSubnetIds,
      albSgId: secondarySec.albSgId,
      appSgId: secondarySec.appSgId,
      instanceType: 't3.micro',
      acmCertArn: process.env.ACM_CERT_ARN_SECONDARY || '',
    });

    // ---- Database (RDS + Secrets) ----
    const primaryDb = new Database(this, 'PrimaryDatabase', {
      provider: this.primary,
      environment: this.environment,
      region: primaryRegion,
      privateSubnets: primaryVpc.privateSubnetIds,
      rdsSgId: primarySec.rdsSgId,
    });

    const secondaryDb = new Database(this, 'SecondaryDatabase', {
      provider: this.secondary,
      environment: this.environment,
      region: secondaryRegion,
      privateSubnets: secondaryVpc.privateSubnetIds,
      rdsSgId: secondarySec.rdsSgId,
    });

    // ---- Monitoring ----
    new Monitoring(this, 'PrimaryMonitoring', {
      provider: this.primary,
      environment: this.environment,
      asgName: primaryCompute.asgName,
      dbIdentifier: primaryDb.dbIdentifier,
    });

    new Monitoring(this, 'SecondaryMonitoring', {
      provider: this.secondary,
      environment: this.environment,
      asgName: secondaryCompute.asgName,
      dbIdentifier: secondaryDb.dbIdentifier,
    });

    // ---- DNS (optional) ----
    const hostedZoneId = process.env.DNS_HOSTED_ZONE_ID || '';
    const recordName = process.env.DNS_RECORD_NAME || '';
    if (hostedZoneId && recordName) {
      const primaryAlbZoneId = (primaryCompute as any).alb?.zoneId;
      const secondaryAlbZoneId = (secondaryCompute as any).alb?.zoneId;

      new Dns(this, 'LatencyDns', {
        hostedZoneId,
        recordName,
        primaryAlbDns: primaryCompute.albDns,
        primaryAlbZoneId,
        secondaryAlbDns: secondaryCompute.albDns,
        secondaryAlbZoneId,
        healthCheckPath: process.env.DNS_HEALTHCHECK_PATH || '/',
        primaryProvider: this.primary,
        secondaryProvider: this.secondary,
        environment: this.environment,
      });
    }
  }
}
