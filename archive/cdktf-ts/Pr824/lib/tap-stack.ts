import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
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
  hostedZoneId?: string; // Added for Dns
  recordName?: string; // Added for Dns
}

function toProviderDefaultTagsArray(
  tags: AwsProviderDefaultTags | undefined
): AwsProviderDefaultTags[] | undefined {
  if (!tags) return undefined;
  return [tags];
}

function mergeTagsCaseInsensitive(
  base: Record<string, string>,
  extra?: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(base)) out[k.toLowerCase()] = v;
  if (extra)
    for (const [k, v] of Object.entries(extra)) out[k.toLowerCase()] = v;
  return out;
}

export class TapStack extends TerraformStack {
  public readonly primary: AwsProvider;
  public readonly secondary: AwsProvider;
  public readonly environment: string;

  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id);

    const environment =
      props.environment ??
      props.environmentSuffix ??
      process.env.CDKTF_WORKSPACE ??
      process.env.TF_WORKSPACE ??
      process.env.ENVIRONMENT_SUFFIX ??
      'dev';
    this.environment = environment;

    const isPrEnv = /^pr\d+$/i.test(this.environment);

    const enableSecondary =
      !isPrEnv && (process.env.ENABLE_SECONDARY ?? 'true') !== 'false';
    const enableDatabase =
      !isPrEnv && (process.env.ENABLE_DATABASE ?? 'true') !== 'false';

    const project = props.project ?? process.env.PROJECT ?? 'multi-region-app';
    const owner = props.owner ?? process.env.OWNER ?? 'DevOps Team';
    const costCenter =
      props.costCenter ?? process.env.COST_CENTER ?? 'Engineering';

    const mergedDefaultTags: AwsProviderDefaultTags = {
      tags: mergeTagsCaseInsensitive(
        {
          environment,
          project,
          owner,
          cost_center: costCenter,
          managedby: 'cdktf',
        },
        props.defaultTags?.tags
      ),
    };

    this.addOverride('terraform.required_version', '>= 1.6');
    this.addOverride('terraform.required_providers.aws', {
      source: 'hashicorp/aws',
      version: '~> 5.0',
    });

    const primaryRegion =
      props.primaryRegion || process.env.AWS_REGION_PRIMARY || 'us-east-1';
    const secondaryRegion =
      props.secondaryRegion || process.env.AWS_REGION_SECONDARY || 'eu-west-1';

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

    new RandomProvider(this, 'random', {});

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
      dynamodbTable:
        dynamoLockTable && dynamoLockTable.trim().length > 0
          ? dynamoLockTable
          : undefined,
    });

    new TerraformOutput(this, 'workspace', { value: environment });
    new TerraformOutput(this, 'primary_region', { value: primaryRegion });
    new TerraformOutput(this, 'secondary_region', { value: secondaryRegion });

    const vpcCidrPrimary = process.env.VPC_CIDR_PRIMARY || '10.0.0.0/16';
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
    new TerraformOutput(this, 'primary_vpc_id', { value: primaryVpc.vpcId });

    let secondaryVpc: SecureVpc | undefined;
    if (enableSecondary) {
      const vpcCidrSecondary = process.env.VPC_CIDR_SECONDARY || '10.1.0.0/16';
      secondaryVpc = new SecureVpc(this, 'SecondaryVpc', {
        provider: this.secondary,
        environment: this.environment,
        region: secondaryRegion,
        vpcCidr: vpcCidrSecondary,
        azCount,
        natPerAz,
      });
      new TerraformOutput(this, 'secondary_vpc_id', {
        value: secondaryVpc.vpcId,
      });
    }

    const primarySec = new Security(this, 'PrimarySecurity', {
      provider: this.primary,
      environment: this.environment,
      region: primaryRegion,
      vpcId: primaryVpc.vpcId,
    });

    let secondarySec: Security | undefined;
    if (enableSecondary && secondaryVpc) {
      secondarySec = new Security(this, 'SecondarySecurity', {
        provider: this.secondary,
        environment: this.environment,
        region: secondaryRegion,
        vpcId: secondaryVpc.vpcId,
      });
    }

    const primaryCompute = new Compute(this, 'PrimaryCompute', {
      provider: this.primary,
      environment: this.environment,
      region: primaryRegion,
      vpcId: primaryVpc.vpcId,
      publicSubnets: primaryVpc.publicSubnetIds,
      privateSubnets: primaryVpc.privateSubnetIds,
      albSgId: primarySec.albSgId,
      appSgId: primarySec.appSgId,
    });

    let secondaryCompute: Compute | undefined;
    if (enableSecondary && secondaryVpc && secondarySec) {
      secondaryCompute = new Compute(this, 'SecondaryCompute', {
        provider: this.secondary,
        environment: this.environment,
        region: secondaryRegion,
        vpcId: secondaryVpc.vpcId,
        publicSubnets: secondaryVpc.publicSubnetIds,
        privateSubnets: secondaryVpc.privateSubnetIds,
        albSgId: secondarySec.albSgId,
        appSgId: secondarySec.appSgId,
      });
    }

    let primaryDb: Database | undefined;
    let secondaryDb: Database | undefined;

    if (enableDatabase) {
      primaryDb = new Database(this, 'PrimaryDatabase', {
        provider: this.primary,
        environment: this.environment,
        region: primaryRegion,
        privateSubnets: primaryVpc.privateSubnetIds,
        rdsSgId: primarySec.rdsSgId,
      });

      if (enableSecondary && secondaryVpc && secondarySec) {
        secondaryDb = new Database(this, 'SecondaryDatabase', {
          provider: this.secondary,
          environment: this.environment,
          region: secondaryRegion,
          privateSubnets: secondaryVpc.privateSubnetIds,
          rdsSgId: secondarySec.rdsSgId,
        });
      }

      new TerraformOutput(this, 'db_instance_id', {
        value: primaryDb.dbIdentifier,
      });

      new TerraformOutput(this, 'db_endpoint', {
        value: primaryDb.endpoint,
      });
    }

    new Monitoring(this, 'PrimaryMonitoring', {
      provider: this.primary,
      environment: this.environment,
      asgName: primaryCompute.asgName,
      dbIdentifier: primaryDb?.dbIdentifier ?? '',
      scaleUpPolicyArn: primaryCompute.scaleUpPolicyArn,
      scaleDownPolicyArn: primaryCompute.scaleDownPolicyArn,
      albTargetGroupName: primaryCompute.albTargetGroupName,
    });

    if (secondaryCompute && secondaryDb) {
      new Monitoring(this, 'SecondaryMonitoring', {
        provider: this.secondary,
        environment: this.environment,
        asgName: secondaryCompute.asgName,
        dbIdentifier: secondaryDb?.dbIdentifier ?? '',
        scaleUpPolicyArn: secondaryCompute.scaleUpPolicyArn,
        scaleDownPolicyArn: secondaryCompute.scaleDownPolicyArn,
        albTargetGroupName: secondaryCompute.albTargetGroupName,
      });
    }

    // DNS Configuration
    const hostedZoneId = props.hostedZoneId || process.env.HOSTED_ZONE_ID || '';
    const recordName =
      props.recordName || process.env.RECORD_NAME || 'app.example.com';

    if (enableSecondary && secondaryCompute && hostedZoneId && recordName) {
      new Dns(this, 'Dns', {
        hostedZoneId,
        recordName,
        primaryAlbDns: primaryCompute.albDns, // Changed from albDnsName to albDns
        primaryAlbZoneId: primaryCompute.albZoneId, // Changed from albZoneId to albZoneId
        secondaryAlbDns: secondaryCompute.albDns, // Changed from albDnsName to albDns
        secondaryAlbZoneId: secondaryCompute.albZoneId, // Changed from albZoneId to albZoneId
        healthCheckPath: '/',
        primaryProvider: this.primary,
        secondaryProvider: this.secondary,
        environment: this.environment,
      });
    }
  }
}
