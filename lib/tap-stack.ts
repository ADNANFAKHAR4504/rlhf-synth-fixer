// lib/tap-stack.ts
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
  // New props
  environment?: string;
  project?: string;
  owner?: string;
  costCenter?: string;

  stateBucket?: string;
  stateBucketRegion?: string;
  dynamoLockTable?: string;

  primaryRegion?: string; // default: us-east-1
  secondaryRegion?: string; // default: eu-west-1

  // Back-compat props
  environmentSuffix?: string; // legacy alias for environment
  awsRegion?: string; // legacy single-region (ignored)
  defaultTags?: AwsProviderDefaultTags; // legacy provider default tags
}

function toProviderDefaultTagsArray(
  tags: AwsProviderDefaultTags | undefined
): IResolvable | AwsProviderDefaultTags[] | undefined {
  if (!tags) return undefined;
  return [tags];
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

    // ---- Tag context (provider default tags) ----
    const project = props.project ?? process.env.PROJECT ?? 'multi-region-app';
    const owner = props.owner ?? process.env.OWNER ?? 'DevOps Team';
    const costCenter =
      props.costCenter ?? process.env.COST_CENTER ?? 'Engineering';

    const baseTagMap: Record<string, string> = {
      environment,
      project,
      owner,
      cost_center: costCenter,
      ManagedBy: 'CDKTF',
      ...(props.defaultTags?.tags ?? {}),
    };
    const mergedDefaultTags: AwsProviderDefaultTags = { tags: baseTagMap };

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

    // Primary & Secondary AWS providers
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

    // Random provider (for generating passwords, etc.)
    new RandomProvider(this, 'random', {});

    // ---- Remote state (S3 + DynamoDB lock) ----
    const stateBucket =
      props.stateBucket ||
      process.env.TERRAFORM_STATE_BUCKET ||
      'iac-rlhf-tf-states';
    const stateBucketRegion =
      props.stateBucketRegion ||
      process.env.TERRAFORM_STATE_BUCKET_REGION ||
      'us-east-1';
    const dynamoLockTable =
      props.dynamoLockTable || process.env.TF_LOCK_TABLE || 'iac-rlhf-tf-locks';

    new S3Backend(this, {
      bucket: stateBucket,
      key: `infrastructure/${environment}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.dynamodb_table', dynamoLockTable);

    // ---- Quick sanity outputs ----
    new TerraformOutput(this, 'workspace', { value: environment });
    new TerraformOutput(this, 'primary_region', { value: primaryRegion });
    new TerraformOutput(this, 'secondary_region', { value: secondaryRegion });

    // ---- Secure VPCs in both regions ----
    const vpcCidrPrimary = process.env.VPC_CIDR_PRIMARY || '10.0.0.0/16';
    const vpcCidrSecondary = process.env.VPC_CIDR_SECONDARY || '10.1.0.0/16';
    const azCount = parseInt(process.env.AZ_COUNT || '2', 10);
    const natPerAz =
      process.env.NAT_PER_AZ === 'true'
        ? true
        : process.env.NAT_PER_AZ === 'false'
          ? false
          : this.environment === 'prod';

    const primaryVpc = new SecureVpc(this, 'PrimaryVpc', {
      provider: this.primary,
      environment: this.environment,
      region: (this as any).primary['region'] || 'us-east-1',
      vpcCidr: vpcCidrPrimary,
      azCount,
      natPerAz,
    });

    const secondaryVpc = new SecureVpc(this, 'SecondaryVpc', {
      provider: this.secondary,
      environment: this.environment,
      region: (this as any).secondary['region'] || 'eu-west-1',
      vpcCidr: vpcCidrSecondary,
      azCount,
      natPerAz,
    });

    new TerraformOutput(this, 'primary_vpc_id', { value: primaryVpc.vpcId });
    new TerraformOutput(this, 'primary_public_subnets', {
      value: primaryVpc.publicSubnetIds,
    });
    new TerraformOutput(this, 'primary_private_subnets', {
      value: primaryVpc.privateSubnetIds,
    });

    new TerraformOutput(this, 'secondary_vpc_id', {
      value: secondaryVpc.vpcId,
    });
    new TerraformOutput(this, 'secondary_public_subnets', {
      value: secondaryVpc.publicSubnetIds,
    });
    new TerraformOutput(this, 'secondary_private_subnets', {
      value: secondaryVpc.privateSubnetIds,
    });

    // ---- Security (SGs) for both regions ----
    const adminCidr = process.env.ADMIN_CIDR || ''; // e.g., "203.0.113.0/24"
    const appPort = parseInt(process.env.APP_PORT || '80', 10);
    const enableSshToApp = process.env.ENABLE_SSH_TO_APP === 'true';

    const primarySec = new Security(this, 'PrimarySecurity', {
      provider: this.primary,
      environment: this.environment,
      region: (this as any).primary['region'] || 'us-east-1',
      vpcId: primaryVpc.vpcId,
      adminCidr,
      appPort,
      enableSshToApp,
    });

    const secondarySec = new Security(this, 'SecondarySecurity', {
      provider: this.secondary,
      environment: this.environment,
      region: (this as any).secondary['region'] || 'eu-west-1',
      vpcId: secondaryVpc.vpcId,
      adminCidr,
      appPort,
      enableSshToApp,
    });

    new TerraformOutput(this, 'primary_alb_sg', { value: primarySec.albSgId });
    new TerraformOutput(this, 'primary_app_sg', { value: primarySec.appSgId });
    new TerraformOutput(this, 'primary_rds_sg', { value: primarySec.rdsSgId });

    new TerraformOutput(this, 'secondary_alb_sg', {
      value: secondarySec.albSgId,
    });
    new TerraformOutput(this, 'secondary_app_sg', {
      value: secondarySec.appSgId,
    });
    new TerraformOutput(this, 'secondary_rds_sg', {
      value: secondarySec.rdsSgId,
    });

    // ---- Compute (ALB/ASG) both regions ----
    const primaryCompute = new Compute(this, 'PrimaryCompute', {
      provider: this.primary,
      environment: this.environment,
      region: (this as any).primary['region'] || 'us-east-1',
      vpcId: primaryVpc.vpcId,
      publicSubnets: primaryVpc.publicSubnetIds,
      privateSubnets: primaryVpc.privateSubnetIds,
      albSgId: primarySec.albSgId,
      appSgId: primarySec.appSgId,
      instanceType: 't3.micro',
      acmCertArn:
        process.env.ACM_CERT_ARN ||
        'arn:aws:acm:us-east-1:123456789012:certificate/placeholder',
    });

    new TerraformOutput(this, 'primary_alb_dns', {
      value: primaryCompute.albDns,
    });
    new TerraformOutput(this, 'primary_asg_name', {
      value: primaryCompute.asgName,
    });

    const secondaryCompute = new Compute(this, 'SecondaryCompute', {
      provider: this.secondary,
      environment: this.environment,
      region: (this as any).secondary['region'] || 'eu-west-1',
      vpcId: secondaryVpc.vpcId,
      publicSubnets: secondaryVpc.publicSubnetIds,
      privateSubnets: secondaryVpc.privateSubnetIds,
      albSgId: secondarySec.albSgId,
      appSgId: secondarySec.appSgId,
      instanceType: 't3.micro',
      acmCertArn:
        process.env.ACM_CERT_ARN_SECONDARY ||
        'arn:aws:acm:eu-west-1:123456789012:certificate/placeholder',
    });

    new TerraformOutput(this, 'secondary_alb_dns', {
      value: secondaryCompute.albDns,
    });
    new TerraformOutput(this, 'secondary_asg_name', {
      value: secondaryCompute.asgName,
    });

    // ---- DNS (Route53 Latency) ----
    const hostedZoneId = process.env.DNS_HOSTED_ZONE_ID || ''; // REQUIRED
    const recordName = process.env.DNS_RECORD_NAME || ''; // REQUIRED, e.g., "app.example.com"

    if (hostedZoneId && recordName) {
      // We need each ALB's hosted zone ID. CDKTF aws_lb exposes "zoneId".
      // Access via the L2 object properties (same construct scope).
      const primaryAlbZoneId =
        (primaryCompute as any).alb?.zoneId ??
        (primaryCompute as any).node?.children?.alb?.zoneId;
      const secondaryAlbZoneId =
        (secondaryCompute as any).alb?.zoneId ??
        (secondaryCompute as any).node?.children?.alb?.zoneId;

      new Dns(this, 'LatencyDns', {
        hostedZoneId,
        recordName,
        primaryAlbDns: primaryCompute.albDns,
        primaryAlbZoneId: primaryAlbZoneId,
        secondaryAlbDns: secondaryCompute.albDns,
        secondaryAlbZoneId: secondaryAlbZoneId,
        healthCheckPath: process.env.DNS_HEALTHCHECK_PATH || '/',
        primaryProvider: this.primary,
        secondaryProvider: this.secondary,
        environment: this.environment,
      });
    }

    // ---- Database (RDS + Secrets) both regions ----
    const primaryDb = new Database(this, 'PrimaryDatabase', {
      provider: this.primary,
      environment: this.environment,
      region: (this as any).primary['region'] || 'us-east-1',
      privateSubnets: primaryVpc.privateSubnetIds,
      rdsSgId: primarySec.rdsSgId,
    });

    new TerraformOutput(this, 'primary_db_endpoint', {
      value: primaryDb.endpoint,
    });
    new TerraformOutput(this, 'primary_db_secret', {
      value: primaryDb.secretArn,
    });

    const secondaryDb = new Database(this, 'SecondaryDatabase', {
      provider: this.secondary,
      environment: this.environment,
      region: (this as any).secondary['region'] || 'eu-west-1',
      privateSubnets: secondaryVpc.privateSubnetIds,
      rdsSgId: secondarySec.rdsSgId,
    });

    new TerraformOutput(this, 'secondary_db_endpoint', {
      value: secondaryDb.endpoint,
    });
    new TerraformOutput(this, 'secondary_db_secret', {
      value: secondaryDb.secretArn,
    });

    // ---- Monitoring (CW alarms, logs, SNS) both regions ----
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
  }
}
