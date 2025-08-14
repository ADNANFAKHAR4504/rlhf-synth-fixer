import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import modular constructs
import { IAM } from './iam';
import { Logging } from './logging';
import { Networking } from './networking';
import { Security } from './security';
import { Storage } from './storage';

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
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with workspace and region isolation
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${awsRegion}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Resource tags object
    const tags = {
      Environment: environmentSuffix,
      Region: awsRegion,
      ...props?.defaultTags?.tags,
    };

    // Networking
    const networking = new Networking(this, 'Networking', {
      environment: environmentSuffix,
      region: awsRegion,
      tags,
    });

    // Security
    new Security(this, 'Security', {
      vpcId: networking.vpc.id,
      environment: environmentSuffix,
      region: awsRegion,
      allowedCidr: '203.0.113.0/24', // Example known IP range, replace as needed
      tags,
    });

    // IAM
    new IAM(this, 'IAM', {
      environment: environmentSuffix,
      region: awsRegion,
      tags,
    });

    // Logging
    new Logging(this, 'Logging', {
      environment: environmentSuffix,
      region: awsRegion,
      tags,
    });

    // Storage
    new Storage(this, 'Storage', {
      environment: environmentSuffix,
      region: awsRegion,
      tags,
    });
  }
}
