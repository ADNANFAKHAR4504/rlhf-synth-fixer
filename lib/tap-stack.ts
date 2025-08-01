import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ServerlessCms } from './serverless-cms-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = ['us-east-1', 'us-west-2', 'eu-central-1'];

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Configure AWS Provider for each region with an alias
    // this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    AWS_REGION_OVERRIDE.forEach(region => {
      const alias = `region_${region.replace(/-/g, '_')}`; // Prefix with 'region_' and replace dashes
      const awsProvider = new AwsProvider(this, `aws_${alias}`, {
        region: region,
        defaultTags: defaultTags,
        alias: alias,
      });
      const archiveProvider = new ArchiveProvider(this, `archive_${alias}`, {
        alias: alias,
      });
      new ServerlessCms(this, `serverless-cms-${region}`, {
        providerAws: awsProvider,
        providerArchive: archiveProvider,
        environment: environmentSuffix,
      });
    });
  }
}
