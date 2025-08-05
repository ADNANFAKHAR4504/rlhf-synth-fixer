import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { VpcConstruct } from './constructs/vpc-construct';
import { SecurityConstruct } from './constructs/security-construct';
import { environments } from './config/environments';
import { NamingConvention } from './utils/naming';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  public vpc: VpcConstruct;
  public security: SecurityConstruct;
  public naming: NamingConvention;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Get environment configuration with fallback to dev for unknown environments
    const validEnvironments = ['dev', 'staging', 'prod'];
    const actualEnvironment = validEnvironments.includes(environmentSuffix) ? environmentSuffix : 'dev';
    
    if (!environments[actualEnvironment]) {
      throw new Error(
        `Environment '${actualEnvironment}' not found in configuration`
      );
    }
    const config = environments[actualEnvironment];
    this.naming = new NamingConvention(environmentSuffix);

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            ...config.tags,
            ...(defaultTags.length > 0 ? defaultTags[0].tags : {}),
          },
        },
      ],
    });

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

    // VPC Infrastructure
    this.vpc = new VpcConstruct(this, 'vpc', {
      config: config.network,
      naming: this.naming,
    });

    // Security Infrastructure
    this.security = new SecurityConstruct(this, 'security', {
      vpcId: this.vpc.vpc.id,
      environment: environmentSuffix,
      naming: this.naming,
    });
  }
}
